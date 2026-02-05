/**
 * Offline Queue Service untuk Next.js POS
 * Menggunakan IndexedDB untuk menyimpan transaksi offline
 * Auto-sync saat kembali online
 */

import { env } from './env';
import { getToken, getCsrfToken } from './auth';

// Types
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export interface OfflineTransaction {
  localId: string;
  transactionData: Record<string, unknown>;
  syncStatus: SyncStatus;
  createdAt: Date;
  syncedAt?: Date;
  serverId?: string;
  errorMessage?: string;
  retryCount: number;
}

// Database configuration
const DB_NAME = 'pelaris_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'offline_transactions';
const MAX_RETRY_COUNT = 3;

class OfflineQueueService {
  private db: IDBDatabase | null = null;
  private isInitialized = false;
  private syncInProgress = false;
  
  // Callbacks
  public onPendingCountChanged?: (count: number) => void;
  public onSyncStatusChanged?: (message: string, isError: boolean) => void;
  public onOnlineStatusChanged?: (isOnline: boolean) => void;

  /**
   * Initialize IndexedDB dan setup event listeners
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    // Cek apakah di browser
    if (typeof window === 'undefined') return;
    
    try {
      this.db = await this.openDatabase();
      this.setupConnectivityListeners();
      this.isInitialized = true;
      
      // Notify pending count
      this.notifyPendingCount();
    } catch (error) {
      console.error('Failed to initialize OfflineQueueService:', error);
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
        
        // Create object store jika belum ada
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'localId' });
          store.createIndex('syncStatus', 'syncStatus', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  /**
   * Setup listener untuk online/offline events
   */
  private setupConnectivityListeners(): void {
    window.addEventListener('online', () => {
      this.onOnlineStatusChanged?.(true);
      this.onBackOnline();
    });

    window.addEventListener('offline', () => {
      this.onOnlineStatusChanged?.(false);
    });
  }

  /**
   * Generate unique local ID
   */
  private generateLocalId(): string {
    return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if browser is online
   */
  get isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  /**
   * Queue transaksi untuk di-sync nanti
   */
  async queueTransaction(transactionData: Record<string, unknown>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const localId = this.generateLocalId();
    
    const offlineTransaction: OfflineTransaction = {
      localId,
      transactionData,
      syncStatus: 'pending',
      createdAt: new Date(),
      retryCount: 0,
    };

    await this.saveTransaction(offlineTransaction);
    this.notifyPendingCount();

    // Jika online, langsung coba sync
    if (this.isOnline) {
      this.syncSingleTransaction(offlineTransaction);
    }

    return localId;
  }

  /**
   * Save transaction to IndexedDB
   */
  private saveTransaction(transaction: OfflineTransaction): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const txn = this.db.transaction([STORE_NAME], 'readwrite');
      const store = txn.objectStore(STORE_NAME);
      const request = store.put(transaction);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Get all transactions
   */
  async getAllTransactions(): Promise<OfflineTransaction[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve([]);
        return;
      }

      const txn = this.db.transaction([STORE_NAME], 'readonly');
      const store = txn.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * Get pending transactions
   */
  async getPendingTransactions(): Promise<OfflineTransaction[]> {
    const all = await this.getAllTransactions();
    return all.filter(t => t.syncStatus === 'pending' || t.syncStatus === 'failed');
  }

  /**
   * Get pending count
   */
  async getPendingCount(): Promise<number> {
    const pending = await this.getPendingTransactions();
    return pending.length;
  }

  /**
   * Sync all pending transactions
   */
  async syncAll(): Promise<void> {
    if (this.syncInProgress) return;
    if (!this.isOnline) {
      this.onSyncStatusChanged?.('Tidak ada koneksi internet', true);
      return;
    }

    this.syncInProgress = true;
    this.onSyncStatusChanged?.('Menyinkronkan transaksi...', false);

    try {
      const pendingTransactions = await this.getPendingTransactions();
      let successCount = 0;
      let failCount = 0;

      for (const transaction of pendingTransactions) {
        const success = await this.syncSingleTransaction(transaction);
        if (success) {
          successCount++;
        } else {
          failCount++;
        }
      }

      if (successCount > 0 || failCount > 0) {
        const message = `Sinkronisasi selesai: ${successCount} berhasil, ${failCount} gagal`;
        this.onSyncStatusChanged?.(message, failCount > 0);
      }
    } finally {
      this.syncInProgress = false;
      this.notifyPendingCount();
    }
  }

  /**
   * Sync single transaction
   */
  private async syncSingleTransaction(transaction: OfflineTransaction): Promise<boolean> {
    try {
      // Update status to syncing
      transaction.syncStatus = 'syncing';
      await this.saveTransaction(transaction);

      // Get auth token
      const token = getToken();

      if (!token) {
        throw new Error('No auth token');
      }

      // Build headers with CSRF token
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };
      
      // Add CSRF token for POST request
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        headers['x-csrf-token'] = csrfToken;
      }

      // Send to server using correct API endpoint
      const response = await fetch(`${env.apiUrl}/transactions`, {
        method: 'POST',
        headers,
        credentials: 'include', // Include cookies
        body: JSON.stringify(transaction.transactionData),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();

      // Update status to synced
      transaction.syncStatus = 'synced';
      transaction.syncedAt = new Date();
      transaction.serverId = result.id;
      transaction.errorMessage = undefined;
      await this.saveTransaction(transaction);

      return true;
    } catch (error) {
      // Update status to failed
      transaction.syncStatus = 'failed';
      transaction.retryCount++;
      transaction.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.saveTransaction(transaction);

      return false;
    }
  }

  /**
   * Delete transaction by localId
   */
  async deleteTransaction(localId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const txn = this.db.transaction([STORE_NAME], 'readwrite');
      const store = txn.objectStore(STORE_NAME);
      const request = store.delete(localId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.notifyPendingCount();
        resolve();
      };
    });
  }

  /**
   * Cleanup synced transactions older than specified days
   */
  async cleanupSyncedTransactions(keepDays: number = 7): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - keepDays);

    const all = await this.getAllTransactions();
    const toDelete = all.filter(t => 
      t.syncStatus === 'synced' && 
      t.syncedAt && 
      new Date(t.syncedAt) < cutoffDate
    );

    for (const transaction of toDelete) {
      await this.deleteTransaction(transaction.localId);
    }
  }

  /**
   * Retry failed transactions
   */
  async retryFailed(): Promise<void> {
    const all = await this.getAllTransactions();
    const failed = all.filter(t => 
      t.syncStatus === 'failed' && 
      t.retryCount < MAX_RETRY_COUNT
    );

    for (const transaction of failed) {
      transaction.syncStatus = 'pending';
      await this.saveTransaction(transaction);
    }

    await this.syncAll();
  }

  /**
   * Handler saat kembali online
   */
  private async onBackOnline(): Promise<void> {
    const pendingCount = await this.getPendingCount();
    if (pendingCount > 0) {
      this.onSyncStatusChanged?.(
        `Kembali online. Menyinkronkan ${pendingCount} transaksi...`, 
        false
      );
      this.syncAll();
    }
  }

  /**
   * Notify pending count change
   */
  private async notifyPendingCount(): Promise<void> {
    const count = await this.getPendingCount();
    this.onPendingCountChanged?.(count);
  }
}

// Singleton instance
let instance: OfflineQueueService | null = null;

export function getOfflineQueueService(): OfflineQueueService {
  if (!instance) {
    instance = new OfflineQueueService();
  }
  return instance;
}

export default OfflineQueueService;
