import React, { useState } from 'react';
import { X, Check, Wallet, Banknote, CreditCard } from 'lucide-react';
import { AccountType, MoneyAccount, centsToInput, inputToCents } from '../money/types';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (account: MoneyAccount) => void;
}

const ACCOUNT_TYPES: { id: AccountType; label: string; icon: React.ElementType }[] = [
  { id: 'cash', label: 'Cash', icon: Banknote },
  { id: 'bank', label: 'Bank', icon: Wallet },
  { id: 'card', label: 'Card', icon: CreditCard },
];

export const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('cash');
  const [balance, setBalance] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    onSave({
      id: `acc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: trimmed,
      type,
      openingBalance: inputToCents(balance),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-2xl bg-ob-sidebar border border-ob-line p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-ob-text">New account</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ob-dim hover:text-ob-text hover:bg-ob-s1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-ob-dim">Type</div>
          <div className="flex gap-1.5">
            {ACCOUNT_TYPES.map((item) => {
              const Icon = item.icon;
              const active = type === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setType(item.id)}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                    active
                      ? 'border-ob-gold/60 bg-ob-gold/10 text-ob-text'
                      : 'border-ob-line bg-ob-s1 text-ob-dim hover:border-ob-line-strong'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-ob-dim">Name</div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Cash, Main bank, Debit card"
            autoFocus
            className="w-full bg-ob-s1 border border-ob-line px-3 py-2 text-xs text-ob-text rounded-lg outline-none focus:border-ob-gold placeholder:text-ob-muted"
          />
        </div>

        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-ob-dim">
            Balance at the start
          </div>
          <input
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            inputMode="decimal"
            placeholder="0.00"
            className="w-full bg-ob-s1 border border-ob-line px-3 py-2 text-xs font-mono text-ob-text rounded-lg outline-none focus:border-ob-gold placeholder:text-ob-muted"
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-ob-line bg-ob-s1 text-xs font-semibold text-ob-dim hover:text-ob-text transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
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
