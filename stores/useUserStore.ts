import { create } from 'zustand';
import { authAPI } from '@/lib/api';
import { logger } from '@/lib/logger';

type UserRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'KASIR';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  hasMultiCabangAccess: boolean;
  createdAt: string;
  cabang?: { id: string; name: string };
}

interface UserForm {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  cabangId: string;
  hasMultiCabangAccess: boolean;
}

interface UserState {
  // Data
  users: User[];
  
  // Filters
  searchTerm: string;
  roleFilter: string;
  
  // UI State
  loading: boolean;
  submitting: boolean;
  
  // Form
  formData: UserForm;
  editingUserId: string | null;
  showModal: boolean;
  
  // Actions
  setUsers: (users: User[]) => void;
  setSearchTerm: (term: string) => void;
  setRoleFilter: (role: string) => void;
  setLoading: (loading: boolean) => void;
  setSubmitting: (submitting: boolean) => void;
  setShowModal: (show: boolean) => void;
  
  // Form actions
  setFormData: (data: Partial<UserForm>) => void;
  resetForm: () => void;
  setEditingUser: (user: User | null) => void;
  
  // API actions
  fetchUsers: () => Promise<void>;
  createUser: (data: UserForm) => Promise<boolean>;
  updateUser: (id: string, data: Partial<UserForm>) => Promise<boolean>;
  toggleUserStatus: (id: string, isActive: boolean) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
}

const defaultForm: UserForm = {
  name: '',
  email: '',
  password: '',
  role: 'KASIR',
  cabangId: '',
  hasMultiCabangAccess: false,
};

export const useUserStore = create<UserState>()((set, get) => ({
  // Initial data
  users: [],
  
  // Initial filters
  searchTerm: '',
  roleFilter: '',
  
  // Initial UI state
  loading: true,
  submitting: false,
  
  // Form
  formData: defaultForm,
  editingUserId: null,
  showModal: false,
  
  // Setters
  setUsers: (users) => set({ users }),
  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setRoleFilter: (roleFilter) => set({ roleFilter }),
  setLoading: (loading) => set({ loading }),
  setSubmitting: (submitting) => set({ submitting }),
  setShowModal: (showModal) => set({ showModal }),
  
  // Form actions
  setFormData: (data) => set((state) => ({
    formData: { ...state.formData, ...data }
  })),
  
  resetForm: () => set({ formData: defaultForm, editingUserId: null }),
  
  setEditingUser: (user) => {
    if (user) {
      set({
        editingUserId: user.id,
        formData: {
          name: user.name,
          email: user.email,
          password: '',
          role: user.role,
          cabangId: user.cabang?.id || '',
          hasMultiCabangAccess: user.hasMultiCabangAccess || false,
        }
      });
    } else {
      get().resetForm();
    }
  },
  
  // API actions
  fetchUsers: async () => {
    set({ loading: true });
    try {
      const res = await authAPI.getUsers();
      const users = Array.isArray(res.data) ? res.data : [];
      set({ users, loading: false });
    } catch (error) {
      logger.error('Error fetching users:', error);
      set({ loading: false });
    }
  },
  
  createUser: async (data) => {
    set({ submitting: true });
    try {
      await authAPI.createUser(data as any);
      set({ submitting: false });
      get().fetchUsers();
      get().resetForm();
      return true;
    } catch (error) {
      logger.error('Error creating user:', error);
      set({ submitting: false });
      return false;
    }
  },
  
  updateUser: async (id, data) => {
    set({ submitting: true });
    try {
      await authAPI.updateUser(id, data as any);
      set({ submitting: false });
      get().fetchUsers();
      get().resetForm();
      return true;
    } catch (error) {
      logger.error('Error updating user:', error);
      set({ submitting: false });
      return false;
    }
  },
  
  toggleUserStatus: async (id, isActive) => {
    try {
      await authAPI.updateUser(id, { isActive } as any);
      get().fetchUsers();
      return true;
    } catch (error) {
      logger.error('Error toggling user status:', error);
      return false;
    }
  },
  
  deleteUser: async (id) => {
    set({ submitting: true });
    try {
      await authAPI.deleteUser(id);
      set({ submitting: false });
      get().fetchUsers();
      return true;
    } catch (error) {
      logger.error('Error deleting user:', error);
      set({ submitting: false });
      return false;
    }
  },
}));

