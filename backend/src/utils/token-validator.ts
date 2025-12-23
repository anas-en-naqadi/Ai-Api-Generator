/**
 * Utility for validating API tokens
 */
import { getFunction } from '../services/function-storage';

/**
 * Validates a token for a specific function
 * Token must be passed via Authorization header with Bearer format: "Bearer api_xxx"
 */
export function validateToken(
  functionName: string,
  request: {
    headers?: Record<string, string | undefined>;
  }
): { valid: boolean; error?: string } {
  const storedFunction = getFunction(functionName);
  
  if (!storedFunction) {
    return { valid: false, error: 'Function not found' };
  }

  // Get token from Authorization header only
  const authHeader = request.headers?.['authorization'];
  
  if (!authHeader) {
    return {
      valid: false,
      error: 'API token required. Provide token via Authorization header: Authorization: Bearer <token>',
    };
  }

  // Must be in Bearer format
  if (!authHeader.startsWith('Bearer ')) {
    return {
      valid: false,
      error: 'Invalid authorization format. Use: Authorization: Bearer <token>',
    };
  }

  const token = authHeader.substring(7).trim();

  if (!token) {
    return {
      valid: false,
      error: 'Token is missing. Use: Authorization: Bearer <token>',
    };
  }

  // Compare tokens (case-sensitive)
  if (token !== storedFunction.token) {
    return {
      valid: false,
      error: 'Invalid API token',
    };
  }

  return { valid: true };
}

