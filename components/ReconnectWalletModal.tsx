'use client';

import React from 'react';
import { X } from 'lucide-react';

interface ReconnectWalletModalProps {
  darkMode: boolean;
  onClose: () => void;
  onReconnect: () => void;
}

const ReconnectWalletModal: React.FC<ReconnectWalletModalProps> = ({ darkMode, onClose, onReconnect }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl p-6 m-4 max-w-sm w-full`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Wallet Session Expired</h3>
        <button 
          onClick={onClose}
          className={`${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-600'}`}
        >
          <X size={20} />
        </button>
      </div>
      <div className="mb-6">
        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
          Your wallet session expired or failed to send the transaction. Please reconnect your wallet to continue.
        </p>
        <button
          onClick={onReconnect}
          className={`w-full py-2 px-4 rounded-lg font-medium ${
            darkMode 
              ? 'bg-purple-600 hover:bg-purple-500 text-white' 
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          }`}
        >
          Reconnect Wallet
        </button>
      </div>
    </div>
  </div>
);

export default ReconnectWalletModal; 