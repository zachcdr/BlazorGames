import { existsSync, mkdirSync, readdirSync, renameSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { parseArgs } from 'node:util';
import { checkChallenge } from '../src/engine/validate';
import type { Envelope } from '../src/schema/envelope';
import type { Solved } from './lib/bot';
import { botCheck } from './lib/botcheck';
import { dedupeKey, lintPrompt } from './lib/checks';
import { makeClient, usageLine } from './lib/claude';
import { CHALLENGES_DIR, GENERATED_DIR, loadSolved, readJsonFiles } from './lib/content';
import { factCheck, factQuestion } from './lib/factcheck';
import type { GeneratedFile } from './generate';

// Usage: npm run validate                 (every unprocessed file in content/generated/)
//        npm run validate -- <file> ...   (specific files)
//        npm run validate -- --dry-run    (check and report, but write nothing)
//
// Checks run cheapest first: shape -> envelope + params schema + solver -> prompt lint ->
// duplicates -> blind fact check (fact-type templates) -> Playwright bot in a phone viewport.
// Passing configs get final ids and land in content/challenges/ with source "ai".

type Stage = 'generate' | 'shape' | 'schema' | 'lint' | 'duplicate' | 'fact' | 'bot';
type Rejection = { file: string; template: string; stage: Stage; reasons: string[]; item?: unknown };
type Candidate = Solved & { file: string };

const FIELDS = ['template', 'prompt', 'durationMs', 'difficulty', 'theme', 'params'] as const;
const PROCESSED_DIR = join(GENERATED_DIR, 'processed');
const REPORTS_DIR = join(GENERATED_DIR, 'reports');

// Model output is untrusted: keep only the envelope fields it is allowed to write.
function wrap(item: unknown, template: string, id: string): Record<string, unknown> | null {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
  const fields = Object.fromEntries(FIELDS.filter((f) => f in item).map((f) => [f, (item as Record<string, unknown>)[f]]));
  if (fields.template !== template) return null;
  return { id, version: 1, ...fields, source: 'ai', stats: { plays: 0, wins: 0, skips: 0 } };
}

function nextNumbers(library: Envelope[]): Map<string, number> {
  const next = new Map<string, number>();
  for (const c of library) {
    const n = Number(c.id.split('_').pop());
    next.set(c.template, Math.max(next.get(c.template) ?? 1, n + 1));
  }
  return next;
}

function generatedFiles(args: string[]): string[] {
  if (args.length > 0) return args;
  if (!existsSync(GENERATED_DIR)) return [];
  return readdirSync(GENERATED_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => join(GENERATED_DIR, f));
}

function percent(part: number, whole: number): string {
  return whole === 0 ? '-' : `${Math.round((100 * part) / whole)}%`;
}

async function main() {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2).filter((a) => a !== '--'),
    options: { 'dry-run': { type: 'boolean', default: false }, concurrency: { type: 'string', default: '4' } },
    allowPositionals: true,
  });
  const dryRun = values['dry-run'];
  const concurrency = Number(values.concurrency);
  const files = generatedFiles(positionals);
  if (files.length === 0) return console.log('Nothing to validate in content/generated/.');

  const library = loadSolved().map((s) => s.challenge);
  const seen = new Set(library.map(dedupeKey));
  const rejections: Rejection[] = [];
  const totals = new Map<string, { candidates: number; accepted: number }>();
  const count = (template: string, key: 'candidates' | 'accepted') => {
    const t = totals.get(template) ?? { candidates: 0, accepted: 0 };
    t[key]++;
    totals.set(template, t);
  };

  // Stages 1-4 run locally and need no network.
  let tentative = 900000;
  const survivors: Candidate[] = [];
  for (const { file, data } of readJsonFiles(GENERATED_DIR).filter((f) => files.includes(f.file))) {
    const generated = data as GeneratedFile;
    for (const call of generated.calls) {
      if (call.error || !call.items) {
        rejections.push({ file, template: generated.template, stage: 'generate', reasons: [call.error ?? 'no items'] });
        continue;
      }
      for (const item of call.items) {
        count(generated.template, 'candidates');
        const reject = (stage: Stage, reasons: string[]) =>
          rejections.push({ file, template: generated.template, stage, reasons, item });

        const raw = wrap(item, generated.template, `${generated.template}_${tentative++}`);
        if (!raw) {
          reject('shape', ['not a challenge object for this template']);
          continue;
        }
        const checked = checkChallenge(raw);
        if (!checked.ok) {
          reject('schema', checked.errors);
          continue;
        }
        const lint = lintPrompt(checked.challenge);
        if (lint.length > 0) {
          reject('lint', lint);
          continue;
        }
        const key = dedupeKey(checked.challenge);
        if (seen.has(key)) {
          reject('duplicate', ['same template and params as an existing challenge']);
          continue;
        }
        seen.add(key);
        survivors.push({ file, challenge: checked.challenge, solution: checked.solution });
      }
    }
  }

  // Stage 5: blind fact check for fact-type templates.
  const questions = survivors.flatMap((s) => factQuestion(s.challenge) ?? []);
  console.log(`${survivors.length} passed local checks; fact-checking ${questions.length}...`);
  const facts = questions.length > 0 ? await factCheck(makeClient(), questions, concurrency) : new Map();
  const factPassed = survivors.filter((s) => {
    const verdict = facts.get(s.challenge.id);
    if (!verdict || verdict.ok) return true;
    rejections.push({ file: s.file, template: s.challenge.template, stage: 'fact', reasons: [verdict.reason ?? 'failed'], item: s.challenge });
    return false;
  });

  // Stage 6: the bot has to win each one in a phone viewport.
  console.log(`Bot-testing ${factPassed.length}...`);
  const bot = await botCheck(factPassed, concurrency);
  const accepted = factPassed.filter((s) => {
    const verdict = bot.get(s.challenge.id);
    if (verdict?.ok) return true;
    rejections.push({ file: s.file, template: s.challenge.template, stage: 'bot', reasons: [verdict?.reason ?? 'not played'], item: s.challenge });
    return false;
  });

  // Final ids continue each template's numbering in the library.
  const next = nextNumbers(library);
  const approved = accepted.map(({ challenge }) => {
    const n = next.get(challenge.template) ?? 1;
    next.set(challenge.template, n + 1);
    count(challenge.template, 'accepted');
    return { ...challenge, id: `${challenge.template}_${String(n).padStart(4, '0')}` };
  });

  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '');
  const summary = [...totals].map(([template, t]) => ({
    template,
    candidates: t.candidates,
    accepted: t.accepted,
    rejected: t.candidates - t.accepted,
    rejectionRate: percent(t.candidates - t.accepted, t.candidates),
  }));
  const byStage = Object.fromEntries(
    (['generate', 'shape', 'schema', 'lint', 'duplicate', 'fact', 'bot'] as const).map((s) => [s, rejections.filter((r) => r.stage === s).length]),
  );

  if (!dryRun) {
    for (const c of approved) writeFileSync(join(CHALLENGES_DIR, `${c.id}.json`), JSON.stringify(c, null, 2) + '\n');
    mkdirSync(PROCESSED_DIR, { recursive: true });
    for (const file of files) if (existsSync(file)) renameSync(file, join(PROCESSED_DIR, basename(file)));
  }
  mkdirSync(REPORTS_DIR, { recursive: true });
  const reportPath = join(REPORTS_DIR, `validate_${stamp}${dryRun ? '_dry-run' : ''}.json`);
  writeFileSync(
    reportPath,
    JSON.stringify({ createdAt: new Date().toISOString(), dryRun, files, summary, byStage, approved: approved.map((c) => c.id), rejections }, null, 2) + '\n',
  );

  console.table(summary);
  console.log('Rejections by stage:', byStage);
  console.log(`${dryRun ? 'Would approve' : 'Approved'} ${approved.length} configs. Report: ${reportPath}`);
  console.log(`Usage: ${usageLine()}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
