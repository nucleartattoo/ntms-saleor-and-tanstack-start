import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { StatusPanel } from "@/components/custom/layout/status-panel";
import { refreshStorefrontState } from "@/hooks/use-active-order";
import { submitPayPalPayment } from "@/lib/vendure";

declare global {
  interface Window {
    paypal?: {
      Buttons: (options: {
        createOrder: () => Promise<string>;
        onApprove: (data: { orderID?: string }) => Promise<void>;
        onCancel: () => void;
        onError: (error: unknown) => void;
        style?: {
          color?: string;
          height?: number;
          layout?: string;
          shape?: string;
          tagline?: boolean;
        };
      }) => {
        close?: () => Promise<void>;
        render: (container: HTMLElement) => Promise<void>;
      };
    };
  }
}

let activeSdkSrc: string | undefined;
let activeSdkPromise: Promise<void> | undefined;

function loadPayPalSdk({
  clientId,
  currencyCode,
}: {
  clientId: string;
  currencyCode: string;
}) {
  const sdkSrc = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
    clientId,
  )}&components=buttons&currency=${encodeURIComponent(currencyCode)}&intent=capture`;

  if (window.paypal && activeSdkSrc === sdkSrc && activeSdkPromise) {
    return activeSdkPromise;
  }

  if (activeSdkSrc !== sdkSrc) {
    document
      .querySelectorAll('script[data-paypal-sdk="true"]')
      .forEach((element) => {
        element.remove();
      });
    activeSdkPromise = undefined;
  }

  activeSdkSrc = sdkSrc;
  activeSdkPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.async = true;
    script.dataset.paypalSdk = "true";
    script.onerror = () =>
      reject(new Error("Failed to load the PayPal JavaScript SDK."));
    script.onload = () => resolve();
    script.src = sdkSrc;
    document.head.appendChild(script);
  });

  return activeSdkPromise;
}

export function PayPalButtons({
  clientId,
  currencyCode,
  paymentMethodCode,
}: {
  clientId: string;
  currencyCode: string;
  paymentMethodCode: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);
  const paypalButtonsRef = useRef<{ close?: () => Promise<void> } | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;

    async function teardown() {
      if (paypalButtonsRef.current?.close) {
        try {
          await paypalButtonsRef.current.close();
        } catch (error) {
          console.error(error);
        }
      }

      paypalButtonsRef.current = null;

      if (container) {
        container.innerHTML = "";
      }
    }

    async function initialize() {
      setLoading(true);
      setPaymentError(null);
      await teardown();

      try {
        await loadPayPalSdk({ clientId, currencyCode });

        if (cancelled || !window.paypal || !container) {
          return;
        }

        const buttons = window.paypal.Buttons({
          style: {
            color: "gold",
            height: 46,
            layout: "vertical",
            shape: "rect",
            tagline: false,
          },
          createOrder: async () => {
            const result = await submitPayPalPayment({
              data: { action: "create-order", paymentMethodCode },
            });

            if (result.type !== "paypal-order") {
              throw new Error(
                result.type === "error"
                  ? result.message
                  : "Unable to create a PayPal order.",
              );
            }

            return result.orderId;
          },
          onApprove: async ({ orderID }) => {
            if (!orderID) {
              throw new Error("PayPal approval did not include an order ID.");
            }

            const result = await submitPayPalPayment({
              data: {
                action: "approve-order",
                paymentMethodCode,
                paypalOrderId: orderID,
              },
            });

            if (result.type === "confirmation") {
              await router.navigate({
                to: "/checkout/confirmation/$code",
                params: { code: result.orderCode },
              });
              await refreshStorefrontState({
                queryClient,
                router,
                invalidateRouter: false,
              });
              return;
            }

            setPaymentError(
              result.type === "error"
                ? result.message
                : "PayPal payment failed.",
            );
          },
          onCancel: () => {
            setPaymentError(null);
          },
          onError: (error) => {
            console.error(error);
            setPaymentError(
              error instanceof Error && error.message
                ? error.message
                : "PayPal Checkout is currently unavailable.",
            );
          },
        });

        paypalButtonsRef.current = buttons;
        await buttons.render(container);

        if (!cancelled) {
          setLoading(false);
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setPaymentError(
            error instanceof Error && error.message
              ? error.message
              : "Unable to initialize PayPal Checkout.",
          );
          setLoading(false);
        }
      }
    }

    void initialize();

    return () => {
      cancelled = true;
      void teardown();
    };
  }, [clientId, currencyCode, paymentMethodCode, queryClient, router]);

  return (
    <div className="space-y-4" data-testid="paypal-payment-buttons">
      {loading ? (
        <StatusPanel
          title="Loading PayPal Checkout"
          description="We are preparing the PayPal button flow for this order."
          testId="paypal-payment-loading"
        />
      ) : null}
      <div ref={containerRef} />
      {paymentError ? (
        <StatusPanel
          variant="destructive"
          title="PayPal payment error"
          description={paymentError}
          testId="paypal-payment-error"
        />
      ) : null}
    </div>
  );
}
