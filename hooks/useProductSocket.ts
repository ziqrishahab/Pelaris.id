'use client';

import { useEffect, useCallback, useRef } from 'react';
import { initSocket, subscribe, isConnected } from '@/lib/socket';

interface ProductSocketOptions {
  onProductCreated?: (product: any) => void;
  onProductUpdated?: (product: any) => void;
  onProductDeleted?: (productId: string) => void;
  onStockUpdated?: (stockData: any) => void;
  onRefreshNeeded?: () => void;
  enabled?: boolean;
}

/**
 * Custom hook for product real-time updates via WebSocket
 * Usage:
 * ```
 * useProductSocket({
 *   onProductUpdated: (product) => { ... },
 *   onStockUpdated: (data) => { ... },
 *   onRefreshNeeded: () => fetchProducts(),
 * });
 * ```
 */
export function useProductSocket(options: ProductSocketOptions = {}) {
  const {
    onProductCreated,
    onProductUpdated,
    onProductDeleted,
    onStockUpdated,
    onRefreshNeeded,
    enabled = true,
  } = options;

  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Initialize socket connection
  useEffect(() => {
    if (!enabled) return;

    let mounted = true;
    
    const connect = async () => {
      if (!isConnected()) {
        await initSocket();
      }
    };

    connect();

    return () => {
      mounted = false;
    };
  }, [enabled]);

  // Subscribe to product:created
  useEffect(() => {
    if (!enabled || !onProductCreated) return;

    const unsubscribe = subscribe('product:created', (event) => {
      onProductCreated(event.data);
    });

    return unsubscribe;
  }, [enabled, onProductCreated]);

  // Subscribe to product:updated
  useEffect(() => {
    if (!enabled || !onProductUpdated) return;

    const unsubscribe = subscribe('product:updated', (event) => {
      onProductUpdated(event.data);
    });

    return unsubscribe;
  }, [enabled, onProductUpdated]);

  // Subscribe to product:deleted
  useEffect(() => {
    if (!enabled || !onProductDeleted) return;

    const unsubscribe = subscribe('product:deleted', (event) => {
      onProductDeleted(event.data?.id);
    });

    return unsubscribe;
  }, [enabled, onProductDeleted]);

  // Subscribe to stock:updated
  useEffect(() => {
    if (!enabled || !onStockUpdated) return;

    const unsubscribe = subscribe('stock:updated', (event) => {
      onStockUpdated(event.data);
    });

    return unsubscribe;
  }, [enabled, onStockUpdated]);

  // Subscribe to sync:trigger for full refresh
  useEffect(() => {
    if (!enabled || !onRefreshNeeded) return;

    const unsubscribe = subscribe('sync:trigger', (event) => {
      if (event.syncType === 'products' || event.syncType === 'all') {
        onRefreshNeeded();
      }
    });

    return unsubscribe;
  }, [enabled, onRefreshNeeded]);

  return {
    isConnected: isConnected(),
  };
}

export default useProductSocket;
