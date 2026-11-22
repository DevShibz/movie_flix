import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

// Vite runs inside the Node server (see middleware/frontend.js). The React source lives in ../client,
// but every package is installed once, in server/node_modules.
const serverDir = path.dirname(fileURLToPath(import.meta.url));
const clientDir = path.resolve(serverDir, '../client');
const nodeModules = path.join(serverDir, 'node_modules').replace(/\\/g, '/');

export default defineConfig({
  root: clientDir,
  cacheDir: path.join(serverDir, 'node_modules/.vite'),
  plugins: [react()],
  resolve: {
    // client/ has no node_modules of its own, so point the frontend's packages at the server's copy.
    alias: [{ find: /^(react|react-dom|react-router-dom)(?=$|\/)/, replacement: `${nodeModules}/$1` }],
  },
  css: {
    postcss: {
      plugins: [tailwindcss(path.join(clientDir, 'tailwind.config.js')), autoprefixer()],
    },
  },
  server: {
    fs: { allow: [clientDir, serverDir] },
  },
  build: {
    outDir: path.join(serverDir, 'dist'),
    emptyOutDir: true,
  },
});
