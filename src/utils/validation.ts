/**
 * Validation Utilities for Trading
 * Handles input validation for trade quantities and orders
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate quantity input
 */
export const validateQuantity = (value: string): ValidationResult => {
  // Empty check
  if (!value || value.trim() === '') {
    return { isValid: false, error: 'Quantity is required' };
  }

  // Convert to number
  const quantity = parseFloat(value);

  // Check if valid number
  if (isNaN(quantity)) {
    return { isValid: false, error: 'Invalid quantity' };
  }

  // Must be positive
  if (quantity <= 0) {
    return { isValid: false, error: 'Quantity must be greater than 0' };
  }

  // Check decimal places (max 2)
  const decimalPart = value.split('.')[1];
  if (decimalPart && decimalPart.length > 2) {
    return { isValid: false, error: 'Maximum 2 decimal places allowed' };
  }

  return { isValid: true };
};

/**
 * Validate buy order
 */
export const validateBuyOrder = (
  quantity: number,
  price: number,
  balance: number
): ValidationResult => {
  const total = quantity * price;

  if (total > balance) {
    return {
      isValid: false,
      error: `Insufficient balance. Need $${total.toFixed(2)}, have $${balance.toFixed(2)}`,
    };
  }

  return { isValid: true };
};

/**
 * Validate sell order
 */
export const validateSellOrder = (
  quantity: number,
  holdingQuantity: number,
  symbol: string
): ValidationResult => {
  if (quantity > holdingQuantity) {
    return {
      isValid: false,
      error: `Insufficient ${symbol}. Have ${holdingQuantity.toFixed(2)}`,
    };
  }

  return { isValid: true };
};

/**
 * Validate limit order price
 */
export const validateLimitPrice = (
  value: string,
  currentPrice: number
): ValidationResult => {
  // Empty check
  if (!value || value.trim() === '') {
    return { isValid: false, error: 'Limit price is required' };
  }

  // Convert to number
  const price = parseFloat(value);

  // Check if valid number
  if (isNaN(price)) {
    return { isValid: false, error: 'Invalid price' };
  }

  // Must be positive
  if (price <= 0) {
    return { isValid: false, error: 'Price must be greater than 0' };
  }

  // Check decimal places (max 2)
  const decimalPart = value.split('.')[1];
  if (decimalPart && decimalPart.length > 2) {
    return { isValid: false, error: 'Maximum 2 decimal places allowed' };
  }

  // Warn if price is significantly different from current price (> 50%)
  const percentDiff = Math.abs((price - currentPrice) / currentPrice) * 100;
  if (percentDiff > 50) {
    return {
      isValid: true,
      error: `Warning: Price is ${percentDiff.toFixed(0)}% away from current price`,
    };
  }

  return { isValid: true };
};

/**
 * Format input to max 2 decimal places
 */
export const formatDecimalInput = (value: string): string => {
  // Remove any non-numeric characters except decimal point
  let cleaned = value.replace(/[^\d.]/g, '');

  // Ensure only one decimal point
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('');
  }

  // Limit to 2 decimal places
  if (parts.length === 2 && parts[1].length > 2) {
    cleaned = parts[0] + '.' + parts[1].substring(0, 2);
  }

  return cleaned;
};
