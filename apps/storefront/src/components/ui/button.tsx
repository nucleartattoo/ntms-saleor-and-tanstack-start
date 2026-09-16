import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-40 outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]/50 focus-visible:ring-offset-2 shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-[#0071e3] text-white hover:bg-[#0077ed] active:scale-[0.98] shadow-[0_2px_8px_rgba(0,113,227,0.25)] rounded-full",
        secondary:
          "bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed] active:scale-[0.98] rounded-full",
        destructive:
          "bg-[#ff3b30] text-white hover:bg-[#ff453a] active:scale-[0.98] shadow-[0_2px_8px_rgba(255,59,48,0.25)] rounded-full",
        outline:
          "border border-[#d2d2d7] bg-white text-[#1d1d1f] hover:border-[#86868b] hover:bg-[#f5f5f7] active:scale-[0.98] rounded-full",
        ghost:
          "text-[#1d1d1f] hover:bg-[#f5f5f7] hover:text-[#0071e3] rounded-xl",
        link: "text-[#0071e3] underline-offset-4 hover:underline p-0 h-auto",
        glass:
          "bg-white/80 backdrop-blur-md border border-black/5 text-[#1d1d1f] shadow-sm hover:bg-white active:scale-[0.98] rounded-full",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-9 px-4 text-xs",
        lg: "h-13 px-8 text-base font-semibold",
        icon: "h-10 w-10 p-0 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
