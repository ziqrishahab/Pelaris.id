import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCabangStore } from './useCabangStore';

// Mock API
vi.mock('@/lib/api', () => ({
  cabangAPI: {
    getCabangs: vi.fn().mockResolvedValue({ data: [] }),
    createCabang: vi.fn().mockResolvedValue({ data: {} }),
    updateCabang: vi.fn().mockResolvedValue({ data: {} }),
    deleteCabang: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

describe('useCabangStore', () => {
  beforeEach(() => {
    useCabangStore.setState({
      cabangs: [],
      searchTerm: '',
      showInactive: false,
      loading: true,
      submitting: false,
      formData: { name: '', address: '', phone: '' },
      editingCabangId: null,
    });
  });

  it('should initialize with default state', () => {
    const state = useCabangStore.getState();
    expect(state.cabangs).toEqual([]);
    expect(state.searchTerm).toBe('');
    expect(state.showInactive).toBe(false);
    expect(state.loading).toBe(true);
  });

  it('should update search term', () => {
    useCabangStore.getState().setSearchTerm('main');
    expect(useCabangStore.getState().searchTerm).toBe('main');
  });

  it('should toggle show inactive', () => {
    useCabangStore.getState().setShowInactive(true);
    expect(useCabangStore.getState().showInactive).toBe(true);
  });

  it('should update form data', () => {
    useCabangStore.getState().setFormData({ name: 'New Branch', address: 'Address 123' });
    expect(useCabangStore.getState().formData.name).toBe('New Branch');
    expect(useCabangStore.getState().formData.address).toBe('Address 123');
  });

  it('should reset form', () => {
    useCabangStore.setState({
      formData: { name: 'Test', address: 'Addr', phone: '123' },
      editingCabangId: 'c1',
    });
    
    useCabangStore.getState().resetForm();
    expect(useCabangStore.getState().formData).toEqual({ name: '', address: '', phone: '' });
    expect(useCabangStore.getState().editingCabangId).toBeNull();
  });

  it('should set editing cabang', () => {
    const cabang = {
      id: 'c1',
      name: 'Branch 1',
      address: 'Address 1',
      phone: '123456',
      isActive: true,
      createdAt: '',
    };
    
    useCabangStore.getState().setEditingCabang(cabang);
    expect(useCabangStore.getState().editingCabangId).toBe('c1');
    expect(useCabangStore.getState().formData.name).toBe('Branch 1');
    expect(useCabangStore.getState().formData.address).toBe('Address 1');
  });

  it('should filter cabangs by search term', () => {
    useCabangStore.setState({
      cabangs: [
        { id: 'c1', name: 'Main Branch', address: 'Jakarta', isActive: true, createdAt: '' },
        { id: 'c2', name: 'Sub Branch', address: 'Bandung', isActive: true, createdAt: '' },
      ],
      searchTerm: 'main',
    });
    
    const filtered = useCabangStore.getState().getFilteredCabangs();
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Main Branch');
  });

  it('should filter out inactive cabangs by default', () => {
    useCabangStore.setState({
      cabangs: [
        { id: 'c1', name: 'Active Branch', isActive: true, createdAt: '' },
        { id: 'c2', name: 'Inactive Branch', isActive: false, createdAt: '' },
      ],
      showInactive: false,
    });
    
    const filtered = useCabangStore.getState().getFilteredCabangs();
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Active Branch');
  });

  it('should show inactive cabangs when enabled', () => {
    useCabangStore.setState({
      cabangs: [
        { id: 'c1', name: 'Active Branch', isActive: true, createdAt: '' },
        { id: 'c2', name: 'Inactive Branch', isActive: false, createdAt: '' },
      ],
      showInactive: true,
    });
    
    const filtered = useCabangStore.getState().getFilteredCabangs();
    expect(filtered).toHaveLength(2);
  });
});

