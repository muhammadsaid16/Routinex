import React, { useState } from 'react';
import {
  Flame,
  ShieldCheck,
  Zap,
  Crown,
  Sparkles,
  ShieldAlert,
  Brain,
  CheckSquare,
  BookOpen,
  Trophy,
  Lock,
  Check,
  Award,
  X,
} from 'lucide-react';
import { Habit, HabitEntry, ConsistencyStats } from '../types';
import { calculateMilestones, MilestoneBadge, BadgeTier } from '../milestones';
import { sound } from '../audio';

interface MilestonesViewProps {
  habits: Habit[];
  entries: HabitEntry[];
  stats: ConsistencyStats;
  onNavigateToHabits?: () => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Flame,
  ShieldCheck,
  Zap,
  Crown,
  Sparkles,
  ShieldAlert,
  Brain,
  CheckSquare,
  BookOpen,
  Trophy,
};

const TIER_COLORS: Record<BadgeTier, { bg: string; text: string; label: string }> = {
  bronze: {
    bg: 'bg-amber-950/30',
    text: 'text-amber-500',
    label: 'Bronze',
  },
  silver: {
    bg: 'bg-slate-800/40',
    text: 'text-slate-300',
    label: 'Silver',
  },
  gold: {
    bg: 'bg-amber-500/15',
    text: 'text-amber-300',
    label: 'Gold',
  },
  platinum: {
    bg: 'bg-cyan-500/20',
    text: 'text-cyan-300',
    label: 'Platinum',
  },
};

