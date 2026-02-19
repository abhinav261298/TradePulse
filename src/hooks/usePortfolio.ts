import { useState, useEffect, useCallback } from 'react';
import type { Portfolio, Holding } from '../types';
import { saveToStorage, loadFromStorage, STORAGE_KEYS } from '../utils/storage';
import { preciseMultiply, preciseAdd, preciseSubtract, roundToPrecision } from '../utils';

const INITIAL_BALANCE = 10000;

const INITIAL_PORTFOLIO: Portfolio = {
  balance: INITIAL_BALANCE,
  holdings: [],
  totalValue: INITIAL_BALANCE,
  profitLoss: 0,
};

/**
 * Portfolio Management Hook
 */
export const usePortfolio = (getCurrentPrice: (tickerId: string) => number) => {
  const [portfolio, setPortfolio] = useState<Portfolio>(() => {
    return loadFromStorage(STORAGE_KEYS.PORTFOLIO, INITIAL_PORTFOLIO);
  });

  // Save to localStorage whenever portfolio changes
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.PORTFOLIO, portfolio);
  }, [portfolio]);

  // Update portfolio values based on current prices
  const updatePortfolioValues = useCallback(() => {
    setPortfolio((prev) => {
      const updatedHoldings = prev.holdings.map((holding) => {
        const currentPrice = getCurrentPrice(holding.tickerId);
        const totalValue = preciseMultiply(holding.quantity, currentPrice);
        const costBasis = preciseMultiply(holding.quantity, holding.averagePrice);
        const profitLoss = preciseSubtract(totalValue, costBasis);
        const profitLossPercentage = (profitLoss / costBasis) * 100;

        return {
          ...holding,
          currentPrice,
          totalValue: roundToPrecision(totalValue, 2),
          profitLoss: roundToPrecision(profitLoss, 2),
          profitLossPercentage: roundToPrecision(profitLossPercentage, 2),
        };
      });

      const totalHoldingsValue = updatedHoldings.reduce(
        (sum, holding) => preciseAdd(sum, holding.totalValue),
        0
      );
      const totalValue = preciseAdd(prev.balance, totalHoldingsValue);
      const profitLoss = preciseSubtract(totalValue, INITIAL_BALANCE);

      return {
        ...prev,
        holdings: updatedHoldings,
        totalValue: roundToPrecision(totalValue, 2),
        profitLoss: roundToPrecision(profitLoss, 2),
      };
    });
  }, [getCurrentPrice]);

  // Buy asset
  const buyAsset = useCallback(
    (tickerId: string, symbol: string, quantity: number, price: number): boolean => {
      const total = preciseMultiply(quantity, price);

      if (total > portfolio.balance) {
        return false; // Insufficient balance
      }

      setPortfolio((prev) => {
        const newBalance = preciseSubtract(prev.balance, total);
        const existingHoldingIndex = prev.holdings.findIndex((h) => h.tickerId === tickerId);

        let newHoldings: Holding[];

        if (existingHoldingIndex >= 0) {
          // Update existing holding
          const existing = prev.holdings[existingHoldingIndex];
          const newQuantity = preciseAdd(existing.quantity, quantity);
          const newAveragePrice =
            (preciseMultiply(existing.quantity, existing.averagePrice) + total) / newQuantity;

          newHoldings = [...prev.holdings];
          newHoldings[existingHoldingIndex] = {
            ...existing,
            quantity: roundToPrecision(newQuantity, 8),
            averagePrice: roundToPrecision(newAveragePrice, 2),
          };
        } else {
          // Create new holding
          newHoldings = [
            ...prev.holdings,
            {
              tickerId,
              symbol,
              quantity: roundToPrecision(quantity, 8),
              averagePrice: roundToPrecision(price, 2),
              currentPrice: price,
              totalValue: total,
              profitLoss: 0,
              profitLossPercentage: 0,
            },
          ];
        }

        return {
          ...prev,
          balance: roundToPrecision(newBalance, 2),
          holdings: newHoldings,
        };
      });

      return true;
    },
    [portfolio.balance]
  );

  // Sell asset
  const sellAsset = useCallback(
    (tickerId: string, quantity: number, price: number): boolean => {
      const holding = portfolio.holdings.find((h) => h.tickerId === tickerId);

      if (!holding || holding.quantity < quantity) {
        return false; // Insufficient holdings
      }

      setPortfolio((prev) => {
        const total = preciseMultiply(quantity, price);
        const newBalance = preciseAdd(prev.balance, total);
        const newQuantity = preciseSubtract(holding.quantity, quantity);

        let newHoldings: Holding[];

        if (newQuantity <= 0) {
          // Remove holding entirely
          newHoldings = prev.holdings.filter((h) => h.tickerId !== tickerId);
        } else {
          // Update holding quantity
          newHoldings = prev.holdings.map((h) =>
            h.tickerId === tickerId
              ? { ...h, quantity: roundToPrecision(newQuantity, 8) }
              : h
          );
        }

        return {
          ...prev,
          balance: roundToPrecision(newBalance, 2),
          holdings: newHoldings,
        };
      });

      return true;
    },
    [portfolio.holdings]
  );

  const resetPortfolio = useCallback(() => {
    setPortfolio(INITIAL_PORTFOLIO);
  }, []);

  return {
    portfolio,
    buyAsset,
    sellAsset,
    updatePortfolioValues,
    resetPortfolio,
  };
};
