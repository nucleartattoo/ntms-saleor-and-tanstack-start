import { chromium } from "playwright";

function usage() {
  console.log(`Usage:
  node scripts/smoke-ntms-saleor-checkout.mjs [--base-url URL] [--allow-test-gateway] [--complete-order]

Options:
  --base-url        Override the NTMS TanStack storefront URL.
  --allow-test-gateway  Permit selecting an explicitly enabled test-only gateway.
  --complete-order      Complete an order through that test-only gateway. Requires --allow-test-gateway.
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

function requireNonEmptyOption(option, value) {
  if (!value) {
    failUsage(`${option} requires a value`);
  }
  return value;
}

let cliBaseUrl;
let allowTestGateway = /^(1|true|yes|on)$/i.test(
  String(process.env.NTMS_SALEOR_CHECKOUT_SMOKE_ALLOW_TEST_GATEWAY ?? ""),
);
let completeOrder = /^(1|true|yes|on)$/i.test(
  String(process.env.NTMS_SALEOR_CHECKOUT_SMOKE_COMPLETE_ORDER ?? ""),
);
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
  if (arg === "--complete-order") {
    completeOrder = true;
    continue;
  }
  if (arg === "--allow-test-gateway") {
    allowTestGateway = true;
    continue;
  }

  failUsage(`unsupported argument: ${arg}`);
}

if (completeOrder && !allowTestGateway) {
  failUsage("--complete-order requires --allow-test-gateway");
}

const baseUrl = requireNonEmptyOption(
  "base URL",
  cliBaseUrl ||
    process.env.BASE_URL ||
    process.env.PLAYWRIGHT_BASE_URL ||
    "http://localhost:3010",
).replace(/\/+$/, "");
const saleorApiUrl = requireNonEmptyOption(
  "Saleor API URL",
  process.env.NTMS_SALEOR_API_URL ||
    process.env.SALEOR_API_ENDPOINT ||
    "https://ntms-saleor.kubernetes.nucleartattoosupply.com/graphql/",
);
const smokeProductPath =
  process.env.SALEOR_CHECKOUT_SMOKE_PRODUCT_PATH ||
  "/product/ntms-10272-natural-fawn-andrea-afferni-eternal-ink";
const headless = process.env.PLAYWRIGHT_HEADLESS !== "false";
const timeout = Number(process.env.NTMS_SALEOR_CHECKOUT_SMOKE_TIMEOUT ?? 60_000);
const storefrontFailurePatterns =
  /Storefront error|Something interrupted the storefront|useSaleorCart must be used within|createServerOnlyFn\(\) functions can only be called on the server|server-only/i;
const transientConsolePatterns = /TypeError: Failed to fetch/i;

const failures = [];
const consoleMessages = [];
const transientConsole = [];
const checked = [];

function recordFailure(label, error) {
  failures.push(`${label}: ${error?.stack || error?.message || error}`);
}

async function assertNoStorefrontError(page, label) {
  const bodyText = await page.locator("body").innerText({ timeout: 15_000 });
  if (storefrontFailurePatterns.test(bodyText)) {
    throw new Error(`${label} rendered error: ${bodyText.slice(0, 900)}`);
  }
}

async function waitForUsable(page, label) {
  await page.waitForLoadState("networkidle", { timeout: 25_000 }).catch(() => {
    // Client transitions can keep background work open; body assertions below
    // catch real storefront errors.
  });
  await assertNoStorefrontError(page, label);
}

async function waitForButtonEnabled(page, selector, label) {
  await page.locator(selector).waitFor({ state: "visible", timeout });
  await page.waitForFunction(
    (buttonSelector) => {
      const button = document.querySelector(buttonSelector);
      return button instanceof HTMLButtonElement && !button.disabled;
    },
    selector,
    { timeout },
  );
  checked.push(label);
}

async function cleanupSmokeCart(page) {
  const checkoutId = await page.evaluate(() =>
    window.localStorage.getItem("ntms-saleor-checkout-id"),
  );
  if (!checkoutId) {
    throw new Error("Smoke checkout ID was not stored in the browser session.");
  }

  const checkoutData = await saleorGraphql(
    `query NtmsCheckoutSmokeCleanup($id: ID!) {
      checkout(id: $id) { lines { id } }
    }`,
    { id: checkoutId },
  );
  const lineIds = checkoutData.checkout?.lines?.map((line) => line.id) ?? [];
  if (lineIds.length > 0) {
    const deleteData = await saleorGraphql(
      `mutation NtmsCheckoutSmokeCleanup($id: ID!, $lineIds: [ID!]!) {
        checkoutLinesDelete(id: $id, linesIds: $lineIds) {
          checkout { lines { id } }
          errors { field message code }
        }
      }`,
      { id: checkoutId, lineIds },
    );
    const payload = deleteData.checkoutLinesDelete;
    if (payload?.errors?.length || payload?.checkout?.lines?.length) {
      throw new Error(
        `Saleor checkout cleanup failed: ${JSON.stringify(payload?.errors ?? [])}`,
      );
    }
  }

  await page.evaluate(() =>
    window.localStorage.removeItem("ntms-saleor-checkout-id"),
  );
  checked.push("cart lines cleaned");
}

async function saleorGraphql(query, variables) {
  const response = await fetch(saleorApiUrl, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  const payload = await response.json();
  if (!response.ok || payload.errors?.length) {
    throw new Error(
      `Saleor GraphQL cleanup request failed: ${JSON.stringify(payload.errors ?? payload)}`,
    );
  }
  return payload.data;
}

async function runCheckoutSmoke(browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  let checkoutCreated = false;

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
    await page.goto(`${baseUrl}${smokeProductPath}`, {
      timeout,
      waitUntil: "networkidle",
    });
    await waitForUsable(page, "product");
    checked.push("product");

    await page.locator("[data-saleor-add-to-cart-button]").first().click();
    await page
      .locator("[data-saleor-cart-drawer]")
      .waitFor({ state: "visible", timeout });
    await page
      .locator("[data-saleor-cart-line]")
      .first()
      .waitFor({ state: "visible", timeout });
    checkoutCreated = true;
    checked.push("add to cart");

    await page.locator("[data-saleor-checkout-link]").click();
    await page.waitForURL(/\/checkout(?:\/)?$/, { timeout });
    await page
      .locator("[data-saleor-checkout-page]")
      .waitFor({ state: "visible", timeout });
    await waitForUsable(page, "checkout");
    checked.push("checkout page");

    const email = `ntms-smoke+${Date.now()}@example.com`;
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="phone"]').fill("+16502530000");
    await page.locator('input[name="firstName"]').fill("NTMS");
    await page.locator('input[name="lastName"]').fill("Smoke");
    await page.locator('input[name="companyName"]').fill("NTMS Smoke Studio");
    await page.locator('input[name="streetAddress1"]').fill("1600 Amphitheatre Pkwy");
    await page.locator('input[name="streetAddress2"]').fill("Suite 100");
    await page.locator('input[name="city"]').fill("Mountain View");
    await page.locator('input[name="countryArea"]').fill("CA");
    await page.locator('input[name="postalCode"]').fill("94043");
    await page.locator('select[name="country"]').selectOption("US");
    await page.locator("[data-saleor-checkout-save-address]").click();
    await page
      .locator("[data-saleor-shipping-method-button]")
      .first()
      .waitFor({ state: "visible", timeout });
    await waitForUsable(page, "address saved");
    checked.push("address saved");

    const shippingMethod = page
      .locator("[data-saleor-shipping-method-button]")
      .first();
    await shippingMethod.click();
    await page
      .locator('[data-saleor-shipping-method-selected="true"]')
      .first()
      .waitFor({ state: "visible", timeout });
    await Promise.race([
      page
        .locator("[data-saleor-payment-gateway-button]")
        .first()
        .waitFor({ state: "visible", timeout }),
      page
        .locator("[data-saleor-payment-unavailable]")
        .waitFor({ state: "visible", timeout }),
    ]);
    await waitForUsable(page, "shipping selected");
    checked.push("shipping selected");

    const supportedUnsafeGateway = page
      .locator(
        [
          '[data-saleor-payment-gateway-kind="legacy-dummy"][data-saleor-payment-gateway-supported="true"]',
          '[data-saleor-payment-gateway-kind="payment-app-dummy"][data-saleor-payment-gateway-supported="true"]',
          '[data-saleor-payment-gateway-kind="legacy-stripe"][data-saleor-payment-gateway-supported="true"]',
        ].join(", "),
      )
      .first();
    const supportedProductionGateways = page.locator(
      [
        '[data-saleor-payment-gateway-kind="stripe"][data-saleor-payment-gateway-supported="true"]',
        '[data-saleor-payment-gateway-kind="paypal"][data-saleor-payment-gateway-supported="true"]',
      ].join(", "),
    );
    const supportedGatewayCount = await page
      .locator(
        '[data-saleor-payment-gateway-button][data-saleor-payment-gateway-supported="true"]',
      )
      .count();
    const supportedUnsafeGatewayCount = await supportedUnsafeGateway.count();

    if (supportedUnsafeGatewayCount > 0 && !allowTestGateway) {
      throw new Error(
        "A test-only or legacy payment gateway is selectable without the explicit smoke opt-in.",
      );
    }

    if (supportedGatewayCount === 0) {
      await page
        .locator("[data-saleor-payment-unavailable]")
        .waitFor({ state: "visible", timeout });
      if (await page.locator("[data-saleor-place-order-button]").isEnabled()) {
        throw new Error(
          "Place order is enabled even though no safe payment gateway is available.",
        );
      }
      const blockedGatewayCount = Number(
        (await page
          .locator("[data-saleor-checkout-payment-section]")
          .getAttribute("data-saleor-blocked-payment-gateway-count")) ?? "0",
      );
      if (blockedGatewayCount < 1) {
        throw new Error(
          "No payment gateway is available, but the storefront did not report a blocked gateway.",
        );
      }
      checked.push(`unsafe gateways blocked: ${blockedGatewayCount}`);
      return;
    }

    const placeOrderButton = page.locator("[data-saleor-place-order-button]");
    const productionGatewayCount = await supportedProductionGateways.count();
    if (completeOrder || productionGatewayCount === 0) {
      await supportedUnsafeGateway.waitFor({ state: "visible", timeout });
      await supportedUnsafeGateway.click();
      const selectedGatewayKind = await supportedUnsafeGateway.getAttribute(
        "data-saleor-payment-gateway-kind",
      );
      if (
        selectedGatewayKind !== "legacy-dummy" &&
        selectedGatewayKind !== "payment-app-dummy"
      ) {
        throw new Error(
          `Only a dummy gateway can be used by the explicit test flow, got ${selectedGatewayKind || "unknown"}.`,
        );
      }
      checked.push(`test payment gateway: ${selectedGatewayKind}`);
      await waitForButtonEnabled(
        page,
        "[data-saleor-place-order-button]",
        "place order ready",
      );

      if (completeOrder) {
        await placeOrderButton.click();
        await page.waitForURL(/\/checkout\/confirmation\//, { timeout });
        await waitForUsable(page, "confirmation");
        checked.push("order completed");
      }
    } else {
      const readinessFailures = [];
      for (let index = 0; index < productionGatewayCount; index += 1) {
        const gateway = supportedProductionGateways.nth(index);
        const gatewayName = (await gateway.innerText()).replace(/\s+/g, " ");
        const gatewayKind = await gateway.getAttribute(
          "data-saleor-payment-gateway-kind",
        );
        await gateway.click();

        try {
          if (gatewayKind === "stripe") {
            await Promise.race([
              page
                .locator("[data-saleor-stripe-payment-form]")
                .waitFor({ state: "visible", timeout }),
              page
                .locator("[data-saleor-payment-initialization-error]")
                .waitFor({ state: "visible", timeout }),
            ]);
            const initializationError = page.locator(
              "[data-saleor-payment-initialization-error]",
            );
            if (await initializationError.isVisible()) {
              throw new Error(await initializationError.innerText());
            }
          } else if (gatewayKind === "paypal") {
            await Promise.race([
              page
                .locator(
                  '[data-saleor-paypal-payment-panel][data-saleor-paypal-payment-ready="true"]',
                )
                .waitFor({ state: "visible", timeout }),
              page
                .locator("[data-saleor-paypal-payment-error]")
                .waitFor({ state: "visible", timeout }),
            ]);
            const paypalError = page.locator(
              "[data-saleor-paypal-payment-error]",
            );
            if (await paypalError.isVisible()) {
              throw new Error(await paypalError.innerText());
            }
          } else {
            throw new Error(`unsupported gateway kind ${gatewayKind}`);
          }
          checked.push(`${gatewayKind} payment controls ready`);
        } catch (error) {
          readinessFailures.push(
            `${gatewayName}: ${error instanceof Error ? error.message : error}`,
          );
        }
      }

      if (readinessFailures.length > 0) {
        throw new Error(
          `Production payment readiness failed: ${readinessFailures.join("; ")}`,
        );
      }
    }
  } catch (error) {
    recordFailure(baseUrl, error);
  } finally {
    if (checkoutCreated && !completeOrder) {
      await cleanupSmokeCart(page).catch((error) =>
        recordFailure("checkout cleanup", error),
      );
    }
    await context.close();
  }
}

const browser = await chromium.launch({ headless });
try {
  await runCheckoutSmoke(browser);
} finally {
  await browser.close();
}

const result = {
  ok: failures.length === 0,
  baseUrl,
  checked,
  allowTestGateway,
  completeOrder,
  failures,
  severeConsole: consoleMessages.filter((line) =>
    storefrontFailurePatterns.test(line),
  ),
  transientConsole: transientConsole.slice(-5),
};

if (failures.length > 0) {
  console.error(JSON.stringify(result, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(result, null, 2));
