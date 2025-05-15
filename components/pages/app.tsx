"use client";

import { SafeAreaContainer } from "@/components/safe-area-container";
import { useMiniAppContext } from "@/hooks/use-miniapp-context";
import { useState } from "react";
import Onboarding from "@/components/Onboarding";
import { useUIState } from "@/hooks/useUIState";
import BetCaster from "@/components/Betcaster";

const BETCASTER_ADDRESS = process.env.NEXT_PUBLIC_BETCASTER_ADDRESS as `0x${string}`;

export default function Home() {
  const { context } = useMiniAppContext();
  const [showOnboarding, setShowOnboarding] = useState(true);
  const { darkMode } = useUIState();
  return (
    <SafeAreaContainer insets={context?.client.safeAreaInsets}>
      {showOnboarding ? (
        <Onboarding darkMode={darkMode} onEnter={() => setShowOnboarding(false)} />
      ) : (
        <BetCaster betcasterAddress={BETCASTER_ADDRESS} />
      )}
    </SafeAreaContainer>
  );
}
