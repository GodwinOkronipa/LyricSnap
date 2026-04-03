/**
 * Input validation and sanitization utilities for API endpoints
 * Prevents injection attacks and malformed data
 */

export interface ValidationRule {
  type: 'string' | 'number' | 'email' | 'url' | 'uuid';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  sanitize?: boolean;
}

export class ValidationError extends Error {
  constructor(public field: string, message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validate and sanitize input against rules
 */
export function validateInput(
  data: Record<string, any>,
  rules: Record<string, ValidationRule>
): Record<string, any> {
  const validated: Record<string, any> = {};
  const errors: ValidationError[] = [];

  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];

    // Check required
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push(new ValidationError(field, `${field} is required`));
      continue;
    }

    if (value === undefined || value === null) {
      continue;
    }

    // Type validation
    switch (rule.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push(new ValidationError(field, `${field} must be a string`));
          continue;
        }

        if (rule.minLength && value.length < rule.minLength) {
          errors.push(
            new ValidationError(field, `${field} must be at least ${rule.minLength} characters`)
          );
          continue;
        }

        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push(
            new ValidationError(field, `${field} must not exceed ${rule.maxLength} characters`)
          );
          continue;
        }

        if (rule.pattern && !rule.pattern.test(value)) {
          errors.push(new ValidationError(field, `${field} has invalid format`));
          continue;
        }

        // Sanitize HTML/scripts if needed
        if (rule.sanitize) {
          validated[field] = sanitizeHtml(value);
        } else {
          validated[field] = value;
        }
        break;

      case 'email':
        if (!isValidEmail(value)) {
          errors.push(new ValidationError(field, `${field} is not a valid email`));
          continue;
        }
        validated[field] = value.toLowerCase().trim();
        break;

      case 'url':
        if (!isValidUrl(value)) {
          errors.push(new ValidationError(field, `${field} is not a valid URL`));
          continue;
        }
        validated[field] = value;
        break;

      case 'uuid':
        if (!isValidUUID(value)) {
          errors.push(new ValidationError(field, `${field} is not a valid UUID`));
          continue;
        }
        validated[field] = value;
        break;

      case 'number':
        const num = Number(value);
        if (isNaN(num)) {
          errors.push(new ValidationError(field, `${field} must be a number`));
          continue;
        }
        validated[field] = num;
        break;
    }
  }

  if (errors.length > 0) {
    const errorMsg = errors.map(e => `${e.field}: ${e.message}`).join('; ');
    throw new ValidationError('validation', errorMsg);
  }

  return validated;
}

/**
 * Email validation (RFC 5322 simplified)
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * URL validation
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * UUID validation (v4)
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Basic HTML/XSS sanitization
 * For production, consider using DOMPurify or similar
 */
function sanitizeHtml(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .substring(0, 10000); // Limit length
}

/**
 * Sanitize object properties recursively
 */
export function sanitizeObject(obj: any, depth = 0): any {
  if (depth > 10) return obj; // Prevent infinite recursion

  if (typeof obj === 'string') {
    return sanitizeHtml(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, depth + 1));
  }

  if (obj !== null && typeof obj === 'object') {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value, depth + 1);
    }
    return sanitized;
  }

  return obj;
}
