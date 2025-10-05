import { Transform } from 'class-transformer';

export function SanitizeString() {
  return Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    
    return value
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove potential XSS vectors
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      // Remove SQL injection patterns
      .replace(/['";\\]/g, '')
      // Trim and limit length
      .trim()
      .substring(0, 1000);
  });
}

export function SanitizeUrl() {
  return Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    
    // Basic URL validation and sanitization
    try {
      const url = new URL(value);
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Invalid protocol');
      }
      return url.toString();
    } catch {
      return '';
    }
  });
}

export function SanitizeEmail() {
  return Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    
    return value
      .toLowerCase()
      .trim()
      .substring(0, 254); // RFC 5321 limit - don't remove characters, just trim and limit length
  });
}
