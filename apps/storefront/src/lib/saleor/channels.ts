export type SaleorChannelConfig = {
  slug: string;
  name: string;
  shortName: string;
  countryCode: string;
  currency: string;
  currencySymbol: string;
  flag: string;
  shippingThreshold: number;
  shippingAnnouncement: string;
  warehouseLocation: string;
};

export const SALEOR_CHANNELS: Record<string, SaleorChannelConfig> = {
  "default-channel": {
    slug: "default-channel",
    name: "United States",
    shortName: "USA",
    countryCode: "US",
    currency: "USD",
    currencySymbol: "$",
    flag: "🇺🇸",
    shippingThreshold: 150,
    shippingAnnouncement:
      "Complimentary priority freight on professional studio orders over $150.",
    warehouseLocation: "United States Central Distribution",
  },
  canada: {
    slug: "canada",
    name: "Canada",
    shortName: "CAN",
    countryCode: "CA",
    currency: "CAD",
    currencySymbol: "CA$",
    flag: "🇨🇦",
    shippingThreshold: 200,
    shippingAnnouncement:
      "Complimentary priority shipping across Canada on orders over CA$200.",
    warehouseLocation: "Mississauga, ON Distribution Centre",
  },
};

export const SALEOR_CHANNEL_LIST: SaleorChannelConfig[] =
  Object.values(SALEOR_CHANNELS);

export const DEFAULT_SALEOR_CHANNEL = "default-channel";
export const SALEOR_CHANNEL_COOKIE = "saleor_channel";
export const SALEOR_CHANNEL_STORAGE_KEY = "saleor-ntms-channel";

export function isValidSaleorChannel(channel: string): boolean {
  return channel in SALEOR_CHANNELS;
}

export function getSaleorChannelConfig(
  channelSlug?: string | null,
): SaleorChannelConfig {
  if (channelSlug && channelSlug in SALEOR_CHANNELS) {
    return SALEOR_CHANNELS[channelSlug];
  }
  return SALEOR_CHANNELS[DEFAULT_SALEOR_CHANNEL];
}
