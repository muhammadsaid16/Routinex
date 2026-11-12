import Dexie, { type Table } from 'dexie';
import { Habit, HabitEntry } from './types';
import { Tombstone } from './sync/types';
import { MoneyAccount, MoneyBudget, MoneyTransaction } from './money/types';

export interface AppSetting {
  key: string;
  value: any;
  updatedAt?: number;
  updatedBy?: string;
}

/**
 * RoutinixDB - High-performance offline-first IndexedDB database powered by Dexie.js
 * Designed for mobile web, PWA, and Capacitor/React Native hybrid wrappers.
 * Removes all 5MB localStorage limits and supports persistent, indexed querying.
 */
export class RoutinixDatabase extends Dexie {
  habits!: Table<Habit, string>;
  entries!: Table<HabitEntry, [string, string]>;
  settings!: Table<AppSetting, string>;
  tombstones!: Table<Tombstone, string>;
  accounts!: Table<MoneyAccount, string>;
  transactions!: Table<MoneyTransaction, string>;
  budgets!: Table<MoneyBudget, string>;

  constructor() {
    super('RoutinixDB');
    this.version(1).stores({
      habits: 'id, createdAt, archived',
      entries: '[habitId+date], habitId, date, completed',
      settings: 'key',
    });
    this.version(2).stores({
      habits: 'id, createdAt, archived',
      entries: '[habitId+date], habitId, date, completed',
      settings: 'key',
      tombstones: 'id, table, updatedAt',
    });
    this.version(3).stores({
      habits: 'id, createdAt, archived',
      entries: '[habitId+date], habitId, date, completed',
      settings: 'key',
      tombstones: 'id, table, updatedAt',
      accounts: 'id, type, archived',
      transactions: 'id, date, accountId, category, habitId',
      budgets: 'id, month, category',
    });
  }
}

export const db = new RoutinixDatabase();

/**
 * Request persistent storage from the browser / mobile webview.
 * Prevents OS from evicting habit logs during low-storage conditions.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persist();
      return isPersisted;
    } catch {
      return false;
    }
  }
  return false;
}
