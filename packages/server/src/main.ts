import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildServer } from './app';

const port = Number(process.env.PORT ?? 3061);
const host = process.env.HOST ?? '127.0.0.1';
const clientDir = fileURLToPath(new URL('../../client/dist/', import.meta.url));

const app = buildServer({
  clientDir: existsSync(clientDir) ? clientDir : undefined,
  logger: true,
});

if (!existsSync(clientDir)) {
  app.log.warn(`No client build at ${clientDir}; serving the API only. Run "npm run build".`);
}

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, () => {
    void app.close().then(() => process.exit(0));
  });
}

await app.listen({ port, host });
