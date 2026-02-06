'use client';

import { useEffect } from 'react';
import { 
  Package, AlertTriangle, TrendingDown, TrendingUp, RefreshCw, 
  Calendar, ArrowDownCircle, ArrowUpCircle, BarChart3,
  XCircle, CheckCircle, Clock, Filter, Boxes
} from 'lucide-react';
import { useStockReportStore, type ActiveTab } from './useStockReportStore';
import { SkeletonStatCard, SkeletonTable } from '@/components/ui/Skeleton';

const REASON_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  SALE: { label: 'Penjualan', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30', icon: TrendingDown },
  PURCHASE: { label: 'Pembelian', color: 'text-green-600 bg-green-100 dark:bg-green-900/30', icon: TrendingUp },
  RETURN: { label: 'Retur', color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30', icon: ArrowUpCircle },
  DAMAGED: { label: 'Rusak', color: 'text-red-600 bg-red-100 dark:bg-red-900/30', icon: XCircle },
  ADJUSTMENT: { label: 'Penyesuaian', color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30', icon: RefreshCw },
  TRANSFER_IN: { label: 'Transfer Masuk', color: 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30', icon: ArrowDownCircle },
  TRANSFER_OUT: { label: 'Transfer Keluar', color: 'text-pink-600 bg-pink-100 dark:bg-pink-900/30', icon: ArrowUpCircle },
  INITIAL: { label: 'Stok Awal', color: 'text-gray-600 bg-gray-100 dark:bg-gray-700', icon: Package },
  OPNAME: { label: 'Stock Opname', color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30', icon: CheckCircle },
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('id-ID', { 
    day: 'numeric', 
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function StockReportPage() {
  const {
    loading,
    cabangs,
    lowStockItems,
    adjustments,
    selectedCabang,
    dateRange,
    startDate,
    endDate,
    showCustomDate,
    reasonFilter,
    activeTab,
    summary,
    adjustmentsByReason,
    setSelectedCabang,
    setStartDate,
    setEndDate,
    setReasonFilter,
    setActiveTab,
    handleDateRangeChange,
    fetchInitialData,
    fetchReportData,
  } = useStockReportStore();

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    fetchReportData();
  }, [selectedCabang, dateRange, startDate, endDate, reasonFilter, fetchReportData]);

  return (
    <div className="px-4 md:px-6 pb-6 space-y-6">
      {/* Breadcrumb + Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <a href="/dashboard" className="hover:text-gray-900 dark:hover:text-white transition">Dashboard</a>
          <span>›</span>
          <span className="text-gray-900 dark:text-white font-medium">Stock Report</span>
        </nav>
        
        <button
          onClick={fetchReportData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select
              value={showCustomDate ? 'custom' : dateRange}
              onChange={(e) => handleDateRangeChange(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="7">7 Hari Terakhir</option>
              <option value="14">14 Hari Terakhir</option>
              <option value="30">30 Hari Terakhir</option>
              <option value="90">3 Bulan Terakhir</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {showCustomDate && (
            <>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <span className="text-gray-400">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </>
          )}

          <select
            value={selectedCabang}
            onChange={(e) => setSelectedCabang(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Semua Cabang</option>
            {cabangs.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'lowstock', label: 'Low Stock Alert', icon: AlertTriangle },
          { id: 'movement', label: 'Stock Movement', icon: RefreshCw },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ActiveTab)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition
              ${activeTab === tab.id 
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.id === 'lowstock' && lowStockItems.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-full">
                {lowStockItems.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </div>
          <SkeletonTable rows={10} columns={6} />
        </div>
      ) : (
        <>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {summary.totalStock.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Total Unit Stock</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <Boxes className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(summary.totalValue)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Nilai Inventori</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {summary.lowStockCount}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Low Stock Items</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {summary.outOfStockCount}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Out of Stock</p>
                </div>
              </div>

              {/* Movement Summary by Reason */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-indigo-600" />
                  Ringkasan Pergerakan Stock
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {Object.entries(adjustmentsByReason).map(([reason, data]) => {
                    const config = REASON_CONFIG[reason] || REASON_CONFIG.ADJUSTMENT;
                    const Icon = config.icon;
                    return (
                      <div key={reason} className={`p-3 rounded-lg ${config.color}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="w-4 h-4" />
                          <span className="font-medium text-sm">{config.label}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span>{data.count} transaksi</span>
                          <div className="flex gap-2">
                            {data.qtyIn > 0 && <span className="text-green-700">+{data.qtyIn}</span>}
                            {data.qtyOut > 0 && <span className="text-red-700">-{data.qtyOut}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {Object.keys(adjustmentsByReason).length === 0 && (
                    <div className="col-span-full text-center text-gray-400 py-4">
                      Tidak ada pergerakan stock dalam periode ini
                    </div>
                  )}
                </div>
              </div>

              {/* Product/Variant Stats */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  Statistik Produk
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.totalProducts}</p>
                    <p className="text-xs text-gray-500">Total Produk</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.totalVariants}</p>
                    <p className="text-xs text-gray-500">Total Varian</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{cabangs.length}</p>
                    <p className="text-xs text-gray-500">Cabang Aktif</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{adjustments.length}</p>
                    <p className="text-xs text-gray-500">Pergerakan Stock</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Low Stock Tab */}
          {activeTab === 'lowstock' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {lowStockItems.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Semua Stock Aman!</h3>
                  <p className="text-gray-500">Tidak ada produk dengan stock rendah saat ini.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Produk</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">SKU</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Cabang</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Stock Saat Ini</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Min. Stock</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Kekurangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {lowStockItems.map((item) => {
                        const currentStock = item.productVariant.stocks.find(s => s.cabangId === item.cabang.id)?.quantity || 0;
                        const shortage = item.minStock - currentStock;
                        return (
                          <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">{item.productVariant.product.name}</p>
                                <p className="text-xs text-gray-500">{item.productVariant.variantValue}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                                {item.productVariant.sku}
                              </code>
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{item.cabang.name}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`font-semibold ${currentStock === 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                                {currentStock}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-300">{item.minStock}</td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs font-medium">
                                <ArrowDownCircle className="w-3 h-3" />
                                {shortage}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Stock Movement Tab */}
          {activeTab === 'movement' && (
            <>
              {/* Reason Filter */}
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={reasonFilter}
                  onChange={(e) => setReasonFilter(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Semua Alasan</option>
                  {Object.entries(REASON_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {adjustments.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Tidak Ada Pergerakan</h3>
                    <p className="text-gray-500">Tidak ada pergerakan stock dalam periode yang dipilih.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Waktu</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Produk</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Cabang</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Alasan</th>
                          <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Perubahan</th>
                          <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Stock</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Oleh</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {adjustments.map((adj) => {
                          const config = REASON_CONFIG[adj.reason] || REASON_CONFIG.ADJUSTMENT;
                          const Icon = config.icon;
                          return (
                            <tr key={adj.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                              <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                {formatDate(adj.createdAt)}
                              </td>
                              <td className="px-4 py-3">
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">{adj.productVariant.product.name}</p>
                                  <p className="text-xs text-gray-500">{adj.productVariant.sku}</p>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{adj.cabang.name}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
                                  <Icon className="w-3 h-3" />
                                  {config.label}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`font-semibold ${adj.type === 'add' ? 'text-green-600' : 'text-red-600'}`}>
                                  {adj.type === 'add' ? '+' : '-'}{adj.quantity}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="text-gray-400">{adj.previousStock}</span>
                                <span className="mx-1">→</span>
                                <span className="font-medium text-gray-900 dark:text-white">{adj.newStock}</span>
                              </td>
                              <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{adj.adjustedBy.name}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
