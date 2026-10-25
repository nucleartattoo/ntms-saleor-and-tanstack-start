import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";
import type {
  NtmsSaleorCatalogPreview,
  NtmsSaleorProduct,
} from "@/lib/saleor/catalog";
import { cn } from "@/lib/utils";
import { NtmsSaleorAddToCartButton } from "./ntms-add-to-cart-button";

type NtmsSaleorCategory = NtmsSaleorCatalogPreview["categories"][number];

const categoryDisplayNames = new Map([
  ["Products", "Studio Essentials"],
  ["Papa", "PAPA Professional"],
  ["Power Supplies & Cords", "Power Systems"],
  ["Tubes & Grips", "Grips & Tubes"],
]);

export const categoryPriority = [
  "Needles",
  "Inks",
  "Machines",
  "Tubes & Grips",
  "Power Supplies & Cords",
  "Medical",
  "Shop Supply",
  "Papa",
  "Sales",
];

interface CinemaSlide {
  id: string;
  theme: "dark" | "light" | "vibrant" | "slate";
  tag: string;
  badge: string;
  headline: string;
  subhead: string;
  lead: string;
  cta: string;
  href: "/collections/$collection";
  params: { collection: string };
  image: string;
  imageAlt: string;
  specs: string[];
}

const CINEMA_SLIDES: CinemaSlide[] = [
  {
    id: "kwadron",
    theme: "dark",
    tag: "Kwadron",
    badge: "Needles",
    headline: "Kwadron Cartridges",
    subhead: "Professional Series",
    lead: "Industry-leading needle stabilization system.",
    cta: "Shop Now",
    href: "/collections/$collection",
    params: { collection: "ntms-289-needles" },
    image: "/sliders/kwadron.png",
    imageAlt: "Kwadron Tattoo Needles and Cartridges",
    specs: ["316L Surgical Steel", "Medical Grade Housing"],
  },
  {
    id: "fk-irons",
    theme: "dark",
    tag: "FK Irons",
    badge: "Machines",
    headline: "FK Irons Machine Sale",
    subhead: "Direct Drive Power",
    lead: "Exclusive promotional pricing on flagship rotary and wireless machines.",
    cta: "Shop Now",
    href: "/collections/$collection",
    params: { collection: "ntms-103-machines" },
    image: "/sliders/fk-irons-sale.png",
    imageAlt: "FK Irons Tattoo Machine Promotion",
    specs: ["Aircraft Grade Aluminum", "Zero Maintenance"],
  },
  {
    id: "papa",
    theme: "dark",
    tag: "PAPA Deal",
    badge: "Buy 5 Get 1",
    headline: "PAPA Cartridges Buy 5 Get 1",
    subhead: "High Elasticity Membrane",
    lead: "Stock up on professional sterile cartridge needles.",
    cta: "Shop Now",
    href: "/collections/$collection",
    params: { collection: "ntms-117-papa" },
    image: "/sliders/papa-buy-5-get-1.png",
    imageAlt: "PAPA Cartridge Needles Buy 5 Get 1 Free Promotion",
    specs: ["Anti-Backflow Membrane", "EO Gas Sterile"],
  },
  {
    id: "black-label",
    theme: "dark",
    tag: "Black Label",
    badge: "Gloves",
    headline: "Black Label Medical Gloves",
    subhead: "Medical Supplies",
    lead: "Superior tactile sensitivity and tear-resistant medical-grade protection.",
    cta: "Shop Now",
    href: "/collections/$collection",
    params: { collection: "ntms-89-medical" },
    image: "/sliders/black-label-gloves.jpg",
    imageAlt: "Black Label Tattoo Examination Gloves",
    specs: ["Latex & Nitrile", "Textured Grip"],
  },
];

