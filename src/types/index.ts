// Global type definitions for TradePulse Trading Terminal

export interface Ticker {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
}

export interface Trade {
  id: string;
  tickerId: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  timestamp: number;
  total: number;
}

export interface Portfolio {
  balance: number;
  holdings: Holding[];
  totalValue: number;
  profitLoss: number;
}

export interface Holding {
  tickerId: string;
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  totalValue: number;
  profitLoss: number;
  profitLossPercentage: number;
}

export interface LimitOrder {
  id: string;
  tickerId: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  triggerPrice: number;
  quantity: number;
  status: 'PENDING' | 'EXECUTED' | 'CANCELLED';
  createdAt: number;
}

export interface PricePoint {
  timestamp: number;
  price: number;
}

export interface ChartData {
  tickerId: string;
  symbol: string;
  priceHistory: PricePoint[];
}
