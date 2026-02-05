/**
 * API Client with HttpOnly Cookie Authentication
 * 
 * SECURITY:
 * - Primary auth: HttpOnly cookies (immune to XSS, set by backend)
 * - Backup auth: Authorization header (for non-cookie scenarios)
 * - CSRF token: memory-only storage (XSS-safe)
 * - withCredentials: true (enables cookie transmission)
 * 
 * HttpOnly cookies provide the best security as they:
 * - Cannot be accessed by JavaScript (XSS protection)
 * - Automatically sent with requests (no manual token management)
 * - Can be set as Secure (HTTPS only) and SameSite (CSRF protection)
 */

import axios from 'axios';
import { getToken, getCsrfToken, clearAuth } from './auth';
import { env } from './env';

// Use centralized API URL from env.ts
const API_BASE_URL = env.apiUrl;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Enable cookies for HttpOnly token
  withCredentials: true,
});

// Add token and CSRF header to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    // Add Authorization header (backup for HttpOnly cookie)
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add CSRF token for state-changing requests
    const method = (config.method || 'get').toUpperCase();
    const isSafeMethod = method === 'GET' || method === 'HEAD' || method === 'OPTIONS';
    if (!isSafeMethod) {
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        config.headers['x-csrf-token'] = csrfToken;
      }
    }
  }
  return config;
});

// Handle 401 errors (token expired)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        // Don't redirect if already on login page (login attempt failed)
        const isLoginPage = window.location.pathname === '/login';
        if (!isLoginPage) {
          clearAuth();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Export both default and named export for flexibility
export { api };
export default api;

// Auth API
export const authAPI = {
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  
  me: () => api.get('/auth/me'),
  
  logout: () => api.post('/auth/logout'),
  
  createUser: (data: { email: string; password: string; name: string; role: string; cabangId?: string; hasMultiCabangAccess?: boolean }) =>
    api.post('/auth/users', data),
  
  updateUser: (id: string, data: { name?: string; role?: string; cabangId?: string; password?: string; isActive?: boolean; hasMultiCabangAccess?: boolean }) =>
    api.put(`/auth/users/${id}`, data),
  
  deleteUser: (id: string) => api.delete(`/auth/users/${id}`),
  
  getUsers: () => api.get('/auth/users'),
};

// Products API with pagination support
export interface ProductsParams {
  categoryId?: string;
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export const productsAPI = {
  getProducts: (params?: ProductsParams) =>
    api.get('/products', { params }),
  
  getProduct: (id: string) => api.get(`/products/${id}`),
  
  createProduct: (data: {
    name: string;
    description?: string;
    categoryId: string;
    productType: 'SINGLE' | 'VARIANT';
    sku?: string;
    variants?: Array<{
      sku?: string;
      variantName: string;
      variantValue: string;
      stocks?: Array<{ cabangId: string; quantity?: number; price?: number }>;
    }>;
    stocks?: Array<{ cabangId: string; quantity?: number; price?: number }>;
  }) => api.post('/products', data),
  
  updateProduct: (id: string, data: {
    name?: string;
    description?: string;
    categoryId?: string;
    productType?: 'SINGLE' | 'VARIANT';
    isActive?: boolean;
    variants?: Array<{
      id?: string;
      sku?: string;
      variantName: string;
      variantValue: string;
      stocks?: Array<{ cabangId: string; quantity?: number; price?: number }>;
    }>;
  }) => api.put(`/products/${id}`, data),
  
  deleteProduct: (id: string) => api.delete(`/products/${id}`),
  
  bulkDelete: (ids: string[]) => api.post('/products/bulk-delete', { productIds: ids }),
  
  // Deprecated: Use categoriesAPI instead for category operations
  getCategories: () => api.get('/categories'),
  
  createCategory: (data: { name: string; description?: string }) =>
    api.post('/categories', data),
  
  updateCategory: (id: string, data: { name?: string; description?: string }) =>
    api.put(`/categories/${id}`, data),
  
  deleteCategory: (id: string) => api.delete(`/categories/${id}`),
  
  getStock: (variantId: string) => api.get(`/products/stock/${variantId}`),
  
  updateStock: (variantId: string, cabangId: string, data: { quantity: number; price?: number; reason?: string; notes?: string }) =>
    api.put(`/products/stock/${variantId}/${cabangId}`, data),
  
  searchBySKU: (sku: string) => api.get(`/products/search/sku/${sku}`),
  
  // Import/Export
  downloadTemplate: () => 
    api.get('/products/template', { responseType: 'blob' }),
  
  importProducts: (formData: FormData) => {
    const importApi = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      withCredentials: true,
    });
    
    // Add token
    if (typeof window !== 'undefined') {
      const token = getToken();
      if (token) {
        importApi.defaults.headers.Authorization = `Bearer ${token}`;
      }
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        importApi.defaults.headers['x-csrf-token'] = csrfToken;
      }
    }
    
    return importApi.post('/products/import', formData);
  },
  
  exportProducts: () => 
    api.get('/products/export', { responseType: 'blob' }),
};

