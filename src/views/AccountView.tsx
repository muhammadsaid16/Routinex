import React, { useState } from 'react';
import { Globe, Shield, RefreshCw, Sparkles, Palette, Volume2, Download, Upload, Keyboard, Check, Maximize2, Edit3, X, Trash2 } from 'lucide-react';
import { sound } from '../audio';
import { exportBackupJSON, importBackupJSON, getInitials } from '../storage';
import { Habit, HabitEntry } from '../types';
import { UIScaleOption, UI_SCALES } from '../uiScale';

interface AccountViewProps {
  onResetDemo: () => void;
  onClearAll: () => void;
  onOpenTheme: () => void;
  onOpenShortcuts: () => void;
  currentThemeName: string;
  onDataImported: (data: { habits: Habit[]; entries: HabitEntry[] }) => void;
  currentScale: UIScaleOption;
  onSelectScale: (scale: UIScaleOption) => void;
  userName: string;
  onUpdateUserName: (name: string) => void;
}

export const AccountView: React.FC<AccountViewProps> = ({
  onResetDemo,
  onClearAll,
  onOpenTheme,
  onOpenShortcuts,
  currentThemeName,
  onDataImported,
  currentScale,
  onSelectScale,
  userName,
  onUpdateUserName,
}) => {
  const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const [soundOn, setSoundOn] = useState<boolean>(sound.isEnabled());
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [showResetOptions, setShowResetOptions] = useState<boolean>(false);
  const [resetFeedback, setResetFeedback] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [editedName, setEditedName] = useState<string>(userName);

  const handleSaveName = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = editedName.trim();
    if (trimmed) {
      onUpdateUserName(trimmed);
      sound.playComplete();
    } else {
      setEditedName(userName);
    }
    setIsEditingName(false);
  };

  const toggleSound = () => {
    const next = !soundOn;
    sound.setEnabled(next);
    setSoundOn(next);
    if (next) sound.playClick();
  };

  const handleExport = async () => {
    sound.playClick();
    const json = await exportBackupJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `routinix_habits_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const result = importBackupJSON(content);
        sound.playComplete();
        onDataImported(result);
        setImportStatus('Backup restored successfully!');
        setTimeout(() => setImportStatus(null), 3500);
      } catch (err: any) {
        alert(`Error importing backup: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-ob-line pb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ob-text">
          Account & Preferences
        </h1>
        <p className="text-xs text-ob-dim mt-1">
          System settings, appearance themes, UI scale density, and data portability.
        </p>
      </div>

      {/* Settings Grid */}
      <div className="space-y-4">
        {/* Profile Card */}
        <div className="rounded-xl border border-ob-line bg-ob-sidebar p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 flex-1 min-w-0">
            <div className="w-11 h-11 rounded-full bg-ob-raised border border-ob-line-strong flex items-center justify-center font-bold text-ob-gold text-sm shrink-0">
              {getInitials(userName)}
            </div>

            {isEditingName ? (
              <form onSubmit={handleSaveName} className="flex items-center gap-2 flex-1 max-w-sm">
                <input
                  type="text"
                  autoFocus
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  placeholder="Enter your name..."
                  className="bg-ob-s1 border border-ob-gold px-3 py-1.5 text-sm font-semibold text-ob-text rounded-lg outline-none focus:ring-1 focus:ring-ob-gold flex-1 min-w-0"
                />
                <button
                  type="submit"
                  className="p-2 rounded-lg bg-ob-gold text-ob-on-gold hover:bg-ob-gold-bright transition-colors"
                  title="Save Name"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditedName(userName);
                    setIsEditingName(false);
                  }}
                  className="p-2 rounded-lg text-ob-dim hover:text-ob-text hover:bg-ob-s1 transition-colors"
                  title="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold text-ob-text truncate">{userName}</span>
                    <button
                      onClick={() => {
                        sound.playClick();
                        setEditedName(userName);
                        setIsEditingName(true);
                      }}
                      className="p-1 rounded text-ob-dim hover:text-ob-gold hover:bg-ob-s1 transition-colors"
                      title="Edit Name"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-xs text-ob-dim truncate">
                    {(userName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'operator')}@routinix.local
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ob-gold/10 border border-ob-gold/30 text-ob-gold text-[11px] font-semibold self-start sm:self-auto shrink-0">
            <Sparkles className="w-3 h-3" />
            <span>ROUTINIX LIFETIME</span>
          </div>
        </div>

        {/* Theme Settings Card */}
        <div className="rounded-xl border border-ob-line bg-ob-sidebar p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Palette className="w-5 h-5 text-ob-gold" />
            <div>
              <div className="text-sm font-medium text-ob-text">Active Theme</div>
              <div className="text-xs text-ob-dim mt-0.5">
                Current theme: <span className="text-ob-gold font-semibold">{currentThemeName}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onOpenTheme}
            className="text-xs font-semibold px-3.5 py-1.5 rounded-lg border border-ob-line bg-ob-s1 text-ob-text hover:bg-ob-gold hover:text-ob-on-gold transition-colors"
          >
            Change Theme
          </button>
        </div>

        {/* UI Scale / Density Setting */}
        <div className="rounded-xl border border-ob-line bg-ob-sidebar p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Maximize2 className="w-5 h-5 text-ob-gold" />
              <div>
                <div className="text-sm font-medium text-ob-text">UI Scale & Size</div>
                <div className="text-xs text-ob-dim mt-0.5">
                  Enlarge or compact text, habit cells, and layout proportions.
                </div>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-ob-gold bg-ob-s1 px-2.5 py-1 rounded-md border border-ob-line">
              {UI_SCALES[currentScale].percentage}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {(Object.keys(UI_SCALES) as UIScaleOption[]).map((scaleKey) => {
              const cfg = UI_SCALES[scaleKey];
              const isSelected = currentScale === scaleKey;
              return (
                <button
                  key={scaleKey}
                  onClick={() => {
                    sound.playClick();
                    onSelectScale(scaleKey);
                  }}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border flex flex-col items-center justify-center gap-0.5 transition-all ${
                    isSelected
                      ? 'bg-ob-gold text-ob-on-gold border-ob-gold shadow-sm'
                      : 'bg-ob-s1 text-ob-dim border-ob-line hover:text-ob-text hover:border-ob-line-strong'
                  }`}
                >
                  <span>{cfg.label}</span>
                  <span className={`text-[10px] font-mono ${isSelected ? 'text-ob-on-gold/80' : 'text-ob-muted'}`}>
                    {cfg.percentage}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Audio Tactile Feedback */}
        <div className="rounded-xl border border-ob-line bg-ob-sidebar p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Volume2 className={`w-5 h-5 ${soundOn ? 'text-ob-gold' : 'text-ob-dim'}`} />
            <div>
              <div className="text-sm font-medium text-ob-text">Tactile Audio Feedback</div>
              <div className="text-xs text-ob-dim mt-0.5">
                Satisfying mechanical sound on habit check and completion.
              </div>
            </div>
          </div>
          <button
            onClick={toggleSound}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              soundOn
                ? 'bg-ob-gold text-ob-on-gold border-ob-gold'
                : 'bg-ob-s1 text-ob-dim border-ob-line hover:text-ob-text'
            }`}
          >
            {soundOn ? 'Enabled' : 'Muted'}
          </button>
        </div>

        {/* Keyboard Shortcuts Guide */}
        <div className="rounded-xl border border-ob-line bg-ob-sidebar p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Keyboard className="w-5 h-5 text-ob-gold" />
            <div>
              <div className="text-sm font-medium text-ob-text">Keyboard Shortcuts</div>
              <div className="text-xs text-ob-dim mt-0.5">
                Control the entire app at high speed with keyboard controls.
              </div>
            </div>
          </div>
          <button
            onClick={onOpenShortcuts}
            className="text-xs font-semibold px-3.5 py-1.5 rounded-lg border border-ob-line bg-ob-s1 text-ob-text hover:bg-ob-s2 transition-colors"
          >
            View Shortcuts (?)
          </button>
        </div>

        {/* Data Backup & Portability */}
        <div className="rounded-xl border border-ob-line bg-ob-sidebar p-5 space-y-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-ob-gold" />
            <div>
              <div className="text-sm font-medium text-ob-text">Data Portability & Backup</div>
              <div className="text-xs text-ob-dim mt-0.5">
                Export all habits, history, and notes to JSON or restore from an earlier backup.
              </div>
            </div>
          </div>

          {importStatus && (
            <div className="p-3 rounded-lg bg-ob-gold/15 border border-ob-gold/40 text-xs font-semibold text-ob-gold flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{importStatus}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-lg bg-ob-s1 border border-ob-line hover:border-ob-gold text-ob-text transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export JSON Backup</span>
            </button>

            <label className="flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-lg bg-ob-s1 border border-ob-line hover:border-ob-gold text-ob-text cursor-pointer transition-colors">
              <Upload className="w-4 h-4" />
              <span>Restore Backup</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Timezone Card */}
        <div className="rounded-xl border border-ob-line bg-ob-sidebar p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-ob-gold" />
            <div>
              <div className="text-sm font-medium text-ob-text">Local Timezone</div>
              <div className="text-xs text-ob-dim mt-0.5">
                Determines when your daily habits reset at local midnight.
              </div>
            </div>
          </div>
          <div className="text-xs font-mono bg-ob-s1 border border-ob-line px-3 py-1.5 rounded-lg text-ob-text-2">
            {detectedTimezone}
          </div>
        </div>

        {/* Reset / Clear Data Card */}
        <div className="rounded-xl border border-ob-line bg-ob-sidebar p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-ob-dim" />
              <div>
                <div className="text-sm font-medium text-ob-text">Reset & Clear Data</div>
                <div className="text-xs text-ob-dim mt-0.5">
                  Reload sample demo habits or wipe all data to start completely blank.
                </div>
              </div>
            </div>
            {!showResetOptions ? (
              <button
                onClick={() => setShowResetOptions(true)}
                className="text-xs font-semibold px-3.5 py-1.5 rounded-lg border border-ob-line bg-ob-s1 text-ob-dim hover:text-ob-danger hover:border-ob-danger/50 transition-colors"
              >
                Reset Options
              </button>
            ) : (
              <button
                onClick={() => setShowResetOptions(false)}
                className="text-xs font-medium px-3 py-1 rounded-lg text-ob-dim hover:text-ob-text"
              >
                Cancel
              </button>
            )}
          </div>

          {resetFeedback && (
            <div className="p-3 rounded-lg bg-ob-gold/15 border border-ob-gold/40 text-xs font-semibold text-ob-gold flex items-center gap-2 animate-in fade-in duration-150">
              <Check className="w-4 h-4" />
              <span>{resetFeedback}</span>
            </div>
          )}

          {showResetOptions && (
            <div className="p-4 rounded-xl bg-ob-s1 border border-ob-line space-y-3 shadow-inner animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="text-xs font-semibold text-ob-text">
                Choose how you want to reset your data:
              </div>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  onClick={() => {
                    sound.playComplete();
                    onResetDemo();
                    setResetFeedback('Starter habit templates loaded with clean slate (0 fake history)!');
                    setShowResetOptions(false);
                    setTimeout(() => setResetFeedback(null), 3500);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-ob-raised hover:bg-ob-s2 border border-ob-line-strong hover:border-ob-gold text-xs font-semibold text-ob-text hover:text-ob-gold shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 text-center cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-ob-gold shrink-0" />
                  <span>Load Starter Habits (Clean 0 History)</span>
                </button>
                <button
                  onClick={() => {
                    sound.playClick();
                    onClearAll();
                    setResetFeedback('All habits and history have been cleared. Clean slate!');
                    setShowResetOptions(false);
                    setTimeout(() => setResetFeedback(null), 3500);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white shadow-sm hover:shadow text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border border-red-700/40"
                >
                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Wipe Everything (Start Blank)</span>
                </button>
              </div>
              <p className="text-[11px] text-ob-muted">
                Note: Your theme and UI scale preferences will be preserved.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
