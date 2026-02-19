import { useState, useEffect, useCallback } from 'react';
import type { Trade } from '../types';
import { saveToStorage, loadFromStorage, STORAGE_KEYS } from '../utils/storage';
import { generateId, preciseMultiply, roundToPrecision } from '../utils';

/**
 * Trade History Hook
 */
export const useTrades = () => {
  const [trades, setTrades] = useState<Trade[]>(() => {
    return loadFromStorage<Trade[]>(STORAGE_KEYS.TRADES, []);
  });

  // Save to localStorage whenever trades change
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.TRADES, trades);
  }, [trades]);

  const addTrade = useCallback(
    (
      tickerId: string,
      symbol: string,
      type: 'BUY' | 'SELL',
      price: number,
      quantity: number
    ): Trade => {
      const trade: Trade = {
        id: generateId(),
        tickerId,
        symbol,
        type,
        price: roundToPrecision(price, 2),
        quantity: roundToPrecision(quantity, 8),
        timestamp: Date.now(),
        total: roundToPrecision(preciseMultiply(price, quantity), 2),
      };

      setTrades((prev) => [trade, ...prev]);
      return trade;
    },
    []
  );

  const clearTrades = useCallback(() => {
    setTrades([]);
  }, []);

  const getTradesByTicker = useCallback(
    (tickerId: string): Trade[] => {
      return trades.filter((trade) => trade.tickerId === tickerId);
    },
    [trades]
  );

  return {
    trades,
    addTrade,
    clearTrades,
    getTradesByTicker,
  };
};
