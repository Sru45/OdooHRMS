/**
 * Format currency in INR
 */
export function formatCurrency(amount: number | null | undefined): string {
  const validAmount = Number(amount) || 0;
  return '₹' + validAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

/**
 * Format date in en-IN or standard 'MMM D, YYYY' format
 * Examples:
 * - Jan 1, 2024
 * - 01/01/2024 (short version)
 */
export function formatDate(date: string | Date, style: 'short' | 'medium' = 'medium'): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (style === 'short') {
    return d.toLocaleDateString('en-IN');
  }
  
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Get current date in YYYY-MM-DD format based on local timezone (not UTC)
 */
export function getLocalISODate(date: Date = new Date()): string {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().split('T')[0];
}
