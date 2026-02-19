import { useState, useEffect, useCallback, useRef } from 'react';
import type { LimitOrder, Ticker } from '../types';
import { saveToStorage, loadFromStorage, STORAGE_KEYS } from '../utils/storage';
import { generateId } from '../utils';

/**
 * Limit Orders Hook
 * Manages limit orders and automatically executes them when trigger price is hit
 */
export const useLimitOrders = (
  tickers: Map<string, Ticker>,
  onOrderExecute: (order: LimitOrder, currentPrice: number) => void
) => {
  const [limitOrders, setLimitOrders] = useState<LimitOrder[]>(() => {
    return loadFromStorage<LimitOrder[]>(STORAGE_KEYS.LIMIT_ORDERS, []);
  });

  // Track newly created order IDs to skip immediate execution
  const newOrderIdsRef = useRef<Set<string>>(new Set());

  // Save to localStorage whenever limit orders change
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.LIMIT_ORDERS, limitOrders);
  }, [limitOrders]);

  // Check and execute limit orders based on current prices
  useEffect(() => {
    const pendingOrders = limitOrders.filter((order) => order.status === 'PENDING');

    pendingOrders.forEach((order) => {
      // Skip newly created orders (don't execute them immediately)
      if (newOrderIdsRef.current.has(order.id)) {
        return;
      }

      const ticker = tickers.get(order.tickerId);
      if (!ticker) return;

      const shouldExecute =
        (order.type === 'BUY' && ticker.price <= order.triggerPrice) ||
        (order.type === 'SELL' && ticker.price >= order.triggerPrice);

      if (shouldExecute) {
        // Execute order
        setLimitOrders((prev) =>
          prev.map((o) =>
            o.id === order.id ? { ...o, status: 'EXECUTED' as const } : o
          )
        );
        onOrderExecute(order, ticker.price);
      }
    });
  }, [tickers, limitOrders, onOrderExecute]);

  // Clear newly created order IDs after each price update (allow execution on next cycle)
  useEffect(() => {
    if (newOrderIdsRef.current.size > 0) {
      newOrderIdsRef.current.clear();
    }
  }, [tickers]);

  const createLimitOrder = useCallback(
    (
      tickerId: string,
      symbol: string,
      type: 'BUY' | 'SELL',
      triggerPrice: number,
      quantity: number
    ): LimitOrder => {
      const order: LimitOrder = {
        id: generateId(),
        tickerId,
        symbol,
        type,
        triggerPrice,
        quantity,
        status: 'PENDING',
        createdAt: Date.now(),
      };

      // Mark this order as newly created (skip immediate execution)
      newOrderIdsRef.current.add(order.id);

      setLimitOrders((prev) => [...prev, order]);
      return order;
    },
    []
  );

  const cancelLimitOrder = useCallback((orderId: string): void => {
    setLimitOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status: 'CANCELLED' as const } : order
      )
    );
  }, []);

  const getPendingOrders = useCallback((): LimitOrder[] => {
    return limitOrders.filter((order) => order.status === 'PENDING');
  }, [limitOrders]);

  const clearExecutedOrders = useCallback((): void => {
    setLimitOrders((prev) => prev.filter((order) => order.status === 'PENDING'));
  }, []);

  return {
    limitOrders,
    createLimitOrder,
    cancelLimitOrder,
    getPendingOrders,
    clearExecutedOrders,
  };
};
