import { useState, useEffect, useCallback } from 'react';
import { 
  supabase, 
  uploadToVault, 
  deleteFromVault, 
  VaultItem, 
  Task, 
  ObserverLog, 
  NexusFile, 
  SmartLink 
} from './supabase';

// Export types for component usage
export type { SmartLink, Task, VaultItem, ObserverLog, NexusFile };

/**
 * useSmartLinks: Interface for the 'links' table (columns: title, url)
 */
export const useSmartLinks = () => {
  const [links, setLinks] = useState<SmartLink[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLinks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('links')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('[DB] Fetch Links Error:', error.message, error.details);
      } else if (data) {
        setLinks(data);
      }
    } catch (err) {
      console.error('[DB] Failed to fetch links:', err);
    }
  }, []);
  
  useEffect(() => { fetchLinks(); }, [fetchLinks]);

  const addLink = async (link: { title: string; url: string }) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('links')
        .insert([{ title: link.title, url: link.url }])
        .select();

      if (error) {
        console.error('[DB] Add Link Error:', error.message, error.details);
        return false;
      }
      
      if (data) {
        setLinks(prev => [data[0], ...prev]);
        return true;
      }
    } catch (err) {
      console.error('[DB] Link addition failed:', err);
      return false;
    } finally {
      setLoading(false);
    }
    return false;
  };

  const deleteLink = async (id: string) => {
    try {
      const { error } = await supabase.from('links').delete().eq('id', id);
      if (error) console.error('[DB] Delete Link Error:', error.message);
      else setLinks(prev => prev.filter(l => l.id !== id));
    } catch (err) {
      console.error('[DB] Failed to delete link:', err);
    }
  };

  return { links, addLink, deleteLink, loading };
};

/**
 * useVaultItems: Interface for 'vault_items' table (Secrets management)
 */
export const useVaultItems = () => {
  const [items, setItems] = useState<VaultItem[]>([]);
  
  const fetchItems = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('vault_items')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('[DB] Fetch Vault Items Error:', error.message);
      } else if (data) {
        setItems(data);
      }
    } catch (err) {
      console.error('[DB] Failed to fetch vault items:', err);
    }
  }, []);
  
  useEffect(() => { fetchItems(); }, [fetchItems]);

  const addItem = async (item: Partial<VaultItem>) => {
    try {
      const { data, error } = await supabase
        .from('vault_items')
        .insert([item])
        .select();

      if (error) {
        console.error('[DB] Add Vault Item Error:', error.message, error.details);
      } else if (data) {
        setItems(prev => [data[0], ...prev]);
      }
    } catch (err) {
      console.error('[DB] Failed to add vault item:', err);
    }
  };
  
  const updateItem = async (id: string, updates: Partial<VaultItem>) => {
    try {
      const { data, error } = await supabase
        .from('vault_items')
        .update(updates)
        .eq('id', id)
        .select();
      
      if (error) console.error('[DB] Update Vault Item Error:', error.message);
      else if (data) setItems(prev => prev.map(i => i.id === id ? data[0] : i));
    } catch (err) {
      console.error('[DB] Failed to update vault item:', err);
    }
  };
  
  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase.from('vault_items').delete().eq('id', id);
      if (error) console.error('[DB] Delete Vault Item Error:', error.message);
      else setItems(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      console.error('[DB] Failed to delete vault item:', err);
    }
  };
  
  return { items, addItem, updateItem, deleteItem, loading: false };
};

/**
 * useObserver: Visual Intelligence logs (table: observations, bucket: vault)
 */
