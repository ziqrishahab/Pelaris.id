/**
 * useSocket Hook for Dashboard
 * React hook for real-time updates via WebSocket
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { initSocket, subscribe, isConnected, StockUpdateData, ProductUpdateData } from '@/lib/socket';

interface UseRealtimeOptions {
  onStockUpdate?: (data: StockUpdateData) => void;
  onProductCreate?: (data: ProductUpdateData) => void;
  onProductUpdate?: (data: ProductUpdateData) => void;
  onProductDelete?: (data: { id: string }) => void;
  onCategoryUpdate?: (data: ProductUpdateData) => void;
  onRefresh?: () => void; // Generic refresh callback
}

export function useRealtime(options: UseRealtimeOptions = {}) {
  const [connected, setConnected] = useState(false);
  const optionsRef = useRef(options);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const socket = await initSocket();
      if (!socket || !mounted) return;

      const handleConnect = () => mounted && setConnected(true);
      const handleDisconnect = () => mounted && setConnected(false);

      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);

      if (mounted) setConnected(isConnected());

      const unsubscribers: (() => void)[] = [];

      // Stock updates - always subscribe if onRefresh is provided
      if (optionsRef.current.onStockUpdate || optionsRef.current.onRefresh) {
        unsubscribers.push(
          subscribe('stock:updated', (data: StockUpdateData) => {
            optionsRef.current.onStockUpdate?.(data);
            optionsRef.current.onRefresh?.();
          })
        );
      }

      // Product created
      if (optionsRef.current.onProductCreate || optionsRef.current.onRefresh) {
        unsubscribers.push(
          subscribe('product:created', (data: ProductUpdateData) => {
            optionsRef.current.onProductCreate?.(data);
            optionsRef.current.onRefresh?.();
          })
        );
      }

      // Product updated
      if (optionsRef.current.onProductUpdate || optionsRef.current.onRefresh) {
        unsubscribers.push(
          subscribe('product:updated', (data: ProductUpdateData) => {
            optionsRef.current.onProductUpdate?.(data);
            optionsRef.current.onRefresh?.();
          })
        );
      }

      // Product deleted
      if (optionsRef.current.onProductDelete || optionsRef.current.onRefresh) {
        unsubscribers.push(
          subscribe('product:deleted', (data: { data: { id: string } }) => {
            optionsRef.current.onProductDelete?.(data.data);
            optionsRef.current.onRefresh?.();
          })
        );
      }

      // Category updated
      if (optionsRef.current.onCategoryUpdate || optionsRef.current.onRefresh) {
        unsubscribers.push(
          subscribe('category:updated', (data: ProductUpdateData) => {
            optionsRef.current.onCategoryUpdate?.(data);
            optionsRef.current.onRefresh?.();
          })
        );
      }

      return () => {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
        unsubscribers.forEach(unsub => unsub());
      };
    };

    let cleanup: (() => void) | undefined;
    init().then(cleanupFn => {
      cleanup = cleanupFn;
    });

    return () => {
      mounted = false;
      cleanup?.();
    };
  }, []);

  return { connected };
}

/**
 * Simple hook that just triggers refresh on any product/stock change
 * Includes debouncing to prevent rapid refetches during bulk operations
 */
export function useRealtimeRefresh(onRefresh: () => void, debounceMs: number = 2000) {
  const onRefreshRef = useRef(onRefresh);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  const debouncedRefresh = useCallback(() => {
    // Clear any pending refresh
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    // Debounce to batch multiple rapid updates (e.g., bulk import)
    timeoutRef.current = setTimeout(() => {
      onRefreshRef.current();
    }, debounceMs);
  }, [debounceMs]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const { connected } = useRealtime({
    onRefresh: debouncedRefresh,
  });

  return { connected };
}
