import { Habit, HabitEntry, ConsistencyStats } from '../types';

export type QuoteGroup =
  | 'beginning'
  | 'continuity'
  | 'relapse'
  | 'slipping'
  | 'general';

export interface Quote {
  id: string;
  group: QuoteGroup;
  text: string;
}

/**
 * The lines are original, written in the voice of the app. Nothing is
 * attributed to a person, so no quote can be misattributed.
 */
export const QUOTES: Quote[] = [
  // Beginning
  { id: 'b1', group: 'beginning', text: 'The first entry is the only one that is hard. The second one only needs company.' },
  { id: 'b2', group: 'beginning', text: 'A blank record is not a failure. It is a page that has not been written on yet.' },
  { id: 'b3', group: 'beginning', text: 'Start with the smallest version of the habit. The size can grow later, the start cannot be moved.' },
  { id: 'b4', group: 'beginning', text: 'Motivation is unreliable. A calendar entry is not.' },
  { id: 'b5', group: 'beginning', text: 'You do not need a good day to start. You need a start to get a good day.' },
  { id: 'b6', group: 'beginning', text: 'Nobody begins well. Everybody begins.' },
  { id: 'b7', group: 'beginning', text: 'The plan is allowed to be small. The plan is not allowed to be missing.' },
  { id: 'b8', group: 'beginning', text: 'One honest entry beats a week of good intentions.' },
  { id: 'b9', group: 'beginning', text: 'Discipline is not a mood you wait for. It is a thing you do while undecided.' },
  { id: 'b10', group: 'beginning', text: 'The record starts the day you decide to keep one.' },
  { id: 'b11', group: 'beginning', text: 'Do the first minute badly if you have to. Then do the second minute.' },
  { id: 'b12', group: 'beginning', text: 'A habit that looks impossible is usually a habit that starts too big.' },
  { id: 'b13', group: 'beginning', text: 'Begin where you are. Everything else is a later problem.' },
  { id: 'b14', group: 'beginning', text: 'The gap on the record is not the story. The next entry is the story.' },

  // Continuity
  { id: 'c1', group: 'continuity', text: 'Momentum is not speed. It is the proof that you will still be there tomorrow.' },
  { id: 'c2', group: 'continuity', text: 'The streak is not the goal. The streak is the receipt of the goal.' },
  { id: 'c3', group: 'continuity', text: 'Small and repeated beats large and rare. That is the whole trade.' },
  { id: 'c4', group: 'continuity', text: 'You are not building a perfect record. You are building a reliable one.' },
  { id: 'c5', group: 'continuity', text: 'The day you keep going when it is uninteresting is the day the habit actually exists.' },
  { id: 'c6', group: 'continuity', text: 'Consistency compounds quietly. Nobody applauds it, and it still pays.' },
  { id: 'c7', group: 'continuity', text: 'Showing up on the ordinary days is how the extraordinary ones get handled.' },
  { id: 'c8', group: 'continuity', text: 'The streak survives the days you do not feel like it. That is the only test that counts.' },
  { id: 'c9', group: 'continuity', text: 'Keep the chain short enough that you never think about breaking it.' },
  { id: 'c10', group: 'continuity', text: 'Repetition is the fastest route to a skill and the slowest route to a result. Accept both.' },
  { id: 'c11', group: 'continuity', text: 'The record does not need a speech. It needs another line.' },
  { id: 'c12', group: 'continuity', text: 'What you repeat is what you become, not what you plan.' },
  { id: 'c13', group: 'continuity', text: 'The day after a good day is easier. That is the entire trick.' },
  { id: 'c14', group: 'continuity', text: 'Do not admire the streak. Extend it.' },

  // Relapse
  { id: 'r1', group: 'relapse', text: 'A broken streak is data, not a verdict. The record was never the point.' },
  { id: 'r2', group: 'relapse', text: 'Missed twice is a pause. Missed twice and stop is a pattern.' },
  { id: 'r3', group: 'relapse', text: 'The day you restart decides whether the last month was practice or an accident.' },
  { id: 'r4', group: 'relapse', text: 'Nobody resets a streak without learning something. Take the lesson, leave the shame.' },
  { id: 'r5', group: 'relapse', text: 'Yesterday does not get a vote on today.' },
  { id: 'r6', group: 'relapse', text: 'The mistake is not the miss. The mistake is letting the miss become the plan.' },
  { id: 'r7', group: 'relapse', text: 'Return at half effort rather than not at all. Half effort is still a return.' },
  { id: 'r8', group: 'relapse', text: 'A streak that ends is a lesson that was paid for in advance.' },
  { id: 'r9', group: 'relapse', text: 'You are not behind. You are restarting.' },
  { id: 'r10', group: 'relapse', text: 'The gap in the record is a fact. What you do after it is a choice.' },
  { id: 'r11', group: 'relapse', text: 'Fall seven times, get up eight. The eighth is the one you are building.' },
  { id: 'r12', group: 'relapse', text: 'Do not relitigate yesterday. Log today.' },
  { id: 'r13', group: 'relapse', text: 'The longer the break, the smaller the next step should be.' },
  { id: 'r14', group: 'relapse', text: 'One missed day is noise. The response to it is the signal.' },

  // Slipping (today is still open)
  { id: 's1', group: 'slipping', text: 'The day is not over. It is not late yet.' },
  { id: 's2', group: 'slipping', text: 'There is still time for the smallest version of this habit.' },
  { id: 's3', group: 'slipping', text: 'Do not write off the day because the morning went badly.' },
  { id: 's4', group: 'slipping', text: 'A day is not lost. It is unfinished.' },
  { id: 's5', group: 'slipping', text: 'One entry tonight changes what the record says about today.' },
  { id: 's6', group: 'slipping', text: 'The hour that remains is yours to spend. Spend it on the thing you listed.' },
  { id: 's7', group: 'slipping', text: 'Judge the day at the end of the day, never at the start of the evening.' },
  { id: 's8', group: 'slipping', text: 'Nobody reads the middle of the day. They read the entry at night.' },
  { id: 's9', group: 'slipping', text: 'The list does not expire when the mood does.' },
  { id: 's10', group: 'slipping', text: 'Ten minutes counts. Ten minutes is still a line on the record.' },
  { id: 's11', group: 'slipping', text: 'Do the easiest habit first. It buys the energy for the rest.' },
  { id: 's12', group: 'slipping', text: 'A late entry is worth more than no entry and almost as good as an early one.' },
  { id: 's13', group: 'slipping', text: 'The day owes you one thing. It is still on the table.' },
  { id: 's14', group: 'slipping', text: 'Tonight is still yours. Go take it back.' },

  // General
  { id: 'g1', group: 'general', text: 'The record does not judge you. It tells you what to do next.' },
  { id: 'g2', group: 'general', text: 'Measure what happened, not what you intended.' },
  { id: 'g3', group: 'general', text: 'A system that survives a bad week beats a system that only works in a good one.' },
  { id: 'g4', group: 'general', text: 'Attention is the real currency. Spend it where the record is.' },
  { id: 'g5', group: 'general', text: 'Standard beats intensity. Intensity is borrowed, standard is owned.' },
  { id: 'g6', group: 'general', text: 'The day you planned and the day you lived are different data. Use both.' },
  { id: 'g7', group: 'general', text: 'Progress hides in the weeks you barely notice.' },
  { id: 'g8', group: 'general', text: 'Do the work that makes the work easier.' },
  { id: 'g9', group: 'general', text: 'A clear list beats a strong mood.' },
  { id: 'g10', group: 'general', text: 'Discipline is mostly deciding once and then not deciding again.' },
  { id: 'g11', group: 'general', text: 'The line between stubborn and disciplined is whether the effort still points somewhere.' },
  { id: 'g12', group: 'general', text: 'Review the record weekly. Run on it daily.' },
  { id: 'g13', group: 'general', text: 'What gets measured gets handled. What gets ignored gets invented.' },
  { id: 'g14', group: 'general', text: 'The tool is not the work. The entry is the work.' },
];

