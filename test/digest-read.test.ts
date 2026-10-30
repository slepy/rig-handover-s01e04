import { describe, expect, it } from 'vitest';
import { digest, parseLine, readNight } from '../src/digest/read.js';

describe('readNight', () => {
  it('reads 2026-10-28: 5 jobs, 1 bad line', () => {
    const n = readNight('runs', '2026-10-28');
    expect(n?.badLines).toBe(1);
    expect(n?.rows.map((r) => r.job)).toEqual([
      'digest/render',
      'fixtures/refresh',
      'lane/sync',
      'notes/backup',
      'rig/rotate-logs',
    ]);
  });

  it('counts runs and retries, keeps the last status and error', () => {
    const rows = readNight('runs', '2026-10-28')!.rows;
    const fixtures = rows.find((r) => r.job === 'fixtures/refresh')!;
    expect(fixtures).toMatchObject({ runs: 4, retries: 3, lastStatus: 'ok', lastError: null });
    expect(fixtures.firstAt).toBe('2026-10-29T01:30:00+01:00');
    expect(fixtures.lastAt).toBe('2026-10-29T01:37:00+01:00');
    expect(rows.find((r) => r.job === 'notes/backup')).toMatchObject({ lastStatus: 'fail', lastError: 'quota exceeded' });
  });

  it('keeps a row whose owner is null', () => {
    expect(readNight('runs', '2026-10-28')!.rows.find((r) => r.job === 'digest/render')?.owner).toBeNull();
  });

  it('returns null for a night with no file', () => {
    expect(readNight('runs', '2026-01-01')).toBeNull();
    expect(readNight('runs', '../package')).toBeNull();
  });

  it('an empty file is a night where nothing ran', () => {
    expect(digest('')).toEqual({ rows: [], badLines: 0 });
  });

  it('a line that does not parse is counted, never thrown', () => {
    expect(parseLine('{"at":"x","job":"a","status":"maybe","owner":null}')).toBeNull();
    expect(digest('not json\n{"at":"t","job":"a","status":"ok","owner":"o"}\n').badLines).toBe(1);
  });
});
