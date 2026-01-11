'use client';

import { create } from 'zustand';
import { cabangAPI } from '@/lib/api';

// ============ Types ============
export interface PrinterSettings {
  autoPrintEnabled: boolean;
  printerName: string;
  paperWidth: number;
  storeName: string;
  branchName: string;
  address: string;
  phone: string;
  footerText1: string;
  footerText2: string;
}

const DEFAULT_SETTINGS: PrinterSettings = {
  autoPrintEnabled: true,
  printerName: '',
  paperWidth: 58,
  storeName: 'Pelaris.id',
  branchName: '',
  address: '',
  phone: '',
  footerText1: 'Terima kasih atas kunjungan Anda',
  footerText2: '',
};

// ============ State Interface ============
interface PrinterSettingsState {
  // Data
  selectedCabangId: string;
  cabangs: any[];
  settings: PrinterSettings;
  loading: boolean;
  loadingData: boolean;
  message: string;
  
  // Actions
  setSelectedCabangId: (id: string) => void;
  updateSettings: (updates: Partial<PrinterSettings>) => void;
  toggleAutoPrint: () => void;
  loadCabangs: () => Promise<void>;
  loadSettings: () => Promise<void>;
  handleSave: () => Promise<void>;
  clearMessage: () => void;
}

// ============ Store ============
export const usePrinterSettingsStore = create<PrinterSettingsState>((set, get) => ({
  // Data
  selectedCabangId: '',
  cabangs: [],
  settings: { ...DEFAULT_SETTINGS },
  loading: false,
  loadingData: true,
  message: '',
  
  // Actions
  setSelectedCabangId: (id) => set({ selectedCabangId: id }),
  
  updateSettings: (updates) => set((state) => ({
    settings: { ...state.settings, ...updates }
  })),
  
  toggleAutoPrint: () => set((state) => ({
    settings: { ...state.settings, autoPrintEnabled: !state.settings.autoPrintEnabled }
  })),
  
  clearMessage: () => set({ message: '' }),
  
  loadCabangs: async () => {
    try {
      const response = await cabangAPI.getCabangs();
      const cabangList = response.data || [];
      set({ cabangs: cabangList });
      if (cabangList.length > 0) {
        set({ selectedCabangId: cabangList[0].id });
      }
    } catch (error) {
      console.error('Failed to load cabangs:', error);
    }
  },
  
  loadSettings: async () => {
    const { selectedCabangId, cabangs } = get();
    if (!selectedCabangId) return;
    
    set({ loadingData: true });
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-pelaris.ziqrishahab.com/api';
    
    try {
      const response = await fetch(`${API_URL}/settings/printer?cabangId=${selectedCabangId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Auto-fill branchName from selected cabang if empty
        const selectedCabang = cabangs.find(c => c.id === selectedCabangId);
        const defaultBranchName = data.branchName || (selectedCabang ? `Cabang ${selectedCabang.name}` : '');
        
        set({
          settings: {
            autoPrintEnabled: data.autoPrintEnabled ?? true,
            printerName: data.printerName || '',
            paperWidth: 58,
            storeName: data.storeName || 'Pelaris.id',
            branchName: defaultBranchName,
            address: data.address || '',
            phone: data.phone || '',
            footerText1: data.footerText1 || 'Terima kasih atas kunjungan Anda',
            footerText2: data.footerText2 || '',
          }
        });
      }
    } catch (error) {
      console.error('Failed to load printer settings:', error);
    } finally {
      set({ loadingData: false });
    }
  },
  
  handleSave: async () => {
    const { selectedCabangId, settings } = get();
    
    if (!selectedCabangId) {
      set({ message: 'Pilih cabang terlebih dahulu' });
      setTimeout(() => set({ message: '' }), 3000);
      return;
    }

    set({ loading: true, message: '' });
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-pelaris.ziqrishahab.com/api';
    
    try {
      const response = await fetch(`${API_URL}/settings/printer`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          cabangId: selectedCabangId,
          ...settings,
        }),
      });

      if (response.ok) {
        set({ message: 'Pengaturan printer berhasil disimpan' });
      } else {
        const error = await response.json();
        set({ message: error.error || 'Gagal menyimpan pengaturan' });
      }
      setTimeout(() => set({ message: '' }), 3000);
    } catch (error) {
      console.error('Save error:', error);
      set({ message: 'Gagal menyimpan pengaturan' });
      setTimeout(() => set({ message: '' }), 3000);
    } finally {
      set({ loading: false });
    }
  }
}));
