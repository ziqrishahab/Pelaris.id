import { create } from 'zustand';
import { returnsAPI } from '@/lib/api';
import { getAuth } from '@/lib/auth';
import { logger } from '@/lib/logger';

// Types
export interface ReturnItem {
  id: string;
  productName: string;
  variantInfo: string;
  sku: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface ExchangeItem {
  id: string;
  productName: string;
  variantInfo: string;
  sku: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Return {
  id: string;
  returnNo: string;
  createdAt: string;
  status: 'PENDING' | 'REJECTED' | 'COMPLETED';
  reason: string;
  reasonDetail?: string;
  notes: string;
  photoUrls?: string[];
  conditionNote?: string;
  subtotal: number;
  refundAmount: number;
  refundMethod: string;
  approvedBy: string | null;
  approvedAt: string | null;
  isOverdue?: boolean;
  managerOverride?: boolean;
  returnType: 'REFUND' | 'EXCHANGE';
  priceDifference?: number | null;
  transaction: {
    transactionNo: string;
    customerName: string | null;
    customerPhone: string | null;
    paymentMethod: string;
    total: number;
    createdAt: string;
  };
  cabang: {
    id: string;
    name: string;
  };
  processedBy: {
    id: string;
    name: string;
    role: string;
  };
  items: ReturnItem[];
  exchangeItems?: ExchangeItem[];
}

export interface Stats {
  pending: number;
  rejected: number;
  completed: number;
  total: number;
  totalRefundAmount: number;
}

// Simplified modal state
interface ModalState {
  type: 'detail' | 'approve' | 'reject' | null;
  selectedReturn: Return | null;
  notes: string;
}

interface ReturnsState {
  // Data
  returns: Return[];
  stats: Stats | null;
  loading: boolean;
  processing: boolean;
  
  // Simplified modal state
  modal: ModalState;
  
  // Actions - Setters
  setReturns: (returns: Return[]) => void;
  setStats: (stats: Stats | null) => void;
  setLoading: (loading: boolean) => void;
  setProcessing: (processing: boolean) => void;
  
  // Actions - Fetch
  fetchReturns: (filters: { status?: string; search?: string; startDate?: string; endDate?: string }) => Promise<void>;
  fetchStats: () => Promise<void>;
  
  // Actions - Business logic
  handleApprove: () => Promise<{ success: boolean; message: string }>;
  handleReject: () => Promise<{ success: boolean; message: string }>;
  
  // Actions - Modal helpers (simplified)
  openModal: (type: 'detail' | 'approve' | 'reject', ret: Return) => void;
  closeModal: () => void;
  setModalNotes: (notes: string) => void;
}

export const useReturnsStore = create<ReturnsState>()((set, get) => ({
  // Initial data
  returns: [],
  stats: null,
  loading: true,
  processing: false,
  
  // Initial modal state
  modal: {
    type: null,
    selectedReturn: null,
    notes: '',
  },
  
  // Setters
  setReturns: (returns) => set({ returns }),
  setStats: (stats) => set({ stats }),
  setLoading: (loading) => set({ loading }),
  setProcessing: (processing) => set({ processing }),
  
  // Fetch actions
  fetchReturns: async (filters) => {
    try {
      set({ loading: true });
      const params: any = {};
      if (filters.status && filters.status !== 'ALL') params.status = filters.status;
      if (filters.search) params.search = filters.search;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      
      const response = await returnsAPI.getReturns(params);
      set({ returns: response.data.returns });
    } catch (error) {
      logger.error('Failed to fetch returns:', error);
    } finally {
      set({ loading: false });
    }
  },
  
  fetchStats: async () => {
    try {
      const response = await returnsAPI.getStats();
      set({ stats: response.data });
    } catch (error) {
      // Stats fetch failed - UI will handle gracefully
    }
  },
  
  // Business logic
  handleApprove: async () => {
    const { modal } = get();
    if (!modal.selectedReturn) return { success: false, message: 'No return selected' };
    
    const { user } = getAuth();
    if (!user) {
      return { success: false, message: 'User tidak terautentikasi' };
    }
    
    try {
      set({ processing: true });
      await returnsAPI.approveReturn(modal.selectedReturn.id, {
        approvedBy: user.id,
        notes: modal.notes
      });
      
      set({ 
        modal: { type: null, selectedReturn: null, notes: '' }
      });
      
      return { success: true, message: 'Return berhasil disetujui!' };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.response?.data?.error || 'Gagal menyetujui return' 
      };
    } finally {
      set({ processing: false });
    }
  },
  
  handleReject: async () => {
    const { modal } = get();
    if (!modal.selectedReturn) return { success: false, message: 'No return selected' };
    
    const { user } = getAuth();
    if (!user) {
      return { success: false, message: 'User tidak terautentikasi' };
    }
    
    try {
      set({ processing: true });
      await returnsAPI.rejectReturn(modal.selectedReturn.id, {
        rejectedBy: user.id,
        rejectionNotes: modal.notes
      });
      
      set({ 
        modal: { type: null, selectedReturn: null, notes: '' }
      });
      
      return { success: true, message: 'Return berhasil ditolak' };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.response?.data?.error || 'Gagal menolak return' 
      };
    } finally {
      set({ processing: false });
    }
  },
  
  // Simplified modal helpers
  openModal: (type, ret) => {
    set({
      modal: {
        type,
        selectedReturn: ret,
        notes: '',
      },
    });
  },
  
  closeModal: () => {
    set({
      modal: {
        type: null,
        selectedReturn: null,
        notes: '',
      },
    });
  },
  
  setModalNotes: (notes) => {
    set((state) => ({
      modal: {
        ...state.modal,
        notes,
      },
    }));
  },
}));

