import React, { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';
import { betService } from '../lib/services/betService';
import { Bet } from '../lib/types/bet';

interface HotBetsRowProps {
  darkMode: boolean;
}

function HotBetCard({ bet, darkMode }: { bet: Bet, darkMode: boolean }) {
  const totalVotes = bet.yay + bet.nay;
  const yayPct = totalVotes > 0 ? Math.round((bet.yay / totalVotes) * 100) : 0;
  const nayPct = 100 - yayPct;
  const words = bet.content.split(' ');
  const shortContent = words.length > 3 ? words.slice(0, 3).join(' ') + '...' : bet.content;
  return (
    <div
      className={`flex items-center min-w-[220px] max-w-[320px] h-[28px] rounded-full shadow-md mx-1 px-2 border ${
        darkMode ? 'bg-purple-950 border-purple-700' : 'bg-white border-purple-300'
      } text-[11px] font-medium whitespace-nowrap overflow-hidden`}
      style={{ boxShadow: darkMode ? '0 1px 2px 0 #a855f7' : '0 1px 2px 0 #c084fc' }}
    >
      <Flame className="text-orange-500 mr-1 flex-shrink-0" size={13} />
      <span className={`font-bold mr-2 ${darkMode ? 'text-orange-200' : 'text-orange-600'}`}>Hot</span>
      <span className={`mr-2 truncate ${darkMode ? 'text-white' : 'text-purple-900'}`} style={{ maxWidth: 70 }}>{shortContent}</span>
      {bet.pfpUrl ? (
        <img src={bet.pfpUrl} alt={bet.author} className="h-4 w-4 rounded-full object-cover mr-1" />
      ) : (
        <span className={`h-4 w-4 rounded-full flex items-center justify-center font-bold mr-1 text-[10px] ${darkMode ? 'bg-purple-300 text-purple-900' : 'bg-purple-200 text-purple-700'}`}>{bet.author.charAt(0).toUpperCase()}</span>
      )}
      <span className={`mr-2 ${darkMode ? 'text-purple-200' : 'text-purple-700'}`}>{bet.author}</span>
      <span className={`mr-1 ${darkMode ? 'text-green-300' : 'text-green-600'}`}>Y:{bet.yay}</span>
      <span className={`mr-1 ${darkMode ? 'text-red-300' : 'text-red-600'}`}>N:{bet.nay}</span>
      <span className={`mr-1 ${darkMode ? 'text-green-300' : 'text-green-600'}`}>{yayPct}%</span>
      <span className={`${darkMode ? 'text-red-300' : 'text-red-600'}`}>{nayPct}%</span>
    </div>
  );
}

export default function HotBetsRow({ darkMode }: HotBetsRowProps) {
  const [hotBets, setHotBets] = useState<Bet[]>([]);

  useEffect(() => {
    async function fetchHotBets() {
      try {
        const allBets = await betService.getBets();
        const filtered = allBets.filter(b => (b.yay > 0 || b.nay > 0));
        filtered.sort((a, b) => {
          if (b.yay !== a.yay) return b.yay - a.yay;
          if (a.nay !== b.nay) return a.nay - b.nay;
          return b.timestamp - a.timestamp;
        });
        setHotBets(filtered.slice(0, 10));
      } catch (err) {
        // fail silently
      }
    }
    fetchHotBets();
  }, []);

  return (
    <div className={`overflow-x-auto ${darkMode ? 'bg-gray-800 text-gray-100 border-gray-700' : 'bg-white text-gray-800 border-gray-200'} border-b py-1 transition-colors duration-200`}>
      <div className="flex items-center space-x-2 animate-hotbets-scroll" style={{ minHeight: 30, width: 'max-content' }}>
        {hotBets.length > 0 ? (
          hotBets.map(bet => (
            <HotBetCard key={bet.id} bet={bet} darkMode={darkMode} />
          ))
        ) : (
          <span className={`inline-flex items-center mx-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>No hot bets yet.</span>
        )}
      </div>
      <style jsx>{`
        @keyframes hotbets-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-hotbets-scroll {
          animation: hotbets-scroll 30s linear infinite;
        }
      `}</style>
    </div>
  );
} 