/**
 * Security utilities for the application
 */

// Sanitize user input to prevent XSS attacks
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
    .trim();
}

// Validate email format
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate password strength
export function isStrongPassword(password) {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const minLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  
  return minLength && hasUpperCase && hasLowerCase && hasNumber;
}

// Validate username (alphanumeric, underscore, hyphen only)
export function isValidUsername(username) {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  return usernameRegex.test(username);
}

// Rate limiting tracker (simple client-side)
const rateLimitMap = new Map();

export function checkRateLimit(key, maxAttempts = 5, windowMs = 60000) {
  const now = Date.now();
  const attempts = rateLimitMap.get(key) || [];
  
  // Filter out old attempts
  const recentAttempts = attempts.filter(time => now - time < windowMs);
  
  if (recentAttempts.length >= maxAttempts) {
    return false; // Rate limit exceeded
  }
  
  recentAttempts.push(now);
  rateLimitMap.set(key, recentAttempts);
  return true; // Allowed
}

// Sanitize SQL input (for raw queries - though Supabase handles this)
export function sanitizeSQLInput(input) {
  if (typeof input !== 'string') return input;
  
  // Remove SQL keywords and special characters
  return input
    .replace(/['";\\]/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '')
    .trim();
}

// Validate file uploads
export function validateFileUpload(file, allowedTypes = [], maxSizeMB = 10) {
  if (!file) return { valid: false, error: 'No file provided' };
  
  // Check file size
  const maxSize = maxSizeMB * 1024 * 1024; // Convert to bytes
  if (file.size > maxSize) {
    return { valid: false, error: `File size exceeds ${maxSizeMB}MB` };
  }
  
  // Check file type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File type not allowed' };
  }
  
  return { valid: true };
}

// Generate random token for CSRF protection
export function generateToken(length = 32) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Secure session storage
export const secureStorage = {
  set: (key, value) => {
    try {
      const encrypted = btoa(JSON.stringify(value)); // Basic encoding (use proper encryption in production)
      sessionStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Error storing data:', error);
    }
  },
  
  get: (key) => {
    try {
      const encrypted = sessionStorage.getItem(key);
      if (!encrypted) return null;
      return JSON.parse(atob(encrypted));
    } catch (error) {
      console.error('Error retrieving data:', error);
      return null;
    }
  },
  
  remove: (key) => {
    sessionStorage.removeItem(key);
  },
  
  clear: () => {
    sessionStorage.clear();
  }
};

// Prevent multiple rapid form submissions
export function createSubmissionGuard(cooldownMs = 2000) {
  let lastSubmission = 0;
  
  return () => {
    const now = Date.now();
    if (now - lastSubmission < cooldownMs) {
      return false; // Too soon
    }
    lastSubmission = now;
    return true; // Allowed
  };
}

// Validate and sanitize URL parameters
export function sanitizeUrlParam(param) {
  if (typeof param !== 'string') return '';
  
  return param
    .replace(/[<>'"]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

// Check if content contains potential XSS
export function containsXSS(content) {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
  ];
  
  return xssPatterns.some(pattern => pattern.test(content));
}

// Secure cookie settings
export const secureCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 60 * 60 * 24 * 7, // 1 week
  path: '/',
};
