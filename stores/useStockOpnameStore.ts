import { create } from 'zustand';
import { cabangAPI, productsAPI, stockAPI } from '@/lib/api';
import { logger } from '@/lib/logger';

interface Cabang {
  id: string;
  name: string;
  isActive: boolean;
}

interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  stocks: {
    id: string;
    quantity: number;
    cabangId: string;
  }[];
}

interface Product {
  id: string;
  name: string;
  category?: { id: string; name: string };
  variants: ProductVariant[];
}

interface OpnameItem {
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  systemQty: number;
  physicalQty: number | null;
  difference: number;
  status: 'pending' | 'counted' | 'adjusted';
}

interface StockOpnameState {
  // Data
  cabangs: Cabang[];
  products: Product[];
  opnameItems: OpnameItem[];
  
  // Selected values
  selectedCabang: string;
  
  // Filters
  search: string;
  filterStatus: 'all' | 'pending' | 'counted' | 'discrepancy';
  showOnlyDiscrepancy: boolean;
  
  // UI State
  loading: boolean;
  loadingProducts: boolean;
  submitting: string | null;
  successMessage: string | null;
  expandedProducts: Set<string>;
  
  // Computed stats
  getStats: () => {
    total: number;
    counted: number;
    pending: number;
    discrepancy: number;
    adjusted: number;
  };
  
  // Actions
  setCabangs: (cabangs: Cabang[]) => void;
  setProducts: (products: Product[]) => void;
  setOpnameItems: (items: OpnameItem[]) => void;
  setSelectedCabang: (cabangId: string) => void;
  setSearch: (search: string) => void;
  setFilterStatus: (status: 'all' | 'pending' | 'counted' | 'discrepancy') => void;
  setShowOnlyDiscrepancy: (show: boolean) => void;
  setSubmitting: (variantId: string | null) => void;
  setSuccessMessage: (message: string | null) => void;
  toggleExpandedProduct: (productId: string) => void;
  
  // Opname item actions
  handlePhysicalQtyChange: (variantId: string, value: string) => void;
  handleQuickAdjust: (variantId: string, adjustment: number) => void;
  handleResetItem: (variantId: string) => void;
  handleSetToSystem: (variantId: string) => void;
  
  // API actions
  loadCabangs: () => Promise<void>;
  loadProducts: () => Promise<void>;
  submitAdjustment: (item: OpnameItem) => Promise<boolean>;
  submitAllAdjustments: () => Promise<boolean>;
  resetAll: () => void;
}

