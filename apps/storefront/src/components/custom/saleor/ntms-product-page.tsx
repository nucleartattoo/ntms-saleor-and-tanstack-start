import { Link } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  Expand,
  Minus,
  PackageCheck,
  Plus,
  Search,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  NtmsSaleorProductMedia,
  NtmsSaleorProductPage,
  NtmsSaleorProductVariant,
} from "@/lib/saleor/catalog";
import { cn } from "@/lib/utils";
import { NtmsSaleorAddToCartButton } from "./ntms-add-to-cart-button";
import { SaleorProductCard } from "./ntms-catalog-page";
import {
  getPreferredSaleorVariant,
  getSaleorVariantAttributeGroups,
  isSaleorColorAttribute,
  NtmsSaleorVariantSelector,
} from "./ntms-variant-selector";

export const saleorVariantSearchThreshold = 8;

export function shouldSearchSaleorProductVariants(variantCount: number) {
  return variantCount > saleorVariantSearchThreshold;
}

export function filterSaleorProductVariants<
  T extends Pick<NtmsSaleorProductVariant, "name" | "sku">,
>(variants: T[], query: string): T[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return variants;
  }

  return variants.filter((variant) =>
    `${variant.name} ${variant.sku}`.toLowerCase().includes(normalizedQuery),
  );
}

export function parseRichDescriptionToHtml(
  description: string | undefined | null,
): string {
  if (!description) return "";

  // 1. Try parsing EditorJS JSON format
  try {
    const parsed = JSON.parse(description);
    if (parsed && Array.isArray(parsed.blocks)) {
      return parsed.blocks
        .map(
          (block: {
            type?: string;
            data?: {
              text?: string;
              level?: number;
              style?: string;
              items?: (string | { content?: string })[];
              content?: string[][];
            };
          }) => {
            if (block.type === "header") {
              const text = block.data?.text || "";
              return `<h3>${text}</h3>`;
            }
            if (block.type === "list") {
              const isOrdered = block.data?.style === "ordered";
              const items = (block.data?.items || [])
                .map((item) => {
                  const itemText =
                    typeof item === "string" ? item : item?.content || "";
                  if (isOrdered) {
                    return `<li>${itemText}</li>`;
                  }
                  return `<li><span class="h-1.5 w-1.5 rounded-full bg-[#0071e3] mt-2.5 shrink-0 inline-block"></span><span>${itemText}</span></li>`;
                })
                .join("");
              return isOrdered ? `<ol>${items}</ol>` : `<ul>${items}</ul>`;
            }
            if (block.type === "paragraph") {
              return `<p>${block.data?.text || ""}</p>`;
            }
            if (block.type === "table" && Array.isArray(block.data?.content)) {
              const rows = block.data.content
                .map(
                  (row) =>
                    `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`,
                )
                .join("");
              return `<div class="overflow-x-auto my-4 rounded-xl border border-black/[0.06] bg-[#fbfbfd] p-3"><table>${rows}</table></div>`;
            }
            return block.data?.text ? `<p>${block.data.text}</p>` : "";
          },
        )
        .filter(Boolean)
        .join("\n");
    }
  } catch {}

  // 2. If it is already HTML, format and return
  if (
    description.includes("<p>") ||
    description.includes("<div>") ||
    description.includes("<li>") ||
    description.includes("<br>")
  ) {
    return description;
  }

  // 3. Intelligent AI-like Structured Content Breakdown
  // Automatically detects embedded ALL-CAPS titles, run-on bullet points, key-value specs, and long blocks
  const rawText = description.replace(
    /(?<=[.!?])\s*(Features|Specifications|Highlights|Includes):\s*/gi,
    "\n### $1:\n- ",
  );

  const capsHeaderRegex =
    /\b([A-Z0-9\s\-_–—:]{12,}[A-Z0-9])(?=\s+[A-Z][a-z]|\s*$)/;
  const lines = rawText.split("\n");
  const processedLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const match = capsHeaderRegex.exec(trimmed);
    if (match && match.index > 15) {
      const before = trimmed.slice(0, match.index).trim();
      const header = match[1].trim();
      const after = trimmed.slice(match.index + match[0].length).trim();
      if (before) processedLines.push(before);
      processedLines.push(`### ${header}`);
      if (after) processedLines.push(after);
    } else {
      processedLines.push(trimmed);
    }
  }

  const formattedSections: string[] = [];
  let currentList: string[] = [];

  const flushList = () => {
    if (currentList.length > 0) {
      const listHtml = currentList
        .map(
          (item) =>
            `<li><span class="h-1.5 w-1.5 rounded-full bg-[#0071e3] mt-2.5 shrink-0 inline-block"></span><span>${item}</span></li>`,
        )
        .join("");
      formattedSections.push(`<ul>${listHtml}</ul>`);
      currentList = [];
    }
  };

  for (const item of processedLines) {
    if (item.startsWith("### ")) {
      flushList();
      const headerText = item.slice(4).trim();
      formattedSections.push(`<h3>${headerText}</h3>`);
      continue;
    }

    const isHeaderColon =
      /^([A-Z][\w\s&/–—-]+:)$/.test(item) ||
      (item.length < 40 && item.endsWith(":"));
    if (isHeaderColon) {
      flushList();
      formattedSections.push(`<h3>${item}</h3>`);
      continue;
    }

    const bulletMatch = item.match(/^[-*•]\s+(.*)$/);
    if (bulletMatch) {
      const sub = bulletMatch[1];
      if (sub.includes(",") && sub.split(",").length >= 3) {
        for (const s of sub.split(",")) {
          if (s.trim()) currentList.push(s.trim());
        }
      } else {
        currentList.push(sub);
      }
      continue;
    }

    const kvMatch = item.match(/^([A-Za-z\s]+):\s+(.+)$/);
    if (kvMatch && item.length < 60) {
      currentList.push(`<strong>${kvMatch[1]}:</strong> ${kvMatch[2]}`);
      continue;
    }

    // Run-on feature phrase segmentation
    const runonDelimiters =
      /(?<=[a-z0-9,])\s+(?=(?:Hold|Extremely|Allow|Evenly|Less|Save|Cheyenne-typical|Colored|Patented|Features|Compatible|Engineered|Certified|Includes|Designed|The tightness)\b)/;
    const runonParts = item
      .split(runonDelimiters)
      .map((p) => p.trim())
      .filter(Boolean);

    if (runonParts.length >= 3) {
      flushList();
      for (const part of runonParts) {
        if (part.split(".").length - 1 >= 2 && part.length > 120) {
          flushList();
          formattedSections.push(`<p>${part}</p>`);
        } else {
          currentList.push(part);
        }
      }
      continue;
    }

    flushList();
    if (item.length > 400) {
      const sentences = item.split(/(?<=\.)\s+(?=[A-Z])/);
      const mid = Math.ceil(sentences.length / 2);
      const p1 = sentences.slice(0, mid).join(" ");
      const p2 = sentences.slice(mid).join(" ");
      if (p1) formattedSections.push(`<p>${p1}</p>`);
      if (p2) formattedSections.push(`<p>${p2}</p>`);
    } else {
      formattedSections.push(`<p>${item}</p>`);
    }
  }

  flushList();
  return formattedSections.join("\n");
}

