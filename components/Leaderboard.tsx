'use client';

import React, { useEffect, useState } from 'react';
import { betService } from '../lib/services/betService';
import { Info } from 'lucide-react';

interface LeaderboardProps {
  darkMode: boolean;
}

export interface CreatorStats {
  address: string;
  author: string;
  totalBets: number;
  totalPool: number;
  pfpUrl?: string;
}

export interface VoterStats {
  userId: string;
  totalVoteAmount: number;
  username?: string;
  pfpUrl?: string;
}

export default function Leaderboard({ darkMode }: LeaderboardProps) {
  const [activeTab, setActiveTab] = useState<'creators' | 'voters'>('creators');

  const [topCreators, setTopCreators] = useState<CreatorStats[]>([]);
  const [loadingCreators, setLoadingCreators] = useState(true);
  const [errorCreators, setErrorCreators] = useState<string | null>(null);

  const [topVoters, setTopVoters] = useState<VoterStats[]>([]);
  const [loadingVoters, setLoadingVoters] = useState(true);
  const [errorVoters, setErrorVoters] = useState<string | null>(null);

  const [showVoterInfo, setShowVoterInfo] = useState(false);

  useEffect(() => {
    async function fetchLeaderboardData() {
      setLoadingCreators(true);
      setErrorCreators(null);
      try {
        const creators = await betService.getTopCreators(20);
        setTopCreators(creators);
      } catch (err) {
        console.error('Failed to fetch creator leaderboard data:', err);
        setErrorCreators('Failed to load creator leaderboard.');
      } finally {
        setLoadingCreators(false);
      }
    }

    if (activeTab === 'creators') {
      fetchLeaderboardData();
    }
  }, [activeTab]);

  useEffect(() => {
    async function fetchTopVotersData() {
      setLoadingVoters(true);
      setErrorVoters(null);
      try {
        const voters = await betService.getTopVoters(20);
        setTopVoters(voters);
      } catch (err) {
        console.error('Failed to fetch voter leaderboard data:', err);
        setErrorVoters('Failed to load voter leaderboard.');
      } finally {
        setLoadingVoters(false);
      }
    }

    if (activeTab === 'voters') {
      fetchTopVotersData();
    }
  }, [activeTab]);

  return (
    <div className={`flex flex-col items-center p-4 ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-800'} transition-colors duration-200 min-h-screen`}>
      <h1 className="text-2xl font-bold mb-6">Leaderboard</h1>

      <div className={`flex mb-6 rounded-md overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} transition-colors duration-200`}>
        <button
          className={`px-6 py-2 text-sm font-medium transition-colors duration-200 ${activeTab === 'creators' ? (darkMode ? 'bg-yellow-500 text-white' : 'bg-yellow-500 text-white') : (darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-300')}`}
          onClick={() => setActiveTab('creators')}
        >
          Top Creators
        </button>
        <button
          className={`px-6 py-2 text-sm font-medium transition-colors duration-200 ${activeTab === 'voters' ? (darkMode ? 'bg-yellow-500 text-white' : 'bg-yellow-500 text-white') : (darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-300')}`}
          onClick={() => setActiveTab('voters')}
        >
          Top Voters
        </button>
      </div>

      <div className="w-full max-w-md">
        {activeTab === 'creators' && (
          loadingCreators ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
            </div>
          ) : errorCreators ? (
            <div className="text-red-500 text-center py-8">{errorCreators}</div>
          ) : (topCreators.length === 0) ? (
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>No bet creators yet.</div>
          ) : (
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
              <div className={`grid grid-cols-3 gap-2 ${darkMode ? 'text-yellow-300' : 'text-yellow-800'} font-semibold border-b ${darkMode ? 'border-yellow-600' : 'border-yellow-200'} pb-2 mb-2`}>
                <span>Author</span>
                <span className="text-center">Total Bets</span>
                <span className="text-right">Total Pool (CELO)</span>
              </div>
              <div className="space-y-2">
                {topCreators.map((creator, index) => (
                  <div key={creator.address} className={`grid grid-cols-3 gap-2 items-center ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    <div className="flex items-center space-x-2">
                      {creator.pfpUrl ? (
                        <img 
                          src={creator.pfpUrl} 
                          alt={creator.author}
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className={`h-6 w-6 rounded-full ${darkMode ? 'bg-yellow-600' : 'bg-yellow-300'} flex items-center justify-center text-sm font-bold ${darkMode ? 'text-yellow-100' : 'text-yellow-900'}`}>
                          {creator.author ? creator.author.charAt(0).toUpperCase() : ''}
                        </div>
                      )}
                      <span className="truncate" title={creator.author}>{creator.author || 'Anonymous'}</span>
                    </div>
                    <span className="text-center">{creator.totalBets}</span>
                    <span className="text-right">{creator.totalPool.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        )}

        {activeTab === 'voters' && (
           loadingVoters ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
            </div>
          ) : errorVoters ? (
            <div className="text-red-500 text-center py-8">{errorVoters}</div>
          ) : (topVoters.length === 0) ? (
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>No top voters yet.</div>
          ) : (
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
               <div className={`grid grid-cols-2 gap-2 ${darkMode ? 'text-yellow-300' : 'text-yellow-800'} font-semibold border-b ${darkMode ? 'border-yellow-600' : 'border-yellow-200'} pb-2 mb-2`}>
                <span>Voter</span>
                <span className="text-right flex items-center justify-end">
                  Total Staked (CELO)
                  <button onClick={() => setShowVoterInfo(!showVoterInfo)} className="ml-1 focus:outline-none">
                    <Info size={16} className={`cursor-pointer ${darkMode ? 'text-yellow-300' : 'text-yellow-800'}`} />
                  </button>
                </span>
              </div>
              {showVoterInfo && (
                <div className={`absolute mt-2 p-3 text-xs rounded-md shadow-lg z-10 ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-white text-gray-700'} border ${darkMode ? 'border-gray-600' : 'border-gray-300'} max-w-xs right-4`}>
                  Total CELO tokens spent on voting (Yay or Nay).
                </div>
              )}
              <div className="space-y-2">
                {topVoters.map((voter, index) => (
                  <div key={voter.userId} className={`grid grid-cols-2 gap-2 items-center ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                     <div className="flex items-center space-x-2">
                      {voter.pfpUrl ? (
                        <img 
                          src={voter.pfpUrl} 
                          alt={voter.username || 'Voter'}
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className={`h-6 w-6 rounded-full ${darkMode ? 'bg-yellow-600' : 'bg-yellow-300'} flex items-center justify-center text-sm font-bold ${darkMode ? 'text-yellow-100' : 'text-yellow-900'}`}>
                          {voter.username ? voter.username.charAt(0).toUpperCase() : voter.userId.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="truncate" title={voter.username}>{voter.username || `User ${voter.userId}`}</span>
                    </div>
                    <span className="text-right">{voter.totalVoteAmount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
} 