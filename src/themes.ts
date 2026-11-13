export interface ThemeColors {
  id: string;
  name: string;
  category: 'dark' | 'light' | 'oled' | 'colorful';
  description: string;
  previewColors: string[]; // 3 colors for preview dots: [bg, accent, surface]
  variables: {
    '--ob-canvas': string;
    '--ob-sidebar': string;
    '--ob-s1': string;
    '--ob-s2': string;
    '--ob-raised': string;
    '--ob-text': string;
    '--ob-text-2': string;
    '--ob-muted': string;
    '--ob-dim': string;
    '--ob-line': string;
    '--ob-line-strong': string;
    '--ob-grid': string;
    '--ob-gold': string; // Main accent
    '--ob-gold-bright': string;
    '--ob-gold-muted': string;
    '--ob-gold-wash': string;
    '--ob-gold-wash-faint': string;
    '--ob-on-gold': string;
    '--ob-cell-miss': string;
    '--ob-cell-future': string;
    '--ob-track': string;
    '--ob-bar': string;
    '--ob-danger': string;
  };
}

/**
 * The palettes follow the product color profiles of the ui-ux-pro-max color
 * library. Every pair was checked against WCAG 2.1: body text at 4.5 to 1 and
 * large text at 3 to 1 or better. The accent color carries the progress and
 * the streak, so it always stays readable on the canvas and the surfaces.
 */
