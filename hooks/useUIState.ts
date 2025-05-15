import { useState, useEffect, useCallback } from 'react';

export function useUIState() {
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showChainSwitchModal, setShowChainSwitchModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showReconnectModal, setShowReconnectModal] = useState(false);

  // Filters and search
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [authorSearch, setAuthorSearch] = useState('');

  // Dark mode
  const [darkMode, setDarkMode] = useState(false);
  useEffect(() => {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDark);
  }, []);
  const toggleDarkMode = useCallback(() => setDarkMode((d) => !d), []);

  // Expanded post
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);

  // Mounted state (for client-only rendering)
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return {
    isCreateModalOpen,
    setIsCreateModalOpen,
    showChainSwitchModal,
    setShowChainSwitchModal,
    showWalletModal,
    setShowWalletModal,
    showReconnectModal,
    setShowReconnectModal,
    selectedFilter,
    setSelectedFilter,
    selectedCategory,
    setSelectedCategory,
    authorSearch,
    setAuthorSearch,
    darkMode,
    setDarkMode,
    toggleDarkMode,
    expandedPostId,
    setExpandedPostId,
    mounted,
    setMounted,
  };
} 