import React from 'react';
import { Bet } from '../lib/types/bet';
import { TrendingUp, Globe } from 'lucide-react';

interface ActivityBetCardProps {
  bet: Bet;
  darkMode: boolean;
}

const categoryIconMap: Record<string, React.ReactNode> = {
  Crypto: <TrendingUp size={16} className="inline-block mr-1 align-text-bottom" />,
  General: <Globe size={16} className="inline-block mr-1 align-text-bottom" />,
};

export default function ActivityBetCard({ bet, darkMode }: ActivityBetCardProps) {
  const totalVotes = (bet.yay || 0) + (bet.nay || 0);
  const yayPct = totalVotes > 0 ? Math.round(((bet.yay || 0) / totalVotes) * 100) : 0;
  const nayPct = 100 - yayPct;

  return (
    <div className={`w-full rounded-xl shadow-md border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-4 transition-colors`}>
      {/* User vote badge */}
      {bet.userVote && (
        <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-3 ${
          bet.userVote === 'yay' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' 
            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
        }`}>
          You voted {bet.userVote === 'yay' ? 'YAY' : 'NAY'}
        </div>
      )}
      
      {/* Bet content */}
      <div className={`text-lg font-semibold mb-3 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
        {bet.content}
      </div>

      {/* Author and category */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
        {bet.pfpUrl ? (
          <img src={bet.pfpUrl} alt={bet.author} className="h-6 w-6 rounded-full object-cover" />
        ) : (
          <span className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-sm ${
            darkMode ? 'bg-purple-300 text-purple-900' : 'bg-purple-200 text-purple-700'
          }`}>
            {bet.author?.charAt(0).toUpperCase()}
          </span>
        )}
        <span>{bet.author}</span>
        <span className="mx-1">·</span>
        <span className="flex items-center gap-1">
          {categoryIconMap[bet.category]}
          {bet.category}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
        <div
          className="h-2 bg-green-400 rounded-l-full"
          style={{ width: `${yayPct}%` }}
        />
        <div
          className="h-2 bg-red-400 rounded-r-full"
          style={{ width: `${nayPct}%`, marginLeft: `${yayPct}%`, marginTop: '-8px' }}
        />
      </div>

      {/* Yay/Nay counts and percentages */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="text-green-500 font-medium">Yay: {bet.yay || 0}</span>
          <span className="text-gray-400">({yayPct}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-red-500 font-medium">Nay: {bet.nay || 0}</span>
          <span className="text-gray-400">({nayPct}%)</span>
        </div>
      </div>
    </div>
  );
} 