import { createClient } from '@supabase/supabase-js';

// Valores diretos para eliminar o erro de 'undefined' na Vercel
export const supabaseUrl = 'https://vkqkzdzhojmqfjkpfaey.supabase.co';
export const supabaseAnonKey = 'sb_publishable_Dc20iGatEqfX4Njz-ye1lQ_bfhJwVMI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const checkConnection = async () => {
    try {
        const { error } = await supabase.from('links').select('id').limit(1);
        return !error || error.code === 'PGRST116';
    } catch {
        return false;
    }
};