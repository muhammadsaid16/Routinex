import React from 'react';
import { Habit, HabitEntry, ConsistencyStats } from '../types';
import { Cell } from '../components/Cell';
import { resolveCellState, getTodayString, formatDateToISO, getDayOfWeek } from '../storage';
import { BarChart3, TrendingUp, AlertTriangle, Trophy, ChevronRight } from 'lucide-react';
import { calculatePlayerStats } from '../milestones';

interface ProgressViewProps {
  habits: Habit[];
  entries: HabitEntry[];
  stats: ConsistencyStats;
  onToggleEntry: (habitId: string, date: string) => void;
  onNavigateToMilestones?: () => void;
  myDeviceId?: string | null;
  peerDeviceId?: string | null;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  habits,
  entries,
  stats,
  onToggleEntry,
  onNavigateToMilestones,
  myDeviceId = null,
  peerDeviceId = null,
}) => {
  const playerStats = calculatePlayerStats(habits, entries, stats);
  const todayStr = getTodayString();
  const activeHabits = habits.filter((h) => !h.archived);

  // Generate last 16 weeks (112 days) for the matrix grid
  const daysTotal = 112;
  const datesMatrix: string[] = [];
  const today = new Date();

  // Find the most recent Sunday to align the grid nicely by weeks
  for (let i = daysTotal - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    datesMatrix.push(formatDateToISO(d));
  }

  // Calculate day-of-week breakdown stats
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayOfWeekCounts = [1, 2, 3, 4, 5, 6, 7].map((dow) => {
    let completed = 0;
    let scheduled = 0;

    datesMatrix.forEach((dateStr) => {
      if (getDayOfWeek(dateStr) === dow) {
        activeHabits.forEach((habit) => {
          if (habit.scheduleDays.includes(dow as any)) {
            scheduled++;
            if (entries.some((e) => e.habitId === habit.id && e.date === dateStr && e.completed)) {
              completed++;
            }
          }
        });
      }
    });

    const rate = scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0;
    return { dow, name: dayNames[dow - 1], completed, scheduled, rate };
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-ob-line pb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ob-text">
          Progress & Consistency
        </h1>
        <p className="text-xs text-ob-dim mt-1">
          A high-density historical view of what you did, what you missed, and where you stay consistent.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-ob-line bg-ob-s1 p-5 space-y-1">
          <div className="text-xs uppercase tracking-wider text-ob-dim font-medium">Overall Rate</div>
          <div className="text-3xl font-bold text-ob-gold">{stats.percentage}%</div>
          <div className="text-xs text-ob-dim">
            {stats.completed} of {stats.scheduled} scheduled habits completed.
          </div>
        </div>

        <div className="rounded-xl border border-ob-line bg-ob-s1 p-5 space-y-1">
          <div className="text-xs uppercase tracking-wider text-ob-dim font-medium flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-ob-gold" />
            <span>Strongest Day</span>
          </div>
          <div className="text-3xl font-bold text-ob-text">{stats.bestDay}</div>
          <div className="text-xs text-ob-dim">
            {stats.bestDay && stats.bestDay !== '—'
              ? 'Your highest consistency rate of the week.'
              : 'Not enough on the record to name a peak day yet.'}
          </div>
        </div>

        <div className="rounded-xl border border-ob-line bg-ob-s1 p-5 space-y-1">
          <div className="text-xs uppercase tracking-wider text-ob-dim font-medium flex items-center gap-1.5 text-ob-danger">
            <AlertTriangle className="w-3.5 h-3.5 text-ob-danger" />
            <span>Vulnerability Day</span>
          </div>
          <div className="text-3xl font-bold text-ob-text">{stats.worstDay}</div>
          <div className="text-xs text-ob-dim">
            {stats.worstDay && stats.worstDay !== '—' && stats.worstDay !== 'None'
              ? 'Spot the day that slips and prepare safeguards.'
              : stats.worstDay === 'None'
              ? 'No single day stands out, several sit at the same level.'
              : 'Log more completions to find the day that slips.'}
          </div>
        </div>
      </div>

      {/* Milestones Teaser Card */}
      {onNavigateToMilestones && (
        <div
          onClick={onNavigateToMilestones}
          className="rounded-xl border border-ob-gold/30 bg-ob-gold/10 hover:bg-ob-gold/15 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-all shadow-sm group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-ob-gold text-ob-on-gold flex items-center justify-center font-bold shadow-sm group-hover:scale-105 transition-transform">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider font-semibold text-ob-gold">
                Discipline Rank
              </div>
              <div className="text-sm font-bold text-ob-text flex items-center gap-2">
                <span>Level {playerStats.level}: {playerStats.title}</span>
                <span className="text-xs font-normal text-ob-dim">({playerStats.totalXp} XP)</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-ob-gold group-hover:translate-x-0.5 transition-transform">
            <span>Explore Your Rank</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* Habit Matrix Grid */}
      <div className="rounded-xl border border-ob-line bg-ob-sidebar p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ob-line pb-4">
          <div>
            <h2 className="text-base font-semibold text-ob-text">Historical Habit Matrix</h2>
            <p className="text-xs text-ob-dim">16-week dense consistency record</p>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-ob-dim font-medium">
            <div className="flex items-center gap-1.5">
              <Cell state="done" size="micro" />
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Cell state="pending" size="micro" />
              <span>Due today</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Cell state="missed" size="micro" />
              <span>Missed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Cell state="future" size="micro" />
              <span>Upcoming</span>
            </div>
          </div>
        </div>

        {/* Matrix rows per habit */}
        <div className="space-y-5 overflow-x-auto pb-4">
          {activeHabits.map((habit) => (
            <div key={habit.id} className="min-w-[700px] flex items-center gap-4">
              <div className="w-[180px] shrink-0 text-sm font-medium text-ob-text truncate">
                {habit.title}
              </div>

              {/* Grid of micro-cells */}
              <div className="flex items-center gap-1">
                {datesMatrix.map((dateStr) => {
                  const state = resolveCellState(habit, dateStr, entries, todayStr, myDeviceId, peerDeviceId);
                  return (
                    <Cell
                      key={dateStr}
                      state={state}
                      size="micro"
                      onClick={() => onToggleEntry(habit.id, dateStr)}
                      title={`${habit.title} on ${dateStr}: ${state}`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Day of Week Consistency Analysis ("Spot the days that slip") */}
      <div className="rounded-xl border border-ob-line bg-ob-sidebar p-6 space-y-5">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-ob-gold" />
          <h2 className="text-base font-semibold text-ob-text">Day-of-Week Consistency</h2>
        </div>
        <p className="text-xs text-ob-dim -mt-2">
          Compare your execution rate across days of the week to pinpoint systemic weekend or midweek slumps.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-7 gap-3">
          {dayOfWeekCounts.map((item) => {
            const hasData = item.scheduled > 0 && stats.completed > 0;
            const isWorst = hasData && stats.worstDay !== '—' && stats.worstDay !== 'None' && item.name === stats.worstDay && stats.bestDay !== stats.worstDay;
            const isBest = hasData && stats.bestDay !== '—' && stats.bestDay !== 'None' && item.name === stats.bestDay;

            return (
              <div
                key={item.dow}
                className={`rounded-lg border p-3 flex flex-col justify-between transition-colors ${
                  item.dow === 7 ? 'col-span-2 sm:col-span-1' : ''
                } ${
                  isWorst
                    ? 'border-ob-danger/40 bg-ob-danger/5'
                    : isBest
                    ? 'border-ob-gold/40 bg-ob-gold/5'
                    : 'border-ob-line bg-ob-s1'
                }`}
              >
              <div className="text-xs font-semibold text-ob-dim flex items-center justify-between">
                <span>{item.name}</span>
                <span className="text-[10px] font-mono text-ob-muted">
                  {item.completed}/{item.scheduled}
                </span>
              </div>
              <div className="text-2xl font-bold text-ob-text my-2">{item.rate}%</div>
              <div className="w-full bg-ob-track h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    item.rate < 70 ? 'bg-ob-danger' : 'bg-ob-gold'
                  }`}
                  style={{ width: `${item.rate}%` }}
                />
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
};
