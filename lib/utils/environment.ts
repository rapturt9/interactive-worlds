/**
 * Utility functions for environment detection
 */

/**
 * Checks if the app is running on localhost
 * @returns true if running on localhost, false otherwise
 */
export function isLocalhost(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}
