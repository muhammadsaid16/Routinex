export type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7; // 1 = Mon, 7 = Sun

export interface Habit {
  id: string;
  title: string;
  description?: string;
  scheduleDays: DayOfWeek[]; // [1, 2, 3, 4, 5] for Mon-Fri
  createdAt: string; // ISO date string
  archived?: boolean;
  // Optional target-based habit (numeric)
  targetValue?: number; // e.g. 20
  unit?: string;        // e.g. 'pages', 'mins', 'L'
  // Shared with the paired device. The day only counts when both devices
  // did the habit on that day.
  shared?: boolean;
  // Device sync stamps (last-write-wins merge between paired devices)
  updatedAt?: number;
  updatedBy?: string;
}

export interface HabitEntry {
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  completedAt?: string;
  currentValue?: number; // for numeric habits (e.g. 15/20)
  note?: string;         // optional micro-journal note ("Why did it slip?" or victory note)
  // The devices that did the habit on that day. A shared habit needs the
  // ids of both devices before the day counts.
  completedBy?: string[];
  // Device sync stamps (last-write-wins merge between paired devices)
  updatedAt?: number;
  updatedBy?: string;
}

export type CellState = 'done' | 'half' | 'pending' | 'missed' | 'future' | 'unscheduled';

export interface ConsistencyStats {
  completed: number;
  scheduled: number;
  percentage: number;
  currentStreak: number;
  bestDay: string;
  worstDay: string;
}
