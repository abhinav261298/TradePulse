/**
 * Chart Utility Functions
 * Handles coordinate mapping, scaling, and SVG path generation
 */

import type { PricePoint } from '../types';

export interface ChartDimensions {
  width: number;
  height: number;
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface ChartScales {
  xScale: (timestamp: number) => number;
  yScale: (price: number) => number;
  minPrice: number;
  maxPrice: number;
  minTime: number;
  maxTime: number;
}

/**
 * Calculate scales for mapping data to SVG coordinates
 */
export const calculateScales = (
  priceHistory: PricePoint[],
  dimensions: ChartDimensions
): ChartScales => {
  if (priceHistory.length === 0) {
    return {
      xScale: () => 0,
      yScale: () => 0,
      minPrice: 0,
      maxPrice: 0,
      minTime: 0,
      maxTime: 0,
    };
  }

  const { width, height, padding } = dimensions;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Find min/max prices with 5% padding
  const prices = priceHistory.map((p) => p.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;
  const pricePadding = priceRange * 0.05;

  const paddedMinPrice = minPrice - pricePadding;
  const paddedMaxPrice = maxPrice + pricePadding;

  // Find min/max timestamps
  const timestamps = priceHistory.map((p) => p.timestamp);
  const minTime = Math.min(...timestamps);
  const maxTime = Math.max(...timestamps);
  const timeRange = maxTime - minTime || 1; // Avoid division by zero

  // Scale functions
  const xScale = (timestamp: number): number => {
    const ratio = (timestamp - minTime) / timeRange;
    return padding.left + ratio * chartWidth;
  };

  const yScale = (price: number): number => {
    const ratio = (price - paddedMinPrice) / (paddedMaxPrice - paddedMinPrice || 1);
    // Invert Y-axis (SVG top is 0)
    return padding.top + (1 - ratio) * chartHeight;
  };

  return {
    xScale,
    yScale,
    minPrice: paddedMinPrice,
    maxPrice: paddedMaxPrice,
    minTime,
    maxTime,
  };
};

/**
 * Generate SVG path data for price line
 */
export const generatePathData = (
  priceHistory: PricePoint[],
  scales: ChartScales
): string => {
  if (priceHistory.length === 0) return '';

  const { xScale, yScale } = scales;

  const pathCommands = priceHistory.map((point, index) => {
    const x = xScale(point.timestamp);
    const y = yScale(point.price);
    const command = index === 0 ? 'M' : 'L';
    return `${command} ${x.toFixed(2)} ${y.toFixed(2)}`;
  });

  return pathCommands.join(' ');
};

/**
 * Format timestamp for X-axis labels
 */
export const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

/**
 * Generate Y-axis price labels (3 labels: min, mid, max)
 */
export const generateAxisLabels = (
  minPrice: number,
  maxPrice: number
): number[] => {
  const midPrice = (minPrice + maxPrice) / 2;
  return [maxPrice, midPrice, minPrice];
};

/**
 * Generate grid line positions for Y-axis
 */
export const generateGridLines = (
  dimensions: ChartDimensions,
  count: number = 5
): number[] => {
  const { height, padding } = dimensions;
  const chartHeight = height - padding.top - padding.bottom;
  const lines: number[] = [];

  for (let i = 0; i <= count; i++) {
    const y = padding.top + (i / count) * chartHeight;
    lines.push(y);
  }

  return lines;
};

/**
 * Get time labels for X-axis (start, middle, end)
 */
export const getTimeLabels = (
  priceHistory: PricePoint[]
): Array<{ timestamp: number; label: string }> => {
  if (priceHistory.length === 0) return [];

  const firstPoint = priceHistory[0];
  const lastPoint = priceHistory[priceHistory.length - 1];
  const midIndex = Math.floor(priceHistory.length / 2);
  const midPoint = priceHistory[midIndex];

  return [
    { timestamp: firstPoint.timestamp, label: formatTimestamp(firstPoint.timestamp) },
    { timestamp: midPoint.timestamp, label: formatTimestamp(midPoint.timestamp) },
    { timestamp: lastPoint.timestamp, label: formatTimestamp(lastPoint.timestamp) },
  ];
};

/**
 * Calculate price change percentage
 */
export const calculatePriceChange = (priceHistory: PricePoint[]): number => {
  if (priceHistory.length < 2) return 0;

  const firstPrice = priceHistory[0].price;
  const lastPrice = priceHistory[priceHistory.length - 1].price;

  return ((lastPrice - firstPrice) / firstPrice) * 100;
};
