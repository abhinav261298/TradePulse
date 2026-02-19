# TradePulse Project Structure

This document explains the folder and module layout of the TradePulse Trading Terminal application.

## Directory Structure

```
trade_pulse/
├── public/                 # Static assets
│   └── vite.svg           # Vite logo
├── src/
│   ├── components/        # React components
│   │   ├── Portfolio/    # Portfolio panel component
│   │   │   ├── Portfolio.tsx
│   │   │   └── Portfolio.css
│   │   ├── Terminal/     # Trading terminal component
│   │   │   ├── Terminal.tsx
│   │   │   ├── Terminal.css
│   │   │   ├── Chart.tsx          # SVG chart rendering
│   │   │   └── TradeForm.tsx      # Trade execution form
│   │   ├── Watchlist/    # Watchlist panel component
│   │   │   ├── Watchlist.tsx
│   │   │   └── Watchlist.css
│   │   ├── Toast/        # Toast notification component
│   │   │   ├── ToastContainer.tsx
│   │   │   └── Toast.css
│   │   └── index.ts      # Component exports
│   ├── hooks/            # Custom React hooks
│   │   ├── index.ts              # Hook exports
│   │   ├── useMockPriceEngine.ts # Mock price generation engine
│   │   ├── usePortfolio.ts       # Portfolio management
│   │   ├── useTrades.ts          # Trade history management
│   │   ├── useWatchlist.ts       # Watchlist management
│   │   ├── useLimitOrders.ts     # Limit order management
│   │   └── useToast.ts           # Toast notification management
│   ├── types/            # TypeScript type definitions
│   │   └── index.ts      # Global type definitions
│   ├── utils/            # Utility functions
│   │   ├── index.ts      # Utility exports (formatting, calculations)
│   │   ├── storage.ts    # localStorage utilities
│   │   ├── chart.ts      # Chart calculation utilities
│   │   └── validation.ts # Input validation utilities
│   ├── styles/           # Global styles
│   │   ├── globals.css   # Global CSS
│   │   ├── reset.css     # CSS reset
│   │   └── variables.css # CSS variables
│   ├── test/             # Test setup
│   │   └── setup.ts      # Vitest setup
│   ├── App.tsx           # Main application component
│   ├── App.css           # Application styles
│   ├── main.tsx          # Application entry point
│   └── index.css         # Global styles
├── tests/                # Integration tests
│   └── integration/
│       ├── persistence.test.tsx
│       └── trading.test.tsx
├── dist/                 # Production build output (generated)
├── index.html            # HTML entry point
├── package.json          # Project dependencies
├── tsconfig.json         # TypeScript configuration
├── tsconfig.app.json     # TypeScript app configuration
├── tsconfig.node.json    # TypeScript Node configuration
├── vite.config.ts        # Vite configuration
├── vitest.config.ts      # Vitest configuration
├── eslint.config.js      # ESLint configuration
├── README.md             # Project documentation
├── PROJECT_STRUCTURE.md  # This file
├── ARCHITECTURE.md       # Architecture documentation
├── PERFORMANCE.md        # Performance analysis
├── TEST_STRATEGY.md      # Testing strategy
└── TESTING.md            # Test suite documentation
```

## Module Organization

### 1. Types (`src/types/`)

Contains all TypeScript interfaces and type definitions:

- **Ticker**: Represents a trading ticker with price and change data
- **Trade**: Represents a completed trade transaction
- **Portfolio**: User's portfolio with balance and holdings
- **Holding**: Individual asset holding in portfolio
- **LimitOrder**: Limit order configuration
- **PricePoint**: Historical price data point
- **ChartData**: Chart data structure

### 2. Hooks (`src/hooks/`)

Custom React hooks for state management and business logic:

- **useMockPriceEngine**: Generates simulated price data using random walk algorithm
  - Updates every 1 second
  - Provides price history for charting
  - Subscription-based pattern for efficiency

- **usePortfolio**: Manages portfolio state and operations
  - Tracks balance and holdings
  - Handles buy/sell operations with validation
  - Persists to localStorage

- **useTrades**: Manages trade history
  - Records all executed trades
  - Provides filtering and querying capabilities
  - Persists to localStorage