export const MilestonesView: React.FC<MilestonesViewProps> = ({
  habits,
  entries,
  stats,
  onNavigateToHabits,
}) => {
  const { badges, playerStats } = calculateMilestones(habits, entries, stats);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unlocked' | 'in_progress'>('all');
  const [selectedBadge, setSelectedBadge] = useState<MilestoneBadge | null>(null);

  const filteredBadges = badges.filter((badge) => {
    if (activeFilter === 'unlocked') return badge.unlocked;
    if (activeFilter === 'in_progress') return !badge.unlocked;
    return true;
  });

  const xpProgressRange = playerStats.nextLevelXp - playerStats.prevLevelXp;
  const xpCurrentInRange = playerStats.totalXp - playerStats.prevLevelXp;
  const levelPercentage = xpProgressRange > 0
    ? Math.min(100, Math.round((xpCurrentInRange / xpProgressRange) * 100))
    : 100;

  const handleBadgeClick = (badge: MilestoneBadge) => {
    if (badge.unlocked) {
      sound.playComplete();
    } else {
      sound.playClick();
    }
    setSelectedBadge(badge);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="border-b border-ob-line pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-ob-gold text-xs font-semibold uppercase tracking-wider mb-1">
            <Trophy className="w-3.5 h-3.5" />
            <span>Operational Milestones</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ob-text">
            Milestones & Badges
          </h1>
          <p className="text-xs text-ob-dim mt-1">
            Track personal records, unlock discipline medals, and build momentum through daily execution.
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
            <span>{playerStats.unlockedCount} of {playerStats.totalBadgesCount} Badges Unlocked</span>
            <span className="text-ob-gold font-semibold ml-2">
              ({Math.round((playerStats.unlockedCount / playerStats.totalBadgesCount) * 100)}%)
            </span>
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

      {/* Filter Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1.5 bg-ob-s1 p-1 rounded-lg border border-ob-line">
          <button
            onClick={() => {
              sound.playClick();
              setActiveFilter('all');
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeFilter === 'all'
                ? 'bg-ob-raised text-ob-gold shadow-sm font-semibold'
                : 'text-ob-dim hover:text-ob-text'
            }`}
          >
            All Badges ({badges.length})
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setActiveFilter('unlocked');
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeFilter === 'unlocked'
                ? 'bg-ob-raised text-ob-gold shadow-sm font-semibold'
                : 'text-ob-dim hover:text-ob-text'
            }`}
          >
            Unlocked ({playerStats.unlockedCount})
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setActiveFilter('in_progress');
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeFilter === 'in_progress'
                ? 'bg-ob-raised text-ob-gold shadow-sm font-semibold'
                : 'text-ob-dim hover:text-ob-text'
            }`}
          >
            In Progress ({badges.length - playerStats.unlockedCount})
          </button>
        </div>

        <div className="text-xs text-ob-dim font-medium">
          Click any badge to view details
        </div>
      </div>

      {/* Badges Grid - Clean Borderless Design Without Harsh Strokes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBadges.map((badge) => {
          const Icon = ICON_MAP[badge.icon] || Award;
          const tierStyle = TIER_COLORS[badge.tier];
          const progressPercent = Math.min(100, Math.round((badge.currentProgress / badge.maxProgress) * 100));

          return (
            <div
              key={badge.id}
              onClick={() => handleBadgeClick(badge)}
              className={`rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 cursor-pointer select-none group relative overflow-hidden border shadow-sm ${
                badge.unlocked
                  ? 'bg-ob-s1 hover:bg-ob-raised border-ob-gold/30 hover:border-ob-gold/60 hover:shadow-md'
                  : 'bg-ob-s1 hover:bg-ob-raised border-ob-line hover:border-ob-line-strong hover:shadow-md'
              }`}
            >
              {/* Card Top */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-3.5">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105 border ${
                      badge.unlocked
                        ? `${tierStyle.bg} ${tierStyle.text} border-transparent shadow-sm`
                        : 'bg-ob-canvas border-ob-line text-ob-muted'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${tierStyle.bg} ${tierStyle.text}`}
                    >
                      {tierStyle.label}
                    </span>
                    <span className="text-xs sm:text-sm font-bold font-mono text-ob-gold">
                      +{badge.xp} XP
                    </span>
                  </div>
                </div>

                {/* Badge Title & Description (English only, no Arabic) */}
                <div>
                  <h3 className={`text-sm font-bold ${badge.unlocked ? 'text-ob-text' : 'text-ob-dim'}`}>
                    {badge.title}
                  </h3>
                  <p className="text-xs text-ob-text-2 mt-1 leading-relaxed">
                    {badge.description}
                  </p>
                </div>
              </div>

              {/* Card Footer / Progress (Without divider stroke line) */}
              <div className="mt-5 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-ob-dim text-[11px]">Progress</span>
                  <span className={`font-semibold ${badge.unlocked ? 'text-ob-gold' : 'text-ob-dim'}`}>
                    {badge.currentProgress}/{badge.maxProgress} {badge.unit || ''}
                  </span>
                </div>

                <div className="w-full bg-ob-track h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      badge.unlocked ? 'bg-ob-gold' : 'bg-ob-dim/60'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px]">
                  {badge.unlocked ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[10px] uppercase tracking-wider">
                      <Check className="w-3 h-3" /> Unlocked
                    </span>
                  ) : (
                    <span className="text-ob-muted font-medium flex items-center gap-1 text-[10px] uppercase tracking-wider">
                      <Lock className="w-3 h-3" /> Locked ({progressPercent}%)
                    </span>
                  )}
                  <span className="text-[10px] text-ob-muted capitalize">
                    {badge.category}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Badge Inspect Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-ob-sidebar p-6 shadow-2xl space-y-6 ring-1 ring-white/5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {(() => {
                  const Icon = ICON_MAP[selectedBadge.icon] || Award;
                  const tierStyle = TIER_COLORS[selectedBadge.tier];
                  return (
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${
                        selectedBadge.unlocked
                          ? `${tierStyle.bg} ${tierStyle.text}`
                          : 'bg-ob-s1 text-ob-muted'
                      }`}
                    >
                      <Icon className="w-7 h-7" />
                    </div>
                  );
                })()}
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        TIER_COLORS[selectedBadge.tier].bg
                      } ${TIER_COLORS[selectedBadge.tier].text}`}
                    >
                      {TIER_COLORS[selectedBadge.tier].label} Tier
                    </span>
                    <span className="text-xs font-mono font-semibold text-ob-gold">
                      +{selectedBadge.xp} XP
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-ob-text mt-1">
                    {selectedBadge.title}
                  </h2>
                </div>
              </div>

              <button
                onClick={() => setSelectedBadge(null)}
                className="p-1.5 rounded-lg text-ob-dim hover:text-ob-text hover:bg-ob-s1 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-ob-s1 space-y-2">
              <div className="text-xs text-ob-text-2 leading-relaxed">
                {selectedBadge.description}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-ob-dim">Completion Status</span>
                <span className="text-ob-text font-bold">
                  {selectedBadge.currentProgress} / {selectedBadge.maxProgress} {selectedBadge.unit || ''}
                </span>
              </div>
              <div className="w-full bg-ob-track h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    selectedBadge.unlocked ? 'bg-ob-gold' : 'bg-ob-dim'
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round((selectedBadge.currentProgress / selectedBadge.maxProgress) * 100)
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="pt-2">
              {selectedBadge.unlocked ? (
                <div className="w-full py-2.5 px-4 rounded-xl bg-ob-gold/15 text-ob-gold text-xs font-semibold flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Unlocked & Verified on Record</span>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setSelectedBadge(null);
                    if (onNavigateToHabits) onNavigateToHabits();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-ob-gold text-ob-on-gold text-xs font-bold hover:bg-ob-gold-bright transition-colors text-center"
                >
                  Work on this habit now →
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
