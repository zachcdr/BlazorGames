import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { DEFINITIONS } from '../src/engine/definitions';
import { GUIDES, THEMES } from './guides';
import { ask, makeClient, mapLimit, MODEL, usageLine } from './lib/claude';
import { parseJsonReply } from './lib/parse';
import { CHALLENGES_DIR, GENERATED_DIR, readJsonFiles } from './lib/content';

// Usage: npm run generate -- --template odd-one-out --count 50
//        npm run generate -- --all --count 50
// Writes raw model output to content/generated/. Nothing reaches the app until validate.ts approves it.

export type GeneratedCall = { theme: string; model?: string; items?: unknown[]; error?: string };
export type GeneratedFile = { template: string; createdAt: string; requested: number; calls: GeneratedCall[] };

const ENVELOPE_RULES = `Each challenge is a JSON object with exactly these fields:
- "template": the template id given below
- "prompt": what the player reads, at most 40 characters, readable at arm's length
- "durationMs": integer from 3000 to 10000
- "difficulty": integer 1 (easy) to 5 (hard)
- "theme": one or two words
- "params": the template's params, exactly as described below (no extra fields)`;

const SYSTEM_BASE = `You write challenge configs for Scrollfall, a mobile game: a vertical feed where every post is a 3-10 second, one-thumb micro-challenge, like WarioWare on a TikTok feed.
You only fill in data for an existing template. Never invent new mechanics or fields; the game code can't run them.
Challenges should be quick to understand, fair, and fun, with no sound needed.
Reply with JSON only: a single array of challenge objects. No prose, no code fences.`;

function pick<T>(items: readonly T[], n: number): T[] {
  return [...items].sort(() => Math.random() - 0.5).slice(0, n);
}

function examplesFor(template: string): unknown[] {
  return pick(
    readJsonFiles(CHALLENGES_DIR)
      .map(({ data }) => data)
      .filter((d): d is Record<string, unknown> => typeof d === 'object' && d !== null && 'template' in d && d.template === template),
    3,
  ).map(({ template: t, prompt, durationMs, difficulty, theme, params }) => ({ template: t, prompt, durationMs, difficulty, theme, params }));
}

function systemFor(template: string): string {
  return [
    SYSTEM_BASE,
    ENVELOPE_RULES,
    `Template "${template}":\n${GUIDES[template]}`,
    `Examples of valid "${template}" challenges:\n${JSON.stringify(examplesFor(template), null, 2)}`,
  ].join('\n\n');
}

function userFor(template: string, count: number, theme: string): string {
  return `Write ${count} new "${template}" challenges with the theme "${theme}" (interpret it loosely if you need to).
Spread difficulty across 1-5. Make every challenge different from the examples and from each other.
Reply with a JSON array of ${count} objects.`;
}

async function generate(template: string, count: number, batch: number, concurrency: number): Promise<string> {
  const client = makeClient();
  const system = systemFor(template);
  const sizes = Array.from({ length: Math.ceil(count / batch) }, (_, i) => Math.min(batch, count - i * batch));
  const themes = pick(THEMES, sizes.length);

  const calls = await mapLimit(sizes, concurrency, async (size, i): Promise<GeneratedCall> => {
    const theme = themes[i % themes.length] ?? 'everyday things';
    try {
      const reply = await ask(client, system, userFor(template, size, theme));
      const parsed = parseJsonReply(reply.text);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      console.log(`  ${template} · ${theme}: ${items.length} items`);
      return { theme, model: reply.model, items };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`  ${template} · ${theme}: failed (${message})`);
      return { theme, error: message };
    }
  });

  const file: GeneratedFile = { template, createdAt: new Date().toISOString(), requested: count, calls };
  mkdirSync(GENERATED_DIR, { recursive: true });
  const stamp = file.createdAt.replace(/[-:]/g, '').replace(/\..+/, '');
  const path = join(GENERATED_DIR, `${template}_${stamp}.json`);
  writeFileSync(path, JSON.stringify(file, null, 2) + '\n');
  return path;
}

async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2).filter((a) => a !== '--'),
    options: {
      template: { type: 'string' },
      all: { type: 'boolean', default: false },
      count: { type: 'string', default: '50' },
      batch: { type: 'string', default: '10' },
      concurrency: { type: 'string', default: '4' },
    },
  });
  const templates = values.all ? [...DEFINITIONS.keys()] : values.template ? [values.template] : [];
  if (templates.length === 0) throw new Error('Pass --template <id> or --all');
  for (const t of templates) if (!DEFINITIONS.has(t) || !GUIDES[t]) throw new Error(`Unknown template "${t}"`);

  const count = Number(values.count);
  console.log(`Generating ${count} per template with ${MODEL}: ${templates.join(', ')}`);
  for (const template of templates) {
    const path = await generate(template, count, Number(values.batch), Number(values.concurrency));
    console.log(`Wrote ${path}`);
  }
  console.log(`Usage: ${usageLine()}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
