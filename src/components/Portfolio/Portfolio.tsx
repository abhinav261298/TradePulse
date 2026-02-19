import { memo, useCallback } from 'react';
import type { Portfolio as PortfolioType, Trade, LimitOrder } from '../../types';
import { formatCurrency, formatPercentage } from '../../utils';
import { HoldingItem } from './HoldingItem.js';
import { TradeHistoryItem } from './TradeHistoryItem.js';
import { LimitOrderPanel } from './LimitOrderPanel';
import { Button } from '../common';
import styles from './Portfolio.module.css';

export interface PortfolioProps {
  portfolio: PortfolioType;
  trades: Trade[];
  limitOrders: LimitOrder[];
  onReset: () => void;
  onCancelOrder: (orderId: string) => void;
}

export const Portfolio = memo(({
  portfolio,
  trades,
  limitOrders,
  onReset,
  onCancelOrder,
}: PortfolioProps) => {
  const handleReset = useCallback(() => {
    const confirmed = window.confirm(
      'Are you sure you want to reset your portfolio? This will reset your balance to $10,000 and clear all trades and holdings.'
    );
    
    if (confirmed) {
      onReset();
    }
  }, [onReset]);

  // Calculate metrics
  const roi = portfolio.totalValue > 0
    ? ((portfolio.totalValue - 10000) / 10000) * 100
    : 0;

  const avgProfitPerTrade = trades.length > 0
    ? portfolio.profitLoss / trades.length
    : 0;

  // Get latest 50 trades
  const recentTrades = trades.slice(-50).reverse();

  return (
    <div className={styles.portfolio}>
      {/* Portfolio Summary */}
      <div className={styles.summary}>
        <div className={styles.summaryItem}>
          <span className={styles.label}>Balance</span>
          <span className={styles.value}>
            {formatCurrency(portfolio.balance)}
          </span>
        </div>
        
        <div className={styles.summaryItem}>
          <span className={styles.label}>Holdings Value</span>
          <span className={styles.value}>
            {formatCurrency(portfolio.totalValue - portfolio.balance)}
          </span>
        </div>
        
        <div className={styles.summaryItem}>
          <span className={styles.label}>Total Value</span>
          <span className={`${styles.value} ${styles.totalValue}`}>
            {formatCurrency(portfolio.totalValue)}
          </span>
        </div>
        
        <div className={styles.divider} />
        
        <div className={styles.summaryItem}>
          <span className={styles.label}>P&L</span>
          <span className={`${styles.value} ${portfolio.profitLoss >= 0 ? styles.positive : styles.negative}`}>
            {formatCurrency(portfolio.profitLoss)}
          </span>
        </div>
        
        <div className={styles.summaryItem}>
          <span className={styles.label}>ROI</span>
          <span className={`${styles.value} ${roi >= 0 ? styles.positive : styles.negative}`}>
            {formatPercentage(roi)}
          </span>
        </div>
        
        <div className={styles.summaryItem}>
          <span className={styles.label}>Avg Profit/Trade</span>
          <span className={`${styles.value} ${avgProfitPerTrade >= 0 ? styles.positive : styles.negative}`}>
            {formatCurrency(avgProfitPerTrade)}
          </span>
        </div>
        
        <div className={styles.divider} />
        
        <Button
          variant="danger"
          size="sm"
          fullWidth
          onClick={handleReset}
        >
          Reset Portfolio
        </Button>
      </div>

      {/* Holdings */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Holdings</h3>
        {portfolio.holdings.length > 0 ? (
          <div className={styles.holdings}>
            {portfolio.holdings.map((holding) => (
              <HoldingItem key={holding.tickerId} holding={holding} />
            ))}
          </div>
        ) : (
          <p className={styles.emptyState}>
            No holdings yet. Buy some assets to get started!
          </p>
        )}
      </div>

      {/* Limit Orders */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          Limit Orders ({limitOrders.filter(o => o.status === 'PENDING').length})
        </h3>
        <LimitOrderPanel
          limitOrders={limitOrders}
          onCancelOrder={onCancelOrder}
        />
      </div>

      {/* Trade History */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          Trade History ({trades.length})
        </h3>
        {recentTrades.length > 0 ? (
          <div className={styles.tradeHistory}>
            {recentTrades.map((trade) => (
              <TradeHistoryItem key={trade.id} trade={trade} />
            ))}
          </div>
        ) : (
          <p className={styles.emptyState}>
            No trades yet. Start trading to see your history!
          </p>
        )}
      </div>
    </div>
  );
});

Portfolio.displayName = 'Portfolio';
