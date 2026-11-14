import type { Habit, HabitEntry } from './types.ts';

/**
 * Shared habits.
 *
 * A shared habit is done on a day only when both devices did it on that day.
 * Every entry therefore carries the ids of the devices that did it. The ids
 * are merged as a set, so the record that arrives last never removes the
 * other device from the day.
 *
 * The functions here are pure, so the rule can be tested without a browser.
 */

/** The number of devices a shared habit waits for. */
export const SHARED_DEVICE_COUNT = 2;

export type SharedDayState = 'both' | 'mine' | 'theirs' | 'none';

/** The device ids that did the habit on that day. */
export function completedByList(entry?: HabitEntry | null): string[] {
  if (!entry) return [];
  const ids = (entry as any).completedBy;
  if (!Array.isArray(ids)) return [];
  return ids.filter((id) => typeof id === 'string' && id.length > 0);
}

/** Adds a device to the set of devices that did the habit. */
export function withCompletedBy(entry: HabitEntry, deviceId: string): HabitEntry {
  const ids = completedByList(entry);
  if (ids.includes(deviceId)) return entry;
  return { ...entry, completedBy: [...ids, deviceId], completed: true };
}

/** Removes a device from the set of devices that did the habit. */
export function withoutCompletedBy(entry: HabitEntry, deviceId: string): HabitEntry {
  const ids = completedByList(entry).filter((id) => id !== deviceId);
  return { ...entry, completedBy: ids, completed: ids.length > 0 };
}

/**
 * Merges two versions of the same entry.
 *
 * The rest of the record follows the last write wins rule. The set of
 * devices is the union of both sides, so a slow clock on one device cannot
 * throw away the completion of the other device.
 */
export function mergeEntryCompletion(local: any, remote: any): any {
  const ids = Array.from(new Set([...completedByList(local), ...completedByList(remote)]));
  const newer = isNewer(remote, local) ? remote : local;

  return {
    ...newer,
    completed: Boolean(local.completed) || Boolean(remote.completed),
    completedBy: ids.length > 0 ? ids : undefined,
  };
}

/** True when the record was written later than the other one. */
function isNewer(a: any, b: any): boolean {
  const at = a.updatedAt ?? 0;
  const bt = b.updatedAt ?? 0;
  if (at !== bt) return at > bt;
  return String(a.updatedBy ?? '') > String(b.updatedBy ?? '');
}

/**
 * The state of a shared day for this device.
 *
 * Without a paired device there is nobody to wait for, so the day is simply
 * done when this device did it.
 */
export function sharedDayState(
  entry: HabitEntry | undefined | null,
  myDeviceId: string | null,
  peerDeviceId: string | null
): SharedDayState {
  const ids = completedByList(entry);
  if (ids.length === 0) return 'none';

  const mine = myDeviceId ? ids.includes(myDeviceId) : ids.length > 0;
  const theirs = peerDeviceId ? ids.includes(peerDeviceId) : false;

  if (mine && theirs) return 'both';
  if (mine) return 'mine';
  if (theirs) return 'theirs';
  return 'none';
}

/**
 * True when the day counts for a shared habit.
 *
 * With a paired device both devices must have done the habit. Without a
 * paired device the day counts as soon as this device did it.
 */
export function isSharedDayComplete(
  entry: HabitEntry | undefined | null,
  myDeviceId: string | null,
  peerDeviceId: string | null
): boolean {
  if (!entry?.completed) return false;
  if (!peerDeviceId) return true;

  const ids = completedByList(entry);
  return ids.length >= SHARED_DEVICE_COUNT;
}

export interface SharedHabitStats {
  /** Days on which both devices did the habit. */
  sharedDays: number;
  /** Days that were scheduled in the period. */
  scheduledDays: number;
  /** Days on which only one device did the habit. */
  waitingDays: number;
  /** The run of shared days that reaches today. */
  currentStreak: number;
  /** The longest run of shared days in the period. */
  bestStreak: number;
}

/**
 * The record of a shared habit over the last days.
 *
 * The streak only counts the days on which both devices did the habit. A day
 * that only one device did breaks the run, because the promise of the shared
 * habit was not kept.
 */
export function sharedHabitStats(
  habit: Habit,
  entries: HabitEntry[],
  scheduledDates: string[],
  myDeviceId: string | null,
  peerDeviceId: string | null
): SharedHabitStats {
  const byDate = new Map<string, HabitEntry>();
  for (const entry of entries) {
    if (entry.habitId !== habit.id) continue;
    byDate.set(entry.date, entry);
  }

  let sharedDays = 0;
  let waitingDays = 0;
  let currentStreak = 0;
  let bestStreak = 0;
  let run = 0;

  // The dates come from the oldest to the newest day.
  for (const date of scheduledDates) {
    const entry = byDate.get(date);
    if (!entry) continue;

    const state = sharedDayState(entry, myDeviceId, peerDeviceId);
    const complete = isSharedDayComplete(entry, myDeviceId, peerDeviceId);

    if (complete) {
      sharedDays++;
      run++;
      if (run > bestStreak) bestStreak = run;
    } else if (state === 'mine' || state === 'theirs') {
      // One side did it. The day is not a shared day and it breaks the run.
      waitingDays++;
      run = 0;
    }
  }

  // The run of shared days that reaches today. The newest day is still open
  // when nobody did the habit yet, so it does not break the run.
  for (let i = scheduledDates.length - 1; i >= 0; i -= 1) {
    const entry = byDate.get(scheduledDates[i]);
    if (!entry) continue;

    const state = sharedDayState(entry, myDeviceId, peerDeviceId);
    if (!isSharedDayComplete(entry, myDeviceId, peerDeviceId)) {
      if (state === 'none') continue;
      break;
    }
    currentStreak++;
  }

  return {
    sharedDays,
    scheduledDays: scheduledDates.length,
    waitingDays,
    currentStreak,
    bestStreak,
  };
}
