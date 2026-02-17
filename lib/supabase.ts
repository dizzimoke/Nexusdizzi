import { createClient } from '@supabase/supabase-js';

// --- Environment Detection ---
// Direct requirement: Detect AI Studio or Localhost for Dual-Engine logic.
export const isPreview = typeof window !== 'undefined' && (
  window.location.hostname.includes('aistudio') || 
  window.location.hostname.includes('localhost') ||
  window.location.hostname.includes('127.0.0.1')
);

// --- Production Configuration ---
export const supabaseUrl = 'https://vkqkzdzhojmqfjkpfaey.supabase.co';
export const supabaseAnonKey = 'sb_publishable_Dc20iGatEqfX4Njz-ye1lQ_bfhJwVMI';

/**
 * Initialize Supabase client.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  },
  global: {
    fetch: (input, init) => fetch(input, init),
  }
});

// --- System Types ---

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

// --- Storage Engine ---

/**
 * uploadToVault: Transmits raw data to Supabase Storage.
 * In Preview: Returns a local Blob URL to avoid fetch errors.
 */
export const uploadToVault = async (file: File, bucket: string): Promise<{ publicUrl: string; path: string }> => {
  if (isPreview) {
    console.log('[System] Preview Mode: Simulating Uplink');
    const localUrl = URL.createObjectURL(file);
    return { publicUrl: localUrl, path: 'local_temp_' + Date.now() };
  }

  if (!supabase) throw new Error("SYSTEM_OFFLINE: Database link not initialized");

  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
  const filePath = fileName;

  try {
    const { data, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error(`[Production Storage] Transmission Failure (${bucket}):`, uploadError.message);
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    if (!publicUrl) throw new Error("Failed to generate public URL");

    return { publicUrl, path: filePath };
  } catch (err: any) {
    console.error(`[Production Storage] Critical failure in ${bucket}:`, err.message || err);
    throw err;
  }
};

/**
 * deleteFromVault: Removes an asset from Supabase storage.
 */
export const deleteFromVault = async (path: string, bucket: string) => {
  if (isPreview || path.startsWith('local_temp_')) return;
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) {
      console.error(`[Production Storage] Deletion Error (${bucket}):`, error.message);
    }
  } catch (e) {
    console.error(`[Production Storage] Unexpected failure for ${path}:`, e);
  }
};

/**
 * checkConnection: Health check for database reachability.
 */
export const checkConnection = async (): Promise<boolean> => {
  if (isPreview) return true;
  try {
    const { error } = await supabase.from('links').select('id').limit(1);
    return !error;
  } catch (e) {
    return false;
  }
};