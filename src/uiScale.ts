import { db } from './db';
import { syncManager } from './sync/syncManager';

export type UIScaleOption = 'compact' | 'normal' | 'large' | 'spacious';

export interface UIScaleConfig {
  id: UIScaleOption;
  label: string;
  percentage: string;
  rootFontSize: string; // CSS percentage applied to <html>
  cellStandard: string;
  cellMicro: string;
}

export const UI_SCALES: Record<UIScaleOption, UIScaleConfig> = {
  compact: {
    id: 'compact',
    label: 'Compact',
    percentage: '90%',
    rootFontSize: '90%',
    cellStandard: '21px',
    cellMicro: '10px',
  },
  normal: {
    id: 'normal',
    label: 'Default',
    percentage: '100%',
    rootFontSize: '100%',
    cellStandard: '24px',
    cellMicro: '12px',
  },
  large: {
    id: 'large',
    label: 'Comfortable',
    percentage: '112%',
    rootFontSize: '112%',
    cellStandard: '27px',
    cellMicro: '13.5px',
  },
  spacious: {
    id: 'spacious',
    label: 'Spacious (Large)',
    percentage: '125%',
    rootFontSize: '125%',
    cellStandard: '31px',
    cellMicro: '15px',
  },
};

const UI_SCALE_KEY = 'routinix_ui_scale_v1';
const LEGACY_UI_SCALE_KEY = 'apex_ui_scale_v1';

export function applyUIScale(scaleId: UIScaleOption) {
  const config = UI_SCALES[scaleId] || UI_SCALES.normal;
  const root = document.documentElement;

  // Set font-size on <html> which scales all Tailwind rem units (padding, margin, text, icons)
  root.style.fontSize = config.rootFontSize;

  // Set cell size custom property
  root.style.setProperty('--sys-cell', config.cellStandard);
  root.style.setProperty('--sys-cell-micro', config.cellMicro);

  try {
    localStorage.setItem(UI_SCALE_KEY, scaleId);
    db.settings.put({ key: 'uiScale', value: scaleId }).catch(() => {});
  } catch (e) {
    // fallback
  }

  // Device sync: the paired device follows the same density.
  void syncManager.recordSetting('uiScale', scaleId);
}

export function getSavedUIScale(): UIScaleOption {
  try {
    const saved = localStorage.getItem(UI_SCALE_KEY) || localStorage.getItem(LEGACY_UI_SCALE_KEY);
    if (saved && saved in UI_SCALES) {
      return saved as UIScaleOption;
    }
  } catch (e) {
    // fallback
  }
  return 'normal';
}
