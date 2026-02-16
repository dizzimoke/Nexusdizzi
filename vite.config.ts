import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Isso força o sistema a ignorar variáveis de ambiente globais que causam o erro
    'process.env': {},
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://vkqkzdzhojmqfjkpfaey.supabase.co'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('sb_publishable_Dc20iGatEqfX4Njz-ye1lQ_bfhJwVMI'),
  }
});