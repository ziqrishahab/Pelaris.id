import { describe, it, expect, vi } from 'vitest';
import {
  createDateRangeHandler,
  calculateDateRange,
  formatDateString,
  getErrorMessage,
  createFilterFn,
  withLoading,
  withLoadingAndMessage,
} from './storeUtils';

describe('storeUtils', () => {
  describe('createDateRangeHandler', () => {
    it('should set custom date mode when value is custom', () => {
      const setDateRange = vi.fn();
      const setShowCustomDate = vi.fn();
      const handler = createDateRangeHandler(setDateRange, setShowCustomDate);
      
      handler('custom');
      
      expect(setShowCustomDate).toHaveBeenCalledWith(true);
      expect(setDateRange).not.toHaveBeenCalled();
    });

    it('should set date range and hide custom date for preset values', () => {
      const setDateRange = vi.fn();
      const setShowCustomDate = vi.fn();
      const handler = createDateRangeHandler(setDateRange, setShowCustomDate);
      
      handler('30');
      
      expect(setShowCustomDate).toHaveBeenCalledWith(false);
      expect(setDateRange).toHaveBeenCalledWith('30');
    });
  });

  describe('calculateDateRange', () => {
    it('should calculate correct date range for 7 days', () => {
      const { startDate, endDate } = calculateDateRange('7');
      const diff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      expect(diff).toBe(7);
    });

    it('should calculate correct date range for 30 days', () => {
      const { startDate, endDate } = calculateDateRange('30');
      const diff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      expect(diff).toBe(30);
    });

    it('should handle invalid range gracefully', () => {
      const { startDate, endDate } = calculateDateRange('invalid');
      expect(startDate).toBeInstanceOf(Date);
      expect(endDate).toBeInstanceOf(Date);
    });
  });

  describe('formatDateString', () => {
    it('should format date as YYYY-MM-DD', () => {
      const date = new Date('2024-03-15T12:00:00Z');
      expect(formatDateString(date)).toBe('2024-03-15');
    });
  });

  describe('getErrorMessage', () => {
    it('should return message from Error instance', () => {
      const error = new Error('Test error');
      expect(getErrorMessage(error)).toBe('Test error');
    });

    it('should extract error from response object', () => {
      const error = {
        response: {
          data: {
            error: 'API error message'
          }
        }
      };
      expect(getErrorMessage(error)).toBe('API error message');
    });

    it('should extract message from response object', () => {
      const error = {
        response: {
          data: {
            message: 'API message'
          }
        }
      };
      expect(getErrorMessage(error)).toBe('API message');
    });

    it('should return default message for unknown error', () => {
      expect(getErrorMessage('string error')).toBe('An unknown error occurred');
    });
  });

  describe('createFilterFn', () => {
    interface TestItem {
      id: string;
      name: string;
      description?: string;
      isActive: boolean;
    }

    const items: TestItem[] = [
      { id: '1', name: 'Apple Juice', description: 'desc1', isActive: true },
      { id: '2', name: 'Banana Smoothie', description: 'desc2', isActive: false },
      { id: '3', name: 'Apple Pie', description: 'special', isActive: true },
    ];

    it('should filter out inactive items when showInactive is false', () => {
      const filterFn = createFilterFn<TestItem>('', false, ['name']);
      const filtered = items.filter(filterFn);
      expect(filtered).toHaveLength(2);
      expect(filtered.every(item => item.isActive)).toBe(true);
    });

    it('should include inactive items when showInactive is true', () => {
      const filterFn = createFilterFn<TestItem>('', true, ['name']);
      const filtered = items.filter(filterFn);
      expect(filtered).toHaveLength(3);
    });

    it('should filter by search term', () => {
      const filterFn = createFilterFn<TestItem>('apple', true, ['name']);
      const filtered = items.filter(filterFn);
      expect(filtered).toHaveLength(2);
    });

    it('should search in multiple fields', () => {
      const filterFn = createFilterFn<TestItem>('special', true, ['name', 'description']);
      const filtered = items.filter(filterFn);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('3');
    });

    it('should be case insensitive', () => {
      const filterFn = createFilterFn<TestItem>('APPLE', true, ['name']);
      const filtered = items.filter(filterFn);
      expect(filtered).toHaveLength(2);
    });
  });

  describe('withLoading', () => {
    it('should set loading true then false', async () => {
      const setLoading = vi.fn();
      const operation = vi.fn().mockResolvedValue('result');
      
      const result = await withLoading(setLoading, operation);
      
      expect(setLoading).toHaveBeenCalledTimes(2);
      expect(setLoading).toHaveBeenNthCalledWith(1, true);
      expect(setLoading).toHaveBeenNthCalledWith(2, false);
      expect(result).toBe('result');
    });

    it('should set loading false even on error', async () => {
      const setLoading = vi.fn();
      const operation = vi.fn().mockRejectedValue(new Error('test'));
      
      await expect(withLoading(setLoading, operation)).rejects.toThrow('test');
      expect(setLoading).toHaveBeenNthCalledWith(2, false);
    });
  });

  describe('withLoadingAndMessage', () => {
    it('should set success message on completion', async () => {
      const setLoading = vi.fn();
      const setMessage = vi.fn();
      const operation = vi.fn().mockResolvedValue('result');
      
      const result = await withLoadingAndMessage(
        setLoading,
        setMessage,
        operation,
        'Success!'
      );
      
      expect(result).toBe('result');
      expect(setMessage).toHaveBeenCalledWith('Success!', 'success');
    });

    it('should set error message on failure', async () => {
      const setLoading = vi.fn();
      const setMessage = vi.fn();
      const operation = vi.fn().mockRejectedValue(new Error('Failed!'));
      
      const result = await withLoadingAndMessage(
        setLoading,
        setMessage,
        operation
      );
      
      expect(result).toBeNull();
      expect(setMessage).toHaveBeenCalledWith('Failed!', 'error');
    });
  });
});

