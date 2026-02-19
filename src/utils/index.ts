// Utility functions for TradePulse Trading Terminal

/**
 * Format a number as currency
 */
export const formatCurrency = (value: number, decimals: number = 2): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

/**
 * Format percentage value
 */
export const formatPercentage = (value: number, decimals: number = 2): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
};

/**
 * Generate a unique ID
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Calculate precise multiplication to avoid floating-point errors
 */
export const preciseMultiply = (a: number, b: number): number => {
  const aDecimals = (a.toString().split('.')[1] || '').length;
  const bDecimals = (b.toString().split('.')[1] || '').length;
  const multiplier = Math.pow(10, Math.max(aDecimals, bDecimals));
  
  return Math.round(a * multiplier) * Math.round(b * multiplier) / (multiplier * multiplier);
};

/**
 * Calculate precise addition to avoid floating-point errors
 */
export const preciseAdd = (a: number, b: number): number => {
  const aDecimals = (a.toString().split('.')[1] || '').length;
  const bDecimals = (b.toString().split('.')[1] || '').length;
  const multiplier = Math.pow(10, Math.max(aDecimals, bDecimals));
  
  return (Math.round(a * multiplier) + Math.round(b * multiplier)) / multiplier;
};

/**
 * Calculate precise subtraction to avoid floating-point errors
 */
export const preciseSubtract = (a: number, b: number): number => {
  const aDecimals = (a.toString().split('.')[1] || '').length;
  const bDecimals = (b.toString().split('.')[1] || '').length;
  const multiplier = Math.pow(10, Math.max(aDecimals, bDecimals));
  
  return (Math.round(a * multiplier) - Math.round(b * multiplier)) / multiplier;
};

/**
 * Round to specific decimal places
 */
export const roundToPrecision = (value: number, decimals: number = 2): number => {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
};

// Export chart utilities
export * from './chart';

// Export validation utilities
export * from './validation';
