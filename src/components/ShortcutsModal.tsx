import React from 'react';
import { Keyboard, X } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space', desc: 'Toggle completion of selected habit' },
    { key: 'J / ↓', desc: 'Navigate to next habit' },
    { key: 'K / ↑', desc: 'Navigate to previous habit' },
    { key: 'T', desc: 'Jump back to Today’s date' },
    { key: '1 - 5', desc: 'Switch tabs (1: Overview, 2: Habits, 3: Progress, 4: Milestones, 5: Coach)' },
    { key: 'M', desc: 'Open Theme Gallery' },
    { key: '?', desc: 'Show this keyboard shortcuts guide' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl border border-ob-line bg-ob-raised p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-ob-line pb-3">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-ob-gold" />
            <h2 className="text-base font-bold text-ob-text">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-ob-dim hover:text-ob-text hover:bg-ob-s1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2.5">
          {shortcuts.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between text-xs py-1.5 border-b border-ob-line/40 last:border-0"
            >
              <span className="text-ob-dim">{item.desc}</span>
              <kbd className="px-2 py-1 rounded bg-ob-s1 border border-ob-line font-mono font-semibold text-ob-gold text-[11px] shadow-sm">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-2 text-center">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-lg bg-ob-s1 border border-ob-line text-xs font-semibold text-ob-text hover:bg-ob-s2 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
