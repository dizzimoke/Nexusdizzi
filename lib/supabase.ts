import { createClient } from '@supabase/supabase-js';

// --- Environment Detection ---
// Detect if we are in a sandbox or local dev environment
export const isPreview = typeof window !== 'undefined' && (
  window.location.hostname.includes('aistudio') ||
  window.location.hostname.includes('localhost') ||
  window.location.hostname.includes('127.0.0.1') ||
  window.location.hostname.includes('stackblitz') ||
  window.location.hostname.includes('webcontainer')
);

// --- Production Configuration (Vite ENV) ---
// Use hardcoded fallbacks only if ENV is missing to prevent startup crashes
const FALLBACK_URL = 'https://placeholder-project.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy';

export const supabaseUrl = (import.meta.env?.VITE_SUPABASE_URL as string) || FALLBACK_URL;
export const supabaseAnonKey = (import.meta.env?.VITE_SUPABASE_ANON_KEY as string) || FALLBACK_KEY;

// Final check to see if we should actually attempt network calls
const isConfigured = supabaseUrl !== FALLBACK_URL && supabaseAnonKey !== FALLBACK_KEY;
export const isPreviewEffective = isPreview || !isConfigured;

if (!isConfigured && !isPreview) {
  console.warn('[System] Supabase credentials missing. Defaulting to Local Storage mode.');
}

/**
 * Initialize Supabase client.
 * Using a safer initialization to prevent the "black screen of death" 
 * caused by module-level exceptions when keys are missing.
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
export const uploadToVault = async (
  file: File,
  bucket: string
): Promise<{ publicUrl: string; path: string }> => {
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

  if (uploadError) {
    console.error(`[Uplink] Transmission Failure (${bucket}):`, uploadError.message);
    throw uploadError;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  const publicUrl = data?.publicUrl;

  if (!publicUrl) throw new Error('Failed to generate public URL');

  return { publicUrl, path: filePath };
};

export const deleteFromVault = async (path: string, bucket: string) => {
  if (isPreviewEffective || path.startsWith('local_temp_')) return;
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) console.error(`[Uplink] Deletion Error (${bucket}):`, error.message);
};

/**
 * checkConnection: Health check for database reachability.
 */
export const checkConnection = async (): Promise<boolean> => {
  if (isPreviewEffective) return true;
  try {
    const { error } = await supabase.from('links').select('id').limit(1);
    return !error;
  } catch (e) {
    return false;
  }
};