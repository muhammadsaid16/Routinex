import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardView } from './views/DashboardView';
import { HabitsView } from './views/HabitsView';
import { ProgressView } from './views/ProgressView';
import { MilestonesView } from './views/MilestonesView';
import { CoachView } from './views/CoachView';
import { AccountView } from './views/AccountView';
import { ThemeModal } from './components/ThemeModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { Habit, HabitEntry, DayOfWeek } from './types';
import {
  getInitialData,
  initDexieStorage,
  seedSampleData,
  clearAllData,
  saveHabits,
  saveEntries,
  calculateStats,
  getTodayString,
  getDayOfWeek,
  getSavedUserName,
  saveUserName,
} from './storage';
import { THEMES, applyTheme, getSavedThemeId } from './themes';
import { sound } from './audio';
import { UIScaleOption, applyUIScale, getSavedUIScale, UI_SCALES } from './uiScale';
import { syncManager } from './sync/syncManager';
import { loadFromDexie } from './storage';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [data, setData] = useState<{ habits: Habit[]; entries: HabitEntry[] }>(getInitialData);
  const [userName, setUserName] = useState<string>(getSavedUserName);
  const [currentThemeId, setCurrentThemeId] = useState<string>(getSavedThemeId);
  const [currentScale, setCurrentScale] = useState<UIScaleOption>(getSavedUIScale);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [selectedHabitIndex, setSelectedHabitIndex] = useState(0);

  const { habits, entries } = data;
  const currentTheme = THEMES.find((t) => t.id === currentThemeId) || THEMES[0];
  const todayStr = getTodayString();
  const currentDow = getDayOfWeek(todayStr);
  const dueHabitsToday = habits.filter((h) => !h.archived && h.scheduleDays.includes(currentDow));

  // Initialize Dexie IndexedDB and load persisted data
  useEffect(() => {
    initDexieStorage().then((dexieData) => {
      if (dexieData.habits.length > 0 || dexieData.entries.length > 0) {
        setData(dexieData);
      }
      syncManager.confirmAppState(dexieData.habits, dexieData.entries);
    });
  }, []);

  // Device sync: pull records that arrived from the paired device
  useEffect(() => {
    return syncManager.onRemoteData(() => {
      loadFromDexie().then((fresh) => {
        setData(fresh);
        syncManager.confirmAppState(fresh.habits, fresh.entries);
      });
    });
  }, []);

  // Device sync: follow preferences that changed on the paired device
  useEffect(() => {
    return syncManager.onRemoteSetting((key, value) => {
      if (key === 'activeThemeId' && typeof value === 'string') {
        setCurrentThemeId(value);
        applyTheme(value);
      } else if (key === 'uiScale' && typeof value === 'string') {
        setCurrentScale(value as UIScaleOption);
        applyUIScale(value as UIScaleOption);
      } else if (key === 'userName' && typeof value === 'string') {
        setUserName(value);
        saveUserName(value);
      }
    });
  }, []);

  // Device sync: tell the link which device it is talking to
  useEffect(() => {
    syncManager.setDeviceName(userName);
  }, [userName]);

  // Device sync: bring the pairing back after a page reload
  useEffect(() => {
    void syncManager.resumeSession();

    if (import.meta.env.DEV) {
      (window as any).__routinix = { sync: syncManager };
    }
  }, []);

  // Device sync: the browser freezes timers in a background tab, so the link
  // is repaired as soon as the app comes back to the front
  useEffect(() => {
    const wake = () => syncManager.handleAppWake();
    window.addEventListener('focus', wake);
    window.addEventListener('pageshow', wake);
    window.addEventListener('online', wake);
    document.addEventListener('visibilitychange', wake);
    return () => {
      window.removeEventListener('focus', wake);
      window.removeEventListener('pageshow', wake);
      window.removeEventListener('online', wake);
      document.removeEventListener('visibilitychange', wake);
    };
  }, []);

  // Device sync: a scanned QR code opens the app with a pairing code
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pairCode = params.get('pair');
    if (!pairCode) return;

    params.delete('pair');
    const cleaned = `${window.location.pathname}${params.toString() ? `?${params}` : ''}${
      window.location.hash
    }`;
    window.history.replaceState({}, '', cleaned);

    setCurrentTab('account');

    // A stored session with the same code is restored by resumeSession().
    if (syncManager.getSessionCode() === pairCode.replace(/-/g, '').toUpperCase()) return;

    void syncManager.joinWithCode(pairCode);
  }, []);

  // Apply theme & UI scale on mount and change
  useEffect(() => {
    applyTheme(currentThemeId);
  }, [currentThemeId]);

  useEffect(() => {
    applyUIScale(currentScale);
  }, [currentScale]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (currentTab === 'dashboard' && dueHabitsToday[selectedHabitIndex]) {
          handleToggleEntry(dueHabitsToday[selectedHabitIndex].id, todayStr);
        }
      } else if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedHabitIndex((prev) => (prev + 1) % Math.max(1, dueHabitsToday.length));
        sound.playClick();
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedHabitIndex((prev) => (prev - 1 + dueHabitsToday.length) % Math.max(1, dueHabitsToday.length));
        sound.playClick();
      } else if (e.key === '1') {
        setCurrentTab('dashboard');
        sound.playClick();
      } else if (e.key === '2') {
        setCurrentTab('habits');
        sound.playClick();
      } else if (e.key === '3') {
        setCurrentTab('progress');
        sound.playClick();
      } else if (e.key === '4') {
        setCurrentTab('milestones');
        sound.playClick();
      } else if (e.key === '5') {
        setCurrentTab('coach');
        sound.playClick();
      } else if (e.key === 'm' || e.key === 'M') {
        setIsThemeModalOpen((prev) => !prev);
      } else if (e.key === '?') {
        setIsShortcutsModalOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTab, selectedHabitIndex, dueHabitsToday]);

  const handleSelectTheme = (themeId: string) => {
    setCurrentThemeId(themeId);
    applyTheme(themeId);
  };

  const handleToggleEntry = (habitId: string, date: string, customValue?: number) => {
    const habit = habits.find((h) => h.id === habitId);
    const existingIndex = entries.findIndex(
      (e) => e.habitId === habitId && e.date === date
    );

    let updatedEntries: HabitEntry[];

    if (existingIndex >= 0) {
      const current = entries[existingIndex];
      if (customValue !== undefined) {
        const isComplete = habit?.targetValue ? customValue >= habit.targetValue : customValue > 0;
        updatedEntries = [
          ...entries.slice(0, existingIndex),
          {
            ...current,
            completed: isComplete,
            currentValue: customValue,
            completedAt: isComplete ? new Date().toISOString() : undefined,
          },
          ...entries.slice(existingIndex + 1),
        ];
      } else {
        if (current.completed) {
          // Toggle off
          updatedEntries = entries.filter((_, idx) => idx !== existingIndex);
        } else {
          // Toggle on
          sound.playComplete();
          updatedEntries = [
            ...entries.slice(0, existingIndex),
            {
              ...current,
              completed: true,
              completedAt: new Date().toISOString(),
              currentValue: habit?.targetValue || 1,
            },
            ...entries.slice(existingIndex + 1),
          ];
        }
      }
    } else {
      // Create new entry
      const val = customValue !== undefined ? customValue : (habit?.targetValue || 1);
      const isComplete = habit?.targetValue ? val >= habit.targetValue : true;
      if (isComplete) sound.playComplete();

      updatedEntries = [
        ...entries,
        {
          habitId,
          date,
          completed: isComplete,
          currentValue: val,
          completedAt: isComplete ? new Date().toISOString() : undefined,
        },
      ];
    }

    setData((prev) => ({ ...prev, entries: updatedEntries }));
    saveEntries(updatedEntries);
  };

  const handleUpdateNote = (habitId: string, date: string, note: string) => {
    const existingIndex = entries.findIndex(
      (e) => e.habitId === habitId && e.date === date
    );

    let updatedEntries: HabitEntry[];
    if (existingIndex >= 0) {
      updatedEntries = [
        ...entries.slice(0, existingIndex),
        { ...entries[existingIndex], note },
        ...entries.slice(existingIndex + 1),
      ];
    } else {
      updatedEntries = [
        ...entries,
        {
          habitId,
          date,
          completed: false,
          note,
        },
      ];
    }

    setData((prev) => ({ ...prev, entries: updatedEntries }));
    saveEntries(updatedEntries);
  };

  const handleAddHabit = (newHabitData: Omit<Habit, 'id' | 'createdAt'>) => {
    const newHabit: Habit = {
      ...newHabitData,
      id: `h-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    const updatedHabits = [...habits, newHabit];
    setData((prev) => ({ ...prev, habits: updatedHabits }));
    saveHabits(updatedHabits);
  };

  const handleUpdateSchedule = (habitId: string, days: DayOfWeek[]) => {
    const updatedHabits = habits.map((h) =>
      h.id === habitId ? { ...h, scheduleDays: days } : h
    );
    setData((prev) => ({ ...prev, habits: updatedHabits }));
    saveHabits(updatedHabits);
  };

  const handleDeleteHabit = (habitId: string) => {
    const updatedHabits = habits.map((h) =>
      h.id === habitId ? { ...h, archived: true } : h
    );
    setData((prev) => ({ ...prev, habits: updatedHabits }));
    saveHabits(updatedHabits);
  };

  const handleResetDemo = () => {
    const fresh = seedSampleData();
    setData(fresh);
  };

  const handleClearAll = () => {
    const empty = clearAllData();
    setData(empty);
  };

  const handleDataImported = (imported: { habits: Habit[]; entries: HabitEntry[] }) => {
    setData(imported);
    setCurrentTab('dashboard');
  };

  const stats = calculateStats(habits, entries, 30);

  return (
    <div className="min-h-screen bg-ob-canvas text-ob-text flex flex-col lg:flex-row transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        consistencyPercentage={stats.percentage}
        onOpenTheme={() => setIsThemeModalOpen(true)}
        userName={userName}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full lg:pl-[224px] pb-24 lg:pb-12 pt-4 sm:pt-10 px-3 sm:px-8 max-w-full overflow-x-hidden">
        {currentTab === 'dashboard' && (
          <DashboardView
            habits={habits}
            entries={entries}
            onToggleEntry={handleToggleEntry}
            onUpdateNote={handleUpdateNote}
            consistencyPercentage={stats.percentage}
            selectedIndex={selectedHabitIndex}
            onSelectIndex={setSelectedHabitIndex}
          />
        )}

        {currentTab === 'habits' && (
          <HabitsView
            habits={habits.filter((h) => !h.archived)}
            onAddHabit={handleAddHabit}
            onUpdateSchedule={handleUpdateSchedule}
            onDeleteHabit={handleDeleteHabit}
          />
        )}

        {currentTab === 'progress' && (
          <ProgressView
            habits={habits}
            entries={entries}
            stats={stats}
            onToggleEntry={handleToggleEntry}
            onNavigateToMilestones={() => setCurrentTab('milestones')}
          />
        )}

        {currentTab === 'milestones' && (
          <MilestonesView
            habits={habits}
            entries={entries}
            stats={stats}
            onNavigateToHabits={() => setCurrentTab('habits')}
          />
        )}

        {currentTab === 'coach' && (
          <CoachView habits={habits} entries={entries} stats={stats} />
        )}

        {currentTab === 'account' && (
          <AccountView
            onResetDemo={handleResetDemo}
            onClearAll={handleClearAll}
            onOpenTheme={() => setIsThemeModalOpen(true)}
            onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
            currentThemeName={currentTheme.name}
            onDataImported={handleDataImported}
            currentScale={currentScale}
            onSelectScale={setCurrentScale}
            userName={userName}
            onUpdateUserName={(name) => {
              setUserName(name);
              saveUserName(name);
            }}
          />
        )}
      </main>

      {/* Theme Selection Modal */}
      <ThemeModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        currentThemeId={currentThemeId}
        onSelectTheme={handleSelectTheme}
      />

      {/* Shortcuts Guide Modal */}
      <ShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />
    </div>
  );
};
export default App;
