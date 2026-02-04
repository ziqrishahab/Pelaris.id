import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDashboardStore, WIDGET_LABELS } from './useDashboardStore';

// Mock API
vi.mock('@/lib/api', () => ({
  transactionsAPI: {
    getSummary: vi.fn().mockResolvedValue({ data: { totalTransactions: 10, totalRevenue: 100000 } }),
    getSalesTrend: vi.fn().mockResolvedValue({ data: [] }),
    getTopProducts: vi.fn().mockResolvedValue({ data: [] }),
    getBranchPerformance: vi.fn().mockResolvedValue({ data: [] }),
    getTimeStats: vi.fn().mockResolvedValue({ data: null }),
  },
  productsAPI: {
    getLowStockAlerts: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

vi.mock('@/lib/auth', () => ({
  getAuth: vi.fn().mockReturnValue({ user: { role: 'OWNER' } }),
}));

describe('useDashboardStore', () => {
  beforeEach(() => {
    useDashboardStore.setState({
      summary: null,
      lowStockAlerts: [],
      salesTrend: [],
      topProducts: [],
      branchPerformance: [],
      timeStats: null,
      loading: true,
      showScreenOptions: false,
      widgetVisibility: {
        salesTrend: true,
        topProducts: true,
        branchPerformance: true,
        timeStats: true,
        dailyDistribution: true,
        paymentMethods: true,
        lowStock: true,
      },
    });
    vi.mocked(localStorage.setItem).mockClear();
    vi.mocked(localStorage.getItem).mockClear();
  });

  it('should initialize with default state', () => {
    const state = useDashboardStore.getState();
    expect(state.summary).toBeNull();
    expect(state.lowStockAlerts).toEqual([]);
    expect(state.loading).toBe(true);
    expect(state.showScreenOptions).toBe(false);
  });

  it('should set loading state', () => {
    useDashboardStore.getState().setLoading(false);
    expect(useDashboardStore.getState().loading).toBe(false);
  });

  it('should toggle screen options', () => {
    useDashboardStore.getState().setShowScreenOptions(true);
    expect(useDashboardStore.getState().showScreenOptions).toBe(true);
  });

  it('should toggle widget visibility', () => {
    const initial = useDashboardStore.getState().widgetVisibility.salesTrend;
    useDashboardStore.getState().toggleWidget('salesTrend');
    expect(useDashboardStore.getState().widgetVisibility.salesTrend).toBe(!initial);
  });

  it('should persist widget visibility to localStorage', () => {
    useDashboardStore.getState().toggleWidget('topProducts');
    
    // Check that setItem was called with the correct key and value
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'dashboardWidgetVisibility',
      expect.any(String)
    );
    
    // Verify the value contains the toggled state
    const callArgs = vi.mocked(localStorage.setItem).mock.calls[0];
    const parsed = JSON.parse(callArgs[1]);
    expect(parsed.topProducts).toBe(false);
  });

  it('should load widget visibility from localStorage', () => {
    const savedVisibility = {
      salesTrend: false,
      topProducts: true,
      branchPerformance: true,
      timeStats: true,
      dailyDistribution: true,
      paymentMethods: true,
      lowStock: false,
    };
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(savedVisibility));
    
    useDashboardStore.getState().loadWidgetVisibility();
    
    expect(useDashboardStore.getState().widgetVisibility.salesTrend).toBe(false);
    expect(useDashboardStore.getState().widgetVisibility.lowStock).toBe(false);
  });

  it('should have all widget labels defined', () => {
    expect(WIDGET_LABELS.salesTrend).toBeDefined();
    expect(WIDGET_LABELS.topProducts).toBeDefined();
    expect(WIDGET_LABELS.branchPerformance).toBeDefined();
    expect(WIDGET_LABELS.timeStats).toBeDefined();
    expect(WIDGET_LABELS.dailyDistribution).toBeDefined();
    expect(WIDGET_LABELS.paymentMethods).toBeDefined();
    expect(WIDGET_LABELS.lowStock).toBeDefined();
  });
});

