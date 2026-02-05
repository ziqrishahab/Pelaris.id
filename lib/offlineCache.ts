/**
 * Offline Cache Service untuk menyimpan data lokal
 * Menggunakan IndexedDB untuk cache besar seperti transactions, products
 */

// Database configuration
const DB_NAME = 'pelaris_offline_cache';
const DB_VERSION = 1;

// Store names
const STORES = {
  TRANSACTIONS: 'cached_transactions',
  PRODUCTS: 'cached_products',
  METADATA: 'cache_metadata',
};

export interface CachedTransaction {
  id: string;
  transactionNo: string;
  customerName?: string;
  customerPhone?: string;
  total: number;
  totalAmount?: number;
  paymentMethod: string;
  createdAt: string;
  cabangId: string;
  items: Array<{
    id: string;
    productName?: string;
    variantInfo?: string;
    quantity: number;
    price: number;
    subtotal?: number;
    productVariantId: string;
  }>;
  // Offline-specific flags
  isOffline?: boolean;
  syncStatus?: 'pending' | 'synced';
}

export interface CacheMetadata {
  key: string;
  lastUpdated: Date;
  expiresAt?: Date;
}

class OfflineCacheService {
  private db: IDBDatabase | null = null;
  private isInitialized = false;

  /**
   * Initialize IndexedDB
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (typeof window === 'undefined') return;

    try {
      this.db = await this.openDatabase();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize OfflineCacheService:', error);
    }
  }

  /**
   * Open IndexedDB database
   */
  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create transactions store
        if (!db.objectStoreNames.contains(STORES.TRANSACTIONS)) {
          const txStore = db.createObjectStore(STORES.TRANSACTIONS, { keyPath: 'id' });
          txStore.createIndex('cabangId', 'cabangId', { unique: false });
          txStore.createIndex('createdAt', 'createdAt', { unique: false });
          txStore.createIndex('transactionNo', 'transactionNo', { unique: true });
        }

        // Create products store
        if (!db.objectStoreNames.contains(STORES.PRODUCTS)) {
          const prodStore = db.createObjectStore(STORES.PRODUCTS, { keyPath: 'id' });
          prodStore.createIndex('cabangId', 'cabangId', { unique: false });
        }

