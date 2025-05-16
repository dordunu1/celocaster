import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { farcasterFrame } from "@farcaster/frame-wagmi-connector";
import { createConfig, http, WagmiProvider } from "wagmi";
import { celo } from "wagmi/chains";

const CELO_RPC_URL = process.env.NEXT_PUBLIC_CELO_RPC_1;

export const config = createConfig({
  chains: [celo],
  transports: {
    [celo.id]: http(CELO_RPC_URL),
  },
  connectors: [farcasterFrame()],
});

const queryClient = new QueryClient();

export default function FrameWalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
