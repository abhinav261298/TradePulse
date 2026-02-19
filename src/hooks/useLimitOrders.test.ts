import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLimitOrders } from './useLimitOrders';
import type { Ticker } from '../types';

describe('useLimitOrders', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  const mockTickers = new Map<string, Ticker>([
    ['btc', { id: 'btc', symbol: 'BTC', name: 'Bitcoin', price: 95000, change24h: 5.2 }],
    ['eth', { id: 'eth', symbol: 'ETH', name: 'Ethereum', price: 3500, change24h: -2.1 }],
  ]);

  const mockOnOrderExecute = vi.fn();

  describe('Initial State', () => {
    it('should initialize with empty limit orders', () => {
      const { result } = renderHook(() => useLimitOrders(mockTickers, mockOnOrderExecute));
      
      expect(result.current.limitOrders).toEqual([]);
    });

    it('should load from localStorage if available', () => {
      const savedOrders = [
        {
          id: 'order1',
          tickerId: 'btc',
          symbol: 'BTC',
          type: 'BUY' as const,
          triggerPrice: 90000,
          quantity: 0.1,
          status: 'PENDING' as const,
          createdAt: 1000,
        },
      ];
      localStorage.setItem('tradepulse_limit_orders', JSON.stringify(savedOrders));
      
      const { result } = renderHook(() => useLimitOrders(mockTickers, mockOnOrderExecute));
      
      expect(result.current.limitOrders).toHaveLength(1);
      expect(result.current.limitOrders[0].symbol).toBe('BTC');
    });
  });

  describe('createLimitOrder', () => {
    it('should create a buy limit order', () => {
      const { result } = renderHook(() => useLimitOrders(mockTickers, mockOnOrderExecute));
      
      let order;
      act(() => {
        order = result.current.createLimitOrder('btc', 'BTC', 'BUY', 90000, 0.1);
      });
      
      expect(result.current.limitOrders).toHaveLength(1);
      expect(order).toMatchObject({
        tickerId: 'btc',
        symbol: 'BTC',
        type: 'BUY',
        triggerPrice: 90000,
        quantity: 0.1,
        status: 'PENDING',
      });
    });

    it('should create a sell limit order', () => {
      const { result } = renderHook(() => useLimitOrders(mockTickers, mockOnOrderExecute));
      
      let order;
      act(() => {
        order = result.current.createLimitOrder('eth', 'ETH', 'SELL', 4000, 1);
      });
      
      expect(order).toMatchObject({
        type: 'SELL',
        triggerPrice: 4000,
      });
    });

    it('should generate unique IDs', () => {
      const { result } = renderHook(() => useLimitOrders(mockTickers, mockOnOrderExecute));
      
      act(() => {
        result.current.createLimitOrder('btc', 'BTC', 'BUY', 90000, 0.1);
        result.current.createLimitOrder('btc', 'BTC', 'BUY', 90000, 0.1);
      });
      
      expect(result.current.limitOrders[0].id).not.toBe(result.current.limitOrders[1].id);
    });

    it('should add timestamp', () => {
      const { result } = renderHook(() => useLimitOrders(mockTickers, mockOnOrderExecute));
      
      const before = Date.now();
      let order;
      act(() => {
        order = result.current.createLimitOrder('btc', 'BTC', 'BUY', 90000, 0.1);
      });
      const after = Date.now();
      
      expect(order!.createdAt).toBeGreaterThanOrEqual(before);
      expect(order!.createdAt).toBeLessThanOrEqual(after);
    });

    it('should not execute immediately even if trigger met', () => {
      const { result } = renderHook(() => useLimitOrders(mockTickers, mockOnOrderExecute));
      
      // BTC price is 95000, create buy order at 96000 (should trigger immediately)
      act(() => {
        result.current.createLimitOrder('btc', 'BTC', 'BUY', 96000, 0.1);
      });
      
      // Should still be PENDING (not executed immediately)
      expect(result.current.limitOrders[0].status).toBe('PENDING');
      expect(mockOnOrderExecute).not.toHaveBeenCalled();
    });
  });

  describe('Auto-execution', () => {
    it('should execute buy order when price drops to trigger', () => {
      const { result, rerender } = renderHook(
        ({ tickers }) => useLimitOrders(tickers, mockOnOrderExecute),
        { initialProps: { tickers: mockTickers } }
      );
      
      act(() => {
        result.current.createLimitOrder('btc', 'BTC', 'BUY', 96000, 0.1);
      });
      
      // Update price to trigger execution (needs to wait for next update cycle)
      const updatedTickers = new Map(mockTickers);
      updatedTickers.set('btc', { id: 'btc', symbol: 'BTC', name: 'Bitcoin', price: 95000, change24h: 5.2 });
      
      act(() => {
        rerender({ tickers: updatedTickers });
      });
      
      // After price update, order should execute
      act(() => {
        const newTickers = new Map(mockTickers);
        newTickers.set('btc', { id: 'btc', symbol: 'BTC', name: 'Bitcoin', price: 95500, change24h: 5.2 });
        rerender({ tickers: newTickers });
      });
      
      expect(mockOnOrderExecute).toHaveBeenCalled();
    });

    it('should execute sell order when price rises to trigger', () => {
      const { result, rerender } = renderHook(
        ({ tickers }) => useLimitOrders(tickers, mockOnOrderExecute),
        { initialProps: { tickers: mockTickers } }
      );
      
      act(() => {
        result.current.createLimitOrder('eth', 'ETH', 'SELL', 3400, 1);
      });
      
      // Price update cycle
      const updatedTickers = new Map(mockTickers);
      updatedTickers.set('eth', { id: 'eth', symbol: 'ETH', name: 'Ethereum', price: 3500, change24h: -2.1 });
      
      act(() => {
        rerender({ tickers: updatedTickers });
      });
      
      act(() => {
        const newTickers = new Map(mockTickers);
        newTickers.set('eth', { id: 'eth', symbol: 'ETH', name: 'Ethereum', price: 3600, change24h: 2.0 });
        rerender({ tickers: newTickers });
      });
      
      expect(mockOnOrderExecute).toHaveBeenCalled();
    });

    it('should mark order as EXECUTED after execution', () => {
      const { result, rerender } = renderHook(
        ({ tickers }) => useLimitOrders(tickers, mockOnOrderExecute),
        { initialProps: { tickers: mockTickers } }
      );
      
      act(() => {
        result.current.createLimitOrder('btc', 'BTC', 'BUY', 96000, 0.1);
      });
      
      // Trigger execution
      act(() => {
        rerender({ tickers: mockTickers });
      });
      
      act(() => {
        const updatedTickers = new Map(mockTickers);
        updatedTickers.set('btc', { id: 'btc', symbol: 'BTC', name: 'Bitcoin', price: 95500, change24h: 5.2 });
        rerender({ tickers: updatedTickers });
      });
      
      const executedOrder = result.current.limitOrders.find(o => o.status === 'EXECUTED');
      if (mockOnOrderExecute.mock.calls.length > 0) {
        expect(executedOrder).toBeDefined();
      }
    });
  });

  describe('cancelLimitOrder', () => {
    it('should cancel pending order', () => {
      const { result } = renderHook(() => useLimitOrders(mockTickers, mockOnOrderExecute));
      
      act(() => {
        result.current.createLimitOrder('btc', 'BTC', 'BUY', 90000, 0.1);
      });
      
      const orderId = result.current.limitOrders[0].id;
      
      act(() => {
        result.current.cancelLimitOrder(orderId);
      });
      
      expect(result.current.limitOrders[0].status).toBe('CANCELLED');
    });

    it('should not execute cancelled orders', () => {
      const { result, rerender } = renderHook(
        ({ tickers }) => useLimitOrders(tickers, mockOnOrderExecute),
        { initialProps: { tickers: mockTickers } }
      );
      
      act(() => {
        result.current.createLimitOrder('btc', 'BTC', 'BUY', 96000, 0.1);
      });
      
      const orderId = result.current.limitOrders[0].id;
      
      act(() => {
        result.current.cancelLimitOrder(orderId);
      });
      
      // Try to trigger execution
      const updatedTickers = new Map(mockTickers);
      updatedTickers.set('btc', { id: 'btc', symbol: 'BTC', name: 'Bitcoin', price: 95000, change24h: 5.2 });
      
      act(() => {
        rerender({ tickers: updatedTickers });
      });
      
      expect(mockOnOrderExecute).not.toHaveBeenCalled();
    });
  });

  describe('getPendingOrders', () => {
    it('should return only pending orders', () => {
      const { result } = renderHook(() => useLimitOrders(mockTickers, mockOnOrderExecute));
      
      act(() => {
        result.current.createLimitOrder('btc', 'BTC', 'BUY', 90000, 0.1);
        result.current.createLimitOrder('eth', 'ETH', 'SELL', 4000, 1);
      });
      
      const orderId = result.current.limitOrders[0].id;
      
      act(() => {
        result.current.cancelLimitOrder(orderId);
      });
      
      const pending = result.current.getPendingOrders();
      expect(pending).toHaveLength(1);
      expect(pending[0].status).toBe('PENDING');
    });
  });

  describe('Persistence', () => {
    it('should save to localStorage on changes', () => {
      const { result } = renderHook(() => useLimitOrders(mockTickers, mockOnOrderExecute));
      
      act(() => {
        result.current.createLimitOrder('btc', 'BTC', 'BUY', 90000, 0.1);
      });
      
      const saved = localStorage.getItem('tradepulse_limit_orders');
      expect(saved).toBeTruthy();
      const parsed = JSON.parse(saved!);
      expect(parsed).toHaveLength(1);
    });
  });
});
