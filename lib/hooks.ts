
import { useState, useEffect, useCallback } from 'react';
import { supabase, uploadToVault, deleteFromVault, VaultItem, Task, ObserverLog, NexusFile, SmartLink } from './supabase';

// Export types for better clarity
export type { SmartLink, Task, VaultItem, ObserverLog, NexusFile };

/**
 * useSmartLinks: Handles quick access links.
 */
export const useSmartLinks = () => {
  const [links, setLinks] = useState<SmartLink[]>([]);
  const fetchLinks = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('links').select('*').order('created_at', { ascending: false });
      if (!error && data) setLinks(data);
    } catch (err) {
      console.error('[Database] Failed to fetch links:', err);
    }
  }, []);
  
  useEffect(() => { fetchLinks(); }, [fetchLinks]);

  const addLink = async (link: { title: string; url: string }) => {
    const formattedUrl = link.url.startsWith('http') ? link.url : `https://${link.url}`;
    
    console.log('[Database] Executing Link Insertion...', { title: link.title, url: formattedUrl });
    
    try {
      const { data, error } = await supabase
        .from('links')
        .insert([{ title: link.title, url: formattedUrl }])
        .select();

      if (error) {
        console.error('[Database] Link Insertion Error:', error.message, error.details);
        return false;
      }

      console.log('[Database] Link Insertion Successful:', data);
      if (data && data.length > 0) {
        setLinks(prev => [data[0], ...prev]);
        return true;
      }
    } catch (err) {
      console.error('[Database] Critical Network Failure during Insertion:', err);
      return false;
    }
    return false;
  };

  const deleteLink = async (id: string) => {
    try {
      const { error } = await supabase.from('links').delete().eq('id', id);
      if (!error) {
        setLinks(prev => prev.filter(l => l.id !== id));
      }
    } catch (err) {
      console.error('[Database] Delete operation failed:', err);
    }
  };

  return { links, addLink, deleteLink, loading: false };
};

/**
 * useTasks: Handles calendar task management.
 */
export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const fetchTasks = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: true });
      if (!error && data) setTasks(data);
    } catch (err) {
      console.error('[Database] Failed to fetch tasks:', err);
    }
  }, []);
  
  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const addTask = async (taskData: Partial<Task>) => {
    console.log('[Database] Executing Task Insertion...', taskData);
    
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([taskData])
        .select();

      if (error) {
        console.error('[Database] Task Insertion Error:', error.message, error.details);
        return;
      }

      console.log('[Database] Task Insertion Successful:', data);
      if (data && data.length > 0) {
        setTasks(prev => [...prev, data[0] as Task]);
      }
    } catch (err) {
      console.error('[Database] Critical Network Failure during Task Insertion:', err);
    }
  };

  const toggleTask = async (id: string, completed: boolean) => {
    try {
      const { error } = await supabase.from('tasks').update({ is_completed: completed }).eq('id', id);
      if (!error) {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, is_completed: completed } : t));
      }
    } catch (err) {
      console.error('[Database] Toggle task failed:', err);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (!error) {
        setTasks(prev => prev.filter(t => t.id !== id));
      }
    } catch (err) {
      console.error('[Database] Task deletion failed:', err);
    }
  };

  return { tasks, addTask, toggleTask, deleteTask };
};

/**
 * useVaultItems: Secure storage for credentials.
 */
export const useVaultItems = () => {
  const [items, setItems] = useState<VaultItem[]>([]);
  const fetchItems = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('vault').select('*').order('created_at', { ascending: false });
      if (!error && data) setItems(data);
    } catch (err) {
      console.error('[Database] Vault fetch failed:', err);
    }
  }, []);
  
  useEffect(() => { fetchItems(); }, [fetchItems]);

  const addItem = async (item: Partial<VaultItem>) => {
    try {
      const { data, error } = await supabase.from('vault').insert([item]).select();
      if (!error && data) setItems(prev => [data[0] as VaultItem, ...prev]);
    } catch (err) {
      console.error('[Database] Vault addition failed:', err);
    }
  };
  
  const updateItem = async (id: string, updates: Partial<VaultItem>) => {
    try {
      const { data, error } = await supabase.from('vault').update(updates).eq('id', id).select();
      if (!error && data) setItems(prev => prev.map(i => i.id === id ? data[0] as VaultItem : i));
    } catch (err) {
      console.error('[Database] Vault update failed:', err);
    }
  };
  
  const deleteItem = async (id: string) => {
    try {
      await supabase.from('vault').delete().eq('id', id);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      console.error('[Database] Vault deletion failed:', err);
    }
  };
  
  return { items, addItem, updateItem, deleteItem, loading: false };
};

