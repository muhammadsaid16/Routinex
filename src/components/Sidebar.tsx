import React from 'react';
import { Settings, Palette } from 'lucide-react';
import { getInitials } from '../storage';
import { sound } from '../audio';
import { THEMES } from '../themes';
import { AppModule, MODULES, NavTab, navFor } from '../navigation';
import { BrandMark } from './BrandMark';

export type { NavTab };

interface SidebarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onModuleChange: (module: AppModule) => void;
  consistencyPercentage: number;
  onOpenTheme: () => void;
  userName?: string;
  showMilestones?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  onModuleChange,
  consistencyPercentage,
  onOpenTheme,
  userName = 'Operator',
  showMilestones = true,
}) => {
  const initials = getInitials(userName);
  const activeModule: AppModule =
    currentTab === 'money' || currentTab === 'transactions' || currentTab === 'budgets'
      ? 'money'
      : 'habits';
  const navItems = navFor(activeModule, showMilestones);

  return (
    <>
      {/* Desktop Fixed Left Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[224px] flex-col justify-between border-r border-ob-line bg-ob-sidebar px-4 py-6 lg:flex">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-2.5 px-3 py-2 cursor-pointer" onClick={() => onTabChange('dashboard')}>
            <BrandMark className="w-7 h-7" />
            <div className="font-bold tracking-widest text-sm text-ob-text uppercase">
              Ledger
            </div>
          </div>

          {/* Module Switcher */}
          <div className="mt-6">
            <div className="text-[10px] uppercase tracking-wider text-ob-dim font-medium px-1 mb-2">
              Module
            </div>
            <div className="flex gap-1 p-1 rounded-xl bg-ob-s1 border border-ob-line">
              {MODULES.map((module) => {
                const Icon = module.icon;
                const isActive = module.id === activeModule;
                return (
                  <button
                    key={module.id}
                    onClick={() => {
                      sound.playClick();
                      onModuleChange(module.id);
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
                      isActive
                        ? 'bg-ob-raised text-ob-gold shadow-sm'
                        : 'text-ob-dim hover:text-ob-text'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {module.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nav Items */}
          <nav className="mt-5 flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                    isActive
                      ? 'bg-ob-raised text-ob-gold font-semibold shadow-sm'
                      : 'text-ob-dim hover:text-ob-text hover:bg-ob-s1'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-ob-gold' : 'text-ob-dim'}`} />
                  {item.label}
                </button>
              );
            })}

            <button
              onClick={onOpenTheme}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13px] font-medium text-ob-dim hover:text-ob-gold hover:bg-ob-s1 transition-colors mt-2"
            >
              <Palette className="w-4 h-4 text-ob-gold" />
              <span>Themes ({THEMES.length})</span>
            </button>
          </nav>
        </div>

        {/* Consistency summary & Account trigger */}
        <div className="flex flex-col gap-4 border-t border-ob-line pt-4 px-2">
          <div className="rounded-lg bg-ob-s1 p-3 border border-ob-line">
            <div className="text-[11px] uppercase tracking-wider text-ob-dim font-medium">30-day rate</div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-ob-gold">{consistencyPercentage}%</span>
              <span className="text-[11px] text-ob-muted">consistent</span>
            </div>
            <div className="w-full bg-ob-track h-1 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-ob-gold h-full rounded-full transition-all duration-500"
                style={{ width: `${consistencyPercentage}%` }}
              />
            </div>
          </div>

          <button
            onClick={() => onTabChange('account')}
            className={`flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
              currentTab === 'account' ? 'bg-ob-raised text-ob-gold' : 'hover:bg-ob-s1 text-ob-text'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-ob-raised border border-ob-line-strong flex items-center justify-center text-xs font-semibold text-ob-gold shrink-0">
                {initials}
              </div>
              <div className="text-xs font-medium truncate max-w-[105px]">{userName}</div>
            </div>
            <Settings className="w-4 h-4 text-ob-dim shrink-0" />
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <div className="sticky top-0 z-30 flex h-[56px] w-full items-center justify-between border-b border-ob-line bg-ob-sidebar px-4 lg:hidden">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onTabChange('dashboard')}>
          <BrandMark className="w-7 h-7" />
          <span className="font-bold tracking-widest text-sm text-ob-text">LEDGER</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5 p-0.5 rounded-lg border border-ob-line bg-ob-s1">
            {MODULES.map((module) => {
              const Icon = module.icon;
              const isActive = module.id === activeModule;
              return (
                <button
                  key={module.id}
                  onClick={() => {
                    sound.playClick();
                    onModuleChange(module.id);
                  }}
                  className={`p-1.5 rounded-md transition-colors ${
                    isActive ? 'bg-ob-raised text-ob-gold' : 'text-ob-dim'
                  }`}
                  title={module.label}
                  aria-label={module.label}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>
          <button
            onClick={onOpenTheme}
            className="p-1.5 rounded-lg border border-ob-line bg-ob-s1 text-ob-gold hover:bg-ob-raised transition-colors"
            title="Switch Theme"
          >
            <Palette className="w-4 h-4" />
          </button>
          <button
            onClick={() => onTabChange('account')}
            className="w-8 h-8 rounded-full bg-ob-raised border border-ob-line flex items-center justify-center text-xs font-semibold text-ob-gold hover:border-ob-gold transition-colors"
            title={userName}
          >
            {initials}
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ob-line bg-ob-sidebar pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div
          className="grid h-[56px] w-full mx-auto px-0.5"
          style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`relative flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
                  isActive ? 'text-ob-gold font-semibold' : 'text-ob-dim hover:text-ob-text'
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 h-[2px] w-6 rounded-b-full bg-ob-gold" />
                )}
                <Icon className="w-4 h-4" />
                <span className="truncate max-w-full px-0.5">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
