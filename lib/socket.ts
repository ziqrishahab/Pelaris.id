/**
 * Socket.io Client for Real-time Updates
 * Handles websocket connection for stock updates, product changes, etc.
 * 
 * SECURITY: Requires authentication token for connection
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let io: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let socket: any = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

// Event listeners storage
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventCallback = (data: any) => void;
const eventListeners: Map<string, Set<EventCallback>> = new Map();

import { getToken } from './auth';

/**
 * Get authentication token
 */
function getAuthToken(): string | null {
  return getToken();
}

/**
 * Load socket.io-client dynamically (browser only)
 */
async function loadSocketIO() {
  if (io) return io;
  if (typeof window === 'undefined') return null;
  
  try {
    const socketModule = await import('socket.io-client');
    io = socketModule.io;
    return io;
  } catch (error) {
    console.error('[Socket] Failed to load socket.io-client:', error);
    return null;
  }
}

/**
 * Initialize socket connection with authentication
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function initSocket(): Promise<any> {
  if (socket?.connected) {
    console.log('[Socket] Already connected');
    return socket;
  }

  // Get auth token - required for connection
  const token = getAuthToken();
  if (!token) {
    console.warn('[Socket] No auth token available, skipping socket connection');
    return null;
  }

  const socketIO = await loadSocketIO();
  if (!socketIO) {
    console.warn('[Socket] socket.io-client not available');
    return null;
  }

  const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'https://api-pelaris.ziqrishahab.com';

  try {
    socket = socketIO(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      // Send authentication token
      auth: {
        token: token,
      },
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected to server (authenticated)');
      reconnectAttempts = 0;
    });

    socket.on('disconnect', (reason: string) => {
      console.log('[Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (error: Error) => {
      reconnectAttempts++;
      
      // Check if authentication error
      if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
        console.error('[Socket] Authentication failed:', error.message);
        // Don't retry on auth errors - user needs to re-login
        disconnectSocket();
        return;
      }
      
      console.warn(`[Socket] Connection error (attempt ${reconnectAttempts}):`, error.message);
      
      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error('[Socket] Max reconnection attempts reached');
      }
    });

    // Setup event forwarding
    setupEventForwarding(socket);

    return socket;
  } catch (error) {
    console.error('[Socket] Failed to initialize:', error);
    return null;
  }
}

/**
 * Setup forwarding for all known events
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setupEventForwarding(sock: any) {
  const events = [
    'stock:updated',
    'product:created',
    'product:updated',
    'product:deleted',
    'category:updated',
    'sync:trigger',
  ];

  events.forEach(event => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sock.on(event, (data: any) => {
      console.log(`[Socket] Received ${event}:`, data);
      
      // Forward to all registered listeners
      const listeners = eventListeners.get(event);
      if (listeners) {
        listeners.forEach(callback => {
          try {
            callback(data);
          } catch (err) {
            console.error(`[Socket] Error in ${event} listener:`, err);
          }
        });
      }
    });
  });
}

/**
 * Subscribe to an event
 */
export function subscribe(event: string, callback: EventCallback): () => void {
  if (!eventListeners.has(event)) {
    eventListeners.set(event, new Set());
  }
  
  eventListeners.get(event)!.add(callback);

  // Return unsubscribe function
  return () => {
    const listeners = eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  };
}

/**
 * Check if socket is connected
 */
export function isConnected(): boolean {
  return socket?.connected || false;
}

/**
 * Disconnect socket
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    eventListeners.clear();
    console.log('[Socket] Disconnected and cleaned up');
  }
}

/**
 * Reconnect socket with fresh token (call after login)
 */
export async function reconnectSocket(): Promise<void> {
  disconnectSocket();
  await initSocket();
}

// Types
export interface StockUpdateData {
  type: string;
  data: {
    productVariantId: string;
    cabangId: string;
    quantity: number;
    previousQuantity?: number;
    operation?: 'add' | 'subtract' | 'set';
  };
  timestamp: string;
}

export interface ProductUpdateData {
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  timestamp: string;
}
