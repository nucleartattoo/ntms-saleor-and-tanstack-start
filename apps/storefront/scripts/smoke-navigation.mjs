import { chromium } from "playwright";

const defaultBaseUrls = {
  saleor: "http://localhost:3010",
  vendure: "http://localhost:3010",
};

function usage() {
  console.log(`Usage:
  node scripts/smoke-navigation.mjs [--backend vendure|saleor] [--base-url URL]

Options:
  --backend    Storefront backend to smoke. Accepts vendure or saleor.
  --base-url   Override the target storefront URL.
`);
}

function failUsage(message) {
  console.error(`FAIL: ${message}`);
  usage();
  process.exit(2);
}

function requireArgValue(option, index, args) {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    failUsage(`${option} requires a value`);
  }
  return value;
}

function normalizeSmokeBackend(value) {
  switch (value) {
    case "vendure":
      return "vendure";
    case "saleor":
    case "ntms":
      return "saleor";
    default:
      failUsage(`unsupported backend: ${value} (expected vendure or saleor)`);
  }
}

function requireNonEmptyOption(option, value) {
  if (!value) {
    failUsage(`${option} requires a value`);
  }
  return value;
}

let cliBaseUrl;
let backendInput = process.env.SMOKE_BACKEND ?? "saleor";
const args = process.argv.slice(2);

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (arg === "-h" || arg === "--help" || arg === "help") {
    usage();
    process.exit(0);
  }
  if (arg === "--base-url") {
    cliBaseUrl = requireArgValue(arg, index, args);
    index += 1;
    continue;
  }
  if (arg.startsWith("--base-url=")) {
    cliBaseUrl = requireNonEmptyOption("--base-url", arg.slice(11));
    continue;
  }
  if (arg === "--backend") {
    backendInput = requireArgValue(arg, index, args);
    index += 1;
    continue;
  }
  if (arg.startsWith("--backend=")) {
    backendInput = requireNonEmptyOption("--backend", arg.slice(10));
    continue;
  }

  failUsage(`unsupported argument: ${arg}`);
}

const smokeBackend = normalizeSmokeBackend(backendInput);
const baseUrl = requireNonEmptyOption(
  "base URL",
  cliBaseUrl ||
    process.env.BASE_URL ||
    process.env.PLAYWRIGHT_BASE_URL ||
    defaultBaseUrls[smokeBackend],
).replace(/\/+$/, "");
const headless = process.env.PLAYWRIGHT_HEADLESS !== "false";
const timeout = Number(process.env.NAVIGATION_SMOKE_TIMEOUT ?? 45_000);
const navigationRetries = Number(process.env.NAVIGATION_SMOKE_RETRIES ?? 2);
const saleorSmokeProductPath =
  process.env.SALEOR_NAVIGATION_SMOKE_PRODUCT_PATH ||
  "/product/ntms-10272-natural-fawn-andrea-afferni-eternal-ink";
const saleorConfigurableSmokeProductPath =
  process.env.SALEOR_CONFIGURABLE_SMOKE_PRODUCT_PATH ||
  "/product/ntms-8256-papa-cartridges";
const saleorConfigurableSmokeProductName =
  process.env.SALEOR_CONFIGURABLE_SMOKE_PRODUCT_NAME || "Papa Cartridges";
