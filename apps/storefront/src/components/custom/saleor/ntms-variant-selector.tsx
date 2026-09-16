import clsx from "clsx";
import type {
  NtmsSaleorProductVariant,
  NtmsSaleorVariantAttributeValue,
} from "@/lib/saleor/catalog";

export type NtmsSaleorVariantAttributeGroup = {
  id: string;
  name: string;
  slug: string;
  values: NtmsSaleorVariantAttributeValue[];
};

const naturalOrder = new Intl.Collator("en", {
  numeric: true,
  sensitivity: "base",
});

const preferredAttributeOrder = ["type", "gauge", "size"];

const colorSwatches: [RegExp, string][] = [
  [/black|jet|charcoal/i, "#171717"],
  [/white|clear/i, "#f8fafc"],
  [/silver|chrome/i, "#a8afb8"],
  [/gray|grey|smoke/i, "#737b86"],
  [/gold/i, "#bc8a26"],
  [/bronze|copper/i, "#a96032"],
  [/brown|tan|nude|beige/i, "#9f6a43"],
  [/red|crimson|scarlet/i, "#bd3439"],
  [/orange/i, "#d9762a"],
  [/yellow/i, "#e6bc35"],
  [/green|olive|lime/i, "#3c825e"],
  [/blue|cyan|teal/i, "#277eab"],
  [/purple|violet|lavender/i, "#8053a6"],
  [/pink|rose|magenta/i, "#c26089"],
];

export function getSaleorVariantAttributeGroups(
  variants: NtmsSaleorProductVariant[],
): NtmsSaleorVariantAttributeGroup[] {
  const groups = new Map<
    string,
    NtmsSaleorVariantAttributeGroup & { order: number }
  >();
  let order = 0;

  for (const variant of getSelectableVariants(variants)) {
    for (const attribute of variant.attributes) {
      if (attribute.values.length === 0) {
        continue;
      }
      const current = groups.get(attribute.id) ?? {
        id: attribute.id,
        name: attribute.name,
        slug: attribute.slug,
        values: [],
        order: order++,
      };
      const valueIds = new Set(current.values.map((value) => value.id));
      for (const value of attribute.values) {
        if (!valueIds.has(value.id)) {
          current.values.push(value);
          valueIds.add(value.id);
        }
      }
      groups.set(attribute.id, current);
    }
  }

  return [...groups.values()]
    .filter((group) => group.values.length > 1)
    .sort(
      (left, right) =>
        getAttributePriority(left.name) - getAttributePriority(right.name) ||
        left.order - right.order ||
        naturalOrder.compare(left.name, right.name),
    )
    .map(({ order: _order, ...group }) => ({
      ...group,
      values: [...group.values].sort((left, right) =>
        naturalOrder.compare(left.name, right.name),
      ),
    }));
}

export function getPreferredSaleorVariant(
  variants: NtmsSaleorProductVariant[],
): NtmsSaleorProductVariant | undefined {
  return variants.find(isSaleorVariantAvailable) ?? variants[0];
}

export function isSaleorColorAttribute(
  group: Pick<NtmsSaleorVariantAttributeGroup, "name" | "slug">,
) {
  return /(?:^|[-_\s])colou?r(?:$|[-_\s])/i.test(`${group.name} ${group.slug}`);
}

export function getSaleorColorSwatch(valueName: string) {
  return (
    colorSwatches.find(([pattern]) => pattern.test(valueName))?.[1] ?? null
  );
}

export function isSaleorVariantAttributeValueAvailable(
  variants: NtmsSaleorProductVariant[],
  groups: NtmsSaleorVariantAttributeGroup[],
  selectedVariant: NtmsSaleorProductVariant,
  groupIndex: number,
  valueId: string,
) {
  const group = groups[groupIndex];
  if (!group) {
    return false;
  }

  return getSelectableVariants(variants).some(
    (variant) =>
      matchesPriorSelections(variant, groups, selectedVariant, groupIndex) &&
      getAttributeValueId(variant, group.id) === valueId,
  );
}

export function resolveSaleorVariantAttributeSelection(
  variants: NtmsSaleorProductVariant[],
  groups: NtmsSaleorVariantAttributeGroup[],
  selectedVariant: NtmsSaleorProductVariant,
  groupIndex: number,
  valueId: string,
): NtmsSaleorProductVariant {
  const group = groups[groupIndex];
  if (!group) {
    return selectedVariant;
  }

  const selectable = getSelectableVariants(variants);
  return (
    selectable.find(
      (variant) =>
        matchesPriorSelections(variant, groups, selectedVariant, groupIndex) &&
        getAttributeValueId(variant, group.id) === valueId,
    ) ?? selectedVariant
  );
}

