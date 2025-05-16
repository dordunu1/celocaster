import React, { useState } from 'react';
import { useMyActivities } from '../hooks/useMyActivities';
import { useMiniAppContext } from '../hooks/use-miniapp-context';
import ActivityBetCard from './ActivityBetCard';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { HelpCircle } from 'lucide-react';

interface MyActivitiesProps {
  darkMode: boolean;
}

function ActivitySkeletonCard({ darkMode }: { darkMode: boolean }) {
  return (
    <motion.div
      className={`w-full rounded-xl shadow-md border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-4 mb-2 animate-pulse`}
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
    >
      <div className={`h-5 w-32 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} mb-4`} />
      <div className={`h-6 w-3/4 rounded-md ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} mb-3`} />
      <div className="flex items-center gap-2 mb-4">
        <div className={`h-6 w-6 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
        <div className={`h-4 w-20 rounded-md ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
        <div className={`h-4 w-16 rounded-md ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
      </div>
      <div className={`h-2 w-full rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} mb-2`} />
      <div className="flex items-center justify-between">
        <div className={`h-4 w-16 rounded-md ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
        <div className={`h-4 w-16 rounded-md ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
      </div>
    </motion.div>
  );
}

function EarningsTab({ myVotes, darkMode }: { myVotes: any[]; darkMode: boolean }) {
  // Calculate earnings data
  let totalPool = 0;
  let totalProfit = 0; // Only profit, not including original stake
  let totalLoss = 0;
  let totalBets = 0;
  let totalStaked = 0;

  myVotes.forEach(bet => {
    if (!bet || typeof bet.yay !== 'number' || typeof bet.nay !== 'number' || typeof bet.betAmount !== 'number' || !bet.userVote || !bet.status) return;
    const pool = (bet.yay + bet.nay) * bet.betAmount;
    totalPool += pool;
    totalBets++;
    totalStaked += bet.betAmount;
    // Only count resolved bets
    if (bet.status === 'RESOLVED') {
      let winningSide: 'yay' | 'nay' | undefined;
      if (bet.betType === 'voting') {
        if (bet.yay > bet.nay) winningSide = 'yay';
        else if (bet.nay > bet.yay) winningSide = 'nay';
        // If tie, no winner (skip)
      } else if (bet.betType === 'verified') {
        if (bet.predictionType === 'pump') {
          winningSide = bet.thresholdMet ? 'yay' : 'nay';
        } else if (bet.predictionType === 'dump') {
          winningSide = bet.thresholdMet ? 'yay' : 'nay';
        }
      }
      if (!winningSide) return; // skip ties or unknowns
      const S = bet.betAmount;
      const W = bet[winningSide] || 1;
      const L = bet[winningSide === 'yay' ? 'nay' : 'yay'] || 0;
      if (bet.userVote === winningSide) {
        // User won: profit is (S/W) * L
        totalProfit += (S / W) * L;
      } else {
        // User lost: loss is their stake
        totalLoss += S;
      }
    }
  });

  const data = [
    { name: 'Winnings', value: Number(totalProfit.toFixed(2)) },
    { name: 'Losses', value: Number(totalLoss.toFixed(2)) },
  ];
  const COLORS = ['#34d399', '#f87171'];

  const [showPopover, setShowPopover] = React.useState(false);
  const popoverRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowPopover(false);
      }
    }
    if (showPopover) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPopover]);

  return (
    <div className="w-full flex flex-col items-center">
      <div className="flex items-center justify-center mb-2 relative">
        <span className="text-xl font-bold mr-2">Earnings</span>
        <button
          className={`focus:outline-none ${darkMode ? 'text-gray-300 hover:text-purple-300' : 'text-gray-500 hover:text-purple-700'}`}
          onClick={() => setShowPopover(v => !v)}
          aria-label="Show earnings formula and breakdown"
        >
          <HelpCircle size={20} />
        </button>
        {showPopover && (
          <div
            ref={popoverRef}
            className={`absolute left-1/2 top-full mt-2 -translate-x-1/2 z-50 w-80 p-4 rounded-lg shadow-lg border ${darkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-900'}`}
            style={{ minWidth: 280 }}
          >
            <div className="font-semibold mb-2">How are Winnings and Losses calculated?</div>
            <div className="mb-2 text-sm">
              <b>Winnings (Profit) Formula:</b><br />
              <span className="font-mono">Profit = (S / W) × L</span><br />
              Where:<br />
              <span className="ml-2">S = your stake (CELO)</span><br />
              <span className="ml-2">W = total staked on winning side (CELO)</span><br />
              <span className="ml-2">L = total staked on losing side (CELO)</span>
            </div>
            <div className="mb-2 text-sm">
              <b>Losses:</b> If you lose, you lose your stake (S).
            </div>
            <div className="mb-2 text-sm">
              <b>Example:</b><br />
              You staked <b>4 CELO</b> on the winning side.<br />
              There were <b>3 winners</b> (total 12 CELO) and <b>2 losers</b> (total 8 CELO).<br />
              <span className="font-mono">Profit = (4 / 12) × 8 = 2.67 CELO</span><br />
              Your total payout = <b>6.67 CELO</b> (your stake + profit).
            </div>
            <div className="text-xs text-gray-400">Only resolved bets are included in these calculations.</div>
          </div>
        )}
      </div>
      <div className="mb-2 text-xs text-center text-gray-400 max-w-xs">
        <b>Note:</b> Rewards are calculated based on resolved bets you participated in, regardless of whether you have claimed your rewards.
      </div>
      <div className={`mb-4 text-center text-base font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} max-w-md mx-auto`}>
        This chart shows your total winnings (profit) and losses across all bets you voted on. Winnings are calculated as your share of the losing side's stake for bets you won. Losses are the total CELO you staked on losing bets. Only resolved bets are included.
      </div>
      <div className="w-full max-w-xs h-64 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <RechartsTooltip formatter={(value: any, name: string) => [`${value} CELO`, name]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-6 w-full max-w-xs">
        <table className="w-full text-sm text-left border-separate border-spacing-y-2">
          <tbody>
            <tr>
              <td className="text-gray-400">Total Pool Participated:</td>
              <td className="font-semibold text-gray-300">{totalPool.toFixed(2)} CELO</td>
            </tr>
            <tr>
              <td className="text-gray-400">Total Bets:</td>
              <td className="font-semibold text-gray-300">{totalBets}</td>
            </tr>
            <tr>
              <td className="text-gray-400">Total CELO Staked:</td>
              <td className="font-semibold text-gray-300">{totalStaked.toFixed(2)} CELO</td>
            </tr>
            <tr>
              <td className="text-green-400">Total Winnings (CELO):</td>
              <td className="font-semibold text-green-300">{totalProfit.toFixed(2)} CELO</td>
            </tr>
            <tr>
              <td className="text-red-400">Total Losses (CELO):</td>
              <td className="font-semibold text-red-300">{totalLoss.toFixed(2)} CELO</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function MyActivities({ darkMode }: MyActivitiesProps) {
  const [activeTab, setActiveTab] = useState<'bets' | 'votes' | 'earnings'>('bets');
  const { context } = useMiniAppContext();
  const { myBets, myVotes, loading } = useMyActivities(context?.user?.username, context?.user?.fid ? String(context.user.fid) : undefined);
  const [showSkeleton, setShowSkeleton] = useState(true);

  // Ensure skeleton is shown for at least 1 second
  React.useEffect(() => {
    if (!loading) {
      const timeout = setTimeout(() => setShowSkeleton(false), 1000);
      return () => clearTimeout(timeout);
    } else {
      setShowSkeleton(true);
    }
  }, [loading]);

  // Explanatory text for each tab
  const tabDescription = activeTab === 'bets'
    ? "These are bets you've created. Only you can see them here."
    : activeTab === 'votes'
    ? "These are bets you've voted on. Track your predictions and results."
    : "Earnings";

  // Decide which bets to show
  const showBets = activeTab === 'bets' ? myBets : activeTab === 'votes' ? myVotes : [];
  const emptyText = activeTab === 'bets'
    ? "You haven't created any bets yet."
    : activeTab === 'votes'
    ? "You haven't voted on any bets yet."
    : "No earnings data available.";

  return (
    <div className={`flex flex-col min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-800'} transition-colors duration-200`}>
      {/* Tabs */}
      <div className="sticky top-0 z-10 bg-opacity-95 backdrop-blur-sm" style={{ backgroundColor: darkMode ? '#1f2937' : '#f9fafb' }}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex space-x-4">
            <button
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === 'bets'
                  ? darkMode
                    ? 'bg-yellow-500 text-white'
                    : 'bg-yellow-500 text-white'
                  : darkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
              onClick={() => setActiveTab('bets')}
            >
              My Bets
            </button>
            <button
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === 'votes'
                  ? darkMode
                    ? 'bg-yellow-500 text-white'
                    : 'bg-yellow-500 text-white'
                  : darkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
              onClick={() => setActiveTab('votes')}
            >
              My Votes
            </button>
            <button
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === 'earnings'
                  ? darkMode
                    ? 'bg-yellow-500 text-white'
                    : 'bg-yellow-500 text-white'
                  : darkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
              onClick={() => setActiveTab('earnings')}
            >
              Earnings
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 container mx-auto px-4 py-6 flex flex-col items-center justify-center w-full">
        {showSkeleton ? (
          <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto">
            {[1, 2, 3].map(i => (
              <ActivitySkeletonCard key={i} darkMode={darkMode} />
            ))}
          </div>
        ) : (
          <>
            {activeTab === 'earnings' ? (
              <EarningsTab myVotes={myVotes} darkMode={darkMode} />
            ) : (
              <>
                <div className={`mb-6 text-center text-base font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} max-w-xs mx-auto`}>
                  {tabDescription}
                </div>
                {showBets.length === 0 ? (
                  <div className={`text-center text-lg ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-8`}>{emptyText}</div>
                ) : (
                  <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto">
                    {showBets.map(bet => (
                      <ActivityBetCard key={bet.id} bet={bet} darkMode={darkMode} />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}