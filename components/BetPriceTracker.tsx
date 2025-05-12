import { useState, useEffect, useCallback } from 'react';
import { useAssetPrice } from '../hooks/useAssetPrice';

interface BetPriceTrackerProps {
  asset: string;
  startPrice: number;
  startTime: number;
  isPump: boolean;
  priceThreshold: number;
  darkMode?: boolean;
}

export default function BetPriceTracker({ 
  asset, 
  startPrice, 
  startTime, 
  isPump,
  priceThreshold,
  darkMode = false
}: BetPriceTrackerProps) {
  const [priceChange, setPriceChange] = useState<number>(0);
  const [thresholdMet, setThresholdMet] = useState<boolean>(false);
  const { price: currentPriceStr, isLoading, error } = useAssetPrice(asset, 30000);

  // Memoize the price update calculation
  const updatePriceChange = useCallback((priceStr: string) => {
    const currentPrice = parseFloat(priceStr.replace('$', ''));
    const changePercent = ((currentPrice - startPrice) / startPrice) * 100;
    setPriceChange(changePercent);
    setThresholdMet(Math.abs(changePercent) >= priceThreshold);
  }, [startPrice, priceThreshold]);

  useEffect(() => {
    if (currentPriceStr && !isLoading && !error) {
      updatePriceChange(currentPriceStr);
    }
  }, [currentPriceStr, isLoading, error, updatePriceChange]);

  // Base container styles that maintain consistent height
  const containerClasses = "h-[5rem] min-w-[200px] flex flex-col justify-center transition-all duration-300 ease-in-out";
  const priceContainerClasses = "flex items-center justify-between w-full transition-all duration-300 ease-in-out";
  
  if (isLoading) {
    return (
      <div className={containerClasses}>
        <div className={priceContainerClasses}>
          <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading price...</span>
          <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={containerClasses}>
        <div className={priceContainerClasses}>
          <span className="text-red-500 text-sm">{error}</span>
        </div>
      </div>
    );
  }

  const isPositiveChange = priceChange > 0;
  const changeColor = isPositiveChange ? 'text-green-500' : 'text-red-500';
  const changeText = `${isPositiveChange ? '+' : ''}${priceChange.toFixed(2)}%`;

  return (
    <div className={containerClasses}>
      <div className="space-y-2 w-full">
        <div className={priceContainerClasses}>
          <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-600'}`}>{asset} Price:</span>
          <span className={`font-mono font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'} transition-all duration-300`}>
            {currentPriceStr || '$0.00'}
          </span>
        </div>
        <div className={priceContainerClasses}>
          <div className="flex items-center space-x-2">
            <span className={`${darkMode ? 'text-gray-200' : 'text-gray-600'}`}>Change:</span>
            <span className={`font-mono font-medium ${darkMode ? (isPositiveChange ? 'text-green-400' : 'text-red-400') : (isPositiveChange ? 'text-green-500' : 'text-red-500')} min-w-[80px] text-right transition-all duration-300`}>
              {changeText}
            </span>
          </div>
          {thresholdMet && (
            <span className={`ml-1 px-1.5 py-0.5 ${darkMode ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800'} text-xs rounded-full whitespace-nowrap transition-all duration-300`}>
              Threshold Met!
            </span>
          )}
        </div>
      </div>
    </div>
  );
} 