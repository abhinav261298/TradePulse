import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePortfolio } from '../../src/hooks/usePortfolio';
import { useTrades } from '../../src/hooks/useTrades';
import { useLimitOrders } from '../../src/hooks/useLimitOrders';
import type { Ticker } from '../../src/types';

describe('LocalStorage Persistence Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const mockGetCurrentPrice = vi.fn(() => 95000);
  const mockTickers = new Map<string, Ticker>([
    ['btc', { id: 'btc', symbol: 'BTC', price: 95000, change24h: 5.2 }],
  ]);
  const mockOnOrderExecute = vi.fn();

  describe('Portfolio Persistence', () => {
    it('should persist portfolio to localStorage', () => {
      const { result } = renderHook(() => usePortfolio(mockGetCurrentPrice));
      
      act(() => {
        result.current.buyAsset('btc', 'BTC', 0.1, 95000);
      });
      
      const saved = localStorage.getItem('tradepulse_portfolio');
      expect(saved).toBeTruthy();
      
      const parsed = JSON.parse(saved!);
      expect(parsed.holdings).toHaveLength(1);
      expect(parsed.holdings[0].symbol).toBe('BTC');
    });

    it('should restore portfolio from localStorage', () => {
      // Save portfolio
      const portfolio = {
        balance: 5000,
        holdings: [
          {
            tickerId: 'btc',
            symbol: 'BTC',
            quantity: 0.1,
            averagePrice: 95000,
            currentPrice: 95000,
            totalValue: 9500,
            profitLoss: 0,
            profitLossPercentage: 0,
          },
        ],
        totalValue: 14500,
        profitLoss: 4500,
      };
      localStorage.setItem('tradepulse_portfolio', JSON.stringify(portfolio));
      
      // Create new hook instance
      const { result } = renderHook(() => usePortfolio(mockGetCurrentPrice));
      
      expect(result.current.portfolio.balance).toBe(5000);
      expect(result.current.portfolio.holdings).toHaveLength(1);
      expect(result.current.portfolio.holdings[0].symbol).toBe('BTC');
    });
  });

  describe('Trades Persistence', () => {
    it('should persist trades to localStorage', () => {
      const { result } = renderHook(() => useTrades());
      
      act(() => {
        result.current.addTrade('btc', 'BTC', 'BUY', 95000, 0.1);
      });
      
      const saved = localStorage.getItem('tradepulse_trades');
      expect(saved).toBeTruthy();
      
      const parsed = JSON.parse(saved!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].symbol).toBe('BTC');
    });

    it('should restore trades from localStorage', () => {
      const trades = [
        {
          id: 'trade1',
          tickerId: 'btc',
          symbol: 'BTC',
          type: 'BUY',
          price: 95000,
          quantity: 0.1,
          timestamp: Date.now(),
          total: 9500,
        },
      ];
      localStorage.setItem('tradepulse_trades', JSON.stringify(trades));
      
      const { result } = renderHook(() => useTrades());
      
      expect(result.current.trades).toHaveLength(1);
      expect(result.current.trades[0].symbol).toBe('BTC');
    });
  });

  describe('Limit Orders Persistence', () => {
    it('should persist limit orders to localStorage', () => {
      const { result } = renderHook(() => useLimitOrders(mockTickers, mockOnOrderExecute));
      
      act(() => {
        result.current.createLimitOrder('btc', 'BTC', 'BUY', 90000, 0.1);
      });
      
      const saved = localStorage.getItem('tradepulse_limit_orders');
      expect(saved).toBeTruthy();
      
      const parsed = JSON.parse(saved!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].symbol).toBe('BTC');
    });

    it('should restore limit orders from localStorage', () => {
      const orders = [
        {
          id: 'order1',
          tickerId: 'btc',
          symbol: 'BTC',
          type: 'BUY',
          triggerPrice: 90000,
          quantity: 0.1,
          status: 'PENDING',
          createdAt: Date.now(),
        },
      ];
      localStorage.setItem('tradepulse_limit_orders', JSON.stringify(orders));
      
      const { result } = renderHook(() => useLimitOrders(mockTickers, mockOnOrderExecute));
      
      expect(result.current.limitOrders).toHaveLength(1);
      expect(result.current.limitOrders[0].symbol).toBe('BTC');
    });

    it('should restore order status correctly', () => {
      const orders = [
        {
          id: 'order1',
          tickerId: 'btc',
          symbol: 'BTC',
          type: 'BUY',
          triggerPrice: 90000,
          quantity: 0.1,
          status: 'EXECUTED',
          createdAt: Date.now(),
        },
      ];
      localStorage.setItem('tradepulse_limit_orders', JSON.stringify(orders));
      
      const { result } = renderHook(() => useLimitOrders(mockTickers, mockOnOrderExecute));
      
      expect(result.current.limitOrders[0].status).toBe('EXECUTED');
    });
  });

  describe('Complete Session Persistence', () => {
    it('should persist and restore complete trading session', () => {
      // Session 1: Make some trades
      {
        const { result: portfolioResult } = renderHook(() => usePortfolio(mockGetCurrentPrice));
        const { result: tradesResult } = renderHook(() => useTrades());
        const { result: limitOrdersResult } = renderHook(() => 
          useLimitOrders(mockTickers, mockOnOrderExecute)
        );
        
        act(() => {
          // Buy asset
          portfolioResult.current.buyAsset('btc', 'BTC', 0.1, 95000);
          tradesResult.current.addTrade('btc', 'BTC', 'BUY', 95000, 0.1);
          
          // Create limit order
          limitOrdersResult.current.createLimitOrder('btc', 'BTC', 'SELL', 100000, 0.05);
        });
      }
      
      // Session 2: Restore and verify
      {
        const { result: portfolioResult } = renderHook(() => usePortfolio(mockGetCurrentPrice));
        const { result: tradesResult } = renderHook(() => useTrades());
        const { result: limitOrdersResult } = renderHook(() => 
          useLimitOrders(mockTickers, mockOnOrderExecute)
        );
        
        // Verify portfolio restored
        expect(portfolioResult.current.portfolio.balance).toBe(500);
        expect(portfolioResult.current.portfolio.holdings).toHaveLength(1);
        
        // Verify trades restored
        expect(tradesResult.current.trades).toHaveLength(1);
        
        // Verify limit orders restored
        expect(limitOrdersResult.current.limitOrders).toHaveLength(1);
        expect(limitOrdersResult.current.limitOrders[0].status).toBe('PENDING');
      }
    });

    it('should handle localStorage clear gracefully', () => {
      localStorage.clear();
      
      const { result: portfolioResult } = renderHook(() => usePortfolio(mockGetCurrentPrice));
      const { result: tradesResult } = renderHook(() => useTrades());
      const { result: limitOrdersResult } = renderHook(() => 
        useLimitOrders(mockTickers, mockOnOrderExecute)
      );
      
      // Should initialize with defaults
      expect(portfolioResult.current.portfolio.balance).toBe(10000);
      expect(tradesResult.current.trades).toEqual([]);
      expect(limitOrdersResult.current.limitOrders).toEqual([]);
    });
  });
});