/**
 * useGhostMode: Blurs content after period of inactivity.
 */
export const useGhostMode = (timeout: number, active: boolean) => {
  const [isGhost, setIsGhost] = useState(false);
  useEffect(() => {
    if (!active) { setIsGhost(false); return; }
    let t = setTimeout(() => setIsGhost(true), timeout);
    const reset = () => { setIsGhost(false); clearTimeout(t); t = setTimeout(() => setIsGhost(true), timeout); };
    window.addEventListener('mousemove', reset);
    window.addEventListener('keydown', reset);
    return () => { clearTimeout(t); window.removeEventListener('mousemove', reset); window.removeEventListener('keydown', reset); };
  }, [active, timeout]);
  return isGhost;
};

/**
 * useCloakMessaging: Ephemeral, self-destructing messages via localStorage.
 */
export const useCloakMessaging = () => {
  const createMessage = (content: string, type: string, burnTimer: number) => {
    const id = Math.random().toString(36).substring(2, 9);
    const msg = { id, content, type, burnTimer, created_at: Date.now() };
    const stored = JSON.parse(localStorage.getItem('nexus_cloak') || '{}');
    stored[id] = msg;
    localStorage.setItem('nexus_cloak', JSON.stringify(stored));
    return id;
  };
  const getMessage = async (id: string) => {
    const stored = JSON.parse(localStorage.getItem('nexus_cloak') || '{}');
    return stored[id] || null;
  };
  const burnMessage = async (id: string) => {
    const stored = JSON.parse(localStorage.getItem('nexus_cloak') || '{}');
    delete stored[id];
    localStorage.setItem('nexus_cloak', JSON.stringify(stored));
  };
  return { createMessage, getMessage, burnMessage };
};

/**
 * useObserver: Handles visual intelligence logs.
 */
export const useObserver = () => {
  const [evidence, setEvidence] = useState<ObserverLog[]>([]);
  const fetchEvidence = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('observer_logs').select('*').order('created_at', { ascending: false });
      if (!error && data) setEvidence(data);
    } catch (err) {
      console.error('[Database] Observer fetch failed:', err);
    }
  }, []);
  
  useEffect(() => { fetchEvidence(); }, [fetchEvidence]);

  const addEvidence = async (file: File) => {
    try {
      const { publicUrl } = await uploadToVault(file, 'observer-logs');
      const { data, error } = await supabase.from('observer_logs').insert([{ image_url: publicUrl, category: 'LOOT_DROPS' }]).select();
      if (!error && data) setEvidence(prev => [data[0] as ObserverLog, ...prev]);
    } catch (err) {
      console.error('[Database] Evidence logging failed:', err);
    }
  };
  
  const updateEvidence = async (id: string, updates: Partial<ObserverLog>) => {
    try {
      const { data, error } = await supabase.from('observer_logs').update(updates).eq('id', id).select();
      if (!error && data) setEvidence(prev => prev.map(e => e.id === id ? data[0] as ObserverLog : e));
    } catch (err) {
      console.error('[Database] Evidence update failed:', err);
    }
  };
  
  const deleteEvidence = async (id: string) => {
    try {
      await supabase.from('observer_logs').delete().eq('id', id);
      setEvidence(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error('[Database] Evidence deletion failed:', err);
    }
  };
  
  const loadFromBackup = (data: ObserverLog[]) => { setEvidence(data); };
  return { evidence, addEvidence, updateEvidence, deleteEvidence, loadFromBackup };
};

/**
 * useNexusFiles: Cloud storage file management.
 */
export const useNexusFiles = () => {
  const [files, setFiles] = useState<NexusFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const fetchFiles = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('files').select('*').order('created_at', { ascending: false });
      if (!error && data) setFiles(data);
    } catch (err) {
      console.error('[Database] Files fetch failed:', err);
    }
  }, []);
  
  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const { publicUrl, path } = await uploadToVault(file, 'nexus-air');
      const { data, error } = await supabase.from('files').insert([{ name: file.name, size: file.size, type: file.type, url: publicUrl, storage_path: path }]).select();
      if (!error && data) setFiles(prev => [data[0] as NexusFile, ...prev]);
    } catch (err) {
      console.error('[Database] File upload failed:', err);
    } finally { setUploading(false); }
  };
  
  const deleteFile = async (id: string, path: string) => {
    try {
      await deleteFromVault(path, 'nexus-air');
      await supabase.from('files').delete().eq('id', id);
      setFiles(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      console.error('[Database] File deletion failed:', err);
    }
  };
  
  return { files, uploading, uploadFile, deleteFile };
};
