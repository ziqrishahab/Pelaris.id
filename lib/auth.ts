/**
 * Authentication utilities with improved security
 * 
 * SECURITY NOTES:
 * - Token stored in localStorage (shared across tabs for multi-tab support)
 * - CSRF token stored in memory only (never localStorage)
 * - HttpOnly cookies used as primary authentication
 * - Authorization header as backup for non-cookie scenarios
 * - Storage event listener for cross-tab auth sync
 */

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'OWNER' | 'MANAGER' | 'ADMIN' | 'KASIR';
  cabangId: string | null;
  isActive: boolean;
  hasMultiCabangAccess?: boolean;
  tenantId?: string;
  storeName?: string;
  cabang?: {
    id: string;
    name: string;
    address?: string;
    phone?: string;
  };
}

// In-memory token storage (XSS-safe for CSRF token)
let memoryToken: string | null = null;
let memoryCsrfToken: string | null = null;

// Initialize cross-tab auth sync and migrate from sessionStorage
if (typeof window !== 'undefined') {
  // Migrate from sessionStorage to localStorage (one-time for existing sessions)
  const sessionToken = sessionStorage.getItem('token');
  const sessionUser = sessionStorage.getItem('user');
  if (sessionToken && !localStorage.getItem('token')) {
    localStorage.setItem('token', sessionToken);
    if (sessionUser) localStorage.setItem('user', sessionUser);
  }
  // Clear old sessionStorage data
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');

  // Listen for auth changes from other tabs
  window.addEventListener('storage', (event) => {
    if (event.key === 'token' || event.key === 'user') {
      // Auth changed in another tab, dispatch event for components to re-check
      window.dispatchEvent(new Event('authChange'));
    }
  });
}

/**
 * Set authentication data
 * - Primary auth: HttpOnly cookie (set by backend, most secure)
 * - Backup: Authorization header with token in localStorage (shared across tabs)
 * - CSRF: memory only (XSS-safe)
 * - User: localStorage for UI purposes (shared across tabs)
 */
export const setAuth = (token: string, user: User, csrfToken?: string) => {
  // Store token in memory and localStorage for multi-tab support
  // The actual auth happens via HttpOnly cookie set by backend
  memoryToken = token;
  localStorage.setItem('token', token);
  
  // CSRF token in memory only - never in storage (XSS-safe)
  if (csrfToken) {
    memoryCsrfToken = csrfToken;
  }
  
  // User data for UI (non-sensitive) - localStorage for multi-tab
  localStorage.setItem('user', JSON.stringify(user));
  
  // Cookie for Next.js middleware (non-HttpOnly, just for routing)
  document.cookie = `user=${encodeURIComponent(JSON.stringify({
    role: user.role,
    cabangId: user.cabangId,
  }))}; path=/; max-age=86400; SameSite=Lax`;
  
  // Dispatch auth change event for theme sync
  window.dispatchEvent(new Event('authChange'));
};

/**
 * Get authentication data
 */
export const getAuth = (): { token: string | null; user: User | null; csrfToken: string | null } => {
  if (typeof window === 'undefined') {
    return { token: null, user: null, csrfToken: null };
  }
  
  // Try memory first, then localStorage (shared across tabs)
  const token = memoryToken || localStorage.getItem('token');
  if (token && !memoryToken) {
    memoryToken = token; // Restore to memory
  }
  
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  
  return { token, user, csrfToken: memoryCsrfToken };
};

/**
 * Get token only (for API calls)
 */
export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return memoryToken || localStorage.getItem('token');
};

/**
 * Get CSRF token (memory only)
 */
export const getCsrfToken = (): string | null => {
  return memoryCsrfToken;
};

/**
 * Clear all authentication data
 * Note: HttpOnly cookies are cleared by backend on logout
 */
export const clearAuth = () => {
  // Clear memory
  memoryToken = null;
  memoryCsrfToken = null;
  
  // Clear localStorage (will trigger storage event in other tabs)
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Clear cookies
  document.cookie = 'user=; path=/; max-age=0';
  document.cookie = 'token=; path=/; max-age=0';
  
  // Dispatch auth change event for theme sync
  window.dispatchEvent(new Event('authChange'));
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  const token = getToken();
  return !!token;
};

/**
 * Check if user has one of the allowed roles
 */
export const hasRole = (allowedRoles: string[]): boolean => {
  const { user } = getAuth();
  return user ? allowedRoles.includes(user.role) : false;
};

/**
 * Get current user
 */
export const getCurrentUser = (): User | null => {
  const { user } = getAuth();
  return user;
};

/**
 * Update stored user data (after profile update, etc.)
 */
export const updateUser = (user: User) => {
  localStorage.setItem('user', JSON.stringify(user));
};
