"use client";

import { SafeAreaContainer } from "@/components/safe-area-container";
import { useMiniAppContext } from "@/hooks/use-miniapp-context";
import { useState, useEffect } from "react";
import Onboarding from "@/components/Onboarding";
import { useUIState } from "@/hooks/useUIState";
import BetCaster from "@/components/Betcaster";

const BETCASTER_ADDRESS = process.env.NEXT_PUBLIC_BETCASTER_ADDRESS as `0x${string}`;

export default function Home() {
  const { context } = useMiniAppContext();
  const { darkMode } = useUIState();
  const [showOnboarding, setShowOnboarding] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const onboarded = localStorage.getItem('betcasterOnboarded');
      if (onboarded === 'true') {
        setShowOnboarding(false);
      }
    }
  }, []);

  const handleEnter = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('betcasterOnboarded', 'true');
    }
    setShowOnboarding(false);
  };

  return (
    <SafeAreaContainer insets={context?.client.safeAreaInsets}>
      {showOnboarding ? (
        <Onboarding darkMode={darkMode} onEnter={handleEnter} />
      ) : (
        <BetCaster betcasterAddress={BETCASTER_ADDRESS} />
      )}
    </SafeAreaContainer>
  );
}
