export type CoachProvider = 'anthropic' | 'openai' | 'openai-compatible';
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
}

/** The coach only talks to a provider when the user gave it one. */
export function isCoachReady(settings: CoachSettings): boolean {
  const preset = PROVIDER_PRESETS[settings.provider];
  if (!settings.model.trim()) return false;
  if (preset.needsKey && !settings.apiKey.trim()) return false;
  return true;
}
