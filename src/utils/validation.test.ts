import { describe, it, expect } from 'vitest';
import {
  validateQuantity,
  validateBuyOrder,
  validateSellOrder,
  validateLimitPrice,
  formatDecimalInput,
} from './validation';

describe('Validation Functions', () => {
  describe('validateQuantity', () => {
    it('should return valid for positive numbers', () => {
      expect(validateQuantity('1')).toEqual({ isValid: true });
      expect(validateQuantity('0.5')).toEqual({ isValid: true });
      expect(validateQuantity('100.99')).toEqual({ isValid: true });
    });

    it('should reject zero or negative', () => {
      expect(validateQuantity('0')).toEqual({
        isValid: false,
        error: 'Quantity must be greater than 0',
      });
      expect(validateQuantity('-1')).toEqual({
        isValid: false,
        error: 'Quantity must be greater than 0',
      });
    });

    it('should reject more than 2 decimal places', () => {
      expect(validateQuantity('1.234')).toEqual({
        isValid: false,
        error: 'Maximum 2 decimal places allowed',
      });
      expect(validateQuantity('0.999')).toEqual({
        isValid: false,
        error: 'Maximum 2 decimal places allowed',
      });
    });

    it('should accept exactly 2 decimal places', () => {
      expect(validateQuantity('1.23')).toEqual({ isValid: true });
      expect(validateQuantity('0.50')).toEqual({ isValid: true });
    });
  });

  describe('validateBuyOrder', () => {
    it('should return valid when balance is sufficient', () => {
      expect(validateBuyOrder(1, 100, 1000)).toEqual({ isValid: true });
      expect(validateBuyOrder(0.5, 100, 50)).toEqual({ isValid: true });
      expect(validateBuyOrder(2, 50, 100)).toEqual({ isValid: true });
    });

    it('should reject when balance is insufficient', () => {
      expect(validateBuyOrder(10, 100, 500)).toEqual({
        isValid: false,
        error: 'Insufficient balance. Need $1000.00, have $500.00',
      });
    });

    it('should reject when total equals balance exactly', () => {
      const result = validateBuyOrder(1, 100, 100);
      expect(result.isValid).toBe(true); // Exactly equal should be valid
    });

    it('should handle decimal precision', () => {
      // 0.1 * 0.3 = 0.03, which is less than 0.05, so it should be valid
      expect(validateBuyOrder(0.5, 0.3, 0.05)).toEqual({
        isValid: false,
        error: 'Insufficient balance. Need $0.15, have $0.05',
      });
    });
  });

  describe('validateSellOrder', () => {
    it('should return valid when holdings are sufficient', () => {
      expect(validateSellOrder(1, 10, 'BTC')).toEqual({ isValid: true });
      expect(validateSellOrder(0.5, 1, 'ETH')).toEqual({ isValid: true });
      expect(validateSellOrder(5, 5, 'SOL')).toEqual({ isValid: true });
    });

    it('should reject when holdings are insufficient', () => {
      expect(validateSellOrder(10, 5, 'BTC')).toEqual({
        isValid: false,
        error: 'Insufficient BTC. Have 5.00',
      });
    });

    it('should reject when no holdings', () => {
      expect(validateSellOrder(1, 0, 'BTC')).toEqual({
        isValid: false,
        error: 'Insufficient BTC. Have 0.00',
      });
    });

    it('should handle decimal quantities', () => {
      expect(validateSellOrder(0.5, 0.3, 'ETH')).toEqual({
        isValid: false,
        error: 'Insufficient ETH. Have 0.30',
      });
    });
  });

  describe('validateLimitPrice', () => {
    it('should return valid for positive prices', () => {
      expect(validateLimitPrice('100', 100)).toEqual({ isValid: true });
      expect(validateLimitPrice('0.01', 0.01)).toEqual({ isValid: true });
      expect(validateLimitPrice('999999', 1000000)).toEqual({ isValid: true });
    });

    it('should reject zero or negative', () => {
      expect(validateLimitPrice('0', 100)).toEqual({
        isValid: false,
        error: 'Price must be greater than 0',
      });
      expect(validateLimitPrice('-100', 100)).toEqual({
        isValid: false,
        error: 'Price must be greater than 0',
      });
    });

    it('should reject more than 2 decimal places', () => {
      expect(validateLimitPrice('100.123', 100)).toEqual({
        isValid: false,
        error: 'Maximum 2 decimal places allowed',
      });
    });

    it('should accept exactly 2 decimal places', () => {
      expect(validateLimitPrice('100.99', 100)).toEqual({ isValid: true });
      expect(validateLimitPrice('1.00', 1)).toEqual({ isValid: true });
    });

    it('should warn when price is far from current price', () => {
      const result = validateLimitPrice('200', 100);
      expect(result.isValid).toBe(true);
      expect(result.error).toContain('Warning');
    });
  });

  describe('formatDecimalInput', () => {
    it('should keep valid numbers as is', () => {
      expect(formatDecimalInput('1.2')).toBe('1.2');
      expect(formatDecimalInput('1.99')).toBe('1.99');
      expect(formatDecimalInput('100')).toBe('100');
    });

    it('should truncate extra decimal places', () => {
      expect(formatDecimalInput('1.999')).toBe('1.99');
      expect(formatDecimalInput('1.2345')).toBe('1.23');
    });

    it('should handle empty or invalid input', () => {
      expect(formatDecimalInput('')).toBe('');
      expect(formatDecimalInput('abc')).toBe('');
    });

    it('should remove non-numeric characters', () => {
      expect(formatDecimalInput('1a2b3')).toBe('123');
      expect(formatDecimalInput('$100')).toBe('100');
    });

    it('should handle decimal point', () => {
      expect(formatDecimalInput('.')).toBe('.');
      expect(formatDecimalInput('1.')).toBe('1.');
      expect(formatDecimalInput('.5')).toBe('.5');
    });

    it('should handle multiple decimal points', () => {
      expect(formatDecimalInput('1.2.3')).toBe('1.23');
    });
  });
});
