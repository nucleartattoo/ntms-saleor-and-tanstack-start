import { useMatchRoute } from "@tanstack/react-router";
import { Circle, CircleCheck, CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCheckoutSteps } from "@/lib/vendure/checkout-flow";

export function CheckoutSteps() {
  const matchRoute = useMatchRoute();
  const stepMatch = matchRoute({ to: "/checkout/$step" });
  const confirmationMatch = matchRoute({ to: "/checkout/confirmation/$code" });

  // If on confirmation page, show all steps as done
  // Otherwise, use the current step from params
  const currentStep = confirmationMatch
    ? "confirmation"
    : stepMatch
      ? stepMatch.step
      : undefined;
  const steps = getCheckoutSteps(currentStep);

  return (
    <nav
      aria-label="Checkout progress"
      className="relative min-w-0 overflow-hidden rounded-[2rem] border border-black/5 bg-white p-3 sm:p-4 shadow-[0_4px_24px_rgba(0,0,0,0.03)]"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[color:var(--apple-blue)]/75 to-transparent" />
      <ol className="grid max-w-full grid-cols-2 gap-2 sm:grid-cols-4">
        {steps.map((step, index) => {
          const isConfirmation = !!confirmationMatch;
          const isDone = isConfirmation || step.done;
          const isActive = step.active && !isConfirmation;

          return (
            <li
              key={`step-${step.identifier}`}
              className={cn({
                "z-10 flex min-w-0 items-center gap-3 rounded-xl border px-3 py-3 transition": true,
                "border-black/5 bg-[#f5f5f7] text-[#86868b]":
                  !isDone && !isActive,
                "border-[#0071e3]/20 bg-[#0071e3]/[0.06] text-[#0071e3]":
                  isDone,
                "border-[#0071e3] bg-[#0071e3]/10 text-[#1d1d1f] shadow-sm ring-2 ring-[#0071e3]/20":
                  isActive,
              })}
              aria-current={isActive ? "step" : undefined}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-black/5 bg-white shadow-xs">
                {isDone && <CircleCheck className="h-4 w-4" />}
                {isActive && <CircleDot className="h-4 w-4" />}
                {!isActive && !isDone && <Circle className="h-4 w-4" />}
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/42">
                  Step {index + 1}
                </span>
                <span className="block truncate text-sm font-semibold">
                  {step.title}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
