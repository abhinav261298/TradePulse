import { describe, it, expect, beforeEach } from 'vitest';
import { saveToStorage, loadFromStorage, STORAGE_KEYS } from './storage';

describe('Storage Utils', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('saveToStorage', () => {
    it('should save data to localStorage', () => {
      const data = { test: 'value' };
      saveToStorage('test-key', data);
      
      const stored = localStorage.getItem('test-key');
      expect(stored).toBe(JSON.stringify(data));
    });

    it('should handle complex objects', () => {
      const data = {
        nested: { value: 123 },
        array: [1, 2, 3],
        boolean: true,
      };
      saveToStorage('complex', data);
      
      const stored = JSON.parse(localStorage.getItem('complex')!);
      expect(stored).toEqual(data);
    });

    it('should handle arrays', () => {
      const data = [1, 2, 3, 4, 5];
      saveToStorage('array', data);
      
      const stored = JSON.parse(localStorage.getItem('array')!);
      expect(stored).toEqual(data);
    });
  });

  describe('loadFromStorage', () => {
    it('should load data from localStorage', () => {
      const data = { test: 'value' };
      localStorage.setItem('test-key', JSON.stringify(data));
      
      const loaded = loadFromStorage('test-key', {});
      expect(loaded).toEqual(data);
    });

    it('should return default value when key not found', () => {
      const defaultValue = { default: true };
      const loaded = loadFromStorage('non-existent', defaultValue);
      expect(loaded).toEqual(defaultValue);
    });

    it('should return default value when data is invalid JSON', () => {
      localStorage.setItem('invalid', 'not-json{');
      const defaultValue = { default: true };
      const loaded = loadFromStorage('invalid', defaultValue);
      expect(loaded).toEqual(defaultValue);
    });

    it('should handle arrays', () => {
      const data = [1, 2, 3];
      localStorage.setItem('array', JSON.stringify(data));
      
      const loaded = loadFromStorage<number[]>('array', []);
      expect(loaded).toEqual(data);
    });
  });

  describe('STORAGE_KEYS', () => {
    it('should have all required keys', () => {
      expect(STORAGE_KEYS.PORTFOLIO).toBe('tradepulse_portfolio');
      expect(STORAGE_KEYS.TRADES).toBe('tradepulse_trades');
      expect(STORAGE_KEYS.WATCHLIST).toBe('tradepulse_watchlist');
      expect(STORAGE_KEYS.LIMIT_ORDERS).toBe('tradepulse_limit_orders');
    });

    it('should have unique keys', () => {
      const keys = Object.values(STORAGE_KEYS);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(keys.length);
    });
  });

  describe('Integration', () => {
    it('should save and load correctly', () => {
      const portfolio = {
        balance: 10000,
        holdings: [],
        totalValue: 10000,
        profitLoss: 0,
      };
      
      saveToStorage(STORAGE_KEYS.PORTFOLIO, portfolio);
      const loaded = loadFromStorage(STORAGE_KEYS.PORTFOLIO, {
        balance: 0,
        holdings: [],
        totalValue: 0,
        profitLoss: 0,
      });
      
      expect(loaded).toEqual(portfolio);
    });
  });
});
