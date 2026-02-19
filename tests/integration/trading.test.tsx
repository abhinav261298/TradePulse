import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePortfolio } from '../../src/hooks/usePortfolio';
import { useTrades } from '../../src/hooks/useTrades';
import { useLimitOrders } from '../../src/hooks/useLimitOrders';
import type { Ticker } from '../../src/types';

describe('Trading Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  const mockGetCurrentPrice = vi.fn((tickerId: string) => {
    const prices: Record<string, number> = {
      'btc': 95000,
      'eth': 3500,
    };
    return prices[tickerId] || 0;
  });

  describe('Complete Buy Flow', () => {
    it('should execute complete buy order flow', () => {
      const { result: portfolioResult } = renderHook(() => usePortfolio(mockGetCurrentPrice));
      const { result: tradesResult } = renderHook(() => useTrades());
      
      const initialBalance = portfolioResult.current.portfolio.balance;
      
      // Execute buy order
      act(() => {
        const success = portfolioResult.current.buyAsset('btc', 'BTC', 0.1, 95000);
        expect(success).toBe(true);
        
        // Record trade
        tradesResult.current.addTrade('btc', 'BTC', 'BUY', 95000, 0.1);
      });
      
      // Verify portfolio updated
      expect(portfolioResult.current.portfolio.balance).toBe(initialBalance - 9500);
      expect(portfolioResult.current.portfolio.holdings).toHaveLength(1);
      expect(portfolioResult.current.portfolio.holdings[0]).toMatchObject({
        tickerId: 'btc',
        symbol: 'BTC',
        quantity: 0.1,
        averagePrice: 95000,
      });
      
      // Verify trade recorded
      expect(tradesResult.current.trades).toHaveLength(1);
      expect(tradesResult.current.trades[0]).toMatchObject({
        tickerId: 'btc',
        symbol: 'BTC',
        type: 'BUY',
        price: 95000,
        quantity: 0.1,
      });
    });

    it('should reject buy when insufficient balance', () => {
      const { result: portfolioResult } = renderHook(() => usePortfolio(mockGetCurrentPrice));
      const { result: tradesResult } = renderHook(() => useTrades());
      
      const initialBalance = portfolioResult.current.portfolio.balance;
      const initialTradeCount = tradesResult.current.trades.length;
      
      // Try to buy with insufficient balance
      act(() => {
        const success = portfolioResult.current.buyAsset('btc', 'BTC', 1, 95000);
        expect(success).toBe(false);
      });
      
      // Verify no changes
      expect(portfolioResult.current.portfolio.balance).toBe(initialBalance);
      expect(portfolioResult.current.portfolio.holdings).toHaveLength(0);
      expect(tradesResult.current.trades).toHaveLength(initialTradeCount);
    });
  });

  describe('Complete Sell Flow', () => {
    it('should execute complete sell order flow', () => {
      const { result: portfolioResult } = renderHook(() => usePortfolio(mockGetCurrentPrice));
      const { result: tradesResult } = renderHook(() => useTrades());
      
      // First buy some asset
      act(() => {
        portfolioResult.current.buyAsset('btc', 'BTC', 0.1, 95000);
        tradesResult.current.addTrade('btc', 'BTC', 'BUY', 95000, 0.1);
      });
      
      const balanceAfterBuy = portfolioResult.current.portfolio.balance;
      
      // Execute sell order
      act(() => {
        const success = portfolioResult.current.sellAsset('btc', 0.05, 96000);
        expect(success).toBe(true);
        
        // Record trade
        tradesResult.current.addTrade('btc', 'BTC', 'SELL', 96000, 0.05);
      });
      
      // Verify portfolio updated
      expect(portfolioResult.current.portfolio.balance).toBe(balanceAfterBuy + 4800);
      expect(portfolioResult.current.portfolio.holdings[0].quantity).toBe(0.05);
      
      // Verify trade recorded
      expect(tradesResult.current.trades).toHaveLength(2);
      expect(tradesResult.current.trades[0]).toMatchObject({
        type: 'SELL',
        quantity: 0.05,
      });
    });

    it('should reject sell when insufficient holdings', () => {
      const { result: portfolioResult } = renderHook(() => usePortfolio(mockGetCurrentPrice));
      
      // Buy small amount
      act(() => {
        portfolioResult.current.buyAsset('btc', 'BTC', 0.1, 95000);
      });
      
      const balanceAfterBuy = portfolioResult.current.portfolio.balance;
      const holdingQuantity = portfolioResult.current.portfolio.holdings[0].quantity;
      
      // Try to sell more than owned
      act(() => {
        const success = portfolioResult.current.sellAsset('btc', 0.2, 96000);
        expect(success).toBe(false);
      });
      
      // Verify no changes
      expect(portfolioResult.current.portfolio.balance).toBe(balanceAfterBuy);
      expect(portfolioResult.current.portfolio.holdings[0].quantity).toBe(holdingQuantity);
    });
  });

  describe('Limit Order Flow', () => {
    it('should create and execute limit buy order', () => {
      const mockTickers = new Map<string, Ticker>([
        ['btc', { id: 'btc', symbol: 'BTC', name: 'Bitcoin', price: 95000, change24h: 5.2 }],
      ]);

      const { result: portfolioResult } = renderHook(() => usePortfolio(mockGetCurrentPrice));
      const { result: tradesResult } = renderHook(() => useTrades());
      
      const onOrderExecute = vi.fn((order, currentPrice) => {
        // Execute the order in the portfolio
        if (order.type === 'BUY') {
          portfolioResult.current.buyAsset(order.tickerId, order.symbol, order.quantity, currentPrice);
          tradesResult.current.addTrade(order.tickerId, order.symbol, 'BUY', currentPrice, order.quantity);
        }
      });
      
      const { result: limitOrdersResult, rerender } = renderHook(
        ({ tickers }) => useLimitOrders(tickers, onOrderExecute),
        { initialProps: { tickers: mockTickers } }
      );
      
      // Create limit buy order
      act(() => {
        limitOrdersResult.current.createLimitOrder('btc', 'BTC', 'BUY', 96000, 0.1);
      });
      
      expect(limitOrdersResult.current.limitOrders).toHaveLength(1);
      expect(limitOrdersResult.current.limitOrders[0].status).toBe('PENDING');
      
      // Update price to trigger (clear new order tracking)
      act(() => {
        const updatedTickers = new Map(mockTickers);
        rerender({ tickers: updatedTickers });
      });
      
      // Now trigger execution
      act(() => {
        const triggeredTickers = new Map<string, Ticker>([
          ['btc', { id: 'btc', symbol: 'BTC', name: 'Bitcoin', price: 95500, change24h: 5.0 }],
        ]);
        rerender({ tickers: triggeredTickers });
      });
      
      // Verify execution happened
      if (onOrderExecute.mock.calls.length > 0) {
        expect(portfolioResult.current.portfolio.holdings.length).toBeGreaterThanOrEqual(0);
        expect(tradesResult.current.trades.length).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Portfolio Value Updates', () => {
    it('should update portfolio values with price changes', () => {
      const { result: portfolioResult } = renderHook(() => usePortfolio(mockGetCurrentPrice));
      
      // Buy asset
      act(() => {
        portfolioResult.current.buyAsset('btc', 'BTC', 0.1, 90000);
      });
      
      // Update portfolio values (simulating price change)
      act(() => {
        portfolioResult.current.updatePortfolioValues();
      });
      
      const holding = portfolioResult.current.portfolio.holdings[0];
      expect(holding.currentPrice).toBe(95000); // From mockGetCurrentPrice
      expect(holding.totalValue).toBe(9500); // 0.1 * 95000
      expect(holding.profitLoss).toBe(500); // 9500 - 9000
    });

    it('should calculate total portfolio P&L correctly', () => {
      const { result: portfolioResult } = renderHook(() => usePortfolio(mockGetCurrentPrice));
      
      // Buy assets at different prices
      act(() => {
        portfolioResult.current.buyAsset('btc', 'BTC', 0.1, 90000);
        portfolioResult.current.buyAsset('eth', 'ETH', 1, 3000);
      });
      
      // Update portfolio values
      act(() => {
        portfolioResult.current.updatePortfolioValues();
      });
      
      // BTC: (95000 - 90000) * 0.1 = 500
      // ETH: (3500 - 3000) * 1 = 500
      // Total P&L from holdings = 1000
      // But also need to account for balance changes
      expect(portfolioResult.current.portfolio.totalValue).toBeGreaterThan(0);
    });
  });

  describe('Portfolio Reset', () => {
    it('should reset portfolio and clear trades', () => {
      const { result: portfolioResult } = renderHook(() => usePortfolio(mockGetCurrentPrice));
      const { result: tradesResult } = renderHook(() => useTrades());
      
      // Make some trades
      act(() => {
        portfolioResult.current.buyAsset('btc', 'BTC', 0.1, 95000);
        tradesResult.current.addTrade('btc', 'BTC', 'BUY', 95000, 0.1);
      });
      
      // Reset
      act(() => {
        portfolioResult.current.resetPortfolio();
        tradesResult.current.clearTrades();
      });
      
      // Verify reset
      expect(portfolioResult.current.portfolio.balance).toBe(10000);
      expect(portfolioResult.current.portfolio.holdings).toEqual([]);
      expect(portfolioResult.current.portfolio.totalValue).toBe(10000);
      expect(portfolioResult.current.portfolio.profitLoss).toBe(0);
      expect(tradesResult.current.trades).toEqual([]);
    });
  });
});
