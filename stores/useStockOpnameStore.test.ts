import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useStockOpnameStore } from './useStockOpnameStore';

// Mock API
vi.mock('@/lib/api', () => ({
  stockAPI: {
    createAdjustment: vi.fn().mockResolvedValue({ data: {} }),
  },
  cabangAPI: {
    getCabangs: vi.fn().mockResolvedValue({ data: [] }),
  },
  productsAPI: {
    getProducts: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

describe('useStockOpnameStore', () => {
  beforeEach(() => {
    useStockOpnameStore.setState({
      cabangs: [],
      products: [],
      opnameItems: [],
      selectedCabang: '',
      search: '',
      filterStatus: 'all',
      showOnlyDiscrepancy: false,
      loading: false,
      loadingProducts: false,
      submitting: null,
      successMessage: null,
      expandedProducts: new Set(),
    });
  });

  it('should initialize with default state', () => {
    const state = useStockOpnameStore.getState();
    expect(state.opnameItems).toEqual([]);
    expect(state.selectedCabang).toBe('');
    expect(state.filterStatus).toBe('all');
  });

  it('should update search', () => {
    useStockOpnameStore.getState().setSearch('test');
    expect(useStockOpnameStore.getState().search).toBe('test');
  });

  it('should update filter status', () => {
    useStockOpnameStore.getState().setFilterStatus('pending');
    expect(useStockOpnameStore.getState().filterStatus).toBe('pending');
  });

  it('should update selected cabang', () => {
    useStockOpnameStore.getState().setSelectedCabang('cabang-1');
    expect(useStockOpnameStore.getState().selectedCabang).toBe('cabang-1');
  });

  it('should toggle show only discrepancy', () => {
    useStockOpnameStore.getState().setShowOnlyDiscrepancy(true);
    expect(useStockOpnameStore.getState().showOnlyDiscrepancy).toBe(true);
  });

  it('should set opname items', () => {
    const items = [
      { variantId: 'v1', productName: 'Product 1', variantName: 'Default', sku: 'SKU1', systemQty: 10, physicalQty: null, difference: 0, status: 'pending' as const },
    ];
    useStockOpnameStore.getState().setOpnameItems(items);
    expect(useStockOpnameStore.getState().opnameItems).toEqual(items);
  });

  it('should handle physical qty change', () => {
    const items = [
      { variantId: 'v1', productName: 'Product 1', variantName: 'Default', sku: 'SKU1', systemQty: 10, physicalQty: null, difference: 0, status: 'pending' as const },
    ];
    useStockOpnameStore.setState({ opnameItems: items });
    
    useStockOpnameStore.getState().handlePhysicalQtyChange('v1', '8');
    const updated = useStockOpnameStore.getState().opnameItems[0];
    expect(updated.physicalQty).toBe(8);
    expect(updated.difference).toBe(-2);
    expect(updated.status).toBe('counted');
  });

  it('should handle quick adjust', () => {
    const items = [
      { variantId: 'v1', productName: 'Product 1', variantName: 'Default', sku: 'SKU1', systemQty: 10, physicalQty: 10, difference: 0, status: 'counted' as const },
    ];
    useStockOpnameStore.setState({ opnameItems: items });
    
    useStockOpnameStore.getState().handleQuickAdjust('v1', -3);
    const updated = useStockOpnameStore.getState().opnameItems[0];
    expect(updated.physicalQty).toBe(7);
    expect(updated.difference).toBe(-3);
  });

  it('should handle reset item', () => {
    const items = [
      { variantId: 'v1', productName: 'Product 1', variantName: 'Default', sku: 'SKU1', systemQty: 10, physicalQty: 8, difference: -2, status: 'counted' as const },
    ];
    useStockOpnameStore.setState({ opnameItems: items });
    
    useStockOpnameStore.getState().handleResetItem('v1');
    const updated = useStockOpnameStore.getState().opnameItems[0];
    expect(updated.physicalQty).toBeNull();
    expect(updated.difference).toBe(0);
    expect(updated.status).toBe('pending');
  });

  it('should compute stats correctly', () => {
    const items = [
      { variantId: 'v1', productName: 'Product 1', variantName: 'A', sku: 'SKU1', systemQty: 10, physicalQty: null, difference: 0, status: 'pending' as const },
      { variantId: 'v2', productName: 'Product 2', variantName: 'B', sku: 'SKU2', systemQty: 5, physicalQty: 3, difference: -2, status: 'counted' as const },
      { variantId: 'v3', productName: 'Product 3', variantName: 'C', sku: 'SKU3', systemQty: 8, physicalQty: 10, difference: 2, status: 'adjusted' as const },
    ];
    useStockOpnameStore.setState({ opnameItems: items });
    
    const stats = useStockOpnameStore.getState().getStats();
    expect(stats.total).toBe(3);
    expect(stats.pending).toBe(1);
    expect(stats.counted).toBe(2); // counted + adjusted
    expect(stats.discrepancy).toBe(2); // items with difference !== 0 and physicalQty !== null
    expect(stats.adjusted).toBe(1);
  });
});

