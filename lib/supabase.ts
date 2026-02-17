import { createClient } from '@supabase/supabase-js';

// --- Environment Detection ---
export const isPreview = typeof window !== 'undefined' && (
  window.location.hostname.includes('aistudio') ||
  window.location.hostname.includes('localhost') ||
  window.location.hostname.includes('127.0.0.1') ||
  window.location.hostname.includes('stackblitz') ||
  window.location.hostname.includes('webcontainer')
);

// ✅ Vite ENV (literal access only)
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// If env is missing, treat as preview/offline engine (DO NOT use fake placeholder URLs)
const envMissing = !supabaseUrl || !supabaseAnonKey;
export const isPreviewEffective = isPreview || envMissing;

if (envMissing) {
  console.warn(
    '⚠️ Missing Supabase env vars: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. ' +
    'Production database calls will be disabled until they are set.'
  );
}

// Create client only when env exists, otherwise keep a harmless empty client.
export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
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

export const uploadToVault = async (
  file: File,
  bucket: string
): Promise<{ publicUrl: string; path: string }> => {
  // Preview/offline: never attempt Supabase network calls
  if (isPreviewEffective) {
    const localUrl = URL.createObjectURL(file);
    return { publicUrl: localUrl, path: 'local_temp_' + Date.now() };
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
  const filePath = fileName;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, { cacheControl: '3600', upsert: false });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  const publicUrl = data?.publicUrl;

  if (!publicUrl) throw new Error('Failed to generate public URL');

  return { publicUrl, path: filePath };
};

export const deleteFromVault = async (path: string, bucket: string) => {
  if (isPreviewEffective || path.startsWith('local_temp_')) return;
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) console.error(`[Storage] delete failed (${bucket}):`, error.message);
};

export const checkConnection = async (): Promise<boolean> => {
  // Preview/offline engine always "ok" to prevent UI from forcing offline
  if (isPreviewEffective) return true;

  try {
    const { error } = await supabase.from('links').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
};
