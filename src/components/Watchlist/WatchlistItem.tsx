import { memo } from 'react';
import type { Ticker } from '../../types';
import { formatCurrency, formatPercentage } from '../../utils';
import styles from './Watchlist.module.css';

export interface WatchlistItemProps {
  ticker: Ticker;
  isSelected: boolean;
  hasLimitOrder: boolean;
  onClick: () => void;
}

export const WatchlistItem = memo(({
  ticker,
  isSelected,
  hasLimitOrder,
  onClick,
}: WatchlistItemProps) => {
  const changeClass = ticker.change24h >= 0 ? styles.positive : styles.negative;
  const itemClass = `${styles.item} ${isSelected ? styles.selected : ''}`;

  return (
    <div className={itemClass} onClick={onClick} role="button" tabIndex={0}>
      <div className={styles.symbolRow}>
        <span className={styles.symbol}>{ticker.symbol}</span>
        {hasLimitOrder && (
          <span className={styles.limitIndicator} title="Has pending limit orders">
            🔔
          </span>
        )}
      </div>
      
      <div className={styles.priceRow}>
        <span className={styles.price}>{formatCurrency(ticker.price)}</span>
      </div>
      
      <div className={styles.changeRow}>
        <span className={`${styles.change} ${changeClass}`}>
          {formatPercentage(ticker.change24h)}
        </span>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for optimization
  return (
    prevProps.ticker.id === nextProps.ticker.id &&
    prevProps.ticker.price === nextProps.ticker.price &&
    prevProps.ticker.change24h === nextProps.ticker.change24h &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.hasLimitOrder === nextProps.hasLimitOrder
  );
});

WatchlistItem.displayName = 'WatchlistItem';
