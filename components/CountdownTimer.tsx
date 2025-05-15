'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  expiryTime: number;
  darkMode: boolean;
  status?: string;
}

export default function CountdownTimer({ expiryTime, darkMode, status }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isExpired, setIsExpired] = useState(false);

  const calculateTimeLeft = useCallback(() => {
    const now = Date.now();
    const diff = expiryTime - now;

    if (diff <= 0) {
      setIsExpired(true);
      return "Resolving";
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }, [expiryTime]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateTimeLeft]);

  return (
    <div className={`flex items-center ${isExpired ? 'text-yellow-500' : darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
      <Clock size={12} className="mr-1" />
      <span className="text-xs">
        {status === 'RESOLVED' ? 'Resolved' : isExpired ? 'Resolving' : timeLeft + ' left'}
      </span>
    </div>
  );
} 