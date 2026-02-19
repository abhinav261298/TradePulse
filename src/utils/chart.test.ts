import { describe, it, expect } from 'vitest';
import {
  calculateScales,
  generatePathData,
  formatTimestamp,
  generateAxisLabels,
  generateGridLines,
  getTimeLabels,
  calculatePriceChange,
} from './chart';
import type { PricePoint } from '../types';
import type { ChartDimensions } from './chart';

describe('Chart Utilities', () => {
  const mockPriceHistory: PricePoint[] = [
    { timestamp: 1000, price: 100 },
    { timestamp: 2000, price: 150 },
    { timestamp: 3000, price: 120 },
    { timestamp: 4000, price: 180 },
  ];

  const mockDimensions: ChartDimensions = {
    width: 800,
    height: 400,
    padding: { top: 20, right: 60, bottom: 40, left: 60 },
  };

  describe('calculateScales', () => {
    it('should calculate scales from price history', () => {
      const scales = calculateScales(mockPriceHistory, mockDimensions);
      
      expect(scales.minPrice).toBeLessThan(100); // With 5% padding
      expect(scales.maxPrice).toBeGreaterThan(180); // With 5% padding
      expect(scales.minTime).toBe(1000);
      expect(scales.maxTime).toBe(4000);
      expect(scales.xScale).toBeDefined();
      expect(scales.yScale).toBeDefined();
    });

    it('should handle empty history', () => {
      const scales = calculateScales([], mockDimensions);
      
      expect(scales.minPrice).toBe(0);
      expect(scales.maxPrice).toBe(0);
      expect(scales.minTime).toBe(0);
      expect(scales.maxTime).toBe(0);
    });

    it('should create working scale functions', () => {
      const scales = calculateScales(mockPriceHistory, mockDimensions);
      
      const x = scales.xScale(2000);
      const y = scales.yScale(150);
      
      expect(x).toBeGreaterThanOrEqual(mockDimensions.padding.left);
      expect(y).toBeGreaterThanOrEqual(mockDimensions.padding.top);
    });
  });

  describe('generatePathData', () => {
    it('should generate SVG path from price history', () => {
      const scales = calculateScales(mockPriceHistory, mockDimensions);
      const path = generatePathData(mockPriceHistory, scales);
      
      expect(path).toContain('M');
      expect(path).toContain('L');
    });

    it('should return empty path for empty history', () => {
      const scales = calculateScales([], mockDimensions);
      const path = generatePathData([], scales);
      
      expect(path).toBe('');
    });

    it('should handle single point', () => {
      const singlePoint: PricePoint[] = [{ timestamp: 1000, price: 100 }];
      const scales = calculateScales(singlePoint, mockDimensions);
      const path = generatePathData(singlePoint, scales);
      
      expect(path).toContain('M');
      expect(path).not.toContain('L');
    });
  });

  describe('formatTimestamp', () => {
    it('should format timestamp as HH:MM:SS', () => {
      const timestamp = new Date('2024-01-01T14:30:45').getTime();
      const formatted = formatTimestamp(timestamp);
      
      expect(formatted).toMatch(/\d{2}:\d{2}:\d{2}/);
    });

    it('should pad single digits with zeros', () => {
      const timestamp = new Date('2024-01-01T09:05:03').getTime();
      const formatted = formatTimestamp(timestamp);
      
      expect(formatted).toMatch(/09:05:03/);
    });
  });

  describe('generateAxisLabels', () => {
    it('should generate 3 price labels (max, mid, min)', () => {
      const labels = generateAxisLabels(100, 200);
      
      expect(labels).toHaveLength(3);
      expect(labels[0]).toBe(200); // max
      expect(labels[1]).toBe(150); // mid
      expect(labels[2]).toBe(100); // min
    });

    it('should handle same min and max', () => {
      const labels = generateAxisLabels(100, 100);
      
      expect(labels).toHaveLength(3);
      expect(labels[0]).toBe(100);
      expect(labels[1]).toBe(100);
      expect(labels[2]).toBe(100);
    });
  });

  describe('generateGridLines', () => {
    it('should generate grid line positions', () => {
      const lines = generateGridLines(mockDimensions, 5);
      
      expect(lines).toHaveLength(6); // 0 to 5 inclusive
      expect(lines[0]).toBe(mockDimensions.padding.top);
      expect(lines[lines.length - 1]).toBe(mockDimensions.height - mockDimensions.padding.bottom);
    });

    it('should generate correct number of lines', () => {
      const lines = generateGridLines(mockDimensions, 3);
      
      expect(lines).toHaveLength(4); // 0 to 3 inclusive
    });
  });

  describe('getTimeLabels', () => {
    it('should generate time labels for start, middle, end', () => {
      const labels = getTimeLabels(mockPriceHistory);
      
      expect(labels).toHaveLength(3);
      expect(labels[0].timestamp).toBe(1000);
      expect(labels[1].timestamp).toBe(3000); // Middle of 4 items is index 2
      expect(labels[2].timestamp).toBe(4000);
    });

    it('should return empty array for empty history', () => {
      const labels = getTimeLabels([]);
      
      expect(labels).toEqual([]);
    });

    it('should include formatted labels', () => {
      const labels = getTimeLabels(mockPriceHistory);
      
      labels.forEach((label) => {
        expect(label.label).toMatch(/\d{2}:\d{2}:\d{2}/);
      });
    });
  });

  describe('calculatePriceChange', () => {
    it('should calculate price change percentage', () => {
      const change = calculatePriceChange(mockPriceHistory);
      
      // From 100 to 180 = 80% increase
      expect(change).toBe(80);
    });

    it('should return 0 for single point', () => {
      const singlePoint: PricePoint[] = [{ timestamp: 1000, price: 100 }];
      const change = calculatePriceChange(singlePoint);
      
      expect(change).toBe(0);
    });

    it('should return 0 for empty history', () => {
      const change = calculatePriceChange([]);
      
      expect(change).toBe(0);
    });

    it('should handle negative change', () => {
      const decreasingPrices: PricePoint[] = [
        { timestamp: 1000, price: 200 },
        { timestamp: 2000, price: 100 },
      ];
      const change = calculatePriceChange(decreasingPrices);
      
      expect(change).toBe(-50);
    });
  });
});
