import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  define: {
    // Standardizing process.env for modules that might still expect it
    'process.env': {},
  }
});