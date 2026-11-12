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

export const THEMES: ThemeColors[] = [
  {
    id: 'nordic-frost',
    name: 'Nordic Frost',
    category: 'dark',
    description: 'Deep sub-zero navy with icy cyan accents.',
    previewColors: ['#0b1120', '#38bdf8', '#1e293b'],
    variables: {
      '--ob-canvas': '#070d19',
      '--ob-sidebar': '#0a1222',
      '--ob-s1': '#0f1a30',
      '--ob-s2': '#14223d',
      '--ob-raised': '#1a2a4a',
      '--ob-text': '#f0f9ff',
      '--ob-text-2': '#94a3b8',
      '--ob-muted': '#64748b',
      '--ob-dim': '#475569',
      '--ob-line': 'rgba(56, 189, 248, 0.1)',
      '--ob-line-strong': 'rgba(56, 189, 248, 0.2)',
      '--ob-grid': 'rgba(56, 189, 248, 0.04)',
      '--ob-gold': '#38bdf8',
      '--ob-gold-bright': '#7dd3fc',
      '--ob-gold-muted': '#0284c7',
      '--ob-gold-wash': 'rgba(56, 189, 248, 0.12)',
      '--ob-gold-wash-faint': 'rgba(56, 189, 248, 0.04)',
      '--ob-on-gold': '#04101e',
      '--ob-cell-miss': '#1e293b',
      '--ob-cell-future': '#0f172a',
      '--ob-track': '#1e293b',
      '--ob-bar': '#64748b',
      '--ob-danger': '#f43f5e',
    },
  },
  {
    id: 'oled-midnight',
    name: 'OLED Pure Black',
    category: 'oled',
    description: 'Pitch black background for deep contrast and maximum battery efficiency.',
    previewColors: ['#000000', '#ffffff', '#121212'],
    variables: {
      '--ob-canvas': '#000000',
      '--ob-sidebar': '#050505',
      '--ob-s1': '#0d0d0d',
      '--ob-s2': '#141414',
      '--ob-raised': '#1c1c1c',
      '--ob-text': '#ffffff',
      '--ob-text-2': '#a1a1aa',
      '--ob-muted': '#71717a',
      '--ob-dim': '#52525b',
      '--ob-line': 'rgba(255, 255, 255, 0.08)',
      '--ob-line-strong': 'rgba(255, 255, 255, 0.15)',
      '--ob-grid': 'rgba(255, 255, 255, 0.05)',
      '--ob-gold': '#f4f4f5',
      '--ob-gold-bright': '#ffffff',
      '--ob-gold-muted': '#71717a',
      '--ob-gold-wash': 'rgba(244, 244, 245, 0.1)',
      '--ob-gold-wash-faint': 'rgba(244, 244, 245, 0.04)',
      '--ob-on-gold': '#000000',
      '--ob-cell-miss': '#27272a',
      '--ob-cell-future': '#18181b',
      '--ob-track': '#27272a',
      '--ob-bar': '#71717a',
      '--ob-danger': '#f87171',
    },
  },
  {
    id: 'forest-emerald',
    name: 'Forest Moss',
    category: 'dark',
    description: 'Earthy evergreen sanctuary with vibrant emerald highlights.',
    previewColors: ['#07100b', '#34d399', '#0d1f16'],
    variables: {
      '--ob-canvas': '#060d09',
      '--ob-sidebar': '#09140e',
      '--ob-s1': '#0d1c14',
      '--ob-s2': '#12261b',
      '--ob-raised': '#173023',
      '--ob-text': '#ecfdf5',
      '--ob-text-2': '#a7f3d0',
      '--ob-muted': '#6ee7b7',
      '--ob-dim': '#4ade80',
      '--ob-line': 'rgba(52, 211, 153, 0.1)',
      '--ob-line-strong': 'rgba(52, 211, 153, 0.2)',
      '--ob-grid': 'rgba(52, 211, 153, 0.04)',
      '--ob-gold': '#10b981',
      '--ob-gold-bright': '#34d399',
      '--ob-gold-muted': '#059669',
      '--ob-gold-wash': 'rgba(16, 185, 129, 0.12)',
      '--ob-gold-wash-faint': 'rgba(16, 185, 129, 0.04)',
      '--ob-on-gold': '#02180f',
      '--ob-cell-miss': '#1a3023',
      '--ob-cell-future': '#0d1c14',
      '--ob-track': '#1a3023',
      '--ob-bar': '#34d399',
      '--ob-danger': '#f87171',
    },
  },
  {
    id: 'tokyo-cyberpunk',
    name: 'Tokyo Neon',
    category: 'colorful',
    description: 'Futuristic synthwave with neon magenta and ultraviolet energy.',
    previewColors: ['#0d0814', '#f43f5e', '#1c102b'],
    variables: {
      '--ob-canvas': '#09050f',
      '--ob-sidebar': '#0e0817',
      '--ob-s1': '#140c21',
      '--ob-s2': '#1b102b',
      '--ob-raised': '#241538',
      '--ob-text': '#fdf2f8',
      '--ob-text-2': '#f472b6',
      '--ob-muted': '#c084fc',
      '--ob-dim': '#9333ea',
      '--ob-line': 'rgba(244, 63, 94, 0.15)',
      '--ob-line-strong': 'rgba(244, 63, 94, 0.25)',
      '--ob-grid': 'rgba(192, 132, 252, 0.05)',
      '--ob-gold': '#f43f5e',
      '--ob-gold-bright': '#fb7185',
      '--ob-gold-muted': '#be123c',
      '--ob-gold-wash': 'rgba(244, 63, 94, 0.15)',
      '--ob-gold-wash-faint': 'rgba(244, 63, 94, 0.05)',
      '--ob-on-gold': '#18040a',
      '--ob-cell-miss': '#2c1538',
      '--ob-cell-future': '#170b21',
      '--ob-track': '#2c1538',
      '--ob-bar': '#f472b6',
      '--ob-danger': '#e11d48',
    },
  },
  {
    id: 'solarized-amber',
    name: 'Solarized Amber',
    category: 'dark',
    description: 'Warm espresso and vintage amber reminiscent of analog terminals.',
    previewColors: ['#120d0a', '#f59e0b', '#211812'],
    variables: {
      '--ob-canvas': '#0e0a07',
      '--ob-sidebar': '#130e0b',
      '--ob-s1': '#1a130f',
      '--ob-s2': '#221914',
      '--ob-raised': '#2c201a',
      '--ob-text': '#fef3c7',
      '--ob-text-2': '#d97706',
      '--ob-muted': '#92400e',
      '--ob-dim': '#78350f',
      '--ob-line': 'rgba(245, 158, 11, 0.12)',
      '--ob-line-strong': 'rgba(245, 158, 11, 0.22)',
      '--ob-grid': 'rgba(245, 158, 11, 0.05)',
      '--ob-gold': '#f59e0b',
      '--ob-gold-bright': '#fbbf24',
      '--ob-gold-muted': '#b45309',
      '--ob-gold-wash': 'rgba(245, 158, 11, 0.12)',
      '--ob-gold-wash-faint': 'rgba(245, 158, 11, 0.04)',
      '--ob-on-gold': '#180d04',
      '--ob-cell-miss': '#2e1e14',
      '--ob-cell-future': '#1c130c',
      '--ob-track': '#2e1e14',
      '--ob-bar': '#d97706',
      '--ob-danger': '#ef4444',
    },
  },
  {
    id: 'matrix-terminal',
    name: 'Matrix Hacker',
    category: 'dark',
    description: 'Phosphor green CRT terminal for deep focus and monk mode.',
    previewColors: ['#050a06', '#22c55e', '#0d1a0f'],
    variables: {
      '--ob-canvas': '#040805',
      '--ob-sidebar': '#060d08',
      '--ob-s1': '#0a140d',
      '--ob-s2': '#0f1f14',
      '--ob-raised': '#14291a',
      '--ob-text': '#dcfce7',
      '--ob-text-2': '#86efac',
      '--ob-muted': '#4ade80',
      '--ob-dim': '#22c55e',
      '--ob-line': 'rgba(34, 197, 94, 0.12)',
      '--ob-line-strong': 'rgba(34, 197, 94, 0.25)',
      '--ob-grid': 'rgba(34, 197, 94, 0.05)',
      '--ob-gold': '#22c55e',
      '--ob-gold-bright': '#4ade80',
      '--ob-gold-muted': '#15803d',
      '--ob-gold-wash': 'rgba(34, 197, 94, 0.12)',
      '--ob-gold-wash-faint': 'rgba(34, 197, 94, 0.04)',
      '--ob-on-gold': '#021205',
      '--ob-cell-miss': '#16291b',
      '--ob-cell-future': '#0b170e',
      '--ob-track': '#16291b',
      '--ob-bar': '#22c55e',
      '--ob-danger': '#ef4444',
    },
  },
  {
    id: 'paper-ivory',
    name: 'Paper & Ink (Light)',
    category: 'light',
    description: 'Warm cream, textured paper, and deep ink. Zero eye strain in daylight.',
    previewColors: ['#f8f6f0', '#1c1917', '#ede9df'],
    variables: {
      '--ob-canvas': '#f8f6f0',
      '--ob-sidebar': '#f1ede4',
      '--ob-s1': '#eae4d8',
      '--ob-s2': '#e2dcce',
      '--ob-raised': '#ffffff',
      '--ob-text': '#1c1917',
      '--ob-text-2': '#44403c',
      '--ob-muted': '#78716c',
      '--ob-dim': '#a8a29e',
      '--ob-line': 'rgba(28, 25, 23, 0.08)',
      '--ob-line-strong': 'rgba(28, 25, 23, 0.15)',
      '--ob-grid': 'rgba(28, 25, 23, 0.04)',
      '--ob-gold': '#1c1917', // Stark ink black
      '--ob-gold-bright': '#292524',
      '--ob-gold-muted': '#78716c',
      '--ob-gold-wash': 'rgba(28, 25, 23, 0.08)',
      '--ob-gold-wash-faint': 'rgba(28, 25, 23, 0.03)',
      '--ob-on-gold': '#f8f6f0',
      '--ob-cell-miss': '#d6cfc2',
      '--ob-cell-future': '#ede7db',
      '--ob-track': '#d6cfc2',
      '--ob-bar': '#57534e',
      '--ob-danger': '#dc2626',
    },
  },
  {
    id: 'lavender-dusk',
    name: 'Lavender Dusk',
    category: 'dark',
    description: 'Soft twilight tones with soothing lavender highlights.',
    previewColors: ['#0f0e17', '#a78bfa', '#1a1829'],
    variables: {
      '--ob-canvas': '#0b0a12',
      '--ob-sidebar': '#100f1a',
      '--ob-s1': '#171524',
      '--ob-s2': '#1e1c30',
      '--ob-raised': '#26243d',
      '--ob-text': '#f5f3ff',
      '--ob-text-2': '#c4b5fd',
      '--ob-muted': '#8b5cf6',
      '--ob-dim': '#7c3aed',
      '--ob-line': 'rgba(167, 139, 250, 0.12)',
      '--ob-line-strong': 'rgba(167, 139, 250, 0.22)',
      '--ob-grid': 'rgba(167, 139, 250, 0.04)',
      '--ob-gold': '#a78bfa',
      '--ob-gold-bright': '#c4b5fd',
      '--ob-gold-muted': '#7c3aed',
      '--ob-gold-wash': 'rgba(167, 139, 250, 0.12)',
      '--ob-gold-wash-faint': 'rgba(167, 139, 250, 0.04)',
      '--ob-on-gold': '#0e0a1f',
      '--ob-cell-miss': '#25213b',
      '--ob-cell-future': '#151324',
      '--ob-track': '#25213b',
      '--ob-bar': '#8b5cf6',
      '--ob-danger': '#f43f5e',
    },
  },
];

export const THEME_STORAGE_KEY = 'routinix_active_theme_id';
export const LEGACY_THEME_STORAGE_KEY = 'apex_active_theme_id';

import { db } from './db';

export function applyTheme(themeId: string) {
  const theme = THEMES.find((t) => t.id === themeId) || THEMES[0];
  const root = document.documentElement;

  Object.entries(theme.variables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme.id);
    db.settings.put({ key: 'activeThemeId', value: theme.id }).catch(() => {});
  } catch (e) {}
}

export function getSavedThemeId(): string {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) || localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
    if (saved && saved !== 'obsidian-gold' && THEMES.some((t) => t.id === saved)) {
      return saved;
    }
  } catch (e) {
    // fallback
  }
  return THEMES[0].id;
}
