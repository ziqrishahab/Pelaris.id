'use client';

interface Transaction {
  transactionNo: string;
  total: number;
  discount: number;
  paymentMethod: string;
  createdAt: string;
  items: Array<{
    productName: string;
    variantInfo?: string;
    quantity: number;
    price: number;
  }>;
}

interface POSSuccessModalProps {
  transaction: Transaction;
  cashReceived: number;
  qzConnected: boolean;
  printing: boolean;
  onPrint: (transaction: Transaction, cashAmount?: number) => void;
  onClose: () => void;
}

export function POSSuccessModal({
  transaction,
  cashReceived,
  qzConnected,
  printing,
  onPrint,
  onClose,
}: POSSuccessModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Transaksi Berhasil!</h3>
          <p className="text-gray-600 dark:text-gray-400">
            No. Invoice: <span className="font-mono font-semibold text-gray-900 dark:text-white">{transaction.transactionNo}</span>
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
          {/* Subtotal (if there's discount) */}
          {transaction.discount > 0 && (
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                Rp {(transaction.total + transaction.discount).toLocaleString('id-ID')}
              </span>
            </div>
          )}
          {/* Discount */}
          {transaction.discount > 0 && (
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-gray-400">Diskon:</span>
              <span className="font-medium text-red-600 dark:text-red-400">
                -Rp {transaction.discount.toLocaleString('id-ID')}
              </span>
            </div>
          )}
          {/* Total */}
          <div className={`flex justify-between ${transaction.discount > 0 ? 'pt-2 border-t border-gray-200 dark:border-gray-700' : ''} mb-2`}>
            <span className="text-gray-600 dark:text-gray-400">Total:</span>
            <span className="font-bold text-lg text-gray-900 dark:text-white">
              Rp {transaction.total.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-400">Pembayaran:</span>
            <span className="font-medium text-gray-900 dark:text-white">{transaction.paymentMethod}</span>
          </div>
          {transaction.paymentMethod === 'CASH' && cashReceived > 0 && (
            <>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Uang Diterima:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  Rp {cashReceived.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-green-700 dark:text-green-400 font-semibold">Kembalian:</span>
                <span className="font-bold text-green-700 dark:text-green-400">
                  Rp {(cashReceived - transaction.total).toLocaleString('id-ID')}
                </span>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => onPrint(transaction, cashReceived > 0 ? cashReceived : undefined)}
            disabled={printing || !qzConnected}
            className={`flex-1 py-2.5 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
              qzConnected
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
            title={!qzConnected ? 'QZ Tray tidak terhubung' : ''}
          >
            {printing ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Mencetak...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Cetak Struk
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-600 text-white rounded-lg font-medium hover:bg-slate-700 transition"
          >
            Transaksi Baru
          </button>
        </div>
        {!qzConnected && (
          <p className="text-xs text-amber-600 dark:text-amber-400 text-center mt-2">
            QZ Tray tidak terhubung. Install QZ Tray untuk mencetak struk.
          </p>
        )}
      </div>
    </div>
  );
}
