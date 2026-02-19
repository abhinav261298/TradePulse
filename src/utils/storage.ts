// LocalStorage utility functions

const STORAGE_KEYS = {
  PORTFOLIO: 'tradepulse_portfolio',
  TRADES: 'tradepulse_trades',
  WATCHLIST: 'tradepulse_watchlist',
  LIMIT_ORDERS: 'tradepulse_limit_orders',
  PRICE_HISTORY: 'tradepulse_price_history',
} as const;

/**
 * Save data to localStorage
 */
export const saveToStorage = <T>(key: string, data: T): void => {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(key, serialized);
  } catch (error) {
    console.error(`Error saving to localStorage: ${error}`);
  }
};

/**
 * Load data from localStorage
 */
export const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const serialized = localStorage.getItem(key);
    if (serialized === null) {
      return defaultValue;
    }
    return JSON.parse(serialized) as T;
  } catch (error) {
    console.error(`Error loading from localStorage: ${error}`);
    return defaultValue;
  }
};

/**
 * Remove data from localStorage
 */
export const removeFromStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing from localStorage: ${error}`);
  }
};

/**
 * Clear all TradePulse data from localStorage
 */
export const clearAllStorage = (): void => {
  Object.values(STORAGE_KEYS).forEach((key) => {
    removeFromStorage(key);
  });
};

export { STORAGE_KEYS };
