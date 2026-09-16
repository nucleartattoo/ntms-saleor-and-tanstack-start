import { Image } from "@unpic/react";
import clsx from "clsx";
import { useState } from "react";
import Label from "@/components/custom/label";
import { SkeletonItem } from "@/components/custom/skeletons/base";

export function GridTileImage({
  isInteractive = true,
  active,
  label,
  frame = true,
  skeleton = false,
  priority = false,
  className,
  onError,
  ...props
}: {
  isInteractive?: boolean;
  active?: boolean;
  frame?: boolean;
  skeleton?: boolean;
  priority?: boolean;
  label?: {
    title: string;
    amount: string;
    currencyCode: string;
    position?: "bottom" | "center";
  };
} & React.ComponentProps<typeof Image>) {
  const [failed, setFailed] = useState(false);

  if (skeleton) {
    return <SkeletonItem className="aspect-square h-full w-full rounded-lg" />;
  }

  return (
    <div
      className={clsx(
        "group flex h-full w-full items-center justify-center overflow-hidden bg-card/92 transition duration-300 dark:bg-black/78",
        frame
          ? "rounded-xl border border-black/10/10 shadow-[0_12px_32px_rgba(0,0,0,.08)] hover:border-black/10/22 hover:shadow-[0_18px_40px_rgba(0,0,0,.14)]"
          : "",
        {
          relative: label,
          "border-[#0071e3] shadow-[0_0_0_1px_rgba(0,113,227,0.2),0_16px_36px_rgba(0,0,0,.12)]":
            frame && active,
          "border-black/10/12 dark:border-black/10/25": frame && !active,
          "ring-1 ring-[color:var(--apple-blue)]/42": !frame && active,
        },
      )}
    >
      {props.src && !failed ? (
        <Image
          className={clsx(
            "relative h-full w-full object-cover",
            {
              "transition duration-300 ease-in-out group-hover:scale-105":
                isInteractive,
            },
            className,
          )}
          fetchPriority={priority ? "high" : "auto"}
          loading={priority ? "eager" : "lazy"}
          {...props}
          onError={(event) => {
            onError?.(event);
            setFailed(true);
          }}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center p-4 text-center text-xs font-bold uppercase tracking-[0.18em] text-foreground/35">
          {typeof props.alt === "string" && props.alt.trim()
            ? props.alt.trim().slice(0, 28)
            : "Nuclear Tattoo Supply"}
        </div>
      )}
      {label ? (
        <Label
          title={label.title}
          amount={label.amount}
          currencyCode={label.currencyCode}
          position={label.position}
        />
      ) : null}
    </div>
  );
}