const saleorConfigurableVariantMinimum = Number(
  process.env.SALEOR_CONFIGURABLE_VARIANT_MINIMUM ?? 99,
);
const saleorMobileCategoryLabels = [
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
const storefrontFailurePatterns =
  /Storefront error|Something interrupted the storefront|useSaleorCart must be used within|createServerOnlyFn\(\) functions can only be called on the server|server-only/i;
const saleorBrandPattern = /nuclear tattoo supply/i;
const transientConsolePatterns = /TypeError: Failed to fetch/i;
const retryableNavigationPatterns =
  /net::ERR_NETWORK_CHANGED|net::ERR_CONNECTION_RESET|net::ERR_HTTP2_PROTOCOL_ERROR/i;

const failures = [];
const results = [];

function recordFailure(label, error) {
  failures.push(`${label}: ${error?.stack || error?.message || error}`);
}

async function assertNoStorefrontError(page, label) {
  const bodyText = await page.locator("body").innerText({ timeout: 15_000 });
  if (storefrontFailurePatterns.test(bodyText)) {
    throw new Error(`${label} rendered error: ${bodyText.slice(0, 900)}`);
  }
}

async function assertSaleorBrand(page, label) {
  if (smokeBackend !== "saleor") {
    return;
  }

  const bodyText = await page.locator("body").innerText({ timeout: 15_000 });
  if (!saleorBrandPattern.test(bodyText)) {
    throw new Error(`${label} did not render the Nuclear Tattoo Supply brand`);
  }
}

async function waitForUsable(page, label) {
  await page.waitForLoadState("networkidle", { timeout: 25_000 }).catch(() => {
    // Dynamic storefront calls can keep the page busy; body and route-error
    // assertions below are the source of truth for this smoke.
  });
  await assertNoStorefrontError(page, label);
  await assertSaleorBrand(page, label);
}

async function gotoWithRetry(page, url, label) {
  let lastError;
  for (let attempt = 0; attempt <= navigationRetries; attempt += 1) {
    try {
      await page.goto(url, { timeout, waitUntil: "networkidle" });
      return;
    } catch (error) {
      lastError = error;
      const message = error?.stack || error?.message || String(error);
      if (
        attempt >= navigationRetries ||
        !retryableNavigationPatterns.test(message)
      ) {
        throw error;
      }
      await page.waitForTimeout(1_000 * (attempt + 1));
    }
  }

  throw lastError;
}

async function clickFirstLink(page, selector, label, urlPattern) {
  const link = page.locator(selector).first();
  const href = await link.getAttribute("href", { timeout: 25_000 });
  if (!href) {
    throw new Error(`No ${label} link found`);
  }

  await link.click();
  await page.waitForURL(urlPattern, { timeout: 25_000 });
  await waitForUsable(page, `${label} ${href}`);
  return href;
}

async function clickSaleorAddButton(page, label) {
  const button = page.locator("[data-saleor-add-to-cart-button]").first();
  await button.waitFor({ state: "visible", timeout: 25_000 });
  await button.click();
  await page.locator("[data-saleor-cart-drawer]").waitFor({
    state: "visible",
    timeout: 25_000,
  });
  await page.locator("[data-saleor-cart-line]").first().waitFor({
    state: "visible",
    timeout: 25_000,
  });
  await assertNoStorefrontError(page, `${label} add`);
}

async function verifySaleorConfigurableVariantSelection(page) {
  await gotoWithRetry(
    page,
    `${baseUrl}/search?q=${encodeURIComponent(saleorConfigurableSmokeProductName)}`,
    "saleor configurable product search",
  );
  await waitForUsable(page, "saleor configurable product search");

  const configurableCard = page
    .locator("[data-saleor-product-card]")
    .filter({ hasText: saleorConfigurableSmokeProductName })
    .first();
  await configurableCard.waitFor({ state: "visible", timeout: 25_000 });
  if (
    (await configurableCard.locator("[data-saleor-add-to-cart-button]").count()) >
    0
  ) {
    throw new Error("Configurable product card exposes a direct add-to-cart action");
  }
  await configurableCard.locator("[data-saleor-choose-options]").click();
  await page.waitForURL(
    (url) => url.pathname === saleorConfigurableSmokeProductPath,
    { timeout: 25_000 },
  );

  await gotoWithRetry(
    page,
    `${baseUrl}${saleorConfigurableSmokeProductPath}`,
    "saleor configurable product",
  );
  await waitForUsable(page, "saleor configurable product");

  const renderedVariantCount = Number(
    (await page.locator("[data-saleor-variant-count]").textContent())?.replace(/,/g, ""),
  );
  if (
    !Number.isFinite(renderedVariantCount) ||
    renderedVariantCount < saleorConfigurableVariantMinimum
  ) {
    throw new Error(
      `Expected at least ${saleorConfigurableVariantMinimum} configurable variants, found ${renderedVariantCount}`,
    );
  }

  const selector = page.locator("[data-saleor-variant-attribute-selector]");
  await selector.waitFor({ state: "visible", timeout: 25_000 });
  for (const attributeName of ["Type", "Gauge", "Size"]) {
    const group = selector.locator(
      `[data-saleor-variant-attribute-name=${JSON.stringify(attributeName)}]`,
    );
    await group.waitFor({ state: "visible", timeout: 25_000 });
    if ((await group.locator("button").count()) < 2) {
      throw new Error(`Expected multiple ${attributeName} options`);
    }
  }

  const selectedSku = page.locator("[data-saleor-selected-sku]");
  const initialSku = (await selectedSku.textContent())?.trim();
  if (!initialSku) {
    throw new Error("Configurable product did not expose its selected SKU");
  }

  const typeGroup = selector.locator(
    `[data-saleor-variant-attribute-name=${JSON.stringify("Type")}]`,
  );
  const alternateType = typeGroup
    .locator('button[aria-pressed="false"]:not([disabled])')
    .first();
  if ((await alternateType.count()) === 0) {
    throw new Error("Could not find an alternate in-stock Type option");
  }
  await alternateType.click();
  await page.waitForFunction(
    (previousSku) =>
      document.querySelector("[data-saleor-selected-sku]")?.textContent?.trim() !==
      previousSku,
    initialSku,
    { timeout: 10_000 },
  );

  const afterTypeSku = (await selectedSku.textContent())?.trim();
  if (!afterTypeSku || afterTypeSku === initialSku) {
    throw new Error("Selecting Type did not update the configured variant");
  }
}

async function verifySaleorMobileCategoryNavigation(browser) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();

  try {
    await gotoWithRetry(page, baseUrl, "saleor mobile home");
    await waitForUsable(page, "saleor mobile home");

    const menuButton = page.getByRole("button", {
      name: "Browse categories",
    });
    await menuButton.waitFor({ state: "visible", timeout: 25_000 });
    await menuButton.click();

    const navigation = page.getByRole("navigation", {
      name: "Mobile categories",
    });
    await navigation.waitFor({ state: "visible", timeout: 25_000 });
    await page.waitForTimeout(600);

    const labels = (await navigation.getByRole("link").allTextContents()).map(
      (label) => label.trim(),
    );
    if (labels.join("|") !== saleorMobileCategoryLabels.join("|")) {
      throw new Error(
        `Expected mobile categories ${saleorMobileCategoryLabels.join(", ")}; received ${labels.join(", ")}`,
      );
    }

    const drawer = navigation.locator("xpath=..");
    const bounds = await drawer.boundingBox();
    if (
      !bounds ||
      bounds.x < -1 ||
      bounds.x > 1 ||
      bounds.width < 300 ||
      bounds.width > 370
    ) {
      throw new Error(
        `Mobile category drawer is not fully visible: ${JSON.stringify(bounds)}`,
      );
    }

    await navigation.getByRole("link", { name: "Needles" }).click();
    await page.waitForURL(/\/collections\/ntms-289-needles/, {
      timeout: 25_000,
    });
    await waitForUsable(page, "saleor mobile category navigation");
  } finally {
    await context.close();
  }
}

