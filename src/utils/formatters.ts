import { CurrencyCode } from '../types';

export function formatCurrency(amount: number, currency: CurrencyCode = 'INR'): string {
  if (currency === 'INR') {
    // Indian numbering format (e.g., 8,00,000)
    return '₹' + amount.toLocaleString('en-IN');
  }
  const symbolMap: Record<CurrencyCode, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
  };
  return (symbolMap[currency] || '$') + amount.toLocaleString('en-US');
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString + 'T00:00:00');
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getDaysRemaining(targetDateStr: string): {
  days: number;
  isOverdue: boolean;
  label: string;
} {
  if (!targetDateStr) return { days: 0, isOverdue: false, label: 'No date' };
  const target = new Date(targetDateStr + 'T00:00:00').getTime();
  const today = new Date().setHours(0, 0, 0, 0);
  const diffTime = target - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      days: Math.abs(diffDays),
      isOverdue: true,
      label: `${Math.abs(diffDays)} days ago`,
    };
  } else if (diffDays === 0) {
    return { days: 0, isOverdue: false, label: 'Today!' };
  } else if (diffDays === 1) {
    return { days: 1, isOverdue: false, label: 'Tomorrow' };
  } else {
    return { days: diffDays, isOverdue: false, label: `${diffDays} days left` };
  }
}

export function calculateCompletion(tasks: { status: string }[]): number {
  if (!tasks.length) return 0;
  const completed = tasks.filter((t) => t.status === 'completed').length;
  return Math.round((completed / tasks.length) * 100);
}