// Transactions API
export const transactionsAPI = {
  createTransaction: (data: {
    cabangId: string;
    customerName?: string;
    customerPhone?: string;
    items: Array<{ productVariantId: string; quantity: number; price: number }>;
    discount?: number;
    tax?: number;
    paymentMethod: string;
    bankName?: string;
    referenceNo?: string;
    cardLastDigits?: string;
    isSplitPayment?: boolean;
    paymentAmount1?: number;
    paymentMethod2?: string;
    paymentAmount2?: number;
    bankName2?: string;
    referenceNo2?: string;
    notes?: string;
    deviceSource?: string;
  }) => api.post('/transactions', data),
  
  getTransactions: (params?: {
    cabangId?: string;
    startDate?: string;
    endDate?: string;
    paymentMethod?: string;
    channelId?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => api.get('/transactions', { params }),
  
  getTransaction: (id: string) => api.get(`/transactions/${id}`),
  
  getSummary: (params?: {
    cabangId?: string;
    startDate?: string;
    endDate?: string;
  }) => api.get('/transactions/reports/summary', { params }),
  
  getSalesTrend: (params?: {
    cabangId?: string;
    days?: number;
  }) => api.get('/transactions/reports/sales-trend', { params }),
  
  getTopProducts: (params?: {
    cabangId?: string;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }) => api.get('/transactions/reports/top-products', { params }),
  
  getBranchPerformance: (params?: {
    startDate?: string;
    endDate?: string;
  }) => api.get('/transactions/reports/branch-performance', { params }),
  
  getTimeStats: (params?: {
    cabangId?: string;
    startDate?: string;
    endDate?: string;
  }) => api.get('/transactions/reports/time-stats', { params }),
  
  cancelTransaction: (id: string, reason: string) =>
    api.put(`/transactions/${id}/cancel`, { reason }),
};

// Sales Channels API
export const channelsAPI = {
  getChannels: (params?: { includeInactive?: boolean }) =>
    api.get('/channels', { params }),
  
  getChannel: (id: string) => api.get(`/channels/${id}`),
  
  createChannel: (data: {
    code: string;
    name: string;
    type?: 'POS' | 'MARKETPLACE' | 'WEBSITE' | 'SOCIAL' | 'OTHER';
    icon?: string;
    color?: string;
    apiConfig?: Record<string, unknown>;
    fieldMapping?: Record<string, unknown>;
  }) => api.post('/channels', data),
  
  updateChannel: (id: string, data: {
    name?: string;
    type?: string;
    icon?: string;
    color?: string;
    isActive?: boolean;
    apiConfig?: Record<string, unknown>;
    fieldMapping?: Record<string, unknown>;
  }) => api.put(`/channels/${id}`, data),
  
  deleteChannel: (id: string) => api.delete(`/channels/${id}`),
  
  getChannelStocks: (channelId: string, params?: { productId?: string; search?: string }) =>
    api.get(`/channels/${channelId}/stocks`, { params }),
  
  allocateStock: (channelId: string, data: { variantId: string; allocatedQty: number }) =>
    api.post(`/channels/${channelId}/stocks`, data),
  
  updateChannelStock: (channelId: string, variantId: string, data: {
    allocatedQty?: number;
    reservedQty?: number;
    isActive?: boolean;
  }) => api.put(`/channels/${channelId}/stocks/${variantId}`, data),
  
  bulkAllocateStocks: (channelId: string, allocations: Array<{ variantId: string; allocatedQty: number }>) =>
    api.post(`/channels/${channelId}/stocks/bulk`, { allocations }),
  
  getChannelStats: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/channels/stats/summary', { params }),
};

// Categories API - uses /categories endpoint (separate from /products)
export const categoriesAPI = {
  getCategories: () => api.get('/categories'),
  
  createCategory: (data: { name: string; description?: string }) =>
    api.post('/categories', data),
  
  updateCategory: (id: string, data: { name?: string; description?: string; isActive?: boolean }) =>
    api.put(`/categories/${id}`, data),
  
  deleteCategory: (id: string) => api.delete(`/categories/${id}`),
};

// Cabang API
export const cabangAPI = {
  getCabangs: () => api.get('/cabang'),
  
  getCabang: (id: string) => api.get(`/cabang/${id}`),
  
  createCabang: (data: { name: string; address: string; phone?: string }) =>
    api.post('/cabang', data),
  
  updateCabang: (id: string, data: { name?: string; address?: string; phone?: string; isActive?: boolean }) =>
    api.put(`/cabang/${id}`, data),
  
  deleteCabang: (id: string) => api.delete(`/cabang/${id}`),
};

// Settings API
export const settingsAPI = {
  getSettings: () => api.get('/settings'),
  
  getSetting: (key: string) => api.get(`/settings/${key}`),
  
  updateSettings: (data: { [key: string]: string | number }) =>
    api.put('/settings', data),
};

// Returns API
export const returnsAPI = {
  getReturns: (params?: {
    status?: string;
    cabangId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => api.get('/returns', { params }),
  
  getReturn: (id: string) => api.get(`/returns/${id}`),
  
  getStats: (params?: { cabangId?: string }) =>
    api.get('/returns/stats', { params }),
  
  getReturnableQty: (transactionId: string) =>
    api.get(`/returns/transaction/${transactionId}/returnable`),
  
  createReturn: (data: {
    transactionId: string;
    cabangId: string;
    reason: string;
    reasonDetail?: string;
    notes?: string;
    conditionNote?: string;
    photoUrls?: string[];
    managerOverride?: boolean;
    items: Array<{
      productVariantId: string;
      quantity: number;
      price: number;
    }>;
    refundMethod?: string;
    exchangeItems?: Array<{
      productVariantId: string;
      quantity: number;
    }>;
  }) => api.post('/returns', data),
  
  approveReturn: (id: string, data: { approvedBy: string; notes?: string }) =>
    api.patch(`/returns/${id}/approve`, data),
  
  rejectReturn: (id: string, data: { rejectedBy: string; rejectionNotes: string }) =>
    api.patch(`/returns/${id}/reject`, data),
  
  deleteReturn: (id: string) => api.delete(`/returns/${id}`),
};

// Stock Transfers API
export const stockTransfersAPI = {
  getTransfers: (params?: {
    cabangId?: string;
    variantId?: string;
    status?: string;
  }) => api.get('/stock-transfers', { params }),
  
  getTransfer: (id: string) => api.get(`/stock-transfers/${id}`),
  
  createTransfer: (data: {
    variantId: string;
    fromCabangId: string;
    toCabangId: string;
    quantity: number;
    notes?: string;
  }) => api.post('/stock-transfers', data),
  
  approveTransfer: (id: string) => api.patch(`/stock-transfers/${id}/approve`),
  
  rejectTransfer: (id: string, reason?: string) => 
    api.patch(`/stock-transfers/${id}/reject`, { reason }),
  
  getStats: (params?: { cabangId?: string }) =>
    api.get('/stock-transfers/stats/summary', { params }),
};

// Stock API (Adjustments)
export const stockAPI = {
  createAdjustment: (data: {
    variantId: string;
    cabangId: string;
    type: 'add' | 'subtract';
    quantity: number;
    reason: string;
    notes?: string;
  }) => api.post('/stock/adjustment', data),
  
  getAdjustments: (params?: {
    cabangId?: string;
    variantId?: string;
    startDate?: string;
    endDate?: string;
    reason?: string;
    page?: number;
    limit?: number;
  }) => api.get('/stock/adjustments', { params }),
  
  getAdjustmentHistory: (variantId: string, cabangId: string, limit?: number) =>
    api.get(`/stock/adjustment/${variantId}/${cabangId}/history`, { params: { limit } }),
  
  setAlert: (data: {
    variantId: string;
    cabangId: string;
    minStock: number;
  }) => api.post('/stock/alert', data),
  
  getAlert: (variantId: string, cabangId: string) =>
    api.get(`/stock/alert/${variantId}/${cabangId}`),
  
  deleteAlert: (variantId: string, cabangId: string) =>
    api.delete(`/stock/alert/${variantId}/${cabangId}`),
  
  getLowStockItems: (cabangId?: string) =>
    api.get('/stock/alerts/low', { params: { cabangId } }),
  
  getAlerts: (cabangId?: string) =>
    api.get('/stock/alerts', { params: { cabangId } }),
};

// Backup & Export API
export const backupAPI = {
  createBackup: () => api.post('/backup/database'),
  
  getAutoBackupStatus: () => api.get('/backup/auto-status'),
  toggleAutoBackup: (enabled: boolean) => 
    api.post('/backup/auto-backup', { enabled }),
  
  getLastBackup: () => api.get('/backup/last-backup'),
  
  exportTransactions: async () => {
    const response = await api.get('/backup/export/transactions', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `transactions-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
  
  exportProducts: async () => {
    const response = await api.get('/backup/export/products', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `products-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
  
  exportReport: async (startDate?: string, endDate?: string) => {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await api.get('/backup/export/report', { params });
    const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `report-${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
  
  resetSettings: () => api.post('/backup/reset-settings'),
};

// Tenant API
export const tenantsAPI = {
  getCurrent: () => api.get('/tenants/current'),
  update: (data: { name?: string; slug?: string }) => api.patch('/tenants/current', data),
};

// Export API_BASE_URL for direct usage
export { API_BASE_URL };
