import { memo, useState, useCallback, useMemo } from 'react';
import type { Holding } from '../../types';
import { Input, Button } from '../common';
import { formatCurrency, validateQuantity, validateBuyOrder, validateSellOrder, formatDecimalInput } from '../../utils';
import styles from './TradeForm.module.css';

export interface TradeFormProps {
  tickerId: string;
  symbol: string;
  currentPrice: number;
  balance: number;
  holding: Holding | undefined;
  onBuy: (tickerId: string, quantity: number) => void;
  onSell: (tickerId: string, quantity: number) => void;
  onCreateLimitOrder?: (tickerId: string, type: 'BUY' | 'SELL', quantity: number, limitPrice: number) => void;
}

type OrderType = 'MARKET' | 'LIMIT';
type TradeType = 'BUY' | 'SELL';

export const TradeForm = memo(({
  tickerId,
  symbol,
  currentPrice,
  balance,
  holding,
  onBuy,
  onSell,
  onCreateLimitOrder,
}: TradeFormProps) => {
  const [quantity, setQuantity] = useState<string>('');
  const [orderType, setOrderType] = useState<OrderType>('MARKET');
  const [limitPrice, setLimitPrice] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TradeType>('BUY');

  // Calculate total
  const total = useMemo(() => {
    const qty = parseFloat(quantity) || 0;
    const price = orderType === 'MARKET' ? currentPrice : (parseFloat(limitPrice) || 0);
    return qty * price;
  }, [quantity, currentPrice, limitPrice, orderType]);

  // Validate quantity
  const quantityValidation = useMemo(() => {
    if (!quantity) return { isValid: false, error: '' };
    return validateQuantity(quantity);
  }, [quantity]);

  // Validate based on trade type
  const tradeValidation = useMemo(() => {
    const qty = parseFloat(quantity) || 0;
    
    if (!quantityValidation.isValid) {
      return quantityValidation;
    }

    if (activeTab === 'BUY') {
      const price = orderType === 'MARKET' ? currentPrice : (parseFloat(limitPrice) || 0);
      return validateBuyOrder(qty, price, balance);
    } else {
      const holdingQty = holding?.quantity || 0;
      return validateSellOrder(qty, holdingQty, symbol);
    }
  }, [activeTab, quantity, currentPrice, limitPrice, balance, holding, symbol, quantityValidation, orderType]);

  // Check if form is valid
  const isFormValid = useMemo(() => {
    if (orderType === 'LIMIT' && !limitPrice) return false;
    return quantityValidation.isValid && tradeValidation.isValid;
  }, [quantityValidation, tradeValidation, orderType, limitPrice]);

  // Handle quantity input
  const handleQuantityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDecimalInput(e.target.value);
    setQuantity(formatted);
  }, []);

  // Handle limit price input
  const handleLimitPriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDecimalInput(e.target.value);
    setLimitPrice(formatted);
  }, []);

  // Handle buy
  const handleBuy = useCallback(() => {
    if (!isFormValid) return;

    const qty = parseFloat(quantity);

    if (orderType === 'MARKET') {
      onBuy(tickerId, qty);
      setQuantity('');
    } else if (orderType === 'LIMIT' && onCreateLimitOrder) {
      const price = parseFloat(limitPrice);
      onCreateLimitOrder(tickerId, 'BUY', qty, price);
      setQuantity('');
      setLimitPrice('');
    }
  }, [isFormValid, quantity, orderType, tickerId, limitPrice, onBuy, onCreateLimitOrder]);

  // Handle sell
  const handleSell = useCallback(() => {
    if (!isFormValid) return;

    const qty = parseFloat(quantity);

    if (orderType === 'MARKET') {
      onSell(tickerId, qty);
      setQuantity('');
    } else if (orderType === 'LIMIT' && onCreateLimitOrder) {
      const price = parseFloat(limitPrice);
      onCreateLimitOrder(tickerId, 'SELL', qty, price);
      setQuantity('');
      setLimitPrice('');
    }
  }, [isFormValid, quantity, orderType, tickerId, limitPrice, onSell, onCreateLimitOrder]);

  // Quick amount buttons
  const setQuickAmount = useCallback((percentage: number) => {
    if (activeTab === 'BUY') {
      const availableAmount = balance / currentPrice;
      const qty = (availableAmount * percentage / 100).toFixed(2);
      setQuantity(qty);
    } else {
      const availableQty = holding?.quantity || 0;
      const qty = (availableQty * percentage / 100).toFixed(2);
      setQuantity(qty);
    }
  }, [activeTab, balance, currentPrice, holding]);

  return (
    <div className={styles.tradeForm}>
      {/* Trade Type Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'BUY' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('BUY')}
        >
          Buy
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'SELL' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('SELL')}
        >
          Sell
        </button>
      </div>

      {/* Trade Info */}
      <div className={styles.tradeInfo}>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Symbol:</span>
          <span className={styles.infoValue}>{symbol}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Price:</span>
          <span className={styles.infoValue}>{formatCurrency(currentPrice)}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Balance:</span>
          <span className={styles.infoValue}>{formatCurrency(balance)}</span>
        </div>
        {activeTab === 'SELL' && holding && (
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Holdings:</span>
            <span className={styles.infoValue}>{holding.quantity.toFixed(2)} {symbol}</span>
          </div>
        )}
      </div>

      {/* Order Type Toggle */}
      <div className={styles.orderTypeToggle}>
        <button
          className={`${styles.orderTypeBtn} ${orderType === 'MARKET' ? styles.orderTypeBtnActive : ''}`}
          onClick={() => setOrderType('MARKET')}
        >
          Market
        </button>
        <button
          className={`${styles.orderTypeBtn} ${orderType === 'LIMIT' ? styles.orderTypeBtnActive : ''}`}
          onClick={() => setOrderType('LIMIT')}
          disabled={!onCreateLimitOrder}
        >
          Limit
        </button>
      </div>

      {/* Limit Price Input (only for LIMIT orders) */}
      {orderType === 'LIMIT' && (
        <Input
          type="text"
          label="Limit Price"
          value={limitPrice}
          onChange={handleLimitPriceChange}
          placeholder="0.00"
          fullWidth
        />
      )}

      {/* Quantity Input */}
      <Input
        type="text"
        label="Quantity"
        value={quantity}
        onChange={handleQuantityChange}
        placeholder="0.00"
        error={quantity && !quantityValidation.isValid ? quantityValidation.error : undefined}
        fullWidth
      />

      {/* Quick Amount Buttons */}
      <div className={styles.quickButtons}>
        <button className={styles.quickBtn} onClick={() => setQuickAmount(25)}>
          25%
        </button>
        <button className={styles.quickBtn} onClick={() => setQuickAmount(50)}>
          50%
        </button>
        <button className={styles.quickBtn} onClick={() => setQuickAmount(75)}>
          75%
        </button>
        <button className={styles.quickBtn} onClick={() => setQuickAmount(100)}>
          100%
        </button>
      </div>

      {/* Total */}
      <div className={styles.total}>
        <span className={styles.totalLabel}>Total:</span>
        <span className={styles.totalValue}>{formatCurrency(total)}</span>
      </div>

      {/* Validation Error */}
      {quantity && !tradeValidation.isValid && (
        <div className={styles.validationError}>
          {tradeValidation.error}
        </div>
      )}

      {/* Action Buttons */}
      <div className={styles.actions}>
        {activeTab === 'BUY' ? (
          <Button
            variant="success"
            fullWidth
            onClick={handleBuy}
            disabled={!isFormValid}
          >
            {orderType === 'MARKET' ? 'Buy' : 'Create Buy Limit Order'}
          </Button>
        ) : (
          <Button
            variant="danger"
            fullWidth
            onClick={handleSell}
            disabled={!isFormValid}
          >
            {orderType === 'MARKET' ? 'Sell' : 'Create Sell Limit Order'}
          </Button>
        )}
      </div>
    </div>
  );
});

TradeForm.displayName = 'TradeForm';
