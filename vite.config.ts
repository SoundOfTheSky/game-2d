import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import { compression } from 'vite-plugin-compression2';
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react(), compression({ algorithms: ['br'], exclude: [/\.(br)$/, /\.(gz)$/] })],
  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
    },
  },
  build: {
    target: 'esnext',
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('src', import.meta.url)),
    },
  },
});
