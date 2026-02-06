'use client';

import { useEffect } from 'react';
import { getAuth } from '@/lib/auth';
import { useStockOpnameStore } from '@/stores/useStockOpnameStore';
import { Search, Package, Check, RefreshCw, ChevronDown, ChevronUp, Save, Minus, Plus, RotateCcw } from 'lucide-react';

interface OpnameItem {
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  systemQty: number;
  physicalQty: number | null;
  difference: number;
  status: 'pending' | 'counted' | 'adjusted';
}

export default function StockOpnamePage() {
  // Use store for all state
  const {
    cabangs,
    selectedCabang,
    products,
    opnameItems,
    loading,
    loadingProducts,
    search,
    filterStatus,
    expandedProducts,
    submitting,
    successMessage,
    showOnlyDiscrepancy,
    getStats,
    // Actions
    setCabangs,
    setSelectedCabang,
    setSearch,
    setFilterStatus,
    setShowOnlyDiscrepancy,
    toggleExpandedProduct,
    handlePhysicalQtyChange,
    handleQuickAdjust,
    handleResetItem,
    handleSetToSystem,
    loadCabangs,
    loadProducts,
    submitAdjustment,
    submitAllAdjustments,
    resetAll,
  } = useStockOpnameStore();
  
  const { user } = getAuth();
  const stats = getStats();

  useEffect(() => {
    // Set default cabang for non-owner
    if (user?.role !== 'OWNER' && user?.cabangId) {
      setSelectedCabang(user.cabangId);
    }
    loadCabangs();
  }, [user, setSelectedCabang, loadCabangs]);

  useEffect(() => {
    if (selectedCabang) {
      loadProducts();
    }
  }, [selectedCabang, loadProducts]);

  const handleSubmitAdjustment = async (item: OpnameItem) => {
    const success = await submitAdjustment(item);
    if (!success && item.physicalQty !== null && item.difference !== 0) {
      alert('Gagal menyesuaikan stok');
    }
  };

  const handleSubmitAllDiscrepancies = async () => {
    const discrepancyItems = opnameItems.filter(
      i => i.physicalQty !== null && i.difference !== 0 && i.status !== 'adjusted'
    );
    
    if (discrepancyItems.length === 0) {
      alert('Tidak ada selisih yang perlu disesuaikan');
      return;
    }
    
    if (!confirm(`Apakah Anda yakin ingin menyesuaikan ${discrepancyItems.length} item dengan selisih?`)) {
      return;
    }
    
    const success = await submitAllAdjustments();
    if (!success) {
      alert('Gagal menyesuaikan beberapa stok');
    }
  };

  const toggleProductExpand = (productName: string) => {
    toggleExpandedProduct(productName);
  };

  // Filter items
  const filteredItems = opnameItems.filter(item => {
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      if (
        !item.productName.toLowerCase().includes(searchLower) &&
        !item.variantName.toLowerCase().includes(searchLower) &&
        !item.sku.toLowerCase().includes(searchLower)
      ) {
        return false;
      }
    }
    
    // Status filter
    if (filterStatus === 'pending' && item.status !== 'pending') return false;
    if (filterStatus === 'counted' && item.status === 'pending') return false;
    if (filterStatus === 'discrepancy' && (item.physicalQty === null || item.difference === 0)) return false;
    
    // Discrepancy only toggle
    if (showOnlyDiscrepancy && (item.physicalQty === null || item.difference === 0)) return false;
    
    return true;
  });

  // Group by product
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.productName]) {
      acc[item.productName] = [];
    }
    acc[item.productName].push(item);
    return acc;
  }, {} as Record<string, OpnameItem[]>);

  const expandAll = () => {
    Object.keys(groupedItems).forEach(name => {
      if (!expandedProducts.has(name)) {
        toggleExpandedProduct(name);
      }
    });
  };

  const collapseAll = () => {
    expandedProducts.forEach(name => {
      toggleExpandedProduct(name);
    });
  };

  return (
    <div className="px-4 md:px-6 pb-6">
      {/* Success Toast */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
          <Check className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
        <a href="/dashboard" className="hover:text-gray-900 dark:hover:text-white transition">Dashboard</a>
        <span>›</span>
        <a href="/dashboard/stock" className="hover:text-gray-900 dark:hover:text-white transition">Stock</a>
        <span>›</span>
        <span className="text-gray-900 dark:text-white font-medium">Stock Opname</span>
      </nav>

      {/* Cabang Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <select
            value={selectedCabang}
            onChange={(e) => setSelectedCabang(e.target.value)}
            disabled={user?.role !== 'OWNER'}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
          >
            <option value="">Pilih Cabang</option>
            {cabangs.map((cabang) => (
              <option key={cabang.id} value={cabang.id}>
                {cabang.name}
              </option>
            ))}
          </select>
          
          {selectedCabang && (
            <button
              onClick={loadProducts}
              disabled={loadingProducts}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              title="Refresh Data"
            >
              <RefreshCw className={`w-5 h-5 ${loadingProducts ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {!selectedCabang ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Package className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Pilih Cabang untuk Memulai
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Silakan pilih cabang untuk melakukan stock opname
          </p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Item</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.counted}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Sudah Dihitung</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">{stats.pending}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Belum Dihitung</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.discrepancy}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Ada Selisih</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.adjusted}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Disesuaikan</div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari produk, varian, atau SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Semua Status</option>
                <option value="pending">Belum Dihitung</option>
                <option value="counted">Sudah Dihitung</option>
                <option value="discrepancy">Ada Selisih</option>
              </select>

              {/* Discrepancy Toggle */}
              <label className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnlyDiscrepancy}
                  onChange={(e) => setShowOnlyDiscrepancy(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm text-amber-700 dark:text-amber-400 whitespace-nowrap">
                  Selisih Saja
                </span>
              </label>

              {/* Expand/Collapse */}
              <div className="flex gap-2">
                <button
                  onClick={expandAll}
                  className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  onClick={collapseAll}
                  className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Submit All Discrepancies Button */}
          {stats.discrepancy > 0 && (
            <div className="mb-6">
              <button
                onClick={handleSubmitAllDiscrepancies}
                disabled={loading}
                className="w-full md:w-auto px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                Sesuaikan Semua Selisih ({stats.discrepancy - stats.adjusted} item)
              </button>
            </div>
          )}

          {/* Products List */}
          {loadingProducts ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
              <RefreshCw className="w-8 h-8 mx-auto text-indigo-600 animate-spin mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Memuat data produk...</p>
            </div>
          ) : Object.keys(groupedItems).length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
              <Package className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Tidak Ada Data
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {search || filterStatus !== 'all' || showOnlyDiscrepancy
                  ? 'Tidak ada item yang sesuai dengan filter'
                  : 'Belum ada produk di cabang ini'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedItems).map(([productName, items]) => {
                const isExpanded = expandedProducts.has(productName);
                const hasDiscrepancy = items.some(i => i.physicalQty !== null && i.difference !== 0);
                const allCounted = items.every(i => i.status !== 'pending');
                
                return (
                  <div
                    key={productName}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
                  >
                    {/* Product Header */}
                    <button
                      onClick={() => toggleProductExpand(productName)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          hasDiscrepancy ? 'bg-amber-500' :
                          allCounted ? 'bg-green-500' : 'bg-gray-300'
                        }`} />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {productName}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          ({items.length} varian)
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>

                    {/* Variants */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 dark:border-gray-700">
                        {items.map((item) => (
                          <div
                            key={item.variantId}
                            className={`px-4 py-3 border-b border-gray-100 dark:border-gray-700/50 last:border-b-0 ${
                              item.status === 'adjusted' ? 'bg-green-50 dark:bg-green-900/10' :
                              item.difference !== 0 && item.physicalQty !== null ? 'bg-amber-50 dark:bg-amber-900/10' : ''
                            }`}
                          >
                            <div className="flex flex-col md:flex-row md:items-center gap-4">
                              {/* Variant Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900 dark:text-white truncate">
                                    {item.variantName}
                                  </span>
                                  {item.status === 'adjusted' && (
                                    <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                                      Disesuaikan
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  SKU: {item.sku}
                                </div>
                              </div>

                              {/* System Qty */}
                              <div className="text-center px-4">
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Sistem</div>
                                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                  {item.systemQty}
                                </div>
                              </div>

                              {/* Physical Qty Input */}
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleQuickAdjust(item.variantId, -1)}
                                  disabled={item.status === 'adjusted'}
                                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition disabled:opacity-50"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <div className="text-center">
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Fisik</div>
                                  <input
                                    type="number"
                                    min="0"
                                    value={item.physicalQty ?? ''}
                                    onChange={(e) => handlePhysicalQtyChange(item.variantId, e.target.value)}
                                    disabled={item.status === 'adjusted'}
                                    placeholder="—"
                                    className="w-20 text-center text-lg font-semibold border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                                  />
                                </div>
                                <button
                                  onClick={() => handleQuickAdjust(item.variantId, 1)}
                                  disabled={item.status === 'adjusted'}
                                  className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition disabled:opacity-50"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Difference */}
                              <div className="text-center px-4 min-w-[80px]">
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Selisih</div>
                                <div className={`text-lg font-semibold ${
                                  item.difference > 0 ? 'text-green-600 dark:text-green-400' :
                                  item.difference < 0 ? 'text-red-600 dark:text-red-400' :
                                  'text-gray-400'
                                }`}>
                                  {item.physicalQty !== null ? (
                                    item.difference > 0 ? `+${item.difference}` : item.difference
                                  ) : '—'}
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-2">
                                {item.status !== 'adjusted' && (
                                  <>
                                    <button
                                      onClick={() => handleSetToSystem(item.variantId)}
                                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                                      title="Set sama dengan sistem"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleResetItem(item.variantId)}
                                      className="p-2 text-gray-500 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition"
                                      title="Reset"
                                    >
                                      <RotateCcw className="w-4 h-4" />
                                    </button>
                                    {item.physicalQty !== null && item.difference !== 0 && (
                                      <button
                                        onClick={() => handleSubmitAdjustment(item)}
                                        disabled={submitting === item.variantId}
                                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50 flex items-center gap-1"
                                      >
                                        {submitting === item.variantId ? (
                                          <RefreshCw className="w-4 h-4 animate-spin" />
                                        ) : (
                                          <Save className="w-4 h-4" />
                                        )}
                                        Adjust
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
