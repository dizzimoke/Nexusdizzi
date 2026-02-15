import { createClient } from '@supabase/supabase-js';

// --- Environment Configuration ---
// optimized for Vite + Vercel compatibility
const supabaseUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || "";
const supabaseKey = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || "";

console.log('[System] Initializing Nexus Database...', { 
  connected: !!supabaseUrl && !!supabaseKey 
});

// Initialize client as null to prevent crash
export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

export const isSupabaseConfigured = !!supabase;

// --- System Health Check ---
export const checkConnection = async (): Promise<boolean> => {
    if (!supabase) return false;
    try {
        const { error } = await supabase.from('nexus_files').select('id').limit(1);
        return !error || ['PGRST116', 'PGRST204', '42P01'].includes(error.code); 
    } catch (e) {
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