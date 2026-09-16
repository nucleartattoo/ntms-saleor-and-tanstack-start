import type { ResultOf } from "gql.tada";
import { LockKeyhole, ReceiptText } from "lucide-react";
import { readFragment } from "@/gql/graphql";
import { formatCurrency } from "@/lib/utils";
import type activeOrderFragment from "@/lib/vendure/fragments/active-order";
import { orderDiscountFragment } from "@/lib/vendure/fragments/active-order";

interface CartTotalsProps {
  order?: ResultOf<typeof activeOrderFragment> | null;
  readonly?: boolean;
}

export function CartTotals({ order, readonly = false }: CartTotalsProps) {
  if (!order) {
    return null;
  }

  const currencyCode = order.currencyCode || "USD";

  return (
    <section className="mt-5 border-t border-black/5 pt-4">
      <div className="mb-4 flex items-center gap-2 border-b border-black/5 pb-3">
        <ReceiptText className="h-4 w-4 text-[#0071e3]" />
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0071e3]">
          Total
        </h2>
      </div>
      <dl className="space-y-3 text-sm text-foreground/62">
        {order.discounts &&
          order.discounts.length > 0 &&
          order.discounts.map((discount) => {
            const discountData = readFragment(orderDiscountFragment, discount);
            return (
              <div
                key={discountData.description}
                className="flex items-center justify-between gap-4"
              >
                <dt>
                  Coupon{" "}
                  <span className="font-medium text-[#0071e3]">
                    {discountData.description}
                  </span>
                </dt>
                <dd className="font-medium text-[#0071e3]">
                  {formatCurrency(discountData.amountWithTax, currencyCode)}
                </dd>
              </div>
            );
          })}

        <div className="flex items-center justify-between gap-4">
          <dt>Subtotal</dt>
          <dd className="font-medium text-foreground">
            {formatCurrency(order.subTotalWithTax, currencyCode)}
          </dd>
        </div>

        <div className="flex items-center justify-between gap-4">
          <dt>Shipping</dt>
          <dd className="font-medium text-foreground">
            {formatCurrency(order.shippingWithTax || 0, currencyCode)}
          </dd>
        </div>

        <div className="flex items-center justify-between gap-4">
          <dt>Estimated tax</dt>
          <dd className="font-medium text-foreground">
            {formatCurrency(order.totalWithTax - order.total, currencyCode)}
          </dd>
        </div>

        {order.couponCodes && order.couponCodes.length > 0 && !readonly && (
          <div className="flex flex-wrap items-center gap-2">
            <dt className="font-medium text-foreground">Applied coupons</dt>
            {order.couponCodes.map((code) => (
              <dd
                key={code}
                className="inline-flex items-center rounded-full border border-black/5 bg-black/5 px-2.5 py-1 text-xs font-medium text-[#0071e3]"
              >
                {code}
              </dd>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-4 border-t border-black/5 pt-4">
          <dt className="font-medium text-foreground">Order total</dt>
          <dd className="text-xl font-semibold text-[#0071e3]">
            {formatCurrency(order.totalWithTax, currencyCode)}
          </dd>
        </div>
      </dl>
      <p className="mt-4 flex items-center gap-2 border-t border-black/5 pt-3 text-xs text-foreground/45">
        <LockKeyhole className="h-3.5 w-3.5 text-[#0071e3]" />
        Secure checkout total from the live NTMS order.
      </p>
    </section>
  );
}
