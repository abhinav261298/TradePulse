import { memo, useRef, useEffect, useState, useMemo } from 'react';
import type { PricePoint } from '../../types';
import {
  calculateScales,
  generatePathData,
  generateGridLines,
  generateAxisLabels,
  getTimeLabels,
  formatCurrency,
  type ChartDimensions,
} from '../../utils';
import styles from './Chart.module.css';

export interface ChartProps {
  priceHistory: PricePoint[];
  currentPrice: number;
  symbol: string;
}

const DEFAULT_DIMENSIONS: ChartDimensions = {
  width: 800,
  height: 400,
  padding: {
    top: 20,
    right: 60,
    bottom: 40,
    left: 10,
  },
};

export const Chart = memo(({
  priceHistory,
  currentPrice,
  symbol,
}: ChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<ChartDimensions>(DEFAULT_DIMENSIONS);

  // Responsive dimensions with ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions((prev) => ({
          ...prev,
          width,
          height,
        }));
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Calculate scales
  const scales = useMemo(() => {
    return calculateScales(priceHistory, dimensions);
  }, [priceHistory, dimensions]);

  // Generate path data
  const pathData = useMemo(() => {
    return generatePathData(priceHistory, scales);
  }, [priceHistory, scales]);

  // Grid lines
  const gridLines = useMemo(() => {
    return generateGridLines(dimensions, 5);
  }, [dimensions]);

  // Y-axis labels
  const yAxisLabels = useMemo(() => {
    return generateAxisLabels(scales.minPrice, scales.maxPrice);
  }, [scales.minPrice, scales.maxPrice]);

  // X-axis time labels
  const timeLabels = useMemo(() => {
    return getTimeLabels(priceHistory);
  }, [priceHistory]);

  // Current price Y position
  const currentPriceY = useMemo(() => {
    return scales.yScale(currentPrice);
  }, [scales, currentPrice]);

  // Chart width for current price line
  const chartWidth = dimensions.width - dimensions.padding.left - dimensions.padding.right;

  if (priceHistory.length === 0) {
    return (
      <div ref={containerRef} className={styles.chartContainer}>
        <div className={styles.emptyState}>
          <p>Waiting for price data...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={styles.chartContainer}>
      <svg
        width={dimensions.width}
        height={dimensions.height}
        className={styles.svg}
      >
        {/* Grid Lines */}
        <g className={styles.gridLines}>
          {gridLines.map((y, index) => (
            <line
              key={index}
              x1={dimensions.padding.left}
              y1={y}
              x2={dimensions.width - dimensions.padding.right}
              y2={y}
              className={styles.gridLine}
            />
          ))}
        </g>

        {/* Price Line */}
        <path
          d={pathData}
          className={styles.priceLine}
          fill="none"
          strokeWidth={2}
        />

        {/* Current Price Indicator (Green Dashed Line) */}
        <g className={styles.currentPriceIndicator}>
          <line
            x1={dimensions.padding.left}
            y1={currentPriceY}
            x2={dimensions.padding.left + chartWidth}
            y2={currentPriceY}
            className={styles.currentPriceLine}
            strokeDasharray="5,5"
          />
          <rect
            x={dimensions.width - dimensions.padding.right + 4}
            y={currentPriceY - 12}
            width={52}
            height={24}
            className={styles.currentPriceBox}
            rx={4}
          />
          <text
            x={dimensions.width - dimensions.padding.right + 30}
            y={currentPriceY}
            className={styles.currentPriceText}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {formatCurrency(currentPrice)}
          </text>
        </g>

        {/* Y-Axis Labels */}
        <g className={styles.yAxisLabels}>
          {yAxisLabels.map((price, index) => {
            const y = scales.yScale(price);
            return (
              <text
                key={index}
                x={dimensions.width - dimensions.padding.right + 30}
                y={y}
                className={styles.yAxisLabel}
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {formatCurrency(price)}
              </text>
            );
          })}
        </g>

        {/* X-Axis Labels */}
        <g className={styles.xAxisLabels}>
          {timeLabels.map((item, index) => {
            const x = scales.xScale(item.timestamp);
            return (
              <text
                key={index}
                x={x}
                y={dimensions.height - 10}
                className={styles.xAxisLabel}
                textAnchor="middle"
              >
                {item.label}
              </text>
            );
          })}
        </g>
      </svg>

      {/* Chart Info Overlay */}
      <div className={styles.chartInfo}>
        <span className={styles.symbol}>{symbol}</span>
        <span className={styles.dataPoints}>
          {priceHistory.length} data points
        </span>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for optimization
  // Only re-render if price history length changed or current price changed significantly
  const priceChanged = Math.abs(prevProps.currentPrice - nextProps.currentPrice) > 0.01;
  const historyChanged = prevProps.priceHistory.length !== nextProps.priceHistory.length;
  const symbolChanged = prevProps.symbol !== nextProps.symbol;

  return !priceChanged && !historyChanged && !symbolChanged;
});

Chart.displayName = 'Chart';
