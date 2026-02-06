'use client';

import { useEffect } from 'react';
import { getAuth } from '@/lib/auth';
import { useDashboardStore, WIDGET_LABELS } from '@/stores/useDashboardStore';
import type { WidgetVisibility } from '@/stores/useDashboardStore';
import { TrendingUp, DollarSign, ShoppingBag, Package, AlertTriangle, Clock, Calendar, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { 
  DynamicLineChart as LineChart, 
  DynamicBarChart as BarChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from '@/components/charts';
import { SkeletonDashboardPage } from '@/components/ui/Skeleton';

export default function DashboardPage() {
  const { user } = getAuth();
  
  // Use store for all state
  const {
    summary,
    lowStockAlerts,
    salesTrend,
    topProducts,
    branchPerformance,
    timeStats,
    loading,
    showScreenOptions,
    widgetVisibility,
    setShowScreenOptions,
    toggleWidget,
    loadWidgetVisibility,
    fetchDashboardData,
  } = useDashboardStore();

  // Load visibility preferences from localStorage
  useEffect(() => {
    loadWidgetVisibility();
  }, [loadWidgetVisibility]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="px-4 md:px-6">
        <SkeletonDashboardPage />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 md:px-6">
      {/* Screen Options Button */}
      <div className="flex justify-end">
        <div className="relative">
          <button
            onClick={() => setShowScreenOptions(!showScreenOptions)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
          >
            <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Opsi Layar</span>
            {showScreenOptions ? (
              <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            )}
          </button>

          {/* Screen Options Dropdown */}
          {showScreenOptions && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Tampilkan Widget</h3>
              <div className="space-y-2">
                {Object.entries(WIDGET_LABELS).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={widgetVisibility[key as keyof WidgetVisibility]}
                      onChange={() => toggleWidget(key as keyof WidgetVisibility)}
                      className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Transaksi */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Transaksi</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {summary?.totalTransactions || 0}
              </p>
              <div className="flex items-center mt-2 text-sm text-green-600 dark:text-green-400">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>Hari ini</span>
              </div>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <ShoppingBag className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        {/* Total Pendapatan */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Pendapatan</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0
                }).format(summary?.totalRevenue || 0)}
              </p>
              <div className="flex items-center mt-2 text-sm text-green-600 dark:text-green-400">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>+12% dari kemarin</span>
              </div>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        {/* Stok Menipis */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Stok Menipis</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {lowStockAlerts.length}
              </p>
              <div className="flex items-center mt-2 text-sm text-orange-600 dark:text-orange-400">
                <AlertTriangle className="w-4 h-4 mr-1" />
                <span>Perlu perhatian</span>
              </div>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Package className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Sales Trend Chart */}
      {widgetVisibility.salesTrend && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center mb-4">
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Tren Penjualan (7 Hari Terakhir)
            </h2>
          </div>
          {salesTrend.length > 0 ? (
          <div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs text-gray-600 dark:text-gray-400"
                    tickFormatter={(value) => new Date(value).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis className="text-xs text-gray-600 dark:text-gray-400" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb' }}
                    labelFormatter={(value) => new Date(value).toLocaleDateString('id-ID', { weekday: 'long', month: 'long', day: 'numeric' })}
                    formatter={(value: any) => ['Rp ' + value.toLocaleString('id-ID'), 'Total Penjualan']}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#8b5cf6" 
                    strokeWidth={3}
                    name="Total Penjualan"
                    dot={{ fill: '#8b5cf6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
              </LineChart>
            </ResponsiveContainer>
          </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
              <TrendingUp className="w-12 h-12 mb-2 opacity-30" />
              <p className="text-sm">Belum ada data penjualan</p>
            </div>
          )}
        </div>
      )}

      {/* Top Products & Branch Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        {widgetVisibility.topProducts && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center mb-4">
              <Package className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Produk Terlaris
              </h2>
            </div>
            {topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div key={product.productVariantId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{product.productName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{product.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{product.totalQuantity} unit</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Rp {product.totalRevenue.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                <Package className="w-12 h-12 mb-2 opacity-30" />
                <p className="text-sm">Belum ada data produk terlaris</p>
              </div>
            )}
          </div>
        )}

        {/* Branch Performance */}
        {widgetVisibility.branchPerformance && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center mb-4">
              <ShoppingBag className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Performa Cabang
              </h2>
            </div>
            {branchPerformance.length > 0 ? (
            <div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={branchPerformance}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis 
                  dataKey="cabangName" 
                  className="text-xs text-gray-600 dark:text-gray-400"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis className="text-xs text-gray-600 dark:text-gray-400" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb' }}
                  formatter={(value: any) => 'Rp ' + value.toLocaleString('id-ID')}
                />
                <Bar dataKey="totalRevenue" fill="#8b5cf6" name="Total Pendapatan" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                <ShoppingBag className="w-12 h-12 mb-2 opacity-30" />
                <p className="text-sm">Belum ada data performa cabang</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Time Statistics */}
      {widgetVisibility.timeStats && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center mb-4">
            <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Waktu Tersibuk
            </h2>
          </div>
          {timeStats ? (
          <div>
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/10 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Jam Tersibuk</span>
                  <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {timeStats.busiestHour.hour}:00
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {timeStats.busiestHour.count} transaksi · Rp {timeStats.busiestHour.total.toLocaleString('id-ID')}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Hari Tersibuk</span>
                  <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {timeStats.busiestDay.day}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {timeStats.busiestDay.count} transaksi · Rp {timeStats.busiestDay.total.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
              <Clock className="w-12 h-12 mb-2 opacity-30" />
              <p className="text-sm">Belum ada data waktu tersibuk</p>
            </div>
          )}
        </div>
      )}

      {/* Daily Distribution */}
      {widgetVisibility.dailyDistribution && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center mb-4">
            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Distribusi Transaksi per Hari
            </h2>
          </div>
          {timeStats?.dailyStats && timeStats.dailyStats.length > 0 ? (
          <div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={timeStats.dailyStats}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis 
                  dataKey="day" 
                  className="text-xs text-gray-600 dark:text-gray-400"
                />
                <YAxis className="text-xs text-gray-600 dark:text-gray-400" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb' }}
                  formatter={(value: any) => [value + ' transaksi', 'Total']}
                />
                <Bar dataKey="count" fill="#3b82f6" name="Jumlah Transaksi" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
              <Calendar className="w-12 h-12 mb-2 opacity-30" />
              <p className="text-sm">Belum ada data distribusi harian</p>
            </div>
          )}
        </div>
      )}

      {/* Payment Method Breakdown */}
      {widgetVisibility.paymentMethods && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center mb-4">
            <DollarSign className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Metode Pembayaran
            </h2>
          </div>
          {summary?.paymentMethodBreakdown && summary.paymentMethodBreakdown.length > 0 ? (
          <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {summary.paymentMethodBreakdown.map((method: any) => (
                  <div
                    key={method.paymentMethod}
                    className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-750 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{method.paymentMethod}</span>
                      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-semibold rounded">
                        {method._count.id}x
                      </span>
                    </div>
                    <p className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                      Rp {(method._sum.total || 0).toLocaleString('id-ID')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Total transaksi {method.paymentMethod.toLowerCase()}
                    </p>
                  </div>
                ))}
              </div>
          </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
              <DollarSign className="w-12 h-12 mb-2 opacity-30" />
              <p className="text-sm">Belum ada data metode pembayaran</p>
            </div>
          )}
        </div>
      )}

      {/* Low Stock Alerts */}
      {widgetVisibility.lowStock && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Peringatan Stok Menipis
            </h2>
            {lowStockAlerts.length > 0 && (
              <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-sm font-semibold rounded-full">
                {lowStockAlerts.length} item
              </span>
            )}
          </div>
          {lowStockAlerts.length > 0 ? (
          <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-750">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Produk
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Variant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Cabang
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Stok
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {lowStockAlerts.map((alert: any) => (
                  <tr key={alert.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {alert.productName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {alert.variantName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {alert.sku}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {alert.cabangName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {alert.currentStock}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Tidak ada stok yang menipis</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
