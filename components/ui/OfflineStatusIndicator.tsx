'use client';

import React, { useEffect, useState } from 'react';
import { useOfflineQueueStore } from '../../stores/useOfflineQueueStore';

/**
 * Indicator untuk menampilkan status offline dan transaksi pending
 * Ditampilkan di POS screen ketika ada transaksi yang belum tersync
 */
export function OfflineStatusIndicator() {
  const { 
    isOnline, 
    pendingCount, 
    isSyncing,
    initialize,
    syncAll,
    isInitialized,
  } = useOfflineQueueStore();
  
  const [showDialog, setShowDialog] = useState(false);

  // Initialize on mount
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [initialize, isInitialized]);

  // Don't show if no pending transactions and online
  // Always show a small indicator when online for visibility
  const showOnlineIndicator = isOnline && pendingCount === 0;

  return (
    <>
      {/* Indicator Button - always show online status */}
      <button
        onClick={() => !showOnlineIndicator && setShowDialog(true)}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium
          transition-colors duration-200
          ${!isOnline 
            ? 'bg-red-100 text-red-700 border border-red-300' 
            : pendingCount > 0 
              ? 'bg-orange-100 text-orange-700 border border-orange-300'
              : 'bg-green-100 text-green-700 border border-green-300 cursor-default'
          }
        `}
      >
        {!isOnline ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
          </svg>
        ) : pendingCount > 0 ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
        )}
        <span>
          {!isOnline ? 'Offline' : pendingCount > 0 ? `${pendingCount} pending` : 'Online'}
        </span>
      </button>

      {/* Dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b bg-gray-50">
              <div className={`p-2 rounded-full ${!isOnline ? 'bg-red-100' : 'bg-orange-100'}`}>
                {!isOnline ? (
                  <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {!isOnline ? 'Mode Offline' : 'Transaksi Offline'}
                </h3>
                <p className="text-sm text-gray-500">
                  {!isOnline 
                    ? 'Tidak ada koneksi internet' 
                    : `${pendingCount} transaksi belum tersinkronisasi`
                  }
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-4">
              {!isOnline ? (
                <div className="space-y-3">
                  <p className="text-gray-600">
                    Anda sedang dalam mode offline. Transaksi akan disimpan 
                    secara lokal dan otomatis disinkronkan saat koneksi internet tersedia.
                  </p>
                  {pendingCount > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                      <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-orange-700">
                        {pendingCount} transaksi menunggu sinkronisasi
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-gray-600">
                    Ada {pendingCount} transaksi yang belum tersinkronisasi ke server.
                    Transaksi akan otomatis disinkronkan saat koneksi stabil.
                  </p>
                  <p className="text-sm text-gray-500">
                    Anda juga dapat mencoba sinkronisasi manual dengan menekan tombol di bawah.
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 px-6 py-4 border-t bg-gray-50">
              <button
                onClick={() => setShowDialog(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Tutup
              </button>
              {isOnline && pendingCount > 0 && (
                <button
                  onClick={() => {
                    syncAll();
                    setShowDialog(false);
                  }}
                  disabled={isSyncing}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSyncing ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Menyinkronkan...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Sync Sekarang</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Banner untuk menunjukkan bahwa transaksi terakhir disimpan offline
 */
interface OfflineTransactionBannerProps {
  isOffline: boolean;
  onDismiss?: () => void;
}

export function OfflineTransactionBanner({ isOffline, onDismiss }: OfflineTransactionBannerProps) {
  if (!isOffline) return null;

  return (
    <div className="w-full px-4 py-3 bg-orange-50 border-b border-orange-200">
      <div className="flex items-center gap-3">
        <svg className="w-5 h-5 text-orange-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <div className="flex-1">
          <p className="text-sm font-medium text-orange-800">
            Transaksi disimpan offline
          </p>
          <p className="text-xs text-orange-600">
            Akan disinkronkan saat online
          </p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 text-orange-600 hover:text-orange-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default OfflineStatusIndicator;
