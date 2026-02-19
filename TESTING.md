# Testing Guide - TradePulse Trading Terminal

## Overview

This project uses **Vitest** as the testing framework with **React Testing Library** for component testing. We aim for **85%+ test coverage** across all code.

## Test Structure

```
trade_pulse/
├── src/
│   ├── utils/
│   │   ├── index.ts
│   │   ├── index.test.ts           # Unit tests
│   │   ├── validation.ts
│   │   ├── validation.test.ts
│   │   ├── chart.ts
│   │   └── chart.test.ts
│   ├── hooks/
│   │   ├── usePortfolio.ts
│   │   ├── usePortfolio.test.ts    # Hook tests
│   │   ├── useTrades.ts
│   │   ├── useTrades.test.ts
│   │   ├── useLimitOrders.ts
│   │   ├── useLimitOrders.test.ts
│   │   ├── useToast.ts
│   │   └── useToast.test.ts
│   └── test/
│       └── setup.ts                 # Test setup
└── tests/
    └── integration/
        ├── trading.test.tsx         # Integration tests
        └── persistence.test.tsx
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm test -- --watch
```

### Run tests with UI
```bash
npm run test:ui
```

### Generate coverage report
```bash
npm run test:coverage
```

## Coverage Thresholds

The project enforces minimum coverage thresholds:
- **Lines**: 85%
- **Functions**: 85%
- **Branches**: 85%
- **Statements**: 85%

## Test Categories

### 1. Unit Tests (100% coverage)

**Utilities (`src/utils/*.test.ts`):**
- ✅ `formatCurrency()` - Currency formatting
- ✅ `formatPercentage()` - Percentage formatting
- ✅ `formatTimestamp()` - Time formatting
- ✅ `preciseAdd/Subtract/Multiply()` - Decimal math
- ✅ `roundToPrecision()` - Number rounding
- ✅ `validateQuantity()` - Input validation
- ✅ `validateBuyOrder()` - Balance checks
- ✅ `validateSellOrder()` - Holdings checks
- ✅ `validateLimitPrice()` - Price validation
- ✅ Chart utilities (scales, paths, labels)

**Storage (`src/utils/storage.test.ts`):**
- ✅ `saveToStorage()` - localStorage save
- ✅ `loadFromStorage()` - localStorage load
- ✅ Default value handling
- ✅ Invalid JSON handling

### 2. Hook Tests (≥85% coverage)

**`usePortfolio.test.ts`:**
- ✅ Initialize with default state
- ✅ Load from localStorage
- ✅ Buy asset (success/failure)
- ✅ Sell asset (success/failure)
- ✅ Update portfolio values
- ✅ Calculate average price
- ✅ Reset portfolio
- ✅ Persistence

**`useTrades.test.ts`:**
- ✅ Add trades (BUY/SELL)
- ✅ LIFO ordering
- ✅ Unique IDs
- ✅ Timestamp generation
- ✅ Clear trades
- ✅ Get trades by ticker
- ✅ Persistence

**`useLimitOrders.test.ts`:**
- ✅ Create limit orders
- ✅ Prevent immediate execution
- ✅ Auto-execute on price trigger
- ✅ BUY order execution (price <= trigger)
- ✅ SELL order execution (price >= trigger)
- ✅ Cancel orders
- ✅ Get pending orders
- ✅ Status transitions
- ✅ Persistence

**`useToast.test.ts`:**
- ✅ Add toasts (success/error/info/warning)
- ✅ Max 3 toasts limit
- ✅ Auto-dismiss (3 seconds)
- ✅ Custom duration
- ✅ Manual removal
- ✅ Unique IDs

### 3. Integration Tests

**`tests/integration/trading.test.tsx`:**
- ✅ Complete buy flow (portfolio + trades)
- ✅ Complete sell flow (portfolio + trades)
- ✅ Limit order creation and execution
- ✅ Portfolio value updates
- ✅ Portfolio reset with trades clear
- ✅ Insufficient balance handling
- ✅ Insufficient holdings handling

**`tests/integration/persistence.test.tsx`:**
- ✅ Portfolio persistence
- ✅ Trades persistence
- ✅ Limit orders persistence
- ✅ Complete session restore
- ✅ localStorage clear handling
- ✅ Order status persistence

