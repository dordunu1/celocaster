'use client';

import React from 'react';
import { X, TrendingUp, Globe } from 'lucide-react';
import Image from 'next/image';
import { useAssetPrice } from '../hooks/useAssetPrice';

// Temporary flag to disable bet creation
const IS_CREATION_DISABLED = true;

interface CategoryOption {
  id: number;
  name: string;
  icon: React.ReactNode;
}

interface CreateBetModalProps {
  darkMode: boolean;
  isOpen: boolean;
  onClose: () => void;
  mockCategories: CategoryOption[];
  newBetCategory: string;
  setNewBetCategory: (cat: string) => void;
  newBetContent: string;
  setNewBetContent: (val: string) => void;
  newBetVoteAmount: string;
  setNewBetVoteAmount: (val: string) => void;
  newBetDuration: string;
  setNewBetDuration: (val: string) => void;
  betType: 'voting' | 'verified';
  setBetType: (val: 'voting' | 'verified') => void;
  predictionType: 'pump' | 'dump';
  setPredictionType: (val: 'pump' | 'dump') => void;
  priceThreshold: number;
  setPriceThreshold: (val: number) => void;
  selectedAsset: string;
  setSelectedAsset: (val: string) => void;
  SUPPORTED_ASSETS: { symbol: string; name: string; icon: string }[];
  handleNewBetVoteAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCreateBet: () => void;
  isCreatingBet: boolean;
  isTransactionPending: boolean;
  isWriteError: boolean;
  MIN_VOTE_STAKE: number;
  isFirestorePending: boolean;
}

