import { create } from 'zustand';
import { stockTransfersAPI, cabangAPI, productsAPI } from '@/lib/api';
import { logger } from '@/lib/logger';

interface Cabang {
  id: string;
  name: string;
  isActive: boolean;
}

interface Product {
  id: string;
  name: string;
  variants: Array<{
    id: string;
    variantName: string;
    variantValue: string;
    sku: string;
    stocks: Array<{
      cabangId: string;
      quantity: number;
    }>;
  }>;
}

interface Stats {
  total: number;
  completed: number;
  pending: number;
  totalQuantity: number;
}

interface TransferState {
  // Data - transfers is any[] to support varying API response structures
  transfers: any[];
  cabangs: Cabang[];
  products: Product[];
  stats: Stats | null;
  
  // Filters
  searchTerm: string;
  statusFilter: string;
  cabangFilter: string;
  fromCabangFilter: string;
  toCabangFilter: string;
  dateFrom: string;
  dateTo: string;
  
  // UI State
  loading: boolean;
  submitting: boolean;
  actionLoading: string | null;
  
  // Create Modal State
  showCreateModal: boolean;
  createLoading: boolean;
  searchProduct: string;
  selectedProduct: Product | null;
  selectedVariant: string;
  fromCabang: string;
  toCabang: string;
  quantity: number;
  notes: string;
  
  // Actions - Setters
  setTransfers: (transfers: any[]) => void;
  setCabangs: (cabangs: Cabang[]) => void;
  setProducts: (products: Product[]) => void;
  setStats: (stats: Stats | null) => void;
  setSearchTerm: (term: string) => void;
  setStatusFilter: (status: string) => void;
  setCabangFilter: (cabangId: string) => void;
  setFromCabangFilter: (cabangId: string) => void;
  setToCabangFilter: (cabangId: string) => void;
  setDateFrom: (date: string) => void;
  setDateTo: (date: string) => void;
  setLoading: (loading: boolean) => void;
  setSubmitting: (submitting: boolean) => void;
  setActionLoading: (id: string | null) => void;
  
  // Create modal actions
  setShowCreateModal: (show: boolean) => void;
  setSearchProduct: (search: string) => void;
  setSelectedProduct: (product: Product | null) => void;
  setSelectedVariant: (variantId: string) => void;
  setFromCabang: (cabangId: string) => void;
  setToCabang: (cabangId: string) => void;
  setQuantity: (qty: number) => void;
  setNotes: (notes: string) => void;
  resetCreateForm: () => void;
  
  // API actions
  fetchData: () => Promise<void>;
  fetchTransfers: (filters?: any) => Promise<void>;
  fetchCabangs: () => Promise<void>;
  fetchProducts: (search: string) => Promise<void>;
  createTransfer: (data: any) => Promise<boolean>;
  approveTransfer: (id: string) => Promise<boolean>;
  rejectTransfer: (id: string) => Promise<boolean>;
  updateTransferStatus: (id: string, status: string) => Promise<boolean>;
}