export const useStockOpnameStore = create<StockOpnameState>()((set, get) => ({
  // Initial data
  cabangs: [],
  products: [],
  opnameItems: [],
  
  // Selected values
  selectedCabang: '',
  
  // Filters
  search: '',
  filterStatus: 'all',
  showOnlyDiscrepancy: false,
  
  // UI State
  loading: false,
  loadingProducts: false,
  submitting: null,
  successMessage: null,
  expandedProducts: new Set(),
  
  // Computed stats
  getStats: () => {
    const items = get().opnameItems;
    return {
      total: items.length,
      counted: items.filter(i => i.status === 'counted' || i.status === 'adjusted').length,
      pending: items.filter(i => i.status === 'pending').length,
      discrepancy: items.filter(i => i.difference !== 0 && i.physicalQty !== null).length,
      adjusted: items.filter(i => i.status === 'adjusted').length,
    };
  },
  
  // Setters
  setCabangs: (cabangs) => set({ cabangs }),
  setProducts: (products) => set({ products }),
  setOpnameItems: (opnameItems) => set({ opnameItems }),
  setSelectedCabang: (selectedCabang) => set({ selectedCabang }),
  setSearch: (search) => set({ search }),
  setFilterStatus: (filterStatus) => set({ filterStatus }),
  setShowOnlyDiscrepancy: (showOnlyDiscrepancy) => set({ showOnlyDiscrepancy }),
  setSubmitting: (submitting) => set({ submitting }),
  setSuccessMessage: (successMessage) => set({ successMessage }),
  toggleExpandedProduct: (productId) => set((state) => {
    const newExpanded = new Set(state.expandedProducts);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    return { expandedProducts: newExpanded };
  }),
  
  // Opname item actions
  handlePhysicalQtyChange: (variantId, value) => {
    const qty = value === '' ? null : parseInt(value);
    set((state) => ({
      opnameItems: state.opnameItems.map(item => {
        if (item.variantId === variantId) {
          const physicalQty = qty;
          const difference = physicalQty !== null ? physicalQty - item.systemQty : 0;
          return {
            ...item,
            physicalQty,
            difference,
            status: physicalQty !== null ? 'counted' : 'pending',
          };
        }
        return item;
      }),
    }));
  },
  
  handleQuickAdjust: (variantId, adjustment) => {
    set((state) => ({
      opnameItems: state.opnameItems.map(item => {
        if (item.variantId === variantId) {
          const currentPhysical = item.physicalQty ?? item.systemQty;
          const newPhysical = Math.max(0, currentPhysical + adjustment);
          const difference = newPhysical - item.systemQty;
          return {
            ...item,
            physicalQty: newPhysical,
            difference,
            status: 'counted',
          };
        }
        return item;
      }),
    }));
  },
  
  handleResetItem: (variantId) => {
    set((state) => ({
      opnameItems: state.opnameItems.map(item => {
        if (item.variantId === variantId) {
          return {
            ...item,
            physicalQty: null,
            difference: 0,
            status: 'pending',
          };
        }
        return item;
      }),
    }));
  },
  
  handleSetToSystem: (variantId) => {
    set((state) => ({
      opnameItems: state.opnameItems.map(item => {
        if (item.variantId === variantId) {
          return {
            ...item,
            physicalQty: item.systemQty,
            difference: 0,
            status: 'counted',
          };
        }
        return item;
      }),
    }));
  },
  
  // API actions
  loadCabangs: async () => {
    try {
      const response = await cabangAPI.getCabangs();
      set({ cabangs: response.data });
    } catch (error) {
      logger.error('Error loading cabangs:', error);
    }
  },
  
  loadProducts: async () => {
    const { selectedCabang } = get();
    if (!selectedCabang) return;
    
    set({ loadingProducts: true });
    try {
      const response = await productsAPI.getProducts({ isActive: true });
      const products = response.data;
      
      // Build opname items from products
      const items: OpnameItem[] = [];
      products.forEach((product: Product) => {
        product.variants.forEach((variant: ProductVariant) => {
          const stock = variant.stocks.find(s => s.cabangId === selectedCabang);
          items.push({
            variantId: variant.id,
            productName: product.name,
            variantName: variant.name,
            sku: variant.sku,
            systemQty: stock?.quantity || 0,
            physicalQty: null,
            difference: 0,
            status: 'pending',
          });
        });
      });
      
      set({ products, opnameItems: items, loadingProducts: false });
    } catch (error) {
      logger.error('Error loading products:', error);
      set({ loadingProducts: false });
    }
  },
  
  submitAdjustment: async (item) => {
    if (item.physicalQty === null || item.difference === 0) return false;
    
    const { selectedCabang } = get();
    set({ submitting: item.variantId });
    
    try {
      await stockAPI.createAdjustment({
        variantId: item.variantId,
        cabangId: selectedCabang,
        type: item.difference > 0 ? 'add' : 'subtract',
        quantity: Math.abs(item.difference),
        reason: 'correction',
        notes: `Stock Opname: ${item.systemQty} → ${item.physicalQty}`,
      });
      
      // Update item status
      set((state) => ({
        opnameItems: state.opnameItems.map(i =>
          i.variantId === item.variantId
            ? { ...i, systemQty: item.physicalQty!, difference: 0, status: 'adjusted' as const }
            : i
        ),
        submitting: null,
        successMessage: `Stok ${item.productName} berhasil disesuaikan`,
      }));
      
      // Clear success message after 3 seconds
      setTimeout(() => set({ successMessage: null }), 3000);
      return true;
    } catch (error) {
      logger.error('Error submitting adjustment:', error);
      set({ submitting: null });
      return false;
    }
  },
  
  submitAllAdjustments: async () => {
    const { opnameItems, selectedCabang } = get();
    const itemsToAdjust = opnameItems.filter(i => i.status === 'counted' && i.difference !== 0);
    
    if (itemsToAdjust.length === 0) return false;
    
    set({ loading: true });
    
    try {
      for (const item of itemsToAdjust) {
        await stockAPI.createAdjustment({
          variantId: item.variantId,
          cabangId: selectedCabang,
          type: item.difference > 0 ? 'add' : 'subtract',
          quantity: Math.abs(item.difference),
          reason: 'correction',
          notes: `Stock Opname: ${item.systemQty} → ${item.physicalQty}`,
        });
      }
      
      // Update all adjusted items
      set((state) => ({
        opnameItems: state.opnameItems.map(i => {
          if (i.status === 'counted' && i.difference !== 0) {
            return { ...i, systemQty: i.physicalQty!, difference: 0, status: 'adjusted' as const };
          }
          return i;
        }),
        loading: false,
        successMessage: `${itemsToAdjust.length} item berhasil disesuaikan`,
      }));
      
      setTimeout(() => set({ successMessage: null }), 3000);
      return true;
    } catch (error) {
      logger.error('Error submitting all adjustments:', error);
      set({ loading: false });
      return false;
    }
  },
  
  resetAll: () => set({
    opnameItems: [],
    search: '',
    filterStatus: 'all',
    showOnlyDiscrepancy: false,
    expandedProducts: new Set(),
    successMessage: null,
  }),
}));

