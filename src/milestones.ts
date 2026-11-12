import { Habit, HabitEntry, ConsistencyStats } from './types';

export type BadgeCategory = 'all' | 'consistency' | 'volume' | 'stoic' | 'mastery';
export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface MilestoneBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'consistency' | 'volume' | 'stoic' | 'mastery';
  tier: BadgeTier;
  xp: number;
  maxProgress: number;
  currentProgress: number;
  unit?: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface PlayerStats {
  level: number;
  title: string;
  totalXp: number;
  nextLevelXp: number;
  prevLevelXp: number;
  unlockedCount: number;
  totalBadgesCount: number;
}

const TIER_XP: Record<BadgeTier, number> = {
  bronze: 100,
  silver: 250,
  gold: 500,
  platinum: 1000,
};

export function calculateMilestones(
  habits: Habit[],
  entries: HabitEntry[],
  stats: ConsistencyStats
): { badges: MilestoneBadge[]; playerStats: PlayerStats } {
  const activeHabits = habits.filter((h) => !h.archived);
  const totalCompletedEntries = entries.filter((e) => e.completed).length;

  // Minutes logged for deep work / meditation habits
  const timeMinutesLogged = entries.reduce((acc, entry) => {
    if (!entry.completed) return acc;
    const habit = habits.find((h) => h.id === entry.habitId);
    if (habit && habit.unit === 'mins') {
      return acc + (entry.currentValue || habit.targetValue || 0);
    }
    return acc;
  }, 0);

  // Pages logged for reading habits
  const pagesLogged = entries.reduce((acc, entry) => {
    if (!entry.completed) return acc;
    const habit = habits.find((h) => h.id === entry.habitId);
    if (habit && habit.unit === 'pages') {
      return acc + (entry.currentValue || habit.targetValue || 0);
    }
    return acc;
  }, 0);

  // Safeguard recoveries: habit missed on day X, but completed on day X+1
  let safeguardRecoveries = 0;
  activeHabits.forEach((habit) => {
    const habitEntries = entries
      .filter((e) => e.habitId === habit.id)
      .sort((a, b) => a.date.localeCompare(b.date));

    for (let i = 1; i < habitEntries.length; i++) {
      const prev = habitEntries[i - 1];
      const curr = habitEntries[i];
      if (!prev.completed && curr.completed) {
        safeguardRecoveries++;
      }
    }
  });

  const rawBadges: Array<Omit<MilestoneBadge, 'xp' | 'unlocked'>> = [
    {
      id: 'first-step',
      title: 'First Step',
      description: 'Complete your very first scheduled habit and put it on the record.',
      icon: 'Flame',
      category: 'consistency',
      tier: 'bronze',
      maxProgress: 1,
      currentProgress: Math.min(1, totalCompletedEntries),
    },
    {
      id: 'habit-architect',
      title: 'Habit Architect',
      description: 'Build and track a blueprint of at least 5 scheduled habits.',
      icon: 'CheckSquare',
      category: 'volume',
      tier: 'bronze',
      maxProgress: 5,
      currentProgress: Math.min(5, activeHabits.length),
    },
    {
      id: 'ironclad-7',
      title: 'The Ironclad 7',
      description: 'Complete an unbroken 7-day consistency streak without skipping.',
      icon: 'ShieldCheck',
      category: 'consistency',
      tier: 'silver',
      maxProgress: 7,
      currentProgress: Math.min(7, stats.currentStreak),
    },
    {
      id: 'stoic-safeguard',
      title: 'Stoic Safeguard',
      description: 'Successfully bounce back from a missed day and protect your momentum.',
      icon: 'ShieldAlert',
      category: 'stoic',
      tier: 'silver',
      maxProgress: 3,
      currentProgress: Math.min(3, safeguardRecoveries),
    },
    {
      id: 'book-sage',
      title: 'Book Sage',
      description: 'Read and log 50 cumulative pages of technical or literary books.',
      icon: 'BookOpen',
      category: 'mastery',
      tier: 'silver',
      maxProgress: 50,
      currentProgress: Math.min(50, pagesLogged),
      unit: 'pages',
    },
    {
      id: 'century-club',
      title: 'Century Club',
      description: 'Lock in 100 cumulative habit executions across your journey.',
      icon: 'Crown',
      category: 'volume',
      tier: 'gold',
      maxProgress: 100,
      currentProgress: Math.min(100, totalCompletedEntries),
    },
    {
      id: 'deep-work-titan',
      title: 'Deep Work Titan',
      description: 'Log 300+ minutes of high-intensity focus or mindfulness breathing.',
      icon: 'Brain',
      category: 'mastery',
      tier: 'gold',
      maxProgress: 300,
      currentProgress: Math.min(300, timeMinutesLogged),
      unit: 'mins',
    },
    {
      id: 'unstoppable-14',
      title: 'Unstoppable 14',
      description: 'Maintain an unbroken streak of 14 continuous days on the record.',
      icon: 'Zap',
      category: 'consistency',
      tier: 'gold',
      maxProgress: 14,
      currentProgress: Math.min(14, stats.currentStreak),
    },
    {
      id: 'elite-consistency',
      title: 'Elite Consistency',
      description: 'Maintain an overall 30-day consistency score above 80%.',
      icon: 'Trophy',
      category: 'consistency',
      tier: 'platinum',
      maxProgress: 80,
      currentProgress: Math.min(80, stats.percentage),
      unit: '%',
    },
    {
      id: 'double-century',
      title: 'Double Century',
      description: 'Log 200 cumulative habit completions. True mastery of daily rituals.',
      icon: 'Sparkles',
      category: 'volume',
      tier: 'platinum',
      maxProgress: 200,
      currentProgress: Math.min(200, totalCompletedEntries),
    },
  ];

  const badges: MilestoneBadge[] = rawBadges.map((b) => {
    const unlocked = b.currentProgress >= b.maxProgress;
    return {
      ...b,
      xp: TIER_XP[b.tier],
      unlocked,
      unlockedAt: unlocked ? 'Active on Record' : undefined,
    };
  });

  const totalXp = badges.filter((b) => b.unlocked).reduce((sum, b) => sum + b.xp, 0);

  const levels = [
    { level: 1, xp: 0, title: 'Novice Operator' },
    { level: 2, xp: 350, title: 'Disciplined Practitioner' },
    { level: 3, xp: 850, title: 'Ironclad Executor' },
    { level: 4, xp: 1600, title: 'Stoic Sovereign' },
    { level: 5, xp: 2600, title: 'Routinix Grandmaster' },
  ];

  let currentLevel = levels[0];
  let nextLevel = levels[1];

  for (let i = levels.length - 1; i >= 0; i--) {
    if (totalXp >= levels[i].xp) {
      currentLevel = levels[i];
      nextLevel = levels[i + 1] || levels[i];
      break;
    }
  }

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return {
    badges,
    playerStats: {
      level: currentLevel.level,
      title: currentLevel.title,
      totalXp,
      nextLevelXp: nextLevel.xp,
      prevLevelXp: currentLevel.xp,
      unlockedCount,
      totalBadgesCount: badges.length,
    },
  };
}
