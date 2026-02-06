'use client';

import { useEffect, useMemo } from 'react';
import { useSalesReportStore } from '@/stores/useSalesReportStore';
import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, 
  Calendar, RefreshCw, Store, CreditCard, Wallet, Building2, 
  PieChart, ArrowUpRight, ShoppingBag
} from 'lucide-react';
import { SkeletonStatCard, SkeletonTable, SkeletonChart } from '@/components/ui/Skeleton';

const PAYMENT_ICONS: Record<string, any> = {
  CASH: Wallet,
  DEBIT: CreditCard,
  TRANSFER: Building2,
  QRIS: DollarSign,
};

const PAYMENT_COLORS: Record<string, string> = {
  CASH: 'bg-green-500',
  DEBIT: 'bg-blue-500',
  TRANSFER: 'bg-purple-500',
  QRIS: 'bg-orange-500',
};

export default function SalesReportPage() {
  // Use store for all state
  const {
    loading,
    summary,
    trend,
    topProducts,
    branchPerformance,
    cabangs,
    channels,
    selectedCabang,
    selectedChannel,
    dateRange,
    startDate,
    endDate,
    showCustomDate,
    // Actions
    setSelectedCabang,
    setSelectedChannel,
    setStartDate,
    setEndDate,
    fetchInitialData,
    fetchReportData,
    handleDateRangeChange,
  } = useSalesReportStore();

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    fetchReportData();
  }, [selectedCabang, selectedChannel, dateRange, startDate, endDate, fetchReportData]);

  const stats = useMemo(() => {
    if (!summary) return null;
    
    const avgTransaction = summary.totalTransactions > 0 
      ? summary.totalRevenue / summary.totalTransactions 
      : 0;
    
    const midPoint = Math.floor(trend.length / 2);
    const firstHalf = trend.slice(0, midPoint).reduce((sum, t) => sum + t.total, 0);
    const secondHalf = trend.slice(midPoint).reduce((sum, t) => sum + t.total, 0);
    const trendPercentage = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0;

    return {
      avgTransaction,
      trendPercentage,
      totalItems: topProducts.reduce((sum, p) => sum + p.totalQuantity, 0)
    };
  }, [summary, trend, topProducts]);

  const maxTrendValue = useMemo(() => Math.max(...trend.map(t => t.total), 1), [trend]);
  const totalPayments = useMemo(() => 
    summary?.paymentMethodBreakdown.reduce((sum, p) => sum + p._count.id, 0) || 1, 
    [summary]
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="px-4 md:px-6 pb-6 space-y-6">
      {/* Breadcrumb + Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <a href="/dashboard" className="hover:text-gray-900 dark:hover:text-white transition">Dashboard</a>
          <span>›</span>
          <span className="text-gray-900 dark:text-white font-medium">Sales Report</span>
        </nav>
        
        <button
          onClick={fetchReportData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
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

          <select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Semua Channel</option>
            {channels.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SkeletonChart height={250} />
            <SkeletonChart height={250} />
          </div>
          <SkeletonTable rows={5} columns={5} />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                {stats && stats.trendPercentage !== 0 && (
                  <span className={`flex items-center text-xs font-medium ${stats.trendPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.trendPercentage >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                    {Math.abs(stats.trendPercentage).toFixed(1)}%
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(summary?.totalRevenue || 0)}
              </p>
              <p className="text-sm text-gray-500 mt-1">Total Revenue</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <ShoppingCart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {(summary?.totalTransactions || 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 mt-1">Total Transaksi</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <ArrowUpRight className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(stats?.avgTransaction || 0)}
              </p>
              <p className="text-sm text-gray-500 mt-1">Rata-rata/Transaksi</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Package className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {(stats?.totalItems || 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 mt-1">Items Terjual</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Sales Trend Chart */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Trend Penjualan
              </h3>
              <div className="h-64">
                {trend.length > 0 ? (
                  <div className="flex items-end justify-between h-full gap-1 px-2">
                    {trend.map((item, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center gap-1">
                        <div 
                          className="w-full bg-blue-500 dark:bg-blue-600 rounded-t-sm hover:bg-blue-600 dark:hover:bg-blue-500 transition cursor-pointer group relative"
                          style={{ height: `${Math.max((item.total / maxTrendValue) * 100, 2)}%` }}
                        >
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                            {formatCurrency(item.total)}
                            <br />
                            <span className="text-gray-300">{item.count} transaksi</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate w-full text-center">
                          {formatDate(item.date)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    Tidak ada data
                  </div>
                )}
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-purple-600" />
                Metode Pembayaran
              </h3>
              <div className="space-y-3">
                {summary?.paymentMethodBreakdown.map((item) => {
                  const Icon = PAYMENT_ICONS[item.paymentMethod] || Wallet;
                  const percentage = ((item._count.id / totalPayments) * 100).toFixed(1);
                  return (
                    <div key={item.paymentMethod} className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${PAYMENT_COLORS[item.paymentMethod] || 'bg-gray-500'} bg-opacity-20`}>
                        <Icon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.paymentMethod}
                          </span>
                          <span className="text-sm text-gray-500">{percentage}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${PAYMENT_COLORS[item.paymentMethod] || 'bg-gray-500'} rounded-full transition-all`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {item._count.id} transaksi • {formatCurrency(item._sum.total || 0)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {(!summary?.paymentMethodBreakdown || summary.paymentMethodBreakdown.length === 0) && (
                  <p className="text-center text-gray-400 py-4">Tidak ada data</p>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-orange-600" />
                Produk Terlaris
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                      <th className="text-left py-2 font-medium">#</th>
                      <th className="text-left py-2 font-medium">Produk</th>
                      <th className="text-right py-2 font-medium">Qty</th>
                      <th className="text-right py-2 font-medium">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {topProducts.slice(0, 5).map((product, index) => (
                      <tr key={product.productVariantId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-2.5">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
                            ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                              index === 1 ? 'bg-gray-100 text-gray-600' : 
                              index === 2 ? 'bg-orange-100 text-orange-700' : 
                              'bg-gray-50 text-gray-500'}`}
                          >
                            {index + 1}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                              {product.productName}
                            </p>
                            {product.variantValue !== '-' && (
                              <p className="text-xs text-gray-500">{product.variantValue}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 text-right font-medium text-gray-900 dark:text-white">
                          {product.totalQuantity.toLocaleString()}
                        </td>
                        <td className="py-2.5 text-right text-gray-600 dark:text-gray-300">
                          {formatCurrency(product.totalRevenue)}
                        </td>
                      </tr>
                    ))}
                    {topProducts.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-gray-400">
                          Tidak ada data
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Branch Performance */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Store className="w-5 h-5 text-green-600" />
                Performa Cabang
              </h3>
              <div className="space-y-3">
                {branchPerformance.map((branch, index) => {
                  const maxRevenue = Math.max(...branchPerformance.map(b => b.totalRevenue), 1);
                  const percentage = (branch.totalRevenue / maxRevenue) * 100;
                  return (
                    <div key={branch.cabangId} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
                            ${index === 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                          >
                            {index + 1}
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">{branch.cabangName}</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(branch.totalRevenue)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-20 text-right">
                          {branch.totalTransactions} trx
                        </span>
                      </div>
                    </div>
                  );
                })}
                {branchPerformance.length === 0 && (
                  <p className="text-center text-gray-400 py-4">Tidak ada data</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
