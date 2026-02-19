import { useState, useEffect, useCallback } from 'react';
import type { Ticker, LimitOrder } from './types';
import { useMockPriceEngine, usePortfolio, useTrades, useWatchlist, useLimitOrders, useToast } from './hooks';
import { Watchlist, Terminal, Portfolio, ToastContainer } from './components';
import './App.css';

const App = () => {
  const [selectedTickerId, setSelectedTickerId] = useState<string>('btc');
  const { subscribe, getPriceHistory, getCurrentPrice } = useMockPriceEngine();
  const [currentTickers, setCurrentTickers] = useState<Map<string, Ticker>>(new Map());

  // Watchlist hook
  const { watchlist } = useWatchlist();

  // Portfolio hook
  const { portfolio, buyAsset, sellAsset, updatePortfolioValues, resetPortfolio } = usePortfolio(getCurrentPrice);

  // Trades hook
  const { trades, addTrade, clearTrades } = useTrades();

  // Toast hook
  const toast = useToast();

  // Limit orders hook
  const handleLimitOrderExecute = useCallback((order: LimitOrder, currentPrice: number) => {
    if (order.type === 'BUY') {
      const buySuccess = buyAsset(order.tickerId, order.symbol, order.quantity, currentPrice);
      if (buySuccess) {
        addTrade(order.tickerId, order.symbol, 'BUY', currentPrice, order.quantity);
        toast.success(`Limit Buy executed: ${order.quantity.toFixed(2)} ${order.symbol} @ ${currentPrice.toFixed(2)}`);
      } else {
        toast.error(`Failed to execute limit buy: Insufficient balance`);
      }
    } else {
      const sellSuccess = sellAsset(order.tickerId, order.quantity, currentPrice);
      if (sellSuccess) {
        addTrade(order.tickerId, order.symbol, 'SELL', currentPrice, order.quantity);
        toast.success(`Limit Sell executed: ${order.quantity.toFixed(2)} ${order.symbol} @ ${currentPrice.toFixed(2)}`);
      } else {
        toast.error(`Failed to execute limit sell: Insufficient holdings`);
      }
    }
  }, [buyAsset, sellAsset, addTrade, toast]);

  const { limitOrders, createLimitOrder, cancelLimitOrder } = useLimitOrders(currentTickers, handleLimitOrderExecute);

  // Subscribe to price updates
  useEffect(() => {
    const unsubscribe = subscribe((updatedTickers) => {
      setCurrentTickers(new Map(updatedTickers));
      // Update portfolio values with new prices
      updatePortfolioValues();
    });

    return unsubscribe;
  }, [subscribe, updatePortfolioValues]);

  const handleTickerSelect = (tickerId: string) => {
    setSelectedTickerId(tickerId);
  };

  const handleReset = () => {
    resetPortfolio();
    clearTrades();
  };

  // Handle buy
  const handleBuy = useCallback((tickerId: string, quantity: number) => {
    const ticker = currentTickers.get(tickerId);
    if (!ticker) return;

    const buySuccess = buyAsset(tickerId, ticker.symbol, quantity, ticker.price);
    
    if (buySuccess) {
      addTrade(tickerId, ticker.symbol, 'BUY', ticker.price, quantity);
      toast.success(`Bought ${quantity.toFixed(2)} ${ticker.symbol} @ ${ticker.price.toFixed(2)}`);
    } else {
      toast.error('Insufficient balance for this purchase');
    }
  }, [currentTickers, buyAsset, addTrade, toast]);

  // Handle sell
  const handleSell = useCallback((tickerId: string, quantity: number) => {
    const ticker = currentTickers.get(tickerId);
    if (!ticker) return;

    const sellSuccess = sellAsset(tickerId, quantity, ticker.price);
    
    if (sellSuccess) {
      addTrade(tickerId, ticker.symbol, 'SELL', ticker.price, quantity);
      toast.success(`Sold ${quantity.toFixed(2)} ${ticker.symbol} @ ${ticker.price.toFixed(2)}`);
    } else {
      toast.error(`Insufficient ${ticker.symbol} holding for this sale`);
    }
  }, [currentTickers, sellAsset, addTrade, toast]);

  // Handle create limit order
  const handleCreateLimitOrder = useCallback((tickerId: string, type: 'BUY' | 'SELL', quantity: number, limitPrice: number) => {
    const ticker = currentTickers.get(tickerId);
    if (!ticker) return;

    createLimitOrder(tickerId, ticker.symbol, type, limitPrice, quantity);
    toast.info(`${type} Limit Order created: ${quantity.toFixed(2)} ${ticker.symbol} @ ${limitPrice.toFixed(2)}`);
  }, [currentTickers, createLimitOrder, toast]);

  const selectedTicker = currentTickers.get(selectedTickerId);
  const priceHistory = getPriceHistory(selectedTickerId);
  const currentPrice = selectedTicker?.price || 0;
  const holding = portfolio.holdings.find(h => h.tickerId === selectedTickerId);

  return (
    <div className="app-container">
      {/* Watchlist Panel - 25% */}
      <div className="panel">
        <div className="panel-header">
          <h2>Watchlist</h2>
        </div>
        <div className="panel-content" style={{ padding: 0 }}>
          <Watchlist
            tickers={currentTickers}
            watchlist={watchlist}
            selectedTickerId={selectedTickerId}
            limitOrders={limitOrders}
            onTickerSelect={handleTickerSelect}
          />
        </div>
      </div>

      {/* Terminal Panel - 50% */}
      <div className="panel">
        <div className="panel-header">
          <h2>Terminal - {selectedTicker?.symbol || 'BTC'}</h2>
        </div>
        <div className="panel-content" style={{ padding: 0 }}>
          <Terminal
            selectedTickerId={selectedTickerId}
            selectedSymbol={selectedTicker?.symbol || 'BTC'}
            priceHistory={priceHistory}
            currentPrice={currentPrice}
            balance={portfolio.balance}
            holding={holding}
            onBuy={handleBuy}
            onSell={handleSell}
            onCreateLimitOrder={handleCreateLimitOrder}
          />
        </div>
      </div>

      {/* Portfolio Panel - 25% */}
      <div className="panel">
        <div className="panel-header">
          <h2>Portfolio</h2>
        </div>
        <div className="panel-content">
          <Portfolio
            portfolio={portfolio}
            trades={trades}
            limitOrders={limitOrders}
            onReset={handleReset}
            onCancelOrder={cancelLimitOrder}
          />
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  );
};

export default App;
