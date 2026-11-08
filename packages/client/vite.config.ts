import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { mapFilePlugin } from './mapFilePlugin.ts';
import { photosPlugin } from './photosPlugin.ts';

const mapPath = fileURLToPath(new URL('../../data/map.json', import.meta.url));
const photosPath = fileURLToPath(new URL('../../docs/rules/photos', import.meta.url));

export default defineConfig({
  plugins: [react(), mapFilePlugin(mapPath), photosPlugin(photosPath)],
  // Saving the map shouldn't reload the page being edited.
  server: { watch: { ignored: ['**/data/map.json', '**/data/map.json.tmp'] } },
});
