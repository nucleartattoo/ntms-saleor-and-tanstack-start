import fs from "node:fs/promises";
import path from "node:path";

const args = parseArgs(process.argv.slice(2));
const apiUrl =
  args["api-url"] ??
  process.env.NTMS_SALEOR_API_URL ??
  "http://localhost:8000/graphql/";
const channel = args.channel ?? process.env.NTMS_SALEOR_CHANNEL ?? "default-channel";
const reportPath = args["report-path"] ?? process.env.NTMS_SALEOR_VARIANT_CATALOG_REPORT;
const sampleLimit = positiveInteger(args["sample-limit"]) ?? 30;

const naturalOrder = new Intl.Collator("en", {
  numeric: true,
  sensitivity: "base",
});
const preferredAttributeOrder = ["type", "gauge", "size"];

async function main() {
  const products = await fetchProducts();
  const multiVariantProducts = products.filter(
    (product) => product.variants.length > 1,
  );
  const validations = multiVariantProducts.map(validateProduct);
  const failures = validations.filter((validation) => validation.failures.length > 0);
  const summary = {
    attributeDimensionDistribution: countBy(
      validations.filter((validation) => validation.groups.length > 0),
      (validation) => String(validation.groups.length),
    ),
    multiVariantProducts: multiVariantProducts.length,
    productsFetched: products.length,
    productsWithSelectorGroups: validations.filter(
      (validation) => validation.groups.length > 0,
    ).length,
    productsWithoutSelectorGroups: validations.filter(
      (validation) => validation.requiresSelector && validation.groups.length === 0,
    ).length,
    productsWithSingleSelectableVariant: validations.filter(
      (validation) => validation.selectableVariantCount === 1,
    ).length,
    productsWithValidationFailures: failures.length,
    variantsWithMissingAttributes: validations.reduce(
      (count, validation) => count + validation.variantsWithoutAttributes,
      0,
    ),
  };
  const report = {
    generatedAt: new Date().toISOString(),
    apiUrl,
    channel,
    status: failures.length === 0 ? "passed" : "failed",
    summary,
    failures: failures.slice(0, sampleLimit),
  };

  if (reportPath) {
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }
  console.log(JSON.stringify(report, null, 2));
  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

async function fetchProducts() {
  const query = `query NtmsSaleorVariantCatalogSmoke($after: String, $channel: String!, $first: Int!) {
    products(first: $first, after: $after, channel: $channel) {
      pageInfo { hasNextPage endCursor }
      edges {
        node {
          id
          name
          slug
          variants {
            id
            sku
            quantityAvailable
            attributes(variantSelection: ALL) {
              attribute { id name slug }
              values { id name }
            }
          }
        }
      }
    }
  }`;
  const products = [];
  let after = null;

  do {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { after, channel, first: 100 } }),
    });
    if (!response.ok) {
      throw new Error(`Saleor variant catalog query failed with HTTP ${response.status}.`);
    }
    const payload = await response.json();
    if (payload.errors?.length) {
      throw new Error("Saleor variant catalog query returned GraphQL errors.");
    }
    const connection = payload.data?.products;
    if (!connection) {
      throw new Error("Saleor variant catalog query returned no product connection.");
    }
    products.push(...connection.edges.map(({ node }) => normalizeProduct(node)));
    after = connection.pageInfo.hasNextPage ? connection.pageInfo.endCursor : null;
  } while (after);

  return products;
}

function normalizeProduct(product) {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    variants: (product.variants ?? []).map((variant) => ({
      attributes: (variant.attributes ?? [])
        .filter((assignment) => assignment.attribute && assignment.values?.length)
        .map((assignment) => ({
          id: assignment.attribute.id,
          name: assignment.attribute.name,
          slug: assignment.attribute.slug,
          values: assignment.values.map((value) => ({ id: value.id, name: value.name })),
        })),
      id: variant.id,
      quantityAvailable: variant.quantityAvailable,
      sku: variant.sku ?? "",
    })),
  };
}

