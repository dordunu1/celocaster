import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { farcasterFrame } from "@farcaster/frame-wagmi-connector";
import { createConfig, http, WagmiProvider } from "wagmi";
import { monadTestnet } from "wagmi/chains";

const MONAD_RPC_URLS = [
  process.env.NEXT_PUBLIC_MONAD_RPC_1,
  process.env.NEXT_PUBLIC_MONAD_RPC_2,
  process.env.NEXT_PUBLIC_MONAD_RPC_3,
  process.env.NEXT_PUBLIC_MONAD_RPC_4,
  process.env.NEXT_PUBLIC_MONAD_RPC_5,
  process.env.NEXT_PUBLIC_MONAD_RPC_6,
  process.env.NEXT_PUBLIC_MONAD_RPC_7,
].filter(Boolean);

// TODO: wagmi currently only supports a single transport per chain. For fallback, custom logic is needed.
// For now, use the first available RPC.
export const config = createConfig({
  chains: [monadTestnet],
  transports: {
    [monadTestnet.id]: http(MONAD_RPC_URLS[0]),
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
