'use client';

import React from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  darkMode: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, darkMode }) => {
  return (
    <div className="relative group">
      {children}
      <div className={`absolute z-50 invisible group-hover:visible text-sm rounded-lg py-2 px-3 right-0 mt-2 min-w-[280px] max-w-[320px] shadow-xl
        ${darkMode ? 'bg-black/90 text-white' : 'bg-white text-gray-900 border border-gray-200'}`}
      >
        <div className={`absolute -top-2 right-3 w-4 h-4 transform rotate-45
          ${darkMode ? 'bg-black/90' : 'bg-white border-l border-t border-gray-200'}`}></div>
        {content}
      </div>
    </div>
  );
};

export default Tooltip; 