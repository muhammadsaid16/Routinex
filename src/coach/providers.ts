import { CoachSettings } from './settings';
import { CoachContext, coachSystemPrompt, contextAsText } from './context';

export interface CoachTurn {
  role: 'coach' | 'user';
  text: string;
}

export class CoachError extends Error {
  constructor(message: string, readonly detail?: string) {
    super(message);
  }
}

function trimBase(url: string): string {
  return url.replace(/\/+$/, '');
}

/**
 * Sends the question and the record to the provider the user chose.
 * The key never leaves the device, it only goes to that provider.
 */
export async function askCoach(
  settings: CoachSettings,
  context: CoachContext,
  history: CoachTurn[],
  question: string
): Promise<string> {
  const system = coachSystemPrompt(context);
  const record = contextAsText(context);

  if (settings.provider === 'anthropic') {
    return askAnthropic(settings, system, record, history, question);
  }
  return askOpenAICompatible(settings, system, record, history, question);
}

async function askAnthropic(
  settings: CoachSettings,
  system: string,
  record: string,
  history: CoachTurn[],
  question: string
): Promise<string> {
  const base = trimBase(settings.baseUrl || 'https://api.anthropic.com');

  const messages = history
    .filter((turn) => turn.text.trim())
    .map((turn) => ({
      role: turn.role === 'coach' ? ('assistant' as const) : ('user' as const),
      content: turn.text,
    }));

  messages.push({
    role: 'user' as const,
    content: `Here is my record.\n\n${record}\n\nMy question: ${question}`,
  });

  let response: Response;
  try {
    response = await fetch(`${base}/v1/messages`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': settings.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: settings.model,
        max_tokens: 1200,
        system,
        messages,
      }),
    });
  } catch (err: any) {
    throw new CoachError('Could not reach the provider.', err?.message);
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new CoachError(providerError(response.status, detail), detail.slice(0, 300));
  }

  const data = await response.json().catch(() => null);
  const text = data?.content?.[0]?.text;
  if (typeof text !== 'string' || !text.trim()) {
    throw new CoachError('The provider answered with an empty reply.');
  }
  return text.trim();
}

async function askOpenAICompatible(
  settings: CoachSettings,
  system: string,
  record: string,
  history: CoachTurn[],
  question: string
): Promise<string> {
  const base = trimBase(settings.baseUrl || 'https://api.openai.com');

  const messages = [
    { role: 'system', content: `${system}\n\n${record}` },
    ...history
      .filter((turn) => turn.text.trim())
      .map((turn) => ({
        role: turn.role === 'coach' ? 'assistant' : 'user',
        content: turn.text,
      })),
    { role: 'user', content: question },
  ];

  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (settings.apiKey.trim()) {
    headers['authorization'] = `Bearer ${settings.apiKey.trim()}`;
  }

  let response: Response;
  try {
    response = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: settings.model,
        messages,
        max_tokens: 1200,
        temperature: 0.6,
      }),
    });
  } catch (err: any) {
    throw new CoachError('Could not reach the provider.', err?.message);
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new CoachError(providerError(response.status, detail), detail.slice(0, 300));
  }

  const data = await response.json().catch(() => null);
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || !text.trim()) {
    throw new CoachError('The provider answered with an empty reply.');
  }
  return text.trim();
}

function providerError(status: number, detail: string): string {
  if (status === 401 || status === 403) {
    return 'The provider rejected the key. Check it in the settings.';
  }
  if (status === 404) {
    return 'The provider does not know this model. Check the model name in the settings.';
  }
  if (status === 429) {
    return 'The provider is rate limiting the requests. Try again in a moment.';
  }
  if (status >= 500) {
    return 'The provider is having a problem. Try again in a moment.';
  }
  return `The provider refused the request (${status}).`;
}
