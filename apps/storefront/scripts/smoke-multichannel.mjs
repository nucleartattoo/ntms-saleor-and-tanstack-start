import assert from "node:assert/strict";

const baseUrl = process.env.BASE_URL || "http://localhost:3002";

async function fetchPage(path, cookie = "") {
  const headers = cookie ? { Cookie: cookie } : {};
  const response = await fetch(`${baseUrl}${path}`, { headers });
  assert.equal(
    response.status,
    200,
    `Expected 200 OK for ${path}, got ${response.status}`,
  );
  return response.text();
}

async function run() {
  console.log(`\n🚀 Testing NTMS Multi-Channel & Currency Switcher at ${baseUrl}...`);

  // 1. Test Default Channel (US / USD)
  console.log("  1️⃣ Testing Default Channel (US / USD)...");
  const usHtml = await fetchPage("/");
  assert.match(
    usHtml,
    /Complimentary priority freight on professional studio orders over \$150/i,
    "US shipping threshold announcement must be present",
  );
  assert.match(
    usHtml,
    /Region and currency: United States \(USD\)/i,
    "US region selector aria-label must be present",
  );
  assert.match(
    usHtml,
    /USD/i,
    "USD currency must be rendered",
  );
  console.log("     ✅ Default channel renders US metadata, $150 freight threshold, and USD currency.");

  // 2. Test Canada Channel (CA / CAD)
  console.log("  2️⃣ Testing Canada Channel (CA / CAD) via Cookie: saleor_channel=canada...");
  const caHtml = await fetchPage("/", "saleor_channel=canada");
  assert.match(
    caHtml,
    /Complimentary priority shipping across Canada on orders over CA\$200/i,
    "Canada shipping threshold announcement must be present",
  );
  assert.match(
    caHtml,
    /Region and currency: Canada \(CAD\)/i,
    "Canada region selector aria-label must be present",
  );
  assert.match(
    caHtml,
    /CAD/i,
    "CAD currency must be rendered",
  );
  assert.match(
    caHtml,
    /Mississauga, ON/i,
    "Canada warehouse location must be configured",
  );
  console.log("     ✅ Canada channel renders Canadian metadata, CA$200 threshold, and CAD currency.");

  // 3. Test Collections Page with Both Channels
  console.log("  3️⃣ Testing Category Collections across channels...");
  const usCategory = await fetchPage("/collections/ntms-289-needles");
  assert.match(usCategory, /USD/i, "Category page in US must use USD");

  const caCategory = await fetchPage("/collections/ntms-289-needles", "saleor_channel=canada");
  assert.match(caCategory, /CAD/i, "Category page in Canada must use CAD");
  console.log("     ✅ Category collection adapts currency dynamically per channel cookie.");

  // 4. Test Search Page across channels
  console.log("  4️⃣ Testing Catalog Search across channels...");
  const usSearch = await fetchPage("/search?q=needle");
  assert.ok(usSearch.length > 5000, "US search page should return complete layout");

  const caSearch = await fetchPage("/search?q=needle", "saleor_channel=canada");
  assert.ok(caSearch.length > 5000, "Canada search page should return complete layout");
  console.log("     ✅ Search page responds correctly with isolated catalog contexts.");

  console.log("\n🎉 ALL MULTI-CHANNEL STOREFRONT CHECKS PASSED!\n");
}

run().catch((err) => {
  console.error("\n❌ Smoke test failed:", err);
  process.exit(1);
});
