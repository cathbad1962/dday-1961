import { GAME_TITLE, RULES_EDITION } from '@dday/engine';
import fastifyStatic from '@fastify/static';
import Fastify from 'fastify';

export interface ServerOptions {
  /** Directory holding the built client; omit to serve the API only. */
  clientDir?: string;
  logger?: boolean;
}

export function buildServer({ clientDir, logger = false }: ServerOptions = {}) {
  const app = Fastify({ logger });

  app.get('/api/health', async () => ({ ok: true, game: GAME_TITLE, edition: RULES_EDITION }));

  if (clientDir) {
    app.register(fastifyStatic, { root: clientDir });
    // Unknown non-API paths get the client's index.html so client-side routes survive a reload.
    app.setNotFoundHandler((request, reply) => {
      if (request.method === 'GET' && !request.url.startsWith('/api/')) {
        return reply.sendFile('index.html');
      }
      return reply.code(404).send({ error: 'Not found' });
    });
  }

  return app;
}
