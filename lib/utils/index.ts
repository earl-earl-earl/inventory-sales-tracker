/**
 * Centralized exports for database utilities and operations
 */

export { productOperations, salesOperations, analyticsUtils } from './database';

/**
 * Format a number as Philippine Peso currency with commas
 */
export const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
