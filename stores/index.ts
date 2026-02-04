// Export all stores
export { useCartStore } from './useCartStore';
export { useCheckoutStore } from './useCheckoutStore';
export { useProductStore } from './useProductStore';
export { useCommonStore } from './useCommonStore';
export { useFilterStore } from './useFilterStore';
export { 
  createModalStore,
  useUserModalStore,
  useProductModalStore,
  useCategoryModalStore,
  useBranchModalStore,
  useConfirmDialogStore,
} from './useModalStore';

// Domain-specific stores for dashboard pages
export { useStockStore } from './useStockStore';
export { useTransferStore } from './useTransferStore';
export { useStockOpnameStore } from './useStockOpnameStore';
export { useUserStore } from './useUserStore';
export { useCabangStore } from './useCabangStore';
export { useCategoryStore } from './useCategoryStore';
export { useProductPageStore } from './useProductPageStore';

// Re-export types
export type { CartItem, HeldTransaction } from './useCartStore';
export type { PaymentMethod, DiscountType } from './useCheckoutStore';

