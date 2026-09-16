import { describe, expect, test } from "vitest";
import {
  DEFAULT_SALEOR_CHANNEL,
  getSaleorChannelConfig,
  isValidSaleorChannel,
  SALEOR_CHANNEL_LIST,
  SALEOR_CHANNELS,
} from "./channels";

describe("Saleor multi-channel configuration", () => {
  test("defines default-channel (US) and canada channels", () => {
    expect(DEFAULT_SALEOR_CHANNEL).toBe("default-channel");
    expect(SALEOR_CHANNEL_LIST).toHaveLength(2);
    expect(SALEOR_CHANNELS["default-channel"]).toBeDefined();
    expect(SALEOR_CHANNELS.canada).toBeDefined();
  });

  test("validates channel slugs correctly", () => {
    expect(isValidSaleorChannel("default-channel")).toBe(true);
    expect(isValidSaleorChannel("canada")).toBe(true);
    expect(isValidSaleorChannel("invalid-channel")).toBe(false);
    expect(isValidSaleorChannel("")).toBe(false);
  });

  test("retrieves channel config with fallback to default-channel", () => {
    const usConfig = getSaleorChannelConfig("default-channel");
    expect(usConfig.currency).toBe("USD");
    expect(usConfig.currencySymbol).toBe("$");
    expect(usConfig.shippingThreshold).toBe(150);
    expect(usConfig.countryCode).toBe("US");

    const caConfig = getSaleorChannelConfig("canada");
    expect(caConfig.currency).toBe("CAD");
    expect(caConfig.currencySymbol).toBe("CA$");
    expect(caConfig.shippingThreshold).toBe(200);
    expect(caConfig.countryCode).toBe("CA");

    // Fallback on unknown or undefined
    const fallbackConfig = getSaleorChannelConfig("unknown");
    expect(fallbackConfig.slug).toBe(DEFAULT_SALEOR_CHANNEL);
    expect(fallbackConfig.currency).toBe("USD");

    const nullConfig = getSaleorChannelConfig(null);
    expect(nullConfig.slug).toBe(DEFAULT_SALEOR_CHANNEL);
  });
});
