import type { CurrencyCode } from './types';

export const RATES_DATE = '2026-05-01';

export const RATES: Record<CurrencyCode, number> = {
  EUR: 1.0000,
  USD: 1.0852,
  GBP: 0.8413,
  JPY: 162.45,
  PLN: 4.2711,
  CHF: 0.9534,
};

export const CURRENCY_NAMES: Record<CurrencyCode, string> = {
  EUR: 'Euro',
  USD: 'US Dollar',
  GBP: 'British Pound',
  JPY: 'Japanese Yen',
  PLN: 'Polish Zloty',
  CHF: 'Swiss Franc',
};

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  JPY: '¥',
  PLN: 'zł',
  CHF: 'Fr',
};

export const ALL_CURRENCIES = Object.keys(RATES) as CurrencyCode[];

export function convert(amount: number, from: CurrencyCode, to: CurrencyCode): number {
  if (from === to) return amount;
  return (amount / RATES[from]) * RATES[to];
}

export function fmt(amount: number, currency: CurrencyCode, showSign = false): string {
  const sym = CURRENCY_SYMBOLS[currency];
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('en', {
    minimumFractionDigits: currency === 'JPY' ? 0 : 2,
    maximumFractionDigits: currency === 'JPY' ? 0 : 2,
  });
  const sign = showSign && amount > 0 ? '+' : amount < 0 ? '−' : '';
  return `${sign}${sym}${formatted}`;
}