export const useTransferStore = create<TransferState>()((set, get) => ({
  // Initial data
  transfers: [],
  cabangs: [],
  products: [],
  stats: null,
  
  // Initial filters
  searchTerm: '',
  statusFilter: 'ALL',
  cabangFilter: '',
  fromCabangFilter: '',
  toCabangFilter: '',
  dateFrom: '',
  dateTo: '',
  
  // Initial UI state
  loading: true,
  submitting: false,
  actionLoading: null,
  
  // Create modal initial state
  showCreateModal: false,
  createLoading: false,
  searchProduct: '',
  selectedProduct: null,
  selectedVariant: '',
  fromCabang: '',
  toCabang: '',
  quantity: 1,
  notes: '',
  
  // Setters
  setTransfers: (transfers) => set({ transfers }),
  setCabangs: (cabangs) => set({ cabangs }),
  setProducts: (products) => set({ products }),
  setStats: (stats) => set({ stats }),
  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setCabangFilter: (cabangFilter) => set({ cabangFilter }),
  setFromCabangFilter: (fromCabangFilter) => set({ fromCabangFilter }),
  setToCabangFilter: (toCabangFilter) => set({ toCabangFilter }),
  setDateFrom: (dateFrom) => set({ dateFrom }),
  setDateTo: (dateTo) => set({ dateTo }),
  setLoading: (loading) => set({ loading }),
  setSubmitting: (submitting) => set({ submitting }),
  setActionLoading: (actionLoading) => set({ actionLoading }),
  
  // Create modal setters
  setShowCreateModal: (showCreateModal) => set({ showCreateModal }),
  setSearchProduct: (searchProduct) => set({ searchProduct }),
  setSelectedProduct: (selectedProduct) => set({ selectedProduct }),
  setSelectedVariant: (selectedVariant) => set({ selectedVariant }),
  setFromCabang: (fromCabang) => set({ fromCabang }),
  setToCabang: (toCabang) => set({ toCabang }),
  setQuantity: (quantity) => set({ quantity }),
  setNotes: (notes) => set({ notes }),
  resetCreateForm: () => set({
    searchProduct: '',
    selectedProduct: null,
    selectedVariant: '',
    fromCabang: '',
    toCabang: '',
    quantity: 1,
    notes: '',
    products: [],
  }),
  
  // API actions
  fetchData: async () => {
    const { statusFilter, cabangFilter } = get();
    set({ loading: true });
    try {
      const params: any = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (cabangFilter) params.cabangId = cabangFilter;
      
      const [transfersRes, statsRes, branchesRes] = await Promise.all([
        stockTransfersAPI.getTransfers(params),
        stockTransfersAPI.getStats(),
        cabangAPI.getCabangs(),
      ]);
      
      set({
        transfers: transfersRes.data,
        stats: statsRes.data,
        cabangs: branchesRes.data.filter((b: Cabang) => b.isActive),
        loading: false,
      });
    } catch (error) {
      logger.error('Error fetching data:', error);
      set({ loading: false });
    }
  },
  
  fetchTransfers: async (filters = {}) => {
    set({ loading: true });
    try {
      const { statusFilter, fromCabangFilter, toCabangFilter, dateFrom, dateTo, searchTerm } = get();
      const queryFilters = {
        ...filters,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        fromCabangId: fromCabangFilter || undefined,
        toCabangId: toCabangFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        search: searchTerm || undefined,
      };
      const res = await stockTransfersAPI.getTransfers(queryFilters);
      set({ transfers: res.data, loading: false });
    } catch (error) {
      logger.error('Error fetching transfers:', error);
      set({ loading: false });
    }
  },
  
  fetchCabangs: async () => {
    try {
      const res = await cabangAPI.getCabangs();
      set({ cabangs: res.data.filter((c: Cabang) => c.isActive) });
    } catch (error) {
      logger.error('Error fetching cabangs:', error);
    }
  },
  
  fetchProducts: async (search: string) => {
    if (!search || search.length < 2) {
      set({ products: [] });
      return;
    }
    try {
      const res = await productsAPI.getProducts({ search, isActive: true });
      // Handle paginated response: { data: [...], pagination: {...} }
      const productsData = res.data.data || res.data;
      set({ products: productsData });
    } catch (error) {
      logger.error('Error fetching products:', error);
    }
  },
  
  createTransfer: async (data) => {
    set({ createLoading: true });
    try {
      await stockTransfersAPI.createTransfer(data);
      set({ createLoading: false, showCreateModal: false });
      get().resetCreateForm();
      get().fetchData();
      return true;
    } catch (error) {
      logger.error('Error creating transfer:', error);
      set({ createLoading: false });
      return false;
    }
  },
  
  approveTransfer: async (id: string) => {
    set({ actionLoading: id });
    try {
      await stockTransfersAPI.approveTransfer(id);
      set({ actionLoading: null });
      get().fetchData();
      return true;
    } catch (error) {
      logger.error('Error approving transfer:', error);
      set({ actionLoading: null });
      return false;
    }
  },
  
  rejectTransfer: async (id: string) => {
    set({ actionLoading: id });
    try {
      await stockTransfersAPI.rejectTransfer(id);
      set({ actionLoading: null });
      get().fetchData();
      return true;
    } catch (error) {
      logger.error('Error rejecting transfer:', error);
      set({ actionLoading: null });
      return false;
    }
  },
  
  updateTransferStatus: async (id, status) => {
    set({ submitting: true });
    try {
      // Use approve or reject based on status
      if (status === 'COMPLETED' || status === 'APPROVED') {
        await stockTransfersAPI.approveTransfer(id);
      } else if (status === 'CANCELLED' || status === 'REJECTED') {
        await stockTransfersAPI.rejectTransfer(id);
      }
      set({ submitting: false });
      get().fetchTransfers();
      return true;
    } catch (error) {
      logger.error('Error updating transfer status:', error);
      set({ submitting: false });
      return false;
    }
  },
}));

