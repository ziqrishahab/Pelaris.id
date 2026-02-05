import { create } from 'zustand';
import { stockAPI, productsAPI, cabangAPI } from '@/lib/api';
import { logger } from '@/lib/logger';

export interface Stock {
  id: string;
  quantity: number;
  price: number;
  cabang: { id: string; name: string };
}

export interface Variant {
  id: string;
  sku: string;
  variantName: string;
  variantValue: string;
  stocks: Stock[];
}

export interface Product {
  id: string;
  name: string;
  productType: string;
  category: { id: string; name: string };
  variants: Variant[];
}

export interface Cabang {
  id: string;
  name: string;
  isActive: boolean;
}

export interface AdjustmentItem {
  id: string;
  variant: Variant;
  productName: string;
  cabangId: string;
  currentStock: number;
  type: 'add' | 'subtract';
  quantity: number;
  reason: string;
  notes: string;
}

export interface AdjustmentModal {
  isOpen: boolean;
  variant: Variant | null;
  productName: string;
  cabangId: string;
  currentStock: number;
}

interface QuickHistoryModal {
  isOpen: boolean;
  variantId: string;
  cabangId: string;
  variantName: string;
  productName: string;
}

interface AlertModal {
  isOpen: boolean;
  variant: Variant | null;
  productName: string;
  cabangId: string;
  currentStock: number;
  existingAlert?: { minStock: number; isActive: boolean };
}

interface StockInItem {
  sku: string;
  productId: string;
  variantId: string;
  productName: string;
  variantName: string;
  quantity: number;
  cabangId: string;
  skuError?: string;
}

interface AdjustmentForm {
  type: 'add' | 'subtract';
  quantity: number;
  reason: string;
  notes: string;
}

interface StockState {
  // Data
  products: Product[];
  cabangs: Cabang[];
  adjustmentHistory: any[];
  stockAlerts: Map<string, { minStock: number; isActive: boolean }>;
  damagedCounts: Map<string, number>; // variantId-cabangId -> damaged count
  
  // Filters
  searchTerm: string;
  selectedCabangs: Set<string>;
  showLowStockOnly: boolean;
  viewMode: 'simple' | 'advanced';
  activeTab: 'overview' | 'history';
  
  // UI State
  loading: boolean;
  loadingHistory: boolean;
  submitting: boolean;
  expandedProducts: Set<string>;
  
  // Adjustment
  adjustmentItems: AdjustmentItem[];
  
  // Modals
  adjustmentModal: AdjustmentModal;
  quickHistoryModal: QuickHistoryModal;
  alertModal: AlertModal;
  alertMinStock: string;
  adjustmentForm: AdjustmentForm;
  showStockInModal: boolean;
  stockInItems: StockInItem[];
  stockInLoading: boolean;
  showCabangDropdown: boolean;
  activeActionMenu: string | null;
  
  // Actions
  setProducts: (products: Product[]) => void;
  setCabangs: (cabangs: Cabang[]) => void;
  setSearchTerm: (term: string) => void;
  setShowLowStockOnly: (show: boolean) => void;
  setViewMode: (mode: 'simple' | 'advanced') => void;
  setActiveTab: (tab: 'overview' | 'history') => void;
  setLoading: (loading: boolean) => void;
  setLoadingHistory: (loading: boolean) => void;
  setSubmitting: (submitting: boolean) => void;
  setAdjustmentHistory: (history: any[]) => void;
  setStockAlerts: (alerts: Map<string, { minStock: number; isActive: boolean }>) => void;
  toggleCabang: (cabangId: string) => void;
  selectAllCabangs: () => void;
  clearAllCabangs: () => void;
  toggleExpandProduct: (productId: string) => void;
  
  // Fetch actions
  fetchData: () => Promise<void>;
  fetchProducts: () => Promise<void>;
  fetchCabangs: () => Promise<void>;
  fetchHistory: (filters?: any) => Promise<void>;
  fetchStockAlerts: () => Promise<void>;  fetchDamagedCounts: () => Promise<void>;  
  // Adjustment actions
  addAdjustmentItem: (item: AdjustmentItem) => void;
  removeAdjustmentItem: (id: string) => void;
  clearAdjustmentItems: () => void;
  submitAdjustments: () => Promise<boolean>;
  
