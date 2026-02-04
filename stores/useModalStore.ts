import { create } from 'zustand';

type ModalType = 'create' | 'edit' | 'delete' | 'detail' | 'confirm' | null;

interface ModalState<T = any> {
  // Modal state
  isOpen: boolean;
  type: ModalType;
  data: T | null;
  
  // Form state
  isSubmitting: boolean;
  error: string | null;
  
  // Actions
  openModal: (type: ModalType, data?: T) => void;
  closeModal: () => void;
  setSubmitting: (isSubmitting: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

// Generic modal store factory
export function createModalStore<T = unknown>() {
  return create<ModalState<T>>()((set) => ({
    isOpen: false,
    type: null,
    data: null,
    isSubmitting: false,
    error: null,
    
    openModal: (type, data) => set({ 
      isOpen: true, 
      type, 
      data: (data ?? null) as T | null,
      error: null 
    }),
    
    closeModal: () => set({ 
      isOpen: false, 
      type: null, 
      data: null,
      error: null 
    }),
    
    setSubmitting: (isSubmitting) => set({ isSubmitting }),
    
    setError: (error) => set({ error }),
    
    reset: () => set({
      isOpen: false,
      type: null,
      data: null,
      isSubmitting: false,
      error: null,
    }),
  }));
}

// Pre-configured modal stores for common entities
export const useUserModalStore = createModalStore<{
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  cabangId?: string;
}>();

export const useProductModalStore = createModalStore<{
  id?: string;
  name?: string;
  categoryId?: string;
  productType?: string;
}>();

export const useCategoryModalStore = createModalStore<{
  id?: string;
  name?: string;
}>();

export const useBranchModalStore = createModalStore<{
  id?: string;
  name?: string;
  address?: string;
  phone?: string;
}>();

// Confirmation dialog store
interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
  variant: 'danger' | 'warning' | 'default';
  onConfirm: (() => void) | (() => Promise<void>);
  isLoading: boolean;
  
  show: (options: {
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'default';
    onConfirm: (() => void) | (() => Promise<void>);
  }) => void;
  hide: () => void;
  setLoading: (isLoading: boolean) => void;
}

export const useConfirmDialogStore = create<ConfirmDialogState>()((set) => ({
  isOpen: false,
  title: '',
  description: '',
  confirmText: 'Konfirmasi',
  cancelText: 'Batal',
  variant: 'default',
  onConfirm: () => {},
  isLoading: false,
  
  show: ({ title, description, confirmText, cancelText, variant, onConfirm }) => set({
    isOpen: true,
    title,
    description,
    confirmText: confirmText || 'Konfirmasi',
    cancelText: cancelText || 'Batal',
    variant: variant || 'default',
    onConfirm,
    isLoading: false,
  }),
  
  hide: () => set({
    isOpen: false,
    isLoading: false,
  }),
  
  setLoading: (isLoading) => set({ isLoading }),
}));

