// Types for POS components - matches actual store interfaces

export interface CartItem {
  productVariantId: string;
  productName: string;
  variantInfo: string;
  sku: string;
  price: number;
  quantity: number;
  availableStock: number;
}

export interface HeldTransaction {
  id: string;
  cart: CartItem[];
  customerName: string;
  customerPhone: string;
  paymentMethod: PaymentMethod;
  discount: number;
  discountType: DiscountType;
  bankName: string;
  referenceNo: string;
  timestamp: Date;
}

export interface ConfirmState {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  confirmVariant?: 'default' | 'danger' | 'warning';
  onConfirm: () => void;
}

export interface PrinterSettings {
  autoPrintEnabled: boolean;
  printerName: string;
  paperWidth: number;
  storeName: string;
  branchName: string;
  address: string;
  phone: string;
  footerText1: string;
  footerText2: string;
}

export interface ProductVariantStock {
  cabangId: string;
  quantity: number;
  price: number;
}

export interface ProductVariant {
  id: string;
  sku: string;
  variantName: string;
  variantValue: string;
  stocks?: ProductVariantStock[];
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  productType: 'SINGLE' | 'VARIANT';
  category?: { name: string };
  variants?: ProductVariant[];
}

export interface Branch {
  id: string;
  name: string;
}

// Re-export User from lib/auth to avoid type mismatch
export type { User } from '@/lib/auth';

export type PaymentMethod = 'CASH' | 'DEBIT' | 'TRANSFER' | 'QRIS';
export type DiscountType = 'NOMINAL' | 'PERCENTAGE';

export interface NewProductRequest {
  name: string;
  categoryId: string;
  productType: 'SINGLE' | 'VARIANT';
}

export interface Category {
  id: string;
  name: string;
}

export interface ToastType {
  success: (msg: string) => void;
  error: (msg: string) => void;
  warning: (msg: string) => void;
  info: (msg: string) => void;
}
