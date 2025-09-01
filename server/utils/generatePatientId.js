// backend/utils/generatePatientId.js
import { customAlphabet } from 'nanoid';
import moment from 'moment';

// Create custom nanoid with specific alphabet (numbers and uppercase letters)
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);

/**
 * Generate unique patient ID in format: PT-YYYY-XXXXXX
 * PT = Patient prefix
 * YYYY = Current year
 * XXXXXX = 6 character random string
 */
export const generatePatientId = () => {
  const year = moment().format('YYYY');
  const randomId = nanoid();
  return `PT-${year}-${randomId}`;
};

// Alternative: Using native Date instead of moment (lighter)
// export const generatePatientId = () => {
//   const year = new Date().getFullYear();
//   const randomId = nanoid();
//   return `PT-${year}-${randomId}`;
// };
