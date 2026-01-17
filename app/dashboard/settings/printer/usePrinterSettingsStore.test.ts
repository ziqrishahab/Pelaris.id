import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePrinterSettingsStore } from './usePrinterSettingsStore';

// Mock API
vi.mock('@/lib/api', () => ({
  cabangAPI: {
    getCabangs: vi.fn().mockResolvedValue({ data: [
      { id: 'c1', name: 'Cabang 1' },
      { id: 'c2', name: 'Cabang 2' }
    ]}),
  },
}));

// Mock fetch
global.fetch = vi.fn();

describe('usePrinterSettingsStore', () => {
  beforeEach(() => {
    usePrinterSettingsStore.setState({
      selectedCabangId: '',
      cabangs: [],
      settings: {
        autoPrintEnabled: true,
        printerName: '',
        paperWidth: 58,
        storeName: '',
        branchName: '',
        address: '',
        phone: '',
        footerText1: 'Terima kasih atas kunjungan Anda',
        footerText2: '',
      },
      loading: false,
      loadingData: true,
      message: '',
    });
    vi.mocked(fetch).mockReset();
    vi.mocked(localStorage.getItem).mockClear();
    vi.mocked(localStorage.setItem).mockClear();
  });

  it('should initialize with default state', () => {
    const state = usePrinterSettingsStore.getState();
    expect(state.selectedCabangId).toBe('');
    expect(state.cabangs).toEqual([]);
    expect(state.settings.autoPrintEnabled).toBe(true);
    expect(state.settings.paperWidth).toBe(58);
    expect(state.settings.storeName).toBe('');
    expect(state.loading).toBe(false);
    expect(state.loadingData).toBe(true);
  });

  it('should set selected cabang id', () => {
    usePrinterSettingsStore.getState().setSelectedCabangId('c1');
    expect(usePrinterSettingsStore.getState().selectedCabangId).toBe('c1');
  });

  it('should update settings', () => {
    usePrinterSettingsStore.getState().updateSettings({ 
      printerName: 'Test Printer',
      paperWidth: 80 
    });
    const state = usePrinterSettingsStore.getState();
    expect(state.settings.printerName).toBe('Test Printer');
    expect(state.settings.paperWidth).toBe(80);
  });

  it('should toggle auto print', () => {
    expect(usePrinterSettingsStore.getState().settings.autoPrintEnabled).toBe(true);
    usePrinterSettingsStore.getState().toggleAutoPrint();
    expect(usePrinterSettingsStore.getState().settings.autoPrintEnabled).toBe(false);
    usePrinterSettingsStore.getState().toggleAutoPrint();
    expect(usePrinterSettingsStore.getState().settings.autoPrintEnabled).toBe(true);
  });

  it('should clear message', () => {
    usePrinterSettingsStore.setState({ message: 'Test message' });
    usePrinterSettingsStore.getState().clearMessage();
    expect(usePrinterSettingsStore.getState().message).toBe('');
  });

  it('should load cabangs', async () => {
    await usePrinterSettingsStore.getState().loadCabangs();
    const state = usePrinterSettingsStore.getState();
    expect(state.cabangs).toHaveLength(2);
    expect(state.selectedCabangId).toBe('c1'); // First cabang auto-selected
  });

  it('should update all settings fields', () => {
    usePrinterSettingsStore.getState().updateSettings({
      storeName: 'New Store',
      branchName: 'Branch 1',
      address: '123 Main St',
      phone: '08123456789',
      footerText1: 'Thank you',
      footerText2: 'Visit again',
    });
    
    const state = usePrinterSettingsStore.getState();
    expect(state.settings.storeName).toBe('New Store');
    expect(state.settings.branchName).toBe('Branch 1');
    expect(state.settings.address).toBe('123 Main St');
    expect(state.settings.phone).toBe('08123456789');
    expect(state.settings.footerText1).toBe('Thank you');
    expect(state.settings.footerText2).toBe('Visit again');
  });

  it('should load settings from server', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        settings: {
          autoPrintEnabled: false,
          printerName: 'Server Printer',
          paperWidth: 80
        }
      })
    } as Response);
    
    usePrinterSettingsStore.setState({ selectedCabangId: 'c1', cabangs: [{ id: 'c1', name: 'Cabang 1' }] });
    await usePrinterSettingsStore.getState().loadSettings();
    
    expect(fetch).toHaveBeenCalled();
  });
});
