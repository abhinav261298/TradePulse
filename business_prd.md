# TradePulse - Business Product Requirements Document (PRD)

**Version:** 1.0  
**Last Updated:** 2026-02-13  
**Status:** Requirements Gathering Phase

---

## 📋 Executive Summary

**Product Name:** TradePulse  
**Product Type:** Paper Trading Terminal (Simulated Trading Platform)  
**Target Users:** Traders learning market dynamics, students, coding assessment reviewers  
**Core Value Proposition:** Risk-free trading simulation with real-time price updates and portfolio tracking

### Confirmed Specifications
- **Starting Balance:** $10,000 mock currency
- **Tickers:** BTC, ETH, SOL (minimum)
- **Price Update Frequency:** 1 second intervals
- **Price Algorithm:** Random walk
- **Persistence:** localStorage
- **UI Layout:** 25% Watchlist | 50% Chart + Trade Form | 25% Portfolio

---

## ❓ BUSINESS REQUIREMENTS - QUESTIONS TO RESOLVE

### 🎯 SECTION 1: User Experience & Core Workflow

#### Q1.1: Ticker Management
**Question:** How should the ticker system work?

- [ ] **Option A:** Fixed list - Only BTC, ETH, SOL (hardcoded, no additions) - Go with option A
- [ ] **Option B:** Extensible list - Start with BTC, ETH, SOL but allow adding more predefined cryptos (e.g., ADA, DOGE, LINK)
- [ ] **Option C:** Fully custom - Users can create custom tickers with initial prices

**Decision:** Option A  
**Rationale:** Simple and consistent experience

---

#### Q1.2: Default Ticker Selection
**Question:** When the app loads, which ticker should be selected by default?

- [ ] **Option A:** First ticker in watchlist (alphabetically or by order)
- [ ] **Option B:** BTC always (consistent experience)
- [ ] **Option C:** Last selected ticker (persist user preference)
- [ ] **Option D:** No selection - user must click to select

**Decision:** Option B  
**Rationale:** Simple and consistent experience

---

#### Q1.3: Empty Watchlist Handling
**Question:** Can users remove all tickers from the watchlist?

- [ ] **Option A:** Yes - Allow empty watchlist with "Add ticker to get started" message
- [ ] **Option B:** No - Minimum 1 ticker required at all times
- [ ] **Option C:** Allow empty but auto-restore default 3 tickers on refresh

**Decision:** Option B  
**Rationale:** Simple and consistent experience

---

### 💰 SECTION 2: Trading Logic & Business Rules

#### Q2.1: Fractional Trading
**Question:** Can users buy/sell fractional amounts of assets?

- [ ] **Option A:** Yes - Allow up to 8 decimal places (crypto standard: 0.00000001)
- [ ] **Option B:** Yes - Allow up to 2 decimal places (simpler UX: 0.01)
- [ ] **Option C:** No - Only whole units (1 BTC, 2 ETH, etc.)

**Decision:** Option B  
**Rationale:** Simple and consistent experience

---

#### Q2.2: Insufficient Balance on Limit Order Trigger
**Question:** What happens if a limit order triggers but user has insufficient balance?

- [ ] **Option A:** Auto-cancel order + show notification
- [ ] **Option B:** Execute partial order (buy what balance allows)
- [ ] **Option C:** Keep order pending + show warning
- [ ] **Option D:** Try again on next price update (retry logic)

**Decision:** Option A  
**Rationale:** Simple and consistent experience

---

#### Q2.3: Trading Fees
**Question:** Should the platform simulate trading fees?

- [ ] **Option A:** No fees - Simplified trading (buy at exact market price)
- [ ] **Option B:** Flat percentage fee - e.g., 0.1% per trade
- [ ] **Option C:** Tiered fees - Based on trade volume
- [ ] **Option D:** Spread simulation - Buy price slightly higher than sell price

**Decision:** Option A  
**Fee Amount (if applicable):** _______________  
**Rationale:** _______________

---

#### Q2.4: Short Selling
**Question:** Can users sell assets they don't own (short selling)?

- [ ] **Option A:** No - Disable sell when holding quantity = 0
- [ ] **Option B:** Yes - Allow shorting with margin tracking
- [ ] **Option C:** Yes - But only up to account balance (no margin)

