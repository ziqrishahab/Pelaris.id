import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

// Mock axios before importing api
vi.mock('axios', () => {
  const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  };
  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
      ...mockAxiosInstance,
    },
  };
});

// Import after mocking
import api, { authAPI, productsAPI, cabangAPI, transactionsAPI } from './api';

describe('API Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authAPI', () => {
    it('login should call post with correct params', async () => {
      const mockResponse = { data: { token: 'test-token', user: {} } };
      (api.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await authAPI.login('test@example.com', 'password123');

      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('me should call get /auth/me', async () => {
      const mockResponse = { data: { user: {} } };
      (api.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await authAPI.me();

      expect(api.get).toHaveBeenCalledWith('/auth/me');
    });

    it('getUsers should call get /auth/users', async () => {
      const mockResponse = { data: [] };
      (api.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await authAPI.getUsers();

      expect(api.get).toHaveBeenCalledWith('/auth/users');
    });

    it('createUser should call post with user data', async () => {
      const mockResponse = { data: { id: '1' } };
      (api.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const userData = {
        email: 'new@example.com',
        password: 'password',
        name: 'New User',
        role: 'KASIR',
        cabangId: 'cabang-1',
      };

      await authAPI.createUser(userData);

      expect(api.post).toHaveBeenCalledWith('/auth/users', userData);
    });

    it('updateUser should call put with correct params', async () => {
      const mockResponse = { data: { id: '1' } };
      (api.put as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const updateData = { name: 'Updated', role: 'MANAGER', cabangId: 'cabang-1' };

      await authAPI.updateUser('user-1', updateData);

      expect(api.put).toHaveBeenCalledWith('/auth/users/user-1', updateData);
    });

    it('deleteUser should call delete with user id', async () => {
      const mockResponse = { data: {} };
      (api.delete as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await authAPI.deleteUser('user-1');

      expect(api.delete).toHaveBeenCalledWith('/auth/users/user-1');
    });
  });

  describe('productsAPI', () => {
    it('getProducts should call get with params', async () => {
      const mockResponse = { data: [] };
      (api.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const params = { categoryId: 'cat-1', search: 'test' };
      await productsAPI.getProducts(params);

      expect(api.get).toHaveBeenCalledWith('/products', { params });
    });

    it('getProduct should call get with id', async () => {
      const mockResponse = { data: {} };
      (api.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await productsAPI.getProduct('prod-1');

      expect(api.get).toHaveBeenCalledWith('/products/prod-1');
    });

    it('createProduct should call post with data', async () => {
      const mockResponse = { data: { id: '1' } };
      (api.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const productData = { name: 'Test Product', categoryId: 'cat-1', productType: 'SINGLE' as const };
      await productsAPI.createProduct(productData);

      expect(api.post).toHaveBeenCalledWith('/products', productData);
    });

    it('updateProduct should call put with id and data', async () => {
      const mockResponse = { data: {} };
      (api.put as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const productData = { name: 'Updated Product' };
      await productsAPI.updateProduct('prod-1', productData);

      expect(api.put).toHaveBeenCalledWith('/products/prod-1', productData);
    });

    it('deleteProduct should call delete with id', async () => {
      const mockResponse = { data: {} };
      (api.delete as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await productsAPI.deleteProduct('prod-1');

      expect(api.delete).toHaveBeenCalledWith('/products/prod-1');
    });

    it('getCategories should call get /products/categories', async () => {
      const mockResponse = { data: [] };
      (api.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await productsAPI.getCategories();

      expect(api.get).toHaveBeenCalledWith('/products/categories');
    });

    it('searchBySKU should call get with sku', async () => {
      const mockResponse = { data: {} };
      (api.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await productsAPI.searchBySKU('SKU-001');

      expect(api.get).toHaveBeenCalledWith('/products/search/sku/SKU-001');
    });
  });

  describe('cabangAPI', () => {
    it('getCabangs should call get /cabang', async () => {
      const mockResponse = { data: [] };
      (api.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await cabangAPI.getCabangs();

      expect(api.get).toHaveBeenCalledWith('/cabang');
    });

    it('createCabang should call post with data', async () => {
      const mockResponse = { data: { id: '1' } };
      (api.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const cabangData = { name: 'New Branch', address: 'Address' };
      await cabangAPI.createCabang(cabangData);

      expect(api.post).toHaveBeenCalledWith('/cabang', cabangData);
    });
  });

  describe('transactionsAPI', () => {
    it('createTransaction should call post with transaction data', async () => {
      const mockResponse = { data: { id: '1' } };
      (api.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const transactionData = {
        cabangId: 'cab-1',
        items: [{ productVariantId: 'var-1', quantity: 2, price: 10000 }],
        paymentMethod: 'CASH',
      };
      await transactionsAPI.createTransaction(transactionData);

      expect(api.post).toHaveBeenCalledWith('/transactions', transactionData);
    });

    it('getTransaction should call get with id', async () => {
      const mockResponse = { data: {} };
      (api.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await transactionsAPI.getTransaction('trans-1');

      expect(api.get).toHaveBeenCalledWith('/transactions/trans-1');
    });

    it('getSummary should call get with params', async () => {
      const mockResponse = { data: {} };
      (api.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const params = { startDate: '2025-01-01', endDate: '2025-01-31' };
      await transactionsAPI.getSummary(params);

      expect(api.get).toHaveBeenCalledWith('/transactions/reports/summary', { params });
    });
  });
});
