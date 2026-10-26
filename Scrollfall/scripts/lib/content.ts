import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkChallenge } from '../../src/engine/validate';
import type { Solved } from './bot';

export const CHALLENGES_DIR = 'content/challenges';
export const GENERATED_DIR = 'content/generated';

export function readJsonFiles(dir: string): { file: string; data: unknown }[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => ({ file: join(dir, f), data: JSON.parse(readFileSync(join(dir, f), 'utf8')) as unknown }));
}

// The approved library, checked the same way the app checks it. Throws on a bad file.
export function loadSolved(dir = CHALLENGES_DIR): Solved[] {
  return readJsonFiles(dir).map(({ file, data }) => {
    const result = checkChallenge(data);
    if (!result.ok) throw new Error(`${file}: ${result.errors.join('; ')}`);
    return { challenge: result.challenge, solution: result.solution };
  });
}
