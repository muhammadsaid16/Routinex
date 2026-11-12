import React, { useState } from 'react';
import { Zap, Trophy, Lock, Check, TrendingUp, ChevronRight } from 'lucide-react';
import { Habit, HabitEntry, ConsistencyStats } from '../types';
import { calculatePlayerStats, RANKS } from '../milestones';
import { sound } from '../audio';

interface MilestonesViewProps {
  habits: Habit[];
  entries: HabitEntry[];
  stats: ConsistencyStats;
  onNavigateToHabits?: () => void;
}

export const MilestonesView: React.FC<MilestonesViewProps> = ({
  habits,
  entries,
  stats,
  onNavigateToHabits,
}) => {
  const playerStats = calculatePlayerStats(habits, entries, stats);
  const [showAllRanks, setShowAllRanks] = useState(false);

  const xpProgressRange = playerStats.nextLevelXp - playerStats.prevLevelXp;
  const xpCurrentInRange = playerStats.totalXp - playerStats.prevLevelXp;
  const levelPercentage = xpProgressRange > 0
    ? Math.min(100, Math.round((xpCurrentInRange / xpProgressRange) * 100))
    : 100;

  const visibleRanks = showAllRanks ? RANKS : RANKS.filter((rank) => rank.level <= playerStats.level + 1);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="border-b border-ob-line pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-ob-gold text-xs font-semibold uppercase tracking-wider mb-1">
            <Trophy className="w-3.5 h-3.5" />
            <span>Operator Rank</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ob-text">
            Discipline Progression
          </h1>
          <p className="text-xs text-ob-dim mt-1">
            The rank follows the record. Finished habits, the current streak and the consistency
            rate turn into points.
          </p>
        </div>

        {/* Level & Rank Badge */}
        <div className="rounded-xl bg-ob-gold/10 px-4 py-3 flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-lg bg-ob-gold text-ob-on-gold flex items-center justify-center font-black text-sm shadow-sm">
            L{playerStats.level}
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider font-semibold text-ob-gold">
              Current Rank
            </div>
            <div className="text-xs font-bold text-ob-text">
              {playerStats.title}
            </div>
          </div>
        </div>
      </div>

      {/* Operator Level Progress Banner */}
      <div className="rounded-2xl bg-ob-sidebar p-6 space-y-4 shadow-sm border border-ob-line">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-xs uppercase tracking-wider text-ob-dim font-medium">
              Discipline Progression
            </div>
            <div className="text-xl font-bold text-ob-text flex items-center gap-2 mt-0.5">
              <span>Level {playerStats.level}: {playerStats.title}</span>
              <span className="text-xs font-normal text-ob-gold font-mono">({playerStats.totalXp} XP)</span>
            </div>
          </div>

          <div className="text-xs font-medium text-ob-dim sm:text-right">
            <span>{playerStats.completedCount} habits on the record</span>
            <span className="text-ob-gold font-semibold ml-2">({playerStats.consistency}% consistent)</span>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full bg-ob-track h-2.5 rounded-full overflow-hidden p-0.5">
            {playerStats.totalXp > 0 && (
              <div
                className="bg-ob-gold h-full rounded-full transition-all duration-700 shadow-sm"
                style={{ width: `${Math.max(2, levelPercentage)}%` }}
              />
            )}
          </div>
          <div className="flex justify-between items-center text-[10px] text-ob-muted font-mono">
            <span>{playerStats.totalXp} XP</span>
            <span>Next Rank: Level {playerStats.level + 1} ({playerStats.nextLevelXp} XP)</span>
          </div>
        </div>
      </div>

      {/* Where the points come from */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {playerStats.breakdown.map((source) => (
          <div key={source.label} className="rounded-2xl bg-ob-sidebar border border-ob-line p-5 shadow-sm">
            <div className="flex items-center gap-2 text-ob-gold mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">{source.label}</span>
            </div>
            <div className="text-2xl font-bold text-ob-text font-mono">+{source.xp}</div>
            <p className="text-[11px] text-ob-dim mt-1 leading-relaxed">{source.detail}</p>
          </div>
        ))}
      </div>

      {/* Rank ladder */}
      <div className="rounded-2xl bg-ob-sidebar border border-ob-line p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-ob-text">The Ladder</h2>
            <p className="text-xs text-ob-dim mt-0.5">
              Five ranks. The next one needs {Math.max(0, playerStats.nextLevelXp - playerStats.totalXp)} more
              points.
            </p>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              setShowAllRanks((prev) => !prev);
            }}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-ob-line bg-ob-s1 text-ob-dim hover:text-ob-gold hover:border-ob-gold transition-colors shrink-0"
          >
            {showAllRanks ? 'Show less' : 'Show all'}
          </button>
        </div>

        <div className="space-y-2">
          {visibleRanks.map((rank) => {
            const reached = playerStats.totalXp >= rank.xp;
            const isCurrent = rank.level === playerStats.level;
            return (
              <div
                key={rank.level}
                className={`flex items-center gap-4 rounded-xl border px-4 py-3 transition-colors ${
                  isCurrent
                    ? 'border-ob-gold/50 bg-ob-gold/10'
                    : reached
                    ? 'border-ob-line bg-ob-s1'
                    : 'border-ob-line bg-ob-s1/60'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                    isCurrent
                      ? 'bg-ob-gold text-ob-on-gold'
                      : reached
                      ? 'bg-ob-raised text-ob-gold'
                      : 'bg-ob-raised text-ob-muted'
                  }`}
                >
                  {reached ? <Check className="w-4 h-4" /> : rank.level}
                </div>

                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold truncate ${reached ? 'text-ob-text' : 'text-ob-dim'}`}>
                    {rank.title}
                  </div>
                  <div className="text-[11px] text-ob-dim font-mono">{rank.xp} XP</div>
                </div>

                {isCurrent && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider bg-ob-gold text-ob-on-gold shrink-0">
                    You
                  </span>
                )}
                {!reached && !isCurrent && (
                  <Lock className="w-3.5 h-3.5 text-ob-muted shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {playerStats.level < RANKS.length && onNavigateToHabits && (
          <button
            onClick={() => {
              sound.playClick();
              onNavigateToHabits();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-ob-gold text-ob-on-gold text-xs font-bold hover:bg-ob-gold-bright transition-colors flex items-center justify-center gap-2"
          >
            <span>Keep the record going</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