export function NtmsSaleorCatalogPage({
  catalog,
  enableLinks = false,
}: {
  backLabel?: string;
  backTo?: string;
  catalog: NtmsSaleorCatalogPreview;
  enableLinks?: boolean;
}) {
  const bento1 = catalog.products[0];
  const bento2 = catalog.products[1];
  const bento3 = catalog.products[2];

  const categories = getHomeCategories(catalog.categories);
  const products = catalog.products.slice(0, 8);

  return (
    <main className="min-h-screen bg-[#fbfbfd] text-[#1d1d1f] antialiased selection:bg-[#0071e3] selection:text-white">
      {/* 1. APPLE CINEMA HERO BIG SLIDES CAROUSEL */}
      <AppleCinemaHero enableLinks={enableLinks} />

      {/* 2. APPLE BENTO SHOWCASE: Seamless Studio Light Cards */}
      {bento1 ? (
        <section className="bg-gradient-to-b from-[#fbfbfd] via-[#f5f5f7] to-[#fbfbfd] py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#86868b]">
                Featured Hardware
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-[-0.03em] text-[#1d1d1f] sm:text-5xl lg:text-6xl leading-[1.08]">
                Built for the highest standard.
              </h2>
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {/* Giant Left Showcase Card */}
              <div className="group relative flex min-h-[540px] flex-col justify-between overflow-hidden rounded-3xl sm:rounded-[2rem] lg:rounded-[2.5rem] border border-black/[0.05] bg-[#ffffff] p-7 sm:p-9 lg:p-10 pb-6 sm:pb-8 lg:pb-8 shadow-[0_4px_30px_rgba(0,0,0,0.04)] transition-[transform,box-shadow] duration-300 ease-[var(--ease-out)] [@media(hover:hover)]:hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] motion-reduce:transition-none motion-reduce:transform-none lg:col-span-2">
                <div className="relative z-10 flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-[#86868b]">
                      {bento1.categoryName || "Flagship Hardware"}
                    </span>
                    <h3 className="mt-2 text-2xl font-bold tracking-[-0.02em] text-[#1d1d1f] sm:text-3xl">
                      {bento1.name}
                    </h3>
                  </div>
                  <span className="shrink-0 rounded-full border border-black/[0.05] bg-[#f5f5f7] px-4 py-1.5 text-sm font-bold text-[#1d1d1f]">
                    {bento1.price && bento1.price.amount > 0
                      ? formatSaleorMoney(bento1.price)
                      : "Pro Item"}
                  </span>
                </div>

                {/* Expansive Studio Image Stage */}
                <div className="relative z-0 my-4 flex min-h-[340px] sm:min-h-[400px] lg:min-h-[440px] flex-1 items-center justify-center overflow-hidden p-4">
                  {bento1.imageUrl ? (
                    <img
                      src={bento1.imageUrl}
                      alt={bento1.imageAlt}
                      loading="lazy"
                      decoding="async"
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
                          .replace(
                            /_thumbnail_\d+\.(jpg|jpeg|png|webp)$/i,
                            ".$1",
                          )
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
                      className="h-full w-full max-h-[420px] sm:max-h-[460px] object-contain mix-blend-multiply scale-100 transition-transform duration-500 ease-[var(--ease-out)] [@media(hover:hover)]:group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:transform-none"
                    />
                  ) : (
                    <div className="flex h-64 w-64 items-center justify-center rounded-3xl bg-[#f5f5f7] text-sm text-[#86868b]">
                      Studio Hardware Visual
                    </div>
                  )}
                </div>

                <div className="relative z-10 flex items-center justify-between pt-4">
                  {enableLinks ? (
                    <Link
                      to="/product/$productId"
                      params={{ productId: bento1.slug }}
                      className="inline-flex items-center text-sm font-semibold text-[#0071e3] transition-transform duration-200 ease-[var(--ease-out)] group-hover:translate-x-0.5"
                    >
                      <span>Explore details</span>
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  ) : (
                    <span className="text-sm font-medium text-[#6e6e73]">
                      Engineered for professionals
                    </span>
                  )}
                  <NtmsSaleorAddToCartButton
                    variantId={bento1.variantId}
                    className="rounded-full bg-[#1d1d1f] px-6 py-2 text-xs font-semibold text-white shadow-sm transition-[transform,background-color] duration-160 ease-[var(--ease-out)] hover:bg-[#333336] [@media(hover:hover)]:hover:scale-[1.02] active:scale-[0.97] motion-reduce:transition-none motion-reduce:transform-none"
                  />
                </div>
              </div>

              {/* Right Stack: 2 Clean White Studio Cards */}
              <div className="flex flex-col gap-6">
                {bento2 ? (
                  <div className="group relative flex flex-1 flex-col justify-between overflow-hidden rounded-2xl sm:rounded-[2rem] border border-black/[0.05] bg-[#ffffff] p-6 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.04)] transition-[transform,box-shadow] duration-300 ease-[var(--ease-out)] [@media(hover:hover)]:hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.07)] motion-reduce:transition-none motion-reduce:transform-none">
                    <div className="relative z-10 flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#86868b]">
                          {bento2.categoryName || "Power System"}
                        </span>
                        <h4 className="mt-1 text-xl font-bold tracking-tight text-[#1d1d1f]">
                          {bento2.name}
                        </h4>
                      </div>
                      <span className="shrink-0 rounded-full border border-black/[0.05] bg-[#f5f5f7] px-3 py-1 text-xs font-bold text-[#1d1d1f]">
                        {bento2.price && bento2.price.amount > 0
                          ? formatSaleorMoney(bento2.price)
                          : "Pro Item"}
                      </span>
                    </div>

                    <div className="relative z-0 my-3 flex min-h-[200px] sm:min-h-[220px] flex-1 items-center justify-center overflow-hidden p-2">
                      {bento2.imageUrl ? (
                        <img
                          src={bento2.imageUrl}
                          alt={bento2.imageAlt}
                          loading="lazy"
                          decoding="async"
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
                              .replace(
                                /_thumbnail_\d+\.(jpg|jpeg|png|webp)$/i,
                                ".$1",
                              )
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
                          className="h-full w-full max-h-[220px] object-contain mix-blend-multiply scale-100 transition-transform duration-500 ease-[var(--ease-out)] [@media(hover:hover)]:group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:transform-none"
                        />
                      ) : null}
                    </div>

                    <div className="relative z-10 flex items-center justify-between">
                      {enableLinks ? (
                        <Link
                          to="/product/$productId"
                          params={{ productId: bento2.slug }}
                          className="inline-flex items-center text-xs font-semibold text-[#0071e3] transition-transform duration-200 ease-[var(--ease-out)] hover:underline group-hover:translate-x-0.5"
                        >
                          <span>View hardware</span>
                          <span className="ml-1">&rarr;</span>
                        </Link>
                      ) : (
                        <span className="text-xs font-medium text-[#6e6e73]">
                          Studio standard
                        </span>
                      )}
                      <NtmsSaleorAddToCartButton
                        variantId={bento2.variantId}
                        className="rounded-full bg-[#1d1d1f] px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-[transform,background-color] duration-160 ease-[var(--ease-out)] hover:bg-[#333336] [@media(hover:hover)]:hover:scale-[1.03] active:scale-[0.97] motion-reduce:transition-none motion-reduce:transform-none"
                      />
                    </div>
                  </div>
                ) : null}

                {bento3 ? (
                  <div className="group relative flex flex-1 flex-col justify-between overflow-hidden rounded-2xl sm:rounded-[2rem] border border-black/[0.05] bg-[#ffffff] p-6 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.04)] transition-[transform,box-shadow] duration-300 ease-[var(--ease-out)] [@media(hover:hover)]:hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.07)] motion-reduce:transition-none motion-reduce:transform-none">
                    <div className="relative z-10 flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#86868b]">
                          {bento3.categoryName || "Precision Supply"}
                        </span>
                        <h4 className="mt-1 text-xl font-bold tracking-tight text-[#1d1d1f]">
                          {bento3.name}
                        </h4>
                      </div>
                      <span className="shrink-0 rounded-full border border-black/[0.05] bg-[#f5f5f7] px-3 py-1 text-xs font-bold text-[#1d1d1f]">
                        {bento3.price && bento3.price.amount > 0
                          ? formatSaleorMoney(bento3.price)
                          : "Pro Item"}
                      </span>
                    </div>

                    <div className="relative z-0 my-3 flex min-h-[200px] sm:min-h-[220px] flex-1 items-center justify-center overflow-hidden p-2">
                      {bento3.imageUrl ? (
                        <img
                          src={bento3.imageUrl}
                          alt={bento3.imageAlt}
                          loading="lazy"
                          decoding="async"
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
                              .replace(
                                /_thumbnail_\d+\.(jpg|jpeg|png|webp)$/i,
                                ".$1",
                              )
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
                          className="h-full w-full max-h-[220px] object-contain mix-blend-multiply scale-100 transition-transform duration-500 ease-[var(--ease-out)] [@media(hover:hover)]:group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:transform-none"
                        />
                      ) : null}
                    </div>

                    <div className="relative z-10 flex items-center justify-between">
                      {enableLinks ? (
                        <Link
                          to="/product/$productId"
                          params={{ productId: bento3.slug }}
                          className="inline-flex items-center text-xs font-semibold text-[#0071e3] transition-transform duration-200 ease-[var(--ease-out)] hover:underline group-hover:translate-x-0.5"
                        >
                          <span>View hardware</span>
                          <span className="ml-1">&rarr;</span>
                        </Link>
                      ) : (
                        <span className="text-xs font-medium text-[#6e6e73]">
                          Studio standard
                        </span>
                      )}
                      <NtmsSaleorAddToCartButton
                        variantId={bento3.variantId}
                        className="rounded-full bg-[#1d1d1f] px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-[transform,background-color] duration-160 ease-[var(--ease-out)] hover:bg-[#333336] [@media(hover:hover)]:hover:scale-[1.03] active:scale-[0.97] motion-reduce:transition-none motion-reduce:transform-none"
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* 3. HARDWARE CATEGORY SECTORS: Apple Minimal Studio Cards */}
      <section className="bg-[#fbfbfd] py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-[-0.03em] text-[#1d1d1f] sm:text-4xl lg:text-5xl leading-[1.1]">
                Explore by Category.
              </h2>
              <p className="mt-2 text-sm text-[#6e6e73]">
                Curated studio equipment organized by discipline.
              </p>
            </div>
            {enableLinks ? (
              <Link
                to="/search"
                className="hidden text-sm font-semibold text-[#0071e3] transition-colors hover:underline sm:inline-flex"
              >
                All categories &rarr;
              </Link>
            ) : null}
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => {
              const label = categoryDisplayNames.get(cat.name) || cat.name;
              const content = (
                <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-black/[0.05] bg-[#ffffff] p-6 sm:p-7 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-[transform,box-shadow] duration-240 ease-[var(--ease-out)] [@media(hover:hover)]:hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(0,0,0,0.08)] motion-reduce:transition-none motion-reduce:transform-none">
                  {/* Square Image Stage */}
                  <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-[#fbfbfd] flex items-center justify-center p-6 transition-colors duration-300 group-hover:bg-[#f5f5f7]">
                    {cat.imageUrl ? (
                      <img
                        src={cat.imageUrl}
                        alt={cat.imageAlt || label}
                        className="h-full w-full object-contain mix-blend-multiply scale-100 transition-transform duration-400 ease-[var(--ease-out)] [@media(hover:hover)]:group-hover:scale-105 motion-reduce:transition-none motion-reduce:transform-none"
                        loading="lazy"
                        decoding="async"
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
                            .replace(
                              /_thumbnail_\d+\.(jpg|jpeg|png|webp)$/i,
                              ".$1",
                            )
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
                      <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-[#f0f0f2] text-xs font-semibold text-[#86868b]">
                        {label}
                      </div>
                    )}
                  </div>

                  {/* Metadata & Navigation */}
                  <div className="mt-6 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold tracking-tight text-[#1d1d1f] transition-colors duration-200 group-hover:text-[#0071e3]">
                        {label}
                      </h3>
                      <p className="mt-1 text-xs text-[#86868b]">
                        {cat.productCount > 0
                          ? `${cat.productCount} models`
                          : "Professional series"}
                      </p>
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f5f5f7] text-[#1d1d1f] transition-[transform,background-color,color] duration-160 ease-[var(--ease-out)] group-hover:bg-[#0071e3] group-hover:text-white [@media(hover:hover)]:group-hover:scale-[1.04] active:scale-[0.97] motion-reduce:transition-none motion-reduce:transform-none">
                      <ChevronRight className="h-4 w-4 transition-transform duration-200 ease-[var(--ease-out)] group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </div>
              );

              if (enableLinks) {
                return (
                  <Link
                    key={cat.id}
                    to="/collections/$collection"
                    params={{ collection: cat.slug }}
                    className="block rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]"
                  >
                    {content}
                  </Link>
                );
              }

              return <div key={cat.id}>{content}</div>;
            })}
          </div>
        </div>
      </section>

      {/* 4. CURATED HARDWARE GRID: Pure Studio Cards with Seamless Hardware View */}
      {products.length > 0 ? (
        <section className="bg-gradient-to-b from-[#fbfbfd] via-[#f5f5f7] to-[#fbfbfd] py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-3xl font-bold tracking-[-0.03em] text-[#1d1d1f] sm:text-4xl lg:text-5xl leading-[1.1]">
                  Latest Hardware Releases.
                </h2>
                <p className="mt-2 text-sm text-[#6e6e73]">
                  Ready-to-ship supplies verified for studio performance.
                </p>
              </div>
              {enableLinks ? (
                <Link
                  to="/search"
                  className="text-sm font-semibold text-[#0071e3] transition-colors hover:underline"
                >
                  Browse all {catalog.totalProducts} items &rarr;
                </Link>
              ) : null}
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((item) => (
                <SaleorProductCard
                  key={item.id}
                  product={item}
                  enableLinks={enableLinks}
                  priority={false}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* 5. STUDIO PROMISE FOOTNOTE */}
      <section className="bg-[#fbfbfd] pb-24 pt-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="rounded-3xl sm:rounded-[2.5rem] border border-black/[0.05] bg-[#ffffff] p-8 text-center shadow-[0_4px_24px_rgba(0,0,0,0.03)] sm:p-16">
            <h3 className="text-2xl font-bold tracking-[-0.025em] text-[#1d1d1f] sm:text-3xl lg:text-4xl">
              Equipping Professional Tattoo Artists Nationwide.
            </h3>
            <p className="mx-auto mt-4 max-w-2xl text-[15px] sm:text-[17px] leading-relaxed text-[#515154]">
              Every machine, power system, and cartridge batch passes rigid
              quality verification before leaving our temperature-controlled
              distribution facility.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              {enableLinks ? (
                <Link
                  to="/search"
                  className="rounded-full bg-[#1d1d1f] px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition-[transform,background-color] duration-160 ease-[var(--ease-out)] hover:bg-[#333336] [@media(hover:hover)]:hover:scale-[1.02] active:scale-[0.97] motion-reduce:transition-none motion-reduce:transform-none"
                >
                  Open Studio Catalog
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export function SaleorProductCard({
  product,
  enableLinks = false,
}: {
  product: NtmsSaleorProduct;
  enableLinks?: boolean;
  priority?: boolean;
}) {
  const isConfigurable = product.variantCount > 1;
  const content = (
    <article
      data-saleor-product-card
      data-saleor-variant-count={product.variantCount}
      className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border border-black/[0.05] bg-[#ffffff] p-6 shadow-[0_2px_14px_rgba(0,0,0,0.03)] transition-[transform,box-shadow] duration-240 ease-[var(--ease-out)] [@media(hover:hover)]:hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(0,0,0,0.08)] motion-reduce:transition-none motion-reduce:transform-none"
    >
      {/* Top Header: Category Tag & Price & Title */}
      <div className="relative z-10 flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <span className="h-4 truncate text-[11px] font-semibold uppercase tracking-wider text-[#86868b]">
            {product.categoryName || "Hardware"}
          </span>
          <p className="shrink-0 text-sm font-semibold text-[#1d1d1f]">
            {product.price && product.price.amount > 0
              ? formatSaleorMoney(product.price)
              : "Pro Item"}
          </p>
        </div>
        <h3
          title={product.name}
          className="mt-1.5 line-clamp-2 min-h-[2.6rem] text-[15px] font-semibold leading-[1.3] tracking-[-0.015em] text-[#1d1d1f] transition-colors duration-200 group-hover:text-[#0071e3]"
        >
          {product.name}
        </h3>
      </div>

      {/* Product Image Stage: Centered flex canvas with standardized vertical alignment */}
      <div className="relative my-4 flex min-h-[210px] flex-1 items-center justify-center overflow-hidden p-2">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.imageAlt}
            loading="lazy"
            decoding="async"
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
                .replace(/_thu_[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/i, ".$1")
                .replace(/_thum_[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/i, ".$1");
              if (fixed !== target.src) {
                target.src = fixed;
              }
            }}
            className="max-h-[200px] w-full object-contain mix-blend-multiply scale-100 transition-transform duration-300 ease-[var(--ease-out)] [@media(hover:hover)]:group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:transform-none"
          />
        ) : (
          <div className="flex h-36 w-36 items-center justify-center rounded-2xl bg-[#f5f5f7] text-xs text-[#86868b]">
            Studio Visual
          </div>
        )}
      </div>

      {/* Bottom Actions: Fixed baseline alignment across entire grid */}
      <div className="relative z-10 mt-auto flex items-center justify-between pt-2">
        <span className="inline-flex items-center text-xs font-semibold text-[#0071e3] transition-transform duration-200 ease-[var(--ease-out)] group-hover:translate-x-0.5">
          Explore hardware &rarr;
        </span>
        {isConfigurable ? (
          <span
            data-saleor-choose-options
            className="inline-flex h-8 shrink-0 items-center justify-center rounded-full border border-black/[0.08] bg-[#f5f5f7] px-3.5 text-xs font-semibold text-[#1d1d1f] transition-[background-color,color,border-color] duration-160 ease-[var(--ease-out)] group-hover:border-[#1d1d1f] group-hover:bg-[#1d1d1f] group-hover:text-white"
          >
            Choose options
          </span>
        ) : (
          <NtmsSaleorAddToCartButton
            variantId={product.variantId}
            className="rounded-full border border-black/[0.08] bg-[#f5f5f7] px-3.5 py-1.5 text-xs font-semibold text-[#1d1d1f] shadow-none transition-[transform,background-color,color,border-color] duration-160 ease-[var(--ease-out)] hover:border-black/20 hover:bg-[#1d1d1f] hover:text-white [@media(hover:hover)]:hover:scale-[1.03] active:scale-[0.97] motion-reduce:transition-none motion-reduce:transform-none"
          />
        )}
      </div>
    </article>
  );

  if (enableLinks) {
    return (
      <Link
        to="/product/$productId"
        params={{ productId: product.slug }}
        className="block h-full rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]"
      >
        {content}
      </Link>
    );
  }

  return content;
}

function AppleCinemaHero({ enableLinks = false }: { enableLinks?: boolean }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const slideDuration = 6500; // 6.5s per slide

  const current = CINEMA_SLIDES[activeSlide];

  useEffect(() => {
    if (!isPlaying) return;

    const timer = setTimeout(() => {
      setActiveSlide((activeSlide + 1) % CINEMA_SLIDES.length);
    }, slideDuration);

    return () => clearTimeout(timer);
  }, [activeSlide, isPlaying]);

  const handleSelectSlide = (index: number) => {
    setActiveSlide(index);
  };

  const handlePrev = () => {
    setActiveSlide(
      (curr) => (curr - 1 + CINEMA_SLIDES.length) % CINEMA_SLIDES.length,
    );
  };

  const handleNext = () => {
    setActiveSlide((curr) => (curr + 1) % CINEMA_SLIDES.length);
  };

  return (
    <section
      aria-label="Studio Highlights"
      className="relative isolate overflow-hidden bg-[#000000] text-white"
    >
      {/* Dynamic Slide Banner Container - Pure, Unmasked Visual Presentation */}
      <div className="group relative w-full aspect-[1905/800] min-h-[240px] sm:min-h-[340px] md:min-h-[440px] lg:min-h-[520px] xl:min-h-[600px] max-h-[800px] flex items-end overflow-hidden">
        {/* Slide Images - Clean, unmasked high-res banners */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {CINEMA_SLIDES.map((slide, index) => {
            const isActive = index === activeSlide;
            const className = cn(
              "absolute inset-0 block transition-opacity duration-500 ease-[var(--ease-out)] cursor-pointer",
              isActive
                ? "opacity-100 z-10"
                : "opacity-0 z-0 pointer-events-none",
            );
            return enableLinks ? (
              <Link
                key={slide.id}
                to={slide.href}
                params={slide.params}
                className={className}
                aria-label={slide.headline}
              >
                <img
                  src={slide.image}
                  alt={slide.imageAlt}
                  className="h-full w-full object-cover object-center"
                />
              </Link>
            ) : (
              <div key={slide.id} className={className}>
                <img
                  src={slide.image}
                  alt={slide.imageAlt}
                  className="h-full w-full object-cover object-center"
                />
              </div>
            );
          })}
        </div>

        {/* Minimalist Floating Shop Now CTA Button (Bottom Left) */}
        <div className="relative z-20 mx-auto w-full max-w-7xl px-6 pb-6 sm:px-8 sm:pb-8 lg:px-12 lg:pb-10 pointer-events-none">
          <div className="pointer-events-auto inline-block">
            {enableLinks ? (
              <Link
                to={current.href}
                params={current.params}
                className="inline-flex items-center gap-2 rounded-full bg-[#0071e3] px-6 py-2.5 text-xs sm:px-7 sm:py-3 sm:text-sm font-semibold text-white shadow-[0_4px_24px_rgba(0,113,227,0.45)] transition-[transform,background-color,box-shadow] duration-180 ease-[var(--ease-out)] [@media(hover:hover)]:hover:scale-[1.03] hover:bg-[#0077ed] active:scale-[0.97]"
              >
                <span>Shop Now</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-[#0071e3] px-6 py-2.5 text-xs sm:px-7 sm:py-3 sm:text-sm font-semibold text-white shadow-[0_4px_24px_rgba(0,113,227,0.45)] transition-[transform,background-color] duration-180 ease-[var(--ease-out)] hover:bg-[#0077ed] active:scale-[0.97]"
              >
                <span>Shop Now</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Floating Left/Right Navigation Arrows */}
        <div className="pointer-events-none absolute inset-y-0 inset-x-4 sm:inset-x-6 lg:inset-x-8 z-30 flex items-center justify-between">
          <button
            type="button"
            aria-label="Previous slide"
            onClick={handlePrev}
            className="pointer-events-auto flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white shadow-lg backdrop-blur-xl transition-[transform,background-color] duration-180 ease-[var(--ease-out)] hover:bg-black/70 [@media(hover:hover)]:hover:scale-[1.04] active:scale-[0.96]"
          >
            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={handleNext}
            className="pointer-events-auto flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white shadow-lg backdrop-blur-xl transition-[transform,background-color] duration-180 ease-[var(--ease-out)] hover:bg-black/70 [@media(hover:hover)]:hover:scale-[1.04] active:scale-[0.96]"
          >
            <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>
      </div>

      {/* Bottom Segmented Cinema Pill Progress Bar */}
      <div className="relative z-30 border-t border-white/10 bg-black/40 px-6 py-3.5 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Segmented Interactive Tabs */}
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-1 sm:items-center sm:gap-3">
            {CINEMA_SLIDES.map((slide, idx) => {
              const isActive = idx === activeSlide;
              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => handleSelectSlide(idx)}
                  className={cn(
                    "group relative flex flex-1 flex-col overflow-hidden rounded-xl px-3 py-2 text-left transition-[transform,background-color,color,border-color] duration-200 ease-[var(--ease-out)] active:scale-[0.98]",
                    isActive
                      ? "bg-white/[0.14] text-white backdrop-blur-md border border-white/20 shadow-sm"
                      : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/90 border border-transparent",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold tracking-wide truncate">
                      {slide.tag}
                    </span>
                    <span className="text-[10px] font-medium text-white/40">
                      {slide.badge}
                    </span>
                  </div>

                  {/* GPU-Composited Progress Fill Line (transform: scaleX) */}
                  <div className="mt-2 h-0.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      key={isActive ? `${slide.id}-active` : `${slide.id}-idle`}
                      className={cn(
                        "h-full w-full origin-left rounded-full",
                        isActive
                          ? "bg-[#2997ff]"
                          : idx < activeSlide
                            ? "scale-x-100 bg-white/40"
                            : "scale-x-0 bg-transparent",
                      )}
                      style={
                        isActive
                          ? {
                              animation: `ntms-slide-progress ${slideDuration}ms linear forwards`,
                              animationPlayState: isPlaying
                                ? "running"
                                : "paused",
                            }
                          : undefined
                      }
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Autoplay Pause / Play Toggle */}
          <div className="flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              aria-label={
                isPlaying ? "Pause carousel autoplay" : "Play carousel autoplay"
              }
              onClick={() => setIsPlaying(!isPlaying)}
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 text-[11px] font-medium text-white/80 backdrop-blur-md transition-[transform,background-color,color] duration-160 ease-[var(--ease-out)] hover:bg-white/20 hover:text-white active:scale-[0.97]"
            >
              {isPlaying ? (
                <>
                  <Pause className="h-3 w-3" />
                  <span className="hidden sm:inline">Pause</span>
                </>
              ) : (
                <>
                  <Play className="h-3 w-3" />
                  <span className="hidden sm:inline">Play</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function getHomeCategories(categories: NtmsSaleorCategory[]) {
  const byName = new Map(categories.map((c) => [c.name, c]));
  const ordered: NtmsSaleorCategory[] = [];

  for (const name of categoryPriority) {
    const found = byName.get(name);
    if (found) {
      ordered.push(found);
      byName.delete(name);
    }
  }

  for (const remaining of byName.values()) {
    if (remaining.name !== "Products") {
      ordered.push(remaining);
    }
  }

  return ordered;
}

function formatSaleorMoney(price: { amount: number; currency: string }) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: price.currency || "USD",
  }).format(price.amount);
}
