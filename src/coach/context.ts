import { Habit, HabitEntry, ConsistencyStats, DayOfWeek } from '../types';
import { MoneyAccount, MoneyBudget, MoneyTransaction } from '../money/types';
import { CoachContextLevel } from './settings';
import { getCategory } from '../money/types';

/**
 * The context pack.
 *
 * It is the only thing that leaves the device when the user asks the coach a
 * question, so it has to be small, readable and honest about what it holds.
 */
export interface CoachContext {
  level: CoachContextLevel;
  generatedAt: string;
  profile: {
    name?: string;
    daysOnRecord: number;
    totalCompletions: number;
    currentStreak: number;
    consistency30d: number;
    strongestDay: string;
    weakestDay: string;
    activeHabits: number;
  };
  habits: {
    title: string;
    schedule: string;
    target?: string;
    done7: number;
    due7: number;
    rate7: number;
    lastDone?: string;
    missedLast3: number;
  }[];
  money?: {
    month: string;
    income: number;
    spent: number;
    net: number;
    topCategories: { category: string; spent: number }[];
    budgets: { category: string; limit: number; spent: number }[];
    habitCost: { habit: string; spent: number; sessions: number; perSession: number }[];
  };
  recentDays?: { date: string; done: number; due: number; note?: string }[];
}

const DAY_NAMES = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function iso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

function dayOfWeek(date: string): DayOfWeek {
  const [y, m, d] = date.split('-').map(Number);
  const jsDay = new Date(y, m - 1, d).getDay();
  return (jsDay === 0 ? 7 : jsDay) as DayOfWeek;
}

/**
 * Builds the pack the coach reads.
 * The level decides how much history travels with the question.
 */
export function buildCoachContext(input: {
  level: CoachContextLevel;
  userName?: string;
  habits: Habit[];
  entries: HabitEntry[];
  stats: ConsistencyStats;
  money?: { accounts: MoneyAccount[]; transactions: MoneyTransaction[]; budgets: MoneyBudget[] };
  today?: string;
}): CoachContext {
  const { level, habits, entries, stats } = input;
  const today = input.today || iso(new Date());
  const active = habits.filter((h) => !h.archived);

  const daysOnRecord = new Set(entries.map((e) => e.date)).size;
  const totalCompletions = entries.filter((e) => e.completed).length;

  const habitRows = active.map((habit) => {
    let done7 = 0;
    let due7 = 0;
    let missedLast3 = 0;
    let lastDone: string | undefined;

    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const date = iso(d);
      if (!habit.scheduleDays.includes(dayOfWeek(date))) continue;
      due7++;
      const entry = entries.find((e) => e.habitId === habit.id && e.date === date);
      if (entry?.completed) {
        done7++;
        lastDone = date;
      }
    }

    for (let i = 1; i <= 3; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const date = iso(d);
      if (!habit.scheduleDays.includes(dayOfWeek(date))) continue;
      const entry = entries.find((e) => e.habitId === habit.id && e.date === date);
      if (!entry?.completed) missedLast3++;
    }

    return {
      title: habit.title,
      schedule: habit.scheduleDays.map((d) => DAY_NAMES[d]).join(','),
      target: habit.targetValue ? `${habit.targetValue} ${habit.unit || ''}`.trim() : undefined,
      done7,
      due7,
      rate7: due7 > 0 ? Math.round((done7 / due7) * 100) : 0,
      lastDone,
      missedLast3,
    };
  });

  const context: CoachContext = {
    level,
    generatedAt: new Date().toISOString(),
    profile: {
      name: input.userName,
      daysOnRecord,
      totalCompletions,
      currentStreak: stats.currentStreak,
      consistency30d: stats.percentage,
      strongestDay: stats.bestDay,
      weakestDay: stats.worstDay,
      activeHabits: active.length,
    },
    habits: habitRows,
  };

  if (input.money && level !== 'summary') {
    const { transactions, budgets } = input.money;
    const month = today.slice(0, 7);
    const inMonth = transactions.filter((t) => t.date.startsWith(month));

    const categoryTotals = new Map<string, number>();
    inMonth
      .filter((t) => t.amount < 0)
      .forEach((t) => {
        categoryTotals.set(t.category, (categoryTotals.get(t.category) || 0) + Math.abs(t.amount));
      });

    context.money = {
      month,
      income: inMonth.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0),
      spent: inMonth.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0),
      net: inMonth.reduce((s, t) => s + t.amount, 0),
      topCategories: Array.from(categoryTotals.entries())
        .map(([category, spent]) => ({ category: getCategory(category).label, spent }))
        .sort((a, b) => b.spent - a.spent)
        .slice(0, 5),
      budgets: budgets
        .filter((b) => b.month === month)
        .map((b) => {
          const spent = inMonth
            .filter((t) => t.category === b.category && t.amount < 0)
            .reduce((s, t) => s + Math.abs(t.amount), 0);
          return { category: getCategory(b.category).label, limit: b.limit, spent };
        }),
      habitCost: [],
    };
  }

  if (level === 'full') {
    const days: CoachContext['recentDays'] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const date = iso(d);
      const dow = dayOfWeek(date);
      let due = 0;
      active.forEach((habit) => {
        if (habit.scheduleDays.includes(dow)) due++;
      });
      const done = entries.filter((e) => e.date === date && e.completed).length;
      const note = entries
        .filter((e) => e.date === date && e.note)
        .map((e) => e.note)
        .join(' | ');
      if (due > 0 || done > 0 || note) {
        days.push({ date, done, due, note: note || undefined });
      }
    }
    context.recentDays = days;
  }

  return context;
}