const QUOTE_STATE_KEY = 'routinix_quote_state';

export interface QuoteSignal {
  /** The day the line belongs to, so it stays stable through the day. */
  dayKey: string;
  group: QuoteGroup;
  completedToday: number;
  scheduledToday: number;
  streak: number;
  everCompleted: boolean;
}

interface StoredQuoteState {
  dayKey: string;
  group: QuoteGroup;
  offset: number;
}

/**
 * Reads the state of the day and decides which group of lines speaks to it.
 * The choice is about the record, not about a random number.
 */
export function quoteSignalFrom(
  habits: Habit[],
  entries: HabitEntry[],
  stats: ConsistencyStats,
  today: string
): QuoteSignal {
  const active = habits.filter((h) => !h.archived);
  const scheduledToday = active.filter((h) => h.scheduleDays.length > 0).length;
  const completedToday = entries.filter((e) => e.completed && e.date === today).length;
  const everCompleted = entries.some((e) => e.completed);

  let group: QuoteGroup = 'general';

  if (!everCompleted && completedToday === 0) {
    group = 'beginning';
  } else if (completedToday === 0 && scheduledToday > 0) {
    group = 'slipping';
  } else if (stats.currentStreak >= 3) {
    group = 'continuity';
  } else if (stats.currentStreak === 0 && everCompleted) {
    group = 'relapse';
  } else if (completedToday > 0) {
    group = 'continuity';
  }

  return {
    dayKey: today,
    group,
    completedToday,
    scheduledToday,
    streak: stats.currentStreak,
    everCompleted,
  };
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function readState(): StoredQuoteState | null {
  try {
    const raw = localStorage.getItem(QUOTE_STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredQuoteState;
  } catch {
    return null;
  }
}

function writeState(state: StoredQuoteState) {
  try {
    localStorage.setItem(QUOTE_STATE_KEY, JSON.stringify(state));
  } catch {
    /* storage blocked */
  }
}

/**
 * The line of the day.
 * Everyone with the same state of the day gets the same line, and it does not
 * change when the app is reloaded.
 */
export function pickQuote(signal: QuoteSignal): Quote {
  const pool = QUOTES.filter((quote) => quote.group === signal.group);
  const fallback = pool.length > 0 ? pool : QUOTES;

  const stored = readState();
  const offset =
    stored && stored.dayKey === signal.dayKey && stored.group === signal.group
      ? stored.offset
      : hashString(`${signal.dayKey}|${signal.group}`) % fallback.length;

  return fallback[offset % fallback.length];
}

/** The next line of the same group. The choice is kept for the rest of the day. */
export function nextQuote(signal: QuoteSignal): Quote {
  const pool = QUOTES.filter((quote) => quote.group === signal.group);
  const fallback = pool.length > 0 ? pool : QUOTES;

  const stored = readState();
  const current =
    stored && stored.dayKey === signal.dayKey && stored.group === signal.group
      ? stored.offset
      : hashString(`${signal.dayKey}|${signal.group}`) % fallback.length;

  const offset = (current + 1) % fallback.length;
  writeState({ dayKey: signal.dayKey, group: signal.group, offset });

  return fallback[offset];
}
