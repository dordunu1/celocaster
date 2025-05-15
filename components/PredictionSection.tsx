'use client';

import React from 'react';
import BetPriceTracker from './BetPriceTracker';

interface PredictionSectionProps {
  bet: {
    asset: string;
    startPrice: number;
    timestamp: number;
    predictionType: 'pump' | 'dump';
    priceThreshold: number;
    betAmount: number;
    yay: number;
    nay: number;
    expiryTime: number;
    endPrice?: number;
    thresholdMet?: boolean;
  };
  darkMode: boolean;
}

// Create a stable prediction section component
const PredictionSection = React.memo(({ bet, darkMode }: PredictionSectionProps) => {
  return (
    <div className="flex items-center justify-between min-h-[48px] transition-all duration-300 ease-in-out">
      <div className="min-w-[200px] flex justify-end">
        <BetPriceTracker
          asset={bet.asset}
          startPrice={bet.startPrice}
          startTime={bet.timestamp}
          isPump={bet.predictionType === 'pump'}
          priceThreshold={bet.priceThreshold}
          darkMode={darkMode}
          resolved={('status' in bet) ? bet.status === 'RESOLVED' : false}
          endPrice={typeof bet.endPrice === 'number' ? bet.endPrice : undefined}
          thresholdMet={typeof bet.thresholdMet === 'boolean' ? bet.thresholdMet : undefined}
        />
      </div>
    </div>
  );
});

PredictionSection.displayName = 'PredictionSection';

export default PredictionSection; 