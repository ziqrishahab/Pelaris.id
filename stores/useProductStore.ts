import { create } from 'zustand';
import { productsAPI, cabangAPI, settingsAPI, categoriesAPI } from '@/lib/api';
import { logger } from '@/lib/logger';

interface Product {
  id: string;
  name: string;
  productType: 'SINGLE' | 'VARIANT';
  category?: { id: string; name: string };
  variants?: ProductVariant[];
  [key: string]: any;
}

interface ProductVariant {
  id: string;
  sku: string;
  variantName: string;
  variantValue: string;
  stocks?: Stock[];
  [key: string]: any;
}

interface Stock {
  cabangId: string;
  quantity: number;
  price: number;
}

interface Branch {
  id: string;
  name: string;
  isActive: boolean;
  [key: string]: any;
}

interface Category {
  id: string;
  name: string;
  [key: string]: any;
}

interface ProductState {
  // Data
  products: Product[];
  branches: Branch[];
  categories: Category[];
  
  // Selected branch
  selectedCabangId: string;
  
  // Search
  search: string;
  
  // Loading states
  loading: boolean;
  
  // Settings
  adminWhatsApp: string;
  
  // Actions
  setProducts: (products: Product[]) => void;
  setBranches: (branches: Branch[]) => void;
  setCategories: (categories: Category[]) => void;
  setSelectedCabangId: (id: string) => void;
  setSearch: (search: string) => void;
  setLoading: (loading: boolean) => void;
  setAdminWhatsApp: (phone: string) => void;
  
  // Fetch actions
  fetchProducts: (cabangId: string) => Promise<void>;
  fetchBranches: () => Promise<Branch[]>;
  fetchCategories: () => Promise<void>;
  fetchSettings: () => Promise<void>;
  
  // Product updates (from WebSocket)
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  updateStock: (cabangId: string, variantId: string, quantity: number, price?: number) => void;
  
  // Filtered products (client-side search)
  getFilteredProducts: () => Product[];
  
  // Helpers
  getStockForVariant: (variant: ProductVariant, cabangId: string) => Stock | undefined;
}

export const useProductStore = create<ProductState>()((set, get) => ({
  products: [],
  branches: [],
  categories: [],
  selectedCabangId: '',
  search: '',
  loading: true,
  adminWhatsApp: '6282112406540',

  setProducts: (products) => set({ products }),
  setBranches: (branches) => set({ branches }),
  setCategories: (categories) => set({ categories }),
  setSelectedCabangId: (id) => {
    set({ selectedCabangId: id });
    if (typeof window !== 'undefined') {
      localStorage.setItem('activeCabangId', id);
    }
  },
  setSearch: (search) => set({ search }),
  setLoading: (loading) => set({ loading }),
  setAdminWhatsApp: (phone) => set({ adminWhatsApp: phone }),

  fetchProducts: async (cabangId) => {
    try {
      set({ loading: true });
      const res = await productsAPI.getProducts({ isActive: true });
      // Backend returns paginated response: { data: [...], pagination: {...} }
      const productsData = res.data.data || res.data;
      
      if (cabangId) {
        const filtered = productsData.filter((product: Product) => {
          if (product.productType === 'SINGLE') {
            const v = product.variants?.[0];
            return v?.stocks?.some((s) => s.cabangId === cabangId);
          }
          return product.variants?.some((variant) =>
            variant.stocks?.some((s) => s.cabangId === cabangId)
          );
        });
        set({ products: filtered });
      } else {
        set({ products: productsData });
      }
    } catch (e) {
      logger.error('Failed to fetch products:', e);
    } finally {
      set({ loading: false });
    }
  },

  fetchBranches: async () => {
    try {
      const res = await cabangAPI.getCabangs();
      const activeBranches = res.data.filter((b: Branch) => b.isActive);
      set({ branches: activeBranches });
      return activeBranches;
    } catch (e) {
      logger.error('Failed to fetch branches:', e);
      return [];
    }
  },

  fetchCategories: async () => {
    try {
      const res = await categoriesAPI.getCategories();
      set({ categories: res.data });
    } catch (e) {
      logger.error('Failed to fetch categories:', e);
    }
  },

  fetchSettings: async () => {
    try {
      const res = await settingsAPI.getSettings();
      set({ adminWhatsApp: res.data.adminWhatsApp || '6282112406540' });
    } catch (e) {
      logger.error('Failed to fetch settings:', e);
    }
  },

  updateProduct: (product) => {
    set((state) => ({
      products: state.products.map((p) => (p.id === product.id ? product : p)),
    }));
  },

  deleteProduct: (productId) => {
    set((state) => ({
      products: state.products.filter((p) => p.id !== productId),
    }));
  },

  updateStock: (cabangId, variantId, quantity, price) => {
    set((state) => ({
      products: state.products.map((product) => ({
        ...product,
        variants: product.variants?.map((variant) => ({
          ...variant,
          stocks: variant.stocks?.map((stock) =>
            stock.cabangId === cabangId && variant.id === variantId
              ? { ...stock, quantity, ...(price !== undefined && { price }) }
              : stock
          ),
        })),
      })),
    }));
  },

  getFilteredProducts: () => {
    const { products, search } = get();
    if (!search.trim()) return products;

    const searchWords = search.toLowerCase().trim().split(/\s+/).filter((w) => w.length > 0);

    const filtered: Product[] = [];
    
    for (const product of products) {
      const productText = [product.name, product.category?.name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const filteredVariants = product.variants?.filter((v) => {
        const variantText = [
          productText,
          v.sku || '',
          v.variantValue || '',
          v.variantName || '',
        ]
          .join(' ')
          .toLowerCase();

        return searchWords.every((word) => variantText.includes(word));
      });

      if (filteredVariants && filteredVariants.length > 0) {
        filtered.push({ ...product, variants: filteredVariants });
      }
    }
    
    return filtered;
  },

  getStockForVariant: (variant, cabangId) => {
    return variant.stocks?.find((s) => s.cabangId === cabangId);
  },
}));

