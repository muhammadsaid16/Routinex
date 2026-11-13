import React, { useMemo, useState } from 'react';
import { Habit, HabitEntry, ConsistencyStats } from '../types';
import { Bot, Send, Sparkles, MessageSquare, ShieldAlert, KeyRound, Eye, Loader2, AlertTriangle } from 'lucide-react';
import { getTodayString, formatDateToISO, getDayOfWeek } from '../storage';
import { MoneyAccount, MoneyBudget, MoneyTransaction } from '../money/types';
import { CoachSettings, CoachContextLevel, loadCoachSettings, isCoachReady } from '../coach/settings';
import { buildCoachContext } from '../coach/context';
import { askCoach, CoachError } from '../coach/providers';
import { sound } from '../audio';
import { CoachSettingsModal } from '../components/CoachSettingsModal';

interface CoachViewProps {
  habits: Habit[];
  entries: HabitEntry[];
  stats: ConsistencyStats;
  userName?: string;
  money?: { accounts: MoneyAccount[]; transactions: MoneyTransaction[]; budgets: MoneyBudget[] };
}

interface Message {
  role: 'coach' | 'user';
  text: string;
  time: string;
}

const LEVELS: { id: CoachContextLevel; label: string; hint: string }[] = [
  { id: 'summary', label: 'Summary', hint: 'Rates, streaks and the habit list only' },
  { id: 'days', label: 'With money', hint: 'Adds the money month and the budgets' },
  { id: 'full', label: 'Everything', hint: 'Adds the last fourteen days and your notes' },
];

