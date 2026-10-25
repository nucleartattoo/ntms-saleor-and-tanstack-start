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
      className="min-h-screen bg-[#fbfbfd] text-[#1d1d1f]"
    >
      <span aria-live="polite" className="sr-only" role="status">
        {label}
      </span>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="border-b border-black/[0.05] pb-6">
          <SkeletonItem className="h-3 w-28 rounded-full bg-[#f5f5f7]" />
          <SkeletonItem className="mt-4 h-12 w-full max-w-md rounded-2xl bg-[#f5f5f7]" />
          <SkeletonItem className="mt-4 h-4 w-full max-w-xl rounded-full bg-[#f5f5f7]" />
        </div>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {createSkeletonArray(8, "saleor-product").map((key) => (
            <div
              aria-hidden="true"
              className="flex min-w-0 flex-col justify-between overflow-hidden rounded-3xl border border-black/[0.05] bg-white p-6 shadow-[0_2px_14px_rgba(0,0,0,0.03)]"
              key={key}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <SkeletonItem className="h-3 w-20 rounded-full bg-[#f5f5f7]" />
                  <SkeletonItem className="h-4 w-14 rounded-full bg-[#f5f5f7]" />
                </div>
                <SkeletonItem className="h-5 w-4/5 rounded-lg bg-[#f5f5f7]" />
              </div>
              <SkeletonItem className="my-4 h-[200px] w-full rounded-2xl bg-[#f5f5f7]" />
              <div className="flex items-center justify-between pt-2">
                <SkeletonItem className="h-4 w-28 rounded-full bg-[#f5f5f7]" />
                <SkeletonItem className="h-8 w-20 rounded-full bg-[#f5f5f7]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
