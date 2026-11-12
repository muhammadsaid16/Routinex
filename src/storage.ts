import { Habit, HabitEntry, CellState, ConsistencyStats } from './types';
import { db, requestPersistentStorage } from './db';
import { syncManager } from './sync/syncManager';

const HABITS_KEY = 'routinix_habits_v1';
const ENTRIES_KEY = 'routinix_entries_v1';
const LEGACY_HABITS_KEY = 'apex_habits_v1';
const LEGACY_ENTRIES_KEY = 'apex_entries_v1';

export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDayOfWeek(dateString: string): 1 | 2 | 3 | 4 | 5 | 6 | 7 {
  const [y, m, d] = dateString.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const jsDay = date.getDay();
  return jsDay === 0 ? 7 : (jsDay as any);
}

export const DEFAULT_HABITS: Habit[] = [
  {
    id: 'h-1',
    title: 'Wake up at 06:00',
    description: 'Out of bed without hitting snooze',
    scheduleDays: [1, 2, 3, 4, 5, 6, 7],
    createdAt: '2026-10-01T00:00:00Z',
  },
  {
    id: 'h-2',
    title: 'Meditation',
    description: 'Mindfulness breathing',
    scheduleDays: [1, 2, 3, 4, 5, 6, 7],
    createdAt: '2026-10-01T00:00:00Z',
    targetValue: 15,
    unit: 'mins',
  },
  {
    id: 'h-3',
    title: 'Gym & Movement',
    description: 'Strength or mobility workout',
    scheduleDays: [1, 2, 4, 5, 6],
    createdAt: '2026-10-01T00:00:00Z',
    targetValue: 45,
    unit: 'mins',
  },
  {
    id: 'h-4',
    title: 'Deep work',
    description: 'Uninterrupted focus session',
    scheduleDays: [1, 2, 3, 4, 5],
    createdAt: '2026-10-01T00:00:00Z',
    targetValue: 90,
    unit: 'mins',
  },
  {
    id: 'h-5',
    title: 'Read non-fiction',
    description: 'Literature or technical book',
    scheduleDays: [1, 2, 3, 4, 5, 6, 7],
    createdAt: '2026-10-01T00:00:00Z',
    targetValue: 10,
    unit: 'pages',
  },
  {
    id: 'h-6',
    title: 'No sugar',
    description: 'Zero processed sugars or soda',
    scheduleDays: [1, 2, 3, 4, 5, 6, 7],
    createdAt: '2026-10-01T00:00:00Z',
  },
];

function saveHabitsToLocalStorage(habits: Habit[]) {
  try {
    localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
  } catch (e) {
    console.error('LocalStorage write error:', e);
  }
}

function saveEntriesToLocalStorage(entries: HabitEntry[]) {
  try {
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
  } catch (e) {
    console.error('LocalStorage write error:', e);
  }
}

/**
 * Synchronous initial data for instantaneous first paint
 */
export function getInitialData(): { habits: Habit[]; entries: HabitEntry[] } {
  try {
    const rawH = localStorage.getItem(HABITS_KEY) ?? localStorage.getItem(LEGACY_HABITS_KEY);
    const rawE = localStorage.getItem(ENTRIES_KEY) ?? localStorage.getItem(LEGACY_ENTRIES_KEY);

    if (rawH !== null && rawE !== null) {
      return {
        habits: JSON.parse(rawH),
        entries: JSON.parse(rawE),
      };
    }
  } catch (e) {
    console.error('Failed to read from localStorage', e);
  }

  // Clean initial slate
  saveHabitsToLocalStorage([]);
  saveEntriesToLocalStorage([]);
  return { habits: [], entries: [] };
}

/**
 * Asynchronous Dexie IndexedDB initialization:
 * 1. Requests persistent storage on mobile devices/browsers.
 * 2. Migrates any existing localStorage data to Dexie if Dexie is empty.
 * 3. Returns authoritative data from Dexie.
 */
export async function initDexieStorage(): Promise<{ habits: Habit[]; entries: HabitEntry[] }> {
  await requestPersistentStorage();

  try {
    const dbHabits = await db.habits.toArray();
    const dbEntries = await db.entries.toArray();

    // If Dexie already has records, return them as authoritative
    if (dbHabits.length > 0 || dbEntries.length > 0) {
      saveHabitsToLocalStorage(dbHabits);
      saveEntriesToLocalStorage(dbEntries);
      return { habits: dbHabits, entries: dbEntries };
    }

    // If Dexie is empty, check if we need to migrate from localStorage
    const localData = getInitialData();
    if (localData.habits.length > 0 || localData.entries.length > 0) {
      await db.transaction('rw', db.habits, db.entries, async () => {
        if (localData.habits.length > 0) {
          await db.habits.bulkPut(localData.habits);
        }
        if (localData.entries.length > 0) {
          await db.entries.bulkPut(localData.entries);
        }
      });
      return localData;
    }
  } catch (err) {
    console.error('Dexie initialization error:', err);
  }

  return getInitialData();
}

