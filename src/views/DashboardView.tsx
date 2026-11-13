import React, { useState } from 'react';
import { Habit, HabitEntry } from '../types';
import { Cell } from '../components/Cell';
import { resolveCellState, getTodayString, formatDateToISO, getDayOfWeek } from '../storage';
import { ChevronLeft, ChevronRight, Calendar, Flame, CheckCircle2, AlertOctagon, Plus, Minus, MessageSquare, Check, X } from 'lucide-react';
import { sound } from '../audio';

interface DashboardViewProps {
  habits: Habit[];
  entries: HabitEntry[];
  onToggleEntry: (habitId: string, date: string, customValue?: number) => void;
  onUpdateNote: (habitId: string, date: string, note: string) => void;
  consistencyPercentage: number;
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  habits,
  entries,
  onToggleEntry,
  onUpdateNote,
  consistencyPercentage,
  selectedIndex,
  onSelectIndex,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [editingNoteHabitId, setEditingNoteHabitId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState<string>('');
  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(false);

  const todayStr = getTodayString();
  const isToday = selectedDate === todayStr;

  const handlePrevDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() - 1);
    setSelectedDate(formatDateToISO(date));
  };

  const handleNextDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + 1);
    setSelectedDate(formatDateToISO(date));
  };

  const currentDow = getDayOfWeek(selectedDate);
  const activeHabits = habits.filter((h) => !h.archived);

  // Scheduled for the selected day
  const dueHabits = activeHabits.filter((h) => h.scheduleDays.includes(currentDow));
  const completedHabits = dueHabits.filter((h) =>
    entries.some((e) => e.habitId === h.id && e.date === selectedDate && e.completed)
  );

  const completionRate = dueHabits.length > 0
    ? Math.round((completedHabits.length / dueHabits.length) * 100)
    : 0;

  // Selected date formatted nicely
  const [sy, sm, sd] = selectedDate.split('-').map(Number);
  const selectedDateObj = new Date(sy, sm - 1, sd);
  const formattedDate = selectedDateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  // Calculate past 7 days dates for mini-matrix
  const past7Days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(selectedDateObj);
    d.setDate(d.getDate() - i);
    past7Days.push(formatDateToISO(d));
  }

  // 2-Day Rule Detection: Any habit scheduled yesterday that was missed
  const yesterday = new Date(selectedDateObj);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDateToISO(yesterday);
  const yesterdayDow = getDayOfWeek(yesterdayStr);

  const threatenedHabits = isToday
    ? activeHabits.filter((h) => {
        const wasScheduledYesterday = h.scheduleDays.includes(yesterdayDow);
        const doneYesterday = entries.some(
          (e) => e.habitId === h.id && e.date === yesterdayStr && e.completed
        );
        const isScheduledToday = h.scheduleDays.includes(currentDow);
        const doneToday = entries.some(
          (e) => e.habitId === h.id && e.date === selectedDate && e.completed
        );
        return wasScheduledYesterday && !doneYesterday && isScheduledToday && !doneToday;
      })
    : [];

  const handleToggle = (habitId: string, date: string, customValue?: number) => {
    sound.playClick();
    onToggleEntry(habitId, date, customValue);
  };

  const handleStepNumeric = (habit: Habit, delta: number) => {
    if (!habit.targetValue) return;
    const entry = entries.find((e) => e.habitId === habit.id && e.date === selectedDate);
    const current = entry?.currentValue ?? (entry?.completed ? habit.targetValue : 0);
    const next = Math.max(0, Math.min(habit.targetValue * 2, current + delta));

    sound.playClick();
    if (next >= habit.targetValue && !entry?.completed) {
      sound.playComplete();
    }
    onToggleEntry(habit.id, selectedDate, next);
  };

  const openNoteEditor = (habitId: string) => {
    const entry = entries.find((e) => e.habitId === habitId && e.date === selectedDate);
    setNoteText(entry?.note || '');
    setEditingNoteHabitId(habitId);
  };

  const saveNote = (habitId: string) => {
    onUpdateNote(habitId, selectedDate, noteText);
    setEditingNoteHabitId(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Top Header & Date Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ob-line pb-6">
        <div>
          <div className="text-xs uppercase tracking-widest text-ob-gold font-semibold flex items-center gap-1.5 mb-1">
            <Calendar className="w-3.5 h-3.5" />
            {isToday ? 'Today on the record' : 'Historical record'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ob-text">
            {formattedDate}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {!isToday && (
            <button
              onClick={() => setSelectedDate(todayStr)}
              className="text-xs font-semibold px-2.5 py-1.5 rounded border border-ob-line bg-ob-s1 text-ob-text hover:bg-ob-raised transition-colors"
            >
              Back to Today
            </button>
          )}
          <div className="flex items-center bg-ob-s1 border border-ob-line rounded-lg p-1">
            <button
              onClick={handlePrevDay}
              className="p-1.5 hover:bg-ob-raised rounded text-ob-dim hover:text-ob-text transition-colors"
              title="Previous Day (ArrowLeft)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono px-3 text-ob-text-2">
              {selectedDate}
            </span>
            <button
              onClick={handleNextDay}
              className="p-1.5 hover:bg-ob-raised rounded text-ob-dim hover:text-ob-text transition-colors"
              title="Next Day (ArrowRight)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2-Day Rule Sleek Safeguard Banner */}
      {threatenedHabits.length > 0 && !isBannerDismissed && (
        <div className="rounded-xl border border-ob-line-strong bg-ob-s1/90 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-black/20 backdrop-blur-sm animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-ob-gold/10 border border-ob-gold/20 flex items-center justify-center shrink-0">
              <Flame className="w-4 h-4 text-ob-gold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-ob-gold bg-ob-gold/10 px-1.5 py-0.5 rounded border border-ob-gold/20">
                  2-Day Rule
                </span>
                <span className="text-xs font-semibold text-ob-text">
                  {threatenedHabits[0].title}
                </span>
              </div>
              <p className="text-xs text-ob-dim mt-0.5">
                Missed yesterday. Show up today to keep the record clean.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => handleToggle(threatenedHabits[0].id, selectedDate)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ob-gold/10 hover:bg-ob-gold text-ob-gold hover:text-ob-on-gold border border-ob-gold/30 text-xs font-semibold transition-all shadow-sm"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Complete Today</span>
            </button>
            <button
              onClick={() => setIsBannerDismissed(true)}
              className="p-1.5 text-ob-dim hover:text-ob-text rounded-lg hover:bg-ob-raised transition-colors"
              title="Dismiss notice"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Summary Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Consistency Ratio */}
        <div className="rounded-xl border border-ob-line bg-ob-s1 p-5 space-y-2">
          <div className="text-xs uppercase tracking-wider text-ob-dim font-medium flex items-center justify-between">
            <span>Consistency Ratio</span>
            <span className="text-ob-gold font-semibold">Completed ÷ Scheduled</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold tracking-tight text-ob-gold">{consistencyPercentage}%</span>
            <span className="text-xs text-ob-muted">overall 30d</span>
          </div>
          <p className="text-xs text-ob-dim leading-relaxed">
            Measures every habit scheduled against what was done. No streak resets upon a single miss.
          </p>
        </div>

        {/* Selected Day Progress */}
        <div className="rounded-xl border border-ob-line bg-ob-s1 p-5 space-y-2">
          <div className="text-xs uppercase tracking-wider text-ob-dim font-medium flex items-center justify-between">
            <span>Day Progress</span>
            <CheckCircle2 className="w-4 h-4 text-ob-gold" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold tracking-tight text-ob-text">
              {completedHabits.length}<span className="text-xl text-ob-dim font-normal">/{dueHabits.length}</span>
            </span>
            <span className="text-xs text-ob-gold font-medium">{completionRate}% completed</span>
          </div>
          <div className="w-full bg-ob-track h-2 rounded-full overflow-hidden">
            <div
              className="bg-ob-gold h-full rounded-full transition-all duration-300"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* Philosophy Card */}
        <div className="rounded-xl border border-ob-line bg-ob-s1 p-5 flex flex-col justify-between">
          <div className="text-xs uppercase tracking-wider text-ob-dim font-medium flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-ob-gold" />
            <span>Guiding Principle</span>
          </div>
          <p className="text-[13px] text-ob-text-2 italic leading-snug my-2">
            “Missing twice isn't the problem. Letting it turn into a week is. Go tomorrow. No drama.”
          </p>
          <div className="text-[11px] text-ob-muted font-mono uppercase">
            Ledger Accountability
          </div>
        </div>
      </div>

      {/* Habit Checklist Section */}
      <div className="rounded-xl border border-ob-line bg-ob-sidebar overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-ob-line bg-ob-s1/60">
          <div>
            <h2 className="text-base font-semibold text-ob-text">Scheduled Habits</h2>
            <p className="text-xs text-ob-dim">
              Use <kbd className="px-1.5 py-0.5 rounded bg-ob-raised border border-ob-line font-mono text-[10px]">Space</kbd> to toggle, <kbd className="px-1.5 py-0.5 rounded bg-ob-raised border border-ob-line font-mono text-[10px]">J/K</kbd> to navigate
            </p>
          </div>
          {/* Mini 7-day header */}
          <div className="hidden sm:flex items-center gap-2 text-[10px] uppercase font-mono text-ob-dim">
            <span className="mr-2">Past 7 Days:</span>
            {past7Days.map((d) => {
              const dow = getDayOfWeek(d);
              const names = ['', 'M', 'T', 'W', 'T', 'F', 'S', 'S'];
              return (
                <div key={d} className="w-[18px] text-center font-bold">
                  {names[dow]}
                </div>
              );
            })}
          </div>
        </div>

        <div className="divide-y divide-ob-line">
          {dueHabits.length === 0 ? (
            <div className="py-12 text-center text-ob-dim text-sm">
              No habits scheduled for this day of the week.
            </div>
          ) : (
            dueHabits.map((habit, index) => {
              const entry = entries.find((e) => e.habitId === habit.id && e.date === selectedDate);
              const cellState = resolveCellState(habit, selectedDate, entries, todayStr);
              const isDone = cellState === 'done';
              const isNumeric = Boolean(habit.targetValue && habit.unit);
              const currentVal = entry?.currentValue ?? (isDone && habit.targetValue ? habit.targetValue : 0);
              const isSelected = selectedIndex === index;

              return (
                <div
                  key={habit.id}
                  onClick={() => onSelectIndex(index)}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-3 sm:py-4 transition-colors gap-2.5 sm:gap-3 ${
                    isSelected ? 'bg-ob-gold/5 ring-1 ring-inset ring-ob-gold/30' : 'hover:bg-ob-s1/40'
                  }`}
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <Cell
                      state={cellState}
                      onClick={() => handleToggle(habit.id, selectedDate)}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          onClick={() => handleToggle(habit.id, selectedDate)}
                          className={`text-sm font-medium cursor-pointer transition-colors ${
                            isDone ? 'text-ob-text' : 'text-ob-text hover:text-ob-gold'
                          }`}
                        >
                          {habit.title}
                        </span>
                        {/* Note badge */}
                        {entry?.note && (
                          <span
                            onClick={() => openNoteEditor(habit.id)}
                            title={entry.note}
                            className="text-[10px] bg-ob-s1 border border-ob-line px-1.5 py-0.5 rounded text-ob-gold cursor-pointer flex items-center gap-1"
                          >
                            <MessageSquare className="w-2.5 h-2.5" />
                            <span>Note</span>
                          </span>
                        )}
                      </div>
                      {habit.description && (
                        <div className="text-xs text-ob-dim mt-0.5 truncate">
                          {habit.description}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions: Numeric target stepper & 7-day mini trend */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pl-8 sm:pl-0">
                    {/* Numeric Stepper if Target-based Habit */}
                    {isNumeric && (
                      <div className="flex items-center gap-2 bg-ob-s1 px-2.5 py-1 rounded-lg border border-ob-line text-xs font-mono">
                        <button
                          onClick={() => handleStepNumeric(habit, -1)}
                          className="p-1 hover:text-ob-gold transition-colors"
                          title="Decrease"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="min-w-[55px] text-center font-bold text-ob-text">
                          {currentVal}/{habit.targetValue} {habit.unit}
                        </span>
                        <button
                          onClick={() => handleStepNumeric(habit, 1)}
                          className="p-1 hover:text-ob-gold transition-colors"
                          title="Increase"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {/* Micro-note trigger button */}
                    <button
                      onClick={() => openNoteEditor(habit.id)}
                      className="p-1.5 text-ob-dim hover:text-ob-gold transition-colors"
                      title="Add reflection note for this habit"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>

                    {/* 7-day mini heatmap trend for this habit */}
                    <div className="hidden sm:flex items-center gap-2">
                      {past7Days.map((dateString) => {
                        const state = resolveCellState(habit, dateString, entries, todayStr);
                        return (
                          <Cell
                            key={dateString}
                            state={state}
                            size="micro"
                            onClick={() => handleToggle(habit.id, dateString)}
                            title={`${dateString}: ${state}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Note Modal Editor */}
      {editingNoteHabitId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl border border-ob-line bg-ob-raised p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-ob-text">
              Reflection Note for {selectedDate}
            </h3>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="e.g. Completed early before workout, or why it slipped..."
              className="w-full h-24 bg-ob-s1 border border-ob-line rounded-lg p-3 text-xs text-ob-text outline-none focus:border-ob-gold"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setEditingNoteHabitId(null)}
                className="px-3 py-1.5 text-xs text-ob-dim hover:text-ob-text"
              >
                Cancel
              </button>
              <button
                onClick={() => saveNote(editingNoteHabitId)}
                className="px-4 py-1.5 rounded-lg bg-ob-gold text-ob-on-gold text-xs font-semibold hover:bg-ob-gold-bright"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
