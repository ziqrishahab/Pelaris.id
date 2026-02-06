'use client';

import { HeldTransaction } from './types';

interface POSHoldModalProps {
  heldTransactions: HeldTransaction[];
  onRetrieve: (held: HeldTransaction) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function POSHoldModal({
  heldTransactions,
  onRetrieve,
  onDelete,
  onClose,
}: POSHoldModalProps) {
  const calculateTotal = (held: HeldTransaction) => {
    const subtotal = held.cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const discountAmount = held.discountType === 'PERCENTAGE' 
      ? (subtotal * held.discount / 100) 
      : held.discount;
    return subtotal - discountAmount;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Transaksi Di-hold ({heldTransactions.length})
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {heldTransactions.length === 0 ? (
            <p className="text-center text-gray-400 py-12">Tidak ada transaksi di-hold</p>
          ) : (
            heldTransactions.map((held) => {
              const heldTotal = calculateTotal(held);
              return (
                <div
                  key={held.id}
                  className="border-2 border-amber-200 dark:border-amber-800 rounded-xl p-5 bg-gradient-to-br from-white to-amber-50/30 dark:from-gray-800 dark:to-amber-900/10"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-semibold">
                        {new Date(held.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {held.customerName && (
                        <p className="text-sm font-medium text-gray-900 dark:text-white mt-2">{held.customerName}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                        Rp {heldTotal.toLocaleString('id-ID')}
                      </p>
                      <p className="text-xs text-gray-500">{held.cart.length} item</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onRetrieve(held)}
                      className="flex-1 py-2.5 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition"
                    >
                      Lanjutkan
                    </button>
                    <button
                      onClick={() => onDelete(held.id)}
                      className="px-4 py-2.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg font-semibold hover:bg-red-200 dark:hover:bg-red-900/50"
                      title="Hapus"
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
