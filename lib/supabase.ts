
import { createClient } from '@supabase/supabase-js';

// --- Environment Configuration ---

// Safe accessor for environment variables to prevent crashes
const getEnv = (key: string) => {
  try {
    // Check import.meta.env (Vite)
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env[key];
    }
  } catch (e) {
    // Ignore errors accessing import.meta
  }

  try {
    // Check process.env (Node/Polyfill)
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env) {
      // @ts-ignore
      return process.env[key];
    }
  } catch (e) {
    // Ignore errors accessing process
  }

  return undefined;
};

// Attempt to resolve credentials with fallback priorities
const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL') || getEnv('VITE_SUPABASE_URL');
const supabaseKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') || getEnv('VITE_SUPABASE_ANON_KEY');

console.log('[System] Initializing Database Connection...', { 
  urlAvailable: !!supabaseUrl, 
  keyAvailable: !!supabaseKey 
});

let client = null;

try {
  if (supabaseUrl && supabaseKey) {
    client = createClient(supabaseUrl, supabaseKey);
    console.log('[System] Supabase initialized successfully.');
  } else {
    console.warn('[System Alert] Supabase credentials missing. App operating in Local/Offline mode.');
  }
} catch (error) {
  console.error('[System Critical] Supabase initialization failed:', error);
}

export const supabase = client;
export const isSupabaseConfigured = !!supabase;

// --- System Health Check ---
export const checkConnection = async (): Promise<boolean> => {
    if (!supabase) return false;
    try {
        const { error } = await supabase.from('nexus_files').select('id').limit(1);
        // PGRST116: JSON object returned (success for head check)
        // 404/PGRST204: Table might not exist yet, but connection is alive
        return !error || ['PGRST116', 'PGRST204', '42P01'].includes(error.code); 
    } catch (e) {
        console.warn('Connection probe failed:', e);
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

export interface NexusFile {
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
    created_at: string;
    storage_path: string;
}

export interface ObserverLog {
    id: string;
    image_url: string;
    category: 'LOOT_DROPS' | 'TRADE_LOGS' | 'CONFIGS' | 'UNCATEGORIZED';
    note?: string;
    linked_identity_id?: string;
    created_at: string;
}

// --- Storage Helpers ---

export const uploadToVault = async (file: File, bucket: string = 'nexus-vault'): Promise<{ publicUrl: string; path: string }> => {
    if (!supabase) throw new Error("System Offline");

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
