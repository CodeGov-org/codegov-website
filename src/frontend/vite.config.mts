import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import checker from 'vite-plugin-checker';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'path';
import dotenv from 'dotenv';

dotenv.config({
  path: resolve(process.cwd(), '..', '..', '.env'),
});

const UI_ENV_VARS = ['DFX_NETWORK', 'BACKEND_CANISTER_ID'];

process.env = {
  ...process.env,
  ...UI_ENV_VARS.reduce(
    (accum, entry) => ({
      ...accum,
      [`VITE_${entry}`]: process.env[entry],
    }),
    {},
  ),
};

export default defineConfig({
  plugins: [
    react(),
    checker({ typescript: true }),
    tsconfigPaths(),
    viteStaticCopy({
      targets: [
        {
          src: 'src/.ic-assets.json',
          dest: '.',
        },
      ],
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: id => {
          if (id.includes('@dfinity')) {
            return 'dfinity-vendor';
          }
        },
      },
    },
  },
  worker: {
    format: 'es',
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './src/test-setup',
    coverage: {
      provider: 'v8',
      all: true,
      include: ['src/**/*'],
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
  define: {
    'process.env': {
      DFX_NETWORK: process.env.DFX_NETWORK,
      BACKEND_CANISTER_ID: process.env.BACKEND_CANISTER_ID,
    },
  },
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8080',
    },
  },
});
