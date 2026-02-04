import { create } from 'zustand';
import { cabangAPI } from '@/lib/api';
import { logger } from '@/lib/logger';

export interface Cabang {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  isActive: boolean;
  createdAt?: string;
  _count?: { 
    users: number;
    stocks?: number;
    transactions?: number;
  };
}

interface CabangForm {
  name: string;
  address: string;
  phone: string;
}

interface CabangState {
  // Data
  cabangs: Cabang[];
  
  // Filters
  searchTerm: string;
  showInactive: boolean;
  
  // UI State
  loading: boolean;
  submitting: boolean;
  
  // Form
  formData: CabangForm;
  editingCabangId: string | null;
  showModal: boolean;
  
  // Actions
  setCabangs: (cabangs: Cabang[]) => void;
  setSearchTerm: (term: string) => void;
  setShowInactive: (show: boolean) => void;
  setLoading: (loading: boolean) => void;
  setSubmitting: (submitting: boolean) => void;
  setShowModal: (show: boolean) => void;
  
  // Form actions
  setFormData: (data: Partial<CabangForm>) => void;
  resetForm: () => void;
  setEditingCabang: (cabang: Cabang | null) => void;
  
  // API actions
  fetchCabangs: () => Promise<void>;
  createCabang: (data: CabangForm) => Promise<boolean>;
  updateCabang: (id: string, data: Partial<CabangForm>) => Promise<boolean>;
  toggleCabangStatus: (id: string, isActive: boolean) => Promise<boolean>;
  deleteCabang: (id: string) => Promise<boolean>;
  
  // Computed
  getFilteredCabangs: () => Cabang[];
}

const defaultForm: CabangForm = {
  name: '',
  address: '',
  phone: '',
};

export const useCabangStore = create<CabangState>()((set, get) => ({
  // Initial data
  cabangs: [],
  
  // Initial filters
  searchTerm: '',
  showInactive: false,
  
  // Initial UI state
  loading: true,
  submitting: false,
  
  // Form
  formData: defaultForm,
  editingCabangId: null,
  showModal: false,
  
  // Setters
  setCabangs: (cabangs) => set({ cabangs }),
  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setShowInactive: (showInactive) => set({ showInactive }),
  setLoading: (loading) => set({ loading }),
  setSubmitting: (submitting) => set({ submitting }),
  setShowModal: (showModal) => set({ showModal }),
  
  // Form actions
  setFormData: (data) => set((state) => ({
    formData: { ...state.formData, ...data }
  })),
  
  resetForm: () => set({ formData: defaultForm, editingCabangId: null }),
  
  setEditingCabang: (cabang) => {
    if (cabang) {
      set({
        editingCabangId: cabang.id,
        formData: {
          name: cabang.name,
          address: cabang.address || '',
          phone: cabang.phone || '',
        }
      });
    } else {
      get().resetForm();
    }
  },
  
  // API actions
  fetchCabangs: async () => {
    set({ loading: true });
    try {
      const res = await cabangAPI.getCabangs();
      set({ cabangs: res.data, loading: false });
    } catch (error) {
      logger.error('Error fetching cabangs:', error);
      set({ loading: false });
    }
  },
  
  createCabang: async (data) => {
    set({ submitting: true });
    try {
      await cabangAPI.createCabang(data);
      set({ submitting: false });
      get().fetchCabangs();
      get().resetForm();
      return true;
    } catch (error) {
      logger.error('Error creating cabang:', error);
      set({ submitting: false });
      return false;
    }
  },
  
  updateCabang: async (id, data) => {
    set({ submitting: true });
    try {
      await cabangAPI.updateCabang(id, data);
      set({ submitting: false });
      get().fetchCabangs();
      get().resetForm();
      return true;
    } catch (error) {
      logger.error('Error updating cabang:', error);
      set({ submitting: false });
      return false;
    }
  },
  
  toggleCabangStatus: async (id, isActive) => {
    try {
      await cabangAPI.updateCabang(id, { isActive });
      get().fetchCabangs();
      return true;
    } catch (error) {
      logger.error('Error toggling cabang status:', error);
      return false;
    }
  },
  
  deleteCabang: async (id) => {
    set({ submitting: true });
    try {
      await cabangAPI.deleteCabang(id);
      set({ submitting: false });
      get().fetchCabangs();
      return true;
    } catch (error) {
      logger.error('Error deleting cabang:', error);
      set({ submitting: false });
      return false;
    }
  },
  
  // Computed
  getFilteredCabangs: () => {
    const { cabangs, searchTerm, showInactive } = get();
    return cabangs.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.address || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = showInactive || c.isActive;
      return matchesSearch && matchesStatus;
    });
  },
}));

