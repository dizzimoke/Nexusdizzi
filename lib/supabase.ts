import { createClient } from '@supabase/supabase-js';

// --- Production Configuration ---
// Hardcoded credentials for direct connection to Supabase backend.
export const supabaseUrl = 'https://vkqkzdzhojmqfjkpfaey.supabase.co';
export const supabaseAnonKey = 'sb_publishable_Dc20iGatEqfX4Njz-ye1lQ_bfhJwVMI';

/**
 * Initialize Supabase client for Production environment.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
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
 * uploadToVault: Transmits raw data to specified Supabase Storage Buckets.
 * Primarily handles 'vault' (Observer) and 'nexus_files' (Nexus Air).
 */
export const uploadToVault = async (file: File, bucket: string): Promise<{ publicUrl: string; path: string }> => {
  if (!supabase) throw new Error("Supabase client is not initialized.");

  // Generate a unique path to prevent collisions
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
  const filePath = fileName;

  try {
    console.log(`[Storage] Uploading to bucket: ${bucket}, path: ${filePath}`);

    const { data, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error(`[Storage] Supabase Upload Error (${bucket}):`, uploadError);
      throw uploadError;
    }

    // Generate Public URL for retrieval
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    if (!publicUrl) {
      throw new Error("Failed to generate public URL for uploaded asset.");
    }

    return { publicUrl, path: filePath };
  } catch (err) {
    console.error(`[Storage] Critical operation failure in ${bucket}:`, err);
    throw err;
  }
};

/**
 * deleteFromVault: Permanently removes an asset from storage.
 */
export const deleteFromVault = async (path: string, bucket: string) => {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) {
      console.error(`[Storage] Deletion Error (${bucket}):`, error.message);
    }
  } catch (e) {
    console.error(`[Storage] Unexpected deletion failure for ${path}:`, e);
  }
};

/**
 * checkConnection: Health check for database reachability.
 */
export const checkConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('links').select('id').limit(1);
    if (error) {
      console.warn('[System] Connection check returned error (Expected in Restricted Preview):', error.message);
      return true; // Consider reachable if server responded
    }
    return true;
  } catch (e) {
    console.error('[System] Database Link Severed:', e);
    return false;
  }
};
