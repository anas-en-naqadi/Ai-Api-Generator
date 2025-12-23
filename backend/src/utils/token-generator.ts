/**
 * Utility for generating secure API tokens
 */
import { randomBytes } from 'crypto';

/**
 * Generates a secure random token for API authentication
 * Format: api_<32 random hex characters>
 */
export function generateApiToken(): string {
  const randomPart = randomBytes(16).toString('hex');
  return `api_${randomPart}`;
}

/**
 * Validates if a token has the correct format
 */
export function isValidTokenFormat(token: string): boolean {
  return /^api_[a-f0-9]{32}$/.test(token);
}


