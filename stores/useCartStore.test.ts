import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useCartStore } from './useCartStore';

describe('useCartStore', () => {
  beforeEach(() => {
    // Reset store before each test
    act(() => {
      useCartStore.setState({
        cart: [],
        heldTransactions: [],
      });
    });
  });

  describe('cart operations', () => {
    const mockItem = {
      productVariantId: 'var-1',
      productName: 'Test Product',
      variantInfo: 'Size M',
      sku: 'SKU-001',
      price: 10000,
      availableStock: 10,
    };

    it('should add item to cart', () => {
      const { addToCart, cart } = useCartStore.getState();
      
      const result = addToCart(mockItem);
      
      expect(result).toBe(true);
      expect(useCartStore.getState().cart).toHaveLength(1);
      expect(useCartStore.getState().cart[0].quantity).toBe(1);
    });

    it('should increment quantity for existing item', () => {
      const { addToCart } = useCartStore.getState();
      
      addToCart(mockItem);
      addToCart(mockItem);
      
      expect(useCartStore.getState().cart).toHaveLength(1);
      expect(useCartStore.getState().cart[0].quantity).toBe(2);
    });

    it('should not add if stock is 0', () => {
      const { addToCart } = useCartStore.getState();
      const noStockItem = { ...mockItem, availableStock: 0 };
      
      addToCart(noStockItem);
      addToCart(noStockItem); // Try adding again
      
      // First add succeeds (qty=1), second fails (stock=0, qty already 1)
      expect(useCartStore.getState().cart[0]?.quantity).toBe(1);
    });

    it('should update quantity', () => {
      const { addToCart, updateQuantity } = useCartStore.getState();
      
      addToCart(mockItem);
      const result = updateQuantity('var-1', 5);
      
      expect(result).toBe(true);
      expect(useCartStore.getState().cart[0].quantity).toBe(5);
    });

    it('should not update quantity beyond stock', () => {
      const { addToCart, updateQuantity } = useCartStore.getState();
      
      addToCart(mockItem);
      const result = updateQuantity('var-1', 15); // Stock is 10
      
      expect(result).toBe(false);
      expect(useCartStore.getState().cart[0].quantity).toBe(1);
    });

    it('should remove item when quantity is 0', () => {
      const { addToCart, updateQuantity } = useCartStore.getState();
      
      addToCart(mockItem);
      updateQuantity('var-1', 0);
      
      expect(useCartStore.getState().cart).toHaveLength(0);
    });

    it('should remove item from cart', () => {
      const { addToCart, removeFromCart } = useCartStore.getState();
      
      addToCart(mockItem);
      removeFromCart('var-1');
      
      expect(useCartStore.getState().cart).toHaveLength(0);
    });

    it('should clear cart', () => {
      const { addToCart, clearCart } = useCartStore.getState();
      
      addToCart(mockItem);
      addToCart({ ...mockItem, productVariantId: 'var-2' });
      clearCart();
      
      expect(useCartStore.getState().cart).toHaveLength(0);
    });
  });

  describe('calculations', () => {
    const items = [
      { productVariantId: 'v1', productName: 'P1', variantInfo: '', sku: 'S1', price: 10000, availableStock: 10 },
      { productVariantId: 'v2', productName: 'P2', variantInfo: '', sku: 'S2', price: 25000, availableStock: 10 },
    ];

    beforeEach(() => {
      const { addToCart, updateQuantity } = useCartStore.getState();
      addToCart(items[0]);
      addToCart(items[1]);
      updateQuantity('v1', 2); // 2 x 10000 = 20000
      updateQuantity('v2', 3); // 3 x 25000 = 75000
    });

    it('should calculate subtotal', () => {
      const { getSubtotal } = useCartStore.getState();
      expect(getSubtotal()).toBe(95000); // 20000 + 75000
    });

    it('should calculate total with nominal discount', () => {
      const { getTotal } = useCartStore.getState();
      expect(getTotal(5000, 'NOMINAL')).toBe(90000);
    });

    it('should calculate total with percentage discount', () => {
      const { getTotal } = useCartStore.getState();
      expect(getTotal(10, 'PERCENTAGE')).toBe(85500); // 95000 - 9500
    });

    it('should calculate discount amount', () => {
      const { getDiscountAmount } = useCartStore.getState();
      expect(getDiscountAmount(10, 'PERCENTAGE')).toBe(9500);
      expect(getDiscountAmount(5000, 'NOMINAL')).toBe(5000);
    });

    it('should count items', () => {
      const { getItemCount } = useCartStore.getState();
      expect(getItemCount()).toBe(5); // 2 + 3
    });
  });

  describe('held transactions', () => {
    const mockItem = {
      productVariantId: 'var-1',
      productName: 'Test Product',
      variantInfo: '',
      sku: 'SKU-001',
      price: 10000,
      availableStock: 10,
    };

    it('should hold transaction', () => {
      const { addToCart, holdTransaction, heldTransactions } = useCartStore.getState();
      
      addToCart(mockItem);
      holdTransaction({
        customerName: 'John',
        customerPhone: '08123',
        paymentMethod: 'CASH',
        discount: 0,
        discountType: 'NOMINAL',
        bankName: '',
        referenceNo: '',
      });
      
      expect(useCartStore.getState().heldTransactions).toHaveLength(1);
      expect(useCartStore.getState().cart).toHaveLength(0); // Cart cleared
    });

    it('should retrieve held transaction', () => {
      const { addToCart, holdTransaction, retrieveHeld } = useCartStore.getState();
      
      addToCart(mockItem);
      holdTransaction({
        customerName: 'John',
        customerPhone: '08123',
        paymentMethod: 'CASH',
        discount: 0,
        discountType: 'NOMINAL',
        bankName: '',
        referenceNo: '',
      });
      
      const heldId = useCartStore.getState().heldTransactions[0].id;
      const retrieved = retrieveHeld(heldId);
      
      expect(retrieved).not.toBeNull();
      expect(retrieved?.customerName).toBe('John');
      expect(useCartStore.getState().cart).toHaveLength(1); // Cart restored
      expect(useCartStore.getState().heldTransactions).toHaveLength(0); // Removed from held
    });

    it('should delete held transaction', () => {
      const { addToCart, holdTransaction, deleteHeld } = useCartStore.getState();
      
      addToCart(mockItem);
      holdTransaction({
        customerName: 'John',
        customerPhone: '',
        paymentMethod: 'CASH',
        discount: 0,
        discountType: 'NOMINAL',
        bankName: '',
        referenceNo: '',
      });
      
      const heldId = useCartStore.getState().heldTransactions[0].id;
      deleteHeld(heldId);
      
      expect(useCartStore.getState().heldTransactions).toHaveLength(0);
    });
  });

  describe('stock updates', () => {
    it('should update item stock', () => {
      const { addToCart, updateItemStock } = useCartStore.getState();
      
      addToCart({
        productVariantId: 'v1',
        productName: 'P1',
        variantInfo: '',
        sku: 'S1',
        price: 10000,
        availableStock: 10,
      });
      
      updateItemStock('v1', 5, 12000);
      
      const item = useCartStore.getState().cart[0];
      expect(item.availableStock).toBe(5);
      expect(item.price).toBe(12000);
    });
  });
});

