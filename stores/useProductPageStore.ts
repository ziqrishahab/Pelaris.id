import { create } from 'zustand';
import { productsAPI, cabangAPI } from '@/lib/api';
import { logger } from '@/lib/logger';
import { getAuth } from '@/lib/auth';

interface Stock {
  id: string;
  quantity: number;
  price: number;
  cabangId: string;
  cabang: { id: string; name: string };
}

interface Variant {
  id: string;
  sku: string;
  variantName: string;
  variantValue: string;
  stocks: Stock[];
}

interface Category {
  id: string;
  name: string;
  _count?: { products: number };
}

interface Cabang {
  id: string;
  name: string;
  isActive: boolean;
}

interface Product {
  id: string;
  name: string;
  productType: string;
  isActive: boolean;
  description?: string;
  category: Category;
  variants: Variant[];
}

interface EditingStock {
  variantId: string;
  cabangId: string;
  currentQty: number;
  position: { x: number; y: number };
}

interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  details?: any;
}

interface ProductPageState {
  // Data
  products: Product[];
  categories: Category[];
  cabangs: Cabang[];
  
  // Filters
  search: string;
  selectedCategory: string;
  
  // Selection
  selectedProducts: string[];
  
  // UI State
  loading: boolean;
  deleting: boolean;
  activeTab: 'products' | 'import-export';
  
  // Variant modal
  variantModal: { isOpen: boolean; product: Product | null };
  
  // Inline stock editing
  editingStock: EditingStock | null;
  newStockQty: string;
  adjustmentReason: string;
  savingStock: boolean;
  
  // Import/Export
  importFile: File | null;
  importing: boolean;
  exporting: boolean;
  importResult: ImportResult | null;
  
  // Actions
  setProducts: (products: Product[]) => void;
  setCategories: (categories: Category[]) => void;
  setCabangs: (cabangs: Cabang[]) => void;
  setSearch: (search: string) => void;
  setSelectedCategory: (categoryId: string) => void;
  setSelectedProducts: (ids: string[]) => void;
  setLoading: (loading: boolean) => void;
  setDeleting: (deleting: boolean) => void;
  setActiveTab: (tab: 'products' | 'import-export') => void;
  
  // Selection actions
  handleSelectAll: (checked: boolean) => void;
  handleSelectProduct: (productId: string, checked: boolean) => void;
  
  // Variant modal actions
  openVariantModal: (product: Product) => void;
  closeVariantModal: () => void;
  
  // Stock editing actions
  startEditingStock: (variantId: string, cabangId: string, currentQty: number, position: { x: number; y: number }) => void;
  setNewStockQty: (qty: string) => void;
  setAdjustmentReason: (reason: string) => void;
  cancelEditingStock: () => void;
  saveStock: () => Promise<boolean>;
  
  // Import/Export actions
  setImportFile: (file: File | null) => void;
  setImportResult: (result: ImportResult | null) => void;
  importProducts: () => Promise<boolean>;
  exportProducts: () => Promise<boolean>;
  downloadTemplate: () => Promise<void>;
  
  // API actions
  fetchData: () => Promise<void>;
  fetchDataSilent: () => Promise<void>;
  bulkDeleteProducts: () => Promise<boolean>;
}

