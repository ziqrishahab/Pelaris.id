import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSalesReportStore } from './useSalesReportStore';

// Mock API
vi.mock('@/lib/api', () => ({
  transactionsAPI: {
    getSummary: vi.fn().mockResolvedValue({ data: { totalTransactions: 10, totalRevenue: 100000, paymentMethodBreakdown: [] } }),
    getSalesTrend: vi.fn().mockResolvedValue({ data: [] }),
    getTopProducts: vi.fn().mockResolvedValue({ data: [] }),
    getBranchPerformance: vi.fn().mockResolvedValue({ data: [] }),
  },
  cabangAPI: {
    getCabangs: vi.fn().mockResolvedValue({ data: [] }),
  },
  channelsAPI: {
    getChannels: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

describe('useSalesReportStore', () => {
  beforeEach(() => {
    useSalesReportStore.setState({
      loading: true,
      summary: null,
      trend: [],
      topProducts: [],
      branchPerformance: [],
      cabangs: [],
      channels: [],
      selectedCabang: '',
      selectedChannel: '',
      dateRange: '7',
      startDate: '',
      endDate: '',
      showCustomDate: false,
    });
  });

  it('should initialize with default state', () => {
    const state = useSalesReportStore.getState();
    expect(state.loading).toBe(true);
    expect(state.summary).toBeNull();
    expect(state.trend).toEqual([]);
    expect(state.dateRange).toBe('7');
    expect(state.showCustomDate).toBe(false);
  });

  it('should set loading state', () => {
    useSalesReportStore.getState().setLoading(false);
    expect(useSalesReportStore.getState().loading).toBe(false);
  });

  it('should set selected cabang', () => {
    useSalesReportStore.getState().setSelectedCabang('cab-1');
    expect(useSalesReportStore.getState().selectedCabang).toBe('cab-1');
  });

  it('should set selected channel', () => {
    useSalesReportStore.getState().setSelectedChannel('ch-1');
    expect(useSalesReportStore.getState().selectedChannel).toBe('ch-1');
  });

  it('should set date range', () => {
    useSalesReportStore.getState().setDateRange('30');
    expect(useSalesReportStore.getState().dateRange).toBe('30');
  });

  it('should set start and end date', () => {
    useSalesReportStore.getState().setStartDate('2024-01-01');
    useSalesReportStore.getState().setEndDate('2024-01-31');
    expect(useSalesReportStore.getState().startDate).toBe('2024-01-01');
    expect(useSalesReportStore.getState().endDate).toBe('2024-01-31');
  });

  it('should toggle custom date mode', () => {
    useSalesReportStore.getState().setShowCustomDate(true);
    expect(useSalesReportStore.getState().showCustomDate).toBe(true);
  });

  it('should handle date range change to custom', () => {
    useSalesReportStore.getState().handleDateRangeChange('custom');
    expect(useSalesReportStore.getState().showCustomDate).toBe(true);
  });

  it('should handle date range change to preset', () => {
    useSalesReportStore.setState({ showCustomDate: true });
    useSalesReportStore.getState().handleDateRangeChange('14');
    expect(useSalesReportStore.getState().showCustomDate).toBe(false);
    expect(useSalesReportStore.getState().dateRange).toBe('14');
  });

  it('should fetch initial data', async () => {
    const { cabangAPI, channelsAPI } = await import('@/lib/api');
    await useSalesReportStore.getState().fetchInitialData();
    expect(cabangAPI.getCabangs).toHaveBeenCalled();
    expect(channelsAPI.getChannels).toHaveBeenCalled();
  });

  it('should fetch report data', async () => {
    const { transactionsAPI } = await import('@/lib/api');
    await useSalesReportStore.getState().fetchReportData();
    expect(transactionsAPI.getSummary).toHaveBeenCalled();
    expect(transactionsAPI.getSalesTrend).toHaveBeenCalled();
    expect(useSalesReportStore.getState().loading).toBe(false);
  });
});

