import { syncManager } from '../sync/syncManager';

export type AccountType = 'cash' | 'bank' | 'card';

export interface MoneyAccount {
  id: string;
  name: string;
  type: AccountType;
  /** Balance at the start of the record, in cents. */
  openingBalance: number;
  archived?: boolean;
  updatedAt?: number;
  updatedBy?: string;
}

export interface MoneyTransaction {
  id: string;
  accountId: string;
  /** YYYY-MM-DD */
  date: string;
  /** In cents. A negative amount is money that left, a positive amount is money that came in. */
  amount: number;
  category: string;
  note?: string;
  /** Links the spending to a habit, so the app can show the cost of one session. */
  habitId?: string;
  updatedAt?: number;
  updatedBy?: string;
}

export interface MoneyBudget {
  id: string;
  /** YYYY-MM */
  month: string;
  category: string;
  /** Limit in cents. */
  limit: number;
  updatedAt?: number;
  updatedBy?: string;
}

export interface MoneyCategory {
  id: string;
  label: string;
  /** Tailwind classes for the icon chip. */
  icon: string;
  color: string;
  kind: 'expense' | 'income';
}

export const MONEY_CATEGORIES: MoneyCategory[] = [
  { id: 'housing', label: 'Housing', icon: 'Home', color: 'text-sky-300 bg-sky-500/15', kind: 'expense' },
  { id: 'food', label: 'Food', icon: 'UtensilsCrossed', color: 'text-orange-300 bg-orange-500/15', kind: 'expense' },
  { id: 'transport', label: 'Transport', icon: 'Car', color: 'text-amber-300 bg-amber-500/15', kind: 'expense' },
  { id: 'health', label: 'Health', icon: 'HeartPulse', color: 'text-rose-300 bg-rose-500/15', kind: 'expense' },
  { id: 'fitness', label: 'Fitness', icon: 'Dumbbell', color: 'text-emerald-300 bg-emerald-500/15', kind: 'expense' },
  { id: 'subscriptions', label: 'Subscriptions', icon: 'Repeat', color: 'text-violet-300 bg-violet-500/15', kind: 'expense' },
  { id: 'leisure', label: 'Leisure', icon: 'Gamepad2', color: 'text-cyan-300 bg-cyan-500/15', kind: 'expense' },
  { id: 'shopping', label: 'Shopping', icon: 'ShoppingBag', color: 'text-fuchsia-300 bg-fuchsia-500/15', kind: 'expense' },
  { id: 'education', label: 'Education', icon: 'GraduationCap', color: 'text-blue-300 bg-blue-500/15', kind: 'expense' },
  { id: 'other', label: 'Other', icon: 'Shapes', color: 'text-slate-300 bg-slate-500/15', kind: 'expense' },
  { id: 'income', label: 'Income', icon: 'TrendingUp', color: 'text-emerald-300 bg-emerald-500/15', kind: 'income' },
];

export const CATEGORY_BY_ID: Record<string, MoneyCategory> = MONEY_CATEGORIES.reduce(
  (acc, category) => {
    acc[category.id] = category;
    return acc;
  },
  {} as Record<string, MoneyCategory>
);

export const getCategory = (id: string): MoneyCategory =>
  CATEGORY_BY_ID[id] || CATEGORY_BY_ID.other;

export const CURRENCIES = [
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'GBP', symbol: '£', label: 'Pound' },
  { code: 'EGP', symbol: 'E£', label: 'Egyptian Pound' },
  { code: 'AED', symbol: 'AED', label: 'Dirham' },
  { code: 'SAR', symbol: 'SAR', label: 'Riyal' },
];

export const CURRENCY_KEY = 'routinix_currency';

export function getCurrency(): string {
  try {
    const saved = localStorage.getItem(CURRENCY_KEY);
    if (saved && CURRENCIES.some((c) => c.code === saved)) return saved;
  } catch (e) {}
  return 'EUR';
}

export function setCurrency(code: string) {
  try {
    localStorage.setItem(CURRENCY_KEY, code);
  } catch (e) {}

  // Device sync: the paired device follows the same currency.
  void syncManager.recordSetting('currency', code);
}

/** Formats cents with the symbol of the chosen currency. */
export function formatMoney(cents: number, currency: string = getCurrency()): string {
  const symbol = CURRENCIES.find((c) => c.code === currency)?.symbol || '€';
  const value = Math.abs(cents) / 100;
  const formatted = value.toLocaleString(undefined, {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${cents < 0 ? '-' : ''}${symbol}${formatted}`;
}

/** Formats cents without a symbol, for input fields. */
export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function inputToCents(value: string): number {
  const cleaned = value.replace(/[^\d.,-]/g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  if (Number.isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}
