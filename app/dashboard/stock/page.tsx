'use client';

import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { initSocket, subscribe } from '@/lib/socket';
import { useStockStore } from '@/stores/useStockStore';
import type { Variant, Product } from '@/stores/useStockStore';
import { 
  Search, 
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Download,
  Building2,
  Check,
  X,
  Eye,
  Edit3,
  ArrowRightLeft,
  ArrowDownUp,
  Bell,
  History,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  Plus,
  Minus
} from 'lucide-react';

export default function StockOverviewPage() {
  const router = useRouter();
  
  // Store state & actions
  const {
    // State
    products,
    cabangs,
    loading,
    searchTerm,
    selectedCabangs,
    showLowStockOnly,
    viewMode,
    activeTab,
    expandedProducts,
    adjustmentHistory,
    loadingHistory,
    stockAlerts,
    damagedCounts,
    submitting,
    adjustmentModal,
    quickHistoryModal,
    alertModal,
    alertMinStock,
    adjustmentForm,
    showStockInModal,
    stockInItems,
    stockInLoading,
    showCabangDropdown,
    activeActionMenu,
    adjustmentItems,
    // Basic actions
    setSearchTerm,
    setShowLowStockOnly,
    setViewMode,
    setActiveTab,
    toggleCabang,
    selectAllCabangs,
    clearAllCabangs,
    toggleExpandProduct,
    fetchData,
    fetchHistory,
    fetchStockAlerts: storeFetchStockAlerts,
    // Modal actions
    setAlertMinStock,
    setAdjustmentForm,
    setShowCabangDropdown,
    setActiveActionMenu,
    closeAdjustmentModal,
    closeQuickHistoryModal,
    closeAlertModal,
    removeAdjustmentItem,
    clearAdjustmentItems,
    // Stock-In actions
    openStockInModal,
    addStockInItem,
    removeStockInItem,
    updateStockInItem,
    searchSkuForStockIn,
    submitStockIn,
    setShowStockInModal,
    setStockInItems,
    // Adjustment actions
    addCurrentItemToAdjustment,
    submitAllAdjustments,
    openQuickHistory,
    openAdjustmentModal,
    changeCabangInAdjustmentModal,
    openHistoryForAllCabangs,
    // Alert actions
    openAlertModal,
    changeAlertCabang,
    submitAlert,
    deleteAlert,
  } = useStockStore();
  
  const cabangDropdownRef = useRef<HTMLDivElement>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
    storeFetchStockAlerts();
    
    // Initialize socket connection
    initSocket();
    
    // Subscribe to stock updates
    const unsubscribe = subscribe('stock:updated', () => {
      fetchData(); // Refresh data when stock changes
    });
    
    return () => {
      unsubscribe();
    };
  }, [fetchData, storeFetchStockAlerts]);

  // Fetch history when switching to history tab
  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory({});
    }
  }, [activeTab, fetchHistory]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cabangDropdownRef.current && !cabangDropdownRef.current.contains(event.target as Node)) {
        setShowCabangDropdown(false);
      }
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setActiveActionMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const visibleCabangs = useMemo(() => cabangs.filter(c => selectedCabangs.has(c.id)), [cabangs, selectedCabangs]);

  // Helper: check if variant has alert and is below threshold for specific cabang
  const getAlertStatus = useCallback((variantId: string, cabangId: string, currentQty: number) => {
    const key = `${variantId}-${cabangId}`;
    const alert = stockAlerts.get(key);
    if (!alert || !alert.isActive) return null;
    
    if (currentQty < alert.minStock) {
      return { hasAlert: true, isLow: true, minStock: alert.minStock };
    }
    return { hasAlert: true, isLow: false, minStock: alert.minStock };
  }, [stockAlerts]);

  // Helper: check if variant has any low stock alert (across any cabang)
  const isVariantLowStock = useCallback((variant: Variant) => {
    return variant.stocks.some(stock => {
      const key = `${variant.id}-${stock.cabang.id}`;
      const alert = stockAlerts.get(key);
      return alert?.isActive && stock.quantity < alert.minStock;
    });
  }, [stockAlerts]);

  // Helper: check if product has any variant with low stock alert
  const isProductLowStock = useCallback((product: Product) => {
    return product.variants.some(variant => isVariantLowStock(variant));
  }, [isVariantLowStock]);

  // Helper: get stock summary for a product per cabang
  const getProductStockByCabang = useCallback((product: Product, cabangId: string) => {
    let totalQty = 0;
    product.variants.forEach(variant => {
      const stock = variant.stocks.find(s => s.cabang.id === cabangId);
      totalQty += stock?.quantity || 0;
    });
    return totalQty;
  }, []);

  // Helper: get total stock for a product
  const getProductTotalStock = useCallback((product: Product) => {
    let total = 0;
    product.variants.forEach(variant => {
      variant.stocks.forEach(stock => {
        total += stock.quantity;
      });
    });
    return total;
  }, []);

  // Helper: get variant stock per cabang
  const getVariantStockByCabang = useCallback((variant: Variant, cabangId: string) => {
    const stock = variant.stocks.find(s => s.cabang.id === cabangId);
    return stock?.quantity || 0;
  }, []);

  // Helper: get variant damaged count per cabang
  const getVariantDamagedByCabang = useCallback((variantId: string, cabangId: string) => {
    const key = `${variantId}-${cabangId}`;
    return damagedCounts.get(key) || 0;
  }, [damagedCounts]);

  // Helper: get variant total damaged
  const getVariantTotalDamaged = useCallback((variant: Variant) => {
    return variant.stocks.reduce((sum, s) => {
      const damaged = getVariantDamagedByCabang(variant.id, s.cabang.id);
      return sum + damaged;
    }, 0);
  }, [getVariantDamagedByCabang]);

  // Helper: get product total damaged (sum of all variants)
  const getProductTotalDamaged = useCallback((product: Product) => {
    return product.variants.reduce((sum, variant) => {
      return sum + getVariantTotalDamaged(variant);
    }, 0);
  }, [getVariantTotalDamaged]);

  // Helper: get variant total stock
  const getVariantTotalStock = useCallback((variant: Variant) => {
    return variant.stocks.reduce((sum, s) => sum + s.quantity, 0);
  }, []);

  // Filter products based on search - memoized
  const filteredProducts = useMemo(() => products.filter(product => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesSearch = 
        product.name.toLowerCase().includes(search) ||
        product.category?.name?.toLowerCase().includes(search) ||
        product.variants.some(v => 
          v.sku.toLowerCase().includes(search) ||
          v.variantValue.toLowerCase().includes(search)
        );
      if (!matchesSearch) return false;
    }

    if (showLowStockOnly) {
      // Only show products that have variants with active low stock alerts
      if (!isProductLowStock(product)) return false;
    }

    return true;
  }), [products, searchTerm, showLowStockOnly, isProductLowStock]);

  // Summary calculations - memoized
  const { totalProducts, totalVariants, totalStockUnits, lowStockCount, outOfStockCount } = useMemo(() => {
    const totalProducts = filteredProducts.length;
    const totalVariants = filteredProducts.reduce((sum, p) => sum + p.variants.length, 0);
    const totalStockUnits = filteredProducts.reduce((sum, p) => sum + getProductTotalStock(p), 0);
    // Count variants that have active alerts and are below threshold
    const lowStockCount = filteredProducts.reduce((count, p) => {
      return count + p.variants.filter(v => isVariantLowStock(v)).length;
    }, 0);
    const outOfStockCount = filteredProducts.reduce((count, p) => {
      return count + p.variants.filter(v => getVariantTotalStock(v) === 0).length;
    }, 0);
    return { totalProducts, totalVariants, totalStockUnits, lowStockCount, outOfStockCount };
  }, [filteredProducts, getProductTotalStock, getVariantTotalStock, isVariantLowStock]);

  // Action handlers - thin wrappers for UI feedback
  const handleViewDetail = (productId: string) => {
    router.push(`/dashboard/products/${productId}`);
    setActiveActionMenu(null);
  };

  const handleAdjustStock = (variant: Variant, productName: string) => {
    const defaultCabangId = visibleCabangs[0]?.id || '';
    openAdjustmentModal(variant, productName, defaultCabangId);
  };

  const handleStockInItemChange = async (index: number, field: string, value: any) => {
    if (field === 'sku') {
      await searchSkuForStockIn(index, value);
    } else {
      updateStockInItem(index, field, value);
    }
  };

  const handleSubmitStockIn = async () => {
    const result = await submitStockIn();
    if (result === false) {
      alert('Pastikan semua item sudah diisi: SKU valid, cabang terpilih, dan quantity > 0');
    } else if (typeof result === 'object') {
      if (result.failed > 0) {
        alert(`Berhasil: ${result.success} item, Gagal: ${result.failed} item`);
      } else {
        alert(`Berhasil menambahkan stok untuk ${result.success} item`);
      }
    }
  };

  const handleSubmitAdjustment = async () => {
    try {
      const count = await submitAllAdjustments();
      if (count === false) {
        alert('Mohon tambahkan minimal satu item adjustment');
      } else {
        alert(`${count} adjustment berhasil disimpan!`);
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Gagal menyimpan adjustment');
    }
  };

  const handleAddItem = () => {
    if (!addCurrentItemToAdjustment()) {
      alert('Lengkapi data item terlebih dahulu');
    }
  };

  const handleTransferStock = (sku: string) => {
    router.push(`/dashboard/stock/transfers?sku=${sku}`);
    setActiveActionMenu(null);
  };

  const handleSetAlert = async (variant: Variant, productName: string) => {
    await openAlertModal(variant, productName, visibleCabangs[0]?.id || '');
  };
  
  const handleSubmitAlert = async () => {
    alert((await submitAlert()).message);
  };
  
  const handleDeleteAlert = async () => {
    if (!confirm('Nonaktifkan alert untuk item ini?')) return;
    alert((await deleteAlert()).message);
  };

  const handleViewHistory = async (variant: Variant, productName: string) => {
    await openHistoryForAllCabangs(variant.id, variant.variantValue, productName);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 md:px-6">
      {/* Breadcrumb + Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <a href="/dashboard" className="hover:text-gray-900 dark:hover:text-white transition">Dashboard</a>
          <span>›</span>
          <span className="text-gray-900 dark:text-white font-medium">Stock Overview</span>
        </nav>
        
        <div className="flex items-center gap-2">
          <button
            onClick={openStockInModal}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl font-medium"
          >
            <ArrowDownUp className="w-4 h-4" />
            Stock In
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalProducts}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Produk</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalVariants}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">SKU</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalStockUnits.toLocaleString()}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Unit</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{lowStockCount}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Low Stock</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{outOfStockCount}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Out of Stock</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            activeTab === 'overview'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Overview
          {activeTab === 'overview' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            activeTab === 'history'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Riwayat Adjustment
          {activeTab === 'history' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"></div>
          )}
        </button>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari produk, SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="relative" ref={cabangDropdownRef}>
            <button
              onClick={() => setShowCabangDropdown(!showCabangDropdown)}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors min-w-[180px]"
            >
              <Building2 className="w-4 h-4 text-gray-400" />
              <span className="flex-1 text-left">
                {selectedCabangs.size === 0 
                  ? 'Pilih Cabang' 
                  : selectedCabangs.size === cabangs.length 
                    ? 'Semua Cabang' 
                    : `${selectedCabangs.size} Cabang`}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showCabangDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showCabangDropdown && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden">
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Pilih cabang untuk ditampilkan</span>
                  <div className="flex gap-1">
                    <button onClick={selectAllCabangs} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-xs text-blue-600 dark:text-blue-400" title="Pilih Semua">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={clearAllCabangs} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-xs text-red-600 dark:text-red-400" title="Hapus Semua">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {cabangs.map(cabang => (
                    <label key={cabang.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedCabangs.has(cabang.id)}
                        onChange={() => toggleCabang(cabang.id)}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{cabang.name}</span>
                    </label>
                  ))}
                </div>
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{selectedCabangs.size} dari {cabangs.length} cabang dipilih</p>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              showLowStockOnly 
                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' 
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Low Stock Only
          </button>
        </div>

        <div className="flex gap-3">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('simple')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'simple' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Simple
            </button>
            <button
              onClick={() => setViewMode('advanced')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'advanced' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Advanced
            </button>
          </div>

          <button onClick={fetchData} className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <RefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>

          <button className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'overview' ? (
        <>
      {/* Stock Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-80">Produk</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                {visibleCabangs.map(cabang => (
                  <th key={cabang.id} className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-l border-gray-200 dark:border-gray-700 whitespace-nowrap">
                    {cabang.name}
                  </th>
                ))}
                {viewMode === 'advanced' && (
                  <>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-l border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                        <span>Available</span>
                      </div>
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <div className="flex items-center justify-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-yellow-500" />
                        <span>Reserved</span>
                      </div>
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <div className="flex items-center justify-center gap-1">
                        <Truck className="w-3.5 h-3.5 text-blue-500" />
                        <span>Transit</span>
                      </div>
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <div className="flex items-center justify-center gap-1">
                        <XCircle className="w-3.5 h-3.5 text-red-500" />
                        <span>Damaged</span>
                      </div>
                    </th>
                  </>
                )}
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-l border-gray-200 dark:border-gray-700 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={viewMode === 'advanced' ? 6 + visibleCabangs.length : 3 + visibleCabangs.length} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                    <Package className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                    <p className="text-sm">Tidak ada data stock</p>
                    {selectedCabangs.size === 0 && <p className="text-xs mt-1 text-gray-400">Pilih minimal satu cabang</p>}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product, index) => {
                  const totalStock = getProductTotalStock(product);
                  const isLowStock = isProductLowStock(product);
                  const isOutOfStock = totalStock === 0;
                  const variantCount = product.variants.length;
                  const isExpanded = expandedProducts.has(product.id);
                  const isSingle = product.productType === 'SINGLE';
                  const firstVariant = product.variants[0];

                  return (
                    <React.Fragment key={product.id}>
                      {/* Product Row */}
                      <tr 
                        className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors
                          ${isOutOfStock ? 'bg-red-50/30 dark:bg-red-900/5' : ''}
                          ${isLowStock ? 'bg-yellow-50/30 dark:bg-yellow-900/5' : ''}`}
                      >
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded flex items-center justify-center">
                              <span className="text-slate-600 dark:text-slate-300 font-bold text-sm">
                                {product.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => router.push(`/dashboard/products/${product.id}`)}
                                  className="text-sm font-medium text-gray-900 dark:text-white hover:text-slate-600 dark:hover:text-slate-400 transition-colors line-clamp-1 text-left"
                                >
                                  {product.name}
                                </button>
                                {isSingle ? (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                    Tunggal
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => toggleExpandProduct(product.id)}
                                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors hover:ring-2 hover:ring-purple-300 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300`}
                                  >
                                    <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                    {variantCount} Varian
                                  </button>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-gray-400">{product.category?.name || '-'}</span>
                                {isSingle && firstVariant && (
                                  <code className="text-[10px] font-mono bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-gray-500 dark:text-gray-400">{firstVariant.sku}</code>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold
                            ${isOutOfStock ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : ''}
                            ${isLowStock ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' : ''}
                            ${!isOutOfStock && !isLowStock ? 'text-gray-700 dark:text-gray-300' : ''}`}
                          >
                            {isLowStock && <AlertTriangle className="w-3 h-3" />}
                            {totalStock.toLocaleString()}
                          </span>
                        </td>
                        {visibleCabangs.map(cabang => {
                          const qty = getProductStockByCabang(product, cabang.id);
                          // Check if any variant in this product has alert for this cabang
                          const hasCabangAlert = product.variants.some(v => {
                            const alertStatus = getAlertStatus(v.id, cabang.id, getVariantStockByCabang(v, cabang.id));
                            return alertStatus?.isLow;
                          });
                          const cabangOut = qty === 0;
                          return (
                            <td key={cabang.id} className="px-3 py-2.5 text-center border-l border-gray-100 dark:border-gray-700">
                              <span className={`text-sm font-medium ${cabangOut ? 'text-red-500' : hasCabangAlert ? 'text-yellow-600' : 'text-gray-600 dark:text-gray-300'}`}>
                                {qty.toLocaleString()}
                              </span>
                            </td>
                          );
                        })}
                        {viewMode === 'advanced' && (
                          <>
                            <td className="px-3 py-2.5 text-center border-l border-gray-100 dark:border-gray-700">
                              <span className="text-sm text-green-600 dark:text-green-400">{totalStock.toLocaleString()}</span>
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <span className="text-sm text-yellow-600 dark:text-yellow-400">0</span>
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <span className="text-sm text-blue-600 dark:text-blue-400">0</span>
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <span className="text-sm text-red-600 dark:text-red-400">
                                {getProductTotalDamaged(product).toLocaleString()}
                              </span>
                            </td>
                          </>
                        )}
                        <td className="px-3 py-2.5 text-center border-l border-gray-100 dark:border-gray-700">
                          <div className="relative inline-block" ref={activeActionMenu === product.id ? actionMenuRef : null}>
                            <button 
                              onClick={() => setActiveActionMenu(activeActionMenu === product.id ? null : product.id)}
                              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                            >
                              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${activeActionMenu === product.id ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {activeActionMenu === product.id && (
                              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1">
                                <button
                                  onClick={() => handleViewDetail(product.id)}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                >
                                  <Eye className="w-4 h-4" />
                                  Lihat Detail
                                </button>
                                {isSingle && firstVariant && (
                                  <>
                                    <button
                                      onClick={() => handleAdjustStock(firstVariant, product.name)}
                                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                      Adjustment
                                    </button>
                                    <button
                                      onClick={() => handleTransferStock(firstVariant.sku)}
                                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                    >
                                      <ArrowRightLeft className="w-4 h-4" />
                                      Transfer
                                    </button>
                                    <hr className="my-1 border-gray-200 dark:border-gray-700" />
                                    <button
                                      onClick={() => handleSetAlert(firstVariant, product.name)}
                                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                    >
                                      <Bell className="w-4 h-4" />
                                      Set Alert
                                    </button>
                                    <button
                                      onClick={() => handleViewHistory(firstVariant, product.name)}
                                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                    >
                                      <History className="w-4 h-4" />
                                      Riwayat Stock
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Variant Sub-rows */}
                      {!isSingle && isExpanded && product.variants.map((variant, vIndex) => {
                        const variantTotal = getVariantTotalStock(variant);
                        const variantLow = isVariantLowStock(variant);
                        const variantOut = variantTotal === 0;

                        return (
                          <tr 
                            key={`${product.id}-${variant.id}`}
                            className="bg-purple-50/30 dark:bg-purple-900/10 border-l-4 border-purple-300 dark:border-purple-700"
                          >
                            <td className="px-4 py-2 pl-14">
                              <div className="flex items-center gap-2">
                                <ChevronRight className="w-3 h-3 text-purple-500 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-purple-700 dark:text-purple-400">
                                      {variant.variantValue}
                                    </span>
                                    <code className="text-[10px] font-mono bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-gray-500 dark:text-gray-400">{variant.sku}</code>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-2 text-center">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold
                                ${variantOut ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : ''}
                                ${variantLow ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' : ''}
                                ${!variantOut && !variantLow ? 'text-gray-700 dark:text-gray-300' : ''}`}
                              >
                                {variantLow && <AlertTriangle className="w-3 h-3" />}
                                {variantTotal.toLocaleString()}
                              </span>
                            </td>
                            {visibleCabangs.map(cabang => {
                              const qty = getVariantStockByCabang(variant, cabang.id);
                              const alertStatus = getAlertStatus(variant.id, cabang.id, qty);
                              const cabangOut = qty === 0;
                              const isAlertLow = alertStatus?.isLow;
                              
                              return (
                                <td key={cabang.id} className="px-3 py-2 text-center border-l border-gray-100 dark:border-gray-700">
                                  <div className="flex flex-col items-center gap-0.5">
                                    <span className={`text-sm ${cabangOut ? 'text-red-500' : isAlertLow ? 'text-orange-600 dark:text-orange-400 font-semibold' : 'text-gray-600 dark:text-gray-300'}`}>
                                      {qty.toLocaleString()}
                                    </span>
                                    {alertStatus?.hasAlert && (
                                      <span className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-medium ${
                                        isAlertLow 
                                          ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                      }`}>
                                        <Bell className="w-2.5 h-2.5" />
                                        {isAlertLow ? 'LOW' : `≥${alertStatus.minStock}`}
                                      </span>
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                            {viewMode === 'advanced' && (
                              <>
                                <td className="px-3 py-2 text-center border-l border-gray-100 dark:border-gray-700">
                                  <span className="text-sm text-green-600 dark:text-green-400">{variantTotal.toLocaleString()}</span>
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <span className="text-sm text-yellow-600 dark:text-yellow-400">0</span>
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <span className="text-sm text-blue-600 dark:text-blue-400">0</span>
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <span className="text-sm text-red-600 dark:text-red-400">{getVariantTotalDamaged(variant).toLocaleString()}</span>
                                </td>
                              </>
                            )}
                            <td className="px-3 py-2 text-center border-l border-gray-100 dark:border-gray-700">
                              <div className="relative inline-block" ref={activeActionMenu === variant.id ? actionMenuRef : null}>
                                <button 
                                  onClick={() => setActiveActionMenu(activeActionMenu === variant.id ? null : variant.id)}
                                  className="p-1 hover:bg-purple-200 dark:hover:bg-purple-800/30 rounded transition-colors"
                                >
                                  <ChevronDown className={`w-3.5 h-3.5 text-purple-500 transition-transform ${activeActionMenu === variant.id ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {activeActionMenu === variant.id && (
                                  <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1">
                                    <button
                                      onClick={() => handleAdjustStock(variant, product.name)}
                                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                      Adjustment
                                    </button>
                                    <button
                                      onClick={() => handleTransferStock(variant.sku)}
                                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                    >
                                      <ArrowRightLeft className="w-4 h-4" />
                                      Transfer
                                    </button>
                                    <button
                                      onClick={() => openQuickHistory(variant.id, visibleCabangs[0]?.id || '', variant.variantValue, product.name)}
                                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                    >
                                      <History className="w-4 h-4" />
                                      Riwayat
                                    </button>
                                    <hr className="my-1 border-gray-200 dark:border-gray-700" />
                                    <button
                                      onClick={() => handleSetAlert(variant, product.name)}
                                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                    >
                                      <Bell className="w-4 h-4" />
                                      Set Alert
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">Menampilkan {filteredProducts.length} produk ({totalVariants} SKU)</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Stock: <span className="font-semibold text-gray-900 dark:text-white">{totalStockUnits.toLocaleString()}</span> unit</p>
        </div>
      </div>

      {viewMode === 'advanced' && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Keterangan Status:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-gray-600 dark:text-gray-400">Available - Siap dijual</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              <span className="text-gray-600 dark:text-gray-400">Reserved - Di-booking</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-500" />
              <span className="text-gray-600 dark:text-gray-400">Transit - Dalam perjalanan</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-gray-600 dark:text-gray-400">Damaged - Rusak/cacat (dari StockAdjustment)</span>
            </div>
          </div>
        </div>
      )}
        </>
      ) : (
        <>
        {/* History Tab */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Riwayat Adjustment</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">History semua adjustment stock</p>
          </div>
          
          <div className="overflow-x-auto">
            {loadingHistory ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading...</div>
            ) : adjustmentHistory.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">Belum ada riwayat adjustment</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tanggal</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Produk / SKU</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cabang</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Sebelum</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Perubahan</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Sesudah</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Alasan</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Oleh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {adjustmentHistory.map((adj: any) => (
                    <tr key={adj.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 text-gray-900 dark:text-white whitespace-nowrap">
                        {new Date(adj.createdAt).toLocaleDateString('id-ID', { 
                          day: '2-digit', 
                          month: 'short', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-900 dark:text-white font-medium">{adj.productVariant?.product?.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{adj.productVariant?.name} • {adj.productVariant?.sku}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{adj.cabang?.name}</td>
                      <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">{adj.previousQty}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          adj.difference > 0 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}>
                          {adj.difference > 0 ? '+' : ''}{adj.difference}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-900 dark:text-white font-medium">{adj.newQty}</td>
                      <td className="px-4 py-3">
                        <div className="text-gray-700 dark:text-gray-300">{adj.reason}</div>
                        {adj.notes && <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{adj.notes}</div>}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{adj.adjustedBy?.name || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total: {adjustmentHistory.length} adjustment</p>
          </div>
        </div>
        </>
      )}

      {/* Adjustment Modal */}
      {adjustmentModal.isOpen && adjustmentModal.variant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Stock Adjustment</h3>
                <button
                  onClick={closeAdjustmentModal}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="mt-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{adjustmentModal.productName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {adjustmentModal.variant.variantValue !== 'Standard' && (
                    <span className="text-purple-600 dark:text-purple-400">{adjustmentModal.variant.variantValue} • </span>
                  )}
                  SKU: {adjustmentModal.variant.sku}
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-4 space-y-4">
              {/* Cabang Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cabang</label>
                <select
                  value={adjustmentModal.cabangId}
                  onChange={(e) => changeCabangInAdjustmentModal(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {visibleCabangs.map(cabang => (
                    <option key={cabang.id} value={cabang.id}>{cabang.name}</option>
                  ))}
                </select>
              </div>

              {/* Current Stock Display */}
              <div className="bg-gray-100 dark:bg-gray-700/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Stock Saat Ini</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{adjustmentModal.currentStock}</p>
              </div>

              {/* Adjustment Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipe Adjustment</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAdjustmentForm(prev => ({ ...prev, type: 'add' }))}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                      adjustmentForm.type === 'add'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 ring-2 ring-green-500'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    Tambah
                  </button>
                  <button
                    onClick={() => setAdjustmentForm(prev => ({ ...prev, type: 'subtract' }))}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                      adjustmentForm.type === 'subtract'
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 ring-2 ring-red-500'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Minus className="w-4 h-4" />
                    Kurangi
                  </button>
                </div>
              </div>

              {/* Quantity Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jumlah</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={adjustmentForm.quantity > 0 ? String(adjustmentForm.quantity) : ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    const num = value === '' ? 0 : parseInt(value, 10);
                    setAdjustmentForm({ ...adjustmentForm, quantity: num });
                  }}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Masukkan jumlah"
                />
                {adjustmentForm.quantity > 0 && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Stock baru: <span className={`font-semibold ${adjustmentForm.type === 'add' ? 'text-green-600' : 'text-red-600'}`}>
                      {adjustmentForm.type === 'add' 
                        ? adjustmentModal.currentStock + adjustmentForm.quantity 
                        : Math.max(0, adjustmentModal.currentStock - adjustmentForm.quantity)}
                    </span>
                  </p>
                )}
              </div>

              {/* Reason Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Alasan <span className="text-red-500">*</span></label>
                <select
                  value={adjustmentForm.reason}
                  onChange={(e) => setAdjustmentForm(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Pilih alasan...</option>
                  {adjustmentForm.type === 'add' ? (
                    <>
                      <option value="restock">Restock / Barang Masuk</option>
                      <option value="return">Return dari Customer</option>
                      <option value="found">Barang Ditemukan</option>
                      <option value="correction">Koreksi Stock Opname</option>
                      <option value="other_add">Lainnya</option>
                    </>
                  ) : (
                    <>
                      <option value="damaged">Barang Rusak</option>
                      <option value="expired">Barang Kadaluarsa</option>
                      <option value="lost">Barang Hilang</option>
                      <option value="sample">Sample / Tester</option>
                      <option value="correction">Koreksi Stock Opname</option>
                      <option value="other_subtract">Lainnya</option>
                    </>
                  )}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Catatan</label>
                <textarea
                  value={adjustmentForm.notes}
                  onChange={(e) => setAdjustmentForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={2}
                  placeholder="Catatan tambahan (opsional)"
                />
              </div>

              {/* Add Item Button */}
              <button
                onClick={handleAddItem}
                className="w-full py-2 px-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors border border-blue-200 dark:border-blue-800"
              >
                <Plus className="w-4 h-4" />
                Tambah ke List
              </button>

              {/* Items List */}
              {adjustmentItems.length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Item yang akan di-adjust ({adjustmentItems.length})
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {adjustmentItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.productName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{item.variant.variantValue} • {item.variant.sku}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                              item.type === 'add' 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            }`}>
                              {item.type === 'add' ? '+' : '-'}{item.quantity}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">• {item.reason}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => removeAdjustmentItem(item.id)}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3">
              <button
                onClick={() => {
                  closeAdjustmentModal();
                  clearAdjustmentItems();
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSubmitAdjustment}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {adjustmentItems.length > 0 ? `Simpan ${adjustmentItems.length} Adjustment` : 'Simpan Adjustment'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick History Modal */}
      {quickHistoryModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Riwayat Adjustment</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {quickHistoryModal.productName} • {quickHistoryModal.variantName}
                  </p>
                </div>
                <button
                  onClick={closeQuickHistoryModal}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingHistory ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</div>
              ) : adjustmentHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">Belum ada riwayat adjustment untuk item ini</div>
              ) : (
                <div className="space-y-3">
                  {adjustmentHistory.map((adj: any) => (
                    <div key={adj.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
                              adj.difference > 0 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            }`}>
                              {adj.difference > 0 ? '+' : ''}{adj.difference}
                            </span>
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {adj.previousQty} → {adj.newQty}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white mt-2">{adj.reason}</p>
                          {adj.notes && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{adj.notes}</p>}
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                            {adj.cabang && (
                              <>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full font-medium">
                                  <Building2 className="w-3 h-3" />
                                  {adj.cabang.name}
                                </span>
                                <span>•</span>
                              </>
                            )}
                            <span>{adj.adjustedBy?.name || '-'}</span>
                            <span>•</span>
                            <span>{new Date(adj.createdAt).toLocaleString('id-ID', { 
                              day: '2-digit', 
                              month: 'short', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {alertModal.isOpen && alertModal.variant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Set Stock Alert</h3>
                  {alertModal.existingAlert?.isActive && (
                    <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full">
                      <Bell className="w-3 h-3" />
                      Alert Aktif
                    </span>
                  )}
                </div>
                <button
                  onClick={closeAlertModal}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="mt-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{alertModal.productName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {alertModal.variant.variantValue !== 'Standard' && (
                    <span className="text-purple-600 dark:text-purple-400">{alertModal.variant.variantValue} • </span>
                  )}
                  SKU: {alertModal.variant.sku}
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-4 space-y-4">
              {/* Cabang Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cabang</label>
                <select
                  value={alertModal.cabangId}
                  onChange={(e) => changeAlertCabang(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {visibleCabangs.map(cabang => (
                    <option key={cabang.id} value={cabang.id}>{cabang.name}</option>
                  ))}
                </select>
              </div>

              {/* Current Stock Display */}
              <div className="bg-gray-100 dark:bg-gray-700/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Stock Saat Ini</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{alertModal.currentStock}</p>
              </div>

              {/* Minimum Stock Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Minimum Stock Alert
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                    (Notifikasi muncul jika stock &lt; nilai ini)
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={alertMinStock}
                    onChange={(e) => setAlertMinStock(e.target.value)}
                    min="0"
                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-lg font-semibold text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex gap-2">
                  <AlertTriangle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-700 dark:text-blue-300">
                    Alert akan muncul di dashboard jika stock mencapai atau di bawah <strong>{alertMinStock || 0}</strong> unit
                  </div>
                </div>
              </div>

              {/* Existing Alert Info */}
              {alertModal.existingAlert && (
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Alert sebelumnya: {alertModal.existingAlert.minStock} unit
                  {!alertModal.existingAlert.isActive && ' (Nonaktif)'}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between gap-3">
              {alertModal.existingAlert?.isActive && (
                <button
                  onClick={handleDeleteAlert}
                  className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  Nonaktifkan
                </button>
              )}
              <div className="flex-1"></div>
              <button
                onClick={closeAlertModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSubmitAlert}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Simpan Alert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock In Modal */}
      {showStockInModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 md:p-6 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <ArrowDownUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Stock In - Barang Masuk</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Tambah stok produk ke gudang</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowStockInModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-4 md:p-6">
              {/* Items List */}
              <div className="space-y-4 mb-4">
                {stockInItems.map((item, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-start justify-between mb-3">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-green-600 text-white text-xs font-bold rounded-full">
                        {index + 1}
                      </span>
                      {stockInItems.length > 1 && (
                        <button
                          onClick={() => removeStockInItem(index)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    {/* SKU Input - Primary Field */}
                    <div className="mb-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border-2 border-green-200 dark:border-green-800">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <span className="inline-flex items-center gap-2">
                          <Search className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span className="text-green-700 dark:text-green-300 font-semibold">Input SKU / Scan Barcode</span>
                          <span className="text-red-500">*</span>
                        </span>
                      </label>
                      <input
                        type="text"
                        value={item.sku}
                        onChange={(e) => handleStockInItemChange(index, 'sku', e.target.value)}
                        placeholder="Ketik atau scan SKU barcode disini..."
                        className={`w-full px-4 py-3 border-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 text-sm font-mono tracking-wider placeholder:font-sans placeholder:tracking-normal ${
                          item.skuError
                            ? 'border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500'
                            : 'border-green-300 dark:border-green-700 focus:ring-green-500 focus:border-green-500'
                        }`}
                        autoFocus={index === stockInItems.length - 1}
                      />
                      {item.skuError ? (
                        <p className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {item.skuError}
                        </p>
                      ) : (
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          Produk dan varian akan otomatis terdeteksi setelah input SKU
                        </p>
                      )}
                    </div>

                    {/* Auto-filled Product Info Display */}
                    {item.productName && (
                      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">{item.productName}</p>
                            <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">{item.variantName}</p>
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-mono">SKU: {item.sku}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Quantity */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Jumlah <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={item.quantity ? item.quantity.toLocaleString('id-ID') : ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            handleStockInItemChange(index, 'quantity', parseInt(value) || 0);
                          }}
                          placeholder="0"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                        />
                      </div>

                      {/* Cabang Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Cabang Tujuan <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={item.cabangId}
                          onChange={(e) => handleStockInItemChange(index, 'cabangId', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                        >
                          <option value="">-- Pilih Cabang --</option>
                          {cabangs.map(cabang => (
                            <option key={cabang.id} value={cabang.id}>
                              {cabang.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Item Button */}
              <button
                onClick={addStockInItem}
                className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-400 hover:border-green-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/10 transition-all font-medium text-sm"
              >
                <span className="inline-flex items-center">
                  <Plus className="w-5 h-5 mr-2" />
                  Tambah Item
                </span>
              </button>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowStockInModal(false)}
                  disabled={stockInLoading}
                  className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmitStockIn}
                  disabled={stockInLoading || stockInItems.length === 0}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:transform-none"
                >
                  {stockInLoading ? (
                    <span className="flex items-center justify-center">
                      <RefreshCw className="animate-spin h-5 w-5 mr-2" />
                      Menyimpan...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <Check className="w-5 h-5 mr-2" />
                      Simpan Stock In
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
