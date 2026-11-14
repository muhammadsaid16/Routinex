import React, { useState } from 'react';
import { Habit, DayOfWeek } from '../types';
import { Plus, Trash2, Calendar, ShieldCheck, X, Target, Users } from 'lucide-react';
import { sound } from '../audio';

interface HabitsViewProps {
  habits: Habit[];
  onAddHabit: (habit: Omit<Habit, 'id' | 'createdAt'>) => void;
  onUpdateSchedule: (habitId: string, days: DayOfWeek[]) => void;
  onUpdateShared: (habitId: string, shared: boolean) => void;
  onDeleteHabit: (habitId: string) => void;
}

export const HabitsView: React.FC<HabitsViewProps> = ({
  habits,
  onAddHabit,
  onUpdateSchedule,
  onUpdateShared,
  onDeleteHabit,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([1, 2, 3, 4, 5, 6, 7]);
  const [isNumeric, setIsNumeric] = useState(false);
  const [targetValue, setTargetValue] = useState<number>(10);
  const [unit, setUnit] = useState<string>('pages');
  const [isShared, setIsShared] = useState(false);

  const daysList: { id: DayOfWeek; label: string }[] = [
    { id: 1, label: 'Mon' },
    { id: 2, label: 'Tue' },
    { id: 3, label: 'Wed' },
    { id: 4, label: 'Thu' },
    { id: 5, label: 'Fri' },
    { id: 6, label: 'Sat' },
    { id: 7, label: 'Sun' },
  ];

  const toggleDaySelection = (day: DayOfWeek) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length === 1) return;
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day].sort());
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    sound.playClick();
    onAddHabit({
      title: title.trim(),
      description: description.trim() || undefined,
      scheduleDays: selectedDays,
      targetValue: isNumeric ? Number(targetValue) : undefined,
      unit: isNumeric ? unit.trim() || undefined : undefined,
      shared: isShared || undefined,
    });

    setTitle('');
    setDescription('');
    setSelectedDays([1, 2, 3, 4, 5, 6, 7]);
    setIsNumeric(false);
    setIsShared(false);
    setIsAdding(false);
  };

  const toggleHabitDay = (habit: Habit, day: DayOfWeek) => {
    let updated: DayOfWeek[];
    if (habit.scheduleDays.includes(day)) {
      if (habit.scheduleDays.length === 1) return;
      updated = habit.scheduleDays.filter((d) => d !== day);
    } else {
      updated = [...habit.scheduleDays, day].sort();
    }
    sound.playClick();
    onUpdateSchedule(habit.id, updated);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ob-line pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ob-text">
            Habit Management
          </h1>
          <p className="text-xs text-ob-dim mt-1">
            Configure binary checkmarks or numeric target habits. Historical records remain intact when schedules change.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-ob-gold text-ob-on-gold font-semibold text-xs px-3.5 py-2.5 rounded-lg hover:bg-ob-gold-bright transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Habit</span>
        </button>
      </div>

      {/* Historical Guarantee Callout */}
      <div className="rounded-xl border border-ob-line bg-ob-s1 p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-ob-gold shrink-0 mt-0.5" />
        <div className="text-xs text-ob-dim leading-relaxed">
          <span className="text-ob-text font-semibold">Change the schedule. Keep the history. </span>
          When you toggle active days for any habit, past dates retain their original scheduled status. Your historical consistency score will never retroactively break.
        </div>
      </div>

      {/* Habit List */}
      <div className="space-y-4">
        {habits.map((habit) => (
          <div
            key={habit.id}
            className="rounded-xl border border-ob-line bg-ob-sidebar p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-ob-text">{habit.title}</h3>
                {habit.targetValue && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-ob-s1 border border-ob-line text-ob-gold font-medium">
                    {habit.targetValue} {habit.unit}
                  </span>
                )}
                {habit.shared && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-ob-gold/10 border border-ob-gold/30 text-ob-gold font-semibold flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Shared
                  </span>
                )}
              </div>
              {habit.description && (
                <p className="text-xs text-ob-dim mt-0.5">{habit.description}</p>
              )}
              <div className="flex items-center gap-2 mt-2 text-[11px] text-ob-muted font-mono">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {habit.scheduleDays.length === 7
                    ? 'Every day'
                    : habit.scheduleDays.length === 5 && !habit.scheduleDays.includes(6) && !habit.scheduleDays.includes(7)
                    ? 'Weekdays'
                    : `${habit.scheduleDays.length} days/week`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Day Pills */}
              <div className="flex items-center gap-1 bg-ob-s1 p-1 rounded-lg border border-ob-line">
                {daysList.map((d) => {
                  const isActive = habit.scheduleDays.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      onClick={() => toggleHabitDay(habit, d.id)}
                      title={`Toggle ${d.label}`}
                      className={`w-7 h-7 rounded text-xs font-semibold transition-colors flex items-center justify-center ${
                        isActive
                          ? 'bg-ob-gold text-ob-on-gold shadow-sm'
                          : 'text-ob-dim hover:text-ob-text hover:bg-ob-raised'
                      }`}
                    >
                      {d.label[0]}
                    </button>
                  );
                })}
              </div>

              {/* Shared Toggle */}
              <button
                onClick={() => {
                  sound.playClick();
                  onUpdateShared(habit.id, !habit.shared);
                }}
                className={`p-2 rounded-lg transition-colors border ${
                  habit.shared
                    ? 'text-ob-gold bg-ob-gold/10 border-ob-gold/30'
                    : 'text-ob-dim hover:text-ob-text hover:bg-ob-s1 border-transparent'
                }`}
                title={habit.shared ? 'Shared with the paired device. Click to make it personal.' : 'Make it a shared habit (counts only when both devices do it).'}
              >
                <Users className="w-4 h-4" />
              </button>

              {/* Delete Button */}
              <button
                onClick={() => {
                  sound.playClick();
                  onDeleteHabit(habit.id);
                }}
                className="p-2 text-ob-dim hover:text-ob-danger hover:bg-ob-s1 rounded-lg transition-colors"
                title="Archive habit"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Habit Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-ob-line bg-ob-raised p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-ob-text">Create Habit</h2>
              <button
                onClick={() => setIsAdding(false)}
                className="p-1 rounded-lg text-ob-dim hover:text-ob-text hover:bg-ob-s1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-ob-dim mb-1.5">
                  Habit Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Read non-fiction"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-ob-line bg-ob-s1 px-3.5 py-2.5 text-sm text-ob-text outline-none focus:border-ob-gold focus:ring-1 focus:ring-ob-gold"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-ob-dim mb-1.5">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Before going to bed"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-ob-line bg-ob-s1 px-3.5 py-2.5 text-sm text-ob-text outline-none focus:border-ob-gold focus:ring-1 focus:ring-ob-gold"
                />
              </div>

              {/* Numeric target toggle */}
              <div className="rounded-lg border border-ob-line bg-ob-s1 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-ob-gold" />
                    <span className="text-xs font-semibold text-ob-text">Measurable Numeric Goal</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isNumeric}
                    onChange={(e) => setIsNumeric(e.target.checked)}
                    className="w-4 h-4 accent-ob-gold rounded cursor-pointer"
                  />
                </div>

                {isNumeric && (
                  <div className="grid grid-cols-2 gap-2 pt-1 animate-in fade-in duration-100">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-medium text-ob-dim mb-1">
                        Daily Target
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={targetValue}
                        onChange={(e) => setTargetValue(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full rounded-md border border-ob-line bg-ob-raised px-2.5 py-1.5 text-xs text-ob-text font-mono outline-none focus:border-ob-gold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-medium text-ob-dim mb-1">
                        Unit
                      </label>
                      <input
                        type="text"
                        value={unit}
                        placeholder="e.g. pages, mins, L"
                        onChange={(e) => setUnit(e.target.value)}
                        className="w-full rounded-md border border-ob-line bg-ob-raised px-2.5 py-1.5 text-xs text-ob-text font-mono outline-none focus:border-ob-gold"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Shared habit toggle */}
              <div className="rounded-lg border border-ob-line bg-ob-s1 p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-ob-gold" />
                    <span className="text-xs font-semibold text-ob-text">Shared with the paired device</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isShared}
                    onChange={(e) => setIsShared(e.target.checked)}
                    className="w-4 h-4 accent-ob-gold rounded cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-ob-dim leading-relaxed">
                  The day counts only when both devices complete it. Your shared streak grows when you both show up.
                </p>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-ob-dim mb-2">
                  Target Days
                </label>
                <div className="grid grid-cols-7 gap-1">
                  {daysList.map((d) => {
                    const isSelected = selectedDays.includes(d.id);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => toggleDaySelection(d.id)}
                        className={`h-9 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-ob-gold text-ob-on-gold'
                            : 'bg-ob-s1 border border-ob-line text-ob-dim hover:text-ob-text'
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-ob-dim hover:text-ob-text hover:bg-ob-s1 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-semibold bg-ob-gold text-ob-on-gold hover:bg-ob-gold-bright transition-colors shadow-sm"
                >
                  Save Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
