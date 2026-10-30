import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseLine } from './read.js';
import type { RunStatus } from './types.js';

export type NightCounts = Record<RunStatus, number>;

// Per run line (not per job), using the same parseLine as readNight; bad lines are skipped.
export function countRunLines(text: string): NightCounts {
  const counts: NightCounts = { ok: 0, retry: 0, fail: 0 };
  for (const line of text.split('\n')) {
    if (line.trim() === '') continue;
    const r = parseLine(line);
    if (r) counts[r.status]++;
  }
  return counts;
}

export function readNightCounts(runsDir: string, night: string): NightCounts | null {
  try {
    return countRunLines(readFileSync(join(runsDir, `${night}.jsonl`), 'utf8'));
  } catch {
    return null;
  }
}
