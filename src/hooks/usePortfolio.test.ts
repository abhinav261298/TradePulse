import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePortfolio } from './usePortfolio';

describe('usePortfolio', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const mockGetCurrentPrice = vi.fn((tickerId: string) => {
    const prices: Record<string, number> = {
      'btc': 95000,
      'eth': 3500,
      'sol': 120,
    };
    return prices[tickerId] || 0;
  });

  describe('Initial State', () => {
    it('should initialize with default portfolio', () => {
      const { result } = renderHook(() => usePortfolio(mockGetCurrentPrice));
      
      expect(result.current.portfolio.balance).toBe(10000);
      expect(result.current.portfolio.holdings).toEqual([]);
      expect(result.current.portfolio.totalValue).toBe(10000);
      expect(result.current.portfolio.profitLoss).toBe(0);
    });

    it('should load from localStorage if available', () => {
      const savedPortfolio = {
        balance: 5000,
        holdings: [],
        totalValue: 5000,
        profitLoss: -5000,
      };
      localStorage.setItem('tradepulse_portfolio', JSON.stringify(savedPortfolio));
      
      const { result } = renderHook(() => usePortfolio(mockGetCurrentPrice));
      
      expect(result.current.portfolio.balance).toBe(5000);
      expect(result.current.portfolio.profitLoss).toBe(-5000);
    });
  });

  describe('buyAsset', () => {
    it('should buy asset successfully with sufficient balance', () => {
      const { result } = renderHook(() => usePortfolio(mockGetCurrentPrice));
      
      act(() => {
        const success = result.current.buyAsset('btc', 'BTC', 0.1, 95000);
        expect(success).toBe(true);
      });
      
      expect(result.current.portfolio.balance).toBe(500); // 10000 - 9500
      expect(result.current.portfolio.holdings).toHaveLength(1);
      expect(result.current.portfolio.holdings[0]).toMatchObject({
        tickerId: 'btc',
        symbol: 'BTC',
        quantity: 0.1,
        averagePrice: 95000,
      });
    });

    it('should reject buy when insufficient balance', () => {
      const { result } = renderHook(() => usePortfolio(mockGetCurrentPrice));
      
      act(() => {
        const success = result.current.buyAsset('btc', 'BTC', 1, 95000);
        expect(success).toBe(false);
      });
      
      expect(result.current.portfolio.balance).toBe(10000);
      expect(result.current.portfolio.holdings).toHaveLength(0);
    });

    it('should update existing holding on subsequent buy', () => {
      const { result } = renderHook(() => usePortfolio(mockGetCurrentPrice));
      
      act(() => {
        result.current.buyAsset('btc', 'BTC', 0.05, 95000);
        result.current.buyAsset('btc', 'BTC', 0.05, 96000);
      });
      
      const holding = result.current.portfolio.holdings[0];
      expect(holding.quantity).toBe(0.1);
      expect(holding.averagePrice).toBe(95500); // (0.05*95000 + 0.05*96000) / 0.1
    });

    it('should calculate average price correctly', () => {
      const { result } = renderHook(() => usePortfolio(mockGetCurrentPrice));
      
      act(() => {
        result.current.buyAsset('eth', 'ETH', 1, 3000);
        result.current.buyAsset('eth', 'ETH', 1, 4000);
      });
      
      const holding = result.current.portfolio.holdings[0];
      expect(holding.averagePrice).toBe(3500); // (3000 + 4000) / 2
    });
  });

  describe('sellAsset', () => {
    it('should sell asset successfully with sufficient holdings', () => {
      const { result } = renderHook(() => usePortfolio(mockGetCurrentPrice));
      
      act(() => {
        result.current.buyAsset('btc', 'BTC', 0.1, 95000);
      });
      
      act(() => {
        const success = result.current.sellAsset('btc', 0.05, 96000);
        expect(success).toBe(true);
      });
      
      expect(result.current.portfolio.holdings[0].quantity).toBe(0.05);
      expect(result.current.portfolio.balance).toBe(5300); // 500 + 4800
    });

    it('should reject sell when insufficient holdings', () => {
      const { result } = renderHook(() => usePortfolio(mockGetCurrentPrice));
      
      act(() => {
        result.current.buyAsset('btc', 'BTC', 0.1, 95000);
        const success = result.current.sellAsset('btc', 0.2, 96000);
        expect(success).toBe(false);
      });
      
      expect(result.current.portfolio.holdings[0].quantity).toBe(0.1);
    });

    it('should remove holding when selling all', () => {
      const { result } = renderHook(() => usePortfolio(mockGetCurrentPrice));
      
      act(() => {
        result.current.buyAsset('btc', 'BTC', 0.1, 95000);
      });
      
      act(() => {
        result.current.sellAsset('btc', 0.1, 96000);
      });
      
      expect(result.current.portfolio.holdings).toHaveLength(0);
      expect(result.current.portfolio.balance).toBe(10100); // 500 + 9600
    });

    it('should reject sell when no holdings exist', () => {
      const { result } = renderHook(() => usePortfolio(mockGetCurrentPrice));
      
      act(() => {
        const success = result.current.sellAsset('btc', 0.1, 95000);
        expect(success).toBe(false);
      });
    });
  });

  describe('updatePortfolioValues', () => {
    it('should update portfolio values based on current prices', () => {
      const { result } = renderHook(() => usePortfolio(mockGetCurrentPrice));
      
      act(() => {
        result.current.buyAsset('btc', 'BTC', 0.1, 90000);
      });
      
      act(() => {
        result.current.updatePortfolioValues();
      });
      
      const holding = result.current.portfolio.holdings[0];
      expect(holding.currentPrice).toBe(95000);
      expect(holding.totalValue).toBe(9500); // 0.1 * 95000
      expect(holding.profitLoss).toBe(500); // 9500 - 9000
    });

    it('should calculate total portfolio value correctly', () => {
      const { result } = renderHook(() => usePortfolio(mockGetCurrentPrice));
      
      act(() => {
        result.current.buyAsset('btc', 'BTC', 0.1, 90000);
        result.current.buyAsset('eth', 'ETH', 1, 3000);
      });
      
      act(() => {
        result.current.updatePortfolioValues();
      });
      
      // Verify total value is calculated
      expect(result.current.portfolio.totalValue).toBeGreaterThan(0);
    });
  });

  describe('resetPortfolio', () => {
    it('should reset portfolio to initial state', () => {
      const { result } = renderHook(() => usePortfolio(mockGetCurrentPrice));
      
      act(() => {
        result.current.buyAsset('btc', 'BTC', 0.1, 95000);
      });
      
      act(() => {
        result.current.resetPortfolio();
      });
      
      expect(result.current.portfolio.balance).toBe(10000);
      expect(result.current.portfolio.holdings).toEqual([]);
      expect(result.current.portfolio.totalValue).toBe(10000);
      expect(result.current.portfolio.profitLoss).toBe(0);
    });
  });

  describe('Persistence', () => {
    it('should save to localStorage on changes', () => {
      const { result } = renderHook(() => usePortfolio(mockGetCurrentPrice));
      
      act(() => {
        result.current.buyAsset('btc', 'BTC', 0.1, 95000);
      });
      
      const saved = localStorage.getItem('tradepulse_portfolio');
      expect(saved).toBeTruthy();
      const parsed = JSON.parse(saved!);
      expect(parsed.holdings).toHaveLength(1);
    });
  });
});
