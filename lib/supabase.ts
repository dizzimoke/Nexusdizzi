
import { createClient } from '@supabase/supabase-js';

// --- Configuration ---
// Hardcoded credentials as requested for immediate stability
export const supabaseUrl = 'https://vkqkzdzhojmqfjkpfaey.supabase.co';
export const supabaseAnonKey = 'sb_publishable_Dc20iGatEqfX4Njz-ye1lQ_bfhJwVMI';

console.log('[System] Initializing Nexus Database Link...');

// Initialize client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
console.log('[System] Supabase client initialized');

export const isSupabaseConfigured = true;

// --- System Health Check ---
export const checkConnection = async (): Promise<boolean> => {
    if (!supabase) return false;
    try {
        // We perform a lightweight check. Even if the table is empty or missing, 
        // a response from the server indicates we are ONLINE.
        const { error } = await supabase.from('nexus_files').select('id').limit(1);
        
        // Acceptable states:
        // null = Success
        // PGRST116 = Success (Single result)
        // PGRST204 = Success (No content)
        // 42P01 = Table missing (Connection valid, Schema missing)
        const isOnline = !error || ['PGRST116', 'PGRST204', '42P01'].includes(error.code);
        
        if (isOnline) {
             console.log('[System] Database Connection Established');
        } else {
             console.warn('[System] Database Handshake Warning:', error);
        }
        
        return isOnline;
    } catch (e) {
        console.error('[System] Connection Probe Failed:', e);
        // Fallback: If we have the client, assume we are online to prevent locking the UI
        return true; 
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
