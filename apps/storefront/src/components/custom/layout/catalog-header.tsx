import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CatalogHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function CatalogHeader({
  eyebrow,
  title,
  description,
  meta,
  actions,
  className,
}: CatalogHeaderProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-black/10/14 bg-card/92 shadow-[0_22px_70px_rgba(0,0,0,.1)] backdrop-blur-xl",
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[color:var(--apple-blue)]/75 to-transparent" />
      <div className="absolute inset-y-0 left-0 w-1 bg-[#0071e3]/70" />
      <div className="px-4 py-5 sm:px-6 sm:py-6 lg:px-7">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0071e3]">
          {eyebrow}
        </p>
        <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-[2.65rem]">
              {title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-foreground/60 sm:text-base sm:leading-7">
              {description}
            </p>
          </div>
          {meta ? (
            <div className="flex flex-wrap gap-2 lg:max-w-sm lg:justify-end">
              {meta}
            </div>
          ) : null}
        </div>
        {actions ? (
          <div className="mt-5 flex flex-wrap gap-3">{actions}</div>
        ) : null}
      </div>
    </section>
  );
}
