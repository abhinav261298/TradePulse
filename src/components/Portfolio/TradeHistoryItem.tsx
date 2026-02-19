import { memo } from 'react';
import type { Trade } from '../../types';
import { formatCurrency } from '../../utils';
import styles from './Portfolio.module.css';

export interface TradeHistoryItemProps {
  trade: Trade;
}

const formatTimeAgo = (timestamp: number): string => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return `${seconds}s ago`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export const TradeHistoryItem = memo(({
  trade,
}: TradeHistoryItemProps) => {
  const typeClass = trade.type === 'BUY' ? styles.buy : styles.sell;

  return (
    <div className={styles.tradeItem}>
      <div className={styles.tradeRow}>
        <span className={`${styles.tradeType} ${typeClass}`}>
          {trade.type}
        </span>
        <span className={styles.tradeSymbol}>{trade.symbol}</span>
        <span className={styles.tradeTime}>{formatTimeAgo(trade.timestamp)}</span>
      </div>
      
      <div className={styles.tradeRow}>
        <span className={styles.tradeLabel}>Qty:</span>
        <span className={styles.tradeValue}>{trade.quantity.toFixed(2)}</span>
        <span className={styles.tradeLabel}>@</span>
        <span className={styles.tradeValue}>{formatCurrency(trade.price)}</span>
      </div>
      
      <div className={styles.tradeRow}>
        <span className={styles.tradeLabel}>Total:</span>
        <span className={styles.tradeTotal}>{formatCurrency(trade.total)}</span>
      </div>
    </div>
  );
});

TradeHistoryItem.displayName = 'TradeHistoryItem';
