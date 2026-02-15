
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1600,
  },
  // Explicitly allow NEXT_PUBLIC_ prefix so Vite exposes these vars on import.meta.env
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  define: {
    // Prevents "process is not defined" errors in some third-party libs
    'process.env': {} 
  }
});
