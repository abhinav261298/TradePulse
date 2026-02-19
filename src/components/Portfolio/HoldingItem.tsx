import { memo } from 'react';
import type { Holding } from '../../types';
import { formatCurrency, formatPercentage } from '../../utils';
import styles from './Portfolio.module.css';

export interface HoldingItemProps {
  holding: Holding;
}

export const HoldingItem = memo(({
  holding,
}: HoldingItemProps) => {
  const plClass = holding.profitLoss >= 0 ? styles.positive : styles.negative;

  return (
    <div className={styles.holdingItem}>
      <div className={styles.holdingRow}>
        <span className={styles.holdingSymbol}>{holding.symbol}</span>
        <span className={styles.holdingQuantity}>
          {holding.quantity.toFixed(2)}
        </span>
      </div>
      
      <div className={styles.holdingRow}>
        <span className={styles.holdingLabel}>Value:</span>
        <span className={styles.holdingValue}>
          {formatCurrency(holding.totalValue)}
        </span>
      </div>
      
      <div className={styles.holdingRow}>
        <span className={styles.holdingLabel}>P&L:</span>
        <span className={`${styles.holdingPL} ${plClass}`}>
          {formatCurrency(holding.profitLoss)} ({formatPercentage(holding.profitLossPercentage)})
        </span>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.holding.tickerId === nextProps.holding.tickerId &&
    prevProps.holding.quantity === nextProps.holding.quantity &&
    prevProps.holding.currentPrice === nextProps.holding.currentPrice &&
    prevProps.holding.profitLoss === nextProps.holding.profitLoss
  );
});

HoldingItem.displayName = 'HoldingItem';
