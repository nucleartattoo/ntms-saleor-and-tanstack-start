import clsx from "clsx";
import type { FragmentOf } from "gql.tada";
import { readFragment } from "@/gql/graphql";
import {
  productOptionGroupFragment,
  variantFragment,
} from "@/lib/vendure/fragments/product";
import { useProduct } from "./product-context";

interface VariantSelectorProps {
  optionGroups: Array<FragmentOf<typeof productOptionGroupFragment>>;
  variants: Array<FragmentOf<typeof variantFragment>>;
}

export function VariantSelector({
  optionGroups,
  variants,
}: VariantSelectorProps) {
  const { state, updateOption } = useProduct();

  const processedOptionGroups = optionGroups.map((groupFrag) =>
    readFragment(productOptionGroupFragment, groupFrag),
  );

  const processedVariants = variants.map((variantFrag) =>
    readFragment(variantFragment, variantFrag),
  );

  // Don't render if no options or only one option
  const hasNoOptionsOrJustOneOption =
    !processedOptionGroups.length ||
    (processedOptionGroups.length === 1 &&
      processedOptionGroups[0]?.options.length === 1);

  if (hasNoOptionsOrJustOneOption) {
    return null;
  }

  // Create combinations for availability checking
  const combinations = processedVariants.map((variant) => ({
    id: variant.id,
    availableForSale: variant.stockLevel !== "OUT_OF_STOCK",
    options: variant.options.reduce(
      (acc, option) => {
        acc[option.group.code] = option.code;
        return acc;
      },
      {} as Record<string, string>,
    ),
  }));

  return (
    <div className="space-y-5">
      {processedOptionGroups.map((optionGroup) => (
        <div key={optionGroup.id}>
          <dl>
            <dt className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-foreground/55">
              {optionGroup.name}
            </dt>
            <dd className="flex flex-wrap gap-2">
              {optionGroup.options.map((option) => {
                // Check if this option would be available with current selections
                const potentialSelection = {
                  ...state,
                  [optionGroup.code]: option.code,
                };
                // Remove image from selection check
                delete potentialSelection.image;

                const isAvailableForSale = combinations.some(
                  (combination) =>
                    combination.availableForSale &&
                    Object.entries(potentialSelection).every(
                      ([key, value]) => combination.options[key] === value,
                    ),
                );

                const isSelected = state[optionGroup.code] === option.code;

                return (
                  <button
                    key={option.code}
                    type="button"
                    onClick={() => updateOption(optionGroup.code, option.code)}
                    disabled={!isAvailableForSale}
                    aria-pressed={isSelected}
                    title={`${optionGroup.name}: ${option.name}${
                      !isAvailableForSale ? " (Out of Stock)" : ""
                    }`}
                    className={clsx(
                      "flex min-w-12 items-center justify-center rounded-full border border-black/10/12 bg-background/55 px-3.5 py-2 text-sm transition-all duration-200",
                      {
                        "cursor-default border-black/10/36 bg-[#0071e3]/10 text-foreground shadow-[0_8px_20px_rgba(247,200,31,.08)]":
                          isSelected,
                        "hover:border-black/10/24 hover:bg-[#0071e3]/7":
                          !isSelected && isAvailableForSale,
                        "relative z-10 cursor-not-allowed overflow-hidden bg-foreground/6 text-foreground/45 before:absolute before:inset-x-0 before:-z-10 before:h-px before:-rotate-45 before:bg-[#0071e3]/18":
                          !isAvailableForSale,
                      },
                    )}
                  >
                    {option.name}
                  </button>
                );
              })}
            </dd>
          </dl>
        </div>
      ))}
    </div>
  );
}
