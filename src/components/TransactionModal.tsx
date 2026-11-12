import React, { useMemo, useState } from 'react';
import {
  X,
  Check,
  Home,
  UtensilsCrossed,
  Car,
  HeartPulse,
  Dumbbell,
  Repeat,
  Gamepad2,
  ShoppingBag,
  GraduationCap,
  Shapes,
  TrendingUp,
  Wallet,
  CreditCard,
  Banknote,
} from 'lucide-react';
import {
  CATEGORY_BY_ID,
  MONEY_CATEGORIES,
  MoneyAccount,
  MoneyTransaction,
  centsToInput,
  inputToCents,
} from '../money/types';
import { Habit } from '../types';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Home,
  UtensilsCrossed,
  Car,
  HeartPulse,
  Dumbbell,
  Repeat,
  Gamepad2,
  ShoppingBag,
  GraduationCap,
  Shapes,
  TrendingUp,
};

const ACCOUNT_ICONS: Record<string, React.ElementType> = {
  cash: Banknote,
  bank: Wallet,
  card: CreditCard,
};

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: MoneyTransaction) => void;
  onDelete?: (id: string) => void;
  accounts: MoneyAccount[];
  habits: Habit[];
  /** The transaction that is edited. A new one is created when it is missing. */
  transaction?: MoneyTransaction | null;
  defaultDate: string;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  accounts,
  habits,
  transaction,
  defaultDate,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [isExpense, setIsExpense] = useState<boolean>(true);
  const [category, setCategory] = useState<string>('food');
  const [accountId, setAccountId] = useState<string>('');
  const [date, setDate] = useState<string>(defaultDate);
  const [note, setNote] = useState<string>('');
  const [habitId, setHabitId] = useState<string>('');
  const [loadedId, setLoadedId] = useState<string | null>(null);

  const activeAccounts = useMemo(() => accounts.filter((a) => !a.archived), [accounts]);

  // Fill the form when the modal opens or when another record is edited.
  const editingId = transaction?.id || null;
  if (isOpen && editingId !== loadedId) {
    setLoadedId(editingId);
    setAmount(transaction ? centsToInput(Math.abs(transaction.amount)) : '');
    setIsExpense(transaction ? transaction.amount < 0 : true);
    setCategory(transaction?.category || 'food');
    setAccountId(transaction?.accountId || activeAccounts[0]?.id || '');
    setDate(transaction?.date || defaultDate);
    setNote(transaction?.note || '');
    setHabitId(transaction?.habitId || '');
  }

  if (!isOpen) return null;

  const handleSave = () => {
    const cents = Math.abs(inputToCents(amount));
    if (cents <= 0) return;

    onSave({
      id: transaction?.id || `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      accountId: accountId || activeAccounts[0]?.id || 'cash',
      date,
      amount: isExpense ? -cents : cents,
      category: isExpense ? category : 'income',
      note: note.trim() || undefined,
      habitId: !isExpense ? undefined : habitId || undefined,
    });
  };

  const visibleCategories = MONEY_CATEGORIES.filter((c) =>
    isExpense ? c.kind === 'expense' : c.kind === 'income'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-ob-sidebar border border-ob-line p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-ob-text">
            {transaction ? 'Edit transaction' : 'New transaction'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ob-dim hover:text-ob-text hover:bg-ob-s1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <div className="flex gap-1 p-1 rounded-lg bg-ob-s1 border border-ob-line">
            <button
              onClick={() => setIsExpense(true)}
              className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                isExpense ? 'bg-ob-raised text-ob-gold' : 'text-ob-dim hover:text-ob-text'
              }`}
            >
              Expense
            </button>
            <button
              onClick={() => setIsExpense(false)}
              className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                !isExpense ? 'bg-ob-raised text-emerald-400' : 'text-ob-dim hover:text-ob-text'
              }`}
            >
              Income
            </button>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-ob-s1 border border-ob-line px-3 py-2 focus-within:border-ob-gold">
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              placeholder="0.00"
              autoFocus
              className="flex-1 bg-transparent text-2xl font-bold font-mono text-ob-text outline-none placeholder:text-ob-muted"
            />
          </div>
        </div>

        {/* Category */}
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-ob-dim">Category</div>
          <div className="grid grid-cols-3 gap-1.5">
            {visibleCategories.map((item) => {
              const Icon = CATEGORY_ICONS[item.icon] || Shapes;
              const active = category === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCategory(item.id)}
                  className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2 transition-colors ${
                    active
                      ? 'border-ob-gold/60 bg-ob-gold/10'
                      : 'border-ob-line bg-ob-s1 hover:border-ob-line-strong'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-ob-gold' : 'text-ob-dim'}`} />
                  <span
                    className={`text-[10px] font-medium text-center leading-tight ${
                      active ? 'text-ob-text' : 'text-ob-dim'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Account */}
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-ob-dim">Account</div>
          <div className="flex flex-wrap gap-1.5">
            {activeAccounts.map((account) => {
              const Icon = ACCOUNT_ICONS[account.type] || Wallet;
              const active = accountId === account.id;
              return (
                <button
                  key={account.id}
                  onClick={() => setAccountId(account.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? 'border-ob-gold/60 bg-ob-gold/10 text-ob-text'
                      : 'border-ob-line bg-ob-s1 text-ob-dim hover:border-ob-line-strong'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {account.name}
                </button>
              );
            })}
            {activeAccounts.length === 0 && (
              <span className="text-[11px] text-ob-dim">No account yet. Add one on the Money screen.</span>
            )}
          </div>
        </div>

        {/* Date and note */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-ob-dim">Date</div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-ob-s1 border border-ob-line px-3 py-2 text-xs text-ob-text rounded-lg outline-none focus:border-ob-gold"
            />
          </div>
          <div className="space-y-1.5">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-ob-dim">Note</div>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional"
              className="w-full bg-ob-s1 border border-ob-line px-3 py-2 text-xs text-ob-text rounded-lg outline-none focus:border-ob-gold"
            />
          </div>
        </div>

        {/* Link to a habit */}
        {isExpense && habits.length > 0 && (
          <div className="space-y-2">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-ob-dim">
              Pay for a habit
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setHabitId('')}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  habitId === ''
                    ? 'border-ob-gold/60 bg-ob-gold/10 text-ob-text'
                    : 'border-ob-line bg-ob-s1 text-ob-dim hover:border-ob-line-strong'
                }`}
              >
                Not linked
              </button>
              {habits.map((habit) => (
                <button
                  key={habit.id}
                  onClick={() => setHabitId(habit.id)}
                  className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    habitId === habit.id
                      ? 'border-ob-gold/60 bg-ob-gold/10 text-ob-text'
                      : 'border-ob-line bg-ob-s1 text-ob-dim hover:border-ob-line-strong'
                  }`}
                >
                  {habit.title}
                </button>
              ))}
            </div>
            {habitId && (
              <p className="text-[11px] text-ob-dim leading-relaxed">
                The Money screen shows what one session of this habit costs.
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          {transaction && onDelete && (
            <button
              onClick={() => {
                onDelete(transaction.id);
                onClose();
              }}
              className="px-3 py-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-500/25 transition-colors"
            >
              Delete
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-ob-line bg-ob-s1 text-xs font-semibold text-ob-dim hover:text-ob-text transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={Math.abs(inputToCents(amount)) <= 0}
            className="flex-1 py-2.5 rounded-xl bg-ob-gold text-ob-on-gold text-xs font-bold hover:bg-ob-gold-bright transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
