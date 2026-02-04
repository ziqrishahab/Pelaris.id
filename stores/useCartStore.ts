import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  paymentMethod: 'CASH' | 'DEBIT' | 'TRANSFER' | 'QRIS';
  discount: number;
  discountType: 'NOMINAL' | 'PERCENTAGE';
  bankName: string;
  referenceNo: string;
  timestamp: Date;
}

interface CartState {
  // Cart items
  cart: CartItem[];
  
  // Held transactions
  heldTransactions: HeldTransaction[];
  
  // Actions
  addToCart: (item: Omit<CartItem, 'quantity'>) => boolean;
  updateQuantity: (variantId: string, quantity: number) => boolean;
  removeFromCart: (variantId: string) => void;
  clearCart: () => void;
  
  // Held transaction actions
  holdTransaction: (transaction: Omit<HeldTransaction, 'id' | 'timestamp' | 'cart'>) => void;
  retrieveHeld: (id: string) => HeldTransaction | null;
  deleteHeld: (id: string) => void;
  clearAllHeld: () => void;
  
  // Stock update (from WebSocket)
  updateItemStock: (variantId: string, newStock: number, newPrice?: number) => void;
  
  // Calculations
  getSubtotal: () => number;
  getTotal: (discount: number, discountType: 'NOMINAL' | 'PERCENTAGE') => number;
  getDiscountAmount: (discount: number, discountType: 'NOMINAL' | 'PERCENTAGE') => number;
  getItemCount: () => number;
  getCartItemByVariantId: (variantId: string) => CartItem | undefined;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: [],
      heldTransactions: [],

      addToCart: (item) => {
        const { cart } = get();
        const existing = cart.find((i) => i.productVariantId === item.productVariantId);
        
        if (existing) {
          // Check stock
          if (existing.quantity >= item.availableStock) {
            return false; // Stock not sufficient
          }
          set({
            cart: cart.map((i) =>
              i.productVariantId === item.productVariantId
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          });
        } else {
          set({ cart: [...cart, { ...item, quantity: 1 }] });
        }
        return true;
      },

      updateQuantity: (variantId, quantity) => {
        const { cart, removeFromCart } = get();
        const item = cart.find((i) => i.productVariantId === variantId);
        
        if (!item) return false;
        if (quantity <= 0) {
          removeFromCart(variantId);
          return true;
        }
        if (quantity > item.availableStock) {
          return false; // Stock not sufficient
        }
        
        set({
          cart: cart.map((i) =>
            i.productVariantId === variantId ? { ...i, quantity } : i
          ),
        });
        return true;
      },

      removeFromCart: (variantId) => {
        set((state) => ({
          cart: state.cart.filter((item) => item.productVariantId !== variantId),
        }));
      },

      clearCart: () => set({ cart: [] }),

      holdTransaction: (transaction) => {
        const { cart, heldTransactions, clearCart } = get();
        if (cart.length === 0) return;
        
        const held: HeldTransaction = {
          id: Date.now().toString(),
          cart: [...cart],
          ...transaction,
          timestamp: new Date(),
        };
        
        set({ heldTransactions: [...heldTransactions, held] });
        clearCart();
      },

      retrieveHeld: (id) => {
        const { heldTransactions } = get();
        const held = heldTransactions.find((t) => t.id === id);
        
        if (held) {
          set({
            cart: held.cart,
            heldTransactions: heldTransactions.filter((t) => t.id !== id),
          });
          return held;
        }
        return null;
      },

      deleteHeld: (id) => {
        set((state) => ({
          heldTransactions: state.heldTransactions.filter((t) => t.id !== id),
        }));
      },

      clearAllHeld: () => set({ heldTransactions: [] }),

      updateItemStock: (variantId, newStock, newPrice) => {
        set((state) => ({
          cart: state.cart.map((item) =>
            item.productVariantId === variantId
              ? { 
                  ...item, 
                  availableStock: newStock,
                  ...(newPrice !== undefined && { price: newPrice })
                }
              : item
          ),
        }));
      },

      getSubtotal: () => {
        const { cart } = get();
        return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },

      getTotal: (discount, discountType) => {
        const subtotal = get().getSubtotal();
        const discountAmount = discountType === 'PERCENTAGE' 
          ? (subtotal * discount) / 100 
          : discount;
        return subtotal - discountAmount;
      },

      getDiscountAmount: (discount, discountType) => {
        const subtotal = get().getSubtotal();
        return discountType === 'PERCENTAGE' 
          ? (subtotal * discount) / 100 
          : discount;
      },

      getItemCount: () => {
        const { cart } = get();
        return cart.reduce((sum, item) => sum + item.quantity, 0);
      },

      getCartItemByVariantId: (variantId) => {
        const { cart } = get();
        return cart.find((item) => item.productVariantId === variantId);
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ 
        heldTransactions: state.heldTransactions 
      }), // Only persist held transactions
    }
  )
);

