import React, { useMemo, useState } from 'react';
import { Receipt, Plus, Wallet, Filter } from 'lucide-react';
import {
  MoneyAccount,
  MoneyTransaction,
  formatMoney,
  getCategory,
  getCurrency,
  CATEGORY_BY_ID,
  MONEY_CATEGORIES,
} from '../money/types';
import { TransactionModal } from '../components/TransactionModal';
import { Habit } from '../types';
import { sound } from '../audio';

interface TransactionsViewProps {
  accounts: MoneyAccount[];
  transactions: MoneyTransaction[];
  habits: Habit[];
  onSaveTransaction: (transaction: MoneyTransaction) => void;
  onDeleteTransaction: (id: string) => void;
  onAddAccount: () => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  accounts,
  transactions,
  habits,
  onSaveTransaction,
  onDeleteTransaction,
  onAddAccount,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<MoneyTransaction | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const currency = getCurrency();

  const today = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;
  })();

  const filtered = useMemo(() => {
    const list = [...transactions].filter(
      (t) => categoryFilter === 'all' || t.category === categoryFilter
    );
    return list.sort((a, b) => (a.date === b.date ? b.id.localeCompare(a.id) : b.date.localeCompare(a.date)));
  }, [transactions, categoryFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, MoneyTransaction[]>();
    filtered.forEach((transaction) => {
      const list = map.get(transaction.date) || [];
      list.push(transaction);
      map.set(transaction.date, list);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const monthSpent = useMemo(
    () =>
      transactions
        .filter((t) => t.date.startsWith(today.slice(0, 7)) && t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0),
    [transactions, today]
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200">
      <div className="border-b border-ob-line pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-ob-gold text-xs font-semibold uppercase tracking-wider mb-1">
            <Receipt className="w-3.5 h-3.5" />
            <span>Money Module</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ob-text">Transactions</h1>
          <p className="text-xs text-ob-dim mt-1">
            {formatMoney(monthSpent, currency)} spent this month · {transactions.length} movement
            {transactions.length === 1 ? '' : 's'} on the record
          </p>
        </div>

        <button
          onClick={() => {
            sound.playClick();
            setEditing(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 self-start sm:self-auto px-3.5 py-2.5 rounded-xl bg-ob-gold text-ob-on-gold text-xs font-bold hover:bg-ob-gold-bright transition-colors"
        >
          <Plus className="w-4 h-4" />
          New transaction
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <div className="inline-flex items-center gap-1.5 text-xs text-ob-dim font-medium shrink-0">
          <Filter className="w-3.5 h-3.5" />
          Filter
        </div>
        <button
          onClick={() => setCategoryFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors shrink-0 ${
            categoryFilter === 'all'
              ? 'border-ob-gold/60 bg-ob-gold/10 text-ob-text'
              : 'border-ob-line bg-ob-s1 text-ob-dim hover:border-ob-line-strong'
          }`}
        >
          All
        </button>
        {MONEY_CATEGORIES.filter((c) => c.kind === 'expense').map((category) => (
          <button
            key={category.id}
            onClick={() => setCategoryFilter(category.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors shrink-0 ${
              categoryFilter === category.id
                ? 'border-ob-gold/60 bg-ob-gold/10 text-ob-text'
                : 'border-ob-line bg-ob-s1 text-ob-dim hover:border-ob-line-strong'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* List */}
      {grouped.length === 0 ? (
        <div className="rounded-2xl bg-ob-sidebar border border-ob-line p-8 text-center space-y-3">
          <Wallet className="w-7 h-7 text-ob-muted mx-auto" />
          <p className="text-sm text-ob-text font-semibold">Nothing recorded yet</p>
          <p className="text-xs text-ob-dim max-w-sm mx-auto leading-relaxed">
            Record what you spend and what comes in. Everything stays on the device and travels to
            the paired device with the encrypted link.
          </p>
          {accounts.filter((a) => !a.archived).length === 0 && (
            <button
              onClick={onAddAccount}
              className="text-xs font-semibold text-ob-gold hover:underline"
            >
              Add your first account first
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {grouped.map(([date, items]) => (
            <div key={date} className="space-y-2">
              <div className="text-[10px] uppercase tracking-wider font-semibold text-ob-dim px-1">
                {date === today
                  ? 'Today'
                  : new Date(date).toLocaleDateString(undefined, {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
              </div>
              <div className="space-y-1.5">
                {items.map((transaction) => {
                  const category = getCategory(transaction.category);
                  const account = accounts.find((a) => a.id === transaction.accountId);
                  const habit = habits.find((h) => h.id === transaction.habitId);
                  return (
                    <button
                      key={transaction.id}
                      onClick={() => {
                        sound.playClick();
                        setEditing(transaction);
                        setIsModalOpen(true);
                      }}
                      className="w-full flex items-center gap-3 rounded-xl bg-ob-sidebar border border-ob-line px-4 py-3 text-left hover:border-ob-line-strong transition-colors"
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-bold uppercase shrink-0 ${category.color}`}
                      >
                        {category.label.slice(0, 2)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-ob-text truncate">
                          {transaction.note || category.label}
                        </div>
                        <div className="text-[11px] text-ob-dim truncate">
                          {category.label}
                          {account ? ` · ${account.name}` : ''}
                          {habit ? ` · ${habit.title}` : ''}
                        </div>
                      </div>
                      <div
                        className={`text-sm font-bold font-mono shrink-0 ${
                          transaction.amount < 0 ? 'text-ob-text' : 'text-emerald-400'
                        }`}
                      >
                        {formatMoney(transaction.amount, currency)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditing(null);
        }}
        onSave={(transaction) => {
          onSaveTransaction(transaction);
          setIsModalOpen(false);
          setEditing(null);
          sound.playComplete();
        }}
        onDelete={onDeleteTransaction}
        accounts={accounts}
        habits={habits}
        transaction={editing}
        defaultDate={today}
      />
    </div>
  );
};
