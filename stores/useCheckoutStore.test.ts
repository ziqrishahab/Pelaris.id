import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useCheckoutStore } from './useCheckoutStore';

describe('useCheckoutStore', () => {
  beforeEach(() => {
    // Reset store before each test
    act(() => {
      useCheckoutStore.getState().resetCheckout();
    });
  });

  describe('customer info', () => {
    it('should set customer name', () => {
      const { setCustomerName } = useCheckoutStore.getState();
      
      setCustomerName('John Doe');
      
      expect(useCheckoutStore.getState().customerName).toBe('John Doe');
    });

    it('should set customer phone', () => {
      const { setCustomerPhone } = useCheckoutStore.getState();
      
      setCustomerPhone('08123456789');
      
      expect(useCheckoutStore.getState().customerPhone).toBe('08123456789');
    });
  });

  describe('payment', () => {
    it('should set payment method', () => {
      const { setPaymentMethod } = useCheckoutStore.getState();
      
      setPaymentMethod('TRANSFER');
      
      expect(useCheckoutStore.getState().paymentMethod).toBe('TRANSFER');
    });

    it('should set cash received', () => {
      const { setCashReceived } = useCheckoutStore.getState();
      
      setCashReceived(50000);
      
      expect(useCheckoutStore.getState().cashReceived).toBe(50000);
    });

    it('should set bank name', () => {
      const { setBankName } = useCheckoutStore.getState();
      
      setBankName('BCA');
      
      expect(useCheckoutStore.getState().bankName).toBe('BCA');
    });

    it('should set reference no', () => {
      const { setReferenceNo } = useCheckoutStore.getState();
      
      setReferenceNo('TRX-12345');
      
      expect(useCheckoutStore.getState().referenceNo).toBe('TRX-12345');
    });
  });

  describe('discount', () => {
    it('should set discount amount', () => {
      const { setDiscount } = useCheckoutStore.getState();
      
      setDiscount(5000);
      
      expect(useCheckoutStore.getState().discount).toBe(5000);
    });

    it('should set discount type', () => {
      const { setDiscountType } = useCheckoutStore.getState();
      
      setDiscountType('PERCENTAGE');
      
      expect(useCheckoutStore.getState().discountType).toBe('PERCENTAGE');
    });
  });

  describe('UI states', () => {
    it('should toggle customer info visibility', () => {
      const { setShowCustomerInfo } = useCheckoutStore.getState();
      
      setShowCustomerInfo(true);
      expect(useCheckoutStore.getState().showCustomerInfo).toBe(true);
      
      setShowCustomerInfo(false);
      expect(useCheckoutStore.getState().showCustomerInfo).toBe(false);
    });

    it('should toggle discount visibility', () => {
      const { setShowDiscount } = useCheckoutStore.getState();
      
      setShowDiscount(true);
      expect(useCheckoutStore.getState().showDiscount).toBe(true);
    });

    it('should set processing state', () => {
      const { setProcessing } = useCheckoutStore.getState();
      
      setProcessing(true);
      expect(useCheckoutStore.getState().processing).toBe(true);
    });
  });

  describe('transaction success', () => {
    it('should set transaction success', () => {
      const { setTransactionSuccess } = useCheckoutStore.getState();
      const mockTransaction = { id: 'trx-1', total: 50000 };
      
      setTransactionSuccess(mockTransaction, 60000);
      
      const state = useCheckoutStore.getState();
      expect(state.lastTransaction).toEqual(mockTransaction);
      expect(state.lastCashReceived).toBe(60000);
      expect(state.showSuccess).toBe(true);
      expect(state.processing).toBe(false);
    });

    it('should close success modal', () => {
      const { setTransactionSuccess, closeSuccessModal } = useCheckoutStore.getState();
      
      setTransactionSuccess({ id: 'trx-1' }, 50000);
      closeSuccessModal();
      
      expect(useCheckoutStore.getState().showSuccess).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset all checkout state', () => {
      const state = useCheckoutStore.getState();
      
      // Set some values
      state.setCustomerName('John');
      state.setPaymentMethod('TRANSFER');
      state.setDiscount(5000);
      state.setCashReceived(50000);
      
      // Reset
      state.resetCheckout();
      
      const resetState = useCheckoutStore.getState();
      expect(resetState.customerName).toBe('');
      expect(resetState.paymentMethod).toBe('CASH');
      expect(resetState.discount).toBe(0);
      expect(resetState.cashReceived).toBe(0);
    });
  });

  describe('getCheckoutData', () => {
    it('should return checkout data for API', () => {
      const state = useCheckoutStore.getState();
      
      state.setCustomerName('John Doe');
      state.setCustomerPhone('08123');
      state.setPaymentMethod('TRANSFER');
      state.setDiscount(10);
      state.setDiscountType('PERCENTAGE');
      state.setBankName('BCA');
      state.setReferenceNo('REF-123');
      
      const data = useCheckoutStore.getState().getCheckoutData();
      
      expect(data).toEqual({
        customerName: 'John Doe',
        customerPhone: '08123',
        paymentMethod: 'TRANSFER',
        discount: 10,
        discountType: 'PERCENTAGE',
        bankName: 'BCA',
        referenceNo: 'REF-123',
      });
    });
  });
});

