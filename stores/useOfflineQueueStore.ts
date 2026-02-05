import { create } from 'zustand';
import { getOfflineQueueService, type OfflineTransaction } from '../lib/offlineQueue';

interface OfflineQueueState {
  // State
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  lastSyncMessage: string | null;
  isError: boolean;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  queueTransaction: (transactionData: Record<string, unknown>) => Promise<string>;
  syncAll: () => Promise<void>;
  retryFailed: () => Promise<void>;
  getPendingTransactions: () => Promise<OfflineTransaction[]>;
  
  // Internal setters
  setIsOnline: (isOnline: boolean) => void;
  setPendingCount: (count: number) => void;
  setSyncStatus: (message: string | null, isError: boolean) => void;
  setIsSyncing: (isSyncing: boolean) => void;
}

export const useOfflineQueueStore = create<OfflineQueueState>()((set, get) => ({
  // Initial state
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  pendingCount: 0,
  isSyncing: false,
  lastSyncMessage: null,
  isError: false,
  isInitialized: false,

  // Internal setters
  setIsOnline: (isOnline) => set({ isOnline }),
  setPendingCount: (pendingCount) => set({ pendingCount }),
  setSyncStatus: (lastSyncMessage, isError) => set({ lastSyncMessage, isError }),
  setIsSyncing: (isSyncing) => set({ isSyncing }),

  // Initialize service
  initialize: async () => {
    if (get().isInitialized) return;
    
    const service = getOfflineQueueService();
    
    // Setup callbacks
    service.onPendingCountChanged = (count) => {
      set({ pendingCount: count });
    };
    
    service.onSyncStatusChanged = (message, isError) => {
      set({ lastSyncMessage: message, isError });
    };
    
    service.onOnlineStatusChanged = (isOnline) => {
      set({ isOnline });
    };
    
    await service.initialize();
    
    // Get initial pending count
    const pendingCount = await service.getPendingCount();
    
    set({ 
      isInitialized: true,
      pendingCount,
      isOnline: navigator.onLine,
    });
  },

  // Queue a transaction for offline sync
  queueTransaction: async (transactionData) => {
    const service = getOfflineQueueService();
    return await service.queueTransaction(transactionData);
  },

  // Sync all pending transactions
  syncAll: async () => {
    set({ isSyncing: true });
    try {
      const service = getOfflineQueueService();
      await service.syncAll();
    } finally {
      set({ isSyncing: false });
    }
  },

  // Retry failed transactions
  retryFailed: async () => {
    const service = getOfflineQueueService();
    await service.retryFailed();
  },

  // Get pending transactions
  getPendingTransactions: async () => {
    const service = getOfflineQueueService();
    return await service.getPendingTransactions();
  },
}));
