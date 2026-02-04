import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useStockStore } from './useStockStore';

// Mock API
vi.mock('@/lib/api', () => ({
  stockAPI: {
    getAdjustments: vi.fn().mockResolvedValue({ data: [] }),
    createAdjustment: vi.fn().mockResolvedValue({ data: {} }),
  },
  productsAPI: {
    getProducts: vi.fn().mockResolvedValue({ data: [] }),
  },
  cabangAPI: {
    getCabangs: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

describe('useStockStore', () => {
  beforeEach(() => {
    useStockStore.setState({
      products: [],
      cabangs: [],
      adjustmentHistory: [],
      stockAlerts: new Map(),
      searchTerm: '',
      selectedCabangs: new Set(),
      showLowStockOnly: false,
      viewMode: 'advanced',
      activeTab: 'overview',
      loading: true,
      loadingHistory: false,
      submitting: false,
      expandedProducts: new Set(),
      adjustmentItems: [],
    });
  });

  it('should initialize with default state', () => {
    const state = useStockStore.getState();
    expect(state.products).toEqual([]);
    expect(state.searchTerm).toBe('');
    expect(state.viewMode).toBe('advanced');
    expect(state.loading).toBe(true);
  });

  it('should update search term', () => {
    useStockStore.getState().setSearchTerm('test search');
    expect(useStockStore.getState().searchTerm).toBe('test search');
  });

  it('should toggle cabang selection', () => {
    useStockStore.getState().toggleCabang('cabang-1');
    expect(useStockStore.getState().selectedCabangs.has('cabang-1')).toBe(true);
    
    useStockStore.getState().toggleCabang('cabang-1');
    expect(useStockStore.getState().selectedCabangs.has('cabang-1')).toBe(false);
  });

  it('should toggle expanded products', () => {
    useStockStore.getState().toggleExpandProduct('product-1');
    expect(useStockStore.getState().expandedProducts.has('product-1')).toBe(true);
    
    useStockStore.getState().toggleExpandProduct('product-1');
    expect(useStockStore.getState().expandedProducts.has('product-1')).toBe(false);
  });

  it('should add adjustment items', () => {
    const item = {
      id: 'adj-1',
      variant: { id: 'v1', sku: 'SKU1', variantName: '', variantValue: '', stocks: [] },
      productName: 'Product 1',
      cabangId: 'c1',
      currentStock: 10,
      type: 'add' as const,
      quantity: 5,
      reason: 'Restocking',
      notes: '',
    };
    
    useStockStore.getState().addAdjustmentItem(item);
    expect(useStockStore.getState().adjustmentItems).toHaveLength(1);
  });

  it('should remove adjustment items', () => {
    const item = {
      id: 'adj-1',
      variant: { id: 'v1', sku: 'SKU1', variantName: '', variantValue: '', stocks: [] },
      productName: 'Product 1',
      cabangId: 'c1',
      currentStock: 10,
      type: 'add' as const,
      quantity: 5,
      reason: 'Restocking',
      notes: '',
    };
    
    useStockStore.setState({ adjustmentItems: [item] });
    useStockStore.getState().removeAdjustmentItem('adj-1');
    expect(useStockStore.getState().adjustmentItems).toHaveLength(0);
  });

  it('should clear adjustment items', () => {
    const item = {
      id: 'adj-1',
      variant: { id: 'v1', sku: 'SKU1', variantName: '', variantValue: '', stocks: [] },
      productName: 'Product 1',
      cabangId: 'c1',
      currentStock: 10,
      type: 'add' as const,
      quantity: 5,
      reason: 'Restocking',
      notes: '',
    };
    
    useStockStore.setState({ adjustmentItems: [item] });
    useStockStore.getState().clearAdjustmentItems();
    expect(useStockStore.getState().adjustmentItems).toHaveLength(0);
  });

  it('should set view mode', () => {
    useStockStore.getState().setViewMode('simple');
    expect(useStockStore.getState().viewMode).toBe('simple');
  });

  it('should set active tab', () => {
    useStockStore.getState().setActiveTab('history');
    expect(useStockStore.getState().activeTab).toBe('history');
  });

  it('should set show low stock only', () => {
    useStockStore.getState().setShowLowStockOnly(true);
    expect(useStockStore.getState().showLowStockOnly).toBe(true);
  });
});

