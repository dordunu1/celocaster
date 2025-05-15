'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface ChainSwitchModalProps {
  darkMode: boolean;
  chainId?: number;
  onClose: () => void;
  onSwitch: () => void;
}

export default function ChainSwitchModal({
  darkMode,
  chainId,
  onClose,
  onSwitch
}: ChainSwitchModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl p-6 m-4 max-w-sm w-full`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            Switch Network
          </h3>
          <button 
            onClick={onClose}
            className={`${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-600'}`}
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="mb-6">
          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
            Please switch to Monad Testnet to use BetCaster
          </p>
          <div className={`flex items-center p-3 rounded-lg mb-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <div className="flex-1">
              <div className={`font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                Current Network
              </div>
              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {chainId === 8453 ? 'Base Mainnet' : 'Unknown Network'}
              </div>
            </div>
          </div>
          <div className={`flex items-center p-3 rounded-lg ${darkMode ? 'bg-purple-900/50' : 'bg-purple-50'}`}>
            <div className="flex-1">
              <div className={`font-medium ${darkMode ? 'text-purple-100' : 'text-purple-900'}`}>
                Required Network
              </div>
              <div className={`text-sm ${darkMode ? 'text-purple-300' : 'text-purple-600'}`}>
                Monad Testnet
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onSwitch}
          className={`w-full py-2 px-4 rounded-lg font-medium ${
            darkMode 
              ? 'bg-purple-600 hover:bg-purple-500 text-white' 
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          }`}
        >
          Switch to Monad Testnet
        </button>
      </div>
    </div>
  );
} 