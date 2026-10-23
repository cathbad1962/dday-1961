import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildServer } from './app';

describe('server', () => {
  it('reports health', async () => {
    const app = buildServer();
    const response = await app.inject({ method: 'GET', url: '/api/health' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ ok: true, game: 'D-Day', edition: 1961 });
  });

  describe('with a client build', () => {
    const clientDir = mkdtempSync(join(tmpdir(), 'dday-client-'));
    writeFileSync(join(clientDir, 'index.html'), '<title>D-Day 1961</title>');
    const app = buildServer({ clientDir });

    it('serves index.html at the root', async () => {
      const response = await app.inject({ method: 'GET', url: '/' });
      expect(response.statusCode).toBe(200);
      expect(response.body).toContain('D-Day 1961');
    });

    it('falls back to index.html for client routes', async () => {
      const response = await app.inject({ method: 'GET', url: '/game/abc123' });
      expect(response.statusCode).toBe(200);
      expect(response.body).toContain('D-Day 1961');
    });

    it('returns 404 JSON for unknown API routes', async () => {
      const response = await app.inject({ method: 'GET', url: '/api/nope' });
      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual({ error: 'Not found' });
    });
  });
});
