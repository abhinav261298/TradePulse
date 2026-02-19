# TradePulse - Technical Product Requirements Document

**Version:** 1.0  
**Last Updated:** 2026-02-17  
**Status:** Ready for Implementation  
**Tech Stack:** React 19 + TypeScript 5.9 + Vite 7.3 + Jest

---

## 📋 Table of Contents
1. [Technology Stack](#technology-stack)
2. [System Architecture](#system-architecture)
3. [Component Specifications](#component-specifications)
4. [State Management](#state-management)
5. [Chart Implementation](#chart-implementation)
6. [Performance Optimization](#performance-optimization)
7. [Data Models](#data-models)
8. [Testing Strategy](#testing-strategy)
9. [File Structure](#file-structure)
10. [Implementation Phases](#implementation-phases)

---

## 1. Technology Stack

### Core Technologies
- **Framework:** React 19.2.0
- **Language:** TypeScript 5.9.3 (strict mode)
- **Build Tool:** Vite 7.3.1
- **Testing:** Jest + React Testing Library
- **Styling:** CSS Modules / Styled Components (TBD)
- **Linting:** ESLint 9.39.1 with TypeScript rules

### Key Dependencies
```json
{
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "typescript": "~5.9.3"
}
```

### Development Tools
- **Code Quality:** ESLint + TypeScript ESLint
- **Type Checking:** TypeScript strict mode
- **Hot Reload:** Vite HMR
- **Browser Support:** Chrome, Firefox, Safari (latest 2 versions)

---

## 2. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        TradePulse App                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Watchlist   │  │   Terminal   │  │  Portfolio   │      │
│  │  Component   │  │  Component   │  │  Component   │      │
│  │   (25%)      │  │    (50%)     │  │    (25%)     │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                  │               │
│         └─────────────────┼──────────────────┘               │
│                           │                                  │
│         ┌─────────────────▼─────────────────┐               │
│         │     State Management Layer        │               │
│         │  (Custom Hooks + Context API)     │               │
│         └─────────────────┬─────────────────┘               │
│                           │                                  │
│         ┌─────────────────▼─────────────────┐               │
│         │      Mock Price Engine            │               │
│         │   (1-second interval, random      │               │
│         │    walk algorithm, pub/sub)       │               │
│         └─────────────────┬─────────────────┘               │
│                           │                                  │
│         ┌─────────────────▼─────────────────┐               │
│         │      LocalStorage Layer           │               │
│         │   (Portfolio, Trades, Watchlist)  │               │
│         └───────────────────────────────────┘               │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow Architecture

```
Price Engine (1s) ──┐
                    │
                    ├──> Subscription Manager ──┐
                    │                           │
                    │                           ├──> Watchlist (prices update)
                    │                           │
                    │                           ├──> Chart (new data point)
                    │                           │
                    │                           └──> Portfolio (recalculate P&L)
                    │
                    └──> Limit Order Monitor ──> Auto-execute orders
                                                  │
                                                  └──> Portfolio Update
                                                       │
                                                       └──> Trade History
```

### Rendering Optimization Strategy

```
App
├── PriceEngineProvider (Context - updates every 1s)
│   └── subscribers: Set<callback>
│
├── Watchlist (memo, subscribes to price updates)
│   └── WatchlistItem (memo, selective re-render)
│
├── Terminal
│   ├── Chart (memo, useRef for canvas/svg, RAF for smooth updates)
│   └── TradeForm (memo, isolated state)
│
└── Portfolio (memo, subscribes to price updates)
    ├── Holdings (memo)
    └── TradeHistory (memo, virtualized list if >100 trades)
```

---

## 3. Component Specifications

### 3.1 App Component
**File:** `src/App.tsx`

**Responsibilities:**
- Initialize price engine
- Provide global state context
- Layout management (25-50-25 grid)
- Theme provider (dark mode)

**Structure:**
```tsx
<AppContainer>
  <PriceEngineProvider>
    <Watchlist />
    <Terminal />
    <Portfolio />
    <ToastNotificationContainer />
  </PriceEngineProvider>
</AppContainer>
```

**Props:** None  
**State:** Global app state via context  
**Performance:** No re-render on price updates

---

### 3.2 Watchlist Component
**File:** `src/components/Watchlist/Watchlist.tsx`

**Responsibilities:**
- Display list of tickers (BTC, ETH, SOL)
- Show live price and 24h change %
- Handle ticker selection
- Add/remove tickers (with min 1 ticker constraint)
- Color coding (green/red for up/down)
- Limit order indicator

**UI Elements:**
```
┌─────────────────────────┐
│      WATCHLIST          │
├─────────────────────────┤
│ [+] Add Ticker          │
├─────────────────────────┤
│ ► BTC        $45,231.50 │ ← Selected
│   +2.34%          🔔    │ ← Has limit order
├─────────────────────────┤
│   ETH        $3,045.21  │
│   -1.12%                │
├─────────────────────────┤
│   SOL          $102.34  │
│   +5.67%                │
└─────────────────────────┘
```

**Props:**
```typescript
interface WatchlistProps {
  onTickerSelect: (tickerId: string) => void;
  selectedTickerId: string | null;
}
```

**State:**
- `watchlist: string[]` (ticker IDs)
- Local UI state only (selection handled by parent)

**Performance:**
- Use `React.memo` for entire component
- Use `React.memo` for each `WatchlistItem`
- Subscribe to price updates via context selector
- Only re-render changed items

---

### 3.3 Terminal Component
**File:** `src/components/Terminal/Terminal.tsx`

**Responsibilities:**
- Container for Chart and TradeForm
- Pass selected ticker to children

**Structure:**
```
┌─────────────────────────────────┐
│         TERMINAL                │
├─────────────────────────────────┤
│                                 │
│          Chart (70%)            │
│                                 │
├─────────────────────────────────┤
│       TradeForm (30%)           │
└─────────────────────────────────┘
```

**Props:**
```typescript
interface TerminalProps {
  selectedTickerId: string;
}
```

---

### 3.4 Chart Component
**File:** `src/components/Terminal/Chart.tsx`

**Responsibilities:**
- Render SVG line chart
- Display price history (300 data points = 5 minutes)
- Auto-scale Y-axis based on min/max prices
- Show X-axis (time labels)
- Show Y-axis (price labels)
- Current price indicator line
- Update every 1 second

**UI Elements:**
```
┌─────────────────────────────────────────┐
│  BTC Price Chart                        │
│  Current: $45,231.50                    │
├─────────────────────────────────────────┤
│ $46K ┼────────────────────╱──────      │
│      │                  ╱              │
│ $45K ┼───────────╱────╱───             │
│      │         ╱                        │
│ $44K ┼──╱────╱                         │
│      │                                  │
│      └────┬────┬────┬────┬────┬────    │
│        -5min  -4   -3   -2   -1   now  │
└─────────────────────────────────────────┘
```

**Props:**
```typescript
interface ChartProps {
  tickerId: string;
  priceHistory: PricePoint[];
  currentPrice: number;
}
```

**State:**
- `chartDimensions: { width: number; height: number }`
- No local price state (receive via props)

**Performance:**
- Use `React.memo`
- Use `useRef` for SVG element
- Debounce resize events (300ms)
- Only recalculate scales when data bounds change
- Use `requestAnimationFrame` for smooth updates

**Implementation Details:** See Section 5 (Chart Implementation)

---

### 3.5 TradeForm Component
**File:** `src/components/Terminal/TradeForm.tsx`

**Responsibilities:**
- Market order execution (Buy/Sell)
- Limit order creation
- Input validation
- Show available balance
- Disable buy button if insufficient balance
- Show current price

**UI Elements:**
```
┌─────────────────────────────────────┐
│  Trade BTC                          │
│  Current Price: $45,231.50          │
│  Available Balance: $10,000.00      │
├─────────────────────────────────────┤
│  Order Type: [Market ▼] [Limit]    │
│                                     │
│  Quantity: [________] BTC           │
│            (Max 2 decimals)         │
│                                     │
│  Total: $0.00                       │
│                                     │
│  [BUY] [SELL]                       │
├─────────────────────────────────────┤
│  Pending Limit Orders: 2            │
└─────────────────────────────────────┘
```

**Props:**
```typescript
interface TradeFormProps {
  tickerId: string;
  currentPrice: number;
  availableBalance: number;
  onTrade: (trade: TradeRequest) => void;
  onLimitOrder: (order: LimitOrderRequest) => void;
}
```

**State:**
```typescript
{
  orderType: 'MARKET' | 'LIMIT';
  quantity: string;
  triggerPrice: string; // for limit orders
  errors: { quantity?: string; triggerPrice?: string };
}
```

**Validation Rules:**
- Quantity: 0.01 to unlimited (2 decimal places)
- Quantity * Price <= Available Balance
- Trigger price: Must be valid number > 0
- Real-time validation on input change
- Submit-time validation before execution

**Performance:**
- Use `React.memo`
- Debounce quantity input (300ms) for total calculation
- Isolated state (doesn't affect other components)

---

### 3.6 Portfolio Component
**File:** `src/components/Portfolio/Portfolio.tsx`

**Responsibilities:**
- Display current holdings
- Show total balance and portfolio value
- Display P&L (profit/loss)
- Show ROI percentage
- Display average profit per trade
- Show trade history (latest first, max 50 visible)
- Reset portfolio button

**UI Elements:**
```
┌─────────────────────────────────────┐
│         PORTFOLIO                   │
├─────────────────────────────────────┤
│  Balance: $8,234.50                 │
│  Holdings: $2,456.78                │
│  Total Value: $10,691.28            │
│                                     │
│  P&L: +$691.28 (+6.91%)            │
│  ROI: 6.91%                         │
│  Avg Profit/Trade: +$23.45          │
│                                     │
│  [Reset Portfolio]                  │
├─────────────────────────────────────┤
│  HOLDINGS                           │
│  BTC  0.05  $2,261.58  +$123.45    │
│  ETH  0.10    $304.52   -$12.34    │
├─────────────────────────────────────┤
│  TRADE HISTORY                      │
│  BUY  BTC  0.02  $45,123  2m ago   │
│  SELL ETH  0.05  $3,012   5m ago   │
│  ...                                │
└─────────────────────────────────────┘
```

**Props:**
```typescript
interface PortfolioProps {
  portfolio: Portfolio;
  trades: Trade[];
  onReset: () => void;
}
```

**State:**
- No local state (all from context)

**Performance:**
- Use `React.memo`
- Use `React.memo` for each `HoldingItem` and `TradeItem`
- Subscribe to price updates for P&L recalculation
- Virtual scrolling if trades > 100

---

### 3.7 LimitOrderPanel Component
**File:** `src/components/Portfolio/LimitOrderPanel.tsx`

**Responsibilities:**
- Display pending limit orders
- Show cancel button for each order
- Show execution status

**UI Elements:**
```
┌─────────────────────────────────────┐
│  PENDING LIMIT ORDERS (2)           │
├─────────────────────────────────────┤
│  BUY  BTC  0.5 @ $44,000  [Cancel]  │
│  SELL ETH  1.0 @ $3,100   [Cancel]  │
└─────────────────────────────────────┘
```

**Props:**
```typescript
interface LimitOrderPanelProps {
  orders: LimitOrder[];
  onCancel: (orderId: string) => void;
}
```

---

### 3.8 ToastNotification Component
**File:** `src/components/common/ToastNotification.tsx`

**Responsibilities:**
- Display toast notifications
- Auto-dismiss after 3 seconds
- Stack max 3 toasts
- Position: top-right corner

**Types:**
- Success (green): Trade executed, limit order triggered
- Error (red): Insufficient balance, validation errors
- Info (blue): General information

**Props:**
```typescript
interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  duration?: number; // default 3000ms
}
```

---

## 4. State Management

### 4.1 Global State Architecture

**Approach:** Custom hooks + Context API (no Redux/Zustand)

**State Providers:**
1. `PriceEngineProvider` - Price updates and subscription
2. `PortfolioProvider` - Portfolio state and operations
3. `TradeProvider` - Trade history
4. `WatchlistProvider` - Watchlist management
5. `LimitOrderProvider` - Limit orders

### 4.2 State Flow Diagram

```
┌───────────────────────────────────────┐
│     useMockPriceEngine Hook           │
│  - Generates prices every 1s          │
│  - Maintains price history (300pts)   │
│  - Pub/sub pattern for subscribers    │
└─────────────┬─────────────────────────┘
              │
              ├──> Watchlist subscribes
              │    (updates price display)
              │
              ├──> Chart subscribes
              │    (adds new data point)
              │
              ├──> Portfolio subscribes
              │    (recalculates P&L)
              │
              └──> LimitOrderMonitor subscribes
                   (checks trigger conditions)
                   │
                   └──> Executes order
                        │
                        ├──> Updates Portfolio
                        │
                        ├──> Adds Trade
                        │
                        └──> Updates LimitOrder status
```

### 4.3 Hook Specifications

#### useMockPriceEngine
```typescript
interface UseMockPriceEngineReturn {
  tickers: Map<string, Ticker>;
  subscribe: (callback: (tickers: Map<string, Ticker>) => void) => () => void;
  getPriceHistory: (tickerId: string) => PricePoint[];
  getCurrentPrice: (tickerId: string) => number;
}

const useMockPriceEngine = (): UseMockPriceEngineReturn => {
  // Implementation: Already created
  // Updates every 1 second
  // Random walk: price += (random - 0.5) * 2 * volatility * price
  // Volatility: 2% fixed
}
```

#### usePortfolio
```typescript
interface UsePortfolioReturn {
  portfolio: Portfolio;
  buyAsset: (tickerId: string, symbol: string, quantity: number, price: number) => boolean;
  sellAsset: (tickerId: string, quantity: number, price: number) => boolean;
  updatePortfolioValues: () => void;
  resetPortfolio: () => void;
}

const usePortfolio = (getCurrentPrice: (tickerId: string) => number): UsePortfolioReturn => {
  // Implementation: Already created
  // Persists to localStorage
  // Validates balance before buy
  // Validates holdings before sell
}
```

#### useTrades
```typescript
interface UseTradesReturn {
  trades: Trade[];
  addTrade: (tickerId: string, symbol: string, type: 'BUY' | 'SELL', price: number, quantity: number) => Trade;
  clearTrades: () => void;
  getTradesByTicker: (tickerId: string) => Trade[];
}

const useTrades = (): UseTradesReturn => {
  // Implementation: Already created
  // Persists to localStorage
}
```

#### useWatchlist
```typescript
interface UseWatchlistReturn {
  watchlist: string[];
  addToWatchlist: (tickerId: string) => void;
  removeFromWatchlist: (tickerId: string) => void;
  isInWatchlist: (tickerId: string) => boolean;
}

const useWatchlist = (): UseWatchlistReturn => {
  // Implementation: Already created
  // Persists to localStorage
  // Default: ['btc', 'eth', 'sol']
}
```

#### useLimitOrders
```typescript
interface UseLimitOrdersReturn {
  limitOrders: LimitOrder[];
  createLimitOrder: (tickerId: string, symbol: string, type: 'BUY' | 'SELL', triggerPrice: number, quantity: number) => LimitOrder;
  cancelLimitOrder: (orderId: string) => void;
  getPendingOrders: () => LimitOrder[];
  clearExecutedOrders: () => void;
}

const useLimitOrders = (
  tickers: Map<string, Ticker>,
  onOrderExecute: (order: LimitOrder, currentPrice: number) => void
): UseLimitOrdersReturn => {
  // Implementation: Already created
  // Monitors prices and auto-executes
  // Persists to localStorage
}
```

### 4.4 Performance Optimization Patterns

**1. Subscription Pattern**
```typescript
// In PriceEngineProvider
const subscribe = useCallback((callback: SubscriberCallback) => {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}, []);

// In component
useEffect(() => {
  const unsubscribe = subscribe((tickers) => {
    // Only update this component's state
    setLocalPrice(tickers.get(selectedTickerId)?.price);
  });
  return unsubscribe;
}, [selectedTickerId, subscribe]);
```

**2. Selective Re-rendering**
```typescript
// Only re-render when specific ticker price changes
const price = useMemo(() => {
  return tickers.get(tickerId)?.price || 0;
}, [tickers, tickerId]);
```

**3. Memoization**
```typescript
// Expensive calculations
const chartScales = useMemo(() => {
  return calculateScales(priceHistory);
}, [priceHistory]);

// Component memoization
export default React.memo(Chart, (prev, next) => {
  return prev.tickerId === next.tickerId && 
         prev.currentPrice === next.currentPrice;
});
```

---

## 5. Chart Implementation

### 5.1 Technology Choice
**Selected:** SVG (as per PRD decision)

**Rationale:**
- Better for interactivity
- Easier tooltips
- Accessibility support
- 300 data points is manageable for SVG performance

### 5.2 Coordinate Mapping Algorithm

**Problem:** Convert price data to SVG coordinates

**Given:**
- SVG viewBox: `0 0 800 400` (responsive width, fixed aspect ratio)
- Price data: Array of `{ timestamp, price }`
- Price range: Min and Max from data

**Mapping Functions:**

```typescript
interface ChartDimensions {
  width: number;
  height: number;
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

interface ChartScales {
  xScale: (index: number) => number;
  yScale: (price: number) => number;
  minPrice: number;
  maxPrice: number;
}

const calculateScales = (
  priceHistory: PricePoint[],
  dimensions: ChartDimensions
): ChartScales => {
  const { width, height, padding } = dimensions;
  
  // Calculate usable area
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  // Find min/max prices
  const prices = priceHistory.map(p => p.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1; // Avoid division by zero
  
  // Add 5% padding to price range for visual spacing
  const pricePadding = priceRange * 0.05;
  const adjustedMin = minPrice - pricePadding;
  const adjustedMax = maxPrice + pricePadding;
  const adjustedRange = adjustedMax - adjustedMin;
  
  // X scale: Map data point index to X coordinate
  const xScale = (index: number): number => {
    const dataPointCount = priceHistory.length;
    if (dataPointCount <= 1) return padding.left;
    
    return padding.left + (index / (dataPointCount - 1)) * chartWidth;
  };
  
  // Y scale: Map price to Y coordinate (inverted - SVG Y starts at top)
  const yScale = (price: number): number => {
    const normalizedPrice = (price - adjustedMin) / adjustedRange;
    return padding.top + chartHeight - (normalizedPrice * chartHeight);
  };
  
  return { xScale, yScale, minPrice: adjustedMin, maxPrice: adjustedMax };
};
```

### 5.3 SVG Path Generation

```typescript
const generatePathData = (
  priceHistory: PricePoint[],
  scales: ChartScales
): string => {
  if (priceHistory.length === 0) return '';
  
  const { xScale, yScale } = scales;
  
  // Generate path commands
  const pathCommands = priceHistory.map((point, index) => {
    const x = xScale(index);
    const y = yScale(point.price);
    
    return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
  });
  
  return pathCommands.join(' ');
};
```

### 5.4 Chart Component Implementation

```typescript
const Chart: React.FC<ChartProps> = ({ tickerId, priceHistory, currentPrice }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<ChartDimensions>({
    width: 800,
    height: 400,
    padding: { top: 20, right: 60, bottom: 40, left: 60 },
  });
  
  // Handle resize with debounce
  useEffect(() => {
    const handleResize = debounce(() => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        setDimensions(prev => ({ ...prev, width }));
      }
    }, 300);
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Calculate scales
  const scales = useMemo(() => {
    return calculateScales(priceHistory, dimensions);
  }, [priceHistory, dimensions]);
  
  // Generate path
  const pathData = useMemo(() => {
    return generatePathData(priceHistory, scales);
  }, [priceHistory, scales]);
  
  // Generate axis labels
  const yAxisLabels = useMemo(() => {
    const { minPrice, maxPrice } = scales;
    return [
      maxPrice,
      (maxPrice + minPrice) / 2,
      minPrice,
    ].map(price => formatCurrency(price));
  }, [scales]);
  
  return (
    <div ref={containerRef} className="chart-container">
      <svg
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        className="price-chart"
      >
        {/* Grid lines */}
        <g className="grid">
          {/* Horizontal grid lines */}
          {[0, 0.5, 1].map((ratio) => {
            const y = dimensions.padding.top + ratio * 
                      (dimensions.height - dimensions.padding.top - dimensions.padding.bottom);
            return (
              <line
                key={ratio}
                x1={dimensions.padding.left}
                y1={y}
                x2={dimensions.width - dimensions.padding.right}
                y2={y}
                stroke="#333"
                strokeWidth="1"
                strokeDasharray="4"
              />
            );
          })}
        </g>
        
        {/* Y-axis labels */}
        <g className="y-axis">
          {yAxisLabels.map((label, index) => {
            const y = dimensions.padding.top + index * 
                      (dimensions.height - dimensions.padding.top - dimensions.padding.bottom) / 2;
            return (
              <text
                key={index}
                x={dimensions.padding.left - 10}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                fill="#888"
                fontSize="12"
              >
                {label}
              </text>
            );
          })}
        </g>
        
        {/* Price line */}
        <path
          d={pathData}
          fill="none"
          stroke="#3B82F6"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        
        {/* Current price indicator */}
        {priceHistory.length > 0 && (
          <g className="current-price-indicator">
            <line
              x1={dimensions.padding.left}
              y1={scales.yScale(currentPrice)}
              x2={dimensions.width - dimensions.padding.right}
              y2={scales.yScale(currentPrice)}
              stroke="#10B981"
              strokeWidth="1"
              strokeDasharray="4"
            />
            <text
              x={dimensions.width - dimensions.padding.right + 5}
              y={scales.yScale(currentPrice)}
              fill="#10B981"
              fontSize="12"
              dominantBaseline="middle"
            >
              {formatCurrency(currentPrice)}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};

export default React.memo(Chart);
```

### 5.5 Chart Update Strategy

**Performance Optimization:**

1. **Debounced Resize:** Window resize events debounced at 300ms
2. **Memoized Calculations:** Scales and path data recalculated only when data changes
3. **RequestAnimationFrame:** For smooth updates
4. **Selective Re-render:** React.memo prevents unnecessary renders

**Update Flow:**
```
Price Update (1s) 
  → useMockPriceEngine adds point to history
  → Chart receives new priceHistory via props
  → useMemo recalculates scales (if bounds changed)
  → useMemo regenerates path data
  → React renders new SVG path
```

---

## 6. Performance Optimization

### 6.1 Optimization Requirements

**Target Metrics:**
- Page load: < 3 seconds
- Price update impact: < 16ms (60 FPS)
- Chart render: < 100ms
- No UI lag during 1-second updates

### 6.2 Optimization Techniques

#### 6.2.1 Component-Level Optimization

**React.memo Usage:**
```typescript
// Prevent re-render unless props actually change
export default React.memo(Watchlist, (prevProps, nextProps) => {
  return prevProps.selectedTickerId === nextProps.selectedTickerId;
});
```

**useCallback for Stable References:**
```typescript
const handleBuyClick = useCallback(() => {
  buyAsset(tickerId, quantity, price);
}, [tickerId, quantity, price, buyAsset]);
```

**useMemo for Expensive Calculations:**
```typescript
const totalPortfolioValue = useMemo(() => {
  return holdings.reduce((sum, holding) => {
    return sum + holding.quantity * holding.currentPrice;
  }, balance);
}, [holdings, balance]);
```

#### 6.2.2 State Update Optimization

**Batch State Updates:**
```typescript
// React 18+ auto-batches, but be mindful
ReactDOM.flushSync(() => {
  // Force synchronous update if needed
  setState(newValue);
});
```

**Subscription Pattern to Avoid Prop Drilling:**
```typescript
// Instead of passing tickers down through all components
// Components subscribe directly to price updates
const { subscribe } = usePriceEngine();

useEffect(() => {
  return subscribe((newTickers) => {
    setLocalPrice(newTickers.get(tickerId)?.price);
  });
}, [tickerId, subscribe]);
```

#### 6.2.3 Rendering Optimization

**Virtual Scrolling for Trade History:**
```typescript
// If trades > 100, only render visible items
const visibleTrades = useMemo(() => {
  return trades.slice(scrollTop / itemHeight, scrollTop / itemHeight + visibleCount);
}, [trades, scrollTop]);
```

**Debounce Expensive Operations:**
```typescript
const debouncedSearch = useMemo(
  () => debounce((value: string) => {
    performSearch(value);
  }, 300),
  []
);
```

#### 6.2.4 Chart Rendering Optimization

**Use requestAnimationFrame:**
```typescript
useEffect(() => {
  let rafId: number;
  
  const updateChart = () => {
    // Update chart
    rafId = requestAnimationFrame(updateChart);
  };
  
  rafId = requestAnimationFrame(updateChart);
  
  return () => cancelAnimationFrame(rafId);
}, [priceHistory]);
```

**Limit Re-calculations:**
```typescript
// Only recalculate scales if price bounds change
const scales = useMemo(() => {
  return calculateScales(priceHistory, dimensions);
}, [priceHistory.length, dimensions]); // Don't depend on entire array
```

### 6.3 Performance Monitoring

**Development Tools:**
```typescript
// React DevTools Profiler
<Profiler id="Chart" onRender={onRenderCallback}>
  <Chart {...props} />
</Profiler>

// Custom performance logging
const startTime = performance.now();
// ... operation
console.log(`Operation took ${performance.now() - startTime}ms`);
```

**Key Metrics to Monitor:**
- Component render time
- State update frequency
- Chart redraw time
- Memory usage (avoid leaks in intervals/subscriptions)

---

## 7. Data Models

### 7.1 Type Definitions

**Already defined in `src/types/index.ts`:**

```typescript
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
```

### 7.2 Initial Data

```typescript
// Initial tickers (in useMockPriceEngine)
const INITIAL_TICKERS: Ticker[] = [
  { id: 'btc', symbol: 'BTC', name: 'Bitcoin', price: 45000, change24h: 0 },
  { id: 'eth', symbol: 'ETH', name: 'Ethereum', price: 3000, change24h: 0 },
  { id: 'sol', symbol: 'SOL', name: 'Solana', price: 100, change24h: 0 },
];

// Initial portfolio
const INITIAL_PORTFOLIO: Portfolio = {
  balance: 10000,
  holdings: [],
  totalValue: 10000,
  profitLoss: 0,
};

// Initial watchlist
const INITIAL_WATCHLIST = ['btc', 'eth', 'sol'];
```

### 7.3 LocalStorage Keys

```typescript
export const STORAGE_KEYS = {
  PORTFOLIO: 'tradepulse_portfolio',
  TRADES: 'tradepulse_trades',
  WATCHLIST: 'tradepulse_watchlist',
  LIMIT_ORDERS: 'tradepulse_limit_orders',
  PRICE_HISTORY: 'tradepulse_price_history', // Optional
} as const;
```

### 7.4 Validation Schemas

```typescript
// Trade validation
const validateTradeInput = (quantity: number, price: number, balance: number): string | null => {
  if (quantity <= 0) return 'Quantity must be greater than 0';
  if (quantity !== roundToPrecision(quantity, 2)) return 'Maximum 2 decimal places allowed';
  if (quantity * price > balance) return 'Insufficient balance';
  return null;
};

// Limit order validation
const validateLimitOrder = (triggerPrice: number): string | null => {
  if (triggerPrice <= 0) return 'Trigger price must be greater than 0';
  if (triggerPrice !== roundToPrecision(triggerPrice, 2)) return 'Maximum 2 decimal places allowed';
  return null;
};
```

---

## 8. Testing Strategy

### 8.1 Testing Pyramid

```
         ┌────────────────┐
         │   E2E Tests    │  (Manual testing)
         │     (10%)      │
         ├────────────────┤
         │ Integration    │
         │    Tests       │
         │     (20%)      │
         ├────────────────┤
         │  Unit Tests    │
         │     (70%)      │
         └────────────────┘
```

### 8.2 Unit Tests (Jest + React Testing Library)

**Test Coverage Target:** 85%

**Test Files:**

#### 8.2.1 Utility Functions (`src/utils/*.test.ts`)
```typescript
describe('Precision Math Utils', () => {
  test('preciseMultiply avoids floating-point errors', () => {
    expect(preciseMultiply(0.1, 0.2)).toBe(0.02);
  });
  
  test('preciseAdd calculates correctly', () => {
    expect(preciseAdd(0.1, 0.2)).toBe(0.3);
  });
  
  test('roundToPrecision rounds correctly', () => {
    expect(roundToPrecision(1.2345, 2)).toBe(1.23);
  });
});

describe('Format Utils', () => {
  test('formatCurrency formats correctly', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
  });
  
  test('formatPercentage formats correctly', () => {
    expect(formatPercentage(5.67)).toBe('+5.67%');
    expect(formatPercentage(-2.34)).toBe('-2.34%');
  });
});
```

#### 8.2.2 Portfolio Hook (`src/hooks/usePortfolio.test.ts`)
```typescript
describe('usePortfolio', () => {
  test('initializes with $10,000 balance', () => {
    const { result } = renderHook(() => usePortfolio(mockGetCurrentPrice));
    expect(result.current.portfolio.balance).toBe(10000);
  });
  
  test('buyAsset reduces balance correctly', () => {
    const { result } = renderHook(() => usePortfolio(mockGetCurrentPrice));
    
    act(() => {
      result.current.buyAsset('btc', 'BTC', 0.1, 45000);
    });
    
    expect(result.current.portfolio.balance).toBe(5500);
  });
  
  test('buyAsset fails when insufficient balance', () => {
    const { result } = renderHook(() => usePortfolio(mockGetCurrentPrice));
    
    act(() => {
      const success = result.current.buyAsset('btc', 'BTC', 1, 45000);
      expect(success).toBe(false);
    });
    
    expect(result.current.portfolio.balance).toBe(10000);
  });
  
  test('sellAsset fails when insufficient holdings', () => {
    const { result } = renderHook(() => usePortfolio(mockGetCurrentPrice));
    
    act(() => {
      const success = result.current.sellAsset('btc', 1, 45000);
      expect(success).toBe(false);
    });
  });
  
  test('calculates average price correctly on multiple buys', () => {
    const { result } = renderHook(() => usePortfolio(mockGetCurrentPrice));
    
    act(() => {
      result.current.buyAsset('btc', 'BTC', 0.1, 45000); // Cost: 4500
      result.current.buyAsset('btc', 'BTC', 0.1, 46000); // Cost: 4600
    });
    
    const btcHolding = result.current.portfolio.holdings.find(h => h.tickerId === 'btc');
    expect(btcHolding?.averagePrice).toBe(45500);
  });
});
```

#### 8.2.3 Limit Orders Hook (`src/hooks/useLimitOrders.test.ts`)
```typescript
describe('useLimitOrders', () => {
  test('creates limit order successfully', () => {
    const mockExecute = jest.fn();
    const { result } = renderHook(() => 
      useLimitOrders(mockTickers, mockExecute)
    );
    
    act(() => {
      result.current.createLimitOrder('btc', 'BTC', 'BUY', 44000, 0.1);
    });
    
    expect(result.current.limitOrders).toHaveLength(1);
    expect(result.current.limitOrders[0].status).toBe('PENDING');
  });
  
  test('executes buy limit order when price hits trigger', () => {
    const mockExecute = jest.fn();
    const mockTickers = new Map([
      ['btc', { id: 'btc', symbol: 'BTC', price: 45000, change24h: 0 }]
    ]);
    
    const { result, rerender } = renderHook(() => 
      useLimitOrders(mockTickers, mockExecute)
    );
    
    act(() => {
      result.current.createLimitOrder('btc', 'BTC', 'BUY', 44000, 0.1);
    });
    
    // Update ticker price to trigger
    mockTickers.set('btc', { ...mockTickers.get('btc')!, price: 43900 });
    rerender();
    
    expect(mockExecute).toHaveBeenCalledWith(
      expect.objectContaining({ triggerPrice: 44000 }),
      43900
    );
  });
  
  test('executes sell limit order when price hits trigger', () => {
    const mockExecute = jest.fn();
    const mockTickers = new Map([
      ['btc', { id: 'btc', symbol: 'BTC', price: 45000, change24h: 0 }]
    ]);
    
    const { result, rerender } = renderHook(() => 
      useLimitOrders(mockTickers, mockExecute)
    );
    
    act(() => {
      result.current.createLimitOrder('btc', 'BTC', 'SELL', 46000, 0.1);
    });
    
    // Update ticker price to trigger
    mockTickers.set('btc', { ...mockTickers.get('btc')!, price: 46100 });
    rerender();
    
    expect(mockExecute).toHaveBeenCalled();
  });
  
  test('cancels limit order', () => {
    const mockExecute = jest.fn();
    const { result } = renderHook(() => 
      useLimitOrders(mockTickers, mockExecute)
    );
    
    act(() => {
      result.current.createLimitOrder('btc', 'BTC', 'BUY', 44000, 0.1);
    });
    
    const orderId = result.current.limitOrders[0].id;
    
    act(() => {
      result.current.cancelLimitOrder(orderId);
    });
    
    expect(result.current.limitOrders[0].status).toBe('CANCELLED');
  });
});
```

#### 8.2.4 Chart Utils (`src/components/Terminal/Chart.test.ts`)
```typescript
describe('Chart Coordinate Mapping', () => {
  const mockDimensions = {
    width: 800,
    height: 400,
    padding: { top: 20, right: 60, bottom: 40, left: 60 },
  };
  
  const mockPriceHistory = [
    { timestamp: 1000, price: 44000 },
    { timestamp: 2000, price: 45000 },
    { timestamp: 3000, price: 46000 },
  ];
  
  test('calculateScales returns correct min/max', () => {
    const scales = calculateScales(mockPriceHistory, mockDimensions);
    
    expect(scales.minPrice).toBeLessThan(44000);
    expect(scales.maxPrice).toBeGreaterThan(46000);
  });
  
  test('xScale maps indices correctly', () => {
    const scales = calculateScales(mockPriceHistory, mockDimensions);
    
    const firstX = scales.xScale(0);
    const lastX = scales.xScale(mockPriceHistory.length - 1);
    
    expect(firstX).toBe(mockDimensions.padding.left);
    expect(lastX).toBe(mockDimensions.width - mockDimensions.padding.right);
  });
  
  test('yScale maps prices correctly (inverted)', () => {
    const scales = calculateScales(mockPriceHistory, mockDimensions);
    
    const highPriceY = scales.yScale(46000);
    const lowPriceY = scales.yScale(44000);
    
    expect(highPriceY).toBeLessThan(lowPriceY); // SVG Y is inverted
  });
  
  test('generatePathData creates valid SVG path', () => {
    const scales = calculateScales(mockPriceHistory, mockDimensions);
    const pathData = generatePathData(mockPriceHistory, scales);
    
    expect(pathData).toMatch(/^M \d+\.?\d* \d+\.?\d*/); // Starts with M
    expect(pathData).toContain('L'); // Contains line commands
  });
});
```

#### 8.2.5 Component Tests (`src/components/*.test.tsx`)
```typescript
describe('TradeForm Component', () => {
  test('renders with current price', () => {
    render(
      <TradeForm
        tickerId="btc"
        currentPrice={45000}
        availableBalance={10000}
        onTrade={jest.fn()}
        onLimitOrder={jest.fn()}
      />
    );
    
    expect(screen.getByText(/45,000/)).toBeInTheDocument();
  });
  
  test('validates quantity input', async () => {
    const mockOnTrade = jest.fn();
    render(
      <TradeForm
        tickerId="btc"
        currentPrice={45000}
        availableBalance={10000}
        onTrade={mockOnTrade}
        onLimitOrder={jest.fn()}
      />
    );
    
    const input = screen.getByLabelText(/quantity/i);
    await userEvent.type(input, '0.123'); // 3 decimals (invalid)
    
    expect(screen.getByText(/maximum 2 decimal places/i)).toBeInTheDocument();
  });
  
  test('disables buy button when insufficient balance', () => {
    render(
      <TradeForm
        tickerId="btc"
        currentPrice={45000}
        availableBalance={1000}
        onTrade={jest.fn()}
        onLimitOrder={jest.fn()}
      />
    );
    
    const input = screen.getByLabelText(/quantity/i);
    userEvent.type(input, '1'); // Would cost $45,000
    
    expect(screen.getByRole('button', { name: /buy/i })).toBeDisabled();
  });
});
```

### 8.3 Integration Tests

**Test Full User Flows:**

```typescript
describe('Trading Flow Integration', () => {
  test('complete buy flow updates portfolio and trades', async () => {
    render(<App />);
    
    // Select ticker
    await userEvent.click(screen.getByText('BTC'));
    
    // Enter quantity
    const quantityInput = screen.getByLabelText(/quantity/i);
    await userEvent.type(quantityInput, '0.1');
    
    // Click buy
    await userEvent.click(screen.getByRole('button', { name: /buy/i }));
    
    // Verify portfolio updated
    expect(screen.getByText(/Balance.*\$5,500/)).toBeInTheDocument();
    
    // Verify trade added
    expect(screen.getByText(/BUY.*BTC.*0.1/)).toBeInTheDocument();
  });
  
  test('limit order executes when price triggers', async () => {
    render(<App />);
    
    // Create limit order
    await userEvent.click(screen.getByText(/Limit/));
    await userEvent.type(screen.getByLabelText(/trigger price/i), '44000');
    await userEvent.type(screen.getByLabelText(/quantity/i), '0.1');
    await userEvent.click(screen.getByRole('button', { name: /create order/i }));
    
    // Wait for price to trigger (mock price engine)
    await waitFor(() => {
      expect(screen.getByText(/Order executed/)).toBeInTheDocument();
    }, { timeout: 10000 });
  });
});
```

### 8.4 Manual Testing Checklist

**Functional Tests:**
- [ ] Add ticker to watchlist
- [ ] Remove ticker from watchlist (min 1 enforced)
- [ ] Select ticker updates chart
- [ ] Chart updates every second
- [ ] Buy asset with valid quantity
- [ ] Buy asset fails with insufficient balance
- [ ] Sell asset with valid quantity
- [ ] Sell asset fails when no holdings
- [ ] Create limit order (buy)
- [ ] Create limit order (sell)
- [ ] Limit order executes automatically
- [ ] Cancel limit order
- [ ] Portfolio P&L updates in real-time
- [ ] Trade history displays correctly
- [ ] Reset portfolio clears all data
- [ ] LocalStorage persists on refresh

**Performance Tests:**
- [ ] No visible lag with 1-second updates
- [ ] Chart renders smoothly
- [ ] Page load < 3 seconds
- [ ] No memory leaks after 5 minutes

**Browser Compatibility:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)

---

## 9. File Structure

```
trade_pulse/
├── public/
│   └── vite.svg
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   └── ToastNotification.tsx
│   │   ├── Watchlist/
│   │   │   ├── Watchlist.tsx
│   │   │   ├── WatchlistItem.tsx
│   │   │   └── Watchlist.module.css
│   │   ├── Terminal/
│   │   │   ├── Terminal.tsx
│   │   │   ├── Chart.tsx
│   │   │   ├── TradeForm.tsx
│   │   │   └── Terminal.module.css
│   │   ├── Portfolio/
│   │   │   ├── Portfolio.tsx
│   │   │   ├── HoldingItem.tsx
│   │   │   ├── TradeHistoryItem.tsx
│   │   │   ├── LimitOrderPanel.tsx
│   │   │   └── Portfolio.module.css
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useMockPriceEngine.ts ✅
│   │   ├── usePortfolio.ts ✅
│   │   ├── useTrades.ts ✅
│   │   ├── useWatchlist.ts ✅
│   │   ├── useLimitOrders.ts ✅
│   │   ├── useToast.ts
│   │   └── index.ts ✅
│   ├── types/
│   │   └── index.ts ✅
│   ├── utils/
│   │   ├── index.ts ✅
│   │   ├── storage.ts ✅
│   │   ├── chart.ts (coordinate mapping)
│   │   └── validation.ts
│   ├── styles/
│   │   ├── globals.css
│   │   ├── variables.css (colors, spacing)
│   │   └── reset.css
│   ├── App.tsx
│   ├── App.css
│   ├── main.tsx ✅
│   └── vite-env.d.ts
├── tests/
│   ├── hooks/
│   │   ├── usePortfolio.test.ts
│   │   └── useLimitOrders.test.ts
│   ├── utils/
│   │   └── precision.test.ts
│   └── components/
│       └── Chart.test.tsx
├── docs/
│   ├── ARCHITECTURE.md
│   ├── PERFORMANCE.md
│   ├── TEST_STRATEGY.md
│   └── CHAT_HISTORY.md
├── .gitignore ✅
├── eslint.config.js ✅
├── package.json ✅
├── README.md ✅
├── PROJECT_STRUCTURE.md ✅
├── business_prd.md ✅
├── technical_prd.md (this file)
├── tsconfig.json ✅
├── tsconfig.app.json ✅
└── vite.config.ts ✅

✅ = Already created
```

---

## 10. Implementation Phases

### Phase 1: Core Components & Layout (Week 1)
**Goal:** Basic UI structure with static data

**Tasks:**
- [ ] Create layout grid (25-50-25)
- [ ] Implement Watchlist component (static tickers)
- [ ] Implement Terminal container
- [ ] Implement Portfolio component (static data)
- [ ] Apply dark theme styling
- [ ] Set up CSS modules

**Deliverable:** Static UI with all panels visible

---

### Phase 2: Chart Implementation (Week 1-2)
**Goal:** Working SVG chart with live updates

**Tasks:**
- [ ] Implement Chart component
- [ ] Create coordinate mapping functions
- [ ] Add SVG path generation
- [ ] Implement Y-axis labels
- [ ] Implement X-axis labels
- [ ] Add current price indicator
- [ ] Connect to price engine
- [ ] Test chart updates every 1 second

**Deliverable:** Live updating chart

---

### Phase 3: Trading Functionality (Week 2)
**Goal:** Market orders working

**Tasks:**
- [ ] Implement TradeForm component
- [ ] Add input validation
- [ ] Connect buy/sell to portfolio hook
- [ ] Add trade history display
- [ ] Implement toast notifications
- [ ] Test insufficient balance handling
- [ ] Test fractional quantities (2 decimals)

**Deliverable:** Working buy/sell functionality

---

### Phase 4: Limit Orders (Week 2-3)
**Goal:** Limit orders with auto-execution

**Tasks:**
- [ ] Add limit order form in TradeForm
- [ ] Implement LimitOrderPanel
- [ ] Connect to useLimitOrders hook
- [ ] Test auto-execution logic
- [ ] Test insufficient balance on trigger
- [ ] Add cancel functionality
- [ ] Show notifications on execution

**Deliverable:** Working limit order system

---

### Phase 5: Portfolio Features (Week 3)
**Goal:** Complete portfolio management

**Tasks:**
- [ ] Implement holdings display with P&L
- [ ] Calculate and display ROI
- [ ] Calculate average profit per trade
- [ ] Implement portfolio reset
- [ ] Add confirmation modal for reset
- [ ] Test real-time P&L updates

**Deliverable:** Complete portfolio features

---

### Phase 6: Testing & Optimization (Week 3-4)
**Goal:** 85% test coverage + performance optimization

**Tasks:**
- [ ] Write unit tests for all hooks
- [ ] Write component tests
- [ ] Write integration tests
- [ ] Achieve 85% coverage
- [ ] Profile performance
- [ ] Optimize chart rendering
- [ ] Fix memory leaks
- [ ] Test in all browsers

**Deliverable:** Fully tested, optimized application

---

### Phase 7: Documentation (Week 4)
**Goal:** Complete all required documentation

**Tasks:**
- [ ] Write ARCHITECTURE.md
- [ ] Write PERFORMANCE.md
- [ ] Write TEST_STRATEGY.md
- [ ] Write CHAT_HISTORY.md
- [ ] Update README.md
- [ ] Record video walkthrough (5-7 min)

**Deliverable:** Complete documentation package

---

## 11. Key Technical Decisions Summary

| Decision Point | Choice | Rationale |
|----------------|--------|-----------|
| Chart Technology | SVG | Better interactivity, accessibility, manageable performance |
| State Management | Custom Hooks + Context | No need for Redux, hooks are sufficient |
| Styling | CSS Modules | Scoped styles, better than inline |
| Testing | Jest + RTL | Standard React testing stack |
| Fractional Trading | 2 decimals | Simpler UX, sufficient precision |
| Update Frequency | 1 second | Per requirements |
| Price Algorithm | Random walk 2% | Simple, realistic volatility |
| Persistence | localStorage | Per requirements, no backend |
| Theme | Dark mode only | Standard for trading terminals |
| Notifications | Toast (3s) | Non-intrusive feedback |

---

## 12. Risk Mitigation

### Technical Risks

**Risk 1: Chart performance degradation**
- **Mitigation:** Use React.memo, useMemo, RAF, limit data points to 300
- **Fallback:** Switch to Canvas if SVG becomes too slow

**Risk 2: Memory leaks from intervals**
- **Mitigation:** Always cleanup intervals/subscriptions in useEffect
- **Testing:** Run app for 30+ minutes, monitor memory

**Risk 3: localStorage quota exceeded**
- **Mitigation:** Limit trade history, clear old data
- **Fallback:** Show warning, offer export before clearing

**Risk 4: Floating-point precision errors**
- **Mitigation:** Use precision math utilities already implemented
- **Testing:** Unit test all calculations

### Implementation Risks

**Risk 1: Scope creep**
- **Mitigation:** Stick to MVP defined in PRD
- **Review:** Weekly scope check

**Risk 2: Testing coverage not meeting 85%**
- **Mitigation:** Write tests alongside implementation
- **Review:** Check coverage after each phase

---

## 13. Success Criteria

### Must Have (Pass/Fail)
- ✅ All 6 core features working (watchlist, chart, trade, limit orders, portfolio, persistence)
- ✅ Chart updates every 1 second without lag
- ✅ 85%+ test coverage
- ✅ No ESLint errors
- ✅ All documentation complete
- ✅ Cross-browser compatible

### Performance Benchmarks
- ✅ Page load < 3 seconds
- ✅ Chart render < 100ms
- ✅ No UI lag during price updates
- ✅ No memory leaks after 30 minutes

### Code Quality
- ✅ TypeScript strict mode (no `any`)
- ✅ Arrow functions only
- ✅ All files < 500 lines
- ✅ Proper error handling
- ✅ Meaningful variable names

---

## 14. Next Steps

1. **Review this Technical PRD** ✅
2. **Get approval** (from stakeholder/self)
3. **Set up project tracking** (GitHub Issues/Projects)
4. **Begin Phase 1 implementation**
5. **Daily progress updates**
6. **Weekly milestone reviews**

---

**END OF TECHNICAL PRD**

**Document Status:** Ready for Implementation  
**Approval:** Pending  
**Implementation Start Date:** TBD
