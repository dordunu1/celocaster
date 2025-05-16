'use client';

import React from 'react';
import { X } from 'lucide-react';

interface WalletModalProps {
  darkMode: boolean;
  walletState: 'disconnected' | 'wrong_chain' | 'connected';
  chainId?: number;
  isWalletLoading: boolean;
  onClose: () => void;
  onConnect: () => void;
  onSwitch: () => void;
}

const WalletModal: React.FC<WalletModalProps> = ({
  darkMode,
  walletState,
  chainId,
  isWalletLoading,
  onClose,
  onConnect,
  onSwitch
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl p-6 m-4 max-w-sm w-full`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
          {walletState === 'disconnected' ? 'Connect Wallet' : 'Switch Network'}
        </h3>
        <button 
          onClick={onClose}
          className={`${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-600'}`}
        >
          <X size={20} />
        </button>
      </div>
      <div className="mb-6">
        {walletState === 'disconnected' ? (
          <>
            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
              Please connect your wallet to use BetCaster
            </p>
            <button
              onClick={onConnect}
              disabled={isWalletLoading}
              className={`w-full py-2 px-4 rounded-lg font-medium ${
                darkMode 
                  ? 'bg-yellow-400 hover:bg-yellow-300 text-black' 
                  : 'bg-yellow-400 hover:bg-yellow-500 text-black'
              } ${isWalletLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isWalletLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Connecting...
                </div>
              ) : (
                'Connect Wallet'
              )}
            </button>
          </>
        ) : (
          <>
            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
              Please switch to Celo Mainnet to use BetCaster
            </p>
            <div className={`flex items-center p-3 rounded-lg mb-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <div className="flex-1">
                <div className={`font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                  Current Network
                </div>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {chainId ? `Chain ID: ${chainId}` : 'Unknown Network'}
                </div>
              </div>
            </div>
            <button
              onClick={onSwitch}
              disabled={isWalletLoading}
              className={`w-full py-2 px-4 rounded-lg font-medium ${
                darkMode 
                  ? 'bg-yellow-400 hover:bg-yellow-300 text-black' 
                  : 'bg-yellow-400 hover:bg-yellow-500 text-black'
              } ${isWalletLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isWalletLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Switching...
                </div>
              ) : (
                'Switch to Celo Mainnet'
              )}
            </button>
          </>
        )}
      </div>
    </div>
  </div>
);

export default WalletModal; 