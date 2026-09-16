import {
  createSkeletonArray,
  SkeletonItem,
} from "@/components/custom/skeletons/base";

export function NtmsSaleorCatalogPending({
  label = "Loading catalog",
}: {
  label?: string;
}) {
  return (
    <main
      aria-busy="true"
      aria-label={label}
      className="min-h-screen bg-background text-foreground"
    >
      <span aria-live="polite" className="sr-only" role="status">
        {label}
      </span>
      <div className="mx-auto max-w-screen-2xl px-4 py-8">
        <div className="border-b border-[color:var(--cyber-gold)]/14 pb-6">
          <SkeletonItem className="h-3 w-28" />
          <SkeletonItem className="mt-4 h-10 w-full max-w-md" />
          <SkeletonItem className="mt-4 h-4 w-full max-w-xl" />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 2xl:grid-cols-4">
          {createSkeletonArray(8, "saleor-product").map((key) => (
            <div
              aria-hidden="true"
              className="min-w-0 overflow-hidden rounded-md border border-[color:var(--cyber-gold)]/14 bg-card"
              key={key}
            >
              <SkeletonItem className="aspect-square w-full rounded-none" />
              <div className="space-y-3 p-3 sm:p-4">
                <SkeletonItem className="h-3 w-2/5" />
                <SkeletonItem className="h-4 w-full" />
                <SkeletonItem className="h-4 w-4/5" />
                <SkeletonItem className="h-9 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
