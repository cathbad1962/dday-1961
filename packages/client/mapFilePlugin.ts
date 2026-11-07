import { rename, writeFile } from 'node:fs/promises';
import type { IncomingMessage } from 'node:http';
import type { Plugin } from 'vite';

const MAX_BYTES = 5 * 1024 * 1024;

async function readBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = chunk as Buffer;
    size += buffer.length;
    if (size > MAX_BYTES) throw new Error('Map too large');
    chunks.push(buffer);
  }
  return Buffer.concat(chunks).toString('utf8');
}

/** Lets the editor save data/map.json. It only exists on the dev server, never on the live site. */
export function mapFilePlugin(mapPath: string): Plugin {
  return {
    name: 'dday-map-file',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/map', (request, response, next) => {
        if (request.method !== 'PUT') return next();
        if (request.headers['content-type'] !== 'application/json') {
          response.statusCode = 415;
          response.end();
          return;
        }
        const save = async () => {
          const body = await readBody(request);
          JSON.parse(body);
          // Writing to the side first means a failed save can't leave half a map behind.
          const temporaryPath = `${mapPath}.tmp`;
          await writeFile(temporaryPath, body);
          await rename(temporaryPath, mapPath);
        };
        save().then(
          () => {
            response.statusCode = 204;
            response.end();
          },
          (error: unknown) => {
            server.config.logger.error(`Couldn't save the map: ${String(error)}`);
            response.statusCode = 400;
            response.end();
          },
        );
      });
    },
  };
}
