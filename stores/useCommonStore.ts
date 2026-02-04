import { create } from 'zustand';
import { cabangAPI, productsAPI, settingsAPI } from '@/lib/api';

interface Branch {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  isActive: boolean;
}

interface Category {
  id: string;
  name: string;
}

interface CommonState {
  // Data
  branches: Branch[];
  categories: Category[];
  adminWhatsApp: string;
  
  // Loading states
  loadingBranches: boolean;
  loadingCategories: boolean;
  loadingSettings: boolean;
  
  // Error states
  errorBranches: string | null;
  errorCategories: string | null;
  errorSettings: string | null;
  
  // Actions
  fetchBranches: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchSettings: () => Promise<void>;
  fetchAll: () => Promise<void>;
  
  // Setters
  setBranches: (branches: Branch[]) => void;
  setCategories: (categories: Category[]) => void;
  
  // Getters
  getBranchById: (id: string) => Branch | undefined;
  getCategoryById: (id: string) => Category | undefined;
  getActiveBranches: () => Branch[];
}

export const useCommonStore = create<CommonState>()((set, get) => ({
  // Initial data
  branches: [],
  categories: [],
  adminWhatsApp: '',
  
  // Initial loading states
  loadingBranches: false,
  loadingCategories: false,
  loadingSettings: false,
  
  // Initial error states
  errorBranches: null,
  errorCategories: null,
  errorSettings: null,
  
  // Fetch branches
  fetchBranches: async () => {
    set({ loadingBranches: true, errorBranches: null });
    try {
      const res = await cabangAPI.getCabangs();
      set({ branches: res.data, loadingBranches: false });
    } catch (error: any) {
      set({ 
        errorBranches: error.message || 'Failed to fetch branches',
        loadingBranches: false 
      });
    }
  },
  
  // Fetch categories
  fetchCategories: async () => {
    set({ loadingCategories: true, errorCategories: null });
    try {
      const res = await productsAPI.getCategories();
      set({ categories: res.data, loadingCategories: false });
    } catch (error: any) {
      set({ 
        errorCategories: error.message || 'Failed to fetch categories',
        loadingCategories: false 
      });
    }
  },
  
  // Fetch settings
  fetchSettings: async () => {
    set({ loadingSettings: true, errorSettings: null });
    try {
      const res = await settingsAPI.getSettings();
      set({ 
        adminWhatsApp: res.data.adminWhatsApp || '',
        loadingSettings: false 
      });
    } catch (error: any) {
      set({ 
        errorSettings: error.message || 'Failed to fetch settings',
        loadingSettings: false 
      });
    }
  },
  
  // Fetch all common data
  fetchAll: async () => {
    await Promise.all([
      get().fetchBranches(),
      get().fetchCategories(),
      get().fetchSettings(),
    ]);
  },
  
  // Setters
  setBranches: (branches) => set({ branches }),
  setCategories: (categories) => set({ categories }),
  
  // Getters
  getBranchById: (id) => get().branches.find(b => b.id === id),
  getCategoryById: (id) => get().categories.find(c => c.id === id),
  getActiveBranches: () => get().branches.filter(b => b.isActive),
}));

