import { memo } from 'react';
import type { Ticker, LimitOrder } from '../../types';
import { WatchlistItem } from './WatchlistItem.js';
import styles from './Watchlist.module.css';

export interface WatchlistProps {
  tickers: Map<string, Ticker>;
  watchlist: string[];
  selectedTickerId: string | null;
  limitOrders: LimitOrder[];
  onTickerSelect: (tickerId: string) => void;
}

export const Watchlist = memo(({
  tickers,
  watchlist,
  selectedTickerId,
  limitOrders,
  onTickerSelect,
}: WatchlistProps) => {
  // Check if a ticker has pending limit orders
  const hasLimitOrders = (tickerId: string): boolean => {
    return limitOrders.some(
      (order) => order.tickerId === tickerId && order.status === 'PENDING'
    );
  };

  return (
    <div className={styles.watchlist}>
      {watchlist.map((tickerId) => {
        const ticker = tickers.get(tickerId);
        if (!ticker) return null;

        return (
          <WatchlistItem
            key={ticker.id}
            ticker={ticker}
            isSelected={selectedTickerId === ticker.id}
            hasLimitOrder={hasLimitOrders(ticker.id)}
            onClick={() => onTickerSelect(ticker.id)}
          />
        );
      })}
    </div>
  );
});

Watchlist.displayName = 'Watchlist';