### 4. Component Tests (Deferred)

Component tests would cover:
- Button, Input, Spinner (common components)
- Chart rendering and interactions
- TradeForm validation and submissions
- Portfolio display and calculations
- Watchlist item selection
- Toast notifications display

## Key Testing Patterns

### 1. Hook Testing with renderHook
```typescript
const { result } = renderHook(() => usePortfolio(mockGetCurrentPrice));

act(() => {
  result.current.buyAsset('btc', 'BTC', 0.1, 95000);
});

expect(result.current.portfolio.holdings).toHaveLength(1);
```

### 2. Timer Testing
```typescript
beforeEach(() => {
  vi.useFakeTimers();
});

act(() => {
  vi.advanceTimersByTime(3000);
});
```

### 3. LocalStorage Mocking
```typescript
beforeEach(() => {
  localStorage.clear();
});

const saved = localStorage.getItem('key');
expect(saved).toBeTruthy();
```

### 4. Integration Testing
```typescript
// Test multiple hooks together
const { result: portfolioResult } = renderHook(() => usePortfolio(mockGetCurrentPrice));
const { result: tradesResult } = renderHook(() => useTrades());

act(() => {
  portfolioResult.current.buyAsset('btc', 'BTC', 0.1, 95000);
  tradesResult.current.addTrade('btc', 'BTC', 'BUY', 95000, 0.1);
});
```

## Test Data

### Mock Tickers
```typescript
const mockTickers = new Map<string, Ticker>([
  ['btc', { id: 'btc', symbol: 'BTC', price: 95000, change24h: 5.2 }],
  ['eth', { id: 'eth', symbol: 'ETH', price: 3500, change24h: -2.1 }],
]);
```

### Mock Functions
```typescript
const mockGetCurrentPrice = vi.fn((tickerId: string) => {
  const prices: Record<string, number> = {
    'btc': 95000,
    'eth': 3500,
  };
  return prices[tickerId] || 0;
});
```

## Edge Cases Tested

### Trading
- ✅ Insufficient balance
- ✅ Insufficient holdings
- ✅ Selling entire holding (removal)
- ✅ Average price calculation on multiple buys
- ✅ Decimal precision (up to 8 decimals for quantity)

### Limit Orders
- ✅ Immediate execution prevention
- ✅ BUY trigger (price <= trigger)
- ✅ SELL trigger (price >= trigger)
- ✅ Cancelled orders don't execute
- ✅ Order status transitions (PENDING → EXECUTED/CANCELLED)

### Validation
- ✅ Zero and negative values
- ✅ Decimal places (max 2)
- ✅ Empty/invalid input
- ✅ Large numbers
- ✅ Edge case decimals (0.999 rounds to 1.00)

### Persistence
- ✅ Save on every change
- ✅ Restore on mount
- ✅ Handle missing localStorage data
- ✅ Handle invalid JSON
- ✅ Multiple session scenario

## Test Pyramid

```
    /\
   /  \        10% - Integration Tests (2 files)
  /____\           - Complete flows
 /      \          - Multi-hook interactions
/        \     
/__________\   90% - Unit Tests (8+ files)
              - Utilities (100% coverage)
              - Hooks (≥85% coverage)
              - Components (deferred)
```

## Coverage Report

After running `npm run test:coverage`, view the report:

```
open coverage/index.html
```

Current coverage targets:
- **Utils**: 100% (all functions tested)
- **Hooks**: ≥85% (core functionality covered)
- **Components**: Deferred (would add ~15% to overall)
- **Overall Project**: Target 85%+

## CI/CD Integration

Tests run automatically on:
- Pre-commit (optional)
- Pull requests
- Before deployment

## Best Practices

1. **Arrange-Act-Assert** pattern
2. **One assertion per test** (when possible)
3. **Clear test names** (describe what, not how)
4. **Mock external dependencies**
5. **Clean up after each test** (localStorage, timers)
6. **Test edge cases** and error paths
7. **Don't test implementation details**

## Future Improvements

- [ ] Visual regression tests (with Playwright)
- [ ] E2E tests for critical user flows
- [ ] Performance benchmarks
- [ ] Accessibility tests
- [ ] Component visual tests

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
