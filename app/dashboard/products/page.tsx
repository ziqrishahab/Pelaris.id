'use client';

import React, { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth } from '@/lib/auth';
import { useRealtimeRefresh } from '@/hooks/useSocket';
import { useProductPageStore } from '@/stores/useProductPageStore';
import { Package, Plus } from 'lucide-react';
import { SkeletonProductGrid, SkeletonFilterBar, SkeletonPageHeader } from '@/components/ui/Skeleton';

export default function ProductsPage() {
  const router = useRouter();
  const { user } = getAuth();
  
  // Use store for all state
  const {
    products,
    categories,
    cabangs,
    loading,
    search,
    selectedCategory,
    selectedProducts,
    deleting,
    activeTab,
    variantModal,
    editingStock,
    newStockQty,
    adjustmentReason,
    savingStock,
    importFile,
    importing,
    importResult,
    exporting,
    // Actions
    setSearch,
    setSelectedCategory,
    setActiveTab,
    setSelectedProducts,
    handleSelectAll,
    handleSelectProduct,
    openVariantModal,
    closeVariantModal,
    startEditingStock,
    setNewStockQty,
    setAdjustmentReason,
    cancelEditingStock,
    saveStock,
    setImportFile,
    setImportResult,
    importProducts,
    exportProducts,
    downloadTemplate,
    fetchData,
    fetchDataSilent,
    bulkDeleteProducts,
  } = useProductPageStore();
  
  // Alias for handleCancelEdit
  const handleCancelEdit = cancelEditingStock;

  // Realtime refresh callback
  const handleRealtimeRefresh = useCallback(() => {
    fetchDataSilent();
  }, [fetchDataSilent]);

  // WebSocket for realtime updates
  const { connected: socketConnected } = useRealtimeRefresh(handleRealtimeRefresh);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (variantModal.isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [variantModal.isOpen]);

  useEffect(() => {
    fetchData();
  }, [selectedCategory, search, fetchData]);

  const handleStockClick = (e: React.MouseEvent, variantId: string, cabangId: string, currentQty: number) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    startEditingStock(variantId, cabangId, currentQty, { x: rect.left, y: rect.bottom + 8 });
  };

  const handleSaveStock = async () => {
    const success = await saveStock();
    if (success) {
      alert(`Stok berhasil diupdate${adjustmentReason ? ` (${adjustmentReason})` : ''}`);
    } else {
      alert('Gagal update stok');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) {
      alert('Pilih produk yang ingin dihapus');
      return;
    }
    
    // Check if user has permission
    if (user?.role === 'KASIR') {
      alert('Anda tidak memiliki izin untuk menghapus produk. Hubungi Owner atau Manager.');
      return;
    }

    if (!confirm(`Yakin ingin menghapus ${selectedProducts.length} produk? Produk dengan riwayat transaksi akan dinonaktifkan.`)) {
      return;
    }

    const success = await bulkDeleteProducts();
    if (success) {
      alert('Produk berhasil dihapus/dinonaktifkan!');
      // Refresh data to show updated state
      fetchDataSilent();
    } else {
      alert('Gagal menghapus produk. Pastikan Anda memiliki izin sebagai Owner atau Manager.');
    }
  };

  // Import/Export Functions
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      if (!['.xlsx', '.xls'].includes(fileExtension)) {
        alert('Format file tidak valid. Gunakan Excel (.xlsx atau .xls)');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB
        alert('Ukuran file terlalu besar. Maksimal 5MB');
        return;
      }
      
      setImportFile(file);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      alert('Pilih file terlebih dahulu');
      return;
    }
    const success = await importProducts();
    if (!success && importResult) {
      // Error shown via importResult
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await downloadTemplate();
    } catch {
      alert('Gagal download template');
    }
  };

  const handleExport = async () => {
    try {
      await exportProducts();
      alert('Berhasil export produk');
    } catch (error: any) {
      alert(error.message || 'Gagal export produk');
    }
  };

  if (loading) {
    return (
      <div className="px-4 md:px-6 space-y-6">
        <SkeletonPageHeader />
        <SkeletonFilterBar filters={3} />
        <SkeletonProductGrid items={12} columns={4} />
      </div>
    );
  }

  return (
    <div className="px-4 md:px-6 space-y-6">
      {/* Breadcrumb + Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <a href="/dashboard" className="hover:text-gray-900 dark:hover:text-white transition">Dashboard</a>
          <span>›</span>
          <span className="text-gray-900 dark:text-white font-medium">Produk</span>
        </nav>
        
        {activeTab === 'products' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/dashboard/products/new')}
              className="inline-flex items-center justify-center px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-lg hover:from-slate-700 hover:to-slate-800 transition-all shadow-lg hover:shadow-xl text-xs sm:text-sm font-medium whitespace-nowrap"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Tambah Produk
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2.5 text-sm font-medium transition-all ${
            activeTab === 'products'
              ? 'text-slate-600 dark:text-slate-300 border-b-2 border-slate-600 dark:border-slate-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Daftar Produk
          </span>
        </button>
        <button
          onClick={() => setActiveTab('import-export')}
          className={`px-4 py-2.5 text-sm font-medium transition-all ${
            activeTab === 'import-export'
              ? 'text-slate-600 dark:text-slate-300 border-b-2 border-slate-600 dark:border-slate-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Import / Export
          </span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'import-export' ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
                <svg className="w-8 h-8 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Import & Export Produk</h2>
              <p className="text-gray-600 dark:text-gray-400">Upload data produk secara massal atau export data existing</p>
            </div>

            {/* Import Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Import Produk</h3>
              
              {/* File Upload Area */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 p-8 text-center">
                <svg className="w-12 h-12 text-green-500 dark:text-green-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-6" />
                </svg>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Upload File Excel</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Gunakan file template Excel (.xlsx) hasil download di bawah (Max 5MB)</p>
                
                {/* File Input Hidden */}
                <input
                  type="file"
                  id="file-upload"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {/* Selected File Display */}
                {importFile && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg inline-flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">{importFile.name}</span>
                    <button
                      onClick={() => setImportFile(null)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
                
                {/* Step 1: Download Template */}
                <div className="mb-6">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <span className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm font-bold">1</span>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Download Template Import</h4>
                  </div>
                  <button
                    onClick={handleDownloadTemplate}
                    className="w-full max-w-md mx-auto block px-6 py-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-xl hover:from-blue-100 hover:to-cyan-100 dark:hover:from-blue-900/30 dark:hover:to-cyan-900/30 transition-all shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="text-left flex-1">
                        <p className="text-base font-bold text-gray-900 dark:text-white mb-1">Download Template Excel</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">2 Sheet: Referensi & Info + Template Import</p>
                      </div>
                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                </div>
                
                <div className="flex items-center gap-2 justify-center mb-4">
                  <div className="h-px flex-1 bg-gray-300 dark:bg-gray-600"></div>
                  <span className="flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full text-sm font-bold">2</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Isi Template & Upload File</span>
                  <div className="h-px flex-1 bg-gray-300 dark:bg-gray-600"></div>
                </div>
                
                <div className="flex items-center justify-center gap-3">
                  <label htmlFor="file-upload" className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium cursor-pointer">
                    {importFile ? 'Ganti File' : 'Pilih File Excel'}
                  </label>
                  
                  {importFile && (
                    <button
                      onClick={handleImport}
                      disabled={importing}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      {importing ? 'Mengupload...' : 'Upload & Import'}
                    </button>
                  )}
                </div>
              </div>
              
              {/* Import Result */}
              {importResult && (
                <div className={`mt-4 p-4 rounded-lg border ${
                  importResult.success 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex items-start gap-3">
                    <svg className={`w-5 h-5 flex-shrink-0 ${importResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {importResult.success ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      )}
                    </svg>
                    <div className="flex-1">
                      <h4 className={`text-sm font-semibold mb-2 ${importResult.success ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'}`}>
                        {importResult.success ? 'Import Berhasil!' : 'Import Gagal'}
                      </h4>
                      <p className={`text-xs mb-2 ${importResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                        Berhasil: {importResult.imported} | Gagal: {importResult.failed}
                      </p>
                      
                      {importResult.details?.errors?.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs font-semibold text-gray-900 dark:text-white">Error Details:</p>
                          {importResult.details.errors.slice(0, 5).map((err: any, idx: number) => (
                            <p key={idx} className="text-xs text-gray-700 dark:text-gray-300">
                              {err.row ? `Baris ${err.row}: ` : ''}{err.error}
                            </p>
                          ))}
                          {importResult.details.errors.length > 5 && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              ... dan {importResult.details.errors.length - 5} error lainnya
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setImportResult(null)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Export Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Export Produk</h3>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="w-full max-w-md mx-auto block p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-700 rounded-xl hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30 transition-all disabled:opacity-50 shadow-sm hover:shadow-md"
              >
                <div className="flex items-center justify-center gap-4">
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    {exporting ? (
                      <svg className="animate-spin w-6 h-6 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-base font-bold text-gray-900 dark:text-white mb-1">
                      {exporting ? 'Mengexport...' : 'Export ke Excel'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Download semua produk dalam format Excel
                    </p>
                  </div>
                  {!exporting && (
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
      {/* Original Products Content */}

      {/* Bulk Actions - Only show delete for Owner/Manager */}
      {selectedProducts.length > 0 && (
        <div className="mb-4 flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
            {selectedProducts.length} produk dipilih
          </span>
          {user?.role !== 'KASIR' && (
            <button
              onClick={handleBulkDelete}
              disabled={deleting}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all text-sm font-medium disabled:opacity-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {deleting ? 'Menghapus...' : `Hapus ${selectedProducts.length} Produk`}
            </button>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="bg-gradient-to-br from-white to-slate-50 dark:from-gray-800 dark:to-slate-900/20 rounded-xl md:rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800 p-4 md:p-6 mb-6 md:mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              Cari Produk
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nama produk atau SKU..."
              className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg md:rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition"
            />
          </div>
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              Kategori
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg md:rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition"
            >
              <option value="">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat._count?.products || 0})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Table/List */}
      {products.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 md:p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Tidak ada produk</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Mulai dengan menambahkan produk baru.
          </p>
        </div>
      ) : (
        <>
          {/* Select All Header */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4 flex items-center justify-between">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedProducts.length === products.length && products.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="h-5 w-5 text-slate-600 focus:ring-slate-500 border-gray-300 rounded cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {selectedProducts.length === products.length && products.length > 0
                  ? `Semua dipilih (${products.length})`
                  : selectedProducts.length > 0
                    ? `${selectedProducts.length} dari ${products.length} dipilih`
                    : `Pilih Semua (${products.length} produk)`
                }
              </span>
            </label>
            {selectedProducts.length > 0 && (
              <button
                onClick={() => setSelectedProducts([])}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Batal Pilih
              </button>
            )}
          </div>

          {/* Card Grid View */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product) => {
              // Stock is always in product.variants[].stocks[] for both SINGLE and VARIANT types
              const totalStock = product.variants?.reduce((sum: number, v: any) => 
                sum + (v.stocks?.reduce((vSum: number, s: any) => vSum + s.quantity, 0) || 0), 0
              ) || 0;
              const variantCount = product.variants?.length || 0;
              
              // Calculate price range
              let minPrice = 0;
              let maxPrice = 0;
              if (product.productType === 'SINGLE') {
                const variant = product.variants?.[0];
                const prices = variant?.stocks?.map((s: any) => s.price).filter((p: number) => p > 0) || [];
                if (prices.length > 0) {
                  minPrice = Math.min(...prices);
                  maxPrice = Math.max(...prices);
                }
              } else {
                product.variants?.forEach((variant: any) => {
                  variant.stocks?.forEach((stock: any) => {
                    if (stock.price > 0) {
                      if (minPrice === 0 || stock.price < minPrice) minPrice = stock.price;
                      if (stock.price > maxPrice) maxPrice = stock.price;
                    }
                  });
                });
              }
              
              return (
                <div key={product.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow overflow-hidden">
                  {/* Card Header with Checkbox */}
                  <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={(e) => handleSelectProduct(product.id, e.target.checked)}
                      className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-gray-300 rounded cursor-pointer"
                    />
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      product.isActive
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}>
                      {product.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>

                  {/* Product Image */}
                  <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
                    <span className="text-6xl font-bold text-slate-400 dark:text-slate-600">
                      {product.name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-3">
                    {/* Product Name */}
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1">
                        {product.name}
                      </h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {product.category?.name || '-'}
                      </span>
                    </div>

                    {/* Variant Info */}
                    <div>
                      {product.productType === 'VARIANT' ? (
                        <button
                          onClick={() => openVariantModal(product)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors hover:ring-2 hover:ring-purple-300 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 w-full justify-center"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {variantCount} Varian
                        </button>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 w-full justify-center">
                          Produk Tunggal
                        </span>
                      )}
                    </div>

                    {/* Price */}
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Harga</p>
                      {minPrice > 0 && maxPrice > 0 ? (
                        <p className="text-base font-bold text-gray-900 dark:text-white">
                          {minPrice === maxPrice 
                            ? `Rp ${minPrice.toLocaleString('id-ID')}`
                            : `Rp ${minPrice.toLocaleString('id-ID')} - ${maxPrice.toLocaleString('id-ID')}`
                          }
                        </p>
                      ) : (
                        <p className="text-base font-bold text-gray-400">-</p>
                      )}
                    </div>

                    {/* Stock */}
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Stock</p>
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold ${
                        totalStock === 0
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          : totalStock <= 20
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                          : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      }`}>
                        {totalStock} unit
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => router.push(`/dashboard/products/${product.id}`)}
                        className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Detail
                      </button>
                      <button
                        onClick={() => router.push(`/dashboard/products/${product.id}/edit`)}
                        className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile: Simplified Card View */}
          <div className="md:hidden space-y-4">
            {products.map((product) => {
              // Stock is always in product.variants[].stocks[] for both SINGLE and VARIANT types
              const totalStock = product.variants?.reduce((sum: number, v: any) => 
                sum + (v.stocks?.reduce((vSum: number, s: any) => vSum + s.quantity, 0) || 0), 0
              ) || 0;
              const variantCount = product.variants?.length || 0;
              
              return (
                <div
                  key={product.id}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm"
                >
                  {/* Header with checkbox and status */}
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={(e) => handleSelectProduct(product.id, e.target.checked)}
                        className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-gray-300 rounded cursor-pointer"
                      />
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        product.isActive
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}>
                        {product.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      product.productType === 'SINGLE'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    }`}>
                      {product.productType === 'SINGLE' ? 'Tunggal' : `${variantCount} Varian`}
                    </span>
                  </div>
                  
                  {/* Content */}
                  <div className="p-3 space-y-2.5">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-0.5 line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                        {product.description || '-'}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {product.category?.name || '-'}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        totalStock <= 5
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          : totalStock <= 20
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                          : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      }`}>
                        Total: {totalStock}
                      </span>
                    </div>
                    
                    {/* Per-Cabang Stock & Price (Mobile) */}
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-700 space-y-1.5">
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Stok & Harga per Cabang</p>
                      {cabangs.map((cabang) => {
                        let stockQty = 0;
                        let stockPrice = 0;

                        if (product.productType === 'SINGLE') {
                          const variant = product.variants?.[0];
                          const stock = variant?.stocks?.find((s: any) => s.cabangId === cabang.id);
                          stockQty = stock?.quantity || 0;
                          stockPrice = stock?.price || 0;
                        } else {
                          product.variants?.forEach((variant: any) => {
                            const stock = variant.stocks?.find((s: any) => s.cabangId === cabang.id);
                            stockQty += stock?.quantity || 0;
                            if (stock?.price && (stockPrice === 0 || stock.price < stockPrice)) {
                              stockPrice = stock.price;
                            }
                          });
                        }

                        return (
                          <div key={cabang.id} className="flex items-center justify-between py-1 px-2 bg-gray-50 dark:bg-gray-700/30 rounded">
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              {cabang.name}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                                stockQty <= 5
                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                  : stockQty <= 20
                                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                                  : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                              }`}>
                                {stockQty}
                              </span>
                              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                {stockPrice > 0 ? `Rp ${stockPrice.toLocaleString('id-ID')}` : '-'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex border-t border-gray-200 dark:border-gray-700 divide-x divide-gray-200 dark:divide-gray-700">
                    <button
                      onClick={() => router.push(`/dashboard/products/${product.id}`)}
                      className="flex-1 flex items-center justify-center py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span className="text-xs font-medium">Detail</span>
                    </button>
                    <button
                      onClick={() => router.push(`/dashboard/products/${product.id}/edit`)}
                      className="flex-1 flex items-center justify-center py-2.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span className="text-xs font-medium">Edit</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Inline Stock Edit Popup */}
      {editingStock && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={handleCancelEdit}
          />
          
          {/* Popup Modal */}
          <div
            className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border-2 border-slate-300 dark:border-slate-600 p-4 w-72"
            style={{
              left: `${editingStock.position.x}px`,
              top: `${editingStock.position.y}px`,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="space-y-3">
              {/* Title */}
              <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Edit Stok
                </h3>
                <button
                  onClick={handleCancelEdit}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Current stock info */}
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Stok saat ini: <span className="font-bold text-gray-900 dark:text-white">{editingStock.currentQty}</span>
              </div>

              {/* New stock input */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Stok Baru
                </label>
                <input
                  type="number"
                  min="0"
                  value={newStockQty}
                  onChange={(e) => setNewStockQty(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                  placeholder="0"
                  autoFocus
                />
              </div>

              {/* Reason dropdown/input */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Alasan (opsional)
                </label>
                <select
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                >
                  <option value="">- Pilih atau skip -</option>
                  <option value="Stok opname">Stok opname</option>
                  <option value="Barang rusak">Barang rusak</option>
                  <option value="Barang hilang">Barang hilang</option>
                  <option value="Return supplier">Return supplier</option>
                  <option value="Koreksi input">Koreksi input</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleCancelEdit}
                  disabled={savingStock}
                  className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveStock}
                  disabled={savingStock}
                  className="flex-1 px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 rounded-lg transition-all disabled:opacity-50"
                >
                  {savingStock ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      </>
      )}

      {/* Variant Details Modal */}
      {variantModal.isOpen && variantModal.product && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeVariantModal();
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full my-auto flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Detail Varian Produk
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {variantModal.product.name}
                </p>
              </div>
              <button
                onClick={closeVariantModal}
                className="p-2 hover:bg-purple-200 dark:hover:bg-purple-900/50 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                {variantModal.product.variants?.map((variant: any) => {
                  const variantStockTotal = variant.stocks?.reduce((sum: number, s: any) => sum + s.quantity, 0) || 0;
                  
                  return (
                    <div key={variant.id} className="bg-purple-50 dark:bg-purple-900/10 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                      {/* Variant Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="text-base font-bold text-purple-700 dark:text-purple-400">
                            {variant.variantValue}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1">
                            SKU: {variant.sku}
                          </p>
                        </div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold ${
                          variantStockTotal === 0
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                            : variantStockTotal <= 10
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        }`}>
                          Total: {variantStockTotal}
                        </span>
                      </div>

                      {/* Stock per Cabang */}
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Stock per Cabang:</p>
                        {cabangs.map((cabang) => {
                          const stock = variant.stocks?.find((s: any) => s.cabangId === cabang.id);
                          const stockQty = stock?.quantity || 0;
                          const stockPrice = stock?.price || 0;

                          return (
                            <div key={cabang.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {cabang.name}
                              </span>
                              <div className="flex items-center gap-4">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded text-sm font-bold ${
                                  stockQty === 0
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                    : stockQty <= 5
                                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                                    : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                }`}>
                                  {stockQty} unit
                                </span>
                                {stockPrice > 0 && (
                                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                    Rp {stockPrice.toLocaleString('id-ID')}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <button
                onClick={closeVariantModal}
                className="px-6 py-2.5 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
