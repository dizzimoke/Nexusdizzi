
import { createClient } from '@supabase/supabase-js';

// --- Configuration ---
// HARDCODED VALUES as requested to ensure immediate connection stability.
export const supabaseUrl = 'https://vkqkzdzhojmqfjkpfaey.supabase.co';
export const supabaseAnonKey = 'sb_publishable_Dc20iGatEqfX4Njz-ye1lQ_bfhJwVMI';

console.log('[System] Initializing Nexus Database Link (Hardcoded)...');

/**
 * Initialize Supabase client.
 * Using native window.fetch directly often bypasses sandbox interceptors 
 * that cause 'Failed to fetch' errors in blob-origin environments.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
    },
    global: {
        // Fix: Explicitly define parameters to avoid spread argument tuple error in fetch implementation
        fetch: (input, init) => window.fetch(input, init),
    }
});

export const isSupabaseConfigured = true;

// --- System Health Check ---
export const checkConnection = async (): Promise<boolean> => {
    if (!supabase) return false;
    try {
        // Simple query to verify connectivity to the public 'links' table.
        const { error } = await supabase.from('links').select('id').limit(1);
        
        if (error) {
            console.warn('[System] Database Link Check Error:', error.message);
            // If the error message is generic, the network might still be the culprit.
            return false;
        }

        console.log('[System] Database Connection: ONLINE');
        return true;
    } catch (e) {
        console.error('[System] Connection Probe Failed (Network Error):', e);
        return false; 
    }
};

// --- Types ---
export interface VaultItem {
  id: string;
  title: string;
  username: string;
  password?: string;
  hidden_description?: string;
  color: string;
  icon: string;
  created_at?: string;
}

export interface SmartLink {
  id: string;
  title: string;
  url: string;
  created_at?: string;
}

export interface Task {
  id: string;
  date: string;
  task_title: string;
  is_completed: boolean;
  created_at?: string;
}

export interface ObserverLog {
    id: string;
    image_url: string;
    category: 'LOOT_DROPS' | 'TRADE_LOGS' | 'CONFIGS' | 'UNCATEGORIZED';
    note?: string;
    linked_identity_id?: string;
    created_at: string;
}

export interface NexusFile {
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
    created_at: string;
    storage_path: string;
}

// --- Storage Helpers ---
export const uploadToVault = async (file: File, bucket: string = 'nexus-vault'): Promise<{ publicUrl: string; path: string }> => {
    if (!supabase) throw new Error("SYSTEM_OFFLINE: Supabase not configured");

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = fileName;

    const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return { publicUrl: data.publicUrl, path: filePath };
};

export const deleteFromVault = async (path: string, bucket: string = 'nexus-vault') => {
    if (!supabase) return;
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) console.error("Storage deletion failed:", error);
};
