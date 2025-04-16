import { type ProjectStage, type Currency } from '@prisma/client';

/**
 * Format a number as currency
 * @param value The value to format
 * @param currency The currency to use (USD or EUR)
 * @returns Formatted currency string
 */
export const formatCurrency = (value: number, currency: Currency = 'USD'): string => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return formatter.format(value);
};

// Helper function to format stage names
export const formatStage = (stage: ProjectStage | null | undefined) => {
  if (!stage) return 'Not specified';

  return stage
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
};
