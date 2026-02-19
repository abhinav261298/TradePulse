import { useState, useEffect, useCallback } from 'react';
import { saveToStorage, loadFromStorage, STORAGE_KEYS } from '../utils/storage';

/**
 * Watchlist Hook
 * Manages the list of tickers in the user's watchlist
 */
export const useWatchlist = () => {
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    return loadFromStorage<string[]>(STORAGE_KEYS.WATCHLIST, ['btc', 'eth', 'sol']);
  });

  // Save to localStorage whenever watchlist changes
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.WATCHLIST, watchlist);
  }, [watchlist]);

  const addToWatchlist = useCallback((tickerId: string): void => {
    setWatchlist((prev) => {
      if (prev.includes(tickerId)) {
        return prev;
      }
      return [...prev, tickerId];
    });
  }, []);

  const removeFromWatchlist = useCallback((tickerId: string): void => {
    setWatchlist((prev) => prev.filter((id) => id !== tickerId));
  }, []);

  const isInWatchlist = useCallback(
    (tickerId: string): boolean => {
      return watchlist.includes(tickerId);
    },
    [watchlist]
  );

  return {
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
  };
};
