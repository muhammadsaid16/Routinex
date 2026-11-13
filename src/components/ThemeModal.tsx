import React, { useState } from 'react';
import { THEMES, ThemeColors } from '../themes';
import { Palette, Check, X, Sparkles, Moon, Sun, Smartphone } from 'lucide-react';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentThemeId: string;
  onSelectTheme: (id: string) => void;
}

export const ThemeModal: React.FC<ThemeModalProps> = ({
  isOpen,
  onClose,
  currentThemeId,
  onSelectTheme,
}) => {
  const [filter, setFilter] = useState<'all' | 'dark' | 'oled' | 'colorful' | 'light'>('all');

  if (!isOpen) return null;

  const filteredThemes = filter === 'all'
    ? THEMES
    : THEMES.filter((t) => t.category === filter);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-2xl border border-ob-line bg-ob-raised p-6 shadow-2xl space-y-6 animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ob-line pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-ob-gold/15 border border-ob-gold/30 flex items-center justify-center text-ob-gold">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ob-text">Theme Gallery</h2>
              <p className="text-xs text-ob-dim">
                Choose from {THEMES.length} palettes, every one checked for contrast
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ob-dim hover:text-ob-text hover:bg-ob-s1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-ob-gold text-ob-on-gold font-semibold shadow-sm'
                : 'bg-ob-s1 text-ob-dim hover:text-ob-text'
            }`}
          >
            All ({THEMES.length})
          </button>
          <button
            onClick={() => setFilter('dark')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filter === 'dark'
                ? 'bg-ob-gold text-ob-on-gold font-semibold shadow-sm'
                : 'bg-ob-s1 text-ob-dim hover:text-ob-text'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Dark</span>
          </button>
          <button
            onClick={() => setFilter('oled')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filter === 'oled'
                ? 'bg-ob-gold text-ob-on-gold font-semibold shadow-sm'
                : 'bg-ob-s1 text-ob-dim hover:text-ob-text'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Pure OLED</span>
          </button>
          <button
            onClick={() => setFilter('colorful')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filter === 'colorful'
                ? 'bg-ob-gold text-ob-on-gold font-semibold shadow-sm'
                : 'bg-ob-s1 text-ob-dim hover:text-ob-text'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Vibrant</span>
          </button>
          <button
            onClick={() => setFilter('light')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filter === 'light'
                ? 'bg-ob-gold text-ob-on-gold font-semibold shadow-sm'
                : 'bg-ob-s1 text-ob-dim hover:text-ob-text'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Paper / Light</span>
          </button>
        </div>

        {/* Theme Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto pr-1">
          {filteredThemes.map((theme) => {
            const isSelected = theme.id === currentThemeId;
            return (
              <div
                key={theme.id}
                onClick={() => onSelectTheme(theme.id)}
                className={`group relative rounded-xl border p-4 text-left cursor-pointer transition-all ${
                  isSelected
                    ? 'border-ob-gold bg-ob-gold/5 shadow-md ring-1 ring-ob-gold'
                    : 'border-ob-line bg-ob-s1 hover:border-ob-line-strong hover:bg-ob-s2'
                }`}
              >
                {/* Color preview swatch strip */}
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-5 h-5 rounded-full border border-white/20 shadow-inner flex items-center justify-center"
                    style={{ backgroundColor: theme.previewColors[0] }}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: theme.previewColors[1] }}
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    {theme.previewColors.map((c, i) => (
                      <span
                        key={i}
                        className="w-3.5 h-3.5 rounded-full border border-black/20"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-semibold text-ob-text group-hover:text-ob-gold transition-colors">
                    {theme.name}
                  </div>
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-ob-gold text-ob-on-gold flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-ob-dim leading-snug line-clamp-2">
                  {theme.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-ob-line pt-3 flex items-center justify-between text-xs text-ob-dim">
          <span>Themes are saved automatically in your local storage.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-ob-gold text-ob-on-gold font-semibold hover:bg-ob-gold-bright transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