  // Modal actions
  setAdjustmentModal: (modal: AdjustmentModal | ((prev: AdjustmentModal) => AdjustmentModal)) => void;
  setQuickHistoryModal: (modal: QuickHistoryModal | ((prev: QuickHistoryModal) => QuickHistoryModal)) => void;
  setAlertModal: (modal: AlertModal | ((prev: AlertModal) => AlertModal)) => void;
  setAlertMinStock: (value: string) => void;
  setAdjustmentForm: (form: AdjustmentForm | ((prev: AdjustmentForm) => AdjustmentForm)) => void;
  setShowStockInModal: (show: boolean) => void;
  setStockInItems: (items: StockInItem[] | ((prev: StockInItem[]) => StockInItem[])) => void;
  setStockInLoading: (loading: boolean) => void;
  setShowCabangDropdown: (show: boolean) => void;
  setActiveActionMenu: (id: string | null) => void;
  setAdjustmentItems: (items: AdjustmentItem[] | ((prev: AdjustmentItem[]) => AdjustmentItem[])) => void;
  
  // Modal helpers
  closeAdjustmentModal: () => void;
  closeQuickHistoryModal: () => void;
  closeAlertModal: () => void;
  resetAdjustmentForm: () => void;
  
  // Stock-In actions
  openStockInModal: () => void;
  addStockInItem: () => void;
  removeStockInItem: (index: number) => void;
  updateStockInItem: (index: number, field: string, value: any) => void;
  searchSkuForStockIn: (index: number, sku: string) => Promise<void>;
  submitStockIn: () => Promise<false | { success: number; failed: number }>;
  
  // Adjustment logic actions
  addCurrentItemToAdjustment: () => boolean;
  submitAllAdjustments: () => Promise<false | number>;
  openQuickHistory: (variantId: string, cabangId: string, variantName: string, productName: string) => Promise<void>;
  
  // Alert actions
  openAlertModal: (variant: Variant, productName: string, defaultCabangId: string) => Promise<void>;
  changeAlertCabang: (cabangId: string) => Promise<void>;
  submitAlert: () => Promise<{ success: boolean; message: string }>;
  deleteAlert: () => Promise<{ success: boolean; message: string }>;
  
  // Additional modal actions
  openAdjustmentModal: (variant: Variant, productName: string, defaultCabangId: string) => void;
  changeCabangInAdjustmentModal: (cabangId: string) => void;
  openHistoryForAllCabangs: (variantId: string, variantName: string, productName: string) => Promise<void>;
}

