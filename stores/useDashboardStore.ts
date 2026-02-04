import { create } from 'zustand';
import { transactionsAPI, productsAPI, stockAPI } from '@/lib/api';
import { getAuth } from '@/lib/auth';

// Types
export interface WidgetVisibility {
  salesTrend: boolean;
  topProducts: boolean;
  branchPerformance: boolean;
  timeStats: boolean;
  dailyDistribution: boolean;
  paymentMethods: boolean;
  lowStock: boolean;
}

export interface Summary {
  totalTransactions: number;
  totalRevenue: number;
  paymentMethodBreakdown?: Array<{
    paymentMethod: string;
    _count: { id: number };
    _sum: { total: number };
  }>;
}

export interface LowStockAlert {
  id: string;
  productName: string;
  variantName: string;
  sku: string;
  cabangName: string;
  currentStock: number;
  minStock: number;
}

export interface SalesTrend {
  date: string;
  total: number;
  count: number;
}

export interface TopProduct {
  productVariantId: string;
  productName: string;
  variantName: string;
  category: string;
  totalQuantity: number;
  totalRevenue: number;
}

export interface BranchPerformance {
  cabangId: string;
  cabangName: string;
  totalTransactions: number;
  totalRevenue: number;
}

export interface TimeStats {
  busiestHour: { hour: number; count: number; total: number };
  busiestDay: { day: string; count: number; total: number };
  hourlyDistribution: Array<{ hour: number; count: number; total: number }>;
  dailyDistribution: Array<{ day: string; count: number; total: number }>;
  dailyStats?: Array<{ day: string; count: number; total: number }>;
}

interface DashboardState {
  // Data
  summary: Summary | null;
  lowStockAlerts: LowStockAlert[];
  salesTrend: SalesTrend[];
  topProducts: TopProduct[];
  branchPerformance: BranchPerformance[];
  timeStats: TimeStats | null;
  loading: boolean;
  
  // UI State
  showScreenOptions: boolean;
  widgetVisibility: WidgetVisibility;
  
  // Actions - Setters
  setLoading: (loading: boolean) => void;
  setShowScreenOptions: (show: boolean) => void;
  
  // Actions - Widget visibility
  toggleWidget: (widget: keyof WidgetVisibility) => void;
  loadWidgetVisibility: () => void;
  
  // Actions - Fetch
  fetchDashboardData: () => Promise<void>;
}

const defaultWidgetVisibility: WidgetVisibility = {
  salesTrend: true,
  topProducts: true,
  branchPerformance: true,
  timeStats: true,
  dailyDistribution: true,
  paymentMethods: true,
  lowStock: true
};

export const useDashboardStore = create<DashboardState>()((set, get) => ({
  // Initial data
  summary: null,
  lowStockAlerts: [],
  salesTrend: [],
  topProducts: [],
  branchPerformance: [],
  timeStats: null,
  loading: true,
  
  // Initial UI state
  showScreenOptions: false,
  widgetVisibility: defaultWidgetVisibility,
  
  // Setters
  setLoading: (loading) => set({ loading }),
  setShowScreenOptions: (show) => set({ showScreenOptions: show }),
  
  // Widget visibility actions
  toggleWidget: (widget) => {
    const { widgetVisibility } = get();
    const newVisibility = { ...widgetVisibility, [widget]: !widgetVisibility[widget] };
    set({ widgetVisibility: newVisibility });
    localStorage.setItem('dashboardWidgetVisibility', JSON.stringify(newVisibility));
  },
  
  loadWidgetVisibility: () => {
    const saved = localStorage.getItem('dashboardWidgetVisibility');
    if (saved) {
      try {
        set({ widgetVisibility: JSON.parse(saved) });
      } catch (e) {
        // Use default if parse fails
      }
    }
  },
  
  // Fetch actions
  fetchDashboardData: async () => {
    const { user } = getAuth();
    
    // Only fetch for owner/manager (not kasir)
    if (!user || user.role === 'KASIR') {
      set({ loading: false });
      return;
    }
    
    try {
      const [summaryRes, trendRes, topProductsRes, branchRes, timeStatsRes, lowStockRes] = await Promise.all([
        transactionsAPI.getSummary(),
        transactionsAPI.getSalesTrend({ days: 7 }),
        transactionsAPI.getTopProducts({ limit: 5 }),
        transactionsAPI.getBranchPerformance(),
        transactionsAPI.getTimeStats(),
        stockAPI.getAlerts().catch(() => ({ data: { alerts: [] } })) // Graceful fallback
      ]);

      // Transform low stock alerts to match expected format
      const lowStockAlerts = (lowStockRes.data?.alerts || []).map((alert: any) => ({
        id: alert.id,
        productName: alert.productVariant?.product?.name || 'Unknown',
        variantName: `${alert.productVariant?.variantName}: ${alert.productVariant?.variantValue}`,
        sku: alert.productVariant?.sku || '',
        cabangName: alert.cabang?.name || 'Unknown',
        currentStock: alert.productVariant?.stocks?.[0]?.quantity || 0,
        minStock: alert.minStock
      })).filter((alert: any) => alert.currentStock <= alert.minStock);

      set({
        summary: summaryRes.data,
        lowStockAlerts,
        salesTrend: trendRes.data.trend,
        topProducts: topProductsRes.data.topProducts,
        branchPerformance: branchRes.data.branchPerformance,
        timeStats: timeStatsRes.data,
      });
    } catch (error) {
      // Error handled - dashboard shows empty state
    } finally {
      set({ loading: false });
    }
  },
}));

// Widget labels constant
export const WIDGET_LABELS: Record<keyof WidgetVisibility, string> = {
  salesTrend: 'Tren Penjualan',
  topProducts: 'Produk Terlaris',
  branchPerformance: 'Performa Cabang',
  timeStats: 'Waktu Tersibuk',
  dailyDistribution: 'Distribusi Transaksi',
  paymentMethods: 'Metode Pembayaran',
  lowStock: 'Peringatan Stok Menipis'
};

