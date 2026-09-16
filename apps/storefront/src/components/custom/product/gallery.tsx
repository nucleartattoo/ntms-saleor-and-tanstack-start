import { Image } from "@unpic/react";
import { ArrowLeftIcon, ArrowRightIcon, ImageIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { GridTileImage } from "@/components/custom/grid/tile";

export function Gallery({
  images,
}: {
  images: { src: string; altText: string }[];
}) {
  const [imageIndex, setImageIndex] = useState(0);

  // moved empty images guard below hooks to satisfy React hooks rules

  // Keep index in range if images prop changes
  useEffect(() => {
    if (imageIndex >= images.length) {
      setImageIndex(0);
    }
  }, [imageIndex, images.length]);

  if (images.length === 0) return null;

  const nextImageIndex = imageIndex + 1 < images.length ? imageIndex + 1 : 0;
  const previousImageIndex =
    imageIndex === 0 ? images.length - 1 : imageIndex - 1;

  const buttonClassName =
    "flex h-full items-center justify-center px-5 transition-all ease-in-out hover:scale-110 hover:text-[#0071e3] disabled:pointer-events-none disabled:opacity-40";
  const activeImage = images[imageIndex];

  return (
    <div className="min-w-0 space-y-4">
      <div className="relative aspect-[1.02] h-full max-h-[700px] w-full overflow-hidden rounded-2xl border border-black/10/14 bg-card/78 shadow-[0_28px_82px_rgba(0,0,0,.14)] backdrop-blur-xl sm:aspect-square">
        <div className="absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-[color:var(--apple-blue)]/75 to-transparent" />
        <div className="absolute left-3 top-3 z-10 flex items-center gap-2 rounded-full border border-black/10/14 bg-card/86 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0071e3] backdrop-blur-xl sm:left-4 sm:top-4">
          <ImageIcon className="h-3.5 w-3.5" />
          Product view
        </div>
        <div className="absolute right-3 top-3 z-10 rounded-full border border-black/10/14 bg-card/86 px-3 py-1.5 text-[11px] font-semibold text-foreground/62 backdrop-blur-xl sm:right-4 sm:top-4">
          {imageIndex + 1} / {images.length}
        </div>
        {activeImage && (
          <Image
            className="h-full w-full object-contain p-0 pt-14 sm:p-9 sm:pt-16"
            layout="fullWidth"
            sizes="(min-width: 1024px) 66vw, 100vw"
            alt={activeImage.altText || "Product image"}
            src={activeImage.src}
          />
        )}

        {images.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex w-full justify-center px-4">
            <div className="mx-auto flex h-11 items-center rounded-full border border-black/10/14 bg-card/82 text-foreground/70 shadow-[0_12px_28px_rgba(0,0,0,.16)] backdrop-blur-xl">
              <button
                type="button"
                onClick={() => setImageIndex(previousImageIndex)}
                aria-label="Previous product image"
                className={buttonClassName}
                disabled={images.length < 2}
              >
                <ArrowLeftIcon className="h-5" />
              </button>
              <div className="mx-1 h-6 w-px bg-[#0071e3]/20" />
              <button
                type="button"
                onClick={() => setImageIndex(nextImageIndex)}
                aria-label="Next product image"
                className={buttonClassName}
                disabled={images.length < 2}
              >
                <ArrowRightIcon className="h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {images.length > 1 && (
        <ul
          aria-label="Product image thumbnails"
          className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-5 xl:grid-cols-6"
        >
          {images.map((image, index) => {
            const isActive = index === imageIndex;

            return (
              <li key={image.src} className="min-w-0">
                <button
                  type="button"
                  onClick={() => setImageIndex(index)}
                  aria-label={`Select product image ${index + 1}`}
                  className="relative aspect-square w-full rounded-xl transition hover:-translate-y-0.5"
                >
                  <GridTileImage
                    alt={image.altText}
                    src={image.src}
                    width={110}
                    height={110}
                    active={isActive}
                    className="object-contain p-2"
                  />
                  <span className="absolute bottom-1.5 right-1.5 rounded-full border border-black/10/14 bg-card/82 px-1.5 py-0.5 text-[10px] font-semibold text-foreground/55">
                    {index + 1}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
