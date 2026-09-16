import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import {
  DEFAULT_SALEOR_CHANNEL,
  getSaleorChannelConfig,
  SALEOR_CHANNEL_COOKIE,
  SALEOR_CHANNELS,
  type SaleorChannelConfig,
} from "./channels";

export const getActiveChannelAction = createServerFn({ method: "GET" }).handler(
  async (): Promise<SaleorChannelConfig> => {
    try {
      const cookieChannel = getCookie(SALEOR_CHANNEL_COOKIE);
      return getSaleorChannelConfig(cookieChannel);
    } catch {
      return getSaleorChannelConfig(DEFAULT_SALEOR_CHANNEL);
    }
  },
);

export const setActiveChannelAction = createServerFn({ method: "POST" })
  .validator((data: { channel: string }) => {
    return z.object({ channel: z.string() }).parse(data);
  })
  .handler(
    async ({
      data,
    }): Promise<{ success: boolean; channel: SaleorChannelConfig }> => {
      if (data.channel in SALEOR_CHANNELS) {
        setCookie(SALEOR_CHANNEL_COOKIE, data.channel, {
          path: "/",
          maxAge: 60 * 60 * 24 * 365, // 1 year
          sameSite: "lax",
        });
        return { success: true, channel: SALEOR_CHANNELS[data.channel] };
      }
      return {
        success: false,
        channel: SALEOR_CHANNELS[DEFAULT_SALEOR_CHANNEL],
      };
    },
  );
