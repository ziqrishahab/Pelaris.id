'use client';

import { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api';
import { getAuth } from '@/lib/auth';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useTheme } from '@/contexts/ThemeContext';

interface AppSettings {
  returnEnabled: boolean;
  returnDeadlineDays: number;
  returnRequiresApproval: boolean;
  exchangeEnabled: boolean;
}

type ThemeMode = 'light' | 'dark' | 'system';

export default function GeneralSettingsPage() {
  const auth = getAuth();
  const isOwner = auth?.user?.role === 'OWNER';
  const { themeMode, setThemeMode } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Original values untuk tracking perubahan
  const [originalTheme, setOriginalTheme] = useState<ThemeMode>('system');
  const [originalAppSettings, setOriginalAppSettings] = useState<AppSettings>({
    returnEnabled: false,
    returnDeadlineDays: 7,
    returnRequiresApproval: true,
    exchangeEnabled: false,
  });
  
  const [appSettings, setAppSettings] = useState<AppSettings>({
    returnEnabled: false,
    returnDeadlineDays: 7,
    returnRequiresApproval: true,
    exchangeEnabled: false,
  });

  // Check if ada perubahan
  const hasChanges = useMemo(() => {
    const generalChanged = themeMode !== originalTheme;
    const appChanged = isOwner && (
      appSettings.returnEnabled !== originalAppSettings.returnEnabled ||
      appSettings.returnDeadlineDays !== originalAppSettings.returnDeadlineDays ||
      appSettings.returnRequiresApproval !== originalAppSettings.returnRequiresApproval ||
      appSettings.exchangeEnabled !== originalAppSettings.exchangeEnabled
    );
    return generalChanged || appChanged;
  }, [themeMode, originalTheme, appSettings, originalAppSettings, isOwner]);

  useEffect(() => {
    loadAllSettings();
  }, []);

  const loadAllSettings = async () => {
    try {
      const savedTheme = localStorage.getItem('theme') as ThemeMode;
      
      if (savedTheme) {
        setOriginalTheme(savedTheme);
      }

      // Load app settings from backend (owner only)
      if (isOwner) {
        const response = await api.get('/settings/app');
        setAppSettings(response.data);
        setOriginalAppSettings(response.data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle theme change - langsung apply
  const handleThemeChange = (newTheme: ThemeMode) => {
    setThemeMode(newTheme);
  };

  // Save ALL settings
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      // Save to backend (optional sync)
      try {
        await api.put('/settings', { theme: themeMode });
      } catch {
        // Backend sync failed, continue with local save
      }

      // Save app settings (owner only)
      if (isOwner) {
        await api.put('/settings/app', appSettings);
        setOriginalAppSettings({ ...appSettings });
      }

      setOriginalTheme(themeMode);
      alert('Semua pengaturan berhasil disimpan!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['OWNER', 'MANAGER', 'ADMIN']}>
      <div className="px-4 md:px-6 space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <a href="/dashboard" className="hover:text-gray-900 dark:hover:text-white transition">Dashboard</a>
          <span>›</span>
          <a href="/dashboard/settings" className="hover:text-gray-900 dark:hover:text-white transition">Settings</a>
          <span>›</span>
          <span className="text-gray-900 dark:text-white font-medium">General</span>
        </nav>

        <div className="space-y-6">
          {/* General Settings Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Pengaturan Umum
              </h2>
              
              {/* Theme Settings */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  <span>Theme Mode</span>
                </label>
                <select 
                  value={themeMode}
                  onChange={(e) => handleThemeChange(e.target.value as ThemeMode)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                >
                  <option value="light">Terang</option>
                  <option value="dark">Gelap</option>
                  <option value="system">Otomatis (Ikuti Sistem)</option>
                </select>
              </div>

              {/* Currency Format */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Format Mata Uang</span>
                </label>
                <input
                  type="text"
                  value="IDR (Rupiah)"
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Format mata uang: Indonesian Rupiah (Rp)
                </p>
              </div>
            </div>
          </div>

          {/* Return & Exchange Settings Card - Owner Only */}
          {isOwner && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-4 md:p-6 lg:p-8 space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                  </svg>
                  Pengaturan Retur & Tukar
                </h2>
                
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Return Enabled Toggle */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">Fitur Retur</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Aktifkan fitur retur untuk mengembalikan barang dan uang
                        </p>
                      </div>
                      <button
                        onClick={() => setAppSettings(prev => ({ ...prev, returnEnabled: !prev.returnEnabled }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          appSettings.returnEnabled ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            appSettings.returnEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Settings shown when return is enabled */}
                    {appSettings.returnEnabled && (
                      <div className="space-y-4 pl-4 border-l-2 border-purple-200 dark:border-purple-800">
                        {/* Return Deadline */}
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                          <label className="block font-medium text-gray-900 dark:text-white mb-2">
                            Batas Waktu Retur
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              min="1"
                              max="365"
                              value={appSettings.returnDeadlineDays}
                              onChange={(e) => setAppSettings(prev => ({ 
                                ...prev, 
                                returnDeadlineDays: parseInt(e.target.value) || 7 
                              }))}
                              className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                            <span className="text-gray-600 dark:text-gray-400">hari setelah pembelian</span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Customer hanya bisa retur dalam jangka waktu ini
                          </p>
                        </div>

                        {/* Approval Required */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">Perlu Approval Manager</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Retur harus disetujui manager sebelum diproses
                            </p>
                          </div>
                          <button
                            onClick={() => setAppSettings(prev => ({ ...prev, returnRequiresApproval: !prev.returnRequiresApproval }))}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              appSettings.returnRequiresApproval ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                appSettings.returnRequiresApproval ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>

                        {/* Exchange Enabled Toggle */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">Fitur Tukar Barang</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Aktifkan fitur tukar ukuran/barang (tanpa refund uang)
                            </p>
                          </div>
                          <button
                            onClick={() => setAppSettings(prev => ({ ...prev, exchangeEnabled: !prev.exchangeEnabled }))}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              appSettings.exchangeEnabled ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                appSettings.exchangeEnabled ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20 border-2 border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-slate-600 dark:text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-300 mb-1">
                  Pengaturan Global Aplikasi
                </h3>
                <p className="text-sm text-slate-800 dark:text-slate-400 leading-relaxed">
                  Perubahan pada pengaturan general akan mempengaruhi tampilan dan perilaku seluruh aplikasi, 
                  termasuk web dashboard dan desktop POS.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            {hasChanges && (
              <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Ada perubahan yang belum disimpan
              </p>
            )}
            {!hasChanges && <div />}
            <button
              onClick={handleSaveAll}
              disabled={saving || !hasChanges}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <span className="flex items-center space-x-2">
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Simpan Pengaturan</span>
                  </>
                )}
              </span>
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
