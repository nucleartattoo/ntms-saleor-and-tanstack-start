import { Link } from "@tanstack/react-router";
import { Image } from "@unpic/react";
import type { ResultOf } from "gql.tada";
import { BadgeCheck, Trash2 } from "lucide-react";
import { DeleteItemButton } from "@/components/custom/cart/delete-item-button";
import { EditItemQuantityButton } from "@/components/custom/cart/edit-item-quantity-button";
import Price from "@/components/custom/price";
import { readFragment } from "@/gql/graphql";
import type activeOrderFragment from "@/lib/vendure/fragments/active-order";
import assetFragment from "@/lib/vendure/fragments/image";
import productFragment from "@/lib/vendure/fragments/product";

type MerchandiseSearchParams = {
  [key: string]: string;
};

export function CartItem({
  cart,
  item,
  closeCart,
}: {
  cart: ResultOf<typeof activeOrderFragment>;
  item: ResultOf<typeof activeOrderFragment>["lines"][number];
  closeCart: () => void;
}) {
  const merchandiseSearchParams = {} as MerchandiseSearchParams;
  const product = readFragment(productFragment, item.productVariant.product);
  const featuredAsset = readFragment(assetFragment, product.featuredAsset);

  item.productVariant.options.forEach((option) => {
    merchandiseSearchParams[option.group.code] = option.code;
  });
  const selectedOptions = item.productVariant.options
    .map((option) => option.name)
    .join(", ");

  return (
    <li className="overflow-hidden rounded-3xl border border-black/5 bg-white p-1 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
      <div className="flex w-full gap-3 p-3">
        <Link
          to={"/product/$productId"}
          params={{ productId: product.slug }}
          search={merchandiseSearchParams}
          onClick={closeCart}
          className="relative h-[88px] w-[88px] flex-none overflow-hidden rounded-2xl border border-black/5 bg-[#f5f5f7]"
          aria-label={`Open ${product.name}`}
        >
          {featuredAsset ? (
            <>
              <Image
                className="h-full w-full object-contain p-2"
                width={88}
                height={88}
                alt={item.productVariant.name}
                src={featuredAsset?.preview}
              />
              <span className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-md border border-emerald-400/20 bg-emerald-500/12 text-emerald-100 backdrop-blur-xl">
                <BadgeCheck className="h-3 w-3" />
              </span>
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-semibold uppercase tracking-[0.18em] text-foreground/35">
              NTMS
            </div>
          )}
        </Link>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <Link
            to={"/product/$productId"}
            params={{ productId: product.slug }}
            search={merchandiseSearchParams}
            onClick={closeCart}
            className="z-30 min-w-0"
          >
            <span className="line-clamp-2 text-sm font-semibold leading-5 text-foreground transition hover:text-[#0071e3]">
              {product.name}
            </span>
            {selectedOptions ? (
              <p className="mt-1 line-clamp-1 text-xs text-[#0071e3]">
                {selectedOptions}
              </p>
            ) : null}
            <p className="mt-1 truncate text-[11px] font-medium uppercase tracking-[0.12em] text-foreground/38">
              SKU {item.productVariant.sku}
            </p>
          </Link>

          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/40">
                Line total
              </p>
              <Price
                className="mt-1 text-sm font-semibold text-[#0071e3]"
                amount={item.linePriceWithTax}
                currencyCode={cart.currencyCode}
                currencyCodeClassName="text-[10px] text-foreground/38"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <div className="ml-auto flex h-9 flex-row items-center rounded-full border border-black/5 bg-[#f5f5f7] p-0.5">
                <EditItemQuantityButton item={item} type="minus" />
                <p className="w-7 text-center">
                  <span className="w-full text-sm font-semibold">
                    {item.quantity}
                  </span>
                </p>
                <EditItemQuantityButton item={item} type="plus" />
              </div>
              <DeleteItemButton
                icon={<Trash2 className="h-3.5 w-3.5" />}
                item={item}
              />
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}
