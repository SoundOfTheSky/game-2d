import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import { compression } from 'vite-plugin-compression2';

export default defineConfig({
  plugins: [compression({ algorithm: 'brotliCompress', exclude: [/\.(br)$/, /\.(gz)$/] })],
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
