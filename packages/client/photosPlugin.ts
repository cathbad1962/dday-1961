import { createReadStream } from 'node:fs';
import { readdir } from 'node:fs/promises';
import type { Plugin } from 'vite';

const PHOTO = /\.(jpe?g|png|webp)$/i;

async function listPhotos(directory: string): Promise<string[]> {
  try {
    return (await readdir(directory)).filter((name) => PHOTO.test(name)).sort();
  } catch {
    // The photos are kept out of the repo, so on most checkouts there are none.
    return [];
  }
}

/**
 * Serves the board photos in docs/rules/photos so the editor can trace over them.
 * Like saving the map, it only exists on the dev server: the photos never reach the live site.
 */
export function photosPlugin(directory: string): Plugin {
  return {
    name: 'dday-board-photos',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/photos', (request, response, next) => {
        if (request.method !== 'GET') return next();
        const name = decodeURIComponent(
          (request.url ?? '/').replace(/^\//, '').split('?')[0] ?? '',
        );
        void listPhotos(directory).then((photos) => {
          if (name === '') {
            response.setHeader('Content-Type', 'application/json');
            response.end(JSON.stringify(photos));
            return;
          }
          // Only names from the listing are served, so a request can't reach outside the folder.
          if (!photos.includes(name)) {
            response.statusCode = 404;
            response.end();
            return;
          }
          createReadStream(`${directory}/${name}`).pipe(response);
        });
      });
    },
  };
}
