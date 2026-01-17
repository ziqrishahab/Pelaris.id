/**
 * Authentication utilities with improved security
 * 
 * SECURITY NOTES:
 * - Token stored in memory (sessionStorage as fallback for page refresh)
 * - CSRF token stored in memory only (never localStorage)
 * - HttpOnly cookies used as primary authentication
 * - Authorization header as backup for non-cookie scenarios
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

/**
 * Set authentication data
 * - Primary auth: HttpOnly cookie (set by backend, most secure)
 * - Backup: Authorization header with token in sessionStorage
 * - CSRF: memory only (XSS-safe)
 * - User: sessionStorage for UI purposes
 */
export const setAuth = (token: string, user: User, csrfToken?: string) => {
  // Store token in memory and sessionStorage as backup for Authorization header
  // The actual auth happens via HttpOnly cookie set by backend
  memoryToken = token;
  sessionStorage.setItem('token', token);
  
  // CSRF token in memory only - never in storage (XSS-safe)
  if (csrfToken) {
    memoryCsrfToken = csrfToken;
  }
  
  // User data for UI (non-sensitive)
  sessionStorage.setItem('user', JSON.stringify(user));
  
  // Cookie for Next.js middleware (non-HttpOnly, just for routing)
  document.cookie = `user=${encodeURIComponent(JSON.stringify({
    role: user.role,
    cabangId: user.cabangId,
  }))}; path=/; max-age=86400; SameSite=Lax`;
};

/**
 * Get authentication data
 */
export const getAuth = (): { token: string | null; user: User | null; csrfToken: string | null } => {
  if (typeof window === 'undefined') {
    return { token: null, user: null, csrfToken: null };
  }
  
  // Try memory first, then sessionStorage
  const token = memoryToken || sessionStorage.getItem('token');
  if (token && !memoryToken) {
    memoryToken = token; // Restore to memory
  }
  
  const userStr = sessionStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  
  return { token, user, csrfToken: memoryCsrfToken };
};

/**
 * Get token only (for API calls)
 */
export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return memoryToken || sessionStorage.getItem('token');
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
  
  // Clear sessionStorage
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  
  // Clear cookies
  document.cookie = 'user=; path=/; max-age=0';
  document.cookie = 'token=; path=/; max-age=0';
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
  sessionStorage.setItem('user', JSON.stringify(user));
};
