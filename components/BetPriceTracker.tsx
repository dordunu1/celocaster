import { useState, useEffect, useCallback } from 'react';
import { useAssetPrice } from '../hooks/useAssetPrice';

interface BetPriceTrackerProps {
  asset: string;
  startPrice: number;
  startTime: number;
  isPump: boolean;
  priceThreshold: number;
  darkMode?: boolean;
  resolved: boolean;
}

export default function BetPriceTracker({ 
  asset, 
  startPrice, 
  startTime, 
  isPump,
  priceThreshold,
  darkMode = false,
  resolved
}: BetPriceTrackerProps) {
  const [priceChange, setPriceChange] = useState<number>(0);
  const [thresholdMet, setThresholdMet] = useState<boolean>(false);
  const { price: currentPriceStr, isLoading, error } = useAssetPrice(asset, 15000);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());
  const [timeSinceUpdate, setTimeSinceUpdate] = useState<number>(0);
  const [spinnerPercent, setSpinnerPercent] = useState<number>(0);

  // Memoize the price update calculation
  const updatePriceChange = useCallback((priceStr: string) => {
    const currentPrice = parseFloat(priceStr.replace('$', ''));
    const changePercent = ((currentPrice - startPrice) / startPrice) * 100;
    setPriceChange(changePercent);
    if (isPump) {
      setThresholdMet(changePercent >= priceThreshold);
    } else {
      setThresholdMet(changePercent <= -priceThreshold);
    }
  }, [startPrice, priceThreshold, isPump]);

  useEffect(() => {
    if (currentPriceStr && !isLoading && !error) {
      updatePriceChange(currentPriceStr);
      setLastUpdateTime(Date.now());
      setSpinnerPercent(0);
    }
  }, [currentPriceStr, isLoading, error, updatePriceChange]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (!isLoading) {
      interval = setInterval(() => {
        const elapsed = Date.now() - lastUpdateTime;
        const percent = Math.min((elapsed % 15000) / 150, 100);
        setSpinnerPercent(percent);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [lastUpdateTime, isLoading]);

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
    <div className={containerClasses + " !h-auto min-h-0 py-1"}>
      <div className="w-full">
        {/* Spinner and info at top */}
        <div className="flex items-center justify-between mb-1 min-h-[20px]">
          <div>
            {resolved ? (
              <span className={`inline-block px-2 py-0.5 ${
                thresholdMet 
                  ? (darkMode ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800')
                  : (darkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-700')
              } text-xs rounded-full whitespace-nowrap transition-all duration-300`}>
                {thresholdMet ? 'Threshold Met!' : 'Threshold Not Met'}
              </span>
            ) : (
              thresholdMet && (
                <span className={`inline-block px-2 py-0.5 ${darkMode ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800'} text-xs rounded-full whitespace-nowrap transition-all duration-300`}>
                  Threshold Met!
                </span>
              )
            )}
          </div>
          {/* Spinner for price update countdown */}
          {!isLoading && (
            <div className="relative w-5 h-5 ml-8 flex items-center justify-center">
              <svg className="absolute top-0 left-0" width="20" height="20">
                <circle
                  cx="10" cy="10" r="9"
                  fill="none"
                  stroke={darkMode ? '#a78bfa' : '#7c3aed'}
                  strokeWidth="2"
                  strokeDasharray={2 * Math.PI * 9}
                  strokeDashoffset={2 * Math.PI * 9 * (1 - spinnerPercent / 100)}
                  style={{ transition: 'stroke-dashoffset 0.1s linear' }}
                />
              </svg>
              <span className={`text-[10px] ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{Math.max(0, 15 - Math.floor((Date.now() - lastUpdateTime) / 1000))}s</span>
            </div>
          )}
          {isLoading && (
            <div className="flex items-center">
              <div className={`w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mr-2`}></div>
              <span className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Fetching new price...</span>
            </div>
          )}
        </div>
        {/* Asset header */}
        <div className="flex items-center mb-0.5">
          <img src={`/images/${asset.toLowerCase()}.svg`} alt={asset} className="w-4 h-4 mr-1" />
          <span className={`font-semibold text-sm ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{asset} Price</span>
        </div>
        {/* Price rows */}
        <div className="flex flex-col gap-0.5 mb-0.5">
          <div className="flex items-center justify-between text-sm">
            <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Opening Price:</span>
            <span className={`font-mono font-medium text-right w-32 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{startPrice ? `$${startPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Current Price:</span>
            <span className={`font-mono font-medium text-right w-32 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{currentPriceStr || '-'}</span>
          </div>
        </div>
        {/* Change */}
        <div className="flex items-center justify-between text-sm">
          <span className={`${darkMode ? 'text-gray-200' : 'text-gray-600'}`}>Change:</span>
          <span className={`font-mono font-medium ${darkMode ? (isPositiveChange ? 'text-green-400' : 'text-red-400') : (isPositiveChange ? 'text-green-500' : 'text-red-500')} min-w-[70px] text-right transition-all duration-300`}>
            {changeText}
          </span>
        </div>
      </div>
    </div>
  );
} 