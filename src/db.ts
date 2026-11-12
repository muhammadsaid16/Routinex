import Dexie, { type Table } from 'dexie';
import { Habit, HabitEntry } from './types';

export interface AppSetting {
  key: string;
  value: any;
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

  constructor() {
    super('RoutinixDB');
    this.version(1).stores({
      habits: 'id, createdAt, archived',
      entries: '[habitId+date], habitId, date, completed',
      settings: 'key',
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
