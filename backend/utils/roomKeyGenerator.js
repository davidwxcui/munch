/**
 * Generate a unique 4-letter room key
 * Example: "ABCD"
 */
export function generateRoomKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Validate room key format
 */
export function isValidRoomKey(key) {
  if (!key || typeof key !== 'string') return false;
  return /^[A-Z]{4}$/.test(key.toUpperCase());
}