export const useProductPageStore = create<ProductPageState>()((set, get) => ({
  // Initial data
  products: [],
  categories: [],
  cabangs: [],
  
  // Initial filters
  search: '',
  selectedCategory: '',
  
  // Selection
  selectedProducts: [],
  
  // UI State
  loading: true,
  deleting: false,
  activeTab: 'products',
  
  // Variant modal
  variantModal: { isOpen: false, product: null },
  
  // Stock editing
  editingStock: null,
  newStockQty: '',
  adjustmentReason: '',
  savingStock: false,
  
  // Import/Export
  importFile: null,
  importing: false,
  exporting: false,
  importResult: null,
  
  // Setters
  setProducts: (products) => set({ products }),
  setCategories: (categories) => set({ categories }),
  setCabangs: (cabangs) => set({ cabangs }),
  setSearch: (search) => set({ search }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
  setSelectedProducts: (selectedProducts) => set({ selectedProducts }),
  setLoading: (loading) => set({ loading }),
  setDeleting: (deleting) => set({ deleting }),
  setActiveTab: (activeTab) => set({ activeTab }),
  
  // Selection actions
  handleSelectAll: (checked) => {
    const { products } = get();
    set({ selectedProducts: checked ? products.map(p => p.id) : [] });
  },
  
  handleSelectProduct: (productId, checked) => {
    const { selectedProducts } = get();
    set({
      selectedProducts: checked
        ? [...selectedProducts, productId]
        : selectedProducts.filter(id => id !== productId)
    });
  },
  
  // Variant modal actions
  openVariantModal: (product) => set({ variantModal: { isOpen: true, product } }),
  closeVariantModal: () => set({ variantModal: { isOpen: false, product: null } }),
  
  // Stock editing actions
  startEditingStock: (variantId, cabangId, currentQty, position) => set({
    editingStock: { variantId, cabangId, currentQty, position },
    newStockQty: currentQty.toString(),
    adjustmentReason: '',
  }),
  
  setNewStockQty: (newStockQty) => set({ newStockQty }),
  setAdjustmentReason: (adjustmentReason) => set({ adjustmentReason }),
  
  cancelEditingStock: () => set({
    editingStock: null,
    newStockQty: '',
    adjustmentReason: '',
  }),
  
  saveStock: async () => {
    const { editingStock, newStockQty, adjustmentReason, products } = get();
    if (!editingStock) return false;
    
    const qty = parseInt(newStockQty);
    if (isNaN(qty) || qty < 0) return false;
    
    set({ savingStock: true });
    try {
      await productsAPI.updateStock(
        editingStock.variantId,
        editingStock.cabangId,
        {
          quantity: qty,
          reason: adjustmentReason || undefined,
        }
      );
      
      // Update local state
      set({
        products: products.map(product => ({
          ...product,
          variants: product.variants?.map((variant) =>
            variant.id === editingStock.variantId
              ? {
                  ...variant,
                  stocks: variant.stocks?.map((stock) =>
                    stock.cabangId === editingStock.cabangId
                      ? { ...stock, quantity: qty }
                      : stock
                  ),
                }
              : variant
          ),
        })),
        savingStock: false,
        editingStock: null,
        newStockQty: '',
        adjustmentReason: '',
      });
      return true;
    } catch (error) {
      logger.error('Error saving stock:', error);
      set({ savingStock: false });
      return false;
    }
  },
  
  // Import/Export actions
  setImportFile: (importFile) => set({ importFile }),
  setImportResult: (importResult) => set({ importResult }),
  
  importProducts: async () => {
    const { importFile } = get();
    if (!importFile) return false;
    
    set({ importing: true, importResult: null });
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      
      const response = await productsAPI.importProducts(formData);
      set({ importResult: response.data, importFile: null, importing: false });
      
      // Reset file input
      if (typeof document !== 'undefined') {
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
      
      if (response.data.success) {
        get().fetchData();
      }
      return response.data.success;
    } catch (error: any) {
      set({
        importResult: {
          success: false,
          imported: 0,
          failed: 0,
          details: { success: [], errors: [{ error: error.response?.data?.error || 'Gagal import produk' }] },
        },
        importing: false,
      });
      return false;
    }
  },
  
  exportProducts: async () => {
    set({ exporting: true });
    try {
      const { token } = getAuth();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5100/api';
      
      const response = await fetch(`${apiUrl}/products/export`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include', // Include cookies for HttpOnly auth
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }
      
      const result = await response.json();
      const binaryString = atob(result.data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const blob = new Blob([bytes], { type: result.mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (error: any) {
      logger.error('Export error:', error);
      throw error;
    } finally {
      set({ exporting: false });
    }
  },
  
  downloadTemplate: async () => {
    try {
      const { token } = getAuth();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5100/api';
      
      const response = await fetch(`${apiUrl}/products/template`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include', // Include cookies for HttpOnly auth
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.error('Template download failed:', response.status, errorData);
        throw new Error(errorData.error || `Download failed: ${response.status}`);
      }
      
      const result = await response.json();
      const binaryString = atob(result.data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const blob = new Blob([bytes], { type: result.mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      logger.error('Template download error:', error);
      throw error;
    }
  },
  
  // API actions
  fetchData: async () => {
    const { selectedCategory, search } = get();
    set({ loading: true });
    try {
      const [productsRes, categoriesRes, cabangsRes] = await Promise.all([
        productsAPI.getProducts({
          categoryId: selectedCategory || undefined,
          search: search || undefined,
          isActive: true,
        }),
        productsAPI.getCategories(),
        cabangAPI.getCabangs(),
      ]);
      
      // Backend returns { data: [...], pagination: {...} } for products
      const productsData = productsRes.data?.data || productsRes.data || [];
      const categoriesData = Array.isArray(categoriesRes.data) ? categoriesRes.data : [];
      const cabangsData = Array.isArray(cabangsRes.data) ? cabangsRes.data : [];
      
      set({
        products: Array.isArray(productsData) ? productsData : [],
        categories: categoriesData,
        cabangs: cabangsData.filter((c: Cabang) => c.isActive),
        selectedProducts: [],
        loading: false,
      });
    } catch (error) {
      logger.error('Error fetching data:', error);
      set({ products: [], categories: [], cabangs: [], loading: false });
    }
  },
  
  fetchDataSilent: async () => {
    const { selectedCategory, search } = get();
    try {
      const [productsRes, categoriesRes, cabangsRes] = await Promise.all([
        productsAPI.getProducts({
          categoryId: selectedCategory || undefined,
          search: search || undefined,
          isActive: true,
        }),
        productsAPI.getCategories(),
        cabangAPI.getCabangs(),
      ]);
      
      // Backend returns { data: [...], pagination: {...} } for products
      const productsData = productsRes.data?.data || productsRes.data || [];
      const categoriesData = Array.isArray(categoriesRes.data) ? categoriesRes.data : [];
      const cabangsData = Array.isArray(cabangsRes.data) ? cabangsRes.data : [];
      
      set({
        products: Array.isArray(productsData) ? productsData : [],
        categories: categoriesData,
        cabangs: cabangsData.filter((c: Cabang) => c.isActive),
      });
    } catch (error) {
      logger.error('Error fetching data:', error);
    }
  },
  
  bulkDeleteProducts: async () => {
    const { selectedProducts, products } = get();
    if (selectedProducts.length === 0) return false;
    
    set({ deleting: true });
    try {
      const response = await productsAPI.bulkDelete(selectedProducts);
      const result = response.data;
      
      // Get IDs that were successfully deleted or deactivated
      const successIds = result.details?.deletedIds || [];
      const deactivatedIds = result.details?.deactivatedIds || [];
      const allSuccessIds = [...successIds, ...deactivatedIds];
      
      set({
        products: products.filter(p => !allSuccessIds.includes(p.id)),
        selectedProducts: [],
        deleting: false,
      });
      
      // Return true if at least one product was processed
      return allSuccessIds.length > 0;
    } catch (error: any) {
      const errorMsg = error?.response?.data?.error || error?.message || 'Unknown error';
      logger.error('Error deleting products:', errorMsg);
      set({ deleting: false });
      return false;
    }
  },
}));

