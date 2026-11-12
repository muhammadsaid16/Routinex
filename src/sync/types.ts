import { Habit, HabitEntry } from '../types';

export type SyncTable = 'habits' | 'entries' | 'settings';

export interface SyncStamp {
  /** Epoch milliseconds of the last write. Drives the last-write-wins merge. */
  updatedAt?: number;
  /** Device id of the writer. Breaks ties when two devices write at the same ms. */
  updatedBy?: string;
}

export type SyncedHabit = Habit & SyncStamp;
export type SyncedEntry = HabitEntry & SyncStamp;
export type SyncedSetting = SyncStamp & { key: string; value: any };

export interface Tombstone extends SyncStamp {
  /** `${table}:${key}` */
  id: string;
  table: SyncTable;
  key: string;
}

export type SyncMessage =
  | { t: 'challenge'; nonce: string }
  | { t: 'auth'; proof: string }
  | { t: 'welcome'; deviceName: string; proof: string }
  | {
      t: 'snapshot';
      habits: SyncedHabit[];
      entries: SyncedEntry[];
      settings: SyncedSetting[];
      tombstones: Tombstone[];
    }
  | { t: 'upsert'; table: SyncTable; record: any }
  | { t: 'remove'; table: SyncTable; key: string; updatedAt: number; updatedBy: string }
  | { t: 'ping' }
  | { t: 'pong' };

export type SyncPhase = 'idle' | 'hosting' | 'connecting' | 'connected' | 'error';

export interface SyncState {
  phase: SyncPhase;
  role: 'host' | 'guest' | null;
  /** Pairing code of the active session, ready to type or scan. */
  code: string | null;
  /** Name of the device on the other end. */
  peerName: string | null;
  error: string | null;
  lastSyncAt: number | null;
  changesSent: number;
  changesReceived: number;
  /** True while the peer link is authenticated and usable. */
  linked: boolean;
}

export const SYNCED_SETTINGS = ['userName', 'activeThemeId', 'uiScale'] as const;
export type SyncedSettingKey = (typeof SYNCED_SETTINGS)[number];
