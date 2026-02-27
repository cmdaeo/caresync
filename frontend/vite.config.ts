import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Fix for __dirname in ESM
const __dirname = path.resolve();

export default defineConfig({
  plugins: [react()],
  root: '.',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true,
  },
});