export function seedSampleData(): { habits: Habit[]; entries: HabitEntry[] } {
  // The starter habits are stamped now, so they are newer than any delete
  // that the paired device sent earlier for the same habit id.
  const seeded: Habit[] = DEFAULT_HABITS.map((habit) => ({
    ...habit,
    updatedAt: Date.now(),
    updatedBy: syncManager.getDeviceId(),
  }));

  saveHabitsToLocalStorage(seeded);
  saveEntriesToLocalStorage([]);
  try {
    localStorage.removeItem(LEGACY_HABITS_KEY);
    localStorage.removeItem(LEGACY_ENTRIES_KEY);
  } catch {}

  db.transaction('rw', db.habits, db.entries, async () => {
    await db.habits.clear();
    await db.habits.bulkPut(seeded);
    await db.entries.clear();
  }).catch((err) => console.error('Failed to seed starter habits in Dexie:', err));

  void syncManager.recordLocal('habits', seeded);
  void syncManager.recordLocal('entries', []);

  return { habits: seeded, entries: [] };
}

export function clearAllData(): { habits: Habit[]; entries: HabitEntry[] } {
  saveHabitsToLocalStorage([]);
  saveEntriesToLocalStorage([]);
  try {
    localStorage.removeItem(LEGACY_HABITS_KEY);
    localStorage.removeItem(LEGACY_ENTRIES_KEY);
  } catch {}

  db.transaction('rw', db.habits, db.entries, async () => {
    await db.habits.clear();
    await db.entries.clear();
  }).catch((err) => console.error('Failed to clear Dexie data:', err));

  void syncManager.recordLocal('habits', []);
  void syncManager.recordLocal('entries', []);

  return { habits: [], entries: [] };
}

export function saveHabits(habits: Habit[]) {
  saveHabitsToLocalStorage(habits);

  // Upsert only. Records that the user removed are deleted by the sync layer,
  // so a record that arrives from a paired device is never wiped by a stale array.
  db.transaction('rw', db.habits, async () => {
    if (habits.length > 0) {
      await db.habits.bulkPut(habits);
    }
  }).catch((err) => console.error('Failed to save habits to Dexie:', err));

  // Device sync: stamp the changed habits and push them to the paired device.
  void syncManager.recordLocal('habits', habits);
}

export function saveEntries(entries: HabitEntry[]) {
  saveEntriesToLocalStorage(entries);

  db.transaction('rw', db.entries, async () => {
    if (entries.length > 0) {
      await db.entries.bulkPut(entries);
    }
  }).catch((err) => console.error('Failed to save entries to Dexie:', err));

  // Device sync: stamp the changed entries and push them to the paired device.
  void syncManager.recordLocal('entries', entries);
}

/**
 * Reads the authoritative state back out of Dexie.
 * Used after a paired device sends new records.
 */
export async function loadFromDexie(): Promise<{ habits: Habit[]; entries: HabitEntry[] }> {
  try {
    const habits = await db.habits.toArray();
    const entries = await db.entries.toArray();
    saveHabitsToLocalStorage(habits);
    saveEntriesToLocalStorage(entries);
    return { habits, entries };
  } catch (err) {
    console.error('Failed to read from Dexie:', err);
    return getInitialData();
  }
}

export async function exportBackupJSON(): Promise<string> {
  let habits: Habit[] = [];
  let entries: HabitEntry[] = [];
  let accounts: any[] = [];
  let transactions: any[] = [];
  let budgets: any[] = [];

  try {
    habits = await db.habits.toArray();
    entries = await db.entries.toArray();
    accounts = await db.accounts.toArray();
    transactions = await db.transactions.toArray();
    budgets = await db.budgets.toArray();
  } catch {
    habits = JSON.parse(localStorage.getItem(HABITS_KEY) || '[]');
    entries = JSON.parse(localStorage.getItem(ENTRIES_KEY) || '[]');
  }

  const backup = {
    version: 3,
    database: 'dexie_routinix',
    exportedAt: new Date().toISOString(),
    habits,
    entries,
    accounts,
    transactions,
    budgets,
  };
  return JSON.stringify(backup, null, 2);
}

