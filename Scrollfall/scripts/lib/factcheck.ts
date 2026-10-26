import type Anthropic from '@anthropic-ai/sdk';
import type { Envelope } from '../../src/schema/envelope';
import { schema as oddOneOutSchema } from '../../src/templates/odd-one-out/definition';
import { schema as heavierSchema } from '../../src/templates/which-is-heavier/definition';
import { ask, mapLimit } from './claude';
import { parseJsonReply } from './parse';

// A second, blind model call for templates whose answer is a matter of fact or judgment.
// The checker never sees the stated answer; it must reach the same one on its own.

export type FactQuestion = { key: string; text: string; expected: string };
export type FactVerdict = { ok: boolean; reason?: string };

const BATCH = 20;

const SYSTEM = `You check answers for a quick-fire mobile quiz game.
Answer each question independently from your own knowledge, the way a careful expert would.
If a question is ambiguous, has more than one defensible answer, depends on the specific individual, or you are not confident, answer "unsure".
Reply with JSON only: an array of {"key": string, "answer": string}, one per question, in any order. No prose, no code fences.`;

export function factQuestion(c: Envelope): FactQuestion | null {
  if (c.template === 'odd-one-out') {
    const p = oddOneOutSchema.parse(c.params);
    const items = p.items.map((item, i) => `${i + 1}) ${item}`).join('  ');
    return {
      key: c.id,
      text: `The player is told: "${c.prompt}". Items shown: ${items}. Which single item is the one to tap? Answer with its number.`,
      expected: String(p.answerIndex + 1),
    };
  }
  if (c.template === 'which-is-heavier') {
    const p = heavierSchema.parse(c.params);
    return {
      key: c.id,
      text: `${c.prompt} A) ${p.left.name} ${p.left.emoji}  or  B) ${p.right.name} ${p.right.emoji}. Answer A or B.`,
      expected: p.answer === 'left' ? 'A' : 'B',
    };
  }
  return null;
}

function answersFrom(reply: unknown): Map<string, string> {
  const answers = new Map<string, string>();
  if (!Array.isArray(reply)) return answers;
  for (const entry of reply) {
    if (entry && typeof entry === 'object' && 'key' in entry && 'answer' in entry) {
      answers.set(String(entry.key), String(entry.answer).trim().toUpperCase().replace(/[).]$/, ''));
    }
  }
  return answers;
}

export async function factCheck(client: Anthropic, questions: FactQuestion[], concurrency = 4): Promise<Map<string, FactVerdict>> {
  const batches = Array.from({ length: Math.ceil(questions.length / BATCH) }, (_, i) => questions.slice(i * BATCH, (i + 1) * BATCH));
  const verdicts = new Map<string, FactVerdict>();

  await mapLimit(batches, concurrency, async (batch) => {
    const user = batch.map((q) => `key: ${q.key}\n${q.text}`).join('\n\n');
    let answers = new Map<string, string>();
    try {
      answers = answersFrom(parseJsonReply((await ask(client, SYSTEM, user, 32000)).text));
    } catch (error) {
      const reason = `fact check failed: ${error instanceof Error ? error.message : String(error)}`;
      for (const q of batch) verdicts.set(q.key, { ok: false, reason });
      return;
    }
    for (const q of batch) {
      const answer = answers.get(q.key);
      if (answer === undefined) verdicts.set(q.key, { ok: false, reason: 'fact checker gave no answer' });
      else if (answer === q.expected.toUpperCase()) verdicts.set(q.key, { ok: true });
      else verdicts.set(q.key, { ok: false, reason: `fact checker answered ${answer}, config says ${q.expected}` });
    }
  });
  return verdicts;
}