**Decision:** Option A  
**Rationale:** Simple and consistent experience

---

#### Q2.5: Order Types
**Question:** Which order types should be supported?

- [x] Market Order (Confirmed - Required)
- [x] Limit Order (Confirmed - Required)
- [ ] Stop-Loss Order
- [ ] Take-Profit Order
- [ ] Trailing Stop
- [ ] OCO (One-Cancels-Other)

**Selected Order Types:** _______________  
**Rationale:** _______________

---

#### Q2.6: Multiple Simultaneous Limit Orders
**Question:** If multiple limit orders trigger at the same time, how to handle execution?

- [ ] **Option A:** Execute in FIFO order (first created, first executed)
- [ ] **Option B:** Execute all simultaneously (if balance sufficient)
- [ ] **Option C:** Prioritize by order size (largest first)
- [ ] **Option D:** User-defined priority setting

**Decision:** Option A  
**Rationale:** Simple and consistent experience

---

### 💼 SECTION 3: Portfolio & Risk Management

#### Q3.1: Negative Balance
**Question:** Can users go into negative balance?

- [ ] **Option A:** Hard stop at $0 - Cannot buy if insufficient balance
- [ ] **Option B:** Allow negative up to -$10,000 (double initial balance)
- [ ] **Option C:** Allow negative with warning notification
- [ ] **Option D:** Margin system with interest calculation

**Decision:** Option A  
**Rationale:** Simple and consistent experience

---

#### Q3.2: Portfolio Reset
**Question:** Should users be able to reset their portfolio?

- [ ] **Option A:** Yes - Reset to $10,000, clear all holdings and trades
- [ ] **Option B:** Yes - Reset balance but keep trade history
- [ ] **Option C:** Yes - With confirmation modal + option to export first
- [ ] **Option D:** No - Permanent record (clear localStorage manually)

**Decision:** Option A  
**Rationale:** Simple and consistent experience

---

#### Q3.3: Portfolio Limits
**Question:** Are there any position limits?

- [ ] **Option A:** No limits - Buy unlimited quantity if balance allows
- [ ] **Option B:** Maximum position size per ticker (e.g., max 50% of portfolio)
- [ ] **Option C:** Maximum number of holdings (e.g., max 10 different tickers)

**Decision:** Option A  
**Limit Details (if applicable):** _______________

---

### 📈 SECTION 4: Price Engine & Market Data

#### Q4.1: Price Volatility Configuration
**Question:** Should volatility be configurable or fixed?

- [ ] **Option A:** Fixed 2% for all tickers (simple, consistent)
- [ ] **Option B:** Different per ticker (BTC: 1%, ETH: 2%, SOL: 3%)
- [ ] **Option C:** User-adjustable via settings panel
- [ ] **Option D:** Dynamic based on recent price movement

**Decision:** Option A  
**Volatility Values:** _______________

---

#### Q4.2: Price Bounds & Circuit Breakers
**Question:** Should there be price limits?

- [ ] **Option A:** No limits - Prices can go to $0 or infinity
- [ ] **Option B:** Minimum floor only - Cannot go below $0.01
- [ ] **Option C:** Floor + ceiling - Min: $0.01, Max: 10x initial price
- [ ] **Option D:** Circuit breaker - Halt if >10% move in 1 second

**Decision:** Option A_______________  
**Bounds (if applicable):** Min: _______ Max: _______

---

#### Q4.3: Historical Data Retention
**Question:** How much price history should be stored?

- [ ] **Option A:** 5 minutes (300 points) - As currently implemented
- [ ] **Option B:** 1 hour (3600 points)
- [ ] **Option C:** 24 hours with persistence in localStorage
- [ ] **Option D:** Configurable time range with selector
                
**Decision:** Option A  
**Rationale:** Simple and consistent experience

---

#### Q4.4: Market Hours & Controls
**Question:** Should the market have operating hours or controls?

- [ ] **Option A:** 24/7 trading (crypto-style, no breaks)
- [ ] **Option B:** Pause/Resume button to freeze market
- [ ] **Option C:** Simulate market hours (9:30am-4pm ET)
- [ ] **Option D:** Speed control (1x, 2x, 5x speed)

**Decision:** Option A  
**Rationale:** Simple and consistent experience

---

### 📊 SECTION 5: Chart Visualization