/**
 * The system prompt.
 * The coach is an operator, not a therapist: it reads the numbers, names the
 * next action and stays short.
 */
export function coachSystemPrompt(context: CoachContext): string {
  const scope =
    context.level === 'summary'
      ? 'You can read the summary of the record only.'
      : context.level === 'days'
      ? 'You can read the summary and the money month.'
      : 'You can read the summary, the money month and the last fourteen days.';

  return [
    'You are the Ledger Coach, an operator who helps one person run their life.',
    'You receive the record of that person as JSON. Read it before you answer.',
    'Use their numbers. Name the specific habit, day, amount or goal you are talking about.',
    'Give one clear next action, then stop. No lists of five things, no motivational filler.',
    'Be direct and low drama. Never invent facts that are not in the record.',
    'If the record is too thin to answer, say what you would need to see.',
    'You are not a therapist and you do not diagnose anything.',
    'Answer in the language of the question.',
    scope,
  ].join(' ');
}

/** The record as text, so the model can read it without knowing JSON. */
export function contextAsText(context: CoachContext): string {
  const lines: string[] = [];

  lines.push('RECORD');
  lines.push(`- days on record: ${context.profile.daysOnRecord}`);
  lines.push(`- completions: ${context.profile.totalCompletions}`);
  lines.push(`- current streak: ${context.profile.currentStreak}`);
  lines.push(`- consistency last 30 days: ${context.profile.consistency30d}%`);
  if (context.profile.strongestDay && context.profile.strongestDay !== '—') {
    lines.push(`- strongest day: ${context.profile.strongestDay}`);
  }
  if (context.profile.weakestDay && context.profile.weakestDay !== '—') {
    lines.push(`- weakest day: ${context.profile.weakestDay}`);
  }
  lines.push(`- active habits: ${context.profile.activeHabits}`);

  lines.push('');
  lines.push('HABITS (last 7 days)');
  context.habits.forEach((habit) => {
    lines.push(
      `- ${habit.title} [${habit.schedule}]${habit.target ? ` target ${habit.target}` : ''}: ${habit.done7}/${habit.due7} (${habit.rate7}%), missed in the last three scheduled days: ${habit.missedLast3}, last done ${habit.lastDone || 'never'}`
    );
  });

  if (context.money) {
    lines.push('');
    lines.push(`MONEY ${context.money.month}`);
    lines.push(`- income: ${context.money.income} cents`);
    lines.push(`- spent: ${context.money.spent} cents`);
    lines.push(`- net: ${context.money.net} cents`);
    if (context.money.topCategories.length) {
      lines.push(
        `- top categories: ${context.money.topCategories
          .map((c) => `${c.category} ${c.spent}`)
          .join(', ')}`
      );
    }
    if (context.money.budgets.length) {
      lines.push(
        `- budgets: ${context.money.budgets
          .map((b) => `${b.category} ${b.spent}/${b.limit}`)
          .join(', ')}`
      );
    }
  }

  if (context.recentDays?.length) {
    lines.push('');
    lines.push('LAST FOURTEEN DAYS');
    context.recentDays.forEach((day) => {
      lines.push(`- ${day.date}: ${day.done}/${day.due}${day.note ? ` note: ${day.note}` : ''}`);
    });
  }

  return lines.join('\n');
}
