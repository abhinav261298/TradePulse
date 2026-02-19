import { memo } from 'react';
import type { LimitOrder } from '../../types';
import { formatCurrency } from '../../utils';
import { Button } from '../common';
import styles from './LimitOrderPanel.module.css';

export interface LimitOrderPanelProps {
  limitOrders: LimitOrder[];
  onCancelOrder: (orderId: string) => void;
}

export const LimitOrderPanel = memo(({
  limitOrders,
  onCancelOrder,
}: LimitOrderPanelProps) => {
  const pendingOrders = limitOrders.filter(order => order.status === 'PENDING');

  if (pendingOrders.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No pending limit orders</p>
      </div>
    );
  }

  return (
    <div className={styles.limitOrderPanel}>
      <div className={styles.header}>
        <span className={styles.headerCell}>Type</span>
        <span className={styles.headerCell}>Symbol</span>
        <span className={styles.headerCell}>Qty</span>
        <span className={styles.headerCell}>Trigger Price</span>
        <span className={styles.headerCell}>Action</span>
      </div>

      <div className={styles.ordersList}>
        {pendingOrders.map((order) => (
          <div key={order.id} className={styles.orderRow}>
            <span className={`${styles.cell} ${styles.type} ${styles[order.type.toLowerCase()]}`}>
              {order.type}
            </span>
            <span className={styles.cell}>{order.symbol}</span>
            <span className={styles.cell}>{order.quantity.toFixed(2)}</span>
            <span className={styles.cell}>{formatCurrency(order.triggerPrice)}</span>
            <span className={styles.cell}>
              <Button
                variant="danger"
                size="sm"
                onClick={() => onCancelOrder(order.id)}
              >
                Cancel
              </Button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

LimitOrderPanel.displayName = 'LimitOrderPanel';