export function NtmsSaleorVariantSelector({
  groups,
  onSelectVariant,
  selectedVariant,
  variants,
}: {
  groups: NtmsSaleorVariantAttributeGroup[];
  onSelectVariant: (variantId: string) => void;
  selectedVariant: NtmsSaleorProductVariant;
  variants: NtmsSaleorProductVariant[];
}) {
  if (groups.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6" data-saleor-variant-attribute-selector>
      {groups.map((group, groupIndex) => {
        const selectedValueId = getAttributeValueId(selectedVariant, group.id);
        const isColorAttribute = isSaleorColorAttribute(group);

        return (
          <div data-saleor-variant-attribute-name={group.name} key={group.id}>
            <div className="mb-2.5 flex items-baseline justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#86868b]">
                {group.name}
              </span>
              <span className="text-xs text-[#1d1d1f] font-medium">
                {group.values.find((v) => v.id === selectedValueId)?.name}
              </span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {group.values.map((value) => {
                const selected = selectedValueId === value.id;
                const swatch = isColorAttribute
                  ? getSaleorColorSwatch(value.name)
                  : null;
                const available = isSaleorVariantAttributeValueAvailable(
                  variants,
                  groups,
                  selectedVariant,
                  groupIndex,
                  value.id,
                );

                return (
                  <button
                    aria-label={`Select ${group.name}: ${value.name}`}
                    aria-pressed={selected}
                    className={clsx(
                      "min-h-11 rounded-xl px-4 py-2 text-left text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]/40 disabled:cursor-not-allowed disabled:opacity-30",
                      {
                        "border-2 border-[#0071e3] bg-white text-[#1d1d1f] shadow-sm":
                          selected,
                        "border border-[#d2d2d7]/80 bg-[#f5f5f7]/60 text-[#1d1d1f] hover:border-[#86868b] hover:bg-white":
                          !selected && available,
                      },
                    )}
                    disabled={!available}
                    key={value.id}
                    onClick={() => {
                      const next = resolveSaleorVariantAttributeSelection(
                        variants,
                        groups,
                        selectedVariant,
                        groupIndex,
                        value.id,
                      );
                      onSelectVariant(next.id);
                    }}
                    title={`${group.name}: ${value.name}`}
                    type="button"
                  >
                    {isColorAttribute ? (
                      <span
                        aria-hidden="true"
                        className="mr-2 inline-block h-4 w-4 shrink-0 rounded-full border border-black/10 shadow-inner align-[-0.15em]"
                        data-saleor-variant-color-swatch={
                          swatch ? "resolved" : "fallback"
                        }
                        style={swatch ? { backgroundColor: swatch } : undefined}
                      />
                    ) : null}
                    {value.name}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function getAttributePriority(name: string) {
  const index = preferredAttributeOrder.indexOf(name.trim().toLowerCase());
  return index === -1 ? preferredAttributeOrder.length : index;
}

function getSelectableVariants(variants: NtmsSaleorProductVariant[]) {
  const inStock = variants.filter(isSaleorVariantAvailable);
  return inStock.length > 0 ? inStock : variants;
}

function isSaleorVariantAvailable(variant: NtmsSaleorProductVariant) {
  return (
    typeof variant.quantityAvailable === "number" &&
    Number.isFinite(variant.quantityAvailable) &&
    variant.quantityAvailable > 0
  );
}

function matchesPriorSelections(
  variant: NtmsSaleorProductVariant,
  groups: NtmsSaleorVariantAttributeGroup[],
  selectedVariant: NtmsSaleorProductVariant,
  groupIndex: number,
) {
  return groups.slice(0, groupIndex).every((group) => {
    const selectedValueId = getAttributeValueId(selectedVariant, group.id);
    return (
      !selectedValueId ||
      getAttributeValueId(variant, group.id) === selectedValueId
    );
  });
}

function getAttributeValueId(
  variant: NtmsSaleorProductVariant,
  attributeId: string,
) {
  return variant.attributes.find((attribute) => attribute.id === attributeId)
    ?.values[0]?.id;
}
