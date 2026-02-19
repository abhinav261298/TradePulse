import { memo } from 'react';
import type { PricePoint, Holding } from '../../types';
import { Chart } from './Chart';
import { TradeForm } from './TradeForm';
import styles from './Terminal.module.css';

export interface TerminalProps {
  selectedTickerId: string;
  selectedSymbol: string;
  priceHistory: PricePoint[];
  currentPrice: number;
  balance: number;
  holding: Holding | undefined;
  onBuy: (tickerId: string, quantity: number) => void;
  onSell: (tickerId: string, quantity: number) => void;
  onCreateLimitOrder?: (tickerId: string, type: 'BUY' | 'SELL', quantity: number, limitPrice: number) => void;
}

export const Terminal = memo(({
  selectedTickerId,
  selectedSymbol,
  priceHistory,
  currentPrice,
  balance,
  holding,
  onBuy,
  onSell,
  onCreateLimitOrder,
}: TerminalProps) => {
  return (
    <div className={styles.terminal}>
      <div className={styles.chartSection}>
        <Chart
          priceHistory={priceHistory}
          currentPrice={currentPrice}
          symbol={selectedSymbol}
        />
      </div>
      
      <div className={styles.tradeFormSection}>
        <TradeForm
          tickerId={selectedTickerId}
          symbol={selectedSymbol}
          currentPrice={currentPrice}
          balance={balance}
          holding={holding}
          onBuy={onBuy}
          onSell={onSell}
          onCreateLimitOrder={onCreateLimitOrder}
        />
      </div>
    </div>
  );
});

Terminal.displayName = 'Terminal';
