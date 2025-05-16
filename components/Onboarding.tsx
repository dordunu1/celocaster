import React, { useEffect, useState, useRef } from 'react';
import HotBetCard from './HotBetCard';
import { betService } from '../lib/services/betService';
import { Bet } from '../lib/types/bet';

interface OnboardingProps {
  darkMode: boolean;
  onEnter: () => void;
}

const CARD_CONFIGS = [
  { rotate: -18, x: -90, y: 30, z: 1, scale: 0.92 },
  { rotate: -9, x: -45, y: 15, z: 2, scale: 0.97 },
  { rotate: 0, x: 0, y: 0, z: 3, scale: 1.08 }, // Center card
  { rotate: 9, x: 45, y: 15, z: 2, scale: 0.97 },
  { rotate: 18, x: 90, y: 30, z: 1, scale: 0.92 },
];

export default function Onboarding({ darkMode, onEnter }: OnboardingProps) {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [centerIdx, setCenterIdx] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function fetchBets() {
      setLoading(true);
      try {
        const allBets = await betService.getBets();
        // Pick 5 random bets with at least 1 vote, or just the latest 5
        const filtered = allBets.filter(b => (b.yay > 0 || b.nay > 0));
        let selected: Bet[] = [];
        if (filtered.length >= 5) {
          // Shuffle and pick 5
          selected = filtered.sort(() => 0.5 - Math.random()).slice(0, 5);
        } else {
          selected = allBets.slice(0, 5);
        }
        setBets(selected);
      } catch (err) {
        setBets([]);
      } finally {
        setLoading(false);
      }
    }
    fetchBets();
  }, []);

  // Responsive: adjust card configs for < 5 cards
  const getCardConfigs = (count: number) => {
    if (count === 5) return CARD_CONFIGS;
    if (count === 4) return [
      { rotate: -12, x: -60, y: 20, z: 1, scale: 0.95 },
      { rotate: -4, x: -20, y: 8, z: 2, scale: 1.01 },
      { rotate: 4, x: 20, y: 8, z: 2, scale: 1.01 },
      { rotate: 12, x: 60, y: 20, z: 1, scale: 0.95 },
    ];
    if (count === 3) return [
      { rotate: -8, x: -35, y: 10, z: 1, scale: 0.98 },
      { rotate: 0, x: 0, y: 0, z: 2, scale: 1.08 },
      { rotate: 8, x: 35, y: 10, z: 1, scale: 0.98 },
    ];
    if (count === 2) return [
      { rotate: -5, x: -18, y: 5, z: 1, scale: 1 },
      { rotate: 5, x: 18, y: 5, z: 1, scale: 1 },
    ];
    if (count === 1) return [
      { rotate: 0, x: 0, y: 0, z: 1, scale: 1.08 },
    ];
    return [];
  };

  const cardConfigs = getCardConfigs(bets.length);

  // Auto-advance carousel
  useEffect(() => {
    if (bets.length <= 1) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCenterIdx(idx => (idx + 1) % bets.length);
    }, 2000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [bets.length]);

  // Get the visible cards in order, centered on centerIdx
  const getVisibleCards = () => {
    if (bets.length === 0) return [];
    const n = cardConfigs.length;
    const indices = [];
    for (let i = -Math.floor(n / 2); i <= Math.floor(n / 2); i++) {
      indices.push((centerIdx + i + bets.length) % bets.length);
    }
    return indices.slice(0, n);
  };

  const visibleIndices = getVisibleCards();

  return (
    <div className={`flex flex-col min-h-screen items-center justify-center ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-800'} transition-colors duration-200`}>
      <h1 className="text-3xl font-bold mb-6 text-center">Welcome to CeloCaster</h1>
      <p className="mb-8 text-center text-lg max-w-xl">Predict, vote, and win! Here are some real predictions from our community:</p>
      <div className="relative flex items-center justify-center mb-10 w-full" style={{ height: 340, maxWidth: 400 }}>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
          </div>
        ) : (
          visibleIndices.map((betIdx, i) => {
            const bet = bets[betIdx];
            const cfg = cardConfigs[i] || { rotate: 0, x: 0, y: 0, z: 1, scale: 1 };
            return (
              <div
                key={bet.id + '-' + i}
                className="absolute left-1/2 top-1/2"
                style={{
                  transform: `translate(-50%, -50%) rotate(${cfg.rotate}deg) translate(${cfg.x}px, ${cfg.y}px) scale(${cfg.scale})`,
                  zIndex: cfg.z,
                  boxShadow: darkMode
                    ? '0 4px 32px 0 rgba(0,0,0,0.55)'
                    : '0 0 32px 0 #c084fc',
                  opacity: 1 - Math.abs((cardConfigs.length - 1) / 2 - i) * 0.08,
                  pointerEvents: 'none',
                  transition: 'transform 0.5s cubic-bezier(.4,2,.6,1), box-shadow 0.3s',
                }}
              >
                <HotBetCard bet={bet} darkMode={darkMode} />
              </div>
            );
          })
        )}
      </div>
      <button
        className={`mt-8 px-8 py-3 rounded-full text-lg font-semibold shadow-lg transition-colors duration-200 ${darkMode ? 'bg-yellow-300 hover:bg-yellow-200 text-black' : 'bg-yellow-300 hover:bg-yellow-400 text-black'}`}
        onClick={onEnter}
      >
        Enter App
      </button>
    </div>
  );
} 