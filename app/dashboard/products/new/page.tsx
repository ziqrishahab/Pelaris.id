'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNewProductStore } from '@/stores/useNewProductStore';

export default function NewProductPage() {
  const router = useRouter();
  
  // Use store for all state
  const {
    categories,
    cabangs,
    loading,
    formData,
    variantTypes,
    attributeCount,
    singleProductStocks,
    variants,
    bulkApply,
    singleBulkApply,
    singleMarketplaceInfo,
    // Actions
    setFormData,
    setVariantTypes,
    setAttributeCount,
    setVariants,
    setBulkApply,
    setSingleBulkApply,
    setSingleMarketplaceInfo,
    initializeData,
    addVariant,
    removeVariant,
    updateVariant,
    handleStockChange,
    handleGeneratedVariants,
    applyBulkValues,
    handleSingleStockChange,
    applySingleBulkValues,
    submitProduct,
  } = useNewProductStore();

  useEffect(() => {
    initializeData();
  }, [initializeData]);

  // Handle generated variants with alert
  const handleGeneratedVariantsWithAlert = (generated: Array<{ variantName: string; variantValue: string; sku: string; price: string; stock: string }>) => {
    if (cabangs.length === 0) {
      alert('Belum ada cabang! Tunggu sebentar atau refresh halaman.');
      return;
    }
    handleGeneratedVariants(generated);
    alert(`${generated.length} varian berhasil di-generate!`);
  };

  // Handle bulk apply with alert
  const handleApplyBulkValues = () => {
    applyBulkValues();
    alert('Nilai berhasil diterapkan ke semua varian!');
  };

  // Handle single bulk apply with alert
  const handleApplySingleBulkValues = () => {
    applySingleBulkValues();
    alert('Harga & stok berhasil diterapkan ke semua cabang!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await submitProduct();
    
    if (result.success) {
      alert('Produk berhasil ditambahkan!');
      router.push('/dashboard/products');
    } else {
      alert(result.error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
        <button onClick={() => router.push('/dashboard')} className="hover:text-gray-900 dark:hover:text-white transition">
          Home
        </button>
        <span>›</span>
        <button onClick={() => router.push('/dashboard/products')} className="hover:text-gray-900 dark:hover:text-white transition">
          Kelola Produk
        </button>
        <span>›</span>
        <span className="font-semibold text-gray-900 dark:text-white">Tambah Produk Baru</span>
      </nav>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informasi Produk</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nama Produk *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-slate-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Contoh: Kaos Putih"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Deskripsi
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-slate-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Deskripsi produk..."
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Kategori *
                </label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-slate-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Pilih Kategori</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipe Produk *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, productType: 'SINGLE' })}
                    className={`px-3 py-2.5 rounded-lg border-2 font-medium transition-all text-sm ${
                      formData.productType === 'SINGLE'
                        ? 'border-slate-500 bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    Produk Tunggal
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, productType: 'VARIANT' })}
                    className={`px-3 py-2.5 rounded-lg border-2 font-medium transition-all text-sm ${
                      formData.productType === 'VARIANT'
                        ? 'border-slate-500 bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    Produk Varian
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {formData.productType === 'SINGLE' 
                    ? 'Produk tanpa varian (contoh: Pulpen merek X)' 
                    : 'Produk dengan varian (contoh: Baju SD nomor 6, 8, 10)'}
                </p>
              </div>
            </div>

            {/* Show SKU input and per-cabang pricing for SINGLE product */}
            {formData.productType === 'SINGLE' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    SKU <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sku || ''}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 font-mono text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition"
                    placeholder="Contoh: kaos-putih-001"
                  />
                </div>

                {/* Per-Cabang Pricing for SINGLE product */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3 bg-gray-50 dark:bg-gray-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Harga & Stok per Cabang <span className="text-red-500">*</span>
                    </h4>
                  </div>

                  {/* Bulk Apply */}
                  <div className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Terapkan ke Semua Cabang</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <input
                          type="number"
                          value={singleBulkApply.price}
                          onChange={(e) => setSingleBulkApply({ ...singleBulkApply, price: e.target.value })}
                          placeholder="Harga"
                          min="0"
                          className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          value={singleBulkApply.stock}
                          onChange={(e) => setSingleBulkApply({ ...singleBulkApply, stock: e.target.value })}
                          placeholder="Stok"
                          min="0"
                          className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleApplySingleBulkValues}
                        className="px-3 py-1.5 bg-slate-600 text-white rounded text-sm font-medium hover:bg-slate-700 transition"
                      >
                        Terapkan
                      </button>
                    </div>
                  </div>

                  {/* Per-Cabang Grid */}
                  <div className="space-y-2">
                    {singleProductStocks.length === 0 && (
                      <div className="text-sm text-red-500">Tidak ada cabang aktif! Tambahkan cabang di Settings → Cabang</div>
                    )}
                    {singleProductStocks.map((stock, idx) => (
                      <div key={stock.cabangId} className="grid grid-cols-3 gap-2 items-center p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {stock.cabangName}
                        </div>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400">Rp</span>
                          <input
                            type="number"
                            min="0"
                            value={stock.price || ''}
                            onChange={(e) => handleSingleStockChange(idx, 'price', e.target.value)}
                            className="w-full pl-8 pr-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="0"
                          />
                        </div>
                        <input
                          type="number"
                          min="0"
                          value={stock.quantity || ''}
                          onChange={(e) => handleSingleStockChange(idx, 'quantity', e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="0"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                    Minimal 1 cabang harus punya harga untuk bisa menyimpan produk
                  </p>
                </div>

                {/* Marketplace Info for Single Product */}
                <details className="group border border-gray-200 dark:border-gray-600 rounded-lg">
                  <summary className="px-4 py-3 bg-gray-50 dark:bg-gray-700 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 rounded-lg">
                    <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Info Marketplace (Opsional)
                  </summary>
                  <div className="p-4 space-y-4 bg-white dark:bg-gray-800">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                        URL Gambar
                      </label>
                      <input
                        type="url"
                        value={singleMarketplaceInfo.imageUrl}
                        onChange={(e) => setSingleMarketplaceInfo({ ...singleMarketplaceInfo, imageUrl: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                          Berat (gram)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={singleMarketplaceInfo.weight}
                          onChange={(e) => setSingleMarketplaceInfo({ ...singleMarketplaceInfo, weight: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                          Panjang (cm)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={singleMarketplaceInfo.length}
                          onChange={(e) => setSingleMarketplaceInfo({ ...singleMarketplaceInfo, length: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="10"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                          Lebar (cm)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={singleMarketplaceInfo.width}
                          onChange={(e) => setSingleMarketplaceInfo({ ...singleMarketplaceInfo, width: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="5"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                          Tinggi (cm)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={singleMarketplaceInfo.height}
                          onChange={(e) => setSingleMarketplaceInfo({ ...singleMarketplaceInfo, height: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="3"
                        />
                      </div>
                    </div>
                  </div>
                </details>
              </div>
            )}
          </div>
        </div>

        {/* Variants - Only show for VARIANT product type */}
        {formData.productType === 'VARIANT' && (
          <>
                {/* Variant Type Definition */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-5 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      Definisi Tipe Varian
                    </h3>
                    <div className="flex items-center gap-1">
                      {attributeCount > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setAttributeCount((prev) => Math.max(1, prev - 1) as 1 | 2 | 3);
                            if (attributeCount === 3) setVariantTypes(v => ({ ...v, type3: '' }));
                            if (attributeCount === 2) setVariantTypes(v => ({ ...v, type2: '' }));
                          }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition text-lg font-bold"
                          title="Kurangi tipe"
                        >
                          −
                        </button>
                      )}
                      {attributeCount < 3 && (
                        <button
                          type="button"
                          onClick={() => setAttributeCount((prev) => Math.min(3, prev + 1) as 1 | 2 | 3)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-300 dark:hover:bg-blue-700 transition text-lg font-bold"
                          title="Tambah tipe"
                        >
                          +
                        </button>
                      )}
                    </div>
                  </div>

                  <div className={`grid gap-3 ${attributeCount === 1 ? 'grid-cols-1' : attributeCount === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'}`}>
                    <div>
                      <label className="block text-xs font-medium text-blue-900 dark:text-blue-300 mb-1.5">
                        Tipe 1 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={variantTypes.type1}
                        onChange={(e) => {
                          const newType1 = e.target.value;
                          setVariantTypes({ ...variantTypes, type1: newType1 });
                          // Auto-update all variants' variantName based on attribute count
                          const typesArray = [newType1];
                          if (attributeCount >= 2) typesArray.push(variantTypes.type2);
                          if (attributeCount >= 3) typesArray.push(variantTypes.type3);
                          const newTypes = typesArray.filter(t => t).join(' | ');
                          setVariants(variants.map(v => ({ ...v, variantName: newTypes || 'Default' })));
                        }}
                        className="w-full px-3 py-2 border border-blue-300 dark:border-blue-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        placeholder="Contoh: Warna"
                      />
                    </div>
                    {attributeCount >= 2 && (
                      <div>
                        <label className="block text-xs font-medium text-blue-900 dark:text-blue-300 mb-1.5">
                          Tipe 2
                        </label>
                        <input
                          type="text"
                          value={variantTypes.type2}
                          onChange={(e) => {
                            const newType2 = e.target.value;
                            setVariantTypes({ ...variantTypes, type2: newType2 });
                            // Auto-update all variants' variantName
                            const typesArray = [variantTypes.type1, newType2];
                            if (attributeCount >= 3) typesArray.push(variantTypes.type3);
                            const newTypes = typesArray.filter(t => t).join(' | ');
                            setVariants(variants.map(v => ({ ...v, variantName: newTypes || 'Default' })));
                          }}
                          className="w-full px-3 py-2 border border-blue-300 dark:border-blue-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          placeholder="Contoh: Ukuran"
                        />
                      </div>
                    )}
                    {attributeCount >= 3 && (
                      <div>
                        <label className="block text-xs font-medium text-blue-900 dark:text-blue-300 mb-1.5">
                          Tipe 3
                        </label>
                        <input
                          type="text"
                          value={variantTypes.type3}
                          onChange={(e) => {
                            const newType3 = e.target.value;
                            setVariantTypes({ ...variantTypes, type3: newType3 });
                            // Auto-update all variants' variantName
                            const typesArray = [variantTypes.type1, variantTypes.type2, newType3];
                            const newTypes = typesArray.filter(t => t).join(' | ');
                            setVariants(variants.map(v => ({ ...v, variantName: newTypes || 'Default' })));
                          }}
                          className="w-full px-3 py-2 border border-blue-300 dark:border-blue-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          placeholder="Contoh: Model"
                        />
                      </div>
                    )}
                  </div>
                  
                  {attributeCount < 3 && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-3 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Klik + untuk menambah tipe varian (maks. 3)
                    </p>
                  )}
                  
                  {!variantTypes.type1 && (
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-2 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Isi minimal Type 1 sebelum menambah varian
                    </p>
                  )}
                </div>

                {/* Add Variant Button */}
                {variantTypes.type1 && (
                  <button
                    type="button"
                    onClick={addVariant}
                    className="w-full py-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-xl hover:from-slate-700 hover:to-slate-800 font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Tambah Varian
                  </button>
                )}

            {variants.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mt-4">
                {/* Bulk Apply Section */}
                <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Terapkan ke Semua Varian</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">SKU Prefix</label>
                  <input
                    type="text"
                    value={bulkApply.sku}
                    onChange={(e) => setBulkApply({ ...bulkApply, sku: e.target.value })}
                    placeholder="PRD-"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Stok (semua cabang)</label>
                  <input
                    type="number"
                    value={bulkApply.stock}
                    onChange={(e) => setBulkApply({ ...bulkApply, stock: e.target.value })}
                    placeholder="15"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Harga (semua cabang)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-xs">Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={bulkApply.price ? Number(bulkApply.price).toLocaleString('id-ID') : ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setBulkApply({ ...bulkApply, price: val });
                      }}
                      placeholder="50.000"
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleApplyBulkValues}
                    className="w-full py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 text-sm font-medium transition"
                  >
                    Terapkan
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                SKU akan menambahkan nomor urut (e.g., PRD-1, PRD-2). Kosongkan field yang tidak ingin diubah.
              </p>
            </div>
          
                {/* Variant Cards */}
                <div className="space-y-4">
            {variants.map((variant, variantIndex) => (
              <div key={variantIndex} className="p-4 md:p-5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:border-slate-400 dark:hover:border-slate-600 transition-colors">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center w-7 h-7 bg-slate-600 dark:bg-slate-700 text-white rounded-md font-semibold text-sm">
                      {variantIndex + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {variant.variantValue 
                          ? variant.variantValue 
                          : `Varian #${variantIndex + 1}`}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{variant.sku || 'SKU belum diisi'}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeVariant(variantIndex)}
                    className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-white hover:bg-red-600 border border-red-600 rounded-md transition-colors"
                  >
                    Hapus
                  </button>
                </div>

                {/* Variant Details */}
                <div className="space-y-3">
                  {/* Value Inputs */}
                  <div className={`grid grid-cols-1 gap-3 ${attributeCount === 1 ? 'md:grid-cols-1' : attributeCount === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
                    {variantTypes.type1 && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          {variantTypes.type1} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={variant.variantValue.split(' | ')[0] || ''}
                          onChange={(e) => {
                            const values = variant.variantValue.split(' | ');
                            values[0] = e.target.value;
                            // Preserve values based on attributeCount
                            const newValues = values.slice(0, attributeCount).filter(v => v);
                            updateVariant(variantIndex, 'variantValue', newValues.join(' | '));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-1 focus:ring-slate-500 focus:border-slate-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder={`Contoh: ${variantTypes.type1 === 'Warna' ? 'Merah' : variantTypes.type1 === 'Ukuran' ? '25' : 'Value'}`}
                        />
                      </div>
                    )}

                    {attributeCount >= 2 && variantTypes.type2 && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          {variantTypes.type2}
                        </label>
                        <input
                          type="text"
                          value={variant.variantValue.split(' | ')[1] || ''}
                          onChange={(e) => {
                            const values = variant.variantValue.split(' | ');
                            while (values.length < 2) values.push('');
                            values[1] = e.target.value;
                            const newValues = values.slice(0, attributeCount).filter(v => v);
                            updateVariant(variantIndex, 'variantValue', newValues.join(' | '));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-1 focus:ring-slate-500 focus:border-slate-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder={`Contoh: ${variantTypes.type2 === 'Ukuran' ? '25' : variantTypes.type2 === 'Model' ? '2024' : 'Value'}`}
                        />
                      </div>
                    )}

                    {attributeCount >= 3 && variantTypes.type3 && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          {variantTypes.type3}
                        </label>
                        <input
                          type="text"
                          value={variant.variantValue.split(' | ')[2] || ''}
                          onChange={(e) => {
                            const values = variant.variantValue.split(' | ');
                            while (values.length < 3) values.push('');
                            values[2] = e.target.value;
                            const newValues = values.slice(0, attributeCount).filter(v => v);
                            updateVariant(variantIndex, 'variantValue', newValues.join(' | '));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-1 focus:ring-slate-500 focus:border-slate-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder={`Contoh: ${variantTypes.type3 === 'Model' ? '2024' : 'Value'}`}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      SKU
                    </label>
                    <input
                      type="text"
                      value={variant.sku}
                      onChange={(e) => updateVariant(variantIndex, 'sku', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:ring-1 focus:ring-slate-500 focus:border-slate-500"
                      placeholder="VAR-009"
                    />
                  </div>

                  {/* Marketplace Info - Collapsible */}
                  <details className="group border border-gray-200 dark:border-gray-600 rounded-md">
                    <summary className="px-3 py-2 bg-gray-50 dark:bg-gray-700 cursor-pointer text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 rounded-md">
                      <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      Info Marketplace (Opsional)
                    </summary>
                    <div className="p-3 space-y-3 bg-white dark:bg-gray-800">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          URL Gambar
                        </label>
                        <input
                          type="url"
                          value={variant.imageUrl || ''}
                          onChange={(e) => updateVariant(variantIndex, 'imageUrl', e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Berat (gram)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={variant.weight || ''}
                            onChange={(e) => updateVariant(variantIndex, 'weight', parseInt(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="100"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Panjang (cm)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={variant.length || ''}
                            onChange={(e) => updateVariant(variantIndex, 'length', parseInt(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="10"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Lebar (cm)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={variant.width || ''}
                            onChange={(e) => updateVariant(variantIndex, 'width', parseInt(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="5"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Tinggi (cm)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={variant.height || ''}
                            onChange={(e) => updateVariant(variantIndex, 'height', parseInt(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="3"
                          />
                        </div>
                      </div>
                    </div>
                  </details>

                  {/* Harga & Stock per Cabang Section */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Harga & Stok per Cabang
                    </label>
                    <div className="space-y-2">
                      {variant.stocks.map((stock: any, stockIndex: number) => (
                        <div key={stockIndex} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-2.5 bg-gray-50 rounded-md">
                          <div className="flex items-center">
                            <span className="text-sm text-gray-700 font-medium">
                              {stock.cabangName}
                            </span>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Harga</label>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">
                                Rp
                              </span>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={stock.price ? Number(stock.price).toLocaleString('id-ID') : ''}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '');
                                  handleStockChange(variantIndex, stockIndex, 'price', val);
                                }}
                                onBlur={(e) => {
                                  const num = parseFloat(e.target.value.replace(/\./g, '')) || 0;
                                  handleStockChange(variantIndex, stockIndex, 'price', String(num));
                                }}
                                className="w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-slate-500 focus:border-slate-500"
                                placeholder="50.000"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Stok</label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={stock.quantity || ''}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '').replace(/^0+/, '') || '0';
                                handleStockChange(variantIndex, stockIndex, 'quantity', val);
                              }}
                              onBlur={(e) => {
                                const num = parseInt(e.target.value) || 0;
                                handleStockChange(variantIndex, stockIndex, 'quantity', String(num));
                              }}
                              className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm text-center font-semibold focus:ring-1 focus:ring-slate-500 focus:border-slate-500"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
                </div>
          
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={addVariant}
                    className="w-full px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 text-sm font-medium transition flex items-center justify-center gap-1"
                  >
                    <span className="text-lg leading-none">+</span>
                    Tambah Varian
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-slate-600 text-white rounded-lg font-semibold hover:bg-slate-700 disabled:bg-gray-300"
          >
            {loading ? 'Menyimpan...' : 'Simpan Produk'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  );
}
