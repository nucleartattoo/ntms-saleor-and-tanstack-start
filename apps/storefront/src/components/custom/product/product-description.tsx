import { Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  CircleDollarSign,
  Layers3,
  PackageCheck,
  ReceiptText,
  Sparkles,
  Zap,
} from "lucide-react";
import { AddToCart } from "@/components/custom/cart/add-to-cart";
import Price from "@/components/custom/price";
import Prose from "@/components/custom/prose";
import { Badge } from "@/components/ui/badge";
import { type ResultOf, readFragment } from "@/gql/graphql";
import type activeChannelFragment from "@/lib/vendure/fragments/active-channel";
import type productFragment from "@/lib/vendure/fragments/product";
import {
  productOptionGroupFragment,
  variantFragment,
} from "@/lib/vendure/fragments/product";
import { collectionFragment } from "@/lib/vendure/queries/collection";
import { useSelectedVariant } from "./product-context";
import { VariantSelector } from "./variant-selector";

export function ProductDescription({
  product,
  activeChannel,
}: {
  product: ResultOf<typeof productFragment>;
  activeChannel: ResultOf<typeof activeChannelFragment>;
}) {
  const variants = product?.variantList.items.map((data) =>
    readFragment(variantFragment, data),
  );
  const selectedVariant = useSelectedVariant(variants);
  const resolvedVariant =
    selectedVariant ??
    (variants.length === 1 && variants[0]?.options.length === 0
      ? variants[0]
      : undefined);
  const optionGroups = product.optionGroups.map((data) =>
    readFragment(productOptionGroupFragment, data),
  );
  const collections = product.collections
    .map((data) => readFragment(collectionFragment, data))
    .filter(
      (collection, index, list) =>
        list.findIndex((entry) => entry.slug === collection.slug) === index,
    );
  const prices = variants.map((variant) => variant.priceWithTax);
  const lowestPrice = prices.length ? Math.min(...prices) : undefined;
  const highestPrice = prices.length ? Math.max(...prices) : undefined;
  const hasPriceRange =
    lowestPrice !== undefined &&
    highestPrice !== undefined &&
    lowestPrice !== highestPrice;
  const hasAvailableVariant = variants.some(
    (variant) => variant.stockLevel !== "OUT_OF_STOCK",
  );
  const hasConfigurationChoices =
    optionGroups.length > 1 || (optionGroups[0]?.options.length ?? 0) > 1;
  const selectedSku = resolvedVariant
    ? getVariantSku(product, resolvedVariant.id)
    : undefined;
  const resolvedVariantOptions = resolvedVariant
    ? resolvedVariant.options
        .map((option) => `${option.group.name}: ${option.name}`)
        .join(" · ")
    : "";
  const selectedStatus = resolvedVariant
    ? resolvedVariant.stockLevel === "OUT_OF_STOCK"
      ? "Out of stock"
      : "Ready to order"
    : hasAvailableVariant
      ? "Configuration pending"
      : "Out of stock";
  const updatedAt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(product.updatedAt));

  return (
    <aside className="lg:sticky lg:top-24">
      <section className="relative min-w-0 overflow-hidden rounded-2xl border border-[color:var(--cyber-gold)]/16 bg-card/94 shadow-[0_28px_82px_rgba(0,0,0,.14)] backdrop-blur-xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[color:var(--cyber-gold)]/75 to-transparent" />
        <div className="absolute inset-y-0 left-0 w-1 bg-[color:var(--cyber-gold)]/70" />
        <div className="border-b border-[color:var(--cyber-gold)]/10 p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={hasAvailableVariant ? "secondary" : "destructive"}
                >
                  {hasAvailableVariant ? "In stock" : "Out of stock"}
                </Badge>
                <Badge variant="outline">{variants.length} variants</Badge>
                {selectedSku ? (
                  <Badge variant="outline">SKU {selectedSku}</Badge>
                ) : null}
              </div>

              <h1 className="mt-5 text-3xl font-semibold leading-[1.04] tracking-tight text-foreground sm:text-4xl">
                {product.name}
              </h1>
            </div>
            <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[color:var(--cyber-gold)]/14 bg-background/58 text-[color:var(--cyber-gold-soft)] shadow-[inset_0_1px_0_rgba(255,255,255,.04)] sm:flex">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>

          {collections.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {collections.slice(0, 4).map((collection) => (
                <Badge
                  asChild
                  key={collection.slug}
                  variant="outline"
                  className="px-3 py-1.5 text-[11px] font-medium tracking-normal"
                >
                  <Link
                    to="/collections/$collection"
                    params={{ collection: collection.slug }}
                  >
                    {collection.name}
                  </Link>
                </Badge>
              ))}
            </div>
          ) : null}
        </div>

        <div className="grid border-b border-[color:var(--cyber-gold)]/10 md:grid-cols-[minmax(0,1fr)_170px]">
          <div className="min-w-0 p-5 sm:p-7">
            <div className="flex items-center gap-2 text-[color:var(--cyber-gold-soft)]">
              <CircleDollarSign className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                Channel price
              </p>
            </div>
            <ProductPriceDisplay
              amount={resolvedVariant?.priceWithTax}
              currencyCode={activeChannel.defaultCurrencyCode}
              hasPriceRange={hasPriceRange}
              highestPrice={highestPrice}
              lowestPrice={lowestPrice}
            />
          </div>
          <dl className="grid grid-cols-3 border-t border-[color:var(--cyber-gold)]/10 bg-background/26 md:grid-cols-1 md:border-l md:border-t-0">
            <ProductFact label="Status" value={selectedStatus} />
            <ProductFact label="Variants" value={String(variants.length)} />
            <ProductFact label="Updated" value={updatedAt} />
          </dl>
        </div>

        <div className="border-b border-[color:var(--cyber-gold)]/10 bg-background/24 p-5 sm:p-7">
          <div className="rounded-2xl border border-[color:var(--cyber-gold)]/12 bg-card/78 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.04)]">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[color:var(--cyber-gold)]/14 bg-background/55 text-[color:var(--cyber-gold-soft)]">
                  <BadgeCheck className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--cyber-gold-soft)]">
                    Selected setup
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold text-foreground">
                    {resolvedVariant?.name ?? "Configuration pending"}
                  </p>
                </div>
              </div>
              {selectedSku ? (
                <span className="hidden shrink-0 rounded-full border border-[color:var(--cyber-gold)]/12 bg-background/58 px-2.5 py-1 text-xs text-foreground/55 sm:inline-flex">
                  {selectedSku}
                </span>
              ) : null}
            </div>
            {resolvedVariantOptions ? (
              <p className="mt-3 text-sm leading-6 text-foreground/55">
                {resolvedVariantOptions}
              </p>
            ) : null}
          </div>

          <div className="mt-5 flex items-center gap-3">
            <Layers3 className="h-5 w-5 shrink-0 text-[color:var(--cyber-gold-soft)]" />
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--cyber-gold-soft)]">
                Configuration
              </h2>
              <p className="mt-1 text-sm leading-6 text-foreground/55">
                {hasConfigurationChoices
                  ? `${optionGroups.length} option group${optionGroups.length === 1 ? "" : "s"} available`
                  : "Single ready-to-order setup"}
              </p>
            </div>
          </div>

          {hasConfigurationChoices ? (
            <div className="mt-5">
              <VariantSelector
                optionGroups={product.optionGroups ?? []}
                variants={product.variantList.items ?? []}
              />
            </div>
          ) : null}

          <div className="mt-6 rounded-2xl border border-[color:var(--cyber-gold)]/16 bg-card/86 p-4 shadow-[0_18px_48px_rgba(0,0,0,.12)]">
            <AddToCart product={product} />
          </div>
        </div>

        <div className="grid gap-3 p-5 text-sm text-foreground/60 sm:grid-cols-3 sm:p-7">
          <ProductAssuranceItem
            icon={<Zap className="h-4 w-4" />}
            title="Fast order"
            text="Quick cart handoff for repeat studio supply runs."
          />
          <ProductAssuranceItem
            icon={<PackageCheck className="h-4 w-4" />}
            title="Live inventory"
            text="Stock status comes from the active NTMS channel."
          />
          <ProductAssuranceItem
            icon={<ReceiptText className="h-4 w-4" />}
            title="Checkout ready"
            text="Shipping and payment continue from the cart."
          />
        </div>
      </section>
    </aside>
  );
}

