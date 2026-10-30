import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';

describe('GET /digest/:night (smoke)', () => {
  const app = createApp(loadConfig());

  it('renders 2026-10-28', async () => {
    const res = await app.request('/digest/2026-10-28');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('digest · 2026-10-28');
    expect(html).toContain('skipped');
  });

  it('404s for a missing night', async () => {
    const res = await app.request('/digest/2026-01-01');
    expect(res.status).toBe(404);
  });
});