function validateProduct(product) {
  const selectable = getSelectableVariants(product.variants);
  const groups = getAttributeGroups(selectable);
  const failures = [];
  const requiresSelector = selectable.length > 1;
  const variantsWithoutAttributes = selectable.filter(
    (variant) => variant.attributes.length === 0,
  ).length;
  if (requiresSelector && groups.length === 0) {
    failures.push("no selectable variant attributes");
  }
  if (variantsWithoutAttributes > 0) {
    failures.push(`${variantsWithoutAttributes} variants have no attribute assignments`);
  }

  for (const target of selectable) {
    let selected = getPreferredVariant(product.variants);
    if (!selected) {
      failures.push("product has no selectable variant");
      break;
    }
    for (let groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
      const group = groups[groupIndex];
      const targetValueId = getAttributeValueId(target, group.id);
      if (!targetValueId) {
        failures.push(`variant ${target.sku || target.id} is missing ${group.name}`);
        break;
      }
      const next = resolveSelection(
        product.variants,
        groups,
        selected,
        groupIndex,
        targetValueId,
      );
      if (!next || getAttributeValueId(next, group.id) !== targetValueId) {
        failures.push(
          `variant ${target.sku || target.id} cannot resolve ${group.name}=${targetValueId}`,
        );
        break;
      }
      selected = next;
    }
  }

  return {
    failures: uniqueSorted(failures),
    groups: groups.map((group) => ({
      name: group.name,
      valueCount: group.values.length,
    })),
    product: {
      id: product.id,
      name: product.name,
      slug: product.slug,
      variantCount: product.variants.length,
    },
    requiresSelector,
    selectableVariantCount: selectable.length,
    variantsWithoutAttributes,
  };
}

function getAttributeGroups(variants) {
  const groups = new Map();
  let order = 0;
  for (const variant of variants) {
    for (const attribute of variant.attributes) {
      const current = groups.get(attribute.id) ?? {
        id: attribute.id,
        name: attribute.name,
        order: order += 1,
        values: new Map(),
      };
      for (const value of attribute.values) {
        current.values.set(value.id, value.name);
      }
      groups.set(attribute.id, current);
    }
  }

  return [...groups.values()]
    .filter((group) => group.values.size > 1)
    .sort(
      (left, right) =>
        attributePriority(left.name) - attributePriority(right.name) ||
        left.order - right.order ||
        naturalOrder.compare(left.name, right.name),
    )
    .map((group) => ({
      ...group,
      values: [...group.values.entries()]
        .map(([id, name]) => ({ id, name }))
        .sort((left, right) => naturalOrder.compare(left.name, right.name)),
    }));
}

function resolveSelection(variants, groups, selectedVariant, groupIndex, valueId) {
  const group = groups[groupIndex];
  if (!group) return selectedVariant;
  return (
    getSelectableVariants(variants).find(
      (variant) =>
        matchesPriorSelections(variant, groups, selectedVariant, groupIndex) &&
        getAttributeValueId(variant, group.id) === valueId,
    ) ?? null
  );
}

function matchesPriorSelections(variant, groups, selectedVariant, groupIndex) {
  return groups.slice(0, groupIndex).every((group) => {
    const selectedValueId = getAttributeValueId(selectedVariant, group.id);
    return !selectedValueId || getAttributeValueId(variant, group.id) === selectedValueId;
  });
}

function getSelectableVariants(variants) {
  const inStock = variants.filter(
    (variant) =>
      typeof variant.quantityAvailable === "number" &&
      Number.isFinite(variant.quantityAvailable) &&
      variant.quantityAvailable > 0,
  );
  return inStock.length > 0 ? inStock : variants;
}

function getPreferredVariant(variants) {
  return getSelectableVariants(variants)[0] ?? null;
}

function getAttributeValueId(variant, attributeId) {
  return variant.attributes.find((attribute) => attribute.id === attributeId)?.values[0]?.id ?? null;
}

function attributePriority(name) {
  const index = preferredAttributeOrder.indexOf(String(name).trim().toLowerCase());
  return index === -1 ? preferredAttributeOrder.length : index;
}

function countBy(values, keyFor) {
  return values.reduce((counts, value) => {
    const key = keyFor(value);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function uniqueSorted(values) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function positiveInteger(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!argument.startsWith("--")) {
      throw new Error(`Unsupported argument: ${argument}`);
    }
    const [key, inlineValue] = argument.slice(2).split("=", 2);
    if (inlineValue !== undefined) {
      parsed[key] = inlineValue;
      continue;
    }
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = true;
      continue;
    }
    parsed[key] = next;
    index += 1;
  }
  return parsed;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
