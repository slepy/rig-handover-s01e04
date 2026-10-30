import { Hono } from 'hono';
import { loadConfig, type RigConfig } from './config.js';
import { readNight } from './digest/read.js';
import { lane } from './lane.js';
import { readStatus } from './status.js';
import { DigestMissing, DigestPage } from './views/digest.js';
import { Layout } from './views/layout.js';
import { StatusBoard } from './views/status.js';

export function createApp(config: RigConfig = loadConfig()) {
  const app = new Hono();

  app.get('/health', (c) => c.json({ ok: true, lane: lane().id }));

  app.get('/', (c) =>
    c.html(
      <Layout title="status" lane={lane()}>
        <StatusBoard status={readStatus(config)} />
      </Layout>,
    ),
  );

  app.get('/digest/:night', (c) => {
    const nightId = c.req.param('night');
    const night = readNight(config.runsDir, nightId);
    if (!night) {
      return c.html(
        <Layout title={`digest · ${nightId}`} lane={lane()}>
          <DigestMissing night={nightId} />
        </Layout>,
        404,
      );
    }
    return c.html(
      <Layout title={`digest · ${nightId}`} lane={lane()}>
        <DigestPage night={night} />
      </Layout>,
    );
  });

  // Same rows as the page (ADR 0001): readNight's output, untouched.
  app.get('/api/digest/:night', (c) => {
    const night = c.req.param('night');
    const result = readNight(config.runsDir, night);
    if (!result) return c.json({ error: 'no such night', night }, 404);
    return c.json({ night: result.night, rows: result.rows, badLines: result.badLines });
  });

  return app;
}
