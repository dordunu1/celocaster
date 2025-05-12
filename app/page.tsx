import { Metadata } from "next";
import App from "@/components/pages/app";
import { APP_URL } from "@/lib/constants";
import BetCaster from '../components/Betcaster';

// Contract address from deployments.json
const BETCASTER_ADDRESS = '0x8AEA4985c1739d21968659bE091A2c7be6eA48a7' as `0x${string}`;

const frame = {
  version: "next",
  imageUrl: `${APP_URL}/images/feed.png`,
  button: {
    title: "Launch Template",
    action: {
      type: "launch_frame",
      name: "Monad Farcaster MiniApp Template",
      url: APP_URL,
      splashImageUrl: `${APP_URL}/images/splash.png`,
      splashBackgroundColor: "#f7f7f7",
    },
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Monad Farcaster MiniApp Template",
    openGraph: {
      title: "Monad Farcaster MiniApp Template",
      description: "A template for building mini-apps on Farcaster and Monad",
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}

export default function Home() {
  return <BetCaster betcasterAddress={BETCASTER_ADDRESS} />;
}