async function expectResultRange(page, selector, pattern, label) {
  const locator = page.locator(selector);
  await locator.waitFor({ state: "visible", timeout: 25_000 });
  await page.waitForFunction(
    ({ selector, source }) =>
      new RegExp(source).test(document.querySelector(selector)?.textContent || ""),
    { selector, source: pattern.source },
    { timeout: 25_000 },
  ).catch((error) => {
    throw new Error(`${label} did not render: ${error?.message || error}`);
  });
}

async function verifySaleorCatalogPagination(page) {
  await gotoWithRetry(
    page,
    `${baseUrl}/collections/ntms-91-inks?sort=name-a-z`,
    "saleor category pagination",
  );
  await waitForUsable(page, "saleor category pagination");

  await expectResultRange(
    page,
    "[data-saleor-category-result-range]",
    /^Showing 1-24 of [\d,]+$/,
    "Category page one",
  );

  await page
    .locator("[data-saleor-category-pagination]")
    .getByRole("link", { name: "Next" })
    .click();
  await page.waitForURL(
    (url) =>
      url.pathname === "/collections/ntms-91-inks" &&
      url.searchParams.get("page") === "2" &&
      Boolean(url.searchParams.get("after")),
    { timeout: 25_000 },
  );
  await expectResultRange(
    page,
    "[data-saleor-category-result-range]",
    /^Showing 25-48 of [\d,]+$/,
    "Category page two",
  );

  await page
    .locator("[data-saleor-category-pagination]")
    .getByRole("link", { name: "Previous" })
    .click();
  await page.waitForURL(
    (url) =>
      url.pathname === "/collections/ntms-91-inks" &&
      !url.searchParams.has("page") &&
      !url.searchParams.has("after"),
    { timeout: 25_000 },
  );
  await expectResultRange(
    page,
    "[data-saleor-category-result-range]",
    /^Showing 1-24 of [\d,]+$/,
    "Category return to page one",
  );

  await gotoWithRetry(
    page,
    `${baseUrl}/search?q=ink&sort=name-a-z`,
    "saleor search pagination",
  );
  await waitForUsable(page, "saleor search pagination");

  await expectResultRange(
    page,
    "[data-saleor-search-result-range]",
    /^1-24 shown$/,
    "Search page one",
  );

  await page
    .locator("[data-saleor-search-pagination]")
    .getByRole("link", { name: "Next" })
    .click();
  await page.waitForURL(
    (url) =>
      url.pathname === "/search" &&
      url.searchParams.get("page") === "2" &&
      Boolean(url.searchParams.get("after")),
    { timeout: 25_000 },
  );
  await expectResultRange(
    page,
    "[data-saleor-search-result-range]",
    /^25-48 shown$/,
    "Search page two",
  );
}

