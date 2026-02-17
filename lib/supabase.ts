import { createClient } from '@supabase/supabase-js';

/**
 * CRITICAL: Vite environment variables MUST be accessed via literal string
 * for the production bundler to perform static replacement.
 * Do NOT use dynamic accessors like (import.meta as any).env.
 */
const VITE_URL = import.meta.env.VITE_SUPABASE_URL;
const VITE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Exported for debug visibility if needed (do not log keys in production)
export const supabaseUrl = VITE_URL || '';
export const supabaseAnonKey = VITE_KEY || '';

/**
 * System Configuration State
 * The system is "Configured" only if a valid absolute URL and Key are present.
 */
export const isSystemConfigured = !!(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http'));

/**
 * Preview/Sandbox Detection
 * Used primarily for UI hints; logic now relies on isSystemConfigured.
 */
export const isPreview = typeof window !== 'undefined' && (
  window.location.hostname.includes('aistudio') ||
  window.location.hostname.includes('localhost') ||
  window.location.hostname.includes('127.0.0.1') ||
  window.location.hostname.includes('stackblitz') ||
  window.location.hostname.includes('webcontainer')
);

/**
 * Engine Selection
 * Always attempt Cloud Engine if configured. 
 * Relative path requests (which cause production failure) are now impossible 
 * because we use a valid absolute placeholder if VITE_URL is missing.
 */
export const useCloudEngine = isSystemConfigured;

/**
 * Initialize Supabase Client
 * If env vars are missing, we use a placeholder that clearly points to 
 * a non-resolvable domain instead of letting the client use relative paths.
 */
const clientUrl = isSystemConfigured ? supabaseUrl : 'https://OFFLINE_MODE_ACTIVE.supabase.co';
const clientKey = isSystemConfigured ? supabaseAnonKey : 'no-key-provided';

export const supabase = createClient(clientUrl, clientKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

// Boot logging for debugging production connectivity
if (typeof window !== 'undefined') {
  if (isSystemConfigured) {
    console.log('[System] Nexus Pro: Secure Uplink Initialized.');
  } else {
    console.warn('[System] Nexus Pro: Environment Variables Missing. Running in Local Mode.');
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
    console.error(`[Uplink] Cloud Storage Failure (${bucket}):`, uploadError.message);
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
  if (error) console.error(`[Uplink] Cloud Storage Deletion Error:`, error.message);
};

/**
 * checkConnection: Health check for database reachability.
 */
export const checkConnection = async (): Promise<boolean> => {
  if (!useCloudEngine) return true;
  try {
    const { error } = await supabase.from('links').select('id').limit(1);
    if (error) {
      console.error('[System] Cloud Link Verification Failed:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[System] Cloud Endpoint Unreachable:', e);
    return false;
  }
};