/**
 * Input Sanitization Utilities
 * Centralized XSS prevention and input sanitization for user inputs
 */

// HTML entities to escape
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Escape HTML special characters to prevent XSS
 * @param str - String to escape
 * @returns Escaped string safe for HTML context
 */
export function escapeHtml(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Strip HTML tags from string
 * @param str - String potentially containing HTML
 * @returns String with HTML tags removed
 */
export function stripHtml(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize string for safe display and storage
 * Combines HTML stripping and entity escaping
 * @param str - String to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(str: string): string {
  if (!str || typeof str !== 'string') return '';
  // First strip HTML tags, then escape any remaining special chars
  return escapeHtml(stripHtml(str.trim()));
}

/**
 * Sanitize phone number - only allow digits, +, -, (, ), and spaces
 * @param phone - Phone number to sanitize
 * @returns Sanitized phone number
 */
export function sanitizePhone(phone: string): string {
  if (!phone || typeof phone !== 'string') return '';
  return phone.replace(/[^\d+\-() ]/g, '').trim();
}

/**
 * Sanitize email - lowercase and trim
 * @param email - Email to sanitize
 * @returns Sanitized email
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') return '';
  return email.toLowerCase().trim();
}

/**
 * Sanitize numeric string - only allow digits and decimal point
 * @param numStr - Numeric string to sanitize
 * @returns Sanitized numeric string
 */
export function sanitizeNumeric(numStr: string): string {
  if (!numStr || typeof numStr !== 'string') return '';
  // Allow only digits, one decimal point
  const sanitized = numStr.replace(/[^\d.]/g, '');
  // Ensure only one decimal point
  const parts = sanitized.split('.');
  if (parts.length > 2) {
    return parts[0] + '.' + parts.slice(1).join('');
  }
  return sanitized;
}

/**
 * Sanitize integer string - only allow digits
 * @param numStr - Integer string to sanitize
 * @returns Sanitized integer string
 */
export function sanitizeInteger(numStr: string): string {
  if (!numStr || typeof numStr !== 'string') return '';
  return numStr.replace(/\D/g, '');
}

/**
 * Sanitize URL - validate and sanitize URL string
 * @param url - URL to sanitize
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  
  const trimmed = url.trim().toLowerCase();
  
  // Block dangerous protocols first (before any processing)
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  if (dangerousProtocols.some(proto => trimmed.startsWith(proto))) {
    return '';
  }
  
  let urlToValidate = trimmed;
  
  // If no protocol, add https://
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    urlToValidate = `https://${trimmed}`;
  }
  
  // Validate URL structure
  try {
    const parsed = new URL(urlToValidate);
    // Only allow http/https
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return '';
    }
    return parsed.href;
  } catch {
    return '';
  }
}

/**
 * Sanitize filename - remove dangerous characters
 * @param filename - Filename to sanitize
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') return '';
  // Remove path traversal attempts and dangerous characters
  return filename
    .replace(/\.\./g, '') // No path traversal
    .replace(/[/\\:*?"<>|]/g, '') // No special filesystem chars
    .trim();
}

/**
 * Sanitize object - recursively sanitize all string values in an object
 * @param obj - Object to sanitize
 * @returns Object with sanitized string values
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = {} as T;
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      (sanitized as Record<string, unknown>)[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      (sanitized as Record<string, unknown>)[key] = value.map((item) =>
        typeof item === 'string' ? sanitizeString(item) : 
        typeof item === 'object' && item !== null ? sanitizeObject(item as Record<string, unknown>) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      (sanitized as Record<string, unknown>)[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      (sanitized as Record<string, unknown>)[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Check if string contains potential script injection
 * @param str - String to check
 * @returns true if potentially dangerous content detected
 */
export function hasScriptInjection(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  
  const dangerous = [
    /<script[\s\S]*?>/i,
    /javascript:/i,
    /on\w+=/i,  // onclick=, onerror=, etc.
    /data:/i,
    /vbscript:/i,
    /<iframe/i,
    /<embed/i,
    /<object/i,
    /eval\(/i,
    /expression\(/i,
  ];
  
  return dangerous.some((pattern) => pattern.test(str));
}

/**
 * Validate and sanitize search query
 * @param query - Search query to sanitize
 * @param maxLength - Maximum allowed length (default 100)
 * @returns Sanitized search query
 */
export function sanitizeSearchQuery(query: string, maxLength = 100): string {
  if (!query || typeof query !== 'string') return '';
  
  // Trim and limit length
  let sanitized = query.trim().slice(0, maxLength);
  
  // Remove SQL injection attempts
  sanitized = sanitized.replace(/['";\\]/g, '');
  
  // Remove special regex characters that could cause issues
  sanitized = sanitized.replace(/[.*+?^${}()|[\]\\]/g, '');
  
  return sanitized;
}