export const CoachView: React.FC<CoachViewProps> = ({ habits, entries, stats, userName, money }) => {
  const [input, setInput] = useState('');
  const [settings] = useState<CoachSettings>(() => loadCoachSettings());
  const [level, setLevel] = useState<CoachContextLevel>(settings.contextLevel || 'summary');
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showContext, setShowContext] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [liveSettings, setLiveSettings] = useState<CoachSettings>(() => loadCoachSettings());

  const today = getTodayString();

  // Find habits with consecutive misses
  const todayDate = new Date();
  const past3Days: string[] = [];
  for (let i = 1; i <= 3; i++) {
    const d = new Date(todayDate);
    d.setDate(d.getDate() - i);
    past3Days.push(formatDateToISO(d));
  }

  const consecutiveMisses: string[] = [];
  habits.forEach((h) => {
    if (h.archived) return;
    const missedLast2 = past3Days.slice(0, 2).every((dateStr) => {
      const isSched = h.scheduleDays.includes(getDayOfWeek(dateStr));
      const isDone = entries.some((e) => e.habitId === h.id && e.date === dateStr && e.completed);
      return isSched && !isDone;
    });
    if (missedLast2) {
      consecutiveMisses.push(h.title);
    }
  });

  const hasStats = stats.scheduled > 0 && stats.completed > 0;

  const initialCoachMessage = consecutiveMisses.length > 0
    ? `I noticed you missed "${consecutiveMisses[0]}" on consecutive days. Missing twice isn't the problem; letting it turn into a week is. Show up tomorrow. No drama.`
    : hasStats
    ? `Your 30-day consistency sits at ${stats.percentage}%. Your strongest day is ${stats.bestDay === '—' ? 'not clear yet' : stats.bestDay}, while ${stats.worstDay !== 'None' && stats.worstDay !== '—' ? stats.worstDay : 'no single day'} slips most often. Keep the momentum going.`
    : `Welcome to Ledger! Create your daily habits and start logging your progress. Consistency is built day by day, not in a single leap.`;

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'coach',
      text: initialCoachMessage,
      time: 'Just now',
    },
  ]);

  const context = useMemo(
    () =>
      buildCoachContext({
        level,
        userName,
        habits,
        entries,
        stats,
        money,
        today,
      }),
    [level, userName, habits, entries, stats, money, today]
  );

  const coachReady = isCoachReady(liveSettings);

  /** The local answer, used when there is no key or the provider failed. */
  const localReply = (userText: string): string => {
    const lower = userText.toLowerCase();

    if (lower.includes('why') || lower.includes('weekend') || lower.includes('worst')) {
      if (stats.worstDay && stats.worstDay !== '—' && stats.worstDay !== 'None') {
        return `On ${stats.worstDay}, you drop to your lowest execution rate. That is not a willpower issue; it is a lack of fixed routine. Anchor ${habits[0]?.title || 'your key habit'} to an immutable trigger, for example right after your morning coffee.`;
      }
      return `No single day slips yet, every day sits at about the same level. That usually means the system is too big rather than the day being weak. Cut one habit to two minutes for a week and watch the rate move.`;
    }
    if (lower.includes('streak') || lower.includes('miss')) {
      return `Forget the streak number. Look at the 30-day consistency ratio of ${stats.percentage}%. A streak can break on a bad night, the rate does not. Put today's pending habits on the record before midnight.`;
    }
    if (lower.includes('tired') || lower.includes('motivation') || lower.includes('hard')) {
      return `Action precedes motivation, never the other way. Lower the entry barrier: two minutes instead of sixty. Cross off the cell on the record and the mood follows the cell, not the other way round.`;
    }
    if (lower.includes('money') || lower.includes('spend') || lower.includes('budget')) {
      return `Open the Money module and read the burn down before you spend. The number that decides is the one on the card, not the one in your head.`;
    }
    return `Understood. The priority today is keeping the record clean. Complete the pending habits for today before midnight. No drama, just execution.`;
  };

  const handleSend = async (textToSend?: string) => {
    const userText = textToSend || input;
    if (!userText.trim() || isThinking) return;

    const question = userText.trim();
    const newMessages: Message[] = [
      ...messages,
      { role: 'user', text: question, time: 'Just now' },
    ];
    setMessages(newMessages);
    setInput('');
    setError(null);

    if (!coachReady) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { role: 'coach', text: localReply(question), time: 'Just now' },
        ]);
      }, 350);
      return;
    }

    setIsThinking(true);
    try {
      const reply = await askCoach(liveSettings, context, messages, question);
      setMessages((prev) => [
        ...prev,
        { role: 'coach', text: reply, time: 'Just now' },
      ]);
    } catch (err: any) {
      const message =
        err instanceof CoachError ? err.message : 'The coach could not answer right now.';
      setError(message);
      setMessages((prev) => [
        ...prev,
        {
          role: 'coach',
          text: `${message}\n\nMeanwhile, from your record: ${localReply(question)}`,
          time: 'Just now',
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const quickPrompts = [
    stats.worstDay && stats.worstDay !== '—' && stats.worstDay !== 'None'
      ? `Why do I slip on ${stats.worstDay}?`
      : 'How do I build lasting consistency?',
    'How do I fix my consistency score?',
    'I missed two days in a row, what now?',
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-ob-line pb-6">
        <div className="flex items-center gap-2 text-ob-gold text-xs font-semibold uppercase tracking-wider mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Context-Aware Mentor</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ob-text">
          Ledger Coach
        </h1>
        <p className="text-xs text-ob-dim mt-1">
          Pragmatic, low-drama accountability grounded in your real habit history.
        </p>
      </div>

      {/* Provider state */}
      <div
        className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          coachReady
            ? 'border-emerald-500/30 bg-emerald-500/10'
            : 'border-ob-line bg-ob-s1'
        }`}
      >
        <div className="flex items-start gap-3 min-w-0">
          <KeyRound className={`w-4 h-4 shrink-0 mt-0.5 ${coachReady ? 'text-emerald-400' : 'text-ob-dim'}`} />
          <div className="min-w-0">
            <div className="text-xs font-semibold text-ob-text">
              {coachReady ? 'Connected to your provider' : 'Running on the built in answers'}
            </div>
            <div className="text-[11px] text-ob-dim mt-0.5 leading-relaxed">
              {coachReady
                ? `Your key stays on this device. Only the record below is sent, only to ${liveSettings.baseUrl || 'your provider'}.`
                : 'Add your own key in the settings to let the coach read your record and answer in context.'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              sound.playClick();
              setIsSettingsOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-ob-line bg-ob-s1 text-[11px] font-semibold text-ob-dim hover:text-ob-gold hover:border-ob-gold transition-colors"
            title="Provider, key and model"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Settings</span>
          </button>

          <div className="flex items-center gap-1 p-1 rounded-lg bg-ob-raised border border-ob-line">
          {LEVELS.map((item) => (
            <button
              key={item.id}
              onClick={() => setLevel(item.id)}
              title={item.hint}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                level === item.id ? 'bg-ob-s1 text-ob-gold' : 'text-ob-dim hover:text-ob-text'
              }`}
            >
              {item.label}
            </button>
          ))}
          </div>
        </div>
      </div>

      {/* Principle Callout */}
      <div className="rounded-xl border border-ob-line bg-ob-s1 p-4 flex items-center gap-3">
        <ShieldAlert className="w-5 h-5 text-ob-gold shrink-0" />
        <div className="text-xs text-ob-text-2 leading-relaxed">
          <span className="text-ob-text font-semibold">The 2-Day Rule: </span>
          Never allow a habit to be missed two days in a row. A single miss is an accident; two misses is the birth of a new habit.
        </div>
      </div>

      {/* Chat Area */}
      <div className="rounded-xl border border-ob-line bg-ob-sidebar h-[440px] flex flex-col justify-between overflow-hidden shadow-sm">
        {/* Messages */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'coach' && (
                <div className="w-7 h-7 rounded-lg bg-ob-gold/10 border border-ob-gold/30 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-ob-gold" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-xl px-4 py-3 text-[13px] leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-ob-gold text-ob-on-gold font-medium'
                    : 'bg-ob-s1 border border-ob-line text-ob-text'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {isThinking && (
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-ob-gold/10 border border-ob-gold/30 flex items-center justify-center shrink-0">
                <Loader2 className="w-4 h-4 text-ob-gold animate-spin" />
              </div>
              <div className="rounded-xl bg-ob-s1 border border-ob-line px-4 py-3 text-[13px] text-ob-dim">
                Reading the record...
              </div>
            </div>
          )}
        </div>

        {/* Input & Quick Prompts */}
        <div className="border-t border-ob-line bg-ob-s1/60 p-4 space-y-3">
          {error && (
            <div className="flex items-start gap-2 text-[11px] text-rose-400">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Prompts */}
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSend(prompt)}
                className="text-[11px] font-medium bg-ob-raised border border-ob-line text-ob-dim hover:text-ob-text hover:border-ob-gold px-2.5 py-1.5 rounded-lg transition-colors"
              >
                {prompt}
              </button>
            ))}
            <button
              onClick={() => setShowContext((prev) => !prev)}
              className="text-[11px] font-medium bg-ob-raised border border-ob-line text-ob-dim hover:text-ob-text hover:border-ob-gold px-2.5 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
            >
              <Eye className="w-3 h-3" />
              {showContext ? 'Hide the record' : 'See what the coach reads'}
            </button>
          </div>

          {showContext && (
            <pre className="max-h-40 overflow-auto rounded-lg bg-ob-canvas border border-ob-line p-3 text-[10px] font-mono text-ob-dim whitespace-pre-wrap">
              {JSON.stringify(context, null, 2)}
            </pre>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={coachReady ? 'Ask about anything in your life...' : 'Ask Ledger Coach about your habits...'}
              className="flex-1 bg-ob-s1 border border-ob-line rounded-lg px-3.5 py-2.5 text-xs text-ob-text outline-none focus:border-ob-gold focus:ring-1 focus:ring-ob-gold"
            />
            <button
              type="submit"
              disabled={isThinking}
              className="bg-ob-gold text-ob-on-gold p-2.5 rounded-lg hover:bg-ob-gold-bright transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      <CoachSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaved={(next) => {
          setLiveSettings(next);
          setLevel(next.contextLevel || 'summary');
        }}
      />
    </div>
  );
};
