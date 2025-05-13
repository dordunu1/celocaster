'use client';

import React from 'react';
import Image from 'next/image';
import { useMemo } from 'react';

interface TickerItemProps {
  symbol: string;
  price: number;
  darkMode: boolean;
}

const logoMap: Record<string, string> = {
  // Crypto - Top 10
  BTC: '/images/crypto/btc.svg',
  ETH: '/images/crypto/eth.svg',
  BNB: '/images/crypto/bnb.svg',
  SOL: '/images/crypto/sol.svg',
  XRP: '/images/crypto/xrp.svg',
  USDT: '/images/crypto/usdt.svg',
  USDC: '/images/crypto/usdc.svg',
  ADA: '/images/crypto/ada.svg',
  AVAX: '/images/crypto/avax.svg',
  DOGE: '/images/crypto/doge.svg'
};

export default function TickerItem({ symbol, price, darkMode }: TickerItemProps) {
  const logoUrl = useMemo(() => logoMap[symbol] || null, [symbol]);

  return (
    <span 
      className={`inline-flex items-center mx-6 ${
        darkMode ? 'text-gray-400' : 'text-gray-600'
      }`}
    >
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={symbol}
          width={20}
          height={20}
          className="mr-2"
        />
      ) : (
        <span className="font-bold mr-2">{symbol}</span>
      )}
      ${price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  );
} 