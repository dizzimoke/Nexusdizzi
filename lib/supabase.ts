import { createClient } from '@supabase/supabase-js';

// --- Safe Environment Detection ---
// We use a safe accessor for import.meta.env to prevent "Cannot read properties of undefined" errors
// in environments where Vite globals aren't injected or during raw ESM execution.
const env = (import.meta as any).env || {};

export const supabaseUrl = env.VITE_SUPABASE_URL as string;
export const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY as string;

// Detection for "Local Only" mode: Triggered if keys are missing or we are in a known sandbox
export const isSystemConfigured = !!(supabaseUrl && supabaseAnonKey);

export const isPreview = typeof window !== 'undefined' && (
  window.location.hostname.includes('aistudio') ||
  window.location.hostname.includes('localhost') ||
  window.location.hostname.includes('127.0.0.1') ||
  window.location.hostname.includes('stackblitz') ||
  window.location.hostname.includes('webcontainer')
);

// We should only use the Cloud Engine if configured AND not specifically forced into local-only dev
export const useCloudEngine = isSystemConfigured;

/**
 * Initialize Supabase client.
 * Using a safer initialization. If keys are missing, we create a dummy client 
 * but the hooks will know to bypass it via useCloudEngine check.
 */
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

if (!useCloudEngine) {
  console.info('[System] Nexus Pro: Cloud Engine not configured or env missing. Operating in Local Engine mode.');
} else {
  console.info('[System] Nexus Pro: Cloud Engine detected. Initializing Secure Uplink.');
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

/**
 * checkConnection: Health check for database reachability.
 */
export const checkConnection = async (): Promise<boolean> => {
  if (!useCloudEngine) return true;
  try {
    const { error } = await supabase.from('links').select('id').limit(1);
    if (error) {
      console.error('[System] Cloud Link Test Failed:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[System] Cloud Link unreachable:', e);
    return false;
  }
};