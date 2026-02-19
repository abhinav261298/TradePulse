import { useState, useEffect, useRef, useCallback } from 'react';
import type { Ticker, PricePoint } from '../types';

const INITIAL_TICKERS: Ticker[] = [
  { id: 'btc', symbol: 'BTC', name: 'Bitcoin', price: 45000, change24h: 0 },
  { id: 'eth', symbol: 'ETH', name: 'Ethereum', price: 3000, change24h: 0 },
  { id: 'sol', symbol: 'SOL', name: 'Solana', price: 100, change24h: 0 },
];

interface PriceEngineState {
  tickers: Map<string, Ticker>;
  priceHistory: Map<string, PricePoint[]>;
  subscribers: Set<(tickers: Map<string, Ticker>) => void>;
}

/**
 * Mock Price Engine Hook
 * Generates new prices for tickers every 1 second using random walk algorithm
 */
export const useMockPriceEngine = () => {
  const [tickers, setTickers] = useState<Map<string, Ticker>>(new Map());
  const stateRef = useRef<PriceEngineState>({
    tickers: new Map(),
    priceHistory: new Map(),
    subscribers: new Set(),
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Random walk price generator
  const generateNewPrice = useCallback((currentPrice: number, volatility: number = 0.02): number => {
    const change = (Math.random() - 0.5) * 2 * volatility * currentPrice;
    return Math.max(currentPrice + change, 0.01);
  }, []);

  // Initialize tickers
  useEffect(() => {
    const initialTickersMap = new Map<string, Ticker>();
    const initialPriceHistory = new Map<string, PricePoint[]>();

    INITIAL_TICKERS.forEach((ticker) => {
      initialTickersMap.set(ticker.id, { ...ticker });
      initialPriceHistory.set(ticker.id, [
        { timestamp: Date.now(), price: ticker.price },
      ]);
    });

    stateRef.current.tickers = initialTickersMap;
    stateRef.current.priceHistory = initialPriceHistory;
    
    // Use queueMicrotask to avoid synchronous setState in effect
    queueMicrotask(() => {
      setTickers(new Map(initialTickersMap));
    });
  }, []);

  // Start price engine
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const updatedTickers = new Map<string, Ticker>();

      stateRef.current.tickers.forEach((ticker, id) => {
        const newPrice = generateNewPrice(ticker.price);
        const priceHistory = stateRef.current.priceHistory.get(id) || [];
        
        // Calculate 24h change (simplified: using first price in history)
        const oldestPrice = priceHistory[0]?.price || ticker.price;
        const change24h = ((newPrice - oldestPrice) / oldestPrice) * 100;

        const updatedTicker: Ticker = {
          ...ticker,
          price: newPrice,
          change24h,
        };

        updatedTickers.set(id, updatedTicker);

        // Update price history (keep last 300 points = 5 minutes)
        const updatedHistory = [
          ...priceHistory,
          { timestamp: now, price: newPrice },
        ].slice(-300);
        
        stateRef.current.priceHistory.set(id, updatedHistory);
      });

      stateRef.current.tickers = updatedTickers;
      setTickers(new Map(updatedTickers));

      // Notify subscribers
      stateRef.current.subscribers.forEach((callback) => {
        callback(updatedTickers);
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [generateNewPrice]);

  const subscribe = useCallback((callback: (tickers: Map<string, Ticker>) => void) => {
    stateRef.current.subscribers.add(callback);
    return () => {
      stateRef.current.subscribers.delete(callback);
    };
  }, []);

  const getPriceHistory = useCallback((tickerId: string): PricePoint[] => {
    return stateRef.current.priceHistory.get(tickerId) || [];
  }, []);

  const getCurrentPrice = useCallback((tickerId: string): number => {
    return stateRef.current.tickers.get(tickerId)?.price || 0;
  }, []);

  return {
    tickers,
    subscribe,
    getPriceHistory,
    getCurrentPrice,
  };
};
