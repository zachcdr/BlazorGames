import Anthropic from '@anthropic-ai/sdk';

export const MODEL = 'claude-sonnet-5-5';
// Claude Sonnet 5.5 list prices, USD per million tokens (thinking counts as output).
const INPUT_PER_M = 2;
const OUTPUT_PER_M = 10;
const CACHE_READ_PER_M = 0.2;
const CACHE_WRITE_PER_M = 2.5;

export function makeClient(): Anthropic {
  try {
    process.loadEnvFile('.env');
  } catch {
    // No .env file; fall back to the environment.
  }
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('Set ANTHROPIC_API_KEY in .env');
  return new Anthropic();
}

type Totals = { calls: number; input: number; output: number; cacheRead: number; cacheWrite: number };
export const totals: Totals = { calls: 0, input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };

export function costUsd(t: Totals = totals): number {
  return (
    (t.input * INPUT_PER_M + t.output * OUTPUT_PER_M + t.cacheRead * CACHE_READ_PER_M + t.cacheWrite * CACHE_WRITE_PER_M) /
    1_000_000
  );
}

export function usageLine(t: Totals = totals): string {
  return `${t.calls} calls, ${t.input + t.cacheRead + t.cacheWrite} input / ${t.output} output tokens, ~$${costUsd(t).toFixed(2)}`;
}

export type Reply = { text: string; model: string };

// One request with a cached system prompt. Throws on refusal or truncation.
export async function ask(client: Anthropic, system: string, user: string, maxTokens = 64000): Promise<Reply> {
  const stream = client.beta.messages.stream({
    model: MODEL,
    max_tokens: maxTokens,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: user }],
  });
  const message = await stream.finalMessage();

  totals.calls++;
  totals.input += message.usage.input_tokens;
  totals.output += message.usage.output_tokens;
  totals.cacheRead += message.usage.cache_read_input_tokens ?? 0;
  totals.cacheWrite += message.usage.cache_creation_input_tokens ?? 0;

  if (message.stop_reason === 'refusal') {
    throw new Error(`model refused (${message.stop_details?.category ?? 'no category'})`);
  }
  if (message.stop_reason === 'max_tokens') throw new Error('reply was cut off at max_tokens');
  const text = message.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('');
  return { text, model: message.model };
}

export async function mapLimit<T, R>(items: readonly T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i] as T, i);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
