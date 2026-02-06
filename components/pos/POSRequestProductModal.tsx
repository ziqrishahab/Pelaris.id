'use client';

import { NewProductRequest } from './types';

interface Category {
  id: string;
  name: string;
}

interface POSRequestProductModalProps {
  newProduct: NewProductRequest;
  setNewProduct: (product: NewProductRequest) => void;
  categories: Category[];
  loading: boolean;
  onSubmit: () => void;
  onClose: () => void;
}

export function POSRequestProductModal({
  newProduct,
  setNewProduct,
  categories,
  loading,
  onSubmit,
  onClose,
}: POSRequestProductModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Request Produk Baru</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Kirim request ke admin via WhatsApp</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Product Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Nama Produk <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Nama produk"
            />
          </div>

          {/* Product Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Tipe Produk <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setNewProduct({ ...newProduct, productType: 'SINGLE' })}
                className={`py-3 px-4 rounded-xl text-sm font-semibold transition ${
                  newProduct.productType === 'SINGLE'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Produk Single
              </button>
              <button
                type="button"
                onClick={() => setNewProduct({ ...newProduct, productType: 'VARIANT' })}
                className={`py-3 px-4 rounded-xl text-sm font-semibold transition ${
                  newProduct.productType === 'VARIANT'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Produk Variant
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {newProduct.productType === 'SINGLE'
                ? 'Produk tanpa varian (contoh: Air Mineral 600ml)'
                : 'Produk dengan varian (contoh: Baju dengan ukuran S, M, L, XL)'}
            </p>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Kategori <span className="text-red-500">*</span>
            </label>
            <select
              value={newProduct.categoryId}
              onChange={(e) => setNewProduct({ ...newProduct, categoryId: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">Pilih Kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {categories.length === 0 && (
              <p className="text-xs text-red-500 mt-1">Belum ada kategori. Buat kategori dulu di dashboard.</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            Batal
          </button>
          <button
            onClick={onSubmit}
            disabled={loading || !newProduct.name || !newProduct.categoryId}
            className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {loading ? (
              'Mengirim...'
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Kirim Request
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
