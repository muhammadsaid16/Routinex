import React, { useState } from 'react';
import { X, Check, KeyRound, Eye, EyeOff, Loader2, Save } from 'lucide-react';
import {
  CoachProvider,
  CoachSettings,
  PROVIDER_PRESETS,
  isCoachReady,
  loadCoachSettings,
  saveCoachSettings,
} from '../coach/settings';
import { askCoach } from '../coach/providers';
import { buildCoachContext } from '../coach/context';
import { sound } from '../audio';

interface CoachSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (settings: CoachSettings) => void;
}

export const CoachSettingsModal: React.FC<CoachSettingsModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [settings, setSettings] = useState<CoachSettings>(() => loadCoachSettings());
  const [showKey, setShowKey] = useState(false);
  const [test, setTest] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle');
  const [note, setNote] = useState<string | null>(null);

  if (!isOpen) return null;

  const preset = PROVIDER_PRESETS[settings.provider];

  const handleSave = () => {
    saveCoachSettings(settings);
    setTest('idle');
    setNote('Saved. The coach uses this provider from now on.');
    sound.playClick();
    onSaved?.(settings);
  };

  const handleTest = async () => {
    saveCoachSettings(settings);
    setTest('testing');
    setNote(null);
    sound.playClick();

    try {
      const context = buildCoachContext({
        level: 'summary',
        habits: [],
        entries: [],
        stats: {
          completed: 0,
          scheduled: 0,
          percentage: 0,
          currentStreak: 0,
          bestDay: '—',
          worstDay: '—',
        },
        today: new Date().toISOString().slice(0, 10),
      });

      const reply = await askCoach(settings, context, [], 'Reply with the single word: ready');
      setTest('ok');
      setNote(`The provider answered: ${reply.slice(0, 90)}`);
    } catch (err: any) {
      setTest('error');
      setNote(err?.message || 'The provider did not answer.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-ob-sidebar border border-ob-line p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-ob-gold/15 border border-ob-gold/30 flex items-center justify-center text-ob-gold">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-ob-text">AI Coach settings</h2>
              <p className="text-[11px] text-ob-dim">Your key stays on this device</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ob-dim hover:text-ob-text hover:bg-ob-s1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider font-semibold text-ob-dim">
              Provider
            </label>
            <select
              value={settings.provider}
              onChange={(e) => {
                const provider = e.target.value as CoachProvider;
                const next = PROVIDER_PRESETS[provider];
                setSettings({
                  ...settings,
                  provider,
                  baseUrl: next.defaultBaseUrl,
                  model: next.defaultModel,
                });
                setTest('idle');
                setNote(null);
              }}
              className="w-full bg-ob-s1 border border-ob-line px-3 py-2 text-xs text-ob-text rounded-lg outline-none focus:border-ob-gold"
            >
              {Object.entries(PROVIDER_PRESETS).map(([id, item]) => (
                <option key={id} value={id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider font-semibold text-ob-dim">
              Model
            </label>
            <input
              value={settings.model}
              onChange={(e) => {
                setSettings({ ...settings, model: e.target.value });
                setTest('idle');
              }}
              placeholder={preset.defaultModel}
              spellCheck={false}
              className="w-full bg-ob-s1 border border-ob-line px-3 py-2 text-xs font-mono text-ob-text rounded-lg outline-none focus:border-ob-gold placeholder:text-ob-muted"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-[10px] uppercase tracking-wider font-semibold text-ob-dim">
              Base URL
            </label>
            <input
              value={settings.baseUrl}
              onChange={(e) => {
                setSettings({ ...settings, baseUrl: e.target.value });
                setTest('idle');
              }}
              spellCheck={false}
              className="w-full bg-ob-s1 border border-ob-line px-3 py-2 text-xs font-mono text-ob-text rounded-lg outline-none focus:border-ob-gold placeholder:text-ob-muted"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-[10px] uppercase tracking-wider font-semibold text-ob-dim">
              API key {preset.needsKey ? '' : '(optional for a local model)'}
            </label>
            <div className="flex items-center gap-2">
              <input
                type={showKey ? 'text' : 'password'}
                value={settings.apiKey}
                onChange={(e) => {
                  setSettings({ ...settings, apiKey: e.target.value });
                  setTest('idle');
                }}
                placeholder="sk-..."
                spellCheck={false}
                autoComplete="off"
                className="flex-1 min-w-0 bg-ob-s1 border border-ob-line px-3 py-2 text-xs font-mono text-ob-text rounded-lg outline-none focus:border-ob-gold placeholder:text-ob-muted"
              />
              <button
                onClick={() => setShowKey((prev) => !prev)}
                className="p-2 rounded-lg border border-ob-line bg-ob-s1 text-ob-dim hover:text-ob-text transition-colors shrink-0"
                title={showKey ? 'Hide the key' : 'Show the key'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-ob-gold text-ob-on-gold text-xs font-bold hover:bg-ob-gold-bright transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            Save
          </button>

          <button
            onClick={handleTest}
            disabled={test === 'testing'}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-ob-line bg-ob-s1 text-xs font-semibold text-ob-dim hover:text-ob-text hover:border-ob-gold transition-colors disabled:opacity-50"
          >
            {test === 'testing' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <KeyRound className="w-3.5 h-3.5" />
            )}
            Test the connection
          </button>

          {note && (
            <span className={`text-[11px] ${test === 'error' ? 'text-rose-400' : 'text-ob-dim'}`}>
              {note}
            </span>
          )}
        </div>

        {!isCoachReady(settings) && (
          <p className="text-[11px] text-amber-400/90 leading-relaxed">
            The coach needs a model{preset.needsKey ? ' and an API key' : ''} before it can answer in
            context. Until then it replies with the built in answers.
          </p>
        )}

        <p className="text-[11px] text-ob-muted leading-relaxed">
          The key is kept in this browser only. When you ask a question, the coach sends the selected
          part of your record to the provider you chose. Nothing is stored on our side.
        </p>
      </div>
    </div>
  );
};
