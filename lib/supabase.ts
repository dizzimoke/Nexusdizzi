import { createClient } from '@supabase/supabase-js';

// Se o erro persiste, é porque o código ainda tenta ler variáveis. 
// ESTES VALORES ABAIXO SÃO FIXOS. NÃO USE VARIÁVEIS AQUI.
export const supabaseUrl = 'https://vkqkzdzhojmqfjkpfaey.supabase.co';
export const supabaseAnonKey = 'sb_publishable_Dc20iGatEqfX4Njz-ye1lQ_bfhJwVMI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const checkConnection = async () => {
    try {
        const { data, error } = await supabase.from('links').select('id').limit(1);
        return !error;
    } catch (e) {
        return false;
    }
};