export const THEMES: ThemeColors[] = [
  {
    id: 'warm-ivory',
    name: 'Warm Ivory',
    category: 'light',
    description: 'Warm cream, textured paper, and deep ink. Zero eye strain in daylight.',
    previewColors: ['#fffbeb', '#b45309', '#ffffff'],
    variables: {
      '--ob-canvas': '#fffbeb',
      '--ob-sidebar': '#fdf6e7',
      '--ob-s1': '#ffffff',
      '--ob-s2': '#fef9f0',
      '--ob-raised': '#f7eedd',
      '--ob-text': '#0f172a',
      '--ob-text-2': '#334155',
      '--ob-muted': '#475569',
      '--ob-dim': '#64748b',
      '--ob-line': '#f0e2c9',
      '--ob-line-strong': '#ddc9a6',
      '--ob-grid': '#f5ead8',
      '--ob-gold': '#b45309',
      '--ob-gold-bright': '#d97706',
      '--ob-gold-muted': '#92400e',
      '--ob-gold-wash': 'rgba(180, 83, 9, 0.12)',
      '--ob-gold-wash-faint': 'rgba(180, 83, 9, 0.05)',
      '--ob-on-gold': '#fffbeb',
      '--ob-cell-miss': '#efe3ce',
      '--ob-cell-future': '#f8f1e3',
      '--ob-track': '#efe3ce',
      '--ob-bar': '#047857',
      '--ob-danger': '#b91c1c',
    },
  },
  {
    id: 'blue-ledger',
    name: 'Blue Ledger',
    category: 'dark',
    description: 'Trust blue on deep slate. Clear numbers, calm streaks.',
    previewColors: ['#0f172a', '#3b82f6', '#192134'],
    variables: {
      '--ob-canvas': '#0f172a',
      '--ob-sidebar': '#0b1220',
      '--ob-s1': '#192134',
      '--ob-s2': '#1e293b',
      '--ob-raised': '#26324a',
      '--ob-text': '#f8fafc',
      '--ob-text-2': '#cbd5e1',
      '--ob-muted': '#94a3b8',
      '--ob-dim': '#8494ab',
      '--ob-line': 'rgba(59, 130, 246, 0.12)',
      '--ob-line-strong': 'rgba(59, 130, 246, 0.24)',
      '--ob-grid': 'rgba(59, 130, 246, 0.05)',
      '--ob-gold': '#3b82f6',
      '--ob-gold-bright': '#60a5fa',
      '--ob-gold-muted': '#1d4ed8',
      '--ob-gold-wash': 'rgba(59, 130, 246, 0.14)',
      '--ob-gold-wash-faint': 'rgba(59, 130, 246, 0.05)',
      '--ob-on-gold': '#050b18',
      '--ob-cell-miss': '#1e293b',
      '--ob-cell-future': '#16213a',
      '--ob-track': '#1e293b',
      '--ob-bar': '#059669',
      '--ob-danger': '#dc2626',
    },
  },
  {
    id: 'golden-streak',
    name: 'Golden Streak',
    category: 'dark',
    description: 'Warm amber for the streak, green for the win. Built for daily use.',
    previewColors: ['#17120a', '#f59e0b', '#241c11'],
    variables: {
      '--ob-canvas': '#17120a',
      '--ob-sidebar': '#1f1810',
      '--ob-s1': '#241c11',
      '--ob-s2': '#2c2315',
      '--ob-raised': '#362b1a',
      '--ob-text': '#fdf6e9',
      '--ob-text-2': '#e0cda6',
      '--ob-muted': '#b79e76',
      '--ob-dim': '#a08a66',
      '--ob-line': 'rgba(245, 158, 11, 0.12)',
      '--ob-line-strong': 'rgba(245, 158, 11, 0.24)',
      '--ob-grid': 'rgba(245, 158, 11, 0.05)',
      '--ob-gold': '#f59e0b',
      '--ob-gold-bright': '#fbbf24',
      '--ob-gold-muted': '#b45309',
      '--ob-gold-wash': 'rgba(245, 158, 11, 0.14)',
      '--ob-gold-wash-faint': 'rgba(245, 158, 11, 0.05)',
      '--ob-on-gold': '#1a1206',
      '--ob-cell-miss': '#2c2315',
      '--ob-cell-future': '#221b0f',
      '--ob-track': '#2c2315',
      '--ob-bar': '#059669',
      '--ob-danger': '#dc2626',
    },
  },
  {
    id: 'midnight-indigo',
    name: 'Midnight Indigo',
    category: 'dark',
    description: 'Night indigo with a dream violet accent for late sessions.',
    previewColors: ['#0f172a', '#6366f1', '#192134'],
    variables: {
      '--ob-canvas': '#0f172a',
      '--ob-sidebar': '#0c1326',
      '--ob-s1': '#192134',
      '--ob-s2': '#1f2745',
      '--ob-raised': '#263056',
      '--ob-text': '#ffffff',
      '--ob-text-2': '#c7d2fe',
      '--ob-muted': '#94a3b8',
      '--ob-dim': '#8b93b8',
      '--ob-line': 'rgba(99, 102, 241, 0.14)',
      '--ob-line-strong': 'rgba(99, 102, 241, 0.26)',
      '--ob-grid': 'rgba(99, 102, 241, 0.06)',
      '--ob-gold': '#6366f1',
      '--ob-gold-bright': '#818cf8',
      '--ob-gold-muted': '#4338ca',
      '--ob-gold-wash': 'rgba(99, 102, 241, 0.16)',
      '--ob-gold-wash-faint': 'rgba(99, 102, 241, 0.06)',
      '--ob-on-gold': '#0a0a1f',
      '--ob-cell-miss': '#1f2745',
      '--ob-cell-future': '#141c33',
      '--ob-track': '#1f2745',
      '--ob-bar': '#7c3aed',
      '--ob-danger': '#dc2626',
    },
  },
  {
    id: 'verdant-grid',
    name: 'Verdant Grid',
    category: 'dark',
    description: 'Evergreen surfaces with an emerald accent that reads as progress.',
    previewColors: ['#071310', '#10b981', '#0f241c'],
    variables: {
      '--ob-canvas': '#071310',
      '--ob-sidebar': '#0a1914',
      '--ob-s1': '#0f241c',
      '--ob-s2': '#143026',
      '--ob-raised': '#1b4132',
      '--ob-text': '#ecfdf5',
      '--ob-text-2': '#a7f3d0',
      '--ob-muted': '#6ee7b7',
      '--ob-dim': '#4fb894',
      '--ob-line': 'rgba(16, 185, 129, 0.14)',
      '--ob-line-strong': 'rgba(16, 185, 129, 0.26)',
      '--ob-grid': 'rgba(16, 185, 129, 0.05)',
      '--ob-gold': '#10b981',
      '--ob-gold-bright': '#34d399',
      '--ob-gold-muted': '#047857',
      '--ob-gold-wash': 'rgba(16, 185, 129, 0.14)',
      '--ob-gold-wash-faint': 'rgba(16, 185, 129, 0.05)',
      '--ob-on-gold': '#02100a',
      '--ob-cell-miss': '#143026',
      '--ob-cell-future': '#0d1d17',
      '--ob-track': '#143026',
      '--ob-bar': '#34d399',
      '--ob-danger': '#f87171',
    },
  },
  {
    id: 'phosphor-terminal',
    name: 'Phosphor Terminal',
    category: 'dark',
    description: 'Code editor dark with a run green accent. Monk mode focus.',
    previewColors: ['#0a0f0a', '#22c55e', '#101a12'],
    variables: {
      '--ob-canvas': '#0a0f0a',
      '--ob-sidebar': '#0c130c',
      '--ob-s1': '#101a12',
      '--ob-s2': '#16241a',
      '--ob-raised': '#1d3123',
      '--ob-text': '#e6ffea',
      '--ob-text-2': '#bbf7d0',
      '--ob-muted': '#86efac',
      '--ob-dim': '#6fbf8c',
      '--ob-line': 'rgba(34, 197, 94, 0.14)',
      '--ob-line-strong': 'rgba(34, 197, 94, 0.26)',
      '--ob-grid': 'rgba(34, 197, 94, 0.05)',
      '--ob-gold': '#22c55e',
      '--ob-gold-bright': '#4ade80',
      '--ob-gold-muted': '#15803d',
      '--ob-gold-wash': 'rgba(34, 197, 94, 0.14)',
      '--ob-gold-wash-faint': 'rgba(34, 197, 94, 0.05)',
      '--ob-on-gold': '#04150a',
      '--ob-cell-miss': '#16241a',
      '--ob-cell-future': '#0e1a12',
      '--ob-track': '#16241a',
      '--ob-bar': '#4ade80',
      '--ob-danger': '#ef4444',
    },
  },
  {
    id: 'violet-circuit',
    name: 'Violet Circuit',
    category: 'colorful',
    description: 'Editor violet with a filter cyan highlight. Loud but readable.',
    previewColors: ['#0f172a', '#8b5cf6', '#192134'],
    variables: {
      '--ob-canvas': '#0f172a',
      '--ob-sidebar': '#0a1120',
      '--ob-s1': '#192134',
      '--ob-s2': '#1e293b',
      '--ob-raised': '#27324a',
      '--ob-text': '#ffffff',
      '--ob-text-2': '#ddd6fe',
      '--ob-muted': '#a5b4fc',
      '--ob-dim': '#8f9ad6',
      '--ob-line': 'rgba(139, 92, 246, 0.16)',
      '--ob-line-strong': 'rgba(139, 92, 246, 0.3)',
      '--ob-grid': 'rgba(139, 92, 246, 0.06)',
      '--ob-gold': '#8b5cf6',
      '--ob-gold-bright': '#a78bfa',
      '--ob-gold-muted': '#6d28d9',
      '--ob-gold-wash': 'rgba(139, 92, 246, 0.16)',
      '--ob-gold-wash-faint': 'rgba(139, 92, 246, 0.06)',
      '--ob-on-gold': '#0b0714',
      '--ob-cell-miss': '#1e293b',
      '--ob-cell-future': '#16213a',
      '--ob-track': '#1e293b',
      '--ob-bar': '#22d3ee',
      '--ob-danger': '#f87171',
    },
  },
  {
    id: 'pomodoro-red',
    name: 'Pomodoro Red',
    category: 'dark',
    description: 'Focus red with a break green. Pressure that reads as progress.',
    previewColors: ['#0f172a', '#ef4444', '#192134'],
    variables: {
      '--ob-canvas': '#0f172a',
      '--ob-sidebar': '#0c1220',
      '--ob-s1': '#192134',
      '--ob-s2': '#1f2937',
      '--ob-raised': '#2a3547',
      '--ob-text': '#ffffff',
      '--ob-text-2': '#e2e8f0',
      '--ob-muted': '#94a3b8',
      '--ob-dim': '#7f8ea6',
      '--ob-line': 'rgba(239, 68, 68, 0.14)',
      '--ob-line-strong': 'rgba(239, 68, 68, 0.26)',
      '--ob-grid': 'rgba(239, 68, 68, 0.05)',
      '--ob-gold': '#ef4444',
      '--ob-gold-bright': '#f87171',
      '--ob-gold-muted': '#b91c1c',
      '--ob-gold-wash': 'rgba(239, 68, 68, 0.14)',
      '--ob-gold-wash-faint': 'rgba(239, 68, 68, 0.05)',
      '--ob-on-gold': '#1a0505',
      '--ob-cell-miss': '#1f2937',
      '--ob-cell-future': '#16213a',
      '--ob-track': '#1f2937',
      '--ob-bar': '#059669',
      '--ob-danger': '#fca5a5',
    },
  },
  {
    id: 'oled-midnight',
    name: 'OLED Pure Black',
    category: 'oled',
    description: 'Pitch black background for deep contrast and maximum battery efficiency.',
    previewColors: ['#000000', '#f4f4f5', '#0d0d0d'],
    variables: {
      '--ob-canvas': '#000000',
      '--ob-sidebar': '#050505',
      '--ob-s1': '#0d0d0d',
      '--ob-s2': '#141414',
      '--ob-raised': '#1c1c1c',
      '--ob-text': '#ffffff',
      '--ob-text-2': '#d4d4d8',
      '--ob-muted': '#a1a1aa',
      '--ob-dim': '#8b8b95',
      '--ob-line': 'rgba(255, 255, 255, 0.1)',
      '--ob-line-strong': 'rgba(255, 255, 255, 0.18)',
      '--ob-grid': 'rgba(255, 255, 255, 0.05)',
      '--ob-gold': '#f4f4f5',
      '--ob-gold-bright': '#ffffff',
      '--ob-gold-muted': '#a1a1aa',
      '--ob-gold-wash': 'rgba(244, 244, 245, 0.12)',
      '--ob-gold-wash-faint': 'rgba(244, 244, 245, 0.04)',
      '--ob-on-gold': '#000000',
      '--ob-cell-miss': '#27272a',
      '--ob-cell-future': '#18181b',
      '--ob-track': '#27272a',
      '--ob-bar': '#a1a1aa',
      '--ob-danger': '#ef4444',
    },
  },
  {
    id: 'teal-focus',
    name: 'Teal Focus',
    category: 'light',
    description: 'Cool teal with an action orange accent. Bright daylight clarity.',
    previewColors: ['#f0fdfa', '#0f766e', '#ffffff'],
    variables: {
      '--ob-canvas': '#f0fdfa',
      '--ob-sidebar': '#e6f7f4',
      '--ob-s1': '#ffffff',
      '--ob-s2': '#f5fcfb',
      '--ob-raised': '#def3ef',
      '--ob-text': '#134e4a',
      '--ob-text-2': '#115e59',
      '--ob-muted': '#475569',
      '--ob-dim': '#5b6b7f',
      '--ob-line': '#cdeee8',
      '--ob-line-strong': '#99f6e4',
      '--ob-grid': '#e2f5f1',
      '--ob-gold': '#0f766e',
      '--ob-gold-bright': '#14b8a6',
      '--ob-gold-muted': '#115e59',
      '--ob-gold-wash': 'rgba(15, 118, 110, 0.12)',
      '--ob-gold-wash-faint': 'rgba(15, 118, 110, 0.05)',
      '--ob-on-gold': '#f0fdfa',
      '--ob-cell-miss': '#dcefeb',
      '--ob-cell-future': '#e9f7f4',
      '--ob-track': '#dcefeb',
      '--ob-bar': '#ea580c',
      '--ob-danger': '#b91c1c',
    },
  },
];

