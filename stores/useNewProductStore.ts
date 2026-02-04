import { create } from 'zustand';
import { productsAPI, cabangAPI } from '@/lib/api';
import { logger } from '@/lib/logger';

// Types
export interface Category {
  id: string;
  name: string;
}

export interface Cabang {
  id: string;
  name: string;
  isActive: boolean;
}

export interface StockItem {
  cabangId: string;
  cabangName: string;
  quantity: number;
  price: number;
}

export interface Variant {
  variantName: string;
  variantValue: string;
  sku: string;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  imageUrl?: string;
  stocks: StockItem[];
}

export interface FormData {
  name: string;
  description: string;
  categoryId: string;
  productType: 'SINGLE' | 'VARIANT';
  sku: string;
}

export interface VariantTypes {
  type1: string;
  type2: string;
  type3: string;
}

export interface BulkApply {
  sku: string;
  price: string;
  stock: string;
}

export interface SingleBulkApply {
  price: string;
  stock: string;
}

export interface SingleMarketplaceInfo {
  weight: string;
  length: string;
  width: string;
  height: string;
  imageUrl: string;
}

interface NewProductState {
  // Data
  categories: Category[];
  cabangs: Cabang[];
  
  // Form state
  loading: boolean;
  formData: FormData;
  variantTypes: VariantTypes;
  attributeCount: 1 | 2 | 3;
  singleProductStocks: StockItem[];
  variants: Variant[];
  bulkApply: BulkApply;
  singleBulkApply: SingleBulkApply;
  singleMarketplaceInfo: SingleMarketplaceInfo;
  
  // Actions - Setters
  setLoading: (loading: boolean) => void;
  setFormData: (data: FormData | ((prev: FormData) => FormData)) => void;
  setVariantTypes: (types: VariantTypes | ((prev: VariantTypes) => VariantTypes)) => void;
  setAttributeCount: (count: 1 | 2 | 3 | ((prev: 1 | 2 | 3) => 1 | 2 | 3)) => void;
  setSingleProductStocks: (stocks: StockItem[] | ((prev: StockItem[]) => StockItem[])) => void;
  setVariants: (variants: Variant[] | ((prev: Variant[]) => Variant[])) => void;
  setBulkApply: (bulk: BulkApply | ((prev: BulkApply) => BulkApply)) => void;
  setSingleBulkApply: (bulk: SingleBulkApply | ((prev: SingleBulkApply) => SingleBulkApply)) => void;
  setSingleMarketplaceInfo: (info: SingleMarketplaceInfo | ((prev: SingleMarketplaceInfo) => SingleMarketplaceInfo)) => void;
  
  // Actions - Fetch
  fetchCategories: () => Promise<void>;
  fetchCabangs: () => Promise<void>;
  initializeData: () => Promise<void>;
  
  // Actions - Variants
  addVariant: () => void;
  removeVariant: (index: number) => void;
  updateVariant: (index: number, field: string, value: any) => void;
  handleStockChange: (variantIndex: number, cabangIndex: number, field: string, value: string) => void;
  handleGeneratedVariants: (generated: Array<{ variantName: string; variantValue: string; sku: string; price: string; stock: string }>) => void;
  applyBulkValues: () => void;
  
  // Actions - Single Product
  handleSingleStockChange: (cabangIndex: number, field: string, value: string) => void;
  applySingleBulkValues: () => void;
  
  // Actions - Form
  updateFormField: (field: keyof FormData, value: any) => void;
  submitProduct: () => Promise<{ success: boolean; error?: string }>;
  resetForm: () => void;
}

const initialFormData: FormData = {
  name: '',
  description: '',
  categoryId: '',
  productType: 'SINGLE',
  sku: '',
};

const initialVariantTypes: VariantTypes = {
  type1: '',
  type2: '',
  type3: '',
};

const initialBulkApply: BulkApply = {
  sku: '',
  price: '',
  stock: '',
};

const initialSingleBulkApply: SingleBulkApply = {
  price: '',
  stock: '',
};

const initialSingleMarketplaceInfo: SingleMarketplaceInfo = {
  weight: '',
  length: '',
  width: '',
  height: '',
  imageUrl: '',
};

