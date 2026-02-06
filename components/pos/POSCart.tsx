'use client';

import { RefObject } from 'react';
import { CartItem, PaymentMethod, DiscountType } from './types';

interface POSCartProps {
  cart: CartItem[];
  customerName: string;
  setCustomerName: (name: string) => void;
  customerPhone: string;
  setCustomerPhone: (phone: string) => void;
  showCustomerInfo: boolean;
  setShowCustomerInfo: (show: boolean) => void;
  discount: number;
  setDiscount: (discount: number) => void;
  discountType: DiscountType;
  setDiscountType: (type: DiscountType) => void;
  showDiscount: boolean;
  setShowDiscount: (show: boolean) => void;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  bankName: string;
  setBankName: (name: string) => void;
  referenceNo: string;
  setReferenceNo: (no: string) => void;
  cashReceived: number;
  setCashReceived: (amount: number) => void;
  cashInputRef: RefObject<HTMLInputElement | null>;
  subtotal: number;
  discountAmount: number;
  total: number;
  processing: boolean;
  onUpdateQuantity: (variantId: string, newQty: number) => void;
  onRemoveFromCart: (variantId: string) => void;
  onHold: () => void;
  onCheckout: () => void;
}

export function POSCart({
  cart,
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  showCustomerInfo,
  setShowCustomerInfo,
  discount,
  setDiscount,
  discountType,
  setDiscountType,
  showDiscount,
  setShowDiscount,
  paymentMethod,
  setPaymentMethod,
  bankName,
  setBankName,
  referenceNo,
  setReferenceNo,
  cashReceived,
  setCashReceived,
  cashInputRef,
  subtotal,
  discountAmount,
  total,
  processing,
  onUpdateQuantity,
  onRemoveFromCart,
  onHold,
  onCheckout,
}: POSCartProps) {
  return (
    <div className="xl:col-span-1 flex flex-col min-h-0">
      <div className="bg-gradient-to-br from-white to-slate-50 dark:from-gray-800 dark:to-slate-900/20 rounded-2xl shadow-xl border-2 border-slate-100 dark:border-slate-800 p-5 flex flex-col flex-1 min-h-0 overflow-hidden">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center flex-shrink-0">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Keranjang
        </h2>

        {/* Cart Items - Scrollable */}
        <div className="space-y-2 mb-4 overflow-y-auto flex-1 min-h-0">
          {cart.length === 0 ? (
            <div className="text-center py-8">
              <svg className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <p className="text-gray-400 dark:text-gray-500 font-medium text-sm">Keranjang masih kosong</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.productVariantId} className="flex items-center justify-between bg-white dark:bg-gray-700 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600 p-3">
                <div className="flex-1 min-w-0 mr-2">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{item.productName}</p>
                  {item.variantInfo && <p className="text-xs text-gray-500 dark:text-gray-400">{item.variantInfo}</p>}
                  <p className="text-sm font-bold text-blue-600 dark:text-blue-400">Rp {item.price.toLocaleString('id-ID')}</p>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => onUpdateQuantity(item.productVariantId, item.quantity - 1)}
                    className="w-7 h-7 flex items-center justify-center bg-gray-100 dark:bg-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 font-bold text-sm"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-bold text-gray-900 dark:text-white">{item.quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity(item.productVariantId, item.quantity + 1)}
                    className="w-7 h-7 flex items-center justify-center bg-blue-100 dark:bg-blue-600 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-500 font-bold text-sm"
                  >
                    +
                  </button>
                  <button
                    onClick={() => onRemoveFromCart(item.productVariantId)}
                    className="w-7 h-7 flex items-center justify-center bg-gray-100 dark:bg-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 text-sm"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Customer Info Toggle */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mb-3">
          <button
            type="button"
            onClick={() => setShowCustomerInfo(!showCustomerInfo)}
            tabIndex={-1}
            className="w-full flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <span>Info Pelanggan (opsional)</span>
            <svg className={`w-4 h-4 transition-transform ${showCustomerInfo ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showCustomerInfo && (
            <div className="space-y-2 mt-2">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nama Pelanggan"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="No. Telp"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          )}
        </div>

        {/* Discount Toggle */}
        <div className="mb-3">
          <button
            type="button"
            onClick={() => setShowDiscount(!showDiscount)}
            tabIndex={-1}
            className="w-full flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-2"
          >
            <span>Diskon (opsional)</span>
            <svg className={`w-4 h-4 transition-transform ${showDiscount ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showDiscount && (
            <>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => { setDiscountType('NOMINAL'); setDiscount(0); }}
                  className={`py-1.5 px-3 rounded-lg text-sm font-medium transition ${
                    discountType === 'NOMINAL' ? 'bg-slate-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Nominal (Rp)
                </button>
                <button
                  type="button"
                  onClick={() => { setDiscountType('PERCENTAGE'); setDiscount(0); }}
                  className={`py-1.5 px-3 rounded-lg text-sm font-medium transition ${
                    discountType === 'PERCENTAGE' ? 'bg-slate-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Persentase (%)
                </button>
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={discount || ''}
                  onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-2 pr-8 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="0"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                  {discountType === 'PERCENTAGE' ? '%' : 'Rp'}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Payment Method */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Metode Pembayaran</label>
          <div className="grid grid-cols-4 gap-1.5">
            {(['CASH', 'DEBIT', 'TRANSFER', 'QRIS'] as const).map((method) => (
              <button
                key={method}
                onClick={() => {
                  setPaymentMethod(method);
                  setBankName('');
                  setReferenceNo('');
                  setCashReceived(0);
                }}
                className={`py-2 px-2 rounded-lg text-xs font-medium transition ${
                  paymentMethod === method
                    ? 'bg-slate-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        {/* Cash Input */}
        {paymentMethod === 'CASH' && (
          <div className="space-y-2 mb-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Uang Diterima</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">Rp</span>
              <input
                ref={cashInputRef}
                type="text"
                value={cashReceived > 0 ? cashReceived.toLocaleString('id-ID') : ''}
                onChange={(e) => setCashReceived(parseInt(e.target.value.replace(/\D/g, '')) || 0)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="0"
              />
            </div>
            {cashReceived > 0 && (
              <div className={`rounded-lg p-2 ${
                cashReceived >= total
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }`}>
                <div className="flex justify-between items-center">
                  <span className={`text-sm font-medium ${
                    cashReceived >= total ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                  }`}>
                    {cashReceived >= total ? 'Kembalian:' : 'Kurang:'}
                  </span>
                  <span className={`text-base font-bold ${
                    cashReceived >= total ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                  }`}>
                    Rp {Math.abs(cashReceived - total).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bank Select */}
        {(paymentMethod === 'DEBIT' || paymentMethod === 'TRANSFER') && (
          <div className="space-y-2 mb-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bank</label>
            <select
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Pilih Bank</option>
              <option value="BCA">BCA</option>
              <option value="Mandiri">Mandiri</option>
              <option value="BRI">BRI</option>
              <option value="BNI">BNI</option>
              <option value="CIMB Niaga">CIMB Niaga</option>
              <option value="Lainnya">Lainnya</option>
            </select>
            <input
              type="text"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              placeholder={paymentMethod === 'DEBIT' ? 'Nomor Approval EDC' : 'Nomor Referensi'}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        )}

        {paymentMethod === 'QRIS' && (
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nomor Referensi</label>
            <input
              type="text"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              placeholder="Transaction ID dari QRIS"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        )}

        {/* Total */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mb-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
            <span className="font-medium text-gray-900 dark:text-white">Rp {subtotal.toLocaleString('id-ID')}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Diskon {discountType === 'PERCENTAGE' ? `(${discount}%)` : ''}:
              </span>
              <span className="text-red-600 dark:text-red-400 font-medium">
                -Rp {discountAmount.toLocaleString('id-ID')}
              </span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold pt-1">
            <span className="text-gray-900 dark:text-white">Total:</span>
            <span className="text-slate-600 dark:text-blue-400">Rp {total.toLocaleString('id-ID')}</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onHold}
            disabled={cart.length === 0}
            tabIndex={-1}
            className="flex-1 py-2.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg font-semibold hover:bg-amber-200 dark:hover:bg-amber-900/50 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Hold
          </button>
          <button
            onClick={onCheckout}
            disabled={cart.length === 0 || processing}
            data-process-payment
            className="flex-[2] py-2.5 bg-slate-600 text-white rounded-lg font-semibold hover:bg-slate-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
          >
            {processing ? 'Memproses...' : 'Bayar'}
          </button>
        </div>
      </div>
    </div>
  );
}
