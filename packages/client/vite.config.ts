import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { mapFilePlugin } from './mapFilePlugin.ts';

const mapPath = fileURLToPath(new URL('../../data/map.json', import.meta.url));

export default defineConfig({
  plugins: [react(), mapFilePlugin(mapPath)],
  // Saving the map shouldn't reload the page being edited.
  server: { watch: { ignored: ['**/data/map.json', '**/data/map.json.tmp'] } },
});