const CreateBetModal: React.FC<CreateBetModalProps> = ({
  darkMode,
  isOpen,
  onClose,
  mockCategories,
  newBetCategory,
  setNewBetCategory,
  newBetContent,
  setNewBetContent,
  newBetVoteAmount,
  setNewBetVoteAmount,
  newBetDuration,
  setNewBetDuration,
  betType,
  setBetType,
  predictionType,
  setPredictionType,
  priceThreshold,
  setPriceThreshold,
  selectedAsset,
  setSelectedAsset,
  SUPPORTED_ASSETS,
  handleNewBetVoteAmountChange,
  handleCreateBet,
  isCreatingBet,
  isTransactionPending,
  isWriteError,
  MIN_VOTE_STAKE,
  isFirestorePending
}) => {
  // Move useAssetPrice to top level (before any return)
  const { price, isLoading: isPriceLoading, error: chainlinkError } = useAssetPrice(selectedAsset);

  if (!isOpen) return null;

  // Prediction text length validation
  const minPredictionLength = 25;
  const maxPredictionLength = 150;
  const isPredictionTooShort = newBetContent.length > 0 && newBetContent.length < minPredictionLength;
  const isPredictionTooLong = newBetContent.length > maxPredictionLength;
  const isPredictionValid = newBetContent.length >= minPredictionLength && newBetContent.length <= maxPredictionLength;

  const onCreateBet = async () => {
    await handleCreateBet();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'} rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[90vh]`}>
        {/* Modal Header - Fixed */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Create New Bet</h2>
            <button 
              className={`${darkMode ? 'text-gray-300 hover:text-gray-100' : 'text-gray-500 hover:text-gray-700'} transition-colors duration-200`}
              onClick={onClose}
            >
              <X size={20} />
            </button>
          </div>
        </div>
        {/* Modal Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {/* Category Selection */}
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Category</label>
              <div className="grid grid-cols-3 gap-2">
                {mockCategories.map(category => (
                  <button
                    key={category.id}
                    type="button"
                    className={`px-4 py-2 border rounded-md text-sm flex items-center justify-center transition-colors duration-200 ${
                      newBetCategory === category.name
                        ? darkMode ? 'border-yellow-400 bg-yellow-900 text-yellow-200' : 'border-yellow-400 bg-yellow-50 text-yellow-800'
                        : darkMode ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                    }`}
                    onClick={() => setNewBetCategory(category.name)}
                  >
                    <span className="mr-1">{category.icon}</span>
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
            {/* Bet Content */}
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1 transition-colors duration-200`}>What's your prediction?</label>
              <textarea
                className={`w-full px-3 py-2 border rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-700'} transition-colors duration-200`}
                rows={3}
                value={newBetContent}
                onChange={e => setNewBetContent(e.target.value)}
                placeholder="Share your prediction..."
                maxLength={maxPredictionLength}
              ></textarea>
              <div className="flex items-center justify-between mt-1">
                <span className={`text-xs ${isPredictionTooShort ? 'text-red-500' : isPredictionTooLong ? 'text-red-500' : darkMode ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-200`}>
                  {isPredictionTooShort && `Prediction must be at least ${minPredictionLength} characters.`}
                  {isPredictionTooLong && `Prediction must be at most ${maxPredictionLength} characters.`}
                </span>
                <span className={`text-xs ${isPredictionTooLong ? 'text-red-500' : darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{newBetContent.length}/{maxPredictionLength}</span>
              </div>
            </div>
            {/* Fixed Platform Stake Display */}
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1 transition-colors duration-200`}>Platform Stake</label>
              <div className={`w-full px-3 py-2 border rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-700'} transition-colors duration-200`}>
                3 CELO (Fixed)
              </div>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1 transition-colors duration-200`}>
                Required platform stake to create a bet. This ensures quality predictions.
              </p>
            </div>
            {/* Vote Stake Amount Input */}
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1 transition-colors duration-200`}>Vote Stake Amount (CELO)</label>
              <input
                type="number"
                className={`w-full px-3 py-2 border rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-700'} transition-colors duration-200`}
                value={newBetVoteAmount}
                onChange={handleNewBetVoteAmountChange}
                min={MIN_VOTE_STAKE}
                step="0.1"
              />
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1 transition-colors duration-200`}>
                Amount each voter must stake to participate (minimum {MIN_VOTE_STAKE} CELO). Winners split the total pool.
              </p>
            </div>
            {/* Duration */}
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1 transition-colors duration-200`}>Duration</label>
              <select
                className={`w-full px-3 py-2 border rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-700'} transition-colors duration-200`}
                value={newBetDuration}
                onChange={e => setNewBetDuration(e.target.value)}
              >
                <option value="">Select duration...</option>
                <option value="0.0833">5 minutes</option>
                <option value="0.1667">10 minutes</option>
                <option value="0.5">30 minutes</option>
                <option value="1">1 hour</option>
                <option value="4">4 hours</option>
                <option value="12">12 hours</option>
                <option value="24">24 hours</option>
                <option value="48">48 hours</option>
                <option value="72">72 hours</option>
                <option value="168">7 days</option>
                <option value="336">14 days</option>
                <option value="720">30 days</option>
              </select>
            </div>
            {/* Bet Type Selection */}
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1 transition-colors duration-200`}>Bet Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className={`px-4 py-2 border rounded-md text-sm flex items-center justify-center transition-colors duration-200 ${
                    betType === 'voting'
                      ? darkMode ? 'border-yellow-500 bg-yellow-900 text-yellow-200' : 'border-yellow-500 bg-yellow-50 text-yellow-800'
                      : darkMode ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                  }`}
                  onClick={() => setBetType('voting')}
                >
                  Community Vote
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 border rounded-md text-sm flex items-center justify-center transition-colors duration-200 ${
                    betType === 'verified'
                      ? darkMode ? 'border-yellow-500 bg-yellow-900 text-yellow-200' : 'border-yellow-500 bg-yellow-50 text-yellow-800'
                      : darkMode ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                  }`}
                  onClick={() => setBetType('verified')}
                >
                  Price Verified
                </button>
              </div>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1 transition-colors duration-200`}>
                {betType === 'voting'
                  ? 'Winners determined by majority vote'
                  : 'Winners determined by actual price movement via Chainlink'
                }
              </p>
            </div>
            {/* Show additional options for verified bets */}
            {betType === 'verified' && (
              <>
                {/* Info about how Yay/Nay wins for verified bets */}
                <div className={`mb-4 p-3 rounded-md ${darkMode ? 'bg-yellow-900/40 text-yellow-200 border border-yellow-800' : 'bg-yellow-50 text-yellow-800 border border-yellow-200'}`}> 
                  <div className="font-semibold mb-1">How winners are determined:</div>
                  <ul className="list-disc pl-5 text-sm">
                    <li><b>Yay</b> wins if the price moves by at least the threshold in the predicted direction (pump/dump).</li>
                    <li><b>Nay</b> wins if the threshold is <b>not</b> met (i.e., the price does not move enough).</li>
                    <li>If the price moves in the wrong direction or not enough, <b>Nay</b> wins.</li>
                    <li>There are no refunds for verified bets unless the market is invalid.</li>
                  </ul>
                </div>
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Select Asset
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {SUPPORTED_ASSETS.map((asset) => (
                      <button
                        key={asset.symbol}
                        type="button"
                        onClick={() => setSelectedAsset(asset.symbol)}
                        className={`relative flex flex-col items-center p-4 rounded-lg border transition-all duration-200 ${
                          selectedAsset === asset.symbol
                            ? darkMode
                              ? 'border-yellow-400 bg-yellow-900/50 shadow-lg shadow-yellow-400/20'
                              : 'border-yellow-400 bg-yellow-50 shadow-lg shadow-yellow-400/20'
                            : darkMode
                              ? 'border-gray-700 bg-gray-800 hover:border-gray-600'
                              : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="relative w-8 h-8 mb-2">
                          <Image
                            src={asset.icon}
                            alt={asset.name}
                            fill
                            className="object-contain"
                          />
                        </div>
                        <span className={`text-sm font-medium ${
                          selectedAsset === asset.symbol
                            ? darkMode ? 'text-yellow-200' : 'text-yellow-800'
                            : darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {asset.symbol}
                        </span>
                        <span className={`text-xs ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {asset.name}
                        </span>
                        {selectedAsset === asset.symbol && (
                          <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${
                            darkMode ? 'bg-yellow-400' : 'bg-yellow-400'
                          } flex items-center justify-center`}>
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  {selectedAsset && (
                    <div className={`mt-4 p-4 rounded-lg ${
                      darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="relative w-6 h-6">
                            <Image
                              src={SUPPORTED_ASSETS.find(a => a.symbol === selectedAsset)?.icon || ''}
                              alt={selectedAsset}
                              fill
                              className="object-contain"
                            />
                          </div>
                          <span className={`font-medium ${
                            darkMode ? 'text-gray-200' : 'text-gray-700'
                          }`}>
                            Current Price:
                          </span>
                        </div>
                        {isPriceLoading ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              Loading...
                            </span>
                          </div>
                        ) : chainlinkError ? (
                          <span className="text-red-500 text-sm">{chainlinkError}</span>
                        ) : (
                          <span className={`font-mono font-medium ${
                            darkMode ? 'text-gray-200' : 'text-gray-800'
                          }`}>
                            {price && price !== '' ? price : '-'}
                          </span>
                        )}
                      </div>
                      <p className={`mt-2 text-xs ${
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Price feed provided by Chainlink Oracle
                      </p>
                    </div>
                  )}
                </div>
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1 transition-colors duration-200`}>Price Movement</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className={`px-4 py-2 border rounded-md text-sm flex items-center justify-center transition-colors duration-200 ${
                        predictionType === 'pump'
                          ? darkMode ? 'border-green-500 bg-green-900 text-green-300' : 'border-green-500 bg-green-50 text-green-700'
                          : darkMode ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                      }`}
                      onClick={() => setPredictionType('pump')}
                    >
                      Will Pump
                    </button>
                    <button
                      type="button"
                      className={`px-4 py-2 border rounded-md text-sm flex items-center justify-center transition-colors duration-200 ${
                        predictionType === 'dump'
                          ? darkMode ? 'border-red-500 bg-red-900 text-red-300' : 'border-red-500 bg-red-50 text-red-700'
                          : darkMode ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                      }`}
                      onClick={() => setPredictionType('dump')}
                    >
                      Will Dump
                    </button>
                  </div>
                </div>
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1 transition-colors duration-200`}>Price Change Threshold</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="1"
                      max="20"
                      step="1"
                      value={priceThreshold}
                      onChange={e => setPriceThreshold(parseInt(e.target.value, 10))}
                      className="flex-1"
                    />
                    <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{priceThreshold}%</span>
                  </div>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1 transition-colors duration-200`}>
                    Price must move by at least this percentage to be considered a pump/dump
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
        {/* Modal Footer - Fixed */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            disabled={IS_CREATION_DISABLED || isCreatingBet || isTransactionPending || isFirestorePending || !isPredictionValid}
            className={`w-full ${
              darkMode 
                ? (IS_CREATION_DISABLED || isCreatingBet || isTransactionPending || isFirestorePending) ? 'bg-yellow-900' : 'bg-yellow-500 hover:bg-yellow-600'
                : (IS_CREATION_DISABLED || isCreatingBet || isTransactionPending || isFirestorePending) ? 'bg-yellow-600' : 'bg-yellow-500 hover:bg-yellow-600'
            } text-white py-2 px-4 rounded-md font-medium transition-colors duration-200 disabled:opacity-50 flex items-center justify-center`}
            onClick={async () => { await onCreateBet(); }}
          >
            {IS_CREATION_DISABLED ? (
              'Bet Creation Temporarily Disabled'
            ) : (isCreatingBet || isTransactionPending || isFirestorePending) ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>{isFirestorePending ? 'Finalizing bet...' : isTransactionPending ? 'Confirming transaction...' : 'Waiting for wallet...'}</span>
              </div>
            ) : isWriteError ? (
              <div className="flex items-center space-x-2 text-red-300">
                <span>Failed - Click to retry</span>
              </div>
            ) : (
              'Create Bet (3 CELO stake)'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateBetModal; 