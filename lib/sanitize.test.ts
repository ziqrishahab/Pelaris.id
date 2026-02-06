import { describe, it, expect } from 'vitest';
import {
  escapeHtml,
  stripHtml,
  sanitizeString,
  sanitizePhone,
  sanitizeEmail,
  sanitizeNumeric,
  sanitizeInteger,
  sanitizeUrl,
  sanitizeFilename,
  sanitizeObject,
  hasScriptInjection,
  sanitizeSearchQuery,
} from './sanitize';

describe('sanitize utilities', () => {
  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
      );
    });

    it('should handle empty string', () => {
      expect(escapeHtml('')).toBe('');
    });

    it('should handle null/undefined', () => {
      expect(escapeHtml(null as unknown as string)).toBe('');
      expect(escapeHtml(undefined as unknown as string)).toBe('');
    });

    it('should escape ampersand', () => {
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });
  });

  describe('stripHtml', () => {
    it('should remove HTML tags', () => {
      expect(stripHtml('<p>Hello <b>World</b></p>')).toBe('Hello World');
    });

    it('should handle self-closing tags', () => {
      expect(stripHtml('Line 1<br/>Line 2')).toBe('Line 1Line 2');
    });

    it('should handle empty string', () => {
      expect(stripHtml('')).toBe('');
    });
  });

  describe('sanitizeString', () => {
    it('should strip HTML and escape special chars', () => {
      expect(sanitizeString('<script>alert("xss")</script>')).toBe(
        'alert(&quot;xss&quot;)'
      );
    });

    it('should trim whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
    });

    it('should handle normal text', () => {
      expect(sanitizeString('Hello World')).toBe('Hello World');
    });
  });

  describe('sanitizePhone', () => {
    it('should keep valid phone characters', () => {
      expect(sanitizePhone('+62 812-3456-7890')).toBe('+62 812-3456-7890');
    });

    it('should remove invalid characters', () => {
      expect(sanitizePhone('08123<script>45678')).toBe('0812345678');
    });

    it('should handle parentheses', () => {
      expect(sanitizePhone('(021) 123-4567')).toBe('(021) 123-4567');
    });
  });

  describe('sanitizeEmail', () => {
    it('should lowercase and trim email', () => {
      expect(sanitizeEmail('  TEST@Example.COM  ')).toBe('test@example.com');
    });

    it('should handle empty string', () => {
      expect(sanitizeEmail('')).toBe('');
    });
  });

  describe('sanitizeNumeric', () => {
    it('should keep digits and decimal point', () => {
      expect(sanitizeNumeric('123.45')).toBe('123.45');
    });

    it('should remove non-numeric characters', () => {
      expect(sanitizeNumeric('$1,234.56abc')).toBe('1234.56');
    });

    it('should handle multiple decimal points', () => {
      expect(sanitizeNumeric('1.2.3')).toBe('1.23');
    });
  });

  describe('sanitizeInteger', () => {
    it('should keep only digits', () => {
      expect(sanitizeInteger('12345')).toBe('12345');
    });

    it('should remove non-digits', () => {
      expect(sanitizeInteger('1,234.56')).toBe('123456');
    });

    it('should remove negative sign', () => {
      expect(sanitizeInteger('-123')).toBe('123');
    });
  });

  describe('sanitizeUrl', () => {
    it('should allow https URLs', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com/');
    });

    it('should allow http URLs', () => {
      expect(sanitizeUrl('http://example.com')).toBe('http://example.com/');
    });

    it('should add https to URLs without protocol', () => {
      expect(sanitizeUrl('example.com')).toBe('https://example.com/');
    });

    it('should reject javascript: URLs', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBe('');
    });

    it('should reject data: URLs', () => {
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('');
    });
  });

  describe('sanitizeFilename', () => {
    it('should remove path traversal', () => {
      expect(sanitizeFilename('../../../etc/passwd')).toBe('etcpasswd');
    });

    it('should remove special characters', () => {
      expect(sanitizeFilename('file<name>:test.txt')).toBe('filenametest.txt');
    });

    it('should keep valid filenames', () => {
      expect(sanitizeFilename('document.pdf')).toBe('document.pdf');
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize all string values', () => {
      const obj = {
        name: '<script>xss</script>',
        age: 25,
        items: ['<b>item1</b>', '<i>item2</i>'],
      };

      const result = sanitizeObject(obj);
      expect(result.name).toBe('xss');
      expect(result.age).toBe(25);
      expect(result.items).toEqual(['item1', 'item2']);
    });

    it('should handle nested objects', () => {
      const obj = {
        user: {
          name: '<script>xss</script>',
        },
      };

      const result = sanitizeObject(obj);
      expect(result.user.name).toBe('xss');
    });
  });

  describe('hasScriptInjection', () => {
    it('should detect script tags', () => {
      expect(hasScriptInjection('<script>alert(1)</script>')).toBe(true);
    });

    it('should detect javascript: protocol', () => {
      expect(hasScriptInjection('javascript:alert(1)')).toBe(true);
    });

    it('should detect event handlers', () => {
      expect(hasScriptInjection('onclick=alert(1)')).toBe(true);
      expect(hasScriptInjection('onerror=alert(1)')).toBe(true);
    });

    it('should return false for safe strings', () => {
      expect(hasScriptInjection('Hello World')).toBe(false);
    });

    it('should detect iframe tags', () => {
      expect(hasScriptInjection('<iframe src="evil.com">')).toBe(true);
    });
  });

  describe('sanitizeSearchQuery', () => {
    it('should trim and limit length', () => {
      const longQuery = 'a'.repeat(200);
      expect(sanitizeSearchQuery(longQuery, 100)).toHaveLength(100);
    });

    it('should remove SQL injection characters', () => {
      expect(sanitizeSearchQuery("'; DROP TABLE users; --")).toBe(' DROP TABLE users --');
    });

    it('should remove regex special characters', () => {
      expect(sanitizeSearchQuery('test.*+?')).toBe('test');
    });

    it('should handle normal queries', () => {
      expect(sanitizeSearchQuery('product name')).toBe('product name');
    });
  });
});