- **useWatchlist**: Manages user's watchlist
  - Add/remove tickers
  - Persists to localStorage

- **useLimitOrders**: Manages limit orders
  - Creates and tracks limit orders
  - Automatically executes when trigger price is hit
  - Persists to localStorage

### 3. Utils (`src/utils/`)

Utility functions and helpers:

- **Formatting**: Currency and percentage formatting
- **Precision Math**: Avoid floating-point errors in calculations
  - `preciseMultiply()`: Accurate multiplication
  - `preciseAdd()`: Accurate addition
  - `preciseSubtract()`: Accurate subtraction
  - `roundToPrecision()`: Precision rounding

- **Storage**: localStorage wrapper functions
  - Type-safe storage operations
  - Error handling
  - Centralized storage keys

### 4. Components (`src/components/`)

React components organized by feature:

- **Watchlist** (`components/Watchlist/`):
  - Displays all available tickers (BTC, ETH, SOL)
  - Shows live prices and 24h change percentages
  - Handles ticker selection
  - Left panel (25% width)

- **Terminal** (`components/Terminal/`):
  - Main trading interface (center panel, 50% width)
  - **Chart**: Custom SVG price chart with live updates
  - **TradeForm**: Buy/sell and limit order execution form
  - Shows selected ticker information

- **Portfolio** (`components/Portfolio/`):
  - Displays current balance and total portfolio value
  - Shows all holdings with P&L tracking
  - Displays trade history
  - Shows active limit orders
  - Portfolio reset functionality
  - Right panel (25% width)

- **Toast** (`components/common/`):
  - Toast notification system for user feedback
  - Success, error, info, and warning messages
  - Auto-dismiss with configurable duration

## Design Principles

### State Management
- **Hook-based architecture**: Custom hooks encapsulate business logic
- **Separation of concerns**: Each hook manages a specific domain
- **Persistence**: Critical data persists to localStorage
- **Optimization**: Subscription pattern prevents unnecessary re-renders

### Type Safety
- **Strict TypeScript**: All types are explicitly defined
- **No `any` types**: Full type coverage for safety
- **Interface-first design**: Clear contracts between modules

### Performance
- **Memoization**: Components will use `memo` for optimization
- **Selective updates**: Subscription pattern for price updates
- **Efficient calculations**: Precise math utilities prevent errors

### Code Organization
- **Single Responsibility**: Each file has a clear purpose
- **DRY Principle**: Reusable utilities and hooks
- **Scalability**: Easy to add new features and components

## Data Flow

```
1. Mock Price Engine (useMockPriceEngine)
   └─> Generates prices every 1s
       └─> Notifies subscribers (Watchlist, Chart, Portfolio)

2. User Actions (Trade Execution)
   └─> usePortfolio.buyAsset() / sellAsset()
       └─> Updates portfolio state
       └─> useTrades.addTrade()
           └─> Saves to localStorage

3. Limit Orders (useLimitOrders)
   └─> Monitors price updates
       └─> Auto-executes when trigger price hit
           └─> Calls portfolio buy/sell
               └─> Records trade
```

## Test Organization

### Unit Tests
Each module has corresponding test files:
- `src/hooks/*.test.ts` - Hook logic tests
- `src/utils/*.test.ts` - Utility function tests

### Integration Tests
Located in `tests/integration/`:
- `persistence.test.tsx` - LocalStorage persistence tests
- `trading.test.tsx` - End-to-end trading flow tests

### Test Coverage
- **Target**: 85%+ code coverage
- **Focus Areas**: Limit order logic, trade execution, validation
- **Tools**: Vitest, @testing-library/react

## Key Design Decisions

### Why Custom SVG Chart?
- **Requirement**: No third-party chart libraries allowed
- **Benefits**: Full control, lightweight, educational value
- **Implementation**: Direct SVG path generation from price data

### Why Custom Hooks Pattern?
- **Separation of Concerns**: Business logic separate from UI
- **Reusability**: Hooks can be composed and reused
- **Testability**: Easy to test in isolation
- **Performance**: Fine-grained control over re-renders

### Why LocalStorage?
- **Requirement**: Data persistence without backend
- **Benefits**: Simple, fast, browser-native
- **Limitation**: 5-10MB storage limit (sufficient for this use case)