export const useObserver = () => {
  const [evidence, setEvidence] = useState<ObserverLog[]>([]);
  
  const fetchEvidence = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('observations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('[DB] Fetch Observations Error:', error.message);
      } else if (data) {
        setEvidence(data);
      }
    } catch (err) {
      console.error('[DB] Failed to fetch observations:', err);
    }
  }, []);
  
  useEffect(() => { fetchEvidence(); }, [fetchEvidence]);

  const addEvidence = async (file: File) => {
    try {
      // 1. Upload to Storage
      const { publicUrl } = await uploadToVault(file, 'vault');
      
      // 2. Insert metadata to 'observations'
      const { data, error } = await supabase
        .from('observations')
        .insert([{ image_url: publicUrl, category: 'LOOT_DROPS' }])
        .select();

      if (error) {
        console.error('[DB] Observation Metadata Insertion Error:', error.message);
        throw error;
      }
      
      if (data) setEvidence(prev => [data[0], ...prev]);
    } catch (err) {
      console.error('[DB] Failed to add evidence:', err);
      throw err;
    }
  };
  
  const deleteEvidence = async (id: string) => {
    try {
      const { error } = await supabase.from('observations').delete().eq('id', id);
      if (error) console.error('[DB] Delete Observation Error:', error.message);
      else setEvidence(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error('[DB] Failed to delete evidence:', err);
    }
  };

  const updateEvidence = async (id: string, updates: Partial<ObserverLog>) => {
    try {
      const { data, error } = await supabase
        .from('observations')
        .update(updates)
        .eq('id', id)
        .select();
      
      if (error) console.error('[DB] Update Observation Error:', error.message);
      else if (data) setEvidence(prev => prev.map(e => e.id === id ? data[0] : e));
    } catch (err) {
      console.error('[DB] Failed to update evidence:', err);
    }
  };
  
  const loadFromBackup = (data: ObserverLog[]) => { setEvidence(data); };
  return { evidence, addEvidence, updateEvidence, deleteEvidence, loadFromBackup };
};

/**
 * useNexusFiles: Cloud file system (table: files, bucket: nexus_files)
 */
export const useNexusFiles = () => {
  const [files, setFiles] = useState<NexusFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const fetchFiles = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('[DB] Fetch Files Error:', error.message);
      } else if (data) {
        setFiles(data);
      }
    } catch (err) {
      console.error('[DB] Failed to fetch files:', err);
    }
  }, []);
  
  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      // 1. Upload to storage
      const { publicUrl, path } = await uploadToVault(file, 'nexus_files');
      
      // 2. Store metadata in 'files' table
      const { data, error } = await supabase
        .from('files')
        .insert([{ 
          name: file.name, 
          size: file.size, 
          type: file.type, 
          url: publicUrl, 
          storage_path: path 
        }])
        .select();

      if (error) {
        console.error('[DB] File Metadata Insertion Error:', error.message);
        throw error;
      }
      
      if (data) setFiles(prev => [data[0], ...prev]);
    } catch (err) {
      console.error('[DB] File upload failed:', err);
      throw err;
    } finally {
      setUploading(false);
    }
  };
  
  const deleteFile = async (id: string, path: string) => {
    try {
      await deleteFromVault(path, 'nexus_files');
      const { error } = await supabase.from('files').delete().eq('id', id);
      if (error) console.error('[DB] Delete File Error:', error.message);
      else setFiles(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      console.error('[DB] File deletion failed:', err);
    }
  };
  
  return { files, uploading, uploadFile, deleteFile };
};

/**
 * useTasks: Mission parameters tracker (table: tasks)
 */
export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  
  const fetchTasks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) console.error('[DB] Fetch Tasks Error:', error.message);
      else if (data) setTasks(data);
    } catch (err) {
      console.error('[DB] Failed to fetch tasks:', err);
    }
  }, []);
  
  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const addTask = async (taskData: Partial<Task>) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([taskData])
        .select();
      
      if (error) console.error('[DB] Add Task Error:', error.message);
      else if (data) setTasks(prev => [...prev, data[0] as Task]);
    } catch (err) {
      console.error('[DB] Task addition failed:', err);
    }
  };

  const toggleTask = async (id: string, completed: boolean) => {
    try {
      const { error } = await supabase.from('tasks').update({ is_completed: completed }).eq('id', id);
      if (error) console.error('[DB] Toggle Task Error:', error.message);
      else setTasks(prev => prev.map(t => t.id === id ? { ...t, is_completed: completed } : t));
    } catch (err) {
      console.error('[DB] Task toggle failed:', err);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) console.error('[DB] Delete Task Error:', error.message);
      else setTasks(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('[DB] Task deletion failed:', err);
    }
  };

  return { tasks, addTask, toggleTask, deleteTask };
};

/**
 * useGhostMode: UI blurring based on inactivity.
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
 * useCloakMessaging: Ephemeral messaging via localStorage.
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