function getVariantSku(
  product: ResultOf<typeof productFragment>,
  variantId: string,
) {
  const variant = product.variantList.items
    .map((data) => readFragment(variantFragment, data))
    .find((item) => item.id === variantId);

  return variant?.sku ?? "n/a";
}

function ProductPriceDisplay({
  amount,
  currencyCode,
  hasPriceRange,
  highestPrice,
  lowestPrice,
}: {
  amount?: string | number;
  currencyCode: string;
  hasPriceRange: boolean;
  highestPrice?: number;
  lowestPrice?: number;
}) {
  if (amount !== undefined) {
    return (
      <Price
        amount={amount}
        className="mt-3 text-4xl font-semibold tracking-tight text-[color:var(--cyber-gold-soft)] sm:text-5xl"
        currencyCode={currencyCode}
        currencyCodeClassName="text-sm text-foreground/50 sm:text-base"
      />
    );
  }

  if (lowestPrice === undefined) {
    return (
      <p className="mt-3 text-sm text-foreground/55">
        Pricing will appear when the catalog loads.
      </p>
    );
  }

  if (!hasPriceRange) {
    return (
      <Price
        amount={lowestPrice}
        className="mt-3 text-4xl font-semibold tracking-tight text-[color:var(--cyber-gold-soft)] sm:text-5xl"
        currencyCode={currencyCode}
        currencyCodeClassName="text-sm text-foreground/50 sm:text-base"
      />
    );
  }

  return (
    <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-1">
      <Price
        amount={lowestPrice}
        className="text-4xl font-semibold tracking-tight text-[color:var(--cyber-gold-soft)] sm:text-5xl"
        currencyCode={currencyCode}
        currencyCodeClassName="text-sm text-foreground/50 sm:text-base"
      />
      {highestPrice !== undefined ? (
        <div className="pb-1">
          <span className="text-sm text-foreground/45">to</span>
          <Price
            amount={highestPrice}
            className="text-xl font-semibold text-foreground/78"
            currencyCode={currencyCode}
            currencyCodeClassName="text-xs text-foreground/45"
          />
        </div>
      ) : null}
    </div>
  );
}

function ProductFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-r border-[color:var(--cyber-gold)]/10 p-4 last:border-r-0 md:border-b md:border-r-0 md:last:border-b-0">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/42">
        {label}
      </dt>
      <dd className="mt-1 truncate text-sm font-semibold text-foreground">
        {value}
      </dd>
    </div>
  );
}

function ProductAssuranceItem({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-[color:var(--cyber-gold)]/10 bg-background/40 p-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[color:var(--cyber-gold)]/14 bg-card/70 text-[color:var(--cyber-gold-soft)]">
        {icon}
      </span>
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-foreground/70">
        {title}
      </p>
      <p className="mt-1 leading-5">{text}</p>
    </div>
  );
}

export function ProductDetails({
  product,
}: {
  product: ResultOf<typeof productFragment>;
}) {
  if (!product.description) {
    return null;
  }

  return (
    <section className="mt-8 rounded-2xl border border-[color:var(--cyber-gold)]/12 bg-card/88 p-5 shadow-[0_20px_60px_rgba(0,0,0,.08)] backdrop-blur-xl sm:p-7">
      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10">
        <div>
          <div className="flex items-center gap-2 text-[color:var(--cyber-gold-soft)]">
            <Sparkles className="h-4 w-4" />
            <h2 className="text-xs font-semibold uppercase tracking-[0.22em]">
              Product Details
            </h2>
          </div>
          <p className="mt-3 max-w-sm text-sm leading-6 text-foreground/55">
            Technical notes, feature highlights, and product copy from the live
            NTMS catalog.
          </p>
        </div>
        <Prose
          className="max-w-none text-sm leading-7 text-foreground/68 prose-headings:text-2xl prose-p:my-0"
          html={product.description}
        />
      </div>
    </section>
  );
}