export const useStockStore = create<StockState>()((set, get) => ({
  // Initial data
  products: [],
  cabangs: [],
  adjustmentHistory: [],
  stockAlerts: new Map(),
  damagedCounts: new Map(),
  
  // Initial filters
  searchTerm: '',
  selectedCabangs: new Set(),
  showLowStockOnly: false,
  viewMode: 'advanced',
  activeTab: 'overview',
  
  // Initial UI state
  loading: true,
  loadingHistory: false,
  submitting: false,
  expandedProducts: new Set(),
  
  // Adjustment
  adjustmentItems: [],
  
  // Modals initial state
  adjustmentModal: { isOpen: false, variant: null, productName: '', cabangId: '', currentStock: 0 },
  quickHistoryModal: { isOpen: false, variantId: '', cabangId: '', variantName: '', productName: '' },
  alertModal: { isOpen: false, variant: null, productName: '', cabangId: '', currentStock: 0 },
  alertMinStock: '5',
  adjustmentForm: { type: 'add', quantity: 0, reason: '', notes: '' },
  showStockInModal: false,
  stockInItems: [],
  stockInLoading: false,
  showCabangDropdown: false,
  activeActionMenu: null,
  
  // Setters
  setProducts: (products) => set({ products }),
  setCabangs: (cabangs) => set({ cabangs }),
  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setShowLowStockOnly: (showLowStockOnly) => set({ showLowStockOnly }),
  setViewMode: (viewMode) => set({ viewMode }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setLoading: (loading) => set({ loading }),
  setLoadingHistory: (loadingHistory) => set({ loadingHistory }),
  setSubmitting: (submitting) => set({ submitting }),
  setAdjustmentHistory: (adjustmentHistory) => set({ adjustmentHistory }),
  setStockAlerts: (stockAlerts) => set({ stockAlerts }),
  
  toggleCabang: (cabangId) => set((state) => {
    const newSet = new Set(state.selectedCabangs);
    if (newSet.has(cabangId)) {
      newSet.delete(cabangId);
    } else {
      newSet.add(cabangId);
    }
    return { selectedCabangs: newSet };
  }),
  
  selectAllCabangs: () => set((state) => ({
    selectedCabangs: new Set(state.cabangs.map(c => c.id))
  })),
  
  clearAllCabangs: () => set({ selectedCabangs: new Set() }),
  
  toggleExpandProduct: (productId) => set((state) => {
    const newSet = new Set(state.expandedProducts);
    if (newSet.has(productId)) {
      newSet.delete(productId);
    } else {
      newSet.add(productId);
    }
    return { expandedProducts: newSet };
  }),
  
  // Fetch actions
  fetchData: async () => {
    set({ loading: true });
    try {
      const [productsRes, cabangRes] = await Promise.all([
        productsAPI.getProducts({ isActive: true }), // Only fetch active products
        cabangAPI.getCabangs(),
      ]);
      const filteredCabangs = cabangRes.data.filter((c: Cabang) => c.name !== 'Default' && c.isActive);
      // Handle paginated response: { data: [...], pagination: {...} }
      const productsData = productsRes.data.data || productsRes.data;
      set({
        products: Array.isArray(productsData) ? productsData : [],
        cabangs: filteredCabangs,
        selectedCabangs: new Set(filteredCabangs.map((c: Cabang) => c.id)),
        loading: false,
      });
      // Fetch damaged counts after products loaded
      get().fetchDamagedCounts();
    } catch (error) {
      logger.error('Error fetching data:', error);
      set({ loading: false });
    }
  },
  
  fetchProducts: async () => {
    set({ loading: true });
    try {
      const res = await productsAPI.getProducts({ isActive: true });
      // Handle paginated response: { data: [...], pagination: {...} }
      const productsData = res.data.data || res.data;
      set({ products: productsData, loading: false });
    } catch (error) {
      logger.error('Error fetching products:', error);
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
  
  fetchHistory: async (filters = {}) => {
    set({ loadingHistory: true });
    try {
      const res = await stockAPI.getAdjustments(filters);
      const data = res?.data?.data || res?.data || [];
      set({ adjustmentHistory: Array.isArray(data) ? data : [], loadingHistory: false });
    } catch (error) {
      logger.error('Error fetching history:', error);
      set({ loadingHistory: false });
    }
  },
  
  fetchStockAlerts: async () => {
    try {
      const response = await stockAPI.getAlerts();
      const alertsData = response?.data?.data || response?.data || [];
      
      // Build a map of variant+cabang -> alert settings
      const alertsMap = new Map<string, { minStock: number; isActive: boolean }>();
      
      alertsData.forEach((alert: any) => {
        const key = `${alert.productVariantId}-${alert.cabangId}`;
        alertsMap.set(key, {
          minStock: alert.minStock,
          isActive: alert.isActive
        });
      });
      
      set({ stockAlerts: alertsMap });
    } catch (error) {
      logger.error('Error fetching alerts:', error);
    }
  },

  fetchDamagedCounts: async () => {
    try {
      // Fetch all DAMAGED adjustments
      const response = await stockAPI.getAdjustments({ reason: 'DAMAGED' });
      const adjustments = response?.data?.data || response?.data || [];
      
      // Aggregate damaged count per variant+cabang
      const damagedMap = new Map<string, number>();
      
      adjustments.forEach((adj: any) => {
        const key = `${adj.productVariantId}-${adj.cabangId}`;
        const currentCount = damagedMap.get(key) || 0;
        // Sum up all negative differences (damaged items)
        if (adj.difference < 0) {
          damagedMap.set(key, currentCount + Math.abs(adj.difference));
        }
      });
      
      set({ damagedCounts: damagedMap });
    } catch (error) {
      logger.error('Error fetching damaged counts:', error);
    }
  },
  
  // Adjustment actions
  addAdjustmentItem: (item) => set((state) => ({
    adjustmentItems: [...state.adjustmentItems, item]
  })),
  
  removeAdjustmentItem: (id) => set((state) => ({
    adjustmentItems: state.adjustmentItems.filter(i => i.id !== id)
  })),
  
  clearAdjustmentItems: () => set({ adjustmentItems: [] }),
  
  submitAdjustments: async () => {
    const { adjustmentItems } = get();
    if (adjustmentItems.length === 0) return false;
    
    set({ submitting: true });
    try {
      await Promise.all(
        adjustmentItems.map(item => {
          const adjustmentType: 'add' | 'subtract' = item.type === 'add' ? 'add' : 'subtract';
          return stockAPI.createAdjustment({
            variantId: item.variant.id,
            cabangId: item.cabangId,
            type: adjustmentType,
            quantity: item.quantity,
            reason: item.reason,
            notes: item.notes,
          });
        })
      );
      set({ adjustmentItems: [], submitting: false });
      get().fetchProducts();
      return true;
    } catch (error) {
      logger.error('Error submitting adjustments:', error);
      set({ submitting: false });
      return false;
    }
  },
  
  // Modal setters (support callback pattern)
  setAdjustmentModal: (modalOrFn) => set((state) => ({
    adjustmentModal: typeof modalOrFn === 'function' ? modalOrFn(state.adjustmentModal) : modalOrFn
  })),
  setQuickHistoryModal: (modalOrFn) => set((state) => ({
    quickHistoryModal: typeof modalOrFn === 'function' ? modalOrFn(state.quickHistoryModal) : modalOrFn
  })),
  setAlertModal: (modalOrFn) => set((state) => ({
    alertModal: typeof modalOrFn === 'function' ? modalOrFn(state.alertModal) : modalOrFn
  })),
  setAlertMinStock: (alertMinStock) => set({ alertMinStock }),
  setAdjustmentForm: (formOrFn) => set((state) => ({
    adjustmentForm: typeof formOrFn === 'function' ? formOrFn(state.adjustmentForm) : formOrFn
  })),
  setShowStockInModal: (showStockInModal) => set({ showStockInModal }),
  setStockInItems: (itemsOrFn) => set((state) => ({
    stockInItems: typeof itemsOrFn === 'function' ? itemsOrFn(state.stockInItems) : itemsOrFn
  })),
  setStockInLoading: (stockInLoading) => set({ stockInLoading }),
  setShowCabangDropdown: (showCabangDropdown) => set({ showCabangDropdown }),
  setActiveActionMenu: (activeActionMenu) => set({ activeActionMenu }),
  setAdjustmentItems: (itemsOrFn) => set((state) => ({
    adjustmentItems: typeof itemsOrFn === 'function' ? itemsOrFn(state.adjustmentItems) : itemsOrFn
  })),
  
  // Modal helpers
  closeAdjustmentModal: () => set({ 
    adjustmentModal: { isOpen: false, variant: null, productName: '', cabangId: '', currentStock: 0 } 
  }),
  closeQuickHistoryModal: () => set({ 
    quickHistoryModal: { isOpen: false, variantId: '', cabangId: '', variantName: '', productName: '' } 
  }),
  closeAlertModal: () => set({ 
    alertModal: { isOpen: false, variant: null, productName: '', cabangId: '', currentStock: 0 },
    alertMinStock: '5'
  }),
  resetAdjustmentForm: () => set({ 
    adjustmentForm: { type: 'add', quantity: 0, reason: '', notes: '' } 
  }),
  
  // Stock-In actions
  openStockInModal: () => {
    const { cabangs } = get();
    set({
      showStockInModal: true,
      stockInItems: [{
        sku: '',
        productId: '',
        variantId: '',
        productName: '',
        variantName: '',
        quantity: 0,
        cabangId: cabangs[0]?.id || ''
      }]
    });
  },
  
  addStockInItem: () => {
    const { cabangs, stockInItems } = get();
    set({
      stockInItems: [...stockInItems, {
        sku: '',
        productId: '',
        variantId: '',
        productName: '',
        variantName: '',
        quantity: 0,
        cabangId: cabangs[0]?.id || ''
      }]
    });
  },
  
  removeStockInItem: (index) => {
    const { stockInItems } = get();
    set({ stockInItems: stockInItems.filter((_, i) => i !== index) });
  },
  
  updateStockInItem: (index, field, value) => {
    const { stockInItems } = get();
    const newItems = [...stockInItems];
    newItems[index] = { ...newItems[index], [field]: value };
    set({ stockInItems: newItems });
  },
  
  searchSkuForStockIn: async (index, sku) => {
    const { stockInItems } = get();
    const newItems = [...stockInItems];
    
    newItems[index] = {
      ...newItems[index],
      sku,
      productId: '',
      variantId: '',
      productName: '',
      variantName: '',
      skuError: undefined
    };
    
    if (sku.trim()) {
      try {
        const response = await productsAPI.searchBySKU(sku.trim());
        const apiData = response.data;
        if (apiData?.success && apiData.data) {
          const { product, variant } = apiData.data;
          newItems[index] = {
            ...newItems[index],
            sku: variant.sku,
            productId: product.id,
            productName: product.name,
            variantId: variant.id,
            variantName: variant.variantType ? `${variant.variantType}: ${variant.value}` : 'Default',
            skuError: undefined
          };
        }
      } catch (error: any) {
        const errorMsg = error?.response?.data?.error || 'SKU tidak ditemukan';
        newItems[index] = { ...newItems[index], skuError: errorMsg };
      }
    }
    
    set({ stockInItems: newItems });
  },
  
  submitStockIn: async () => {
    const { stockInItems, fetchData } = get();
    
    const invalidItems = stockInItems.filter(item => 
      !item.sku || !item.variantId || !item.cabangId || item.quantity <= 0
    );
    
    if (invalidItems.length > 0) {
      return false;
    }

    set({ stockInLoading: true });
    
    try {
      const results = await Promise.allSettled(
        stockInItems.map(async (item) => {
          const stockRes = await productsAPI.getStock(item.variantId);
          const currentStock = stockRes.data.find((s: any) => s.cabangId === item.cabangId);
          const currentQty = currentStock?.quantity || 0;
          const newQty = currentQty + item.quantity;
          
          return productsAPI.updateStock(item.variantId, item.cabangId, {
            quantity: newQty,
            reason: 'STOCK_OPNAME',
            notes: `Stock In: +${item.quantity} (dari ${currentQty} menjadi ${newQty})`
          });
        })
      );

      const failed = results.filter(r => r.status === 'rejected');
      const success = results.filter(r => r.status === 'fulfilled');

      await fetchData();
      set({ showStockInModal: false, stockInItems: [], stockInLoading: false });
      
      return { success: success.length, failed: failed.length };
    } catch (error) {
      logger.error('Error stock in:', error);
      set({ stockInLoading: false });
      return false;
    }
  },
  
  // Adjustment logic actions
  addCurrentItemToAdjustment: () => {
    const { adjustmentModal, adjustmentForm, adjustmentItems } = get();
    
    if (!adjustmentModal.variant || !adjustmentForm.quantity || !adjustmentForm.reason) {
      return false;
    }

    const newItem: AdjustmentItem = {
      id: `${adjustmentModal.variant.id}-${Date.now()}`,
      variant: adjustmentModal.variant,
      productName: adjustmentModal.productName,
      cabangId: adjustmentModal.cabangId,
      currentStock: adjustmentModal.currentStock,
      type: adjustmentForm.type,
      quantity: adjustmentForm.quantity,
      reason: adjustmentForm.reason,
      notes: adjustmentForm.notes
    };

    set({
      adjustmentItems: [...adjustmentItems, newItem],
      adjustmentForm: { type: 'add', quantity: 0, reason: '', notes: '' }
    });
    
    return true;
  },
  
  submitAllAdjustments: async () => {
    const { adjustmentItems, adjustmentModal, adjustmentForm, fetchData } = get();
    
    const hasItems = adjustmentItems.length > 0;
    const hasSingleForm = adjustmentModal.variant && adjustmentModal.cabangId && adjustmentForm.quantity > 0 && adjustmentForm.reason;

    if (!hasItems && !hasSingleForm) {
      return false;
    }

    set({ submitting: true });
    
    try {
      const itemsToSubmit = hasItems ? adjustmentItems : [{
        id: `single-${Date.now()}`,
        variant: adjustmentModal.variant!,
        productName: adjustmentModal.productName,
        cabangId: adjustmentModal.cabangId,
        currentStock: adjustmentModal.currentStock,
        type: adjustmentForm.type,
        quantity: adjustmentForm.quantity,
        reason: adjustmentForm.reason,
        notes: adjustmentForm.notes
      }];

      for (const item of itemsToSubmit) {
        await stockAPI.createAdjustment({
          variantId: item.variant.id,
          cabangId: item.cabangId,
          type: item.type,
          quantity: item.quantity,
          reason: item.reason,
          notes: item.notes || undefined
        });
      }
      
      set({
        adjustmentModal: { isOpen: false, variant: null, productName: '', cabangId: '', currentStock: 0 },
        adjustmentItems: [],
        adjustmentForm: { type: 'add', quantity: 0, reason: '', notes: '' },
        submitting: false
      });
      
      fetchData();
      return itemsToSubmit.length;
    } catch (error: any) {
      logger.error('Error submitting adjustment:', error);
      set({ submitting: false });
      throw error;
    }
  },
  
  openQuickHistory: async (variantId, cabangId, variantName, productName) => {
    set({
      quickHistoryModal: {
        isOpen: true,
        variantId,
        cabangId,
        variantName,
        productName
      },
      loadingHistory: true
    });
    
    try {
      const response = await stockAPI.getAdjustmentHistory(variantId, cabangId);
      const data = response?.data?.data || response?.data || [];
      set({ adjustmentHistory: Array.isArray(data) ? data : [], loadingHistory: false });
    } catch (error) {
      logger.error('Error fetching history:', error);
      set({ loadingHistory: false });
    }
  },
  
  // Alert actions
  openAlertModal: async (variant, productName, defaultCabangId) => {
    const stock = variant.stocks.find(s => s.cabang.id === defaultCabangId);
    
    try {
      const response = await stockAPI.getAlert(variant.id, defaultCabangId);
      const existingAlert = response?.data?.data || response?.data;
      
      set({
        alertModal: {
          isOpen: true,
          variant,
          productName,
          cabangId: defaultCabangId,
          currentStock: stock?.quantity || 0,
          existingAlert: existingAlert ? {
            minStock: existingAlert.minStock,
            isActive: existingAlert.isActive
          } : undefined
        },
        alertMinStock: existingAlert ? String(existingAlert.minStock) : '5',
        activeActionMenu: null
      });
    } catch (error) {
      // No existing alert, use defaults
      set({
        alertModal: {
          isOpen: true,
          variant,
          productName,
          cabangId: defaultCabangId,
          currentStock: stock?.quantity || 0
        },
        alertMinStock: '5',
        activeActionMenu: null
      });
    }
  },
  
  changeAlertCabang: async (cabangId) => {
    const { alertModal } = get();
    if (!alertModal.variant) return;
    
    const stock = alertModal.variant.stocks.find(s => s.cabang.id === cabangId);
    
    try {
      const response = await stockAPI.getAlert(alertModal.variant.id, cabangId);
      const existingAlert = response?.data?.data || response?.data;
      
      set({
        alertModal: {
          ...alertModal,
          cabangId,
          currentStock: stock?.quantity || 0,
          existingAlert: existingAlert ? {
            minStock: existingAlert.minStock,
            isActive: existingAlert.isActive
          } : undefined
        },
        alertMinStock: existingAlert ? String(existingAlert.minStock) : '5'
      });
    } catch (error) {
      set({
        alertModal: {
          ...alertModal,
          cabangId,
          currentStock: stock?.quantity || 0,
          existingAlert: undefined
        },
        alertMinStock: '5'
      });
    }
  },
  
  submitAlert: async () => {
    const { alertModal, alertMinStock, fetchStockAlerts } = get();
    
    if (!alertModal.variant || !alertModal.cabangId) {
      return { success: false, message: 'Data tidak lengkap' };
    }
    
    const minStock = parseInt(alertMinStock) || 0;
    if (minStock < 0) {
      return { success: false, message: 'Minimum stock tidak boleh negatif' };
    }
    
    try {
      const response = await stockAPI.setAlert({
        variantId: alertModal.variant.id,
        cabangId: alertModal.cabangId,
        minStock
      });
      
      set({
        alertModal: { isOpen: false, variant: null, productName: '', cabangId: '', currentStock: 0 },
        alertMinStock: '5'
      });
      
      fetchStockAlerts();
      return { success: true, message: response.data.message || 'Alert berhasil diatur!' };
    } catch (error: any) {
      logger.error('Error setting alert:', error);
      return { success: false, message: error.response?.data?.error || 'Gagal mengatur alert' };
    }
  },
  
  deleteAlert: async () => {
    const { alertModal, fetchStockAlerts } = get();
    
    if (!alertModal.variant || !alertModal.cabangId) {
      return { success: false, message: 'Data tidak lengkap' };
    }
    
    try {
      await stockAPI.deleteAlert(alertModal.variant.id, alertModal.cabangId);
      
      set({
        alertModal: { isOpen: false, variant: null, productName: '', cabangId: '', currentStock: 0 }
      });
      
      fetchStockAlerts();
      return { success: true, message: 'Alert berhasil dinonaktifkan' };
    } catch (error: any) {
      logger.error('Error deleting alert:', error);
      return { success: false, message: error.response?.data?.error || 'Gagal menghapus alert' };
    }
  },
  
  // Additional modal actions
  openAdjustmentModal: (variant, productName, defaultCabangId) => {
    const stock = variant.stocks.find(s => s.cabang.id === defaultCabangId);
    set({
      adjustmentModal: {
        isOpen: true,
        variant,
        productName,
        cabangId: defaultCabangId,
        currentStock: stock?.quantity || 0
      },
      adjustmentForm: { type: 'add', quantity: 0, reason: '', notes: '' },
      activeActionMenu: null
    });
  },
  
  changeCabangInAdjustmentModal: (cabangId) => {
    const { adjustmentModal } = get();
    const stock = adjustmentModal.variant?.stocks.find(s => s.cabang.id === cabangId);
    set({
      adjustmentModal: {
        ...adjustmentModal,
        cabangId,
        currentStock: stock?.quantity || 0
      }
    });
  },
  
  openHistoryForAllCabangs: async (variantId, variantName, productName) => {
    set({
      quickHistoryModal: {
        isOpen: true,
        variantId,
        cabangId: 'all',
        variantName,
        productName
      },
      loadingHistory: true,
      activeActionMenu: null
    });
    
    try {
      const response = await stockAPI.getAdjustmentHistory(variantId, 'all');
      const data = response?.data?.data || response?.data || [];
      set({ adjustmentHistory: Array.isArray(data) ? data : [], loadingHistory: false });
    } catch (error) {
      logger.error('Error fetching history:', error);
      set({ loadingHistory: false });
    }
  },
}));

