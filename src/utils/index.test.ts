import { describe, it, expect } from 'vitest';
import {
  generateId,
  formatCurrency,
  formatPercentage,
  formatTimestamp,
  preciseAdd,
  preciseSubtract,
  preciseMultiply,
  roundToPrecision,
} from './index';

describe('Utility Functions', () => {
  describe('generateId', () => {
    it('should generate a unique ID', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
    });

    it('should generate ID with correct format', () => {
      const id = generateId();
      expect(id).toMatch(/^\d+-[a-z0-9]+$/);
      expect(id.length).toBeGreaterThan(10);
    });
  });

  describe('formatCurrency', () => {
    it('should format positive numbers correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(1000)).toBe('$1,000.00');
      expect(formatCurrency(0.99)).toBe('$0.99');
    });

    it('should format negative numbers correctly', () => {
      expect(formatCurrency(-1234.56)).toBe('-$1,234.56');
      expect(formatCurrency(-100)).toBe('-$100.00');
    });

    it('should handle zero', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should handle large numbers', () => {
      expect(formatCurrency(1000000)).toBe('$1,000,000.00');
      expect(formatCurrency(999999.99)).toBe('$999,999.99');
    });

    it('should round to 2 decimal places', () => {
      expect(formatCurrency(1.234)).toBe('$1.23');
      expect(formatCurrency(1.999)).toBe('$2.00');
    });
  });

  describe('formatPercentage', () => {
    it('should format positive percentages', () => {
      expect(formatPercentage(12.34)).toBe('+12.34%');
      expect(formatPercentage(0.5)).toBe('+0.50%');
      expect(formatPercentage(100)).toBe('+100.00%');
    });

    it('should format negative percentages', () => {
      expect(formatPercentage(-12.34)).toBe('-12.34%');
      expect(formatPercentage(-0.5)).toBe('-0.50%');
    });

    it('should handle zero', () => {
      expect(formatPercentage(0)).toBe('+0.00%');
    });

    it('should round to 2 decimal places', () => {
      expect(formatPercentage(1.234)).toBe('+1.23%');
      expect(formatPercentage(-1.999)).toBe('-2.00%');
    });
  });

  describe('formatTimestamp', () => {
    it('should format timestamp correctly', () => {
      const timestamp = new Date('2024-01-15T10:30:45').getTime();
      const formatted = formatTimestamp(timestamp);
      expect(formatted).toMatch(/\d{2}:\d{2}:\d{2}/);
    });

    it('should handle midnight', () => {
      const timestamp = new Date('2024-01-15T00:00:00').getTime();
      const formatted = formatTimestamp(timestamp);
      expect(formatted).toContain('00:00:00');
    });

    it('should handle noon', () => {
      const timestamp = new Date('2024-01-15T12:00:00').getTime();
      const formatted = formatTimestamp(timestamp);
      expect(formatted).toContain('12:00:00');
    });
  });

  describe('preciseAdd', () => {
    it('should add numbers correctly', () => {
      expect(preciseAdd(1, 2)).toBe(3);
      expect(preciseAdd(0.1, 0.2)).toBeCloseTo(0.3);
      expect(preciseAdd(100, 200)).toBe(300);
    });

    it('should handle negative numbers', () => {
      expect(preciseAdd(-1, 2)).toBe(1);
      expect(preciseAdd(-5, -3)).toBe(-8);
    });

    it('should handle zero', () => {
      expect(preciseAdd(0, 5)).toBe(5);
      expect(preciseAdd(5, 0)).toBe(5);
    });

    it('should handle decimal precision issues', () => {
      expect(preciseAdd(0.1, 0.2)).toBeCloseTo(0.3, 10);
      expect(preciseAdd(1.234, 5.678)).toBeCloseTo(6.912, 10);
    });
  });

  describe('preciseSubtract', () => {
    it('should subtract numbers correctly', () => {
      expect(preciseSubtract(5, 3)).toBe(2);
      expect(preciseSubtract(0.3, 0.1)).toBeCloseTo(0.2);
      expect(preciseSubtract(100, 50)).toBe(50);
    });

    it('should handle negative results', () => {
      expect(preciseSubtract(3, 5)).toBe(-2);
      expect(preciseSubtract(-3, 2)).toBe(-5);
    });

    it('should handle zero', () => {
      expect(preciseSubtract(5, 0)).toBe(5);
      expect(preciseSubtract(0, 5)).toBe(-5);
    });
  });

  describe('preciseMultiply', () => {
    it('should multiply numbers correctly', () => {
      expect(preciseMultiply(2, 3)).toBe(6);
      expect(preciseMultiply(0.1, 3)).toBeCloseTo(0.3);
      expect(preciseMultiply(100, 2)).toBe(200);
    });

    it('should handle negative numbers', () => {
      expect(preciseMultiply(-2, 3)).toBe(-6);
      expect(preciseMultiply(-2, -3)).toBe(6);
    });

    it('should handle zero', () => {
      expect(preciseMultiply(0, 5)).toBe(0);
      expect(preciseMultiply(5, 0)).toBe(0);
    });

    it('should handle decimal precision', () => {
      expect(preciseMultiply(0.1, 0.2)).toBeCloseTo(0.02, 10);
    });
  });

  describe('roundToPrecision', () => {
    it('should round to specified precision', () => {
      expect(roundToPrecision(1.2345, 2)).toBe(1.23);
      expect(roundToPrecision(1.2355, 2)).toBe(1.24);
      expect(roundToPrecision(1.9999, 2)).toBe(2.00);
    });

    it('should handle different precisions', () => {
      expect(roundToPrecision(1.23456, 0)).toBe(1);
      expect(roundToPrecision(1.23456, 1)).toBe(1.2);
      expect(roundToPrecision(1.23456, 3)).toBe(1.235);
      expect(roundToPrecision(1.23456, 4)).toBe(1.2346);
    });

    it('should handle negative numbers', () => {
      expect(roundToPrecision(-1.2345, 2)).toBe(-1.23);
      expect(roundToPrecision(-1.2355, 2)).toBe(-1.24);
    });

    it('should handle zero', () => {
      expect(roundToPrecision(0, 2)).toBe(0);
      expect(roundToPrecision(0.001, 2)).toBe(0);
    });
  });
});
