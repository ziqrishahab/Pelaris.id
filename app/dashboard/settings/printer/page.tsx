'use client';

import { useEffect } from 'react';
import { usePrinterSettingsStore } from './usePrinterSettingsStore';

export default function PrinterSettingsPage() {
  const {
    selectedCabangId,
    cabangs,
    settings,
    loading,
    loadingData,
    message,
    setSelectedCabangId,
    updateSettings,
    toggleAutoPrint,
    loadCabangs,
    loadSettings,
    handleSave,
  } = usePrinterSettingsStore();

  // Load cabangs on mount
  useEffect(() => {
    loadCabangs();
  }, [loadCabangs]);

  // Load settings when cabang selected
  useEffect(() => {
    if (selectedCabangId) {
      loadSettings();
    }
  }, [selectedCabangId, loadSettings]);

  if (loadingData) {
    return (
      <div className="px-4 md:px-6">
        <nav className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
          <a href="/dashboard" className="hover:text-gray-900 dark:hover:text-white transition">Home</a>
          <span>›</span>
          <a href="/dashboard/settings" className="hover:text-gray-900 dark:hover:text-white transition">Settings</a>
          <span>›</span>
          <span className="font-semibold text-gray-900 dark:text-white">Printer</span>
        </nav>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Memuat pengaturan...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-6 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <a href="/dashboard" className="hover:text-gray-900 dark:hover:text-white transition">Dashboard</a>
        <span>›</span>
        <a href="/dashboard/settings" className="hover:text-gray-900 dark:hover:text-white transition">Settings</a>
        <span>›</span>
        <span className="text-gray-900 dark:text-white font-medium">Printer</span>
      </nav>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8">
          {/* Cabang Selector */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-900 dark:text-white mb-3">
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span>Pilih Cabang</span>
              <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedCabangId}
              onChange={(e) => setSelectedCabangId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            >
              <option value="">-- Pilih Cabang --</option>
              {cabangs.map((cabang) => (
                <option key={cabang.id} value={cabang.id}>
                  {cabang.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Pengaturan printer akan diterapkan untuk cabang yang dipilih
            </p>
          </div>

          {/* Auto Print Toggle */}
          <div className="flex items-start justify-between p-5 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-base font-semibold text-gray-900 dark:text-white">Auto Print Receipt</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Cetak struk secara otomatis setelah transaksi selesai tanpa konfirmasi
              </p>
            </div>
            <button
              onClick={toggleAutoPrint}
              className={`ml-4 relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                settings.autoPrintEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${
                  settings.autoPrintEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Printer Name */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-900 dark:text-white mb-3">
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Nama Printer</span>
              <span className="text-xs font-normal text-gray-500 dark:text-gray-400">(Opsional)</span>
            </label>
            <input
              type="text"
              value={settings.printerName}
              onChange={(e) => updateSettings({ printerName: e.target.value })}
              placeholder="Contoh: POS-58, Thermal Printer (kosongkan untuk default)"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            />
          </div>

          {/* Paper Width - Fixed 58mm */}
          <div className="p-5 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">58mm</span>
                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">Thermal Printer</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">Ukuran kertas standar untuk thermal printer POS</p>
              </div>
            </div>
          </div>



          {/* Receipt Header Customization */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-900 dark:text-white mb-3">
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Kustomisasi Header Struk</span>
            </label>
            <div className="space-y-4 p-5 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Nama Cabang
                  </label>
                  <input
                    type="text"
                    value={settings.branchName}
                    onChange={(e) => updateSettings({ branchName: e.target.value })}
                    placeholder="Cabang Pusat"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Alamat Toko
                </label>
                <input
                  type="text"
                  value={settings.address}
                  onChange={(e) => updateSettings({ address: e.target.value })}
                  placeholder="Jl. Contoh No. 123"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Nomor Telepon
                </label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) => updateSettings({ phone: e.target.value })}
                  placeholder="021-12345678"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Receipt Footer Customization */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-900 dark:text-white mb-3">
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              <span>Kustomisasi Footer Struk</span>
            </label>
            <div className="space-y-4 p-5 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Teks Footer 1
                </label>
                <input
                  type="text"
                  value={settings.footerText1}
                  onChange={(e) => updateSettings({ footerText1: e.target.value })}
                  placeholder="Terima kasih atas kunjungan Anda"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Teks Footer 2
                </label>
                <input
                  type="text"
                  value={settings.footerText2}
                  onChange={(e) => updateSettings({ footerText2: e.target.value })}
                  placeholder="Barang yang sudah dibeli tidak dapat dikembalikan"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Receipt Preview */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-900 dark:text-white mb-3">
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>Preview Struk</span>
            </label>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 p-4 md:p-6">
              <div className="mx-auto bg-white shadow-lg rounded-lg overflow-hidden max-w-[220px]">
                {/* Receipt Content - Thermal printer style - sama dengan local */}
                <div className="p-3 font-mono text-[11px] text-black leading-tight">
                  {/* Header - Center aligned */}
                  <div className="text-center mb-1">
                    <div className="font-bold text-base tracking-wide">{settings.storeName}</div>
                    {settings.branchName && <div>{settings.branchName}</div>}
                    {settings.address && <div>{settings.address}</div>}
                    {settings.phone && <div>Telp: {settings.phone}</div>}
                  </div>
                  
                  {/* Separator */}
                  <div className="text-center my-1">--------------------------------</div>
                  
                  {/* Transaction Info - Left aligned, format sederhana */}
                  <div className="space-y-0">
                    <div>Nomor   : INV-20251208-3908</div>
                    <div>Tanggal : {new Date().toLocaleDateString('id-ID')}, {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                    <div>Kasir   : Owner Toko</div>
                  </div>
                  
                  {/* Separator */}
                  <div className="text-center my-1">--------------------------------</div>
                  
                  {/* Items */}
                  <div className="space-y-1">
                    <div>
                      <div>Baju Seragam SD</div>
                      <div className="flex justify-between">
                        <span>3 x Rp 1.000.000</span>
                        <span>Rp 3.000.000</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Separator */}
                  <div className="text-center my-1">--------------------------------</div>
                  
                  {/* Total Section */}
                  <div className="space-y-0">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>Rp 3.000.000</span>
                    </div>
                    <div className="text-center my-0.5">--------------------------------</div>
                    <div className="flex justify-between font-bold">
                      <span>GRAND TOTAL</span>
                      <span>Rp 3.000.000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bayar (CASH)</span>
                      <span>Rp 3.000.000</span>
                    </div>
                  </div>
                  
                  {/* Separator */}
                  <div className="text-center my-1">--------------------------------</div>
                  
                  {/* Footer - Center aligned */}
                  <div className="text-center">
                    {settings.footerText1 && <div>{settings.footerText1}</div>}
                    {settings.footerText2 && (
                      <>
                        <div className="h-2"></div>
                        <div>{settings.footerText2}</div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-center mt-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Preview ukuran kertas: <span className="font-semibold">58mm</span> (Thermal Printer)
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Preview ini sesuai dengan output thermal printer
                </p>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-5">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
                  Pengaturan untuk Desktop App (Electron)
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-400 leading-relaxed">
                  Konfigurasi ini akan diterapkan pada aplikasi Desktop POS saat melakukan transaksi. 
                  Pastikan thermal printer sudah terinstall dan terkonfigurasi dengan benar di sistem operasi.
                </p>
                <div className="mt-3 flex items-center space-x-2 text-xs text-blue-700 dark:text-blue-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Thermal printer 58mm (POS-58, XP-58, dll)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`flex items-center space-x-3 p-4 rounded-xl border-2 ${
              message.includes('berhasil') 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300' 
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
            }`}>
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                {message.includes('berhasil') ? (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                )}
              </svg>
              <span className="font-medium">{message}</span>
            </div>
          )}

          {/* Save Button */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full md:w-auto px-6 md:px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {loading ? (
                <span className="flex items-center justify-center space-x-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Menyimpan...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Simpan Pengaturan</span>
                </span>
              )}
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center md:text-right">
              Perubahan akan berlaku saat transaksi berikutnya
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
