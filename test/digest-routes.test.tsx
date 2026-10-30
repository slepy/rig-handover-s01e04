import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

type Body = { night: string; rows: { job: string }[]; badLines: number };

const line = (at: string, job: string, status: string, owner: string | null = 'ana') =>
  JSON.stringify({ at, job, status, owner });

let dir: string;
let app: ReturnType<typeof createApp>;

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'rig-digest-'));
  writeFileSync(
    join(dir, '2026-01-01.jsonl'),
    [
      line('2026-01-01T01:00:00+01:00', 'zeta', 'ok'),
      line('2026-01-01T01:05:00+01:00', 'alpha', 'ok'),
      line('2026-01-01T01:10:00+01:00', 'mid', 'fail'),
      line('2026-01-01T01:15:00+01:00', 'alpha', 'retry'),
    ].join('\n') + '\n',
  );
  writeFileSync(join(dir, '2026-01-02.jsonl'), '');
  writeFileSync(
    join(dir, '2026-01-03.jsonl'),
    [line('2026-01-03T01:00:00+01:00', 'alpha', 'ok'), 'not json at all'].join('\n') + '\n',
  );
  app = createApp({
    adapter: 'shim',
    installed: '2026-01-01T00:00:00+01:00',
    beatEverySeconds: 60,
    runsDir: dir,
  });
});

afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('digest routes', () => {
  it('page: 200 for a real night', async () => {
    const res = await app.request('/digest/2026-01-01');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('digest · 2026-01-01');
  });

  it('json: 200 for a real night', async () => {
    const res = await app.request('/api/digest/2026-01-01');
    expect(res.status).toBe(200);
    const body = (await res.json()) as Body;
    expect(body.night).toBe('2026-01-01');
    expect(body.rows).toHaveLength(3);
    expect(body.badLines).toBe(0);
  });

  it('page: 404 for a night with no file', async () => {
    const res = await app.request('/digest/2026-02-02');
    expect(res.status).toBe(404);
    expect(await res.text()).toContain('no run log for this night');
  });

  it('json: 404 for a night with no file', async () => {
    const res = await app.request('/api/digest/2026-02-02');
    expect(res.status).toBe(404);
  });

  it('page: empty night says nothing ran', async () => {
    const res = await app.request('/digest/2026-01-02');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('nothing ran');
  });

  it('json: empty night has no rows', async () => {
    const res = await app.request('/api/digest/2026-01-02');
    expect(res.status).toBe(200);
    const body = (await res.json()) as Body;
    expect(body.rows).toEqual([]);
    expect(body.badLines).toBe(0);
  });

  it('page: bad line shows the skipped-lines note', async () => {
    const html = await (await app.request('/digest/2026-01-03')).text();
    expect(html).toContain('1 line skipped');
  });

  it('json: bad line counts in badLines', async () => {
    const body = (await (await app.request('/api/digest/2026-01-03')).json()) as Body;
    expect(body.badLines).toBe(1);
    expect(body.rows).toHaveLength(1);
  });

  it('page and json list the same jobs in the same order', async () => {
    const html = await (await app.request('/digest/2026-01-01')).text();
    const body = (await (await app.request('/api/digest/2026-01-01')).json()) as Body;
    const fromPage = [...html.matchAll(/<tr[^>]*><td>([^<]*)<\/td>/g)].map((m) => m[1]);
    expect(fromPage).toEqual(['alpha', 'mid', 'zeta']);
    expect(body.rows.map((r) => r.job)).toEqual(fromPage);
  });
});