async function runTarget(browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  const consoleMessages = [];
  const transientConsole = [];

  page.on("console", (message) => {
    const text = message.text();
    const line = `${message.type()}: ${text}`;
    consoleMessages.push(line);
    if (storefrontFailurePatterns.test(text)) {
      failures.push(`console ${line}`);
    } else if (transientConsolePatterns.test(text)) {
      transientConsole.push(line);
    }
  });
  page.on("pageerror", (error) => recordFailure("pageerror", error));

  try {
    await gotoWithRetry(page, baseUrl, "home");
    await waitForUsable(page, "home");

    if (smokeBackend === "saleor") {
      const mobileMenuButton = page.getByRole("button", {
        name: "Browse categories",
      });
      if (await mobileMenuButton.isVisible()) {
        throw new Error("Mobile category button is visible on desktop");
      }
      await verifySaleorMobileCategoryNavigation(browser);
      await verifySaleorCatalogPagination(page);
    }

    await clickFirstLink(
      page,
      'a[href^="/collections/"]',
      "category",
      /\/collections\//,
    );
    await clickFirstLink(
      page,
      'a[href^="/product/"]',
      "product",
      /\/product\//,
    );
    if (smokeBackend === "saleor") {
      await gotoWithRetry(
        page,
        `${baseUrl}${saleorSmokeProductPath}`,
        "saleor add product",
      );
      await waitForUsable(page, "saleor add product");
      await clickSaleorAddButton(page, "saleor add product");
      await verifySaleorConfigurableVariantSelection(page);
    }

    await gotoWithRetry(page, `${baseUrl}/search?q=ink`, "search");
    await waitForUsable(page, "search");

    if (smokeBackend === "saleor") {
      await gotoWithRetry(page, `${baseUrl}/saleor-ntms`, "saleor-ntms");
      await page.waitForURL((url) => url.pathname === "/", {
        timeout: 25_000,
      });
      await waitForUsable(page, "saleor-ntms");
    }

    results.push({
      backend: smokeBackend,
      baseUrl,
      checked: [
        "home",
        "category click",
        "product click",
        ...(smokeBackend === "saleor"
          ? [
              "mobile category navigation",
              "category and search pagination",
              "saleor add to cart",
              "configurable variant selection",
            ]
          : []),
        "search",
        ...(smokeBackend === "saleor" ? ["legacy catalog redirect"] : []),
        ...(smokeBackend === "saleor" ? ["visible storefront brand"] : []),
      ],
      ok: true,
      severeConsole: consoleMessages.filter((line) =>
        storefrontFailurePatterns.test(line),
      ),
      transientConsole: transientConsole.slice(-5),
    });
  } catch (error) {
    recordFailure(baseUrl, error);
    results.push({
      backend: smokeBackend,
      baseUrl,
      consoleTail: consoleMessages.slice(-20),
      ok: false,
    });
  } finally {
    await context.close();
  }
}

const browser = await chromium.launch({ headless });
try {
  await runTarget(browser);
} finally {
  await browser.close();
}

if (failures.length > 0) {
  console.error(JSON.stringify({ failures, ok: false, results }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, results }, null, 2));
