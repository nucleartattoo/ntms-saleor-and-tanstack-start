import type { ResultOf } from "gql.tada";
import Grid from "@/components/custom/grid";
import { ProductCard } from "@/components/custom/product-card";
import type searchResultFragment from "@/lib/vendure/fragments/search-result";

export default function ProductGridItems({
  products,
  currencyCode,
}: {
  products: ResultOf<typeof searchResultFragment>[];
  currencyCode: string;
}) {
  return (
    <>
      {products.map((product, index) => (
        <Grid.Item key={product.slug} className="animate-fadeIn">
          <ProductCard
            currencyCode={currencyCode}
            product={product}
            priority={index < 4}
          />
        </Grid.Item>
      ))}
    </>
  );
}