export const useNewProductStore = create<NewProductState>()((set, get) => ({
  // Initial data
  categories: [],
  cabangs: [],
  
  // Initial form state
  loading: false,
  formData: initialFormData,
  variantTypes: initialVariantTypes,
  attributeCount: 1,
  singleProductStocks: [],
  variants: [],
  bulkApply: initialBulkApply,
  singleBulkApply: initialSingleBulkApply,
  singleMarketplaceInfo: initialSingleMarketplaceInfo,
  
  // Setters
  setLoading: (loading) => set({ loading }),
  
  setFormData: (data) => set((state) => ({
    formData: typeof data === 'function' ? data(state.formData) : data
  })),
  
  setVariantTypes: (types) => set((state) => ({
    variantTypes: typeof types === 'function' ? types(state.variantTypes) : types
  })),
  
  setAttributeCount: (count) => set((state) => ({
    attributeCount: typeof count === 'function' ? count(state.attributeCount) : count
  })),
  
  setSingleProductStocks: (stocks) => set((state) => ({
    singleProductStocks: typeof stocks === 'function' ? stocks(state.singleProductStocks) : stocks
  })),
  
  setVariants: (variants) => set((state) => ({
    variants: typeof variants === 'function' ? variants(state.variants) : variants
  })),
  
  setBulkApply: (bulk) => set((state) => ({
    bulkApply: typeof bulk === 'function' ? bulk(state.bulkApply) : bulk
  })),
  
  setSingleBulkApply: (bulk) => set((state) => ({
    singleBulkApply: typeof bulk === 'function' ? bulk(state.singleBulkApply) : bulk
  })),
  
  setSingleMarketplaceInfo: (info) => set((state) => ({
    singleMarketplaceInfo: typeof info === 'function' ? info(state.singleMarketplaceInfo) : info
  })),
  
  // Fetch actions
  fetchCategories: async () => {
    try {
      const res = await productsAPI.getCategories();
      set({ categories: res.data });
    } catch (error) {
      logger.error('Error fetching categories:', error);
    }
  },
  
  fetchCabangs: async () => {
    try {
      const res = await cabangAPI.getCabangs();
      const activeCabangs = res.data.filter((c: any) => c.isActive);
      set({ cabangs: activeCabangs });
      
      // Initialize single product stocks with active cabangs
      const initialStocks = activeCabangs.map((c: any) => ({
        cabangId: c.id,
        cabangName: c.name,
        quantity: 0,
        price: 0
      }));
      set({ singleProductStocks: initialStocks });
    } catch (error) {
      logger.error('Error fetching cabangs:', error);
    }
  },
  
  initializeData: async () => {
    await Promise.all([
      get().fetchCategories(),
      get().fetchCabangs()
    ]);
  },
  
  // Variant actions
  addVariant: () => {
    const { variantTypes, attributeCount, cabangs } = get();
    
    // Auto-generate variantName from defined types based on attributeCount
    const typesArray = [variantTypes.type1];
    if (attributeCount >= 2) typesArray.push(variantTypes.type2);
    if (attributeCount >= 3) typesArray.push(variantTypes.type3);
    const types = typesArray.filter(t => t).join(' | ');
    
    set((state) => ({
      variants: [...state.variants, {
        variantName: types || 'Default',
        variantValue: '',
        sku: '',
        weight: undefined,
        length: undefined,
        width: undefined,
        height: undefined,
        imageUrl: undefined,
        stocks: cabangs.map(c => ({ cabangId: c.id, cabangName: c.name, quantity: 0, price: 0 }))
      }]
    }));
  },
  
  removeVariant: (index) => {
    set((state) => ({
      variants: state.variants.filter((_, i) => i !== index)
    }));
  },
  
  updateVariant: (index, field, value) => {
    set((state) => {
      const newVariants = [...state.variants];
      newVariants[index] = { ...newVariants[index], [field]: value };
      return { variants: newVariants };
    });
  },
  
  handleStockChange: (variantIndex, cabangIndex, field, value) => {
    set((state) => ({
      variants: state.variants.map((variant, vIdx) => {
        if (vIdx === variantIndex) {
          return {
            ...variant,
            stocks: variant.stocks.map((stock, sIdx) => {
              if (sIdx === cabangIndex) {
                if (field === 'price') {
                  return { ...stock, [field]: parseFloat(value) || 0 };
                } else {
                  return { ...stock, [field]: parseInt(value) || 0 };
                }
              }
              return stock;
            })
          };
        }
        return variant;
      })
    }));
  },
  
  handleGeneratedVariants: (generated) => {
    const { cabangs } = get();
    
    if (cabangs.length === 0) {
      return; // Let the page handle the alert
    }
    
    const converted = generated.map(v => ({
      variantName: v.variantName,
      variantValue: v.variantValue,
      sku: v.sku,
      stocks: cabangs.map(c => ({
        cabangId: c.id,
        cabangName: c.name,
        quantity: parseInt(v.stock) || 0,
        price: parseFloat(v.price) || 0
      }))
    }));
    
    set({ variants: converted });
  },
  
  applyBulkValues: () => {
    const { bulkApply } = get();
    
    set((state) => ({
      variants: state.variants.map((v, index) => ({
        ...v,
        ...(bulkApply.sku && { sku: `${bulkApply.sku}${index + 1}` }),
        ...(bulkApply.price || bulkApply.stock ? {
          stocks: v.stocks.map(s => ({
            ...s,
            ...(bulkApply.price && { price: parseFloat(bulkApply.price) }),
            ...(bulkApply.stock && { quantity: parseInt(bulkApply.stock) })
          }))
        } : {})
      })),
      bulkApply: initialBulkApply
    }));
  },
  
  // Single product actions
  handleSingleStockChange: (cabangIndex, field, value) => {
    set((state) => ({
      singleProductStocks: state.singleProductStocks.map((stock, idx) => {
        if (idx === cabangIndex) {
          if (field === 'price') {
            return { ...stock, [field]: parseFloat(value) || 0 };
          } else {
            return { ...stock, [field]: parseInt(value) || 0 };
          }
        }
        return stock;
      })
    }));
  },
  
  applySingleBulkValues: () => {
    const { singleBulkApply } = get();
    const price = parseFloat(singleBulkApply.price) || 0;
    const stock = parseInt(singleBulkApply.stock) || 0;
    
    set((state) => ({
      singleProductStocks: state.singleProductStocks.map(s => ({
        ...s,
        price: price > 0 ? price : s.price,
        quantity: stock >= 0 ? stock : s.quantity
      }))
    }));
  },
  
  // Form actions
  updateFormField: (field, value) => {
    set((state) => ({
      formData: { ...state.formData, [field]: value }
    }));
  },
  
  submitProduct: async () => {
    const { formData, singleProductStocks, singleMarketplaceInfo, variants } = get();
    
    set({ loading: true });
    
    try {
      const payload: any = {
        name: formData.name,
        description: formData.description,
        categoryId: formData.categoryId,
        productType: formData.productType,
      };
      
      if (formData.productType === 'SINGLE') {
        // Validate single product has at least one cabang with price
        const hasPrice = singleProductStocks.some(s => s.price && s.price > 0);
        if (!hasPrice) {
          set({ loading: false });
          return { success: false, error: 'Produk harus punya harga minimal di 1 cabang!' };
        }
        
        payload.sku = formData.sku;
        payload.stocks = singleProductStocks;
        payload.weight = singleMarketplaceInfo.weight ? parseInt(singleMarketplaceInfo.weight) : null;
        payload.length = singleMarketplaceInfo.length ? parseInt(singleMarketplaceInfo.length) : null;
        payload.width = singleMarketplaceInfo.width ? parseInt(singleMarketplaceInfo.width) : null;
        payload.height = singleMarketplaceInfo.height ? parseInt(singleMarketplaceInfo.height) : null;
        payload.imageUrl = singleMarketplaceInfo.imageUrl || null;
      } else {
        // Validate variants have at least one cabang with price
        for (const variant of variants) {
          const hasPrice = variant.stocks.some(s => s.price && s.price > 0);
          if (!hasPrice) {
            set({ loading: false });
            return { 
              success: false, 
              error: `Varian "${variant.variantName}: ${variant.variantValue}" harus punya harga minimal di 1 cabang!` 
            };
          }
        }
        
        payload.variants = variants
          .filter(v => v.variantName && v.variantValue)
          .map(v => ({
            variantName: v.variantName,
            variantValue: v.variantValue,
            sku: v.sku,
            weight: v.weight || null,
            length: v.length || null,
            width: v.width || null,
            height: v.height || null,
            imageUrl: v.imageUrl || null,
            stocks: v.stocks
          }));
      }
      
      await productsAPI.createProduct(payload);
      set({ loading: false });
      return { success: true };
    } catch (error: any) {
      set({ loading: false });
      return { 
        success: false, 
        error: error.response?.data?.error || 'Gagal menambahkan produk' 
      };
    }
  },
  
  resetForm: () => {
    const { cabangs } = get();
    set({
      formData: initialFormData,
      variantTypes: initialVariantTypes,
      attributeCount: 1,
      singleProductStocks: cabangs.map(c => ({
        cabangId: c.id,
        cabangName: c.name,
        quantity: 0,
        price: 0
      })),
      variants: [],
      bulkApply: initialBulkApply,
      singleBulkApply: initialSingleBulkApply,
      singleMarketplaceInfo: initialSingleMarketplaceInfo,
    });
  },
}));

