import React, { useEffect, useState, useRef } from 'react';
import HotBetCard from './HotBetCard';
import { Bet } from '../lib/types/bet';

interface ActivitiesCarouselProps {
  bets: Bet[];
  darkMode: boolean;
}

const CARD_CONFIGS = [
  { rotate: -18, x: -90, y: 30, z: 1, scale: 0.92 },
  { rotate: -9, x: -45, y: 15, z: 2, scale: 0.97 },
  { rotate: 0, x: 0, y: 0, z: 3, scale: 1.08 }, // Center card
  { rotate: 9, x: 45, y: 15, z: 2, scale: 0.97 },
  { rotate: 18, x: 90, y: 30, z: 1, scale: 0.92 },
];

export default function ActivitiesCarousel({ bets, darkMode }: ActivitiesCarouselProps) {
  const [centerIdx, setCenterIdx] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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
    <div className="relative flex items-center justify-center w-full" style={{ height: 340, maxWidth: 400 }}>
      {visibleIndices.map((betIdx, i) => {
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
      })}
    </div>
  );
}
