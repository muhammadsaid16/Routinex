import React, { useState, useEffect } from 'react';
import { Globe, Shield, RefreshCw, Sparkles, Palette, Volume2, Download, Upload, Keyboard, Check, Maximize2, Edit3, X, Trash2, Monitor, Smartphone, CheckCircle2, Trophy, KeyRound, Eye, EyeOff, Loader2, Bot, AlertTriangle } from 'lucide-react';
import { sound } from '../audio';
import { exportBackupJSON, importBackupJSON, getInitials } from '../storage';
import { Habit, HabitEntry } from '../types';
import { UIScaleOption, UI_SCALES } from '../uiScale';
import { PROVIDER_PRESETS, isCoachReady, useCoachSettings } from '../coach/settings';
import { CoachSettingsModal } from '../components/CoachSettingsModal';
import { DeviceSyncPanel } from '../components/DeviceSyncPanel';

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
  milestonesEnabled: boolean;
  onToggleMilestones: (enabled: boolean) => void;
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
  milestonesEnabled,
  onToggleMilestones,
}) => {
  const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const [soundOn, setSoundOn] = useState<boolean>(sound.isEnabled());
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [showResetOptions, setShowResetOptions] = useState<boolean>(false);
  const [showWipeModal, setShowWipeModal] = useState<boolean>(false);
  const [resetFeedback, setResetFeedback] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [editedName, setEditedName] = useState<string>(userName);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [coach, setCoach] = useCoachSettings();
  const [isCoachSettingsOpen, setIsCoachSettingsOpen] = useState(false);
  const coachReady = isCoachReady(coach);
  const coachProviderLabel = PROVIDER_PRESETS[coach.provider].label;
  const [installGuide, setInstallGuide] = useState<{ title: string; desc: string } | null>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallPC = async () => {
    sound.playClick();
    if (deferredPrompt) {
      deferredPrompt.prompt();
      try {
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setInstallGuide({
            title: 'Installation Started!',
            desc: 'Ledger is being added to your desktop and applications menu. You can launch it directly as a standalone app.',
          });
          setDeferredPrompt(null);
        }
      } catch {}
    } else {
      setInstallGuide({
        title: 'Install on PC (Desktop App):',
        desc: 'In Chrome, Edge, or Brave: Click the Install icon (🖥️ or ⊕) in the browser address bar at the top, or click Menu (⋮) → "Install Ledger" to run as an independent desktop window with offline storage.',
      });
    }
  };

  const handleInstallAndroidWeb = async () => {
    sound.playClick();
    if (deferredPrompt) {
      deferredPrompt.prompt();
      try {
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setInstallGuide({
            title: 'Added to Home Screen!',
            desc: 'Ledger has been added to your phone home screen. Enjoy the fullscreen app experience!',
          });
          setDeferredPrompt(null);
        }
      } catch {}
    } else {
      setInstallGuide({
        title: 'Install on Android via Browser:',
        desc: 'Open this app in Chrome on your phone, tap the three dots (⋮) in the top-right corner, and select "Add to Home screen" or "Install app".',
      });
    }
  };

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
    a.download = `ledger_habits_backup_${new Date().toISOString().slice(0, 10)}.json`;
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
            <span>LEDGER LIFETIME</span>
          </div>
        </div>

        {/* Device Sync & Link */}
        <DeviceSyncPanel />

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

        {/* App Downloads & Installation for PC and Android */}
        <div className="rounded-xl border border-ob-line bg-ob-sidebar p-5 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-ob-gold/15 flex items-center justify-center text-ob-gold shrink-0">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-ob-text">Install & Download Ledger</div>
                <div className="text-xs text-ob-dim mt-0.5">
                  Standalone apps for PC & Android with offline Dexie.js database persistence.
                </div>
              </div>
            </div>
            <span className="self-start sm:self-auto text-[10px] font-mono uppercase tracking-wider font-semibold px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Desktop & Android Ready
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Download / Install for PC */}
            <div className="rounded-xl border border-ob-line bg-ob-s1 p-4 flex flex-col justify-between space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-ob-raised border border-ob-line text-ob-gold shrink-0">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-ob-text">Desktop Application (PC)</div>
                  <div className="text-[11px] text-ob-dim mt-0.5 leading-relaxed">
                    Install on Windows, macOS, or Linux. Runs in a dedicated native window without browser frames.
                  </div>
                </div>
              </div>

              <div className="pt-1">
                <button
                  onClick={handleInstallPC}
                  className="w-full py-2.5 px-3.5 rounded-lg bg-ob-raised hover:bg-ob-gold hover:text-ob-on-gold border border-ob-line-strong text-xs font-bold text-ob-text transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.98]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Install for PC (Desktop App)</span>
                </button>
              </div>
            </div>

            {/* Download for Android */}
            <div className="rounded-xl border border-ob-line bg-ob-s1 p-4 flex flex-col justify-between space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-ob-raised border border-ob-line text-emerald-400 shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-ob-text">Android App (APK & Web App)</div>
                  <div className="text-[11px] text-ob-dim mt-0.5 leading-relaxed">
                    Download the standalone Android APK or install directly to home screen via Chrome / Samsung Internet.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <a
                  href="/downloads/ledger.apk?v=2"
                  download="ledger.apk"
                  className="flex-1 py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-[0.98] text-center"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download APK</span>
                </a>
                <button
                  onClick={handleInstallAndroidWeb}
                  className="py-2.5 px-3.5 rounded-lg bg-ob-raised border border-ob-line hover:border-ob-gold text-xs font-semibold text-ob-text hover:text-ob-gold transition-colors flex items-center justify-center gap-1 cursor-pointer active:scale-[0.98]"
                  title="Install via Chrome or Samsung Internet"
                >
                  <Sparkles className="w-3.5 h-3.5 text-ob-gold" />
                  <span>PWA</span>
                </button>
              </div>
            </div>
          </div>

          {installGuide && (
            <div className="p-3.5 rounded-xl bg-ob-raised border border-ob-line text-xs space-y-1.5 animate-in fade-in duration-150">
              <div className="font-bold text-ob-gold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>{installGuide.title}</span>
              </div>
              <p className="text-[11px] text-ob-text-2 leading-relaxed">
                {installGuide.desc}
              </p>
            </div>
          )}
        </div>

        {/* AI Coach */}
        <div className="rounded-xl border border-ob-line bg-ob-sidebar p-5 flex items-center justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-ob-gold/15 flex items-center justify-center text-ob-gold shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-ob-text">AI Coach</div>
              <div className="text-xs text-ob-dim mt-0.5">
                {coachReady
                  ? `Connected to ${coachProviderLabel}. The key stays on this device.`
                  : 'Bring your own key. The coach reads your record and answers in context.'}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              setIsCoachSettingsOpen(true);
            }}
            className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-ob-line bg-ob-s1 text-xs font-semibold text-ob-dim hover:text-ob-gold hover:border-ob-gold transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5" />
            {coachReady ? 'Settings' : 'Set up'}
          </button>
        </div>

        {/* Milestones switch */}
        <div className="rounded-xl border border-ob-line bg-ob-sidebar p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Trophy className={`w-5 h-5 shrink-0 ${milestonesEnabled ? 'text-ob-gold' : 'text-ob-dim'}`} />
            <div className="min-w-0">
              <div className="text-sm font-medium text-ob-text">Milestones &amp; Achievements</div>
              <div className="text-xs text-ob-dim mt-0.5">
                {milestonesEnabled
                  ? 'The rank, the points and the progression are part of the app.'
                  : 'The milestones system is switched off. The app stays focused on the habits.'}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onToggleMilestones(!milestonesEnabled);
            }}
            className={`shrink-0 text-xs font-semibold px-3.5 py-1.5 rounded-lg border transition-colors ${
              milestonesEnabled
                ? 'bg-ob-gold text-ob-on-gold border-ob-gold'
                : 'bg-ob-s1 text-ob-dim border-ob-line hover:text-ob-text'
            }`}
          >
            {milestonesEnabled ? 'On' : 'Off'}
          </button>
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

        <CoachSettingsModal
          isOpen={isCoachSettingsOpen}
          onClose={() => setIsCoachSettingsOpen(false)}
          onSaved={(next) => setCoach(next)}
        />

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
                    setShowWipeModal(true);
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

      {/* Wipe Confirmation Modal */}
      {showWipeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-ob-line bg-ob-raised p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h2 className="text-base font-bold text-ob-text">Wipe All Data?</h2>
                <p className="text-xs text-ob-dim mt-0.5">This action cannot be undone.</p>
              </div>
            </div>

            <div className="rounded-xl border border-ob-line bg-ob-s1 p-3 text-xs text-ob-dim leading-relaxed">
              All habits, past completions, journal notes, and ledger records will be permanently wiped. Your appearance and sound settings will remain.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowWipeModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-ob-dim hover:text-ob-text hover:bg-ob-s1 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onClearAll();
                  setShowWipeModal(false);
                  setShowResetOptions(false);
                  setResetFeedback('All habits and history have been cleared. Clean slate!');
                  setTimeout(() => setResetFeedback(null), 3500);
                }}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors shadow-sm cursor-pointer"
              >
                Yes, Wipe Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