export function getSaleorVariantBySku(
  variants: NtmsSaleorProductVariant[],
  sku: string | undefined,
) {
  const normalizedSku = sku?.trim().toLowerCase();
  if (!normalizedSku) return undefined;
  return variants.find(
    (variant) => variant.sku.trim().toLowerCase() === normalizedSku,
  );
}

export function findSaleorVariantImageUrl(
  variant: NtmsSaleorProductVariant | undefined,
  gallery: NtmsSaleorProductMedia[],
  defaultUrl: string,
): string {
  if (!variant) return defaultUrl;

  if (variant.media && variant.media.length > 0 && variant.media[0]?.url) {
    return variant.media[0].url;
  }

  if (!gallery || gallery.length === 0) return defaultUrl;

  const colorAttr = variant.attributes?.find((attr) =>
    isSaleorColorAttribute(attr),
  );
  const colorValues = colorAttr
    ? colorAttr.values.map((v) => v.name.trim().toLowerCase())
    : [];

  if (colorValues.length > 0) {
    for (const color of colorValues) {
      if (!color) continue;
      const matched = gallery.find((media) => {
        const alt = (media.alt || "").toLowerCase();
        const url = (media.url || "").toLowerCase();
        return alt.includes(color) || url.includes(color);
      });
      if (matched) return matched.url;
    }
  }

  const attributeValueNames = (variant.attributes || []).flatMap((attr) =>
    attr.values.map((v) => v.name.trim().toLowerCase()),
  );
  for (const attrVal of attributeValueNames) {
    if (!attrVal || attrVal.length < 2) continue;
    const matched = gallery.find((media) => {
      const alt = (media.alt || "").toLowerCase();
      const url = (media.url || "").toLowerCase();
      return alt.includes(attrVal) || url.includes(attrVal);
    });
    if (matched) return matched.url;
  }

  if (variant.sku) {
    const skuParts = variant.sku.toLowerCase().split(/[-_/\s]+/);
    for (const part of skuParts) {
      if (part.length < 3) continue;
      const matched = gallery.find((media) => {
        const alt = (media.alt || "").toLowerCase();
        const url = (media.url || "").toLowerCase();
        return alt.includes(part) || url.includes(part);
      });
      if (matched) return matched.url;
    }
  }

  return defaultUrl;
}

