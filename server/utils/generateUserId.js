// backend/utils/generateUserId.js

/**
 * Generate unique user ID in format: USER-YYYYMMDD-XXXX
 * USER = User prefix
 * YYYYMMDD = Registration date (Year-Month-Day)
 * XXXX = 4 digit random number
 */
export const generateUserId = (registrationDate = new Date()) => {
  const date = new Date(registrationDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  
  // Generate 4 random digits (1000-9999)
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  
  return `USER-${dateStr}-${randomDigits}`;
};

/**
 * Generate custom ID with different prefix
 * @param {string} prefix - Custom prefix (e.g., 'ADMIN', 'DOCTOR')
 * @param {Date} date - Registration date
 * @returns {string} Custom ID
 */
export const generateCustomId = (prefix = 'USER', date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${dateStr}-${randomDigits}`;
};

/**
 * Validate user ID format
 * @param {string} userId - User ID to validate
 * @returns {boolean} True if valid format
 */
export const validateUserId = (userId) => {
  const userIdRegex = /^USER-\d{8}-\d{4}$/;
  return userIdRegex.test(userId);
};

/**
 * Extract date from user ID
 * @param {string} userId - User ID
 * @returns {Date|null} Extracted date or null if invalid
 */
export const extractDateFromUserId = (userId) => {
  if (!validateUserId(userId)) return null;
  
  const datePart = userId.split('-')[1];
  const year = datePart.substring(0, 4);
  const month = datePart.substring(4, 6);
  const day = datePart.substring(6, 8);
  
  return new Date(`${year}-${month}-${day}`);
};

export default generateUserId;
