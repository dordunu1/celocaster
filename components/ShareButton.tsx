'use client';

import React from 'react';
import { Share2 } from 'lucide-react';
import { useMiniAppContext } from '../hooks/use-miniapp-context';

interface ShareButtonProps {
  content: string;
  darkMode: boolean;
}

const ShareButton: React.FC<ShareButtonProps> = ({ content, darkMode }) => {
  const { actions } = useMiniAppContext();

  const handleShare = async () => {
    const shareUrl = window.location.origin;
    const shareText = `🎲 Bet Prediction: ${content}\nVote YAY or NAY on Celocaster!`;
    
    if (actions && actions.composeCast) {
      await actions.composeCast({
        text: shareText,
        embeds: [shareUrl]
      });
    } else {
      const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(shareUrl)}`;
      window.open(url, '_blank');
    }
  };

  return (
    <button
      onClick={handleShare}
      className={`mt-1 px-2 py-1 border rounded text-xs flex items-center ${
        darkMode 
          ? 'border-blue-400 text-blue-200 hover:bg-blue-900/30' 
          : 'border-blue-700 text-blue-700 hover:bg-blue-100'
      }`}
      title="Share this bet to Farcaster"
    >
      <Share2 className="w-4 h-4 mr-1" /> Share
    </button>
  );
};

export default ShareButton; 