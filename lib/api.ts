import axios from 'axios';

const API_BASE_URL = (() => {
  // Explicit env always wins
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;

  // Safe default for local dev
  if (process.env.NODE_ENV === 'development') return 'http://localhost:5100/api';

  // In non-dev, missing env is a misconfig -> fail fast
  throw new Error('NEXT_PUBLIC_API_URL is not set');
})();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token and CSRF header to every request if available
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const method = (config.method || 'get').toUpperCase();
    const isSafeMethod = method === 'GET' || method === 'HEAD' || method === 'OPTIONS';
    if (!isSafeMethod) {
      const csrfToken = localStorage.getItem('csrfToken');
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
          localStorage.removeItem('token');
          localStorage.removeItem('user');
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
  
  createUser: (data: { email: string; password: string; name: string; role: string; cabangId: string }) =>
    api.post('/auth/users', data),
  
  updateUser: (id: string, data: { name: string; role: string; cabangId: string; password?: string; isActive?: boolean }) =>
    api.put(`/auth/users/${id}`, data),
  
  deleteUser: (id: string) => api.delete(`/auth/users/${id}`),
  
  getUsers: () => api.get('/auth/users'),
};

// Products API
export const productsAPI = {
  getProducts: (params?: { categoryId?: string; search?: string; isActive?: boolean }) =>
    api.get('/products', { params }),
  
  getProduct: (id: string) => api.get(`/products/${id}`),
  
  createProduct: (data: any) => api.post('/products', data),
  
  updateProduct: (id: string, data: any) => api.put(`/products/${id}`, data),
  
  deleteProduct: (id: string) => api.delete(`/products/${id}`),
  
  getCategories: () => api.get('/products/categories'),
  
  createCategory: (data: { name: string; description?: string }) =>
    api.post('/products/categories', data),
  
  updateCategory: (id: string, data: { name: string; description?: string }) =>
    api.put(`/products/categories/${id}`, data),
  
  deleteCategory: (id: string) => api.delete(`/products/categories/${id}`),
  
  getStock: (variantId: string) => api.get(`/products/stock/${variantId}`),
  
  updateStock: (variantId: string, cabangId: string, data: { quantity: number; price?: number; reason?: string; notes?: string }) =>
    api.put(`/products/stock/${variantId}/${cabangId}`, data),
  
  // Deprecated: Use stockAPI.getLowStockItems instead
  getLowStockAlerts: () => api.get('/stock/alerts/low'),
  
  searchBySKU: (sku: string) => api.get(`/products/search/sku/${sku}`),
  
  // Import/Export (CSV only - single file with 2 sections)
  downloadTemplate: () => 
    api.get('/products/template', { responseType: 'blob' }),
  
  importProducts: (formData: FormData) => {
    const importApi = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    // Add token
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        importApi.defaults.headers.Authorization = `Bearer ${token}`;
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
    // Payment Details
    bankName?: string;
    referenceNo?: string;
    cardLastDigits?: string;
    notes?: string;
    deviceSource?: string; // WEB, ANDROID, IOS, WINDOWS, etc
  }) => api.post('/transactions', data),
  
  getTransactions: (params?: {
    cabangId?: string;
    startDate?: string;
    endDate?: string;
    paymentMethod?: string;
    channelId?: string;
    status?: string;
    search?: string;
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
    apiConfig?: Record<string, any>;
    fieldMapping?: Record<string, any>;
  }) => api.post('/channels', data),
  
  updateChannel: (id: string, data: {
    name?: string;
    type?: string;
    icon?: string;
    color?: string;
    isActive?: boolean;
    apiConfig?: Record<string, any>;
    fieldMapping?: Record<string, any>;
  }) => api.put(`/channels/${id}`, data),
  
  deleteChannel: (id: string) => api.delete(`/channels/${id}`),
  
  // Channel Stock Allocation
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
  
  // Stats
  getChannelStats: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/channels/stats/summary', { params }),
};

// Categories API
export const categoriesAPI = {
  getCategories: () => api.get('/products/categories'),
  
  createCategory: (data: { name: string; description?: string }) =>
    api.post('/products/categories', data),
  
  updateCategory: (id: string, data: { name?: string; description?: string; isActive?: boolean }) =>
    api.put(`/products/categories/${id}`, data),
  
  deleteCategory: (id: string) => api.delete(`/products/categories/${id}`),
};

// Users API
export const usersAPI = {
  getUsers: () => api.get('/users'),
  
  getUser: (id: string) => api.get(`/users/${id}`),
  
  createUser: (data: { name: string; email: string; password: string; role: string; cabangId?: string }) =>
    api.post('/users', data),
  
  updateUser: (id: string, data: { name?: string; email?: string; password?: string; role?: string; cabangId?: string; isActive?: boolean }) =>
    api.put(`/users/${id}`, data),
  
  deleteUser: (id: string) => api.delete(`/users/${id}`),
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
  
  // Get returnable quantities for a transaction
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
  // Create stock adjustment
  createAdjustment: (data: {
    variantId: string;
    cabangId: string;
    type: 'add' | 'subtract';
    quantity: number;
    reason: string;
    notes?: string;
  }) => api.post('/stock/adjustment', data),
  
  // Get all adjustments with filters
  getAdjustments: (params?: {
    cabangId?: string;
    variantId?: string;
    startDate?: string;
    endDate?: string;
    reason?: string;
    page?: number;
    limit?: number;
  }) => api.get('/stock/adjustments', { params }),
  
  // Get adjustment history for specific variant/cabang
  getAdjustmentHistory: (variantId: string, cabangId: string, limit?: number) =>
    api.get(`/stock/adjustment/${variantId}/${cabangId}/history`, { params: { limit } }),
  
  // Set stock alert
  setAlert: (data: {
    variantId: string;
    cabangId: string;
    minStock: number;
  }) => api.post('/stock/alert', data),
  
  // Get stock alert
  getAlert: (variantId: string, cabangId: string) =>
    api.get(`/stock/alert/${variantId}/${cabangId}`),
  
  // Delete/deactivate stock alert
  deleteAlert: (variantId: string, cabangId: string) =>
    api.delete(`/stock/alert/${variantId}/${cabangId}`),
  
  // Get all low stock items
  getLowStockItems: (cabangId?: string) =>
    api.get('/stock/alerts/low', { params: { cabangId } }),
  
  // Get all active alerts
  getAlerts: (cabangId?: string) =>
    api.get('/stock/alerts', { params: { cabangId } }),
};

// Backup & Export API
export const backupAPI = {
  // Manual backup
  createBackup: () => api.post('/backup/database'),
  
  // Auto backup toggle
  getAutoBackupStatus: () => api.get('/backup/auto-status'),
  toggleAutoBackup: (enabled: boolean) => 
    api.post('/backup/auto-backup', { enabled }),
  
  // Last backup info
  getLastBackup: () => api.get('/backup/last-backup'),
  
  // Export functions - trigger file download
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
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await api.get('/backup/export/report', { params });
    // Download as JSON file
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
  
  // Reset settings
  resetSettings: () => api.post('/backup/reset-settings'),
};

// Tenant API
export const tenantsAPI = {
  getCurrent: () => api.get('/tenants/current'),
  update: (data: any) => api.patch('/tenants/current', data),
};

// Export API_BASE_URL for direct usage
export { API_BASE_URL };
