import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useProductPageStore } from './useProductPageStore';

// Mock API
vi.mock('@/lib/api', () => ({
  productsAPI: {
    getProducts: vi.fn().mockResolvedValue({ data: [] }),
    getCategories: vi.fn().mockResolvedValue({ data: [] }),
    updateStock: vi.fn().mockResolvedValue({ data: {} }),
    deleteProduct: vi.fn().mockResolvedValue({ data: {} }),
    importProducts: vi.fn().mockResolvedValue({ data: { success: true, imported: 1, failed: 0 } }),
    exportProducts: vi.fn().mockResolvedValue({ data: new ArrayBuffer(0) }),
    getTemplate: vi.fn().mockResolvedValue({ data: new ArrayBuffer(0) }),
  },
  cabangAPI: {
    getCabangs: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

describe('useProductPageStore', () => {
  beforeEach(() => {
    useProductPageStore.setState({
      products: [],
      categories: [],
      cabangs: [],
      search: '',
      selectedCategory: '',
      selectedProducts: [],
      loading: true,
      deleting: false,
      activeTab: 'products',
      variantModal: { isOpen: false, product: null },
      editingStock: null,
      newStockQty: '',
      adjustmentReason: '',
      savingStock: false,
      importFile: null,
      importing: false,
      exporting: false,
      importResult: null,
    });
  });

  it('should initialize with default state', () => {
    const state = useProductPageStore.getState();
    expect(state.products).toEqual([]);
    expect(state.search).toBe('');
    expect(state.activeTab).toBe('products');
    expect(state.loading).toBe(true);
  });

  it('should update search', () => {
    useProductPageStore.getState().setSearch('test');
    expect(useProductPageStore.getState().search).toBe('test');
  });

  it('should update selected category', () => {
    useProductPageStore.getState().setSelectedCategory('cat-1');
    expect(useProductPageStore.getState().selectedCategory).toBe('cat-1');
  });

  it('should handle select all products', () => {
    useProductPageStore.setState({
      products: [
        { id: 'p1' } as any,
        { id: 'p2' } as any,
      ],
    });
    
    useProductPageStore.getState().handleSelectAll(true);
    expect(useProductPageStore.getState().selectedProducts).toEqual(['p1', 'p2']);
    
    useProductPageStore.getState().handleSelectAll(false);
    expect(useProductPageStore.getState().selectedProducts).toEqual([]);
  });

  it('should handle select individual product', () => {
    useProductPageStore.getState().handleSelectProduct('p1', true);
    expect(useProductPageStore.getState().selectedProducts).toContain('p1');
    
    useProductPageStore.getState().handleSelectProduct('p1', false);
    expect(useProductPageStore.getState().selectedProducts).not.toContain('p1');
  });

  it('should open/close variant modal', () => {
    const product = { id: 'p1', name: 'Product 1' } as any;
    
    useProductPageStore.getState().openVariantModal(product);
    expect(useProductPageStore.getState().variantModal.isOpen).toBe(true);
    expect(useProductPageStore.getState().variantModal.product?.id).toBe('p1');
    
    useProductPageStore.getState().closeVariantModal();
    expect(useProductPageStore.getState().variantModal.isOpen).toBe(false);
    expect(useProductPageStore.getState().variantModal.product).toBeNull();
  });

  it('should start editing stock', () => {
    useProductPageStore.getState().startEditingStock('v1', 'c1', 10, { x: 100, y: 200 });
    
    const state = useProductPageStore.getState();
    expect(state.editingStock?.variantId).toBe('v1');
    expect(state.editingStock?.cabangId).toBe('c1');
    expect(state.editingStock?.currentQty).toBe(10);
    expect(state.newStockQty).toBe('10');
  });

  it('should cancel editing stock', () => {
    useProductPageStore.setState({
      editingStock: { variantId: 'v1', cabangId: 'c1', currentQty: 10, position: { x: 0, y: 0 } },
      newStockQty: '15',
      adjustmentReason: 'test',
    });
    
    useProductPageStore.getState().cancelEditingStock();
    expect(useProductPageStore.getState().editingStock).toBeNull();
    expect(useProductPageStore.getState().newStockQty).toBe('');
    expect(useProductPageStore.getState().adjustmentReason).toBe('');
  });

  it('should update stock quantity', () => {
    useProductPageStore.getState().setNewStockQty('25');
    expect(useProductPageStore.getState().newStockQty).toBe('25');
  });

  it('should update adjustment reason', () => {
    useProductPageStore.getState().setAdjustmentReason('Restock');
    expect(useProductPageStore.getState().adjustmentReason).toBe('Restock');
  });

  it('should set active tab', () => {
    useProductPageStore.getState().setActiveTab('import-export');
    expect(useProductPageStore.getState().activeTab).toBe('import-export');
  });

  it('should set import file', () => {
    const file = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    useProductPageStore.getState().setImportFile(file);
    expect(useProductPageStore.getState().importFile).toBe(file);
  });

  it('should clear import file', () => {
    const file = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    useProductPageStore.setState({ importFile: file });
    
    useProductPageStore.getState().setImportFile(null);
    expect(useProductPageStore.getState().importFile).toBeNull();
  });

  it('should set import result', () => {
    const result = { success: true, imported: 5, failed: 1 };
    useProductPageStore.getState().setImportResult(result);
    expect(useProductPageStore.getState().importResult).toEqual(result);
  });
});

