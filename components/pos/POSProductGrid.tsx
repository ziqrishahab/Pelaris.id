'use client';

import { RefObject } from 'react';
import { Product, CartItem } from './types';

interface POSProductGridProps {
  searchInputRef: RefObject<HTMLInputElement | null>;
  search: string;
  setSearch: (value: string) => void;
  filteredProducts: Product[];
  products: Product[];
  loading: boolean;
  cart: CartItem[];
  getEffectiveCabangId: () => string | undefined | null;
  onAddToCart: (product: Product, variant: any) => void;
  onRequestProduct: () => void;
  onShowHistory: () => void;
}

// Helper function for stock info
function getStockInfo(quantity: number, inCart: number = 0) {
  const available = quantity - inCart;
  if (available <= 0) return { color: 'text-gray-400', text: 'Habis', available };
  return { color: 'text-green-600 dark:text-green-400', text: `${available} pcs`, available };
}

// Format variant display more naturally
function formatVariantDisplay(variantName: string, variantValue: string) {
  const cleanValue = variantValue.replace(/\s*\|\s*/g, ' ').trim();
  const lowerValue = cleanValue.toLowerCase();
  
  if (/^\d+$/.test(cleanValue)) {
    return cleanValue;
  }
  
  if (/^[a-zA-Z]+\s+\d+$/.test(cleanValue)) {
    return cleanValue;
  }
  
  const nameLower = variantName.toLowerCase();
  if (lowerValue.startsWith(nameLower)) {
    return cleanValue.substring(variantName.length).trim();
  }
  
  return cleanValue;
}

export function POSProductGrid({
  searchInputRef,
  search,
  setSearch,
  filteredProducts,
  products,
  loading,
  cart,
  getEffectiveCabangId,
  onAddToCart,
  onRequestProduct,
  onShowHistory,
}: POSProductGridProps) {
  return (
    <div className="xl:col-span-2 flex flex-col min-h-0">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-5 flex flex-col flex-1 min-h-0">
        <div className="mb-4 flex-shrink-0 flex gap-2">
          <div className="relative flex-1">
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari produk, SKU, atau kategori..."
              className="w-full px-5 py-3 pl-12 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-4 focus:ring-slate-500 focus:border-slate-500 transition text-lg"
            />
            <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full transition"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          <button
            onClick={onRequestProduct}
            tabIndex={-1}
            className="px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:border-blue-300 dark:hover:border-blue-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all flex items-center gap-2 whitespace-nowrap"
            title="Request Produk Baru"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden md:inline">Request Produk</span>
          </button>
          
          <button
            onClick={onShowHistory}
            tabIndex={-1}
            className="px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:border-green-300 dark:hover:border-green-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all flex items-center gap-2 whitespace-nowrap"
            title="History Transaksi"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="hidden md:inline">History</span>
          </button>
        </div>

        {search && !loading && (
          <div className="mb-3 flex-shrink-0 text-sm text-gray-500 dark:text-gray-400">
            Menampilkan <span className="font-semibold text-gray-700 dark:text-gray-300">{filteredProducts.length}</span> dari {products.length} produk
          </div>
        )}

        <div className="space-y-3 overflow-y-auto flex-1 min-h-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
              <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Memuat produk...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-8">
              <svg className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                {search ? `Tidak ada hasil untuk "${search}"` : 'Tidak ada produk'}
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                {search ? 'Coba kata kunci lain' : 'Tambahkan produk terlebih dahulu'}
              </p>
            </div>
          ) : (
            filteredProducts.map((product) => (
              <div key={product.id} className="border-2 border-gray-100 dark:border-gray-700 rounded-xl p-5 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{product.name}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                        {product.category?.name}
                      </span>
                      {product.productType === 'VARIANT' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                          {product.variants?.length || 0} varian
                        </span>
                      )}
                    </div>
                    {search && product.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                  </div>
                </div>

                {product.productType === 'SINGLE' ? (
                  (() => {
                    const v = product.variants?.[0];
                    if (!v) return null;
                    const stock = v.stocks?.find((s) => s.cabangId === getEffectiveCabangId());
                    const inCartQty = cart.find(i => i.productVariantId === v.id)?.quantity || 0;
                    const stockInfo = getStockInfo(stock?.quantity || 0, inCartQty);
                    const isOut = stockInfo.available <= 0;

                    return (
                      <div>
                        {search && v.sku && (
                          <div className="mb-2 text-xs text-gray-500 dark:text-gray-400 font-mono flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                            </svg>
                            SKU: {v.sku}
                          </div>
                        )}
                        <button
                          onClick={() => onAddToCart(product, v)}
                          disabled={isOut}
                          className={`w-full p-3 rounded-xl border-2 text-sm font-medium transition ${
                            isOut ? 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-400 cursor-not-allowed'
                              : 'bg-gradient-to-br from-white to-blue-50 dark:from-gray-700 dark:to-blue-900/20 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md'
                          }`}
                        >
                          <div className="text-sm font-bold text-gray-900 dark:text-white">Rp {(stock?.price || 0).toLocaleString('id-ID')}</div>
                          <div className={`text-xs mt-1.5 font-semibold ${stockInfo.color}`}>Stock: {stockInfo.text}</div>
                        </button>
                      </div>
                    );
                  })()
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {product.variants?.map((v) => {
                      const stock = v.stocks?.find((s) => s.cabangId === getEffectiveCabangId());
                      const inCartQty = cart.find(i => i.productVariantId === v.id)?.quantity || 0;
                      const stockInfo = getStockInfo(stock?.quantity || 0, inCartQty);
                      const isOut = stockInfo.available <= 0;

                      return (
                        <div key={v.id} className="relative">
                          {search && v.sku && (
                            <div className="absolute -top-1 -right-1 z-10 group">
                              <div className="bg-gray-800 dark:bg-gray-700 text-white text-[10px] px-1.5 py-0.5 rounded font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                {v.sku}
                              </div>
                            </div>
                          )}
                          <button
                            onClick={() => onAddToCart(product, v)}
                            disabled={isOut}
                            className={`w-full p-3 rounded-lg border-2 text-sm font-medium transition ${
                              isOut ? 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-br from-white to-blue-50 dark:from-gray-700 dark:to-blue-900/20 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md'
                            }`}
                          >
                            <div className="font-bold text-gray-900 dark:text-white truncate" title={v.variantValue}>
                              {formatVariantDisplay(v.variantName, v.variantValue)}
                            </div>
                            <div className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
                              Rp {(stock?.price || 0).toLocaleString('id-ID')}
                            </div>
                            <div className={`mt-1 text-xs font-semibold ${stockInfo.color}`}>
                              Stock: {stockInfo.text}
                            </div>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