export function importBackupJSON(jsonString: string): { habits: Habit[]; entries: HabitEntry[] } {
  const parsed = JSON.parse(jsonString);
  if (!parsed.habits || !Array.isArray(parsed.habits)) {
    throw new Error('Invalid backup file format: missing habits array');
  }
  const habits = parsed.habits;
  const entries = Array.isArray(parsed.entries) ? parsed.entries : [];
  const accounts = Array.isArray(parsed.accounts) ? parsed.accounts : [];
  const transactions = Array.isArray(parsed.transactions) ? parsed.transactions : [];
  const budgets = Array.isArray(parsed.budgets) ? parsed.budgets : [];

  saveHabits(habits);
  saveEntries(entries);

  if (accounts.length > 0) {
    db.accounts.bulkPut(accounts).catch(() => {});
    void syncManager.recordLocal('accounts', accounts);
  }
  if (transactions.length > 0) {
    db.transactions.bulkPut(transactions).catch(() => {});
    void syncManager.recordLocal('transactions', transactions);
  }
  if (budgets.length > 0) {
    db.budgets.bulkPut(budgets).catch(() => {});
    void syncManager.recordLocal('budgets', budgets);
  }

  return { habits, entries };
}

export function resolveCellState(
  habit: Habit,
  dateStr: string,
  entries: HabitEntry[],
  todayStr: string
): CellState {
  const dow = getDayOfWeek(dateStr);
  const isScheduled = habit.scheduleDays.includes(dow);

  if (!isScheduled) {
    return 'unscheduled';
  }

  const entry = entries.find(e => e.habitId === habit.id && e.date === dateStr);
  const isDone = Boolean(entry?.completed);

  if (isDone) {
    return 'done';
  }

  if (dateStr > todayStr) {
    return 'future';
  }

  if (dateStr === todayStr) {
    return 'pending';
  }

  return 'missed';
}

export function calculateStats(
  habits: Habit[],
  entries: HabitEntry[],
  daysCount = 30
): ConsistencyStats {
  const today = new Date();
  const todayStr = getTodayString();
  let completed = 0;
  let scheduled = 0;

  const dayOfWeekStats: Record<number, { completed: number; scheduled: number }> = {
    1: { completed: 0, scheduled: 0 },
    2: { completed: 0, scheduled: 0 },
    3: { completed: 0, scheduled: 0 },
    4: { completed: 0, scheduled: 0 },
    5: { completed: 0, scheduled: 0 },
    6: { completed: 0, scheduled: 0 },
    7: { completed: 0, scheduled: 0 },
  };

  for (let i = daysCount; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = formatDateToISO(d);
    const dow = getDayOfWeek(dateStr);

    habits.forEach(habit => {
      if (habit.archived) return;
      const isSched = habit.scheduleDays.includes(dow);
      if (!isSched) return;

      scheduled++;
      dayOfWeekStats[dow].scheduled++;

      const isDone = entries.some(e => e.habitId === habit.id && e.date === dateStr && e.completed);
      if (isDone) {
        completed++;
        dayOfWeekStats[dow].completed++;
      }
    });
  }

  const dayNames = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  let bestDay = '—';
  let worstDay = '—';

  if (completed > 0) {
    let bestRate = -1;
    let worstRate = 2;

    for (let d = 1; d <= 7; d++) {
      const stat = dayOfWeekStats[d];
      if (stat.scheduled > 0) {
        const rate = stat.completed / stat.scheduled;
        if (rate > bestRate) {
          bestRate = rate;
          bestDay = dayNames[d];
        }
        if (rate < worstRate) {
          worstRate = rate;
          worstDay = dayNames[d];
        }
      }
    }

    if (worstRate === bestRate || worstRate === 1) {
      worstDay = 'None';
    }
  }

  let currentStreak = 0;
  for (let i = 0; i < 60; i++) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = formatDateToISO(d);
    const dow = getDayOfWeek(dateStr);

    const scheduledToday = habits.filter(h => !h.archived && h.scheduleDays.includes(dow));
    if (scheduledToday.length === 0) continue;

    const completedToday = scheduledToday.filter(h =>
      entries.some(e => e.habitId === h.id && e.date === dateStr && e.completed)
    );

    if (dateStr === todayStr) {
      if (completedToday.length > 0) {
        currentStreak++;
      }
      continue;
    }

    if (completedToday.length >= Math.ceil(scheduledToday.length * 0.7)) {
      currentStreak++;
    } else {
      break;
    }
  }

  const percentage = scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0;

  return {
    completed,
    scheduled,
    percentage,
    currentStreak,
    bestDay,
    worstDay,
  };
}

const USER_NAME_KEY = 'routinix_user_name';

export function getSavedUserName(): string {
  try {
    const saved = localStorage.getItem(USER_NAME_KEY);
    if (saved && saved.trim()) return saved.trim();
  } catch (e) {}
  return 'Operator';
}

export function saveUserName(name: string) {
  try {
    const trimmed = name.trim();
    localStorage.setItem(USER_NAME_KEY, trimmed);
    db.settings.put({ key: 'userName', value: trimmed }).catch(() => {});
    void syncManager.recordSetting('userName', trimmed);
  } catch (e) {}
}

export function getInitials(name: string): string {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'OP';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
