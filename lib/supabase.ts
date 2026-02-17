import { createClient } from '@supabase/supabase-js';

// --- Safe Environment Detection ---
/**
 * CRITICAL: Use optional chaining to prevent crashes if import.meta.env is missing.
 * Vite will still perform static replacement for the literal strings during build.
 */
export const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || '';
export const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

/**
 * useCloudEngine: Boolean flag to determine if Supabase should be used.
 * Must be an absolute URL to avoid relative path requests in production.
 */
export const useCloudEngine = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('http')
);

export const isPreview = typeof window !== 'undefined' && (
  window.location.hostname.includes('aistudio') ||
  window.location.hostname.includes('localhost') ||
  window.location.hostname.includes('127.0.0.1') ||
  window.location.hostname.includes('stackblitz') ||
  window.location.hostname.includes('webcontainer')
);

/**
 * Initialize Supabase client.
 * Using a placeholder URL if missing to prevent relative-path errors (net::ERR_NAME_NOT_RESOLVED)
 */
export const supabase = createClient(
  useCloudEngine ? supabaseUrl : 'https://OFFLINE_MODE.supabase.co',
  useCloudEngine ? supabaseAnonKey : 'no-key'
);

// --- Logging for production debugging ---
if (typeof window !== 'undefined') {
  if (useCloudEngine) {
    console.log('[System] Nexus Pro: Cloud Engine Active.');
  } else {
    console.warn('[System] Nexus Pro: Operating in Local Engine (Environment variables missing).');
  }
}

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
export const uploadToVault = async (
  file: File,
  bucket: string
): Promise<{ publicUrl: string; path: string }> => {
  if (!useCloudEngine) {
    const localUrl = URL.createObjectURL(file);
    return { publicUrl: localUrl, path: 'local_temp_' + Date.now() };
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
  const filePath = fileName;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, { cacheControl: '3600', upsert: false });

  if (uploadError) {
    console.error(`[Uplink] Cloud Transmission Failure (${bucket}):`, uploadError.message);
    throw uploadError;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  const publicUrl = data?.publicUrl;

  if (!publicUrl) throw new Error('Failed to generate public URL');

  return { publicUrl, path: filePath };
};

export const deleteFromVault = async (path: string, bucket: string) => {
  if (!useCloudEngine || path.startsWith('local_temp_')) return;
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) console.error(`[Uplink] Cloud Deletion Error (${bucket}):`, error.message);
};

export const checkConnection = async (): Promise<boolean> => {
  if (!useCloudEngine) return true;
  try {
    const { error } = await supabase.from('links').select('id').limit(1);
    return !error;
  } catch (e) {
    return false;
  }
};