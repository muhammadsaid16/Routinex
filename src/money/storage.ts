import { db } from '../db';
import { syncManager } from '../sync/syncManager';
import { Habit, HabitEntry } from '../types';
import { MoneyAccount, MoneyBudget, MoneyTransaction } from './types';

export interface MoneyData {
  accounts: MoneyAccount[];
  transactions: MoneyTransaction[];
  budgets: MoneyBudget[];
}

export interface MonthSummary {
  month: string;
  income: number;
  spent: number;
  net: number;
  transactionCount: number;
}

export interface BudgetLine {
  category: string;
  limit: number;
  spent: number;
  remaining: number;
  percent: number;
  over: boolean;
}

export interface HabitCost {
  habitId: string;
  title: string;
  spent: number;
  sessions: number;
  perSession: number;
}

export function getMonthString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function loadMoney(): Promise<MoneyData> {
  try {
    const [accounts, transactions, budgets] = await Promise.all([
      db.accounts.toArray(),
      db.transactions.toArray(),
      db.budgets.toArray(),
    ]);
    return { accounts, transactions, budgets };
  } catch (err) {
    console.error('Failed to read the money data:', err);
    return { accounts: [], transactions: [], budgets: [] };
  }
}

/**
 * The accounts, transactions and budgets are written with an upsert.
 * The sync layer deletes the records that disappeared and keeps the tombstones.
 */
export function saveAccounts(accounts: MoneyAccount[]) {
  db.transaction('rw', db.accounts, async () => {
    if (accounts.length > 0) await db.accounts.bulkPut(accounts);
  }).catch((err) => console.error('Failed to save accounts:', err));

  void syncManager.recordLocal('accounts', accounts);
}

export function saveTransactions(transactions: MoneyTransaction[]) {
  db.transaction('rw', db.transactions, async () => {
    if (transactions.length > 0) await db.transactions.bulkPut(transactions);
  }).catch((err) => console.error('Failed to save transactions:', err));

  void syncManager.recordLocal('transactions', transactions);
}

export function saveBudgets(budgets: MoneyBudget[]) {
  db.transaction('rw', db.budgets, async () => {
    if (budgets.length > 0) await db.budgets.bulkPut(budgets);
  }).catch((err) => console.error('Failed to save budgets:', err));

  void syncManager.recordLocal('budgets', budgets);
}

/** The balance of an account: the opening balance plus every movement. */
export function accountBalance(account: MoneyAccount, transactions: MoneyTransaction[]): number {
  return transactions
    .filter((t) => t.accountId === account.id)
    .reduce((sum, t) => sum + t.amount, account.openingBalance);
}

export function calculateMonthSummary(
  transactions: MoneyTransaction[],
  month: string = getMonthString()
): MonthSummary {
  const inMonth = transactions.filter((t) => t.date.startsWith(month));
  const income = inMonth.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const spent = inMonth.filter((t) => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return {
    month,
    income,
    spent,
    net: income - spent,
    transactionCount: inMonth.length,
  };
}

export function calculateBudgetLines(
  transactions: MoneyTransaction[],
  budgets: MoneyBudget[],
  month: string = getMonthString()
): BudgetLine[] {
  return budgets
    .filter((budget) => budget.month === month)
    .map((budget) => {
      const spent = transactions
        .filter((t) => t.date.startsWith(month) && t.category === budget.category && t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const remaining = budget.limit - spent;
      const percent = budget.limit > 0 ? Math.round((spent / budget.limit) * 100) : 0;

      return {
        category: budget.category,
        limit: budget.limit,
        spent,
        remaining,
        percent: Math.min(100, percent),
        over: spent > budget.limit,
      };
    })
    .sort((a, b) => b.percent - a.percent);
}

/**
 * What a habit costs.
 * The spending that is linked to the habit, divided by the sessions that
 * were actually done. This is the point where money meets the record.
 */
export function calculateHabitCost(
  transactions: MoneyTransaction[],
  habits: Habit[],
  entries: HabitEntry[],
  month: string = getMonthString()
): HabitCost[] {
  const linked = transactions.filter((t) => t.habitId && t.date.startsWith(month) && t.amount < 0);
  const habitIds = Array.from(new Set(linked.map((t) => t.habitId as string)));

  return habitIds
    .map((habitId) => {
      const habit = habits.find((h) => h.id === habitId);
      const spent = linked
        .filter((t) => t.habitId === habitId)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const sessions = entries.filter(
        (e) => e.habitId === habitId && e.completed && e.date.startsWith(month)
      ).length;

      return {
        habitId,
        title: habit?.title || 'Unknown habit',
        spent,
        sessions,
        perSession: sessions > 0 ? Math.round(spent / sessions) : spent,
      };
    })
    .sort((a, b) => b.spent - a.spent);
}

/** The spending per category for a month, the largest first. */
export function calculateCategoryTotals(
  transactions: MoneyTransaction[],
  month: string = getMonthString()
): { category: string; spent: number }[] {
  const totals = new Map<string, number>();

  transactions
    .filter((t) => t.date.startsWith(month) && t.amount < 0)
    .forEach((t) => {
      totals.set(t.category, (totals.get(t.category) || 0) + Math.abs(t.amount));
    });

  return Array.from(totals.entries())
    .map(([category, spent]) => ({ category, spent }))
    .sort((a, b) => b.spent - a.spent);
}