#### Q5.1: Chart Implementation Technology
**Question:** Which rendering method should be primary?

- [ ] **Option A:** SVG - Better for interactivity, tooltips, accessibility
- [ ] **Option B:** Canvas - Better performance with large datasets
- [ ] **Option C:** Both - SVG for small datasets, Canvas for large

**Decision:** Option A  
**Rationale:** Simple and consistent experience

---

#### Q5.2: Chart Features & Interactivity
**Question:** Which chart features should be included?

- [ ] Hover tooltips (show exact price + timestamp)
- [ ] Zoom in/out functionality
- [ ] Pan left/right to view history
- [ ] Y-axis with price labels
- [ ] X-axis with time labels
- [ ] Gridlines (horizontal/vertical)
- [ ] Current price indicator line
- [ ] Min/Max price markers
- [ ] Volume indicator (if applicable)

**Selected Features:** keep default_______________  
**Priority Order:** _______________

---

#### Q5.3: Chart Update Strategy
**Question:** How often should the chart redraw?

- [ ] **Option A:** Every 1 second (real-time, may impact performance)
- [ ] **Option B:** Every 3 seconds (batched updates)
- [ ] **Option C:** Every 5 seconds (smoother, less CPU)
- [ ] **Option D:** Adaptive - Based on browser performance

**Decision:** Option A  
**Rationale:** Simple and consistent experience

---

#### Q5.4: Chart Type
**Question:** What type of chart should be displayed?

- [ ] **Option A:** Line chart (simple, clean)
- [ ] **Option B:** Candlestick chart (more professional, complex)
- [ ] **Option C:** Area chart (line with filled area below)
- [ ] **Option D:** Sparkline (minimal, no axes)

**Decision:** line chart_______________  
**Rationale:** _______________

---

### 📋 SECTION 6: Watchlist Features

#### Q6.1: Watchlist Size Limits
**Question:** Should there be limits on watchlist size?

- [ ] **Option A:** No limit - Add as many as wanted
- [ ] **Option B:** Maximum 10 tickers
- [ ] **Option C:** Maximum 20 tickers
- [ ] **Option D:** Performance-based (warn if >50)

**Decision:** _________no limit______  
**Rationale:** _______________

---

#### Q6.2: Watchlist Ordering
**Question:** How should tickers be ordered in the watchlist?

- [ ] **Option A:** Manual drag-and-drop reordering
- [ ] **Option B:** Alphabetical by symbol
- [ ] **Option C:** By performance (best to worst)
- [ ] **Option D:** By user-defined priority/favorite
- [ ] **Option E:** Order of addition (FIFO)

**Decision:** _______________  
**Persist order across sessions:** Yes / No

---

#### Q6.3: Watchlist Visual Indicators
**Question:** What should be displayed for each ticker in the watchlist?

- [x] Ticker symbol (e.g., BTC) - Required
- [x] Current price - Required
- [x] 24h change % - Required
- [x] Color coding (green=up, red=down)
- [ ] Sparkline mini-chart
- [x] Active limit order indicator
- [ ] Last trade timestamp
- [ ] Holding quantity indicator

**Selected Indicators:** _______________

---

### 📜 SECTION 7: Trade History & Analytics

#### Q7.1: Trade History Display
**Question:** How should trade history be presented?

- [ ] **Option A:** Simple list (latest first, no filtering)
- [ ] **Option B:** Filterable by ticker, type, date range
- [ ] **Option C:** Grouped by ticker with subtotals
- [ ] **Option D:** Paginated table (10/20/50 per page)

**Decision:** __option A_____________  
**Max trades displayed:** _______________

---

#### Q7.2: Export & Reporting
**Question:** Should users be able to export data?

- [ ] **Option A:** No export functionality
- [ ] **Option B:** Export trade history to CSV
- [ ] **Option C:** Export portfolio snapshot to JSON
- [ ] **Option D:** Full data export (trades + portfolio + settings)

**Decision:** __option A_____________  
**Rationale:** _______________

---

#### Q7.3: Performance Metrics
**Question:** Which performance metrics should be calculated?

- [x] Total P&L (Profit/Loss) - Required
- [x] Total portfolio value - Required
- [ ] Win rate (profitable trades / total trades)
- [ ] Average profit per trade
- [ ] Best/worst performing asset
- [ ] ROI (Return on Investment %)
- [ ] Sharpe ratio
- [ ] Max drawdown

