# TradePulse Architecture

This document explains the core architectural decisions and implementations in TradePulse, focusing on the chart rendering logic and the mock price engine.

## Table of Contents

1. [Chart Rendering Logic](#chart-rendering-logic)
2. [Mock Price Engine](#mock-price-engine)
3. [State Management Architecture](#state-management-architecture)
4. [Data Flow Patterns](#data-flow-patterns)

---

## Chart Rendering Logic

### Overview

The chart is implemented using **native SVG** without any third-party charting libraries. This approach provides complete control over rendering, performance, and customization.

### How We Convert Price Arrays into Visual Lines

The chart rendering process consists of several key steps:

#### 1. **Data Structure**

Price history is stored as an array of `PricePoint` objects:

```typescript
interface PricePoint {
  timestamp: number;  // Unix timestamp in milliseconds
  price: number;      // Current price value
}
```

Example:
```typescript
[
  { timestamp: 1705394400000, price: 45000 },
  { timestamp: 1705394401000, price: 45050 },
  { timestamp: 1705394402000, price: 45025 },
  // ... up to 300 points (5 minutes of data)
]
```

#### 2. **Scale Calculation** (`src/utils/chart.ts`)

To convert prices into pixel coordinates, we create **scale functions** that map:
- **Time values** → X-axis coordinates
- **Price values** → Y-axis coordinates

**Algorithm:**

```typescript
const calculateScales = (priceHistory, dimensions) => {
  // Step 1: Find data bounds
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const minTime = Math.min(...timestamps);
  const maxTime = Math.max(...timestamps);
  
  // Step 2: Add 5% padding for visual clarity
  const priceRange = maxPrice - minPrice;
  const pricePadding = priceRange * 0.05;
  const paddedMinPrice = minPrice - pricePadding;
  const paddedMaxPrice = maxPrice + pricePadding;
  
  // Step 3: Create scale functions
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  // X-scale: Linear mapping from time to pixels
  const xScale = (timestamp) => {
    const ratio = (timestamp - minTime) / (maxTime - minTime);
    return padding.left + ratio * chartWidth;
  };
  
  // Y-scale: Linear mapping from price to pixels (inverted)
  const yScale = (price) => {
    const ratio = (price - paddedMinPrice) / (paddedMaxPrice - paddedMinPrice);
    // Invert Y-axis because SVG (0,0) is top-left
    return padding.top + (1 - ratio) * chartHeight;
  };
  
  return { xScale, yScale, minPrice, maxPrice, minTime, maxTime };
};
```

**Why Invert Y-axis?**
In SVG coordinate systems, (0,0) is at the top-left corner. Higher Y values move down. To display prices correctly (higher prices at top), we invert the ratio: `(1 - ratio)`.

#### 3. **Path Generation**

Once we have scale functions, we generate an SVG path string:

```typescript
const generatePathData = (priceHistory, scales) => {
  const { xScale, yScale } = scales;
  
  const pathCommands = priceHistory.map((point, index) => {
    const x = xScale(point.timestamp);
    const y = yScale(point.price);
    
    // First point uses 'M' (Move to), rest use 'L' (Line to)
    const command = index === 0 ? 'M' : 'L';
    return `${command} ${x.toFixed(2)} ${y.toFixed(2)}`;
  });
  
  return pathCommands.join(' ');
};
```

**Example Output:**
```
M 60.00 150.00 L 62.27 148.50 L 64.55 149.75 L 66.82 147.25 ...
```

This creates a continuous line connecting all price points.

#### 4. **SVG Rendering** (`src/components/Terminal/Chart.tsx`)

The generated path is rendered as an SVG element:

```tsx
<svg width={800} height={400}>
  {/* Grid lines for visual reference */}
  {gridLines.map(y => (
    <line x1={60} y1={y} x2={740} y2={y} stroke="#e0e0e0" />
  ))}
  
  {/* The price line */}
  <path
    d={pathData}  // "M 60.00 150.00 L 62.27 148.50 ..."
    fill="none"
    stroke="#2563eb"
    strokeWidth={2}
  />
  
  {/* Axis labels */}
  {priceLabels.map(price => (
    <text x={10} y={yScale(price)}>{price.toFixed(2)}</text>
  ))}
</svg>
```

#### 5. **Visual Flow Diagram**

```
Price Data Array
    ↓
[{time: 1000, price: 100}, {time: 2000, price: 105}, ...]
    ↓
Calculate Scales (find min/max, create mapping functions)
    ↓
xScale(1000) → 60px    yScale(100) → 350px
xScale(2000) → 120px   yScale(105) → 340px
    ↓
Generate SVG Path String
    ↓
"M 60 350 L 120 340 ..."
    ↓
Render SVG <path> Element
    ↓
Visual Line on Screen
```

### Chart Update Process

When new price data arrives (every 1 second):

1. **Price Engine** generates new price
2. **Price History** array is updated (append + slice to 300 items)
3. **React re-render** triggered
4. **Scales recalculated** with new min/max values
5. **Path regenerated** with all 300 points
6. **SVG updates** smoothly (browser-optimized)

**Performance Note:** Generating a path from 300 points takes ~1-2ms on modern hardware, well within the 16ms budget for 60fps rendering.

---

## Mock Price Engine

### Overview

The Mock Price Engine simulates real-time cryptocurrency price movements using a **random walk algorithm** with configurable volatility.

### Architecture Goals

1. **Consistency**: All components see the same price data at the same time
2. **Performance**: Updates don't cause unnecessary re-renders
3. **Realism**: Price movements look like real market data
4. **Persistence**: Price history is maintained efficiently

### Implementation (`src/hooks/useMockPriceEngine.ts`)

#### 1. **Random Walk Algorithm**

```typescript
const generateNewPrice = (currentPrice, volatility = 0.02) => {
  // Random change between -volatility and +volatility
  const change = (Math.random() - 0.5) * 2 * volatility * currentPrice;
  
  // Ensure price never goes negative
  return Math.max(currentPrice + change, 0.01);
};
```

**How it works:**
- `Math.random() - 0.5` → Range: [-0.5, 0.5]
- Multiply by 2 → Range: [-1, 1]
- Multiply by volatility (0.02 = 2%) → Range: [-2%, +2%]
- Multiply by current price → Absolute dollar change
- Add to current price and ensure > 0

**Example:**
- Current price: $45,000
- Random value: 0.7
- Change: (0.7 - 0.5) * 2 * 0.02 * 45000 = 0.2 * 2 * 0.02 * 45000 = $360
- New price: $45,360

This creates realistic price movements that trend slowly up or down over time.

#### 2. **Centralized State with `useRef`**

To ensure consistency across components, we use a **single source of truth**:

```typescript
const stateRef = useRef<PriceEngineState>({
  tickers: new Map(),           // Current ticker prices
  priceHistory: new Map(),      // Historical price data (300 points per ticker)
  subscribers: new Set(),       // Components listening for updates
});
```

**Why `useRef` instead of `useState`?**
- `useRef` persists across renders without causing re-renders
- Provides synchronous access to latest data
- Prevents race conditions with rapid updates
- Subscribers can read latest data immediately

#### 3. **Subscription Pattern**

Instead of prop drilling or global state, components **subscribe** to price updates:

```typescript
const subscribe = (callback) => {
  stateRef.current.subscribers.add(callback);
  
  return () => {
    stateRef.current.subscribers.delete(callback); // Cleanup
  };
};
```

**Usage in components:**

```typescript
// In App.tsx
useEffect(() => {
  const unsubscribe = subscribe((updatedTickers) => {
    setCurrentTickers(new Map(updatedTickers)); // Local state update
    updatePortfolioValues(updatedTickers);      // Update portfolio
  });
  
  return unsubscribe; // Cleanup on unmount
}, []);
```

#### 4. **Price Update Cycle** (Every 1 second)

```typescript
useEffect(() => {
  const intervalRef = setInterval(() => {
    const now = Date.now();
    const updatedTickers = new Map();
    
    // Update each ticker
    stateRef.current.tickers.forEach((ticker, id) => {
      // 1. Generate new price
      const newPrice = generateNewPrice(ticker.price);
      
      // 2. Calculate 24h change
      const priceHistory = stateRef.current.priceHistory.get(id);
      const oldestPrice = priceHistory[0]?.price || ticker.price;
      const change24h = ((newPrice - oldestPrice) / oldestPrice) * 100;
      
      // 3. Create updated ticker
      updatedTickers.set(id, {
        ...ticker,
        price: newPrice,
        change24h,
      });
      
      // 4. Update price history (keep last 300 points)
      const updatedHistory = [
        ...priceHistory,
        { timestamp: now, price: newPrice }
      ].slice(-300); // Keep only last 5 minutes
      
      stateRef.current.priceHistory.set(id, updatedHistory);
    });
    
    // 5. Update state (triggers React re-render)
    stateRef.current.tickers = updatedTickers;
    setTickers(new Map(updatedTickers));
    
    // 6. Notify all subscribers
    stateRef.current.subscribers.forEach((callback) => {
      callback(updatedTickers);
    });
  }, 1000);
  
  return () => clearInterval(intervalRef);
}, []);
```

#### 5. **Ensuring Data Consistency**

**Problem:** Multiple components need the same price data at the same instant.

**Solution:**

1. **Single interval** generates all prices simultaneously
2. **Synchronous updates** to `stateRef` ensure atomic operation
3. **All subscribers notified** in same event loop tick
4. **Map is cloned** when passed to subscribers (prevents mutations)

**Flow Diagram:**

```
1 Second Timer Tick
    ↓
Generate New Prices for BTC, ETH, SOL
    ↓
Update stateRef.current.tickers (synchronous)
    ↓
Update stateRef.current.priceHistory (synchronous)
    ↓
setTickers(new Map(...))  → Triggers React re-render
    ↓
Notify Subscriber 1 (Watchlist component)
Notify Subscriber 2 (Chart component)
Notify Subscriber 3 (Portfolio component)
Notify Subscriber 4 (Limit Orders)
    ↓
All components receive SAME data simultaneously
```

#### 6. **Price History Management**

```typescript
// Keep last 300 points (5 minutes at 1 second intervals)
const updatedHistory = [
  ...priceHistory,
  { timestamp: now, price: newPrice }
].slice(-300);
```

**Why 300 points?**
- 1 update per second
- 300 seconds = 5 minutes
- Enough history for meaningful chart
- Small memory footprint (~30KB per ticker)

#### 7. **Accessor Methods**

Components can read data without subscribing:

```typescript
// Get price history for chart rendering
const getPriceHistory = (tickerId) => {
  return stateRef.current.priceHistory.get(tickerId) || [];
};

// Get current price for calculations
const getCurrentPrice = (tickerId) => {
  return stateRef.current.tickers.get(tickerId)?.price || 0;
};
```

---

## State Management Architecture

### Hook-Based Architecture

Each domain has a dedicated custom hook:

- **useMockPriceEngine**: Price generation and distribution
- **usePortfolio**: Portfolio state and trade execution
- **useTrades**: Trade history tracking
- **useLimitOrders**: Limit order management and execution
- **useWatchlist**: User's ticker watchlist
- **useToast**: UI notifications

### Communication Patterns

```
useMockPriceEngine (Publisher)
    ↓ (subscription)
App.tsx (Orchestrator)
    ↓ (props/callbacks)
Portfolio, Terminal, Watchlist (Consumers)
    ↓ (events)
useTrades, useLimitOrders (Action Handlers)
```

### Data Persistence Strategy

All critical state is persisted to localStorage:

```typescript
// Portfolio saves on every change
useEffect(() => {
  saveToStorage('tradepulse_portfolio', portfolio);
}, [portfolio]);

// Limit orders save on creation/update/cancel
useEffect(() => {
  saveToStorage('tradepulse_limit_orders', limitOrders);
}, [limitOrders]);
```

---

## Data Flow Patterns

### Pattern 1: Price Updates (Every 1 second)

```
Price Engine → Generate Prices → Update State → Notify Subscribers
    → Watchlist Updates (price display)
    → Chart Updates (SVG path recalculation)
    → Portfolio Updates (holdings value)
    → Limit Orders Check (trigger detection)
```

### Pattern 2: Trade Execution (User action)

```
User clicks "Buy"
    → Validate input (quantity, price)
    → Check balance (usePortfolio)
    → Execute trade (update balance, holdings)
    → Record trade (useTrades)
    → Save to localStorage
    → Show toast notification
```

### Pattern 3: Limit Order Trigger (Automatic)

```
Price Update Received
    → useLimitOrders checks all pending orders
    → If trigger price hit:
        → Call onExecute callback
        → Update portfolio (buy/sell)
        → Record trade
        → Mark order as EXECUTED
        → Show toast notification
```

---

## Performance Optimizations

1. **Subscription Pattern**: Only components that need price updates subscribe
2. **useRef for Hot Data**: Prevents unnecessary re-renders
3. **Memoization**: Chart calculations memoized with `useMemo`
4. **Slice History**: Keep only 300 points (not infinite)
5. **Map Cloning**: New Map instance ensures proper React re-render detection
6. **Batched Updates**: All prices updated in single tick

---

## Testing Strategy

See [TEST_STRATEGY.md](./TEST_STRATEGY.md) for detailed testing approach for limit order logic and other critical features.
