import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  define: {
    // Ensuring 'process.env' is defined as an empty object to avoid runtime errors in some modules.
    'process.env': {},
    // Explicitly defining Supabase variables for Vercel build stability.
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://vkqkzdzhojmqfjkpfaey.supabase.co'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('sb_publishable_Dc20iGatEqfX4Njz-ye1lQ_bfhJwVMI'),
  }
});
