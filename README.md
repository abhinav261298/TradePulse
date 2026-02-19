# TradePulse - Paper Trading Terminal

A lightweight, high-performance trading terminal for simulated "Paper Trading" built with React, TypeScript, and Vite. Features real-time price updates, custom SVG chart rendering, and complete trade execution capabilities.

## 🚀 Features

- **Mock Price Engine**: Real-time price simulation using random walk algorithm with 1-second updates
- **Live Watchlist**: Track multiple tickers (BTC, ETH, SOL) with live price updates and 24h change percentages
- **Custom Chart**: Native SVG price chart implementation (zero third-party chart libraries)
- **Trade Execution**: Buy/sell assets with market orders and $10,000 starting balance
- **Limit Orders**: Automatic order execution when trigger price is reached
- **Portfolio Management**: Real-time tracking of holdings, profit/loss, and complete trade history
- **LocalStorage Persistence**: All portfolio, trades, and limit orders persist across browser sessions
- **Toast Notifications**: Real-time feedback for all user actions

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher (comes with Node.js)

To verify your installations:
```bash
node --version  # Should show v18.0.0 or higher
npm --version   # Should show v9.0.0 or higher
```

## 🛠️ Installation

### 1. Clone or Extract the Repository
```bash
# If using git
git clone <repository-url>
cd trade_pulse

# If using extracted folder
cd trade_pulse
```

### 2. Install Dependencies
```bash
npm install
```

This will install all required dependencies including:
- React 19
- TypeScript 5.6
- Vite 7.3
- Vitest for testing
- ESLint for code quality

## 🏃 Running the Application

### Development Mode (Recommended for Development)
```bash
npm run dev
```

**What happens:**
- Starts Vite development server with hot module replacement (HMR)
- Opens at `http://localhost:5173`
- Automatically reloads on code changes
- Shows detailed error messages in browser

**Expected output:**
```
VITE v7.3.1  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### Build for Production
```bash
npm run build
```

**What happens:**
- TypeScript compilation check (`tsc -b`)
- Production build with optimizations
- Output in `dist/` folder
- Minified and bundled assets

**Expected output:**
```
vite v7.3.1 building for production...
✓ 68 modules transformed.
dist/index.html                   0.46 kB
dist/assets/index-[hash].css     27.54 kB
dist/assets/index-[hash].js     225.00 kB
✓ built in XXXs
```

### Preview Production Build
```bash
npm run preview
```

Serves the production build locally at `http://localhost:4173` for testing.

### Run Tests
```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

**Test coverage goals:**
- Unit tests: 85%+ coverage
- Integration tests for critical flows
- All limit order logic thoroughly tested

### Linting
```bash
# Check for linting errors
npm run lint

# Auto-fix linting errors
npm run lint:fix
```

## 🎮 Using the Application

### First Time Setup
1. Start the development server: `npm run dev`
2. Open browser to `http://localhost:5173`
3. You'll see:
   - **Left Panel (Watchlist)**: BTC, ETH, SOL with live prices
   - **Center Panel (Terminal)**: Price chart and trade form
   - **Right Panel (Portfolio)**: Your balance ($10,000), holdings, and trades

### Basic Workflow
1. **Select a Ticker**: Click on BTC, ETH, or SOL in the watchlist
2. **Watch Live Prices**: Chart updates every second with new price data
3. **Execute a Trade**:
   - Enter quantity (e.g., 0.1 BTC)
   - Click "Buy" or "Sell"
   - See instant feedback via toast notification
4. **Create Limit Order**:
   - Switch to "Limit" order type
   - Enter trigger price
   - Order auto-executes when price hits trigger

### Data Persistence
All data is saved to browser localStorage:
- Portfolio state (balance + holdings)
- Trade history
- Limit orders
- Clear browser data to reset to initial state

## 📁 Project Structure

See [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) for detailed explanation of folder/module layout.

```
src/
├── components/     # React components
├── hooks/          # Custom React hooks
├── types/          # TypeScript type definitions
└── utils/          # Utility functions
```

## 🏗️ Architecture

### Mock Price Engine
- Generates new prices every 1 second for BTC, ETH, and SOL
- Uses random walk algorithm with configurable volatility
- Maintains 5 minutes of price history (300 data points)
- Subscription-based pattern for efficient updates

### State Management
- Custom hooks for domain-specific logic
- LocalStorage persistence for all critical data
- Optimized re-renders using subscription pattern

### Chart Rendering
- Custom SVG/Canvas implementation (no third-party chart libraries)
- Real-time updates with price history
- Coordinate mapping for price-to-pixel conversion

## 🧪 Testing

Unit tests for order execution logic:
```bash
npm run test
```

## 📚 Key Technologies

- **React 19**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **ESLint**: Code quality

## 🎯 Technical Highlights

- **No Chart Libraries**: Custom SVG/Canvas rendering
- **Precision Math**: Avoiding floating-point errors
- **Performance Optimization**: Selective re-renders with memo and useRef
- **Type Safety**: Strict TypeScript configuration
- **Clean Architecture**: Separation of concerns with custom hooks

## 📖 Documentation

- [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) - Detailed project structure and module organization
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Chart rendering logic and mock price engine explanation
- [PERFORMANCE.md](./PERFORMANCE.md) - Performance optimization and 1-second update interval handling
- [TEST_STRATEGY.md](./TEST_STRATEGY.md) - Testing approach for limit order trigger logic
- [TESTING.md](./TESTING.md) - Test suite documentation

## 🔧 Troubleshooting

### Port Already in Use
If you see an error that port 5173 is already in use:
```bash
# Find and kill the process using port 5173
lsof -ti:5173 | xargs kill -9

# Or use a different port
npm run dev -- --port 3000
```

### Dependencies Installation Issues
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Build Errors
```bash
# Ensure TypeScript compilation works
npx tsc --noEmit

# Check for linting errors
npm run lint
```

### Tests Failing
```bash
# Run tests in watch mode to see detailed errors
npm run test:watch

# Clear test cache
npm run test -- --clearCache
```

### Browser LocalStorage Issues
If data isn't persisting:
1. Open browser DevTools (F12)
2. Go to Application > Local Storage
3. Check for `tradepulse_*` keys
4. Clear localStorage: `localStorage.clear()` in console
5. Reload page

## 🔑 Key Features Implementation

### 1. Mock Price Engine
Located in `src/hooks/useMockPriceEngine.ts`:
- Random walk algorithm with 2% volatility
- 1-second update interval
- Consistent data across components via subscription

### 2. Portfolio Management
Located in `src/hooks/usePortfolio.ts`:
- Validation for insufficient balance
- Average price calculation for holdings
- Real-time profit/loss tracking

### 3. Limit Orders
Located in `src/hooks/useLimitOrders.ts`:
- Automatic execution when trigger price is hit
- Support for both BUY and SELL orders
- Order status tracking (PENDING, EXECUTED, CANCELLED)

## 📄 License

This project is for educational purposes.