export const THEME_STORAGE_KEY = 'routinix_active_theme_id';
export const LEGACY_THEME_STORAGE_KEY = 'apex_active_theme_id';

import { db } from './db';
import { syncManager } from './sync/syncManager';

export const getTheme = (id: string): ThemeColors =>
  THEMES.find((theme) => theme.id === id) || THEMES[0];

export const applyTheme = (themeId: string) => {
  const theme = getTheme(themeId);
  const root = document.documentElement;

  Object.entries(theme.variables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme.id);
    db.settings.put({ key: 'activeThemeId', value: theme.id }).catch(() => {});
  } catch (e) {}

  // Device sync: the paired device follows the same theme.
  void syncManager.recordSetting('activeThemeId', theme.id);
};

export const getSavedThemeId = (): string => {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) || localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
    if (saved && THEMES.some((t) => t.id === saved)) {
      return saved;
    }
    // A theme from an earlier version keeps its character.
    if (saved && LEGACY_THEME_MAP[saved]) {
      return LEGACY_THEME_MAP[saved];
    }
  } catch (e) {
    // fallback
  }
  return THEMES[0].id;
};

/** The earlier palette names point at the theme that carries the same feeling. */
const LEGACY_THEME_MAP: Record<string, string> = {
  'obsidian-gold': 'golden-streak',
  'nordic-frost': 'blue-ledger',
  'forest-emerald': 'verdant-grid',
  'tokyo-cyberpunk': 'violet-circuit',
  'solarized-amber': 'golden-streak',
  'matrix-terminal': 'phosphor-terminal',
  'paper-ivory': 'warm-ivory',
  'lavender-dusk': 'midnight-indigo',
};
