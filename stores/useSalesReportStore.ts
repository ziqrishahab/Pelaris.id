import { create } from 'zustand';
import { transactionsAPI, cabangAPI, channelsAPI } from '@/lib/api';
import { logger } from '@/lib/logger';

// Types
export interface SummaryData {
  totalTransactions: number;
  totalRevenue: number;
  paymentMethodBreakdown: Array<{
    paymentMethod: string;
    _count: { id: number };
    _sum: { total: number };
  }>;
}

export interface TrendData {
  date: string;
  total: number;
  count: number;
}

export interface TopProduct {
  productVariantId: string;
  productName: string;
  variantName: string;
  variantValue: string;
  category: string;
  totalQuantity: number;
  totalRevenue: number;
  transactionCount: number;
}

export interface BranchPerformance {
  cabangId: string;
  cabangName: string;
  totalTransactions: number;
  totalRevenue: number;
}

export interface Channel {
  id: string;
  code: string;
  name: string;
  type: string;
  color: string | null;
}

export interface Cabang {
  id: string;
  name: string;
}

interface SalesReportState {
  // Data
  loading: boolean;
  summary: SummaryData | null;
  trend: TrendData[];
  topProducts: TopProduct[];
  branchPerformance: BranchPerformance[];
  cabangs: Cabang[];
  channels: Channel[];
  
  // Filters
  selectedCabang: string;
  selectedChannel: string;
  dateRange: string;
  startDate: string;
  endDate: string;
  showCustomDate: boolean;
  
  // Actions - Setters
  setLoading: (loading: boolean) => void;
  setSelectedCabang: (cabangId: string) => void;
  setSelectedChannel: (channelId: string) => void;
  setDateRange: (range: string) => void;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  setShowCustomDate: (show: boolean) => void;
  
  // Actions - Fetch
  fetchInitialData: () => Promise<void>;
  fetchReportData: () => Promise<void>;
  
  // Actions - Helpers
  handleDateRangeChange: (value: string) => void;
}

export const useSalesReportStore = create<SalesReportState>()((set, get) => ({
  // Initial data
  loading: true,
  summary: null,
  trend: [],
  topProducts: [],
  branchPerformance: [],
  cabangs: [],
  channels: [],
  
  // Initial filters
  selectedCabang: '',
  selectedChannel: '',
  dateRange: '7',
  startDate: '',
  endDate: '',
  showCustomDate: false,
  
  // Setters
  setLoading: (loading) => set({ loading }),
  setSelectedCabang: (cabangId) => set({ selectedCabang: cabangId }),
  setSelectedChannel: (channelId) => set({ selectedChannel: channelId }),
  setDateRange: (range) => set({ dateRange: range }),
  setStartDate: (date) => set({ startDate: date }),
  setEndDate: (date) => set({ endDate: date }),
  setShowCustomDate: (show) => set({ showCustomDate: show }),
  
  // Fetch actions
  fetchInitialData: async () => {
    try {
      const [cabangRes, channelRes] = await Promise.all([
        cabangAPI.getCabangs(),
        channelsAPI.getChannels()
      ]);
      set({ 
        cabangs: cabangRes.data,
        channels: channelRes.data 
      });
    } catch (error) {
      logger.error('Error fetching initial data:', error);
    }
  },
  
  fetchReportData: async () => {
    const { selectedCabang, showCustomDate, startDate, endDate, dateRange } = get();
    
    set({ loading: true });
    try {
      const params: any = {};
      if (selectedCabang) params.cabangId = selectedCabang;
      
      if (showCustomDate && startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      } else {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - parseInt(dateRange));
        params.startDate = start.toISOString().split('T')[0];
        params.endDate = end.toISOString().split('T')[0];
      }

      const [summaryRes, trendRes, topProductsRes, branchRes] = await Promise.all([
        transactionsAPI.getSummary(params),
        transactionsAPI.getSalesTrend({ ...params, days: dateRange }),
        transactionsAPI.getTopProducts({ ...params, limit: 10 }),
        transactionsAPI.getBranchPerformance(params)
      ]);

      set({
        summary: summaryRes.data,
        trend: trendRes.data.trend || [],
        topProducts: topProductsRes.data.topProducts || [],
        branchPerformance: branchRes.data.branches || [],
      });
    } catch (error) {
      logger.error('Error fetching report data:', error);
    } finally {
      set({ loading: false });
    }
  },
  
  // Helpers
  handleDateRangeChange: (value) => {
    if (value === 'custom') {
      set({ showCustomDate: true });
    } else {
      set({ showCustomDate: false, dateRange: value });
    }
  },
}));

