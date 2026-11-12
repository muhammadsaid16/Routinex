import React from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  BarChart3,
  Trophy,
  Bot,
  Wallet,
  Receipt,
  PiggyBank,
  Repeat,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'habits'
  | 'progress'
  | 'milestones'
  | 'coach'
  | 'account'
  | 'money'
  | 'transactions'
  | 'budgets';

export type AppModule = 'habits' | 'money';

export interface NavItem {
  id: NavTab;
  label: string;
  icon: React.ElementType;
}

/** The habits module. The milestones tab is hidden when the system is off. */
export const HABITS_NAV: NavItem[] = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'habits', label: 'Habits', icon: CheckSquare },
  { id: 'progress', label: 'Progress', icon: BarChart3 },
  { id: 'milestones', label: 'Milestones', icon: Trophy },
  { id: 'coach', label: 'Coach', icon: Bot },
];

/** The money module. */
export const MONEY_NAV: NavItem[] = [
  { id: 'money', label: 'Money', icon: Wallet },
  { id: 'transactions', label: 'Transactions', icon: Receipt },
  { id: 'budgets', label: 'Budgets', icon: Repeat },
];

export const MODULES: { id: AppModule; label: string; icon: React.ElementType }[] = [
  { id: 'habits', label: 'Habits', icon: CheckSquare },
  { id: 'money', label: 'Money', icon: Wallet },
];

export const moduleOf = (tab: NavTab): AppModule =>
  tab === 'money' || tab === 'transactions' || tab === 'budgets' ? 'money' : 'habits';

export const navFor = (module: AppModule, showMilestones: boolean): NavItem[] =>
  module === 'money'
    ? MONEY_NAV
    : HABITS_NAV.filter((item) => item.id !== 'milestones' || showMilestones);
