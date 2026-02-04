import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCategoryStore } from './useCategoryStore';

// Mock API
vi.mock('@/lib/api', () => ({
  categoriesAPI: {
    getCategories: vi.fn().mockResolvedValue({ data: [] }),
    createCategory: vi.fn().mockResolvedValue({ data: {} }),
    updateCategory: vi.fn().mockResolvedValue({ data: {} }),
    deleteCategory: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

describe('useCategoryStore', () => {
  beforeEach(() => {
    useCategoryStore.setState({
      categories: [],
      searchTerm: '',
      showInactive: false,
      loading: true,
      submitting: false,
      formData: { name: '', description: '' },
      editingCategoryId: null,
    });
  });

  it('should initialize with default state', () => {
    const state = useCategoryStore.getState();
    expect(state.categories).toEqual([]);
    expect(state.searchTerm).toBe('');
    expect(state.showInactive).toBe(false);
    expect(state.loading).toBe(true);
  });

  it('should update search term', () => {
    useCategoryStore.getState().setSearchTerm('food');
    expect(useCategoryStore.getState().searchTerm).toBe('food');
  });

  it('should toggle show inactive', () => {
    useCategoryStore.getState().setShowInactive(true);
    expect(useCategoryStore.getState().showInactive).toBe(true);
  });

  it('should update form data', () => {
    useCategoryStore.getState().setFormData({ name: 'New Category', description: 'Desc' });
    expect(useCategoryStore.getState().formData.name).toBe('New Category');
    expect(useCategoryStore.getState().formData.description).toBe('Desc');
  });

  it('should reset form', () => {
    useCategoryStore.setState({
      formData: { name: 'Test', description: 'Test Desc' },
      editingCategoryId: 'cat1',
    });
    
    useCategoryStore.getState().resetForm();
    expect(useCategoryStore.getState().formData).toEqual({ name: '', description: '' });
    expect(useCategoryStore.getState().editingCategoryId).toBeNull();
  });

  it('should set editing category', () => {
    const category = {
      id: 'cat1',
      name: 'Food',
      description: 'Food items',
      isActive: true,
      createdAt: '',
    };
    
    useCategoryStore.getState().setEditingCategory(category);
    expect(useCategoryStore.getState().editingCategoryId).toBe('cat1');
    expect(useCategoryStore.getState().formData.name).toBe('Food');
    expect(useCategoryStore.getState().formData.description).toBe('Food items');
  });

  it('should filter categories by search term', () => {
    useCategoryStore.setState({
      categories: [
        { id: 'c1', name: 'Food', description: 'Food items', isActive: true, createdAt: '' },
        { id: 'c2', name: 'Drinks', description: 'Beverages', isActive: true, createdAt: '' },
      ],
      searchTerm: 'food',
    });
    
    const filtered = useCategoryStore.getState().getFilteredCategories();
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Food');
  });

  it('should filter out inactive categories by default', () => {
    useCategoryStore.setState({
      categories: [
        { id: 'c1', name: 'Active', isActive: true, createdAt: '' },
        { id: 'c2', name: 'Inactive', isActive: false, createdAt: '' },
      ],
      showInactive: false,
    });
    
    const filtered = useCategoryStore.getState().getFilteredCategories();
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Active');
  });

  it('should show inactive categories when enabled', () => {
    useCategoryStore.setState({
      categories: [
        { id: 'c1', name: 'Active', isActive: true, createdAt: '' },
        { id: 'c2', name: 'Inactive', isActive: false, createdAt: '' },
      ],
      showInactive: true,
    });
    
    const filtered = useCategoryStore.getState().getFilteredCategories();
    expect(filtered).toHaveLength(2);
  });

  it('should search by description', () => {
    useCategoryStore.setState({
      categories: [
        { id: 'c1', name: 'Food', description: 'Makanan Indonesia', isActive: true, createdAt: '' },
        { id: 'c2', name: 'Drinks', description: 'Beverages', isActive: true, createdAt: '' },
      ],
      searchTerm: 'indonesia',
    });
    
    const filtered = useCategoryStore.getState().getFilteredCategories();
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Food');
  });
});

