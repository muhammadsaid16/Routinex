import React, { useState } from 'react';
import { Habit, HabitEntry, ConsistencyStats } from '../types';
import { Bot, Send, Sparkles, MessageSquare, ShieldAlert } from 'lucide-react';
import { getTodayString, formatDateToISO, getDayOfWeek } from '../storage';

interface CoachViewProps {
  habits: Habit[];
  entries: HabitEntry[];
  stats: ConsistencyStats;
}

interface Message {
  role: 'coach' | 'user';
  text: string;
  time: string;
}

export const CoachView: React.FC<CoachViewProps> = ({ habits, entries, stats }) => {
  const [input, setInput] = useState('');
  
  // Find habits with consecutive misses
  const today = new Date();
  const past3Days: string[] = [];
  for (let i = 1; i <= 3; i++) {
    const d = new Date(today);
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

  const hasStats = stats.scheduled > 0 && stats.completed > 0 && stats.bestDay !== '—';

  const initialCoachMessage = consecutiveMisses.length > 0
    ? `I noticed you missed "${consecutiveMisses[0]}" on consecutive days. Missing twice isn't the problem; letting it turn into a week is. Show up tomorrow. No drama.`
    : hasStats
    ? `Your 30-day consistency sits at ${stats.percentage}%. Your strongest day is ${stats.bestDay}, while ${stats.worstDay !== 'None' ? stats.worstDay : 'no day'} slips most often. Keep the momentum going.`
    : `Welcome to Ledger! Create your daily habits and start logging your progress. Consistency is built day by day, not in a single leap.`;

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'coach',
      text: initialCoachMessage,
      time: 'Just now',
    },
  ]);

  const handleSend = (textToSend?: string) => {
    const userText = textToSend || input;
    if (!userText.trim()) return;

    const newMessages: Message[] = [
      ...messages,
      { role: 'user', text: userText.trim(), time: 'Just now' },
    ];
    setMessages(newMessages);
    setInput('');

    // Generate pragmatic coach reply
    setTimeout(() => {
      let reply = '';
      const lower = userText.toLowerCase();

      if (lower.includes('why') || lower.includes('weekend') || lower.includes('worst')) {
        reply = `On ${stats.worstDay}, you drop to your lowest execution rate. That is not a willpower issue; it is a lack of fixed routine. Anchor ${habits[0]?.title || 'your key habit'} to an immutable trigger (e.g. immediately after morning coffee).`;
      } else if (lower.includes('streak') || lower.includes('miss')) {
        reply = `Forget streak numbers. Streaks create fragile egos and demoralize you on day one after a slip. Look at your 30-day consistency ratio (${stats.percentage}%). Execute today to push it higher.`;
      } else if (lower.includes('tired') || lower.includes('motivation') || lower.includes('hard')) {
        reply = `Action precedes motivation, not the other way around. Reduce the entry barrier: do 2 minutes instead of 60. Cross off the cell on the record.`;
      } else {
        reply = `Understood. The priority today is keeping the record clean. Complete your pending habits for today before midnight. No drama, just execution.`;
      }

      setMessages((prev) => [
        ...prev,
        { role: 'coach', text: reply, time: 'Just now' },
      ]);
    }, 400);
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
                className={`max-w-[80%] rounded-xl px-4 py-3 text-[13px] leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-ob-gold text-ob-on-gold font-medium'
                    : 'bg-ob-s1 border border-ob-line text-ob-text'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* Input & Quick Prompts */}
        <div className="border-t border-ob-line bg-ob-s1/60 p-4 space-y-3">
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
          </div>

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
              placeholder="Ask Ledger Coach about your habits..."
              className="flex-1 bg-ob-s1 border border-ob-line rounded-lg px-3.5 py-2.5 text-xs text-ob-text outline-none focus:border-ob-gold focus:ring-1 focus:ring-ob-gold"
            />
            <button
              type="submit"
              className="bg-ob-gold text-ob-on-gold p-2.5 rounded-lg hover:bg-ob-gold-bright transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
