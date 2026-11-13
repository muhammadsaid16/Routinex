import { useEffect, useState } from 'react';
import { db } from '../db';
import { syncManager } from '../sync/syncManager';

export type CoachProvider =
  | 'anthropic'
  | 'openai'
  | 'openai-compatible'
  | 'google'
  | 'openrouter';
export type CoachContextLevel = 'summary' | 'days' | 'full';

export interface CoachSettings {
  provider: CoachProvider;
  /** The key never leaves the device. It only goes to the provider the user chose. */
  apiKey: string;
  model: string;
  /** Used by a self hosted provider such as Ollama, LM Studio or a router. */
  baseUrl: string;
  /** How much of the record the coach is allowed to read. */
  contextLevel: CoachContextLevel;
}

export const COACH_SETTINGS_KEY = 'routinix_coach_settings';

export const PROVIDER_PRESETS: Record<
  CoachProvider,
  { label: string; defaultBaseUrl: string; defaultModel: string; needsKey: boolean }
> = {
  anthropic: {
    label: 'Anthropic',
    defaultBaseUrl: 'https://api.anthropic.com',
    defaultModel: 'claude-sonnet-4-5',
    needsKey: true,
  },
  openai: {
    label: 'OpenAI',
    defaultBaseUrl: 'https://api.openai.com',
    defaultModel: 'gpt-4.1-mini',
    needsKey: true,
  },
  'openai-compatible': {
    label: 'OpenAI compatible (Ollama, LM Studio, a router)',
    defaultBaseUrl: 'http://localhost:11434/v1',
    defaultModel: '',
    needsKey: false,
  },
  google: {
    label: 'Google Gemini',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    defaultModel: 'gemini-2.5-flash',
    needsKey: true,
  },
  openrouter: {
    label: 'OpenRouter',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'openrouter/auto',
    needsKey: true,
  },
};

export const DEFAULT_COACH_SETTINGS: CoachSettings = {
  provider: 'anthropic',
  apiKey: '',
  model: PROVIDER_PRESETS.anthropic.defaultModel,
  baseUrl: PROVIDER_PRESETS.anthropic.defaultBaseUrl,
  contextLevel: 'summary',
};

export function loadCoachSettings(): CoachSettings {
  try {
    const raw = localStorage.getItem(COACH_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_COACH_SETTINGS, ...parsed };
    }
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_COACH_SETTINGS };
}

export function saveCoachSettings(settings: CoachSettings) {
  try {
    localStorage.setItem(COACH_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* storage blocked */
  }

  notifyCoachSettings(settings);

  // Device sync: the paired device uses the same provider and key.
  void db.settings.put({ key: 'coachSettings', value: settings }).catch(() => {});
  void syncManager.recordSetting('coachSettings', settings);
}

type CoachSettingsListener = (settings: CoachSettings) => void;
const coachListeners = new Set<CoachSettingsListener>();

function notifyCoachSettings(settings: CoachSettings) {
  coachListeners.forEach((listener) => listener(settings));
}

/** Subscribes to every change, local or from the paired device. */
export function subscribeCoachSettings(listener: CoachSettingsListener): () => void {
  coachListeners.add(listener);
  return () => coachListeners.delete(listener);
}

/** Reads the stored settings and keeps them current on both devices. */
export function useCoachSettings(): [CoachSettings, (next: CoachSettings) => void] {
  const [settings, setSettings] = useState<CoachSettings>(() => loadCoachSettings());

  useEffect(() => subscribeCoachSettings(setSettings), []);

  return [settings, saveCoachSettings];
}

/** True when a synced value has the shape of coach settings. */
export function isCoachSettings(value: any): value is CoachSettings {
  return (
    !!value &&
    typeof value === 'object' &&
    typeof value.provider === 'string' &&
    typeof value.apiKey === 'string' &&
    typeof value.model === 'string' &&
    typeof value.baseUrl === 'string'
  );
}

/** The coach only talks to a provider when the user gave it one. */
export function isCoachReady(settings: CoachSettings): boolean {
  const preset = PROVIDER_PRESETS[settings.provider];
  if (!settings.model.trim()) return false;
  if (preset.needsKey && !settings.apiKey.trim()) return false;
  return true;
}
