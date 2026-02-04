import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useUserStore } from './useUserStore';

// Mock API
vi.mock('@/lib/api', () => ({
  usersAPI: {
    getUsers: vi.fn().mockResolvedValue({ data: [] }),
    createUser: vi.fn().mockResolvedValue({ data: {} }),
    updateUser: vi.fn().mockResolvedValue({ data: {} }),
    deleteUser: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

describe('useUserStore', () => {
  beforeEach(() => {
    useUserStore.setState({
      users: [],
      searchTerm: '',
      roleFilter: '',
      loading: true,
      submitting: false,
      formData: { name: '', email: '', password: '', role: 'KASIR', cabangId: '', hasMultiCabangAccess: false },
      editingUserId: null,
    });
  });

  it('should initialize with default state', () => {
    const state = useUserStore.getState();
    expect(state.users).toEqual([]);
    expect(state.searchTerm).toBe('');
    expect(state.formData.role).toBe('KASIR');
    expect(state.loading).toBe(true);
  });

  it('should update search term', () => {
    useUserStore.getState().setSearchTerm('admin');
    expect(useUserStore.getState().searchTerm).toBe('admin');
  });

  it('should update role filter', () => {
    useUserStore.getState().setRoleFilter('OWNER');
    expect(useUserStore.getState().roleFilter).toBe('OWNER');
  });

  it('should update form data', () => {
    useUserStore.getState().setFormData({ name: 'John', email: 'john@test.com' });
    expect(useUserStore.getState().formData.name).toBe('John');
    expect(useUserStore.getState().formData.email).toBe('john@test.com');
  });

  it('should reset form', () => {
    useUserStore.setState({
      formData: { name: 'John', email: 'john@test.com', password: '123', role: 'ADMIN', cabangId: 'c1', hasMultiCabangAccess: true },
      editingUserId: 'u1',
    });
    
    useUserStore.getState().resetForm();
    expect(useUserStore.getState().formData).toEqual({ name: '', email: '', password: '', role: 'KASIR', cabangId: '', hasMultiCabangAccess: false });
    expect(useUserStore.getState().editingUserId).toBeNull();
  });

  it('should set editing user', () => {
    const user = {
      id: 'u1',
      name: 'John',
      email: 'john@test.com',
      role: 'ADMIN' as const,
      isActive: true,
      hasMultiCabangAccess: false,
      createdAt: '',
      cabang: { id: 'c1', name: 'Branch 1' },
    };
    
    useUserStore.getState().setEditingUser(user);
    expect(useUserStore.getState().editingUserId).toBe('u1');
    expect(useUserStore.getState().formData.name).toBe('John');
    expect(useUserStore.getState().formData.email).toBe('john@test.com');
    expect(useUserStore.getState().formData.role).toBe('ADMIN');
  });

  it('should clear editing user', () => {
    useUserStore.setState({ editingUserId: 'u1' });
    useUserStore.getState().setEditingUser(null);
    expect(useUserStore.getState().editingUserId).toBeNull();
  });

  it('should set users', () => {
    const users = [
      { id: 'u1', name: 'John', email: 'john@test.com', role: 'ADMIN' as const, isActive: true, hasMultiCabangAccess: false, createdAt: '' },
    ];
    useUserStore.getState().setUsers(users);
    expect(useUserStore.getState().users).toEqual(users);
  });

  it('should set loading state', () => {
    useUserStore.getState().setLoading(false);
    expect(useUserStore.getState().loading).toBe(false);
  });
});