**Selected Metrics:** _______average profit per trade, ROI________

---

#### Q7.4: Trade Confirmation
**Question:** Should trades require confirmation?

- [ ] **Option A:** Direct execution (instant, no modal)
- [ ] **Option B:** Confirmation modal for all trades
- [ ] **Option C:** Confirmation only for large trades (>$1000)
- [ ] **Option D:** Optional setting (user can toggle)

**Decision:** __option A_____________  
**Undo last trade:** Yes / No

---

### 🛡️ SECTION 8: Error Handling & Validation

#### Q8.1: Input Validation
**Question:** How should invalid inputs be handled?

- [ ] **Option A:** Real-time validation (disable submit if invalid)
- [ ] **Option B:** Submit-time validation with error messages
- [ ] **Option C:** Both real-time and submit-time
- [ ] **Option D:** Auto-correction (e.g., round invalid decimals)

**Decision:** _______________

**Validation Rules:**
- Max quantity: _______________
- Min quantity: _______________
- Price precision: _______________
- Max order value: _______________

---

#### Q8.2: Insufficient Balance UX
**Question:** How to indicate insufficient balance?

- [ ] **Option A:** Disable buy button when insufficient
- [ ] **Option B:** Show available buying power below input
- [ ] **Option C:** Red error message after click
- [ ] **Option D:** Auto-fill max affordable quantity

**Decision:** _______option a________

---

#### Q8.3: LocalStorage Failure Handling
**Question:** What if localStorage is disabled/full?

- [ ] **Option A:** Show error, app won't work
- [ ] **Option B:** Fallback to sessionStorage (data lost on close)
- [ ] **Option C:** In-memory only + warning banner
- [ ] **Option D:** Graceful degradation with reduced features

**Decision:** __option A_____________

---

### 📱 SECTION 9: Responsive Design & Accessibility

#### Q9.1: Mobile Layout
**Question:** How should the app adapt to mobile screens?

- [ ] **Option A:** Desktop only (no mobile optimization)
- [ ] **Option B:** Vertical stacking (Watchlist > Chart > Portfolio)
- [ ] **Option C:** Tabbed interface (switch between panels)
- [ ] **Option D:** Collapsible sidebars + full-width chart

**Decision:** __option A_____________  
**Breakpoint:** _______________

---

#### Q9.2: Touch Interactions
**Question:** Should mobile have special interactions?

- [ ] Swipe between panels
- [ ] Pinch to zoom chart
- [ ] Touch-and-hold for details
- [ ] Larger touch targets (48px minimum)
- [ ] Pull-to-refresh

**Selected Features:** _______________

---

#### Q9.3: Accessibility Requirements
**Question:** What accessibility level is required?

- [ ] **Option A:** Basic - Semantic HTML only
- [ ] **Option B:** WCAG 2.1 Level A
- [ ] **Option C:** WCAG 2.1 Level AA
- [ ] **Option D:** Full ARIA support + screen reader optimized

**Decision:** ____sort of real world___________

**Accessibility Features:**
- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] High contrast mode
- [ ] Focus indicators
- [ ] Skip links

---

### 🎨 SECTION 10: UI/UX Design

#### Q10.1: Theme & Color Scheme
**Question:** What should be the visual design approach?

- [ ] **Option A:** Dark mode only (trading terminal standard)
- [ ] **Option B:** Light mode only
- [ ] **Option C:** Both with toggle switch
- [ ] **Option D:** System preference detection

**Decision:** __option A_____________

**Color Palette:**
- Primary color: _______________
- Success/Up color: _______________ (e.g., green)
- Danger/Down color: _______________ (e.g., red)
- Background: _______________
- Text: _______________

---

#### Q10.2: Notifications & Feedback
**Question:** How should the app provide feedback?

- [ ] Toast notifications (top-right corner)
- [ ] Modal alerts (center screen)
- [ ] Inline messages (within panels)
- [ ] Sound effects (on trade execution)
- [ ] Browser notifications (for limit orders)

**Selected Methods:** ____toast notifications___________

**Notification Events:**
- [ ] Trade executed successfully
- [ ] Limit order triggered
- [ ] Insufficient balance error
- [ ] Portfolio milestone (e.g., $20k)
- [ ] Price alerts