        // Create metadata store
        if (!db.objectStoreNames.contains(STORES.METADATA)) {
          db.createObjectStore(STORES.METADATA, { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Check if browser is online
   */
  get isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  // ==================== TRANSACTIONS ====================

  /**
   * Cache transactions for a specific cabang
   */
  async cacheTransactions(cabangId: string, transactions: CachedTransaction[]): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const txn = this.db!.transaction([STORES.TRANSACTIONS, STORES.METADATA], 'readwrite');
      const store = txn.objectStore(STORES.TRANSACTIONS);
      const metaStore = txn.objectStore(STORES.METADATA);

      // Clear old transactions for this cabang first (optional: or merge)
      const deleteRequest = store.index('cabangId').openCursor(IDBKeyRange.only(cabangId));
      
      deleteRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          // Only delete non-offline transactions (keep pending offline ones)
          const record = cursor.value as CachedTransaction;
          if (!record.isOffline || record.syncStatus === 'synced') {
            cursor.delete();
          }
          cursor.continue();
        } else {
          // After deleting, add new transactions
          for (const tx of transactions) {
            store.put({ ...tx, cabangId });
          }

          // Update metadata
          metaStore.put({
            key: `transactions_${cabangId}`,
            lastUpdated: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          });
        }
      };

      txn.oncomplete = () => resolve();
      txn.onerror = () => reject(txn.error);
    });
  }

  /**
   * Get cached transactions for a cabang
   */
  async getCachedTransactions(cabangId: string): Promise<CachedTransaction[]> {
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const txn = this.db!.transaction([STORES.TRANSACTIONS], 'readonly');
      const store = txn.objectStore(STORES.TRANSACTIONS);
      const index = store.index('cabangId');
      const request = index.getAll(IDBKeyRange.only(cabangId));

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const results = request.result as CachedTransaction[];
        // Sort by createdAt descending
        results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(results);
      };
    });
  }

  /**
   * Add a single offline transaction to cache
   */
  async addOfflineTransaction(transaction: CachedTransaction): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const txn = this.db!.transaction([STORES.TRANSACTIONS], 'readwrite');
      const store = txn.objectStore(STORES.TRANSACTIONS);
      
      const offlineTx: CachedTransaction = {
        ...transaction,
        isOffline: true,
        syncStatus: 'pending',
      };
      
      store.put(offlineTx);

      txn.oncomplete = () => resolve();
      txn.onerror = () => reject(txn.error);
    });
  }

  /**
   * Mark offline transaction as synced
   */
  async markTransactionSynced(localId: string, serverId: string): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const txn = this.db!.transaction([STORES.TRANSACTIONS], 'readwrite');
      const store = txn.objectStore(STORES.TRANSACTIONS);
      
      const getRequest = store.get(localId);
      
      getRequest.onsuccess = () => {
        const tx = getRequest.result as CachedTransaction;
        if (tx) {
          tx.id = serverId; // Update to server ID
          tx.syncStatus = 'synced';
          tx.isOffline = false;
          store.put(tx);
          // Delete the old local ID entry
          store.delete(localId);
        }
      };

      txn.oncomplete = () => resolve();
      txn.onerror = () => reject(txn.error);
    });
  }

  /**
   * Get cache metadata
   */
  async getCacheMetadata(key: string): Promise<CacheMetadata | null> {
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const txn = this.db!.transaction([STORES.METADATA], 'readonly');
      const store = txn.objectStore(STORES.METADATA);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  /**
   * Check if cache is valid (not expired)
   */
  async isCacheValid(cabangId: string): Promise<boolean> {
    const meta = await this.getCacheMetadata(`transactions_${cabangId}`);
    if (!meta) return false;
    if (meta.expiresAt && new Date(meta.expiresAt) < new Date()) return false;
    return true;
  }

  /**
   * Clear all cached data
   */
  async clearAll(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const txn = this.db!.transaction(
        [STORES.TRANSACTIONS, STORES.PRODUCTS, STORES.METADATA],
        'readwrite'
      );
      
      txn.objectStore(STORES.TRANSACTIONS).clear();
      txn.objectStore(STORES.PRODUCTS).clear();
      txn.objectStore(STORES.METADATA).clear();

      txn.oncomplete = () => resolve();
      txn.onerror = () => reject(txn.error);
    });
  }

  // ==================== PRODUCTS (for future use) ====================

  /**
   * Cache products for a cabang
   */
  async cacheProducts(cabangId: string, products: any[]): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const txn = this.db!.transaction([STORES.PRODUCTS, STORES.METADATA], 'readwrite');
      const store = txn.objectStore(STORES.PRODUCTS);
      const metaStore = txn.objectStore(STORES.METADATA);

      // Clear old products for this cabang
      const deleteRequest = store.index('cabangId').openCursor(IDBKeyRange.only(cabangId));
      
      deleteRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          // Add new products
          for (const product of products) {
            store.put({ ...product, cabangId });
          }

          // Update metadata
          metaStore.put({
            key: `products_${cabangId}`,
            lastUpdated: new Date(),
            expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
          });
        }
      };

      txn.oncomplete = () => resolve();
      txn.onerror = () => reject(txn.error);
    });
  }

  /**
   * Get cached products
   */
  async getCachedProducts(cabangId: string): Promise<any[]> {
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const txn = this.db!.transaction([STORES.PRODUCTS], 'readonly');
      const store = txn.objectStore(STORES.PRODUCTS);
      const index = store.index('cabangId');
      const request = index.getAll(IDBKeyRange.only(cabangId));

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }
}

// Singleton instance
let instance: OfflineCacheService | null = null;

export function getOfflineCacheService(): OfflineCacheService {
  if (!instance) {
    instance = new OfflineCacheService();
  }
  return instance;
}

export default OfflineCacheService;
