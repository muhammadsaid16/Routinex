import React, { useMemo, useState } from 'react';
import { PiggyBank, Check } from 'lucide-react';
import { CategoryIcon } from '../money/icons';
import {
  CURRENCIES,
  MoneyBudget,
  MoneyTransaction,
  formatMoney,
  getCategory,
  getCurrency,
  MONEY_CATEGORIES,
} from '../money/types';
import { calculateBudgetLines, getMonthString } from '../money/storage';
import { sound } from '../audio';

interface BudgetsViewProps {
  budgets: MoneyBudget[];
  transactions: MoneyTransaction[];
  onSaveBudgets: (budgets: MoneyBudget[]) => void;
}

export const BudgetsView: React.FC<BudgetsViewProps> = ({
  budgets,
  transactions,
  onSaveBudgets,
}) => {
  const [month, setMonth] = useState<string>(() => getMonthString());
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const currency = getCurrency();

  const lines = useMemo(
    () => calculateBudgetLines(transactions, budgets, month),
    [transactions, budgets, month]
  );

  const limitOf = (category: string): number =>
    drafts[category] !== undefined
      ? parseFloat(drafts[category].replace(',', '.')) || 0
      : (budgets.find((b) => b.month === month && b.category === category)?.limit ?? 0) / 100;

  const setLimit = (category: string, value: string) => {
    setDrafts((prev) => ({ ...prev, [category]: value }));
  };

  const commit = (category: string) => {
    const value = drafts[category];
    if (value === undefined) return;

    const cents = Math.round((parseFloat(value.replace(',', '.')) || 0) * 100);
    const id = `${month}:${category}`;
    const existing = budgets.find((b) => b.id === id);
    const next = existing
      ? budgets.map((b) => (b.id === id ? { ...b, limit: cents } : b))
      : [...budgets, { id, month, category, limit: cents }];

    onSaveBudgets(next);
    setDrafts((prev) => {
      const copy = { ...prev };
      delete copy[category];
      return copy;
    });
    sound.playClick();
  };

  const totalLimit = lines.reduce((sum, line) => sum + line.limit, 0);
  const totalSpent = lines.reduce((sum, line) => sum + line.spent, 0);

  const shiftMonth = (delta: number) => {
    const [year, m] = month.split('-').map(Number);
    const date = new Date(year, m - 1 + delta, 1);
    setMonth(date.toISOString().slice(0, 7));
    setDrafts({});
  };

  const monthLabel = (() => {
    const [year, m] = month.split('-').map(Number);
    return new Date(year, m - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  })();

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200">
      <div className="border-b border-ob-line pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-ob-gold text-xs font-semibold uppercase tracking-wider mb-1">
            <PiggyBank className="w-3.5 h-3.5" />
            <span>Money Module</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ob-text">Budgets</h1>
          <p className="text-xs text-ob-dim mt-1">
            One limit per category per month. {formatMoney(totalSpent, currency)} of{' '}
            {formatMoney(totalLimit, currency)} used.
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-ob-s1 border border-ob-line px-1 py-1 shrink-0">
          <button
            onClick={() => shiftMonth(-1)}
            className="px-2 py-1 text-xs font-semibold text-ob-dim hover:text-ob-text transition-colors"
          >
            ←
          </button>
          <span className="text-xs font-semibold text-ob-text px-1 whitespace-nowrap">{monthLabel}</span>
          <button
            onClick={() => shiftMonth(1)}
            className="px-2 py-1 text-xs font-semibold text-ob-dim hover:text-ob-text transition-colors"
          >
            →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {MONEY_CATEGORIES.filter((c) => c.kind === 'expense').map((category) => {
          const line = lines.find((l) => l.category === category.id);
          const spent = line?.spent || 0;
          const limit = limitOf(category.id);
          const hasLimit = limit > 0;
          const percent = hasLimit ? Math.min(100, Math.round((spent / (limit * 100)) * 100)) : 0;
          const limitCents = Math.round(limit * 100);

          return (
            <div key={category.id} className="rounded-2xl bg-ob-sidebar border border-ob-line p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <CategoryIcon
                    category={category.id}
                    className="w-4 h-4 text-ob-dim shrink-0"
                  />
                  <span className="text-sm font-semibold text-ob-text truncate">{category.label}</span>
                </div>
                {hasLimit && (
                  <span
                    className={`text-[11px] font-mono shrink-0 ${
                      (line?.over ?? false) ? 'text-rose-400 font-semibold' : 'text-ob-dim'
                    }`}
                  >
                    {formatMoney(spent, currency)} / {formatMoney(limitCents, currency)}
                  </span>
                )}
              </div>

              {hasLimit && (
                <div className="w-full bg-ob-track h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      line?.over ? 'bg-rose-500' : 'bg-ob-gold'
                    }`}
                    style={{ width: `${Math.max(2, percent)}%` }}
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 rounded-lg bg-ob-s1 border border-ob-line px-3 py-2 focus-within:border-ob-gold">
                  <span className="text-xs text-ob-dim">
                    {CURRENCIES.find((c) => c.code === currency)?.symbol}
                  </span>
                  <input
                    value={drafts[category.id] !== undefined ? drafts[category.id] : hasLimit ? String(limit) : ''}
                    onChange={(e) => setLimit(category.id, e.target.value)}
                    onBlur={() => commit(category.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commit(category.id);
                    }}
                    inputMode="decimal"
                    placeholder="No limit"
                    className="flex-1 bg-transparent text-xs font-mono text-ob-text outline-none placeholder:text-ob-muted"
                  />
                </div>
                {drafts[category.id] !== undefined && (
                  <button
                    onClick={() => commit(category.id)}
                    className="p-2 rounded-lg bg-ob-gold text-ob-on-gold hover:bg-ob-gold-bright transition-colors"
                    title="Save the limit"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
