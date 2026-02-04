import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useReturnsStore, Return } from './useReturnsStore';

// Mock API
vi.mock('@/lib/api', () => ({
  returnsAPI: {
    getReturns: vi.fn().mockResolvedValue({ data: { returns: [] } }),
    getStats: vi.fn().mockResolvedValue({ data: { pending: 0, rejected: 0, completed: 0, total: 0, totalRefundAmount: 0 } }),
    approveReturn: vi.fn().mockResolvedValue({ data: {} }),
    rejectReturn: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

vi.mock('@/lib/auth', () => ({
  getAuth: vi.fn().mockReturnValue({ user: { role: 'OWNER' } }),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('useReturnsStore', () => {
  beforeEach(() => {
    useReturnsStore.setState({
      returns: [],
      stats: null,
      loading: true,
      processing: false,
      modal: {
        type: null,
        selectedReturn: null,
        notes: '',
      },
    });
  });

  it('should initialize with default state', () => {
    const state = useReturnsStore.getState();
    expect(state.returns).toEqual([]);
    expect(state.stats).toBeNull();
    expect(state.loading).toBe(true);
    expect(state.processing).toBe(false);
    expect(state.modal.type).toBeNull();
    expect(state.modal.selectedReturn).toBeNull();
  });

  it('should set loading state', () => {
    useReturnsStore.getState().setLoading(false);
    expect(useReturnsStore.getState().loading).toBe(false);
  });

  it('should set processing state', () => {
    useReturnsStore.getState().setProcessing(true);
    expect(useReturnsStore.getState().processing).toBe(true);
  });

  it('should set modal notes', () => {
    useReturnsStore.getState().setModalNotes('Test notes');
    expect(useReturnsStore.getState().modal.notes).toBe('Test notes');
  });

  it('should open and close modal', () => {
    const mockReturn: Return = {
      id: 'r1',
      returnNo: 'RTN-001',
      status: 'PENDING',
      reason: 'Defect',
      notes: '',
      createdAt: '2024-01-01',
      subtotal: 10000,
      refundAmount: 10000,
      refundMethod: 'CASH',
      approvedBy: null,
      approvedAt: null,
      returnType: 'REFUND',
      transaction: { 
        transactionNo: 'TRX-001', 
        customerName: 'John', 
        customerPhone: null, 
        paymentMethod: 'CASH', 
        total: 10000, 
        createdAt: '2024-01-01' 
      },
      cabang: { id: 'c1', name: 'Branch 1' },
      processedBy: { id: 'u1', name: 'User 1', role: 'KASIR' },
      items: [],
    };

    // Open detail modal
    useReturnsStore.getState().openModal('detail', mockReturn);
    expect(useReturnsStore.getState().modal.type).toBe('detail');
    expect(useReturnsStore.getState().modal.selectedReturn?.id).toBe('r1');

    // Close modal
    useReturnsStore.getState().closeModal();
    expect(useReturnsStore.getState().modal.type).toBeNull();
    expect(useReturnsStore.getState().modal.selectedReturn).toBeNull();
  });

  it('should open approve modal', () => {
    const mockReturn: Return = {
      id: 'r1',
      returnNo: 'RTN-001',
      status: 'PENDING',
      reason: 'Defect',
      notes: '',
      createdAt: '2024-01-01',
      subtotal: 10000,
      refundAmount: 10000,
      refundMethod: 'CASH',
      approvedBy: null,
      approvedAt: null,
      returnType: 'REFUND',
      transaction: { 
        transactionNo: 'TRX-001', 
        customerName: 'John', 
        customerPhone: null, 
        paymentMethod: 'CASH', 
        total: 10000, 
        createdAt: '2024-01-01' 
      },
      cabang: { id: 'c1', name: 'Branch 1' },
      processedBy: { id: 'u1', name: 'User 1', role: 'KASIR' },
      items: [],
    };

    useReturnsStore.getState().openModal('approve', mockReturn);
    expect(useReturnsStore.getState().modal.type).toBe('approve');
    expect(useReturnsStore.getState().modal.notes).toBe('');
  });

  it('should open reject modal', () => {
    const mockReturn: Return = {
      id: 'r1',
      returnNo: 'RTN-001',
      status: 'PENDING',
      reason: 'Defect',
      notes: '',
      createdAt: '2024-01-01',
      subtotal: 10000,
      refundAmount: 10000,
      refundMethod: 'CASH',
      approvedBy: null,
      approvedAt: null,
      returnType: 'REFUND',
      transaction: { 
        transactionNo: 'TRX-001', 
        customerName: 'John', 
        customerPhone: null, 
        paymentMethod: 'CASH', 
        total: 10000, 
        createdAt: '2024-01-01' 
      },
      cabang: { id: 'c1', name: 'Branch 1' },
      processedBy: { id: 'u1', name: 'User 1', role: 'KASIR' },
      items: [],
    };

    useReturnsStore.getState().openModal('reject', mockReturn);
    expect(useReturnsStore.getState().modal.type).toBe('reject');
  });

  it('should set returns array', () => {
    const mockReturns = [
      { id: 'r1', returnNo: 'RTN-001' },
      { id: 'r2', returnNo: 'RTN-002' },
    ] as Return[];

    useReturnsStore.getState().setReturns(mockReturns);
    expect(useReturnsStore.getState().returns).toHaveLength(2);
  });

  it('should set stats', () => {
    const mockStats = {
      pending: 5,
      rejected: 2,
      completed: 10,
      total: 17,
      totalRefundAmount: 500000,
    };

    useReturnsStore.getState().setStats(mockStats);
    expect(useReturnsStore.getState().stats).toEqual(mockStats);
  });
});
