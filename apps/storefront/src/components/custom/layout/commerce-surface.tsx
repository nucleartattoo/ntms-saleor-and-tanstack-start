import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CommercePageHeroProps {
  eyebrow?: string;
  title: string;
  description: ReactNode;
  icon?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function CommercePageHero({
  eyebrow,
  title,
  description,
  icon,
  meta,
  actions,
  className,
}: CommercePageHeroProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-[color:var(--cyber-gold)]/14 bg-card/92 shadow-[0_22px_70px_rgba(0,0,0,.1)] backdrop-blur-xl",
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[color:var(--cyber-gold)]/75 to-transparent" />
      <div className="absolute inset-y-0 left-0 w-1 bg-[color:var(--cyber-gold)]/70" />
      <div className="relative flex flex-col gap-5 p-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 max-w-3xl">
          <div className="flex items-center gap-3">
            {icon ? (
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[color:var(--cyber-gold)]/18 bg-background/72 text-[color:var(--cyber-gold-soft)] shadow-[inset_0_1px_0_rgba(255,255,255,.05)]">
                {icon}
              </span>
            ) : null}
            <div className="min-w-0">
              {eyebrow ? (
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--cyber-gold-soft)]">
                  {eyebrow}
                </p>
              ) : null}
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {title}
              </h1>
            </div>
          </div>
          <div className="mt-4 max-w-2xl text-sm leading-6 text-foreground/62">
            {description}
          </div>
        </div>

        {(meta || actions) && (
          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            {meta}
            {actions}
          </div>
        )}
      </div>
    </section>
  );
}

interface CommercePanelProps extends HTMLAttributes<HTMLElement> {
  as?: "section" | "article" | "aside" | "div";
  padded?: boolean;
}

export function CommercePanel({
  as = "section",
  padded = true,
  className,
  ...props
}: CommercePanelProps) {
  const Component = as;

  return (
    <Component
      className={cn(
        "rounded-2xl border border-[color:var(--cyber-gold)]/12 bg-card/90 shadow-[0_18px_54px_rgba(0,0,0,.09)] backdrop-blur-xl",
        padded && "p-6",
        className,
      )}
      {...props}
    />
  );
}

interface CommerceSignalProps {
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function CommerceSignal({
  children,
  icon,
  className,
}: CommerceSignalProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-[color:var(--cyber-gold)]/14 bg-background/62 px-3 py-1 text-xs font-medium text-foreground/58",
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
