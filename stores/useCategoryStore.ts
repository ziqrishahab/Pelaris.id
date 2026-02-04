import { create } from 'zustand';
import { categoriesAPI } from '@/lib/api';
import { logger } from '@/lib/logger';

interface Category {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  _count?: { products: number };
}

interface CategoryForm {
  name: string;
  description: string;
}

interface CategoryState {
  // Data
  categories: Category[];
  
  // Filters
  searchTerm: string;
  showInactive: boolean;
  
  // UI State
  loading: boolean;
  submitting: boolean;
  
  // Form
  formData: CategoryForm;
  editingCategoryId: string | null;
  showModal: boolean;
  
  // Actions
  setCategories: (categories: Category[]) => void;
  setSearchTerm: (term: string) => void;
  setShowInactive: (show: boolean) => void;
  setLoading: (loading: boolean) => void;
  setSubmitting: (submitting: boolean) => void;
  setShowModal: (show: boolean) => void;
  
  // Form actions
  setFormData: (data: Partial<CategoryForm>) => void;
  resetForm: () => void;
  setEditingCategory: (category: Category | null) => void;
  
  // API actions
  fetchCategories: () => Promise<void>;
  createCategory: (data: CategoryForm) => Promise<boolean>;
  updateCategory: (id: string, data: Partial<CategoryForm>) => Promise<boolean>;
  toggleCategoryStatus: (id: string, isActive: boolean) => Promise<boolean>;
  deleteCategory: (id: string) => Promise<boolean>;
  
  // Computed
  getFilteredCategories: () => Category[];
}

const defaultForm: CategoryForm = {
  name: '',
  description: '',
};

export const useCategoryStore = create<CategoryState>()((set, get) => ({
  // Initial data
  categories: [],
  
  // Initial filters
  searchTerm: '',
  showInactive: false,
  
  // Initial UI state
  loading: true,
  submitting: false,
  
  // Form
  formData: defaultForm,
  editingCategoryId: null,
  showModal: false,
  
  // Setters
  setCategories: (categories) => set({ categories }),
  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setShowInactive: (showInactive) => set({ showInactive }),
  setLoading: (loading) => set({ loading }),
  setSubmitting: (submitting) => set({ submitting }),
  setShowModal: (showModal) => set({ showModal }),
  
  // Form actions
  setFormData: (data) => set((state) => ({
    formData: { ...state.formData, ...data }
  })),
  
  resetForm: () => set({ formData: defaultForm, editingCategoryId: null }),
  
  setEditingCategory: (category) => {
    if (category) {
      set({
        editingCategoryId: category.id,
        formData: {
          name: category.name,
          description: category.description || '',
        }
      });
    } else {
      get().resetForm();
    }
  },
  
  // API actions
  fetchCategories: async () => {
    set({ loading: true });
    try {
      const res = await categoriesAPI.getCategories();
      set({ categories: res.data, loading: false });
    } catch (error) {
      logger.error('Error fetching categories:', error);
      set({ loading: false });
    }
  },
  
  createCategory: async (data) => {
    set({ submitting: true });
    try {
      await categoriesAPI.createCategory(data);
      set({ submitting: false });
      get().fetchCategories();
      get().resetForm();
      return true;
    } catch (error) {
      logger.error('Error creating category:', error);
      set({ submitting: false });
      return false;
    }
  },
  
  updateCategory: async (id, data) => {
    set({ submitting: true });
    try {
      await categoriesAPI.updateCategory(id, data);
      set({ submitting: false });
      get().fetchCategories();
      get().resetForm();
      return true;
    } catch (error) {
      logger.error('Error updating category:', error);
      set({ submitting: false });
      return false;
    }
  },
  
  toggleCategoryStatus: async (id, isActive) => {
    try {
      await categoriesAPI.updateCategory(id, { isActive });
      get().fetchCategories();
      return true;
    } catch (error) {
      logger.error('Error toggling category status:', error);
      return false;
    }
  },
  
  deleteCategory: async (id) => {
    set({ submitting: true });
    try {
      await categoriesAPI.deleteCategory(id);
      set({ submitting: false });
      get().fetchCategories();
      return true;
    } catch (error) {
      logger.error('Error deleting category:', error);
      set({ submitting: false });
      return false;
    }
  },
  
  // Computed
  getFilteredCategories: () => {
    const { categories, searchTerm, showInactive } = get();
    return categories.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = showInactive || c.isActive;
      return matchesSearch && matchesStatus;
    });
  },
}));

