/**
 * Generates a secure random token for password reset (browser compatible)
 * @returns {string} A secure random token
 */
export const generateResetToken = () => {
  const array = new Uint8Array(32); // 32 bytes = 256 bits
  window.crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Validates a reset token's format
 * @param {string} token - The token to validate
 * @returns {boolean} Whether the token is valid
 */
export const isValidResetToken = (token) => {
  // Token should be a 64-character hex string (32 bytes)
  return /^[0-9a-f]{64}$/.test(token);
};

/**
 * Creates an expiration timestamp for a reset token
 * @returns {Date} Expiration date (24 hours from now)
 */
export const createTokenExpiration = () => {
  const expirationDate = new Date();
  expirationDate.setHours(expirationDate.getHours() + 24);
  return expirationDate;
};
