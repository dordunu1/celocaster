'use client';

import React from 'react';
import { Flame } from 'lucide-react';
import { Bet } from '../lib/types/bet';

interface HotBetCardProps {
  bet: Bet;
  darkMode: boolean;
}

const HotBetCard: React.FC<HotBetCardProps> = ({ bet, darkMode }) => {
  const totalVotes = bet.yay + bet.nay;
  const yayPct = totalVotes > 0 ? Math.round((bet.yay / totalVotes) * 100) : 0;
  const nayPct = 100 - yayPct;
  return (
    <div className={`flex flex-col min-w-[220px] max-w-[240px] rounded-xl shadow-lg mx-2 p-4 border-2 ${darkMode ? 'bg-purple-950 border-purple-700' : 'bg-white border-purple-300'} relative overflow-hidden`} style={{ boxShadow: darkMode ? '0 2px 16px 0 #a855f7' : '0 2px 16px 0 #c084fc' }}>
      <div className="flex items-center mb-2">
        <Flame className="text-orange-500 mr-2" size={20} />
        <span className={`font-bold text-sm ${darkMode ? 'text-orange-200' : 'text-orange-600'}`}>Hot</span>
      </div>
      <div className={`font-semibold text-base mb-2 ${darkMode ? 'text-white' : 'text-purple-900'}`}>{bet.content.length > 60 ? bet.content.slice(0, 57) + '...' : bet.content}</div>
      <div className="flex items-center mb-2">
        {bet.pfpUrl ? (
          <img src={bet.pfpUrl} alt={bet.author} className="h-7 w-7 rounded-full object-cover mr-2" />
        ) : (
          <div className={`h-7 w-7 rounded-full flex items-center justify-center font-bold mr-2 ${darkMode ? 'bg-purple-300 text-purple-900' : 'bg-purple-200 text-purple-700'}`}>{bet.author.charAt(0).toUpperCase()}</div>
        )}
        <span className={`text-xs font-medium ${darkMode ? 'text-purple-200' : 'text-purple-700'}`}>{bet.author}</span>
      </div>
      <div className="flex items-center mb-2">
        <span className={`text-xs font-semibold ${darkMode ? 'text-green-300' : 'text-green-600'}`}>Yay: {bet.yay}</span>
        <span className={`mx-2 text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>|</span>
        <span className={`text-xs font-semibold ${darkMode ? 'text-red-300' : 'text-red-600'}`}>Nay: {bet.nay}</span>
      </div>
      <div className="w-full h-3 bg-purple-100 dark:bg-purple-900 rounded-full overflow-hidden mb-1">
        <div className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-orange-400" style={{ width: yayPct + '%' }}></div>
      </div>
      <div className="flex justify-between text-xs font-semibold">
        <span className={darkMode ? 'text-green-300' : 'text-green-600'}>{yayPct}% Yay</span>
        <span className={darkMode ? 'text-red-300' : 'text-red-600'}>{nayPct}% Nay</span>
      </div>
    </div>
  );
};

export default HotBetCard; 