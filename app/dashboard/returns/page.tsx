'use client'

import { useEffect, useCallback } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useFilterStore } from '@/stores/useFilterStore'
import { useReturnsStore } from '@/stores/useReturnsStore'
import { RotateCcw, RefreshCw } from 'lucide-react'
import { SkeletonTable, SkeletonStatCard } from '@/components/ui/Skeleton'

export default function ReturnsPage() {
  // Use returns store for data and modals
  const {
    returns,
    stats,
    loading,
    modal,
    processing,
    fetchReturns,
    fetchStats,
    handleApprove,
    handleReject,
    openModal,
    closeModal,
    setModalNotes,
  } = useReturnsStore()
  
  // Use filter store for shared filter state
  const {
    search: searchQuery,
    startDate,
    endDate,
    selectedStatus: statusFilter,
    setSearch: setSearchQuery,
    setStartDate,
    setEndDate,
    setSelectedStatus: setStatusFilter,
  } = useFilterStore()

  const doFetchReturns = useCallback(async () => {
    await fetchReturns({
      status: statusFilter,
      search: searchQuery,
      startDate,
      endDate
    })
  }, [statusFilter, searchQuery, startDate, endDate, fetchReturns])

  useEffect(() => {
    doFetchReturns()
    fetchStats()
  }, [doFetchReturns, fetchStats])

  const onApprove = async () => {
    const result = await handleApprove()
    alert(result.message)
    if (result.success) {
      doFetchReturns()
      fetchStats()
    }
  }

  const onReject = async () => {
    const result = await handleReject()
    alert(result.message)
    if (result.success) {
      doFetchReturns()
      fetchStats()
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    }
    
    const labels = {
      PENDING: 'Menunggu',
      REJECTED: 'Ditolak',
      COMPLETED: 'Selesai'
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  const formatReason = (reason: string) => {
    const reasonLabels: { [key: string]: string } = {
      CUSTOMER_REQUEST: 'Permintaan Customer',
      OTHER: 'Lainnya',
      WRONG_SIZE: 'Salah Ukuran',
      WRONG_ITEM: 'Salah Barang',
      DEFECTIVE: 'Barang Rusak/Cacat',
      EXPIRED: 'Kadaluarsa',
      // Legacy reasons
      DAMAGED: 'Barang Rusak',
    }
    return reasonLabels[reason] || reason
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <ProtectedRoute allowedRoles={['OWNER', 'MANAGER']}>
      <div className="px-4 md:px-6 pb-6 space-y-6">
        {/* Breadcrumb + Action */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <a href="/dashboard" className="hover:text-gray-900 dark:hover:text-white transition">Dashboard</a>
            <span>›</span>
            <span className="text-gray-900 dark:text-white font-medium">Retur</span>
          </nav>
          
          <button
            onClick={() => { doFetchReturns(); fetchStats(); }}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">Selesai</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">Ditolak</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Refund</p>
              <p className="text-lg font-bold text-purple-600">{formatCurrency(stats.totalRefundAmount)}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="ALL">Semua Status</option>
                <option value="PENDING">Pending</option>
                <option value="COMPLETED">Selesai</option>
                <option value="REJECTED">Ditolak</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cari
              </label>
              <input
                type="text"
                placeholder="No Return / No Transaksi"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Dari Tanggal
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sampai Tanggal
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Returns Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <SkeletonTable rows={8} columns={8} />
          ) : returns.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">Tidak ada data return</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      No Return
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Tipe
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Transaksi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Kasir
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Cabang
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Nilai
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {returns.map((returnItem) => (
                    <tr key={returnItem.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {returnItem.returnNo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          returnItem.returnType === 'EXCHANGE' 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                        }`}>
                          {returnItem.returnType === 'EXCHANGE' ? 'Tukar' : 'Refund'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {returnItem.transaction.transactionNo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(returnItem.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {returnItem.processedBy.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {returnItem.cabang.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {returnItem.returnType === 'EXCHANGE' && returnItem.priceDifference != null ? (
                          <span className={(returnItem.priceDifference ?? 0) > 0 ? 'text-green-600' : (returnItem.priceDifference ?? 0) < 0 ? 'text-red-600' : ''}>
                            {(returnItem.priceDifference ?? 0) > 0 ? '+' : ''}{formatCurrency(returnItem.priceDifference ?? 0)}
                          </span>
                        ) : (
                          formatCurrency(returnItem.refundAmount)
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(returnItem.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => openModal('detail', returnItem)}
                          className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {modal.type === 'detail' && modal.selectedReturn && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Detail Return
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {modal.selectedReturn.returnNo}
                    </p>
                  </div>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Transaction Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Informasi Transaksi
                  </h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">No Transaksi</p>
                      <p className="font-medium text-gray-900 dark:text-white">{modal.selectedReturn.transaction.transactionNo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Tanggal Transaksi</p>
                      <p className="font-medium text-gray-900 dark:text-white">{formatDate(modal.selectedReturn.transaction.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Kasir</p>
                      <p className="font-medium text-gray-900 dark:text-white">{modal.selectedReturn.processedBy.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Cabang</p>
                      <p className="font-medium text-gray-900 dark:text-white">{modal.selectedReturn.cabang.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Metode Pembayaran</p>
                      <p className="font-medium text-gray-900 dark:text-white">{modal.selectedReturn.transaction.paymentMethod}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Tipe</p>
                      <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${
                        modal.selectedReturn.returnType === 'EXCHANGE' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                      }`}>
                        {modal.selectedReturn.returnType === 'EXCHANGE' ? 'Tukar Barang' : 'Refund'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                      <div className="mt-1">{getStatusBadge(modal.selectedReturn.status)}</div>
                    </div>
                  </div>
                </div>

                {/* Return Items */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Item yang Dikembalikan
                  </h3>
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Produk</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">SKU</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300">Qty</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300">Harga</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {modal.selectedReturn.items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                              {item.productName}
                              <br />
                              <span className="text-xs text-gray-500">{item.variantInfo}</span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{item.sku}</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">{item.quantity}</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">{formatCurrency(item.price)}</td>
                            <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">{formatCurrency(item.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <td colSpan={4} className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                            Subtotal Item Dikembalikan:
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-lg text-gray-900 dark:text-white">
                            {formatCurrency(modal.selectedReturn.subtotal)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Exchange Items (if EXCHANGE type) */}
                {modal.selectedReturn.returnType === 'EXCHANGE' && modal.selectedReturn.exchangeItems && modal.selectedReturn.exchangeItems.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-3">
                      🔄 Item Pengganti (Tukar)
                    </h3>
                    <div className="border border-blue-200 dark:border-blue-700 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-blue-50 dark:bg-blue-900/30">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-blue-700 dark:text-blue-300">Produk</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-blue-700 dark:text-blue-300">SKU</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-blue-700 dark:text-blue-300">Qty</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-blue-700 dark:text-blue-300">Harga</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-blue-700 dark:text-blue-300">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-blue-100 dark:divide-blue-800">
                          {modal.selectedReturn.exchangeItems.map((item: any) => (
                            <tr key={item.id}>
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                {item.productName}
                                <br />
                                <span className="text-xs text-gray-500">{item.variantInfo}</span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{item.sku}</td>
                              <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">{item.quantity}</td>
                              <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">{formatCurrency(item.price)}</td>
                              <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">{formatCurrency(item.subtotal)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-blue-50 dark:bg-blue-900/30">
                          <tr>
                            <td colSpan={4} className="px-4 py-3 text-right font-semibold text-blue-700 dark:text-blue-300">
                              Subtotal Item Pengganti:
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-lg text-blue-600">
                              {formatCurrency(modal.selectedReturn.exchangeItems.reduce((sum: number, item: any) => sum + item.subtotal, 0))}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Price Difference Summary */}
                    <div className={`mt-4 p-4 rounded-lg ${
                      (modal.selectedReturn.priceDifference || 0) > 0 
                        ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700'
                        : (modal.selectedReturn.priceDifference || 0) < 0 
                          ? 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700'
                          : 'bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
                    }`}>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900 dark:text-white">Selisih Harga:</span>
                        <span className={`text-xl font-bold ${
                          (modal.selectedReturn.priceDifference || 0) > 0 
                            ? 'text-green-600' 
                            : (modal.selectedReturn.priceDifference || 0) < 0 
                              ? 'text-red-600' 
                              : 'text-gray-600'
                        }`}>
                          {(modal.selectedReturn.priceDifference || 0) > 0 ? '+' : ''}{formatCurrency(modal.selectedReturn.priceDifference || 0)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {(modal.selectedReturn.priceDifference || 0) > 0 
                          ? 'Customer membayar selisih' 
                          : (modal.selectedReturn.priceDifference || 0) < 0 
                            ? 'Customer menerima refund selisih' 
                            : 'Tidak ada selisih harga'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Regular Refund Amount (for non-exchange) */}
                {modal.selectedReturn.returnType !== 'EXCHANGE' && (
                  <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900 dark:text-white">Total Refund:</span>
                      <span className="text-xl font-bold text-purple-600">
                        {formatCurrency(modal.selectedReturn.refundAmount)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Return Reason & Notes */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Alasan
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Alasan:</p>
                    <p className="font-medium text-gray-900 dark:text-white mb-3">
                      {formatReason(modal.selectedReturn.reason)}
                      {(modal.selectedReturn.reason === 'DEFECTIVE' || modal.selectedReturn.reason === 'EXPIRED') && (
                        <span className="ml-2 text-xs text-orange-600 dark:text-orange-400">
                          (Barang tidak masuk stok - write off)
                        </span>
                      )}
                    </p>
                    {modal.selectedReturn.notes && (
                      <>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Catatan:</p>
                        <p className="text-gray-900 dark:text-white">{modal.selectedReturn.notes}</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {modal.selectedReturn.status === 'PENDING' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => openModal('approve', modal.selectedReturn!)}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg"
                    >
                      Setujui Return
                    </button>
                    <button
                      onClick={() => openModal('reject', modal.selectedReturn!)}
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg"
                    >
                      Tolak Return
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Approve Modal */}
        {modal.type === 'approve' && modal.selectedReturn && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Konfirmasi Persetujuan {modal.selectedReturn.returnType === 'EXCHANGE' ? 'Tukar Barang' : 'Return'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Anda akan menyetujui <strong>{modal.selectedReturn.returnNo}</strong>.
                  {modal.selectedReturn.returnType === 'EXCHANGE' ? (
                    <>
                      <br /><br />
                      <span className="text-blue-600 dark:text-blue-400">
                        • Stok barang lama akan dikembalikan<br />
                        • Stok barang pengganti akan dikurangi
                      </span>
                      {(modal.selectedReturn.priceDifference || 0) !== 0 && (
                        <>
                          <br /><br />
                          <span className={(modal.selectedReturn.priceDifference ?? 0) > 0 ? 'text-green-600' : 'text-red-600'}>
                            Selisih harga: <strong>{(modal.selectedReturn.priceDifference ?? 0) > 0 ? '+' : ''}{formatCurrency(modal.selectedReturn.priceDifference ?? 0)}</strong>
                          </span>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      {' '}dengan total refund <strong>{formatCurrency(modal.selectedReturn.refundAmount)}</strong>. 
                      Stok akan dikembalikan ke cabang {modal.selectedReturn.cabang.name}.
                    </>
                  )}
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Catatan (Opsional)
                  </label>
                  <textarea
                    value={modal.notes}
                    onChange={(e) => setModalNotes(e.target.value)}
                    placeholder="Tambahkan catatan..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                    disabled={processing}
                  >
                    Batal
                  </button>
                  <button
                    onClick={onApprove}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg disabled:opacity-50"
                    disabled={processing}
                  >
                    {processing ? 'Memproses...' : 'Ya, Setujui'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {modal.type === 'reject' && modal.selectedReturn && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Konfirmasi Penolakan Return
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Anda akan menolak return <strong>{modal.selectedReturn.returnNo}</strong>. Mohon berikan alasan penolakan.
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Alasan Penolakan <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={modal.notes}
                    onChange={(e) => setModalNotes(e.target.value)}
                    placeholder="Berikan alasan penolakan..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={3}
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                    disabled={processing}
                  >
                    Batal
                  </button>
                  <button
                    onClick={onReject}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg disabled:opacity-50"
                    disabled={processing || !modal.notes.trim()}
                  >
                    {processing ? 'Memproses...' : 'Ya, Tolak'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