---

#### Q10.3: Animation & Transitions
**Question:** What level of animation should be included?

- [ ] **Option A:** None - Instant updates (performance first)
- [ ] **Option B:** Minimal - Fade in/out only
- [ ] **Option C:** Moderate - Smooth transitions, no complex animations
- [ ] **Option D:** Rich - Animated charts, number counters, micro-interactions

**Decision:** __option A_____________

---

### 🧪 SECTION 11: Testing & Quality

#### Q11.1: Test Coverage Targets
**Question:** What should be the test coverage goals?

**Unit Tests:**
- [ ] Order execution logic (REQUIRED per spec)
- [ ] Portfolio calculations
- [ ] Price engine
- [ ] Limit order triggers
- [ ] Precision math utilities

**Integration Tests:**
- [ ] Full trading flow
- [ ] LocalStorage persistence
- [ ] Chart rendering
- [ ] Multi-component interactions

**Target Coverage:** __85_____________% (Spec requires 85%)

---

#### Q11.2: Testing Strategy
**Question:** Which testing approaches should be used?

- [ ] Jest unit tests
- [ ] React Testing Library (component tests)
- [ ] Cypress/Playwright (E2E tests)
- [ ] Manual testing checklist
- [ ] Performance benchmarks

**Selected Approaches:** ________Jest unit test_______

---

### 🚀 SECTION 12: Implementation Scope & Priorities

#### Q12.1: MVP Definition
**Question:** What is the absolute minimum viable product? - main functionalities mention in trade_pulse.md

**Priority 1 - MUST HAVE (MVP):**
- [ ] _______________
- [ ] _______________
- [ ] _______________

**Priority 2 - SHOULD HAVE (V1.1):**
- [ ] _______________
- [ ] _______________

**Priority 3 - NICE TO HAVE (Future):**
- [ ] _______________
- [ ] _______________

---

#### Q12.2: Success Criteria
**Question:** How do we define "done" and "successful"?

**Functional Criteria:**
- [x] All required features working
- [x] No critical bugs
- [x] Cross-browser compatibility (Chrome, Firefox, Safari)
- [ ] _______________

**Performance Criteria:**
- [x] Page load < 3 seconds
- [x] No UI lag with 1-second price updates
- [x] Chart renders in < 100ms
- [ ] _______________

**Quality Criteria:**
- [x] 85%+ test coverage
- [x] No ESLint errors
- [x] Passing type checks
- [ ] _______________

---

#### Q12.3: Timeline & Milestones
**Question:** What is the expected delivery schedule?

- **Phase 1 - Core Engine:** _______________
- **Phase 2 - UI Components:** _______________
- **Phase 3 - Chart Implementation:** _______________
- **Phase 4 - Testing & Polish:** _______________
- **Phase 5 - Documentation:** _______________

**Total Timeline:** _______________

---

## 📝 Decision Log

| Question ID | Decision | Date | Decided By | Notes |
|-------------|----------|------|------------|-------|
| Q1.1 | | | | |
| Q2.1 | | | | |
| Q5.1 | | | | |
| ... | | | | |

---

## 🔄 Change History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-13 | Initial PRD created | AI Assistant |
| | | | |

---

## ✅ Sign-off

**Product Owner:** _______________  
**Date:** _______________  

**Technical Lead:** _______________  
**Date:** _______________  

---

## 📎 Appendix

### A. Technical Constraints (From Spec)
- No chart libraries (Chart.js, D3, Recharts)
- Must use native SVG or Canvas
- Must optimize for 1-second price updates
- Must use memo, useRef, or state selectors
- Must handle floating-point precision
- Must include unit tests for order execution

### B. Required Deliverables (From Spec)
1. Source code (runnable application)
2. README.md (build/run instructions)
3. PROJECT_STRUCTURE.md ✅ (Already created)
4. ARCHITECTURE.md (chart logic + price engine explanation)
5. CHAT_HISTORY.md (AI conversation logs)
6. PERFORMANCE.md (1-second update analysis)
7. TEST_STRATEGY.md (limit order testing)
8. Video walkthrough (5-7 minutes)

### C. Out of Scope
- Real financial APIs
- Real money trading
- User authentication
- Multi-user support
- Backend/database
- Mobile apps (native)

---

**END OF PRD**
