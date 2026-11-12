import { Habit, HabitEntry, ConsistencyStats } from './types';

export interface RankLevel {
  level: number;
  xp: number;
  title: string;
}

export interface PlayerStats {
  level: number;
  title: string;
  nextTitle: string;
  totalXp: number;
  nextLevelXp: number;
  prevLevelXp: number;
  completedCount: number;
  streak: number;
  consistency: number;
  /** Where the points come from, so the page can explain the rank. */
  breakdown: { label: string; xp: number; detail: string }[];
}

export const RANKS: RankLevel[] = [
  { level: 1, xp: 0, title: 'Novice Operator' },
  { level: 2, xp: 400, title: 'Disciplined Practitioner' },
  { level: 3, xp: 1000, title: 'Ironclad Executor' },
  { level: 4, xp: 2000, title: 'Stoic Sovereign' },
  { level: 5, xp: 3600, title: 'Routinix Grandmaster' },
];

const XP_PER_COMPLETION = 10;
const XP_PER_STREAK_DAY = 20;
const XP_PER_CONSISTENCY_POINT = 5;

/**
 * The rank of the operator.
 * The points come from the work itself: finished habits, the current streak
 * and the consistency rate. No medals, no tiers, only the record.
 */
export function calculatePlayerStats(
  habits: Habit[],
  entries: HabitEntry[],
  stats: ConsistencyStats
): PlayerStats {
  const activeHabits = habits.filter((h) => !h.archived);
  const completedCount = entries.filter((e) => e.completed).length;

  const executionXp = completedCount * XP_PER_COMPLETION;
  const streakXp = stats.currentStreak * XP_PER_STREAK_DAY;
  const consistencyXp = stats.percentage * XP_PER_CONSISTENCY_POINT;

  const totalXp = executionXp + streakXp + consistencyXp;

  let currentLevel = RANKS[0];
  let nextLevel = RANKS[1];

  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (totalXp >= RANKS[i].xp) {
      currentLevel = RANKS[i];
      nextLevel = RANKS[i + 1] || RANKS[i];
      break;
    }
  }

  return {
    level: currentLevel.level,
    title: currentLevel.title,
    nextTitle: nextLevel.title,
    totalXp,
    nextLevelXp: nextLevel.xp,
    prevLevelXp: currentLevel.xp,
    completedCount,
    streak: stats.currentStreak,
    consistency: stats.percentage,
    breakdown: [
      {
        label: 'Finished habits',
        xp: executionXp,
        detail: `${completedCount} of ${activeHabits.length} habits on the record`,
      },
      {
        label: 'Current streak',
        xp: streakXp,
        detail: `${stats.currentStreak} day${stats.currentStreak === 1 ? '' : 's'} unbroken`,
      },
      {
        label: 'Consistency rate',
        xp: consistencyXp,
        detail: `${stats.percentage}% over the last 30 days`,
      },
    ],
  };
}
