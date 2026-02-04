import { create } from 'zustand';

export type PaymentMethod = 'CASH' | 'DEBIT' | 'TRANSFER' | 'QRIS';
export type DiscountType = 'NOMINAL' | 'PERCENTAGE';

interface CheckoutState {
  // Customer info
  customerName: string;
  customerPhone: string;
  
  // Payment
  paymentMethod: PaymentMethod;
  cashReceived: number;
  bankName: string;
  referenceNo: string;
  
  // Discount
  discount: number;
  discountType: DiscountType;
  
  // UI States
  showCustomerInfo: boolean;
  showDiscount: boolean;
  processing: boolean;
  
  // Last transaction (for success modal)
  lastTransaction: any | null;
  lastCashReceived: number;
  showSuccess: boolean;
  
  // Actions
  setCustomerName: (name: string) => void;
  setCustomerPhone: (phone: string) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setCashReceived: (amount: number) => void;
  setBankName: (name: string) => void;
  setReferenceNo: (ref: string) => void;
  setDiscount: (amount: number) => void;
  setDiscountType: (type: DiscountType) => void;
  setShowCustomerInfo: (show: boolean) => void;
  setShowDiscount: (show: boolean) => void;
  setProcessing: (processing: boolean) => void;
  
  // Transaction result
  setTransactionSuccess: (transaction: any, cashReceived: number) => void;
  closeSuccessModal: () => void;
  
  // Reset
  resetCheckout: () => void;
  
  // Get checkout data for API
  getCheckoutData: () => {
    customerName: string;
    customerPhone: string;
    paymentMethod: PaymentMethod;
    discount: number;
    discountType: DiscountType;
    bankName: string;
    referenceNo: string;
  };
}

const initialState = {
  customerName: '',
  customerPhone: '',
  paymentMethod: 'CASH' as PaymentMethod,
  cashReceived: 0,
  bankName: '',
  referenceNo: '',
  discount: 0,
  discountType: 'NOMINAL' as DiscountType,
  showCustomerInfo: false,
  showDiscount: false,
  processing: false,
  lastTransaction: null,
  lastCashReceived: 0,
  showSuccess: false,
};

export const useCheckoutStore = create<CheckoutState>()((set, get) => ({
  ...initialState,

  setCustomerName: (name) => set({ customerName: name }),
  setCustomerPhone: (phone) => set({ customerPhone: phone }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setCashReceived: (amount) => set({ cashReceived: amount }),
  setBankName: (name) => set({ bankName: name }),
  setReferenceNo: (ref) => set({ referenceNo: ref }),
  setDiscount: (amount) => set({ discount: amount }),
  setDiscountType: (type) => set({ discountType: type }),
  setShowCustomerInfo: (show) => set({ showCustomerInfo: show }),
  setShowDiscount: (show) => set({ showDiscount: show }),
  setProcessing: (processing) => set({ processing }),

  setTransactionSuccess: (transaction, cashReceived) => set({
    lastTransaction: transaction,
    lastCashReceived: cashReceived,
    showSuccess: true,
    processing: false,
  }),

  closeSuccessModal: () => set({ showSuccess: false }),

  resetCheckout: () => set({
    customerName: '',
    customerPhone: '',
    paymentMethod: 'CASH',
    cashReceived: 0,
    bankName: '',
    referenceNo: '',
    discount: 0,
    discountType: 'NOMINAL',
    showCustomerInfo: false,
    showDiscount: false,
    processing: false,
  }),

  getCheckoutData: () => {
    const state = get();
    return {
      customerName: state.customerName,
      customerPhone: state.customerPhone,
      paymentMethod: state.paymentMethod,
      discount: state.discount,
      discountType: state.discountType,
      bankName: state.bankName,
      referenceNo: state.referenceNo,
    };
  },
}));

