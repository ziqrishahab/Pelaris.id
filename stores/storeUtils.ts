/**
 * Common store patterns and utilities for Zustand stores
 * 
 * This file contains:
 * 1. Type helpers for common state patterns
 * 2. Factory functions for common state slices
 * 3. Reusable store slice creators
 */

import { StateCreator } from 'zustand';

// ============================================================================
// TYPE HELPERS
// ============================================================================

/**
 * Base state for loading operations
 */
export interface LoadingState {
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

/**
 * State with multiple loading states
 */
export interface MultiLoadingState {
  loadingStates: Record<string, boolean>;
  setLoadingState: (key: string, loading: boolean) => void;
  isLoading: (key: string) => boolean;
}

/**
 * Base state for modal operations
 */
export interface ModalState {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  openModal: () => void;
  closeModal: () => void;
}

/**
 * State with message handling
 */
export interface MessageState {
  message: string;
  messageType: 'success' | 'error' | 'info' | '';
  setMessage: (message: string, type?: 'success' | 'error' | 'info') => void;
  clearMessage: () => void;
}

/**
 * Base state for search/filter operations
 */
export interface SearchFilterState {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

/**
 * Common CRUD list state pattern
 */
export interface CrudListState<T, TForm> {
  items: T[];
  loading: boolean;
  submitting: boolean;
  searchTerm: string;
  showInactive: boolean;
  showModal: boolean;
  formData: TForm;
  editingId: string | null;
  
  setItems: (items: T[]) => void;
  setLoading: (loading: boolean) => void;
  setSubmitting: (submitting: boolean) => void;
  setSearchTerm: (term: string) => void;
  setShowInactive: (show: boolean) => void;
  setShowModal: (show: boolean) => void;
  setFormData: (data: Partial<TForm>) => void;
  resetForm: () => void;
  setEditing: (item: T | null) => void;
}

// ============================================================================
// SLICE CREATORS
// ============================================================================

/**
 * Creates loading state slice
 */
export const createLoadingSlice = <T extends object>(
  initialLoading = false
): StateCreator<T & LoadingState, [], [], LoadingState> => (set) => ({
  loading: initialLoading,
  setLoading: (loading) => set({ loading } as Partial<T & LoadingState>),
});

/**
 * Creates modal state slice
 */
export const createModalSlice = <T extends object>(): StateCreator<T & ModalState, [], [], ModalState> => (set) => ({
  showModal: false,
  setShowModal: (show) => set({ showModal: show } as Partial<T & ModalState>),
  openModal: () => set({ showModal: true } as Partial<T & ModalState>),
  closeModal: () => set({ showModal: false } as Partial<T & ModalState>),
});

/**
 * Creates message state slice
 */
export const createMessageSlice = <T extends object>(): StateCreator<T & MessageState, [], [], MessageState> => (set) => ({
  message: '',
  messageType: '',
  setMessage: (message, type = 'info') => set({ message, messageType: type } as Partial<T & MessageState>),
  clearMessage: () => set({ message: '', messageType: '' } as Partial<T & MessageState>),
});

/**
 * Creates search filter state slice
 */
export const createSearchFilterSlice = <T extends object>(): StateCreator<T & SearchFilterState, [], [], SearchFilterState> => (set) => ({
  searchTerm: '',
  setSearchTerm: (term) => set({ searchTerm: term } as Partial<T & SearchFilterState>),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Creates a standard date range handler
 * @param setDateRange - function to set date range
 * @param setShowCustomDate - function to toggle custom date mode
 */
export const createDateRangeHandler = (
  setDateRange: (range: string) => void,
  setShowCustomDate: (show: boolean) => void
) => (value: string) => {
  if (value === 'custom') {
    setShowCustomDate(true);
  } else {
    setShowCustomDate(false);
    setDateRange(value);
  }
};

/**
 * Calculates date range based on preset value
 * @param range - preset value ('7', '30', '90', etc.)
 * @returns object with startDate and endDate
 */
export const calculateDateRange = (range: string): { startDate: Date; endDate: Date } => {
  const endDate = new Date();
  const startDate = new Date();
  
  const days = parseInt(range);
  if (!isNaN(days)) {
    startDate.setDate(endDate.getDate() - days);
  }
  
  return { startDate, endDate };
};

/**
 * Formats date to YYYY-MM-DD string
 */
export const formatDateString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Common error handler for API calls
 * @param error - the error object
 * @returns formatted error message
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null) {
    const err = error as { response?: { data?: { error?: string; message?: string } }; message?: string };
    return err.response?.data?.error || err.response?.data?.message || err.message || 'An error occurred';
  }
  return 'An unknown error occurred';
};

/**
 * Creates a filter function for items with isActive property
 * @param searchTerm - the search term
 * @param showInactive - whether to show inactive items
 * @param searchFields - array of field names to search in
 */
export const createFilterFn = <T extends { isActive?: boolean }>(
  searchTerm: string,
  showInactive: boolean,
  searchFields: (keyof T)[]
) => (item: T): boolean => {
  // Filter by active status
  if (!showInactive && item.isActive === false) {
    return false;
  }
  
  // Filter by search term
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    return searchFields.some(field => {
      const value = item[field];
      return typeof value === 'string' && value.toLowerCase().includes(term);
    });
  }
  
  return true;
};

// ============================================================================
// ASYNC HELPERS
// ============================================================================

/**
 * Wraps an async operation with loading state management
 * @param setLoading - function to set loading state
 * @param operation - the async operation to perform
 */
export const withLoading = async <T>(
  setLoading: (loading: boolean) => void,
  operation: () => Promise<T>
): Promise<T> => {
  setLoading(true);
  try {
    return await operation();
  } finally {
    setLoading(false);
  }
};

/**
 * Wraps an async operation with loading and error handling
 * @param setLoading - function to set loading state
 * @param setMessage - function to set message state
 * @param operation - the async operation to perform
 * @param successMessage - optional success message
 */
export const withLoadingAndMessage = async <T>(
  setLoading: (loading: boolean) => void,
  setMessage: (message: string, type?: 'success' | 'error' | 'info') => void,
  operation: () => Promise<T>,
  successMessage?: string
): Promise<T | null> => {
  setLoading(true);
  try {
    const result = await operation();
    if (successMessage) {
      setMessage(successMessage, 'success');
    }
    return result;
  } catch (error) {
    setMessage(getErrorMessage(error), 'error');
    return null;
  } finally {
    setLoading(false);
  }
};

