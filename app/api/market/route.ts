import { NextResponse } from 'next/server';

interface TickerItem {
  symbol: string;
  price: number;
}

const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const dynamic = 'force-dynamic'; // Disable static caching
export const revalidate = 30; // Revalidate every 30 seconds

export async function GET() {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      // Fetch crypto prices
      const cryptoResponse = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,binancecoin,solana,ripple,tether,usd-coin,cardano,avalanche-2,dogecoin&order=market_cap_desc&per_page=10&page=1&sparkline=false',
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          cache: 'no-cache'
        }
      );

      if (cryptoResponse.status === 429) {
        console.error('CoinGecko rate limit reached, attempt:', retryCount + 1);
        await delay(1000 * (retryCount + 1));
        retryCount++;
        continue;
      }

      let cryptoPrices: TickerItem[] = [];
      if (cryptoResponse.ok) {
        const data = await cryptoResponse.json();
        if (Array.isArray(data)) {
          cryptoPrices = data.map(coin => ({
            symbol: coin.symbol.toUpperCase(),
            price: coin.current_price || 0
          }));
        }
      } else {
        console.error('CoinGecko API error:', cryptoResponse.status);
      }

      // If no crypto prices were fetched, use defaults
      if (cryptoPrices.length === 0) {
        cryptoPrices = [
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

      // Return only crypto prices
      return NextResponse.json({
        crypto: cryptoPrices
      });

    } catch (error) {
      console.error('Market data fetch error:', error);
      if (retryCount === maxRetries - 1) {
        // Return default values on final retry
        return NextResponse.json({
          crypto: [
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
          ] as TickerItem[]
        });
      }
      await delay(1000 * (retryCount + 1));
      retryCount++;
    }
  }

  // This return is just to satisfy TypeScript
  return NextResponse.json({ crypto: [] });
} 