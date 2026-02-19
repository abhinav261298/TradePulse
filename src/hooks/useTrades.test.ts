import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTrades } from './useTrades';

describe('useTrades', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Initial State', () => {
    it('should initialize with empty trades', () => {
      const { result } = renderHook(() => useTrades());
      
      expect(result.current.trades).toEqual([]);
    });

    it('should load from localStorage if available', () => {
      const savedTrades = [
        {
          id: 'trade1',
          tickerId: 'btc',
          symbol: 'BTC',
          type: 'BUY' as const,
          price: 95000,
          quantity: 0.1,
          timestamp: 1000,
          total: 9500,
        },
      ];
      localStorage.setItem('tradepulse_trades', JSON.stringify(savedTrades));
      
      const { result } = renderHook(() => useTrades());
      
      expect(result.current.trades).toHaveLength(1);
      expect(result.current.trades[0].symbol).toBe('BTC');
    });
  });

  describe('addTrade', () => {
    it('should add a buy trade', () => {
      const { result } = renderHook(() => useTrades());
      
      let trade;
      act(() => {
        trade = result.current.addTrade('btc', 'BTC', 'BUY', 95000, 0.1);
      });
      
      expect(result.current.trades).toHaveLength(1);
      expect(trade).toMatchObject({
        tickerId: 'btc',
        symbol: 'BTC',
        type: 'BUY',
        price: 95000,
        quantity: 0.1,
        total: 9500,
      });
    });

    it('should add a sell trade', () => {
      const { result } = renderHook(() => useTrades());
      
      let trade;
      act(() => {
        trade = result.current.addTrade('eth', 'ETH', 'SELL', 3500, 1);
      });
      
      expect(result.current.trades).toHaveLength(1);
      expect(trade).toMatchObject({
        type: 'SELL',
        total: 3500,
      });
    });

    it('should add trades in LIFO order (newest first)', () => {
      const { result } = renderHook(() => useTrades());
      
      act(() => {
        result.current.addTrade('btc', 'BTC', 'BUY', 95000, 0.1);
        result.current.addTrade('eth', 'ETH', 'BUY', 3500, 1);
      });
      
      expect(result.current.trades).toHaveLength(2);
      expect(result.current.trades[0].symbol).toBe('ETH'); // Most recent first
      expect(result.current.trades[1].symbol).toBe('BTC');
    });

    it('should generate unique IDs', () => {
      const { result } = renderHook(() => useTrades());
      
      act(() => {
        result.current.addTrade('btc', 'BTC', 'BUY', 95000, 0.1);
        result.current.addTrade('btc', 'BTC', 'BUY', 95000, 0.1);
      });
      
      expect(result.current.trades[0].id).not.toBe(result.current.trades[1].id);
    });

    it('should add timestamp', () => {
      const { result } = renderHook(() => useTrades());
      
      const before = Date.now();
      let trade;
      act(() => {
        trade = result.current.addTrade('btc', 'BTC', 'BUY', 95000, 0.1);
      });
      const after = Date.now();
      
      expect(trade!.timestamp).toBeGreaterThanOrEqual(before);
      expect(trade!.timestamp).toBeLessThanOrEqual(after);
    });

    it('should round price and quantity correctly', () => {
      const { result } = renderHook(() => useTrades());
      
      let trade;
      act(() => {
        trade = result.current.addTrade('btc', 'BTC', 'BUY', 95000.123, 0.12345678);
      });
      
      expect(trade!.price).toBe(95000.12);
      expect(trade!.quantity).toBe(0.12345678);
    });

    it('should calculate total correctly', () => {
      const { result } = renderHook(() => useTrades());
      
      let trade;
      act(() => {
        trade = result.current.addTrade('btc', 'BTC', 'BUY', 95000, 0.1);
      });
      
      expect(trade!.total).toBe(9500);
    });
  });

  describe('clearTrades', () => {
    it('should clear all trades', () => {
      const { result } = renderHook(() => useTrades());
      
      act(() => {
        result.current.addTrade('btc', 'BTC', 'BUY', 95000, 0.1);
        result.current.addTrade('eth', 'ETH', 'SELL', 3500, 1);
      });
      
      expect(result.current.trades).toHaveLength(2);
      
      act(() => {
        result.current.clearTrades();
      });
      
      expect(result.current.trades).toEqual([]);
    });
  });

  describe('getTradesByTicker', () => {
    it('should return trades for specific ticker', () => {
      const { result } = renderHook(() => useTrades());
      
      act(() => {
        result.current.addTrade('btc', 'BTC', 'BUY', 95000, 0.1);
        result.current.addTrade('eth', 'ETH', 'BUY', 3500, 1);
        result.current.addTrade('btc', 'BTC', 'SELL', 96000, 0.05);
      });
      
      const btcTrades = result.current.getTradesByTicker('btc');
      
      expect(btcTrades).toHaveLength(2);
      expect(btcTrades.every(t => t.tickerId === 'btc')).toBe(true);
    });

    it('should return empty array for ticker with no trades', () => {
      const { result } = renderHook(() => useTrades());
      
      act(() => {
        result.current.addTrade('btc', 'BTC', 'BUY', 95000, 0.1);
      });
      
      const solTrades = result.current.getTradesByTicker('sol');
      expect(solTrades).toEqual([]);
    });
  });

  describe('Persistence', () => {
    it('should save to localStorage on changes', () => {
      const { result } = renderHook(() => useTrades());
      
      act(() => {
        result.current.addTrade('btc', 'BTC', 'BUY', 95000, 0.1);
      });
      
      const saved = localStorage.getItem('tradepulse_trades');
      expect(saved).toBeTruthy();
      const parsed = JSON.parse(saved!);
      expect(parsed).toHaveLength(1);
    });
  });
});
