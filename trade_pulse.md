1. Problem Statement

Your task is to build TradePulse, a lightweight Trading Terminal for simulated "Paper Trading."

Instead of moving tasks between columns, you will manage a Live Order Book and a Custom Price Chart. This assignment evaluates your ability to handle asynchronous streams, manual SVG/Canvas rendering, and performance optimization under frequent state changes.

Note: Use localStorage for persistence. No real financial APIs are required; you will implement a "Mock Price Engine" to simulate market movement.

2. Core Functional Requirements

· Mock Price Engine: Implement a utility that generates a new price for 3 tickers (e.g., BTC, ETH, SOL) every 1 second using a random walk algorithm.

· The Watchlist: A sidebar where users can add/remove tickers. It must show the "Live" price and the 24h change (%) updating in real-time.

· The Custom Chart (The "Pro" Challenge): A central area that renders a Sparkline or Line Chart of the price history for the selected ticker.

    o Constraint: You must render this chart using Native SVG or Canvas. Libraries like Chart.js, D3, or Recharts are strictly prohibited.

· Trade Execution: A panel to "Buy" or "Sell" a ticker at the current market price.

    o Users start with a mock balance of $10,000.

    o Trades must update the "Portfolio" section instantly.

· Limit Orders: Users can set a "Trigger Price." If the Mock Price Engine hits that price, the order must execute automatically.

· Persistence: Your Portfolio balance, trade history, and watchlist must persist in localStorage.

3. UI Layout

The application should follow a Professional Trading Terminal layout:
Section | Width | Role
Watchlist (Left) | 25% | Ticker list with live price updates and "Add" functionality.
Terminal (Center) | 50% | Top: The custom SVG/Canvas Chart. Bottom: Trade execution form.
Portfolio (Right) | 25% | Current holdings, total profit/loss, and trade history log.

4. Technical Constraints & Rules

· No Visualization Libraries: The chart logic (mapping price data to SVG path coordinates or Canvas lineTo points) must be your own.

· State Optimization: You must prevent the entire dashboard from re-rendering every time the price updates (1s frequency). Demonstrate the use of memo, useRef, or specialized state selectors.

· Precise Math: Handle currency calculations using appropriate precision (avoiding floating-point errors where possible).

· AI-Only Evaluation: The AI auditor will look for how you handled the coordinate mapping logic for the chart and your subscription-like pattern for the price engine.

· Unit Tests: Required for the "Order Execution" logic (e.g., ensuring a user cannot buy more than their balance allows).

5. Deliverables

Your submission will be a single private GitHub repository containing:


1. Source Code: Complete, runnable application.

2. README.md: Clear build/run instructions.

3. PROJECT_STRUCTURE.md: Explanation of folder/module layout.

4. ARCHITECTURE.md: * Explain the Chart Rendering Logic: How do you convert an array of prices into a visual line?

a. Explain the Mock Price Engine: How did you ensure the "Live" data is consistent across different components?

5. CHAT_HISTORY.md: * Include your full prompt logs with your AI assistant.

6. PERFORMANCE.md: A short analysis of how you handled the 1-second update interval without affecting UI responsiveness.

7. TEST_STRATEGY.md: Document how you tested the "Limit Order" trigger logic.

8. Video (5–7 min):

a. Demo: Add a ticker, watch the chart update live, and execute a trade.

b. Code Walkthrough: Explain the manual SVG/Canvas drawing code.

c. AI Reflection: Share how you used AI to optimize the "Price Stream" logic