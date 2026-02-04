import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTransferStore } from './useTransferStore';

// Mock API
vi.mock('@/lib/api', () => ({
  stockTransfersAPI: {
    getTransfers: vi.fn().mockResolvedValue({ data: [] }),
    createTransfer: vi.fn().mockResolvedValue({ data: {} }),
    updateStatus: vi.fn().mockResolvedValue({ data: {} }),
  },
  cabangAPI: {
    getCabangs: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

describe('useTransferStore', () => {
  beforeEach(() => {
    useTransferStore.setState({
      transfers: [],
      cabangs: [],
      searchTerm: '',
      statusFilter: '',
      fromCabangFilter: '',
      toCabangFilter: '',
      dateFrom: '',
      dateTo: '',
      loading: true,
      submitting: false,
    });
  });

  it('should initialize with default state', () => {
    const state = useTransferStore.getState();
    expect(state.transfers).toEqual([]);
    expect(state.searchTerm).toBe('');
    expect(state.statusFilter).toBe('');
    expect(state.loading).toBe(true);
  });

  it('should update search term', () => {
    useTransferStore.getState().setSearchTerm('test');
    expect(useTransferStore.getState().searchTerm).toBe('test');
  });

  it('should update status filter', () => {
    useTransferStore.getState().setStatusFilter('PENDING');
    expect(useTransferStore.getState().statusFilter).toBe('PENDING');
  });

  it('should update from cabang filter', () => {
    useTransferStore.getState().setFromCabangFilter('cabang-1');
    expect(useTransferStore.getState().fromCabangFilter).toBe('cabang-1');
  });

  it('should update to cabang filter', () => {
    useTransferStore.getState().setToCabangFilter('cabang-2');
    expect(useTransferStore.getState().toCabangFilter).toBe('cabang-2');
  });

  it('should update date filters', () => {
    useTransferStore.getState().setDateFrom('2024-01-01');
    useTransferStore.getState().setDateTo('2024-12-31');
    expect(useTransferStore.getState().dateFrom).toBe('2024-01-01');
    expect(useTransferStore.getState().dateTo).toBe('2024-12-31');
  });

  it('should set transfers', () => {
    const mockTransfers = [
      { id: 't1', transferNumber: 'TRF001', status: 'PENDING' as const, fromCabang: { id: 'c1', name: 'Branch 1', isActive: true }, toCabang: { id: 'c2', name: 'Branch 2', isActive: true }, items: [], createdAt: '', updatedAt: '' },
    ];
    useTransferStore.getState().setTransfers(mockTransfers);
    expect(useTransferStore.getState().transfers).toEqual(mockTransfers);
  });

  it('should set loading state', () => {
    useTransferStore.getState().setLoading(false);
    expect(useTransferStore.getState().loading).toBe(false);
  });

  it('should set submitting state', () => {
    useTransferStore.getState().setSubmitting(true);
    expect(useTransferStore.getState().submitting).toBe(true);
  });
});

