import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { createContext, useContext, useState } from "react";
import { toast } from "sonner";
import { setActiveChannelAction } from "@/lib/saleor/channel-actions";
import {
  DEFAULT_SALEOR_CHANNEL,
  getSaleorChannelConfig,
  SALEOR_CHANNEL_LIST,
  SALEOR_CHANNEL_STORAGE_KEY,
  SALEOR_CHANNELS,
  type SaleorChannelConfig,
} from "@/lib/saleor/channels";

type NtmsChannelContextType = {
  currentChannel: SaleorChannelConfig;
  channels: SaleorChannelConfig[];
  isSwitching: boolean;
  switchChannel: (channelSlug: string) => Promise<void>;
};

const NtmsChannelContext = createContext<NtmsChannelContextType | undefined>(
  undefined,
);

export function NtmsChannelProvider({
  initialChannel,
  children,
}: {
  initialChannel?: SaleorChannelConfig;
  children: React.ReactNode;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [currentChannel, setCurrentChannel] = useState<SaleorChannelConfig>(
    initialChannel ?? SALEOR_CHANNELS[DEFAULT_SALEOR_CHANNEL],
  );
  const [isSwitching, setIsSwitching] = useState(false);

  const switchChannel = async (channelSlug: string) => {
    if (channelSlug === currentChannel.slug) return;
    if (!(channelSlug in SALEOR_CHANNELS)) return;

    setIsSwitching(true);
    try {
      const result = await setActiveChannelAction({
        data: { channel: channelSlug },
      });
      if (result.success) {
        const nextConfig = getSaleorChannelConfig(channelSlug);
        setCurrentChannel(nextConfig);
        try {
          window.localStorage.setItem(SALEOR_CHANNEL_STORAGE_KEY, channelSlug);
        } catch {
          // ignore localStorage failure
        }
        toast.success(
          `Switched to ${nextConfig.name} (${nextConfig.currency})`,
        );

        // Invalidate all saleor queries so catalog, pricing, and availability reload instantly
        await queryClient.invalidateQueries({ queryKey: ["saleor"] });
        await router.invalidate();
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to switch region",
      );
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <NtmsChannelContext.Provider
      value={{
        currentChannel,
        channels: SALEOR_CHANNEL_LIST,
        isSwitching,
        switchChannel,
      }}
    >
      {children}
    </NtmsChannelContext.Provider>
  );
}

export function useNtmsChannel(): NtmsChannelContextType {
  const context = useContext(NtmsChannelContext);
  if (!context) {
    return {
      currentChannel: SALEOR_CHANNELS[DEFAULT_SALEOR_CHANNEL],
      channels: SALEOR_CHANNEL_LIST,
      isSwitching: false,
      switchChannel: async () => {},
    };
  }
  return context;
}
