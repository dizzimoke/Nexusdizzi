import { createClient } from '@supabase/supabase-js';

// Safe environment variable retrieval that works in Vite (import.meta.env) 
// and standard environments (process.env).
const getEnv = (key: string, viteKey?: string): string => {
  // Try import.meta.env (Vite standard)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      const val = import.meta.env[key] || (viteKey ? import.meta.env[viteKey] : undefined);
      if (val) return val;
    }
  } catch (e) {
    // Ignore errors accessing import.meta
  }

  // Try process.env (Standard/Legacy)
  try {
    if (typeof process !== 'undefined' && process.env) {
      const val = process.env[key] || (viteKey ? process.env[viteKey] : undefined);
      if (val) return val;
    }
  } catch (e) {
    // Ignore errors accessing process
  }

  return '';
};

// Check for both REACT_APP_ (CRA style) and VITE_ (Vite style) prefixes
const supabaseUrl = getEnv('REACT_APP_SUPABASE_URL', 'VITE_SUPABASE_URL');
const supabaseKey = getEnv('REACT_APP_SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY');

// Create a single supabase client for interacting with your database
export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

export const isSupabaseConfigured = !!supabase;

export interface VaultItem {
  id: string;
  title: string;
  username: string;
  password?: string;
  hidden_description?: string;
  color: string;
  icon: string;
}

export interface SmartLink {
  id: string;
  title: string;
  url: string;
}

export interface Task {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  task_title: string;
  is_completed: boolean;
}

// File Sharing Helper
export const uploadFile = async (file: File): Promise<string> => {
  // If Supabase is configured, use Storage
  if (isSupabaseConfigured && supabase) {
    const fileName = `${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from('nexus_share')
      .upload(fileName, file);

    if (error) throw error;
    
    // Check if data is null or path is missing to avoid runtime errors
    if (!data?.path) throw new Error("Upload failed: No path returned");

    const { data: { publicUrl } } = supabase.storage
      .from('nexus_share')
      .getPublicUrl(data.path); // Use data.path instead of fileName for correctness
      
    return publicUrl;
  }
  
  // FALLBACK (Mock Mode):
  // Return a blob URL that works locally for demonstration.
  // In a real app without backend, we'd use WebRTC.
  return new Promise((resolve) => {
    setTimeout(() => {
        resolve(URL.createObjectURL(file));
    }, 1500); // Simulate network delay
  });
};