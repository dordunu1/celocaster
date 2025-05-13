import { TickerItem } from '../types/bet';

const ALPHA_VANTAGE_KEY = process.env.NEXT_PUBLIC_MARKET_API_KEY;

// Helper function to delay execution
const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Helper function to check if CoinGecko API is available
const checkCoinGeckoAPI = async (): Promise<boolean> => {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/ping');
    return response.ok;
  } catch {
    return false;
  }
};

export const marketService = {
  // Fetch crypto prices from our API route
  async getCryptoPrices(): Promise<TickerItem[]> {
    try {
      const response = await fetch('/api/market');
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.crypto || [];

    } catch (error) {
      console.error('Error fetching crypto prices:', error);
      // Return default values if API fails
      return [
        { symbol: 'BTC', price: 54890.23 },
        { symbol: 'ETH', price: 3240.58 },
        { symbol: 'BNB', price: 420.15 },
        { symbol: 'SOL', price: 176.94 },
        { symbol: 'XRP', price: 0.62 },
        { symbol: 'USDT', price: 1.00 },
        { symbol: 'USDC', price: 1.00 },
        { symbol: 'ADA', price: 0.48 },
        { symbol: 'AVAX', price: 35.25 },
        { symbol: 'DOGE', price: 0.12 }
      ];
    }
  }
}; 