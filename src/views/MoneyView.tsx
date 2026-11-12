import React, { useMemo, useState } from 'react';
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  Scale,
  PiggyBank,
  Plus,
  ChevronRight,
  Repeat,
} from 'lucide-react';
import {
  MoneyAccount,
  MoneyBudget,
  MoneyTransaction,
  formatMoney,
  getCategory,
  getCurrency,
  setCurrency,
  CURRENCIES,
} from '../money/types';
import {
  BudgetLine,
  HabitCost,
  MonthSummary,
  accountBalance,
  calculateBudgetLines,
  calculateCategoryTotals,
  calculateHabitCost,
  calculateMonthSummary,
} from '../money/storage';
import { Habit, HabitEntry } from '../types';
import { sound } from '../audio';
import { AccountModal } from '../components/AccountModal';

interface MoneyViewProps {
  accounts: MoneyAccount[];
  transactions: MoneyTransaction[];
  budgets: MoneyBudget[];
  habits: Habit[];
  entries: HabitEntry[];
  onOpenTransactions: () => void;
  onOpenBudgets: () => void;
  onAddAccount: (account: MoneyAccount) => void;
}

export const MoneyView: React.FC<MoneyViewProps> = ({
  accounts,
  transactions,
  budgets,
  habits,
  entries,
  onOpenTransactions,
  onOpenBudgets,
  onAddAccount,
}) => {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [currency, setCurrencyState] = useState<string>(getCurrency());
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  const summary: MonthSummary = useMemo(
    () => calculateMonthSummary(transactions, month),
    [transactions, month]
  );
  const budgetLines: BudgetLine[] = useMemo(
    () => calculateBudgetLines(transactions, budgets, month),
    [transactions, budgets, month]
  );
  const categoryTotals = useMemo(
    () => calculateCategoryTotals(transactions, month),
    [transactions, month]
  );
  const habitCosts: HabitCost[] = useMemo(
    () => calculateHabitCost(transactions, habits, entries, month),
    [transactions, habits, entries, month]
  );

  const totalLimit = budgetLines.reduce((sum, line) => sum + line.limit, 0);
  const totalSpent = budgetLines.reduce((sum, line) => sum + line.spent, 0);

  const recent = useMemo(
    () =>
      [...transactions]
        .filter((t) => t.date.startsWith(month))
        .sort((a, b) => (a.date === b.date ? b.id.localeCompare(a.id) : b.date.localeCompare(a.date)))
        .slice(0, 5),
    [transactions, month]
  );

  const shiftMonth = (delta: number) => {
    const [year, m] = month.split('-').map(Number);
    const date = new Date(year, m - 1 + delta, 1);
    setMonth(date.toISOString().slice(0, 7));
  };

  /** A date for the record: today, yesterday or a plain date. */
function formatDay(date: string): string {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate()
  ).padStart(2, '0')}`;
  if (date === todayStr) return 'Today';

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(yesterday.getDate()).padStart(2, '0')}`;
  if (date === yesterdayStr) return 'Yesterday';

  const [year, month, day] = date.split('-').map(Number);
  if (!year || !month || !day) return date;
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const monthLabel = (() => {
    const [year, m] = month.split('-').map(Number);
    return new Date(year, m - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  })();

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="border-b border-ob-line pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-ob-gold text-xs font-semibold uppercase tracking-wider mb-1">
            <Wallet className="w-3.5 h-3.5" />
            <span>Money Module</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ob-text">
            Where The Money Goes
          </h1>
          <p className="text-xs text-ob-dim mt-1">
            Every movement is kept on the device. Link the spending to a habit and the app shows
            what one session really costs.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select
            value={currency}
            onChange={(e) => {
              setCurrency(e.target.value);
              setCurrencyState(e.target.value);
            }}
            className="bg-ob-s1 border border-ob-line px-2.5 py-1.5 text-xs font-semibold text-ob-text rounded-lg outline-none focus:border-ob-gold"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.symbol} {c.code}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-1 rounded-lg bg-ob-s1 border border-ob-line px-1 py-1">
            <button
              onClick={() => shiftMonth(-1)}
              className="px-2 py-1 text-xs font-semibold text-ob-dim hover:text-ob-text transition-colors"
            >
              ←
            </button>
            <span className="text-xs font-semibold text-ob-text px-1 whitespace-nowrap">
              {monthLabel}
            </span>
            <button
              onClick={() => shiftMonth(1)}
              className="px-2 py-1 text-xs font-semibold text-ob-dim hover:text-ob-text transition-colors"
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-ob-sidebar border border-ob-line p-5 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Income</span>
          </div>
          <div className="text-2xl font-bold text-ob-text font-mono">
            {formatMoney(summary.income, currency)}
          </div>
        </div>

        <div className="rounded-2xl bg-ob-sidebar border border-ob-line p-5 shadow-sm">
          <div className="flex items-center gap-2 text-rose-400 mb-2">
            <TrendingDown className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Spent</span>
          </div>
          <div className="text-2xl font-bold text-ob-text font-mono">
            {formatMoney(summary.spent, currency)}
          </div>
        </div>

        <div className="rounded-2xl bg-ob-sidebar border border-ob-line p-5 shadow-sm">
          <div className="flex items-center gap-2 text-ob-gold mb-2">
            <Scale className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Net</span>
          </div>
          <div
            className={`text-2xl font-bold font-mono ${
              summary.net >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatMoney(summary.net, currency)}
          </div>
          <p className="text-[11px] text-ob-dim mt-1">
            {summary.transactionCount} movement{summary.transactionCount === 1 ? '' : 's'} this month
          </p>
        </div>
      </div>

      {/* Accounts */}
      <div className="rounded-2xl bg-ob-sidebar border border-ob-line p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-sm font-bold text-ob-text">Accounts</h2>
          <button
            onClick={() => {
              sound.playClick();
              setIsAccountModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-ob-line bg-ob-s1 text-ob-dim hover:text-ob-gold hover:border-ob-gold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add account
          </button>
        </div>

        {accounts.filter((a) => !a.archived).length === 0 ? (
          <p className="text-xs text-ob-dim">
            No account yet. Add the cash, the bank and the card you use, then start recording.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {accounts
              .filter((a) => !a.archived)
              .map((account) => (
                <div key={account.id} className="rounded-xl bg-ob-s1 border border-ob-line px-4 py-3">
                  <div className="text-[10px] uppercase tracking-wider text-ob-dim">{account.type}</div>
                  <div className="text-sm font-semibold text-ob-text mt-0.5 truncate">{account.name}</div>
                  <div className="text-lg font-bold font-mono text-ob-gold mt-1">
                    {formatMoney(accountBalance(account, transactions), currency)}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Budgets */}
        <div className="rounded-2xl bg-ob-sidebar border border-ob-line p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-ob-text">Budget</h2>
              <p className="text-[11px] text-ob-dim mt-0.5">
                {budgetLines.length > 0
                  ? `${formatMoney(totalSpent, currency)} of ${formatMoney(totalLimit, currency)} used`
                  : 'No limit set for this month'}
              </p>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                onOpenBudgets();
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-ob-dim hover:text-ob-gold transition-colors"
            >
              <PiggyBank className="w-3.5 h-3.5" />
              Manage
            </button>
          </div>

          {budgetLines.length === 0 ? (
            <p className="text-xs text-ob-dim">
              Set a limit per category and the app keeps the burn down for you.
            </p>
          ) : (
            <div className="space-y-3">
              {budgetLines.map((line) => {
                const category = getCategory(line.category);
                return (
                  <div key={line.category}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-ob-text font-medium">{category.label}</span>
                      <span
                        className={`font-mono ${
                          line.over ? 'text-rose-400 font-semibold' : 'text-ob-dim'
                        }`}
                      >
                        {formatMoney(line.spent, currency)} / {formatMoney(line.limit, currency)}
                      </span>
                    </div>
                    <div className="w-full bg-ob-track h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          line.over ? 'bg-rose-500' : 'bg-ob-gold'
                        }`}
                        style={{ width: `${Math.max(2, line.percent)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Categories */}
        <div className="rounded-2xl bg-ob-sidebar border border-ob-line p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-ob-text">Where it went</h2>
          {categoryTotals.length === 0 ? (
            <p className="text-xs text-ob-dim">Nothing recorded this month yet.</p>
          ) : (
            <div className="space-y-2.5">
              {categoryTotals.slice(0, 6).map((entry) => {
                const category = getCategory(entry.category);
                const max = categoryTotals[0].spent || 1;
                return (
                  <div key={entry.category}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-ob-text font-medium">{category.label}</span>
                      <span className="font-mono text-ob-dim">
                        {formatMoney(entry.spent, currency)}
                      </span>
                    </div>
                    <div className="w-full bg-ob-track h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-ob-gold transition-all duration-500"
                        style={{ width: `${Math.max(3, (entry.spent / max) * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* The cost of a habit */}
      {habitCosts.length > 0 && (
        <div className="rounded-2xl bg-ob-sidebar border border-ob-line p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Repeat className="w-4 h-4 text-ob-gold" />
            <h2 className="text-sm font-bold text-ob-text">What a habit costs</h2>
          </div>
          <div className="space-y-2">
            {habitCosts.map((cost) => (
              <div
                key={cost.habitId}
                className="flex items-center justify-between gap-3 rounded-xl bg-ob-s1 border border-ob-line px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-ob-text truncate">{cost.title}</div>
                  <div className="text-[11px] text-ob-dim">
                    {cost.sessions} session{cost.sessions === 1 ? '' : 's'} ·{' '}
                    {formatMoney(cost.spent, currency)} spent
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-base font-bold font-mono text-ob-gold">
                    {formatMoney(cost.perSession, currency)}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-ob-dim">per session</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent movements */}
      <div className="rounded-2xl bg-ob-sidebar border border-ob-line p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-ob-text">Recent movements</h2>
          <button
            onClick={() => {
              sound.playClick();
              onOpenTransactions();
            }}
            className="inline-flex items-center gap-1 text-xs font-semibold text-ob-dim hover:text-ob-gold transition-colors"
          >
            All transactions
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recent.length === 0 ? (
          <p className="text-xs text-ob-dim">Nothing recorded this month yet.</p>
        ) : (
          <div className="space-y-1.5">
            {recent.map((transaction) => {
              const category = getCategory(transaction.category);
              const account = accounts.find((a) => a.id === transaction.accountId);
              return (
                <div
                  key={transaction.id}
                  className="flex items-center gap-3 rounded-lg bg-ob-s1 border border-ob-line px-3 py-2.5"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold uppercase shrink-0 ${category.color}`}
                  >
                    {category.label.slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-ob-text truncate">
                      {transaction.note || category.label}
                    </div>
                    <div className="text-[10px] text-ob-dim">
                      {formatDay(transaction.date)} · {account?.name || 'No account'}
                    </div>
                  </div>
                  <div
                    className={`text-sm font-bold font-mono shrink-0 ${
                      transaction.amount < 0 ? 'text-ob-text' : 'text-emerald-400'
                    }`}
                  >
                    {formatMoney(transaction.amount, currency)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onSave={(account) => {
          onAddAccount(account);
          setIsAccountModalOpen(false);
          sound.playComplete();
        }}
      />
    </div>
  );
};
