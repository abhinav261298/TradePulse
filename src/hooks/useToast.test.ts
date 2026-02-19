import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast } from './useToast';

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with empty toasts', () => {
      const { result } = renderHook(() => useToast());
      
      expect(result.current.toasts).toEqual([]);
    });
  });

  describe('success', () => {
    it('should add success toast', () => {
      const { result } = renderHook(() => useToast());
      
      act(() => {
        result.current.success('Operation successful');
      });
      
      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0]).toMatchObject({
        type: 'success',
        message: 'Operation successful',
      });
    });
  });

  describe('error', () => {
    it('should add error toast', () => {
      const { result } = renderHook(() => useToast());
      
      act(() => {
        result.current.error('An error occurred');
      });
      
      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0]).toMatchObject({
        type: 'error',
        message: 'An error occurred',
      });
    });
  });

  describe('info', () => {
    it('should add info toast', () => {
      const { result } = renderHook(() => useToast());
      
      act(() => {
        result.current.info('Information message');
      });
      
      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0]).toMatchObject({
        type: 'info',
        message: 'Information message',
      });
    });
  });

  describe('warning', () => {
    it('should add warning toast', () => {
      const { result } = renderHook(() => useToast());
      
      act(() => {
        result.current.warning('Warning message');
      });
      
      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0]).toMatchObject({
        type: 'warning',
        message: 'Warning message',
      });
    });
  });

  describe('Max Toasts Limit', () => {
    it('should limit to 3 toasts', () => {
      const { result } = renderHook(() => useToast());
      
      act(() => {
        result.current.success('Toast 1');
        result.current.success('Toast 2');
        result.current.success('Toast 3');
        result.current.success('Toast 4');
      });
      
      expect(result.current.toasts).toHaveLength(3);
      expect(result.current.toasts[0].message).toBe('Toast 2');
      expect(result.current.toasts[2].message).toBe('Toast 4');
    });
  });

  describe('Auto-dismiss', () => {
    it('should auto-dismiss toast after 3 seconds', () => {
      const { result } = renderHook(() => useToast());
      
      act(() => {
        result.current.success('Auto dismiss test');
      });
      
      expect(result.current.toasts).toHaveLength(1);
      
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      
      expect(result.current.toasts).toHaveLength(0);
    });

    it('should handle custom duration', () => {
      const { result } = renderHook(() => useToast());
      
      act(() => {
        result.current.success('Custom duration', 5000);
      });
      
      expect(result.current.toasts).toHaveLength(1);
      
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      
      expect(result.current.toasts).toHaveLength(1);
      
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      
      expect(result.current.toasts).toHaveLength(0);
    });
  });

  describe('removeToast', () => {
    it('should remove specific toast', () => {
      const { result } = renderHook(() => useToast());
      
      act(() => {
        result.current.success('Toast 1');
        result.current.success('Toast 2');
      });
      
      const toastId = result.current.toasts[0].id;
      
      act(() => {
        result.current.removeToast(toastId);
      });
      
      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].message).toBe('Toast 2');
    });

    it('should do nothing if toast ID not found', () => {
      const { result } = renderHook(() => useToast());
      
      act(() => {
        result.current.success('Toast 1');
      });
      
      act(() => {
        result.current.removeToast('non-existent-id');
      });
      
      expect(result.current.toasts).toHaveLength(1);
    });
  });

  describe('Unique IDs', () => {
    it('should generate unique IDs for each toast', () => {
      const { result } = renderHook(() => useToast());
      
      act(() => {
        result.current.success('Toast 1');
        result.current.success('Toast 2');
        result.current.success('Toast 3');
      });
      
      const ids = result.current.toasts.map(t => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3);
    });
  });
});