export function NtmsSaleorProductPageView({
  initialVariantSku,
  onVariantSkuChange,
  page,
}: {
  initialVariantSku?: string;
  onVariantSkuChange?: (sku: string) => void;
  page: NtmsSaleorProductPage;
}) {
  const { product, relatedProducts } = page;
  const primaryImage = product.media[0]?.url || product.imageUrl;
  const gallery = product.media.length
    ? product.media
    : primaryImage
      ? [{ url: primaryImage, alt: product.imageAlt }]
      : [];
  const defaultMediaUrl = gallery[0]?.url ?? primaryImage;
  const initialVariant =
    getSaleorVariantBySku(product.variants, initialVariantSku) ??
    getPreferredSaleorVariant(product.variants);
  const initialMediaUrl = findSaleorVariantImageUrl(
    initialVariant,
    gallery,
    defaultMediaUrl,
  );
  const [selectedMediaUrl, setSelectedMediaUrl] = useState(initialMediaUrl);
  const [selectedVariantId, setSelectedVariantId] = useState(
    () => initialVariant?.id ?? product.variantId,
  );
  const [quantity, setQuantity] = useState(1);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [showMobileBuyBar, setShowMobileBuyBar] = useState(false);
  const [variantSearchQuery, setVariantSearchQuery] = useState("");
  const primaryPurchaseRef = useRef<HTMLDivElement>(null);
  const selectedVariant =
    product.variants.find((variant) => variant.id === selectedVariantId) ??
    product.variants[0];
  const selectedVariantMedia = selectedVariant?.media ?? [];
  const activeGallery = selectedVariantMedia.length
    ? selectedVariantMedia
    : gallery;
  const selectedMedia =
    activeGallery.find((media) => media.url === selectedMediaUrl) ??
    activeGallery[0];
  const selectedImage = selectedMedia?.url || primaryImage;
  const selectedMediaIndex = Math.max(
    0,
    activeGallery.findIndex((media) => media.url === selectedImage),
  );
  const selectedPrice = selectedVariant?.price ?? product.price;
  const selectedPriorPrice = selectedVariant?.priorPrice ?? product.priorPrice;
  const selectedDiscountPercent = saleorDiscountPercent(
    selectedPrice,
    selectedPriorPrice,
  );
  const selectedSku = selectedVariant?.sku || product.sku || "Pending";
  const selectedQuantity =
    selectedVariant?.quantityAvailable ?? product.quantityAvailable;
  const availableQuantity = getAvailableQuantity(selectedQuantity);
  const maxQuantity = Math.max(1, availableQuantity);
  const isSoldOut = availableQuantity <= 0;
  const hasValidPrice = Boolean(selectedPrice && selectedPrice.amount > 0);
  const canAdd =
    Boolean(selectedVariant?.id || product.variantId) &&
    !isSoldOut &&
    hasValidPrice;
  const variantAttributeGroups = useMemo(
    () => getSaleorVariantAttributeGroups(product.variants),
    [product.variants],
  );
  const hasAttributeSelector = variantAttributeGroups.length > 0;
  const hasVariantSearch =
    shouldSearchSaleorProductVariants(product.variants.length) &&
    !hasAttributeSelector;
  const visibleVariants = useMemo(
    () => filterSaleorProductVariants(product.variants, variantSearchQuery),
    [product.variants, variantSearchQuery],
  );
  const selectedConfiguration = useMemo(() => {
    return variantAttributeGroups.flatMap((group) => {
      const selectedValue = selectedVariant?.attributes
        .find((attribute) => attribute.id === group.id)
        ?.values.at(0)?.name;
      return selectedValue ? [`${group.name}: ${selectedValue}`] : [];
    });
  }, [variantAttributeGroups, selectedVariant]);

  useEffect(() => {
    const requestedVariant = getSaleorVariantBySku(
      product.variants,
      initialVariantSku,
    );
    if (!requestedVariant || requestedVariant.id === selectedVariantId) {
      return;
    }

    const matchedUrl = findSaleorVariantImageUrl(
      requestedVariant,
      gallery,
      defaultMediaUrl,
    );

    setSelectedVariantId(requestedVariant.id);
    setSelectedMediaUrl(matchedUrl);
    setQuantity((currentQuantity) =>
      Math.min(
        currentQuantity,
        Math.max(1, getAvailableQuantity(requestedVariant.quantityAvailable)),
      ),
    );
  }, [
    defaultMediaUrl,
    gallery,
    initialVariantSku,
    product.variants,
    selectedVariantId,
  ]);

  useEffect(() => {
    const updateMobileBuyBar = () => {
      const purchaseSection = primaryPurchaseRef.current;
      setShowMobileBuyBar(
        Boolean(
          purchaseSection && purchaseSection.getBoundingClientRect().bottom < 0,
        ),
      );
    };

    updateMobileBuyBar();
    window.addEventListener("scroll", updateMobileBuyBar, { passive: true });
    window.addEventListener("resize", updateMobileBuyBar);

    return () => {
      window.removeEventListener("scroll", updateMobileBuyBar);
      window.removeEventListener("resize", updateMobileBuyBar);
    };
  }, []);

  const selectVariant = (variantId: string) => {
    const nextVariant = product.variants.find(
      (variant) => variant.id === variantId,
    );
    const nextMaximum = Math.max(
      1,
      getAvailableQuantity(nextVariant?.quantityAvailable),
    );
    const matchedUrl = findSaleorVariantImageUrl(
      nextVariant,
      gallery,
      defaultMediaUrl,
    );

    setSelectedVariantId(variantId);
    setSelectedMediaUrl(matchedUrl);
    setQuantity((currentQuantity) => Math.min(currentQuantity, nextMaximum));
    if (nextVariant?.sku) {
      onVariantSkuChange?.(nextVariant.sku);
    }
  };

  const updateQuantity = (nextQuantity: number) => {
    if (!Number.isFinite(nextQuantity)) return;

    setQuantity(Math.min(Math.max(1, Math.floor(nextQuantity)), maxQuantity));
  };

  const showAdjacentMedia = (direction: -1 | 1) => {
    if (activeGallery.length < 2) return;
    const nextIndex =
      (selectedMediaIndex + direction + activeGallery.length) %
      activeGallery.length;
    setSelectedMediaUrl(activeGallery[nextIndex]?.url ?? selectedMediaUrl);
  };

  return (
    <main className="min-h-screen bg-[#fbfbfd] text-[#1d1d1f] antialiased">
      {/* 1. Breadcrumbs in Apple Light Style */}
      <div className="border-b border-black/[0.04] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <nav
            aria-label="Breadcrumb"
            className="flex min-w-0 items-center gap-2 text-[11px] font-medium tracking-tight text-[#86868b]"
          >
            <Link to="/" className="shrink-0 transition hover:text-[#0071e3]">
              Store
            </Link>
            {product.category ? (
              <>
                <ChevronRight className="h-3 w-3 shrink-0 text-[#86868b]" />
                <Link
                  to="/collections/$collection"
                  params={{ collection: product.category.slug }}
                  className="shrink-0 transition hover:text-[#0071e3]"
                >
                  {product.category.name}
                </Link>
              </>
            ) : null}
            <ChevronRight className="h-3 w-3 shrink-0 text-[#86868b]" />
            <span className="min-w-0 truncate font-semibold text-[#1d1d1f]">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      {/* 2. Apple Studio Stage: Dominant Product Gallery & Purchase Panel */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="grid gap-12 lg:grid-cols-12 lg:items-start">
          {/* Main Stage Gallery (Left 7 Cols) */}
          <div className="lg:col-span-7 lg:sticky lg:top-24">
            <div className="relative flex items-center justify-center min-h-[420px] sm:min-h-[540px] py-4">
              <button
                aria-label="Open image viewer"
                className="group relative flex min-h-[380px] sm:min-h-[500px] w-full cursor-zoom-in items-center justify-center text-left"
                disabled={!selectedImage}
                onClick={() => setIsGalleryOpen(true)}
                type="button"
              >
                {selectedImage ? (
                  <img
                    alt={selectedMedia?.alt || product.imageAlt}
                    className="max-h-[520px] sm:max-h-[580px] w-full object-contain mix-blend-multiply transition-transform duration-700 group-hover:scale-105"
                    src={selectedImage}
                    onError={(e) => {
                      const target = e.currentTarget;
                      let src = target.src;
                      if (src.includes("/thumbnails/products/")) {
                        src = src.replace(
                          "/thumbnails/products/",
                          "/products/",
                        );
                      } else if (src.includes("/thumbnails/")) {
                        src = src.replace("/thumbnails/", "/");
                      }
                      const fixed = src
                        .replace(/_thumbnail_\d+\.(jpg|jpeg|png|webp)$/i, ".$1")
                        .replace(
                          /_thu_[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/i,
                          ".$1",
                        )
                        .replace(
                          /_thum_[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/i,
                          ".$1",
                        );
                      if (fixed !== target.src) {
                        target.src = fixed;
                      }
                    }}
                  />
                ) : (
                  <ImageFallback label={product.name} />
                )}
                {selectedImage ? (
                  <span className="absolute right-2 bottom-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/80 backdrop-blur-md text-[#1d1d1f] shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition hover:bg-white hover:scale-105">
                    <Expand className="h-4 w-4" />
                  </span>
                ) : null}
              </button>

              {activeGallery.length > 1 ? (
                <>
                  <GalleryNavigationButton
                    direction="previous"
                    onClick={() => showAdjacentMedia(-1)}
                  />
                  <GalleryNavigationButton
                    direction="next"
                    onClick={() => showAdjacentMedia(1)}
                  />
                </>
              ) : null}
            </div>

            {/* Thumbnail Strip */}
            {activeGallery.length > 1 ? (
              <fieldset className="mt-6 flex w-full items-center justify-center gap-3 overflow-x-auto py-2.5 px-2">
                <legend className="sr-only">Product images</legend>
                {activeGallery.map((media, index) => {
                  const active = media.url === selectedImage;

                  return (
                    <button
                      aria-label={`Show image ${index + 1} of ${activeGallery.length}`}
                      aria-pressed={active}
                      className={cn(
                        "group relative flex h-16 w-16 sm:h-[72px] sm:w-[72px] shrink-0 items-center justify-center rounded-2xl bg-white p-2 transition-all duration-200 ease-out motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]",
                        active
                          ? "border-2 border-[#0071e3] shadow-[0_4px_16px_rgba(0,113,227,0.18)] opacity-100"
                          : "border-2 border-black/[0.06] opacity-60 hover:opacity-100 hover:border-black/20 shadow-[0_1px_4px_rgba(0,0,0,0.02)]",
                      )}
                      key={media.url}
                      onClick={() => setSelectedMediaUrl(media.url)}
                      type="button"
                    >
                      <img
                        alt=""
                        className="h-full w-full object-contain mix-blend-multiply transition-transform duration-200 group-hover:scale-105"
                        decoding="async"
                        height={64}
                        loading="lazy"
                        src={media.url}
                        width={64}
                      />
                    </button>
                  );
                })}
              </fieldset>
            ) : null}
          </div>

          {/* Product Purchase & Spec Column (Right 5 Cols) */}
          <aside className="lg:col-span-5 flex flex-col gap-6">
            <div className="rounded-[2.5rem] border border-black/[0.04] bg-white p-8 shadow-[0_4px_30px_rgba(0,0,0,0.04)] sm:p-10">
              {product.category ? (
                <Link
                  className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0071e3] transition hover:opacity-80"
                  params={{ collection: product.category.slug }}
                  to="/collections/$collection"
                >
                  {product.category.name}
                </Link>
              ) : (
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#86868b]">
                  Precision Hardware
                </p>
              )}

              <h1 className="mt-3 text-2xl font-bold tracking-[-0.03em] text-[#1d1d1f] sm:text-3xl lg:text-[2rem] leading-[1.12]">
                {product.name}
              </h1>

              {/* Price & Stock Badge */}
              <div className="mt-6 flex items-baseline justify-between border-b border-black/[0.06] pb-6">
                <div>
                  <p className="text-3xl font-bold tracking-tight text-[#1d1d1f]">
                    {selectedPrice && selectedPrice.amount > 0
                      ? formatSaleorMoney(selectedPrice)
                      : "Pro Item"}
                  </p>
                  {selectedDiscountPercent && selectedPriorPrice ? (
                    <div className="mt-1.5 flex items-center gap-2">
                      <p className="text-xs text-[#86868b] line-through">
                        {formatSaleorMoney(selectedPriorPrice)}
                      </p>
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 border border-emerald-500/20">
                        Save {selectedDiscountPercent}%
                      </span>
                    </div>
                  ) : null}
                </div>

                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border",
                    canAdd
                      ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-700 border-amber-500/20",
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      canAdd ? "bg-emerald-500" : "bg-amber-500",
                    )}
                  />
                  {canAdd ? "In Stock" : "Limited Stock"}
                </span>
              </div>

              {/* SKU & Options Meta Bar */}
              <div className="mt-6 grid grid-cols-2 gap-4 rounded-2xl border border-black/[0.04] bg-[#f5f5f7] p-4 text-xs">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#86868b]">
                    SKU Code
                  </span>
                  <p
                    className="mt-0.5 font-bold tracking-tight text-[#1d1d1f]"
                    data-saleor-selected-sku
                  >
                    {selectedSku}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#86868b]">
                    Variants
                  </span>
                  <p
                    className="mt-0.5 font-bold tracking-tight text-[#1d1d1f]"
                    data-saleor-variant-count
                  >
                    {product.variants.length} available
                  </p>
                </div>
              </div>

              {/* Variant Selector */}
              {product.variants.length > 1 ? (
                <div className="mt-8">
                  {hasAttributeSelector && selectedVariant ? (
                    <div>
                      <NtmsSaleorVariantSelector
                        groups={variantAttributeGroups}
                        onSelectVariant={selectVariant}
                        selectedVariant={selectedVariant}
                        variants={product.variants}
                      />
                      {selectedConfiguration.length > 0 ? (
                        <p className="mt-2 text-xs font-medium text-[#86868b]">
                          {selectedConfiguration.join(" • ")}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {!hasAttributeSelector && hasVariantSearch ? (
                    <div className="relative mb-3">
                      <Search
                        aria-hidden="true"
                        className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#86868b]"
                      />
                      <input
                        aria-label="Search product variants"
                        autoComplete="off"
                        className="h-10 w-full rounded-xl border border-black/10 bg-[#f5f5f7] pl-10 pr-3.5 text-xs font-medium text-[#1d1d1f] outline-none transition placeholder:text-[#86868b] focus:border-[#0071e3] focus:bg-white focus:ring-2 focus:ring-[#0071e3]/20"
                        data-saleor-variant-search
                        onChange={(event) =>
                          setVariantSearchQuery(event.currentTarget.value)
                        }
                        placeholder="Search model, size, or SKU..."
                        spellCheck={false}
                        type="search"
                        value={variantSearchQuery}
                      />
                    </div>
                  ) : null}

                  {!hasAttributeSelector ? (
                    <div>
                      <div className="mb-3 flex items-baseline justify-between">
                        <h3 className="text-sm font-semibold tracking-tight text-[#1d1d1f]">
                          <span>Model.</span>{" "}
                          <span className="font-normal text-[#86868b]">
                            Select configuration.
                          </span>
                        </h3>
                      </div>
                      <div
                        className={[
                          "grid grid-cols-1 gap-2.5 sm:grid-cols-2",
                          hasVariantSearch
                            ? "max-h-72 overflow-y-auto pr-1"
                            : "",
                        ].join(" ")}
                        data-saleor-variant-options
                      >
                        {visibleVariants.map((variant) => {
                          const active = variant.id === selectedVariant?.id;
                          const variantPrice = variant.price ?? product.price;

                          return (
                            <label
                              className={[
                                "relative flex cursor-pointer flex-col justify-between rounded-2xl p-4 text-left transition-all duration-200",
                                active
                                  ? "border-2 border-[#0071e3] bg-white ring-1 ring-[#0071e3]/20 shadow-[0_2px_8px_rgba(0,113,227,0.08)]"
                                  : "border border-[#d2d2d7] bg-white hover:border-[#86868b] shadow-[0_1px_2px_rgba(0,0,0,0.02)]",
                              ].join(" ")}
                              key={variant.id}
                            >
                              <input
                                checked={active}
                                className="sr-only"
                                data-saleor-variant-option-id={variant.id}
                                name="saleor-product-variant"
                                onChange={() => selectVariant(variant.id)}
                                type="radio"
                                value={variant.id}
                              />
                              <div>
                                <span className="block text-sm font-semibold tracking-tight text-[#1d1d1f]">
                                  {variant.name}
                                </span>
                                <span className="mt-0.5 block text-xs text-[#86868b]">
                                  SKU {variant.sku || "N/A"}
                                </span>
                              </div>
                              <span className="mt-2 block text-xs font-semibold text-[#1d1d1f]">
                                {variantPrice && variantPrice.amount > 0
                                  ? formatSaleorMoney(variantPrice)
                                  : ""}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {/* Quantity and Primary Add to Cart Button */}
              <div className="mt-8 flex items-center justify-between gap-4 border-t border-black/[0.06] pt-6">
                <div>
                  <span className="text-xs font-bold text-[#1d1d1f]">
                    Quantity
                  </span>
                  <p className="text-[11px] text-[#86868b]">Studio supply</p>
                </div>
                <QuantityControl
                  canAdd={canAdd}
                  maxQuantity={maxQuantity}
                  quantity={quantity}
                  updateQuantity={updateQuantity}
                />
              </div>

              <div className="mt-6" ref={primaryPurchaseRef}>
                <NtmsSaleorAddToCartButton
                  className="w-full rounded-full bg-[#0071e3] py-3.5 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(0,113,227,0.3)] transition-all hover:bg-[#0077ed] hover:shadow-[0_6px_20px_rgba(0,113,227,0.4)] hover:scale-[1.02] active:scale-[0.98]"
                  disabled={!canAdd}
                  label="Add to Bag"
                  quantity={quantity}
                  size="full"
                  variantId={selectedVariant?.id || product.variantId}
                />
              </div>

              {/* Trust badges */}
              <div className="mt-8 grid grid-cols-3 gap-2 border-t border-black/[0.04] pt-6 text-center text-[10px] font-semibold text-[#86868b]">
                <PurchaseSignal
                  icon={<PackageCheck className="h-4 w-4 text-[#0071e3]" />}
                  label="Direct Certified"
                />
                <PurchaseSignal
                  icon={<Truck className="h-4 w-4 text-[#0071e3]" />}
                  label="Priority Express"
                />
                <PurchaseSignal
                  icon={<ShieldCheck className="h-4 w-4 text-[#0071e3]" />}
                  label="Sterility Assured"
                />
              </div>
            </div>
          </aside>
        </section>

        {/* Product Details & Specifications Section */}
        <section className="mt-16 overflow-hidden rounded-[2.5rem] bg-white p-8 sm:p-12 shadow-[0_4px_30px_rgba(0,0,0,0.04)] border border-black/[0.04]">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-black/[0.06] pb-8 gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0071e3]">
                Studio Specification &amp; Insights
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-[#1d1d1f] sm:text-3xl leading-[1.12]">
                Product Overview &amp; Details
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f5f5f7] border border-black/[0.04] px-3.5 py-1.5 text-xs font-semibold text-[#1d1d1f]">
                <ShieldCheck className="h-4 w-4 text-[#0071e3]" />
                Genuine NTMS Certified
              </span>
            </div>
          </div>

          <div className="mt-8 grid gap-12 lg:grid-cols-12">
            {/* Left 8 Cols: Structured Rich Description */}
            <div className="lg:col-span-8">
              {product.description ? (
                <div
                  className="prose prose-neutral max-w-none text-base leading-relaxed text-[#515154]
                    [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:tracking-tight [&_h2]:text-[#1d1d1f] [&_h2]:mt-8 [&_h2]:mb-4
                    [&_h3]:text-lg [&_h3]:font-bold [&_h3]:tracking-tight [&_h3]:text-[#1d1d1f] [&_h3]:mt-6 [&_h3]:mb-3
                    [&_p]:my-3.5 [&_p]:leading-relaxed
                    [&_b]:font-bold [&_b]:text-[#1d1d1f] [&_strong]:font-bold [&_strong]:text-[#1d1d1f]
                    [&_ul]:my-4 [&_ul]:space-y-2.5 [&_ul]:pl-0
                    [&_li]:flex [&_li]:items-start [&_li]:gap-2.5
                    [&_ol]:my-4 [&_ol]:space-y-2.5 [&_ol]:pl-5 [&_ol]:list-decimal
                    [&_table]:w-full [&_table]:border-collapse [&_th]:border-b [&_th]:border-black/[0.08] [&_th]:py-3 [&_th]:text-xs [&_th]:font-bold [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-[#1d1d1f] [&_td]:border-b [&_td]:border-black/[0.04] [&_td]:py-3 [&_td]:text-sm
                  "
                  // biome-ignore lint/security/noDangerouslySetInnerHtml: Sanitized rich text description from Saleor
                  dangerouslySetInnerHTML={{
                    __html: parseRichDescriptionToHtml(product.description),
                  }}
                />
              ) : (
                <p className="text-sm text-[#86868b]">
                  Full technical specifications and batch certifications
                  verified by Nuclear Tattoo Supply.
                </p>
              )}
            </div>

            {/* Right 4 Cols: Quick Technical Specs Card */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <div className="rounded-2xl bg-[#f5f5f7] border border-black/[0.04] p-6">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#86868b]">
                  Product Highlights
                </h3>
                <dl className="mt-4 space-y-3.5 text-xs">
                  <div className="flex justify-between border-b border-black/[0.06] pb-2.5">
                    <dt className="text-[#86868b]">Category</dt>
                    <dd className="font-semibold text-[#1d1d1f]">
                      {product.category?.name ?? "Hardware"}
                    </dd>
                  </div>
                  <div className="flex justify-between border-b border-black/[0.06] pb-2.5">
                    <dt className="text-[#86868b]">SKU</dt>
                    <dd className="font-mono font-semibold text-[#1d1d1f]">
                      {selectedSku}
                    </dd>
                  </div>
                  <div className="flex justify-between border-b border-black/[0.06] pb-2.5">
                    <dt className="text-[#86868b]">Variants</dt>
                    <dd className="font-semibold text-[#1d1d1f]">
                      {product.variants.length > 0
                        ? `${product.variants.length} Options`
                        : "Standard"}
                    </dd>
                  </div>
                  <div className="flex justify-between border-b border-black/[0.06] pb-2.5">
                    <dt className="text-[#86868b]">Availability</dt>
                    <dd className="font-semibold text-emerald-600">
                      {isSoldOut ? "Out of Stock" : "In Stock - Ready to Ship"}
                    </dd>
                  </div>
                  <div className="flex justify-between pt-1">
                    <dt className="text-[#86868b]">Dispatch</dt>
                    <dd className="font-semibold text-[#1d1d1f]">
                      Same-Day (Order before 3PM)
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-2xl bg-white border border-black/[0.06] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#86868b]">
                  Studio Assurance
                </h3>
                <ul className="mt-3 space-y-2 text-xs text-[#6e6e73]">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#0071e3]" />
                    <span>100% Guaranteed Authentic Hardware</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#0071e3]" />
                    <span>Certified Sterility &amp; Lot Tracing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#0071e3]" />
                    <span>Direct Professional Manufacturer Warranty</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Related Products Carousel */}
        {relatedProducts.length > 0 ? (
          <section className="mt-16">
            <div className="flex items-center justify-between pb-8">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0071e3]">
                  Studio Pairings
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-[#1d1d1f] sm:text-3xl leading-[1.12]">
                  More in {product.category?.name ?? "Hardware"}
                </h2>
              </div>
              {product.category ? (
                <Link
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#0071e3] transition-colors hover:text-[#0077ed]"
                  params={{ collection: product.category.slug }}
                  to="/collections/$collection"
                >
                  View full series &rarr;
                </Link>
              ) : null}
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.slice(0, 4).map((item, index) => (
                <SaleorProductCard
                  enableLinks
                  key={item.id}
                  product={item}
                  priority={index < 2}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>

      {/* Mobile Sticky Buy Bar */}
      {showMobileBuyBar ? (
        <div
          className="fixed inset-x-0 bottom-0 z-40 border-t border-black/[0.06] bg-white/85 px-4 py-3 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] backdrop-blur-2xl saturate-150 lg:hidden"
          data-saleor-mobile-buy-bar
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-[#1d1d1f]">
                {product.name}
              </p>
              <p className="text-sm font-extrabold text-[#0071e3]">
                {selectedPrice && selectedPrice.amount > 0
                  ? formatSaleorMoney(selectedPrice)
                  : ""}
              </p>
            </div>
            <NtmsSaleorAddToCartButton
              className="rounded-full bg-[#0071e3] px-6 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-[#0077ed]"
              disabled={!canAdd}
              label={`Add (${quantity})`}
              quantity={quantity}
              variantId={selectedVariant?.id || product.variantId}
            />
          </div>
        </div>
      ) : null}

      <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
        <DialogContent className="h-[min(90vh,920px)] max-w-[min(96vw,1100px)] overflow-hidden rounded-3xl border-0 bg-white p-0 shadow-2xl">
          <DialogTitle className="sr-only">
            {product.name} image viewer
          </DialogTitle>
          <DialogDescription className="sr-only">
            View product images at a larger size.
          </DialogDescription>
          <div className="relative flex min-h-0 flex-1 items-center justify-center p-8 sm:p-14">
            {selectedImage ? (
              <img
                alt={selectedMedia?.alt || product.imageAlt}
                className="max-h-full max-w-full object-contain mix-blend-multiply"
                src={selectedImage}
                onError={(e) => {
                  const target = e.currentTarget;
                  let src = target.src;
                  if (src.includes("/thumbnails/products/")) {
                    src = src.replace("/thumbnails/products/", "/products/");
                  } else if (src.includes("/thumbnails/")) {
                    src = src.replace("/thumbnails/", "/");
                  }
                  const fixed = src
                    .replace(/_thumbnail_\d+\.(jpg|jpeg|png|webp)$/i, ".$1")
                    .replace(
                      /_thu_[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/i,
                      ".$1",
                    )
                    .replace(
                      /_thum_[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/i,
                      ".$1",
                    );
                  if (fixed !== target.src) {
                    target.src = fixed;
                  }
                }}
              />
            ) : null}
            {activeGallery.length > 1 ? (
              <>
                <GalleryNavigationButton
                  direction="previous"
                  onClick={() => showAdjacentMedia(-1)}
                />
                <GalleryNavigationButton
                  direction="next"
                  onClick={() => showAdjacentMedia(1)}
                />
              </>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function GalleryNavigationButton({
  direction,
  onClick,
}: {
  direction: "previous" | "next";
  onClick: () => void;
}) {
  const isPrevious = direction === "previous";
  const Icon = isPrevious ? ChevronLeft : ChevronRight;

  return (
    <button
      aria-label={`${isPrevious ? "Previous" : "Next"} product image`}
      className={[
        "absolute top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#1d1d1f] shadow-[0_2px_12px_rgba(0,0,0,0.12)] transition hover:bg-white hover:scale-105 active:scale-95",
        isPrevious ? "left-4" : "right-4",
      ].join(" ")}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      type="button"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function QuantityControl({
  canAdd,
  maxQuantity,
  quantity,
  updateQuantity,
}: {
  canAdd: boolean;
  maxQuantity: number;
  quantity: number;
  updateQuantity: (quantity: number) => void;
}) {
  return (
    <div className="flex h-9 shrink-0 items-center rounded-full bg-[#f5f5f7] p-1 border border-black/[0.04]">
      <button
        aria-label="Decrease quantity"
        className="grid h-7 w-7 place-items-center rounded-full text-[#1d1d1f] transition-all hover:bg-white hover:shadow-sm active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
        data-saleor-decrease-quantity
        disabled={!canAdd || quantity <= 1}
        onClick={() => updateQuantity(quantity - 1)}
        type="button"
      >
        <Minus className="h-3 w-3" />
      </button>
      <input
        aria-label="Quantity"
        className="h-full w-10 border-0 bg-transparent px-1 text-center text-xs font-bold text-[#1d1d1f] outline-none disabled:text-[#86868b] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        data-saleor-product-quantity
        disabled={!canAdd}
        inputMode="numeric"
        max={maxQuantity}
        min={1}
        onChange={(event) => updateQuantity(event.currentTarget.valueAsNumber)}
        step={1}
        type="number"
        value={quantity}
      />
      <button
        aria-label="Increase quantity"
        className="grid h-7 w-7 place-items-center rounded-full text-[#1d1d1f] transition-all hover:bg-white hover:shadow-sm active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
        data-saleor-increase-quantity
        disabled={!canAdd || quantity >= maxQuantity}
        onClick={() => updateQuantity(quantity + 1)}
        type="button"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}

function PurchaseSignal({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f5f5f7] border border-black/[0.04] transition-transform duration-300 hover:scale-110">
        {icon}
      </span>
      <span className="leading-tight text-[11px] font-medium text-[#6e6e73]">
        {label}
      </span>
    </div>
  );
}

function ImageFallback({ label }: { label: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center px-4 text-center text-xs font-semibold uppercase text-[#86868b]">
      {label}
    </div>
  );
}

function formatSaleorMoney(price: { amount: number; currency: string }) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: price.currency,
  }).format(price.amount);
}

function saleorDiscountPercent(
  price: { amount: number } | null,
  priorPrice: { amount: number } | null,
) {
  if (!price || !priorPrice || priorPrice.amount <= price.amount) return null;
  return Math.max(
    1,
    Math.round(((priorPrice.amount - price.amount) / priorPrice.amount) * 100),
  );
}

function getAvailableQuantity(quantity: number | null | undefined) {
  if (typeof quantity !== "number" || !Number.isFinite(quantity)) return 0;

  return Math.max(0, Math.floor(quantity));
}
