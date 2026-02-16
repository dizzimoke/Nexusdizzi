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

export type { SmartLink, Task, VaultItem, ObserverLog, NexusFile };

/**
 * --- HYBRID PERSISTENCE ENGINE ---
 * Logic: Try Production DB -> Fallback to LocalStorage on failure.
 */

const getLocal = (key: string) => {
  const data = localStorage.getItem(`nexus_local_${key}`);
  return data ? JSON.parse(data) : [];
};

const setLocal = (key: string, data: any[]) => {
  localStorage.setItem(`nexus_local_${key}`, JSON.stringify(data));
};

/**
 * useSmartLinks: Hybrid Logic
 */
export const useSmartLinks = () => {
  const [links, setLinks] = useState<SmartLink[]>(getLocal('links'));
  const [loading, setLoading] = useState(true);

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('links')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (data) {
        setLinks(data);
        setLocal('links', data);
      }
    } catch (err: any) {
      console.warn('[Production DB] Links Offline, using Local Vault:', err.message);
      setLinks(getLocal('links'));
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => { fetchLinks(); }, [fetchLinks]);

  const addLink = async (link: { title: string; url: string }) => {
    const localItem: SmartLink = { 
      id: crypto.randomUUID(), 
      ...link, 
      created_at: new Date().toISOString() 
    };

    try {
      const { data, error } = await supabase.from('links').insert([link]).select();
      if (error) throw error;
      if (data) {
        setLinks(prev => [data[0], ...prev]);
        return true;
      }
    } catch (err: any) {
      console.warn('[Production DB] Save Failed, using Local Storage');
      const updated = [localItem, ...links];
      setLinks(updated);
      setLocal('links', updated);
      return true;
    }
    return false;
  };

  const deleteLink = async (id: string) => {
    try {
      const { error } = await supabase.from('links').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.warn('[Production DB] Delete Failed, syncing locally');
    }
    const updated = links.filter(l => l.id !== id);
    setLinks(updated);
    setLocal('links', updated);
  };

  return { links, addLink, deleteLink, loading };
};

/**
 * useVaultItems: Hybrid Logic
 */
export const useVaultItems = () => {
  const [items, setItems] = useState<VaultItem[]>(getLocal('vault'));
  const [loading, setLoading] = useState(true);
  
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vault_items')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data) {
        setItems(data);
        setLocal('vault', data);
      }
    } catch (err: any) {
      console.warn('[Production DB] Vault Offline, using Local Cache');
      setItems(getLocal('vault'));
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => { fetchItems(); }, [fetchItems]);

  const addItem = async (item: Partial<VaultItem>) => {
    const localItem: VaultItem = { 
      id: crypto.randomUUID(), 
      title: item.title || '',
      username: item.username || '',
      password: item.password || '',
      color: item.color || 'bg-emerald-500',
      icon: item.icon || '🔒',
      ...item 
    } as VaultItem;

    try {
      const { data, error } = await supabase.from('vault_items').insert([item]).select();
      if (error) throw error;
      if (data) setItems(prev => [data[0], ...prev]);
    } catch (err) {
      const updated = [localItem, ...items];
      setItems(updated);
      setLocal('vault', updated);
    }
  };
  
  const updateItem = async (id: string, updates: Partial<VaultItem>) => {
    try {
      const { error } = await supabase.from('vault_items').update(updates).eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.warn('[Production DB] Update Failed locally');
    }
    const updated = items.map(i => i.id === id ? { ...i, ...updates } : i);
    setItems(updated);
    setLocal('vault', updated);
  };
  
  const deleteItem = async (id: string) => {
    try {
      await supabase.from('vault_items').delete().eq('id', id);
    } catch (err) {}
    const updated = items.filter(i => i.id !== id);
    setItems(updated);
    setLocal('vault', updated);
  };
  
  return { items, addItem, updateItem, deleteItem, loading };
};

/**
 * useObserver: Visual Intel (table: observations, bucket: vault)
 */
export const useObserver = () => {
  const [evidence, setEvidence] = useState<ObserverLog[]>(getLocal('observer'));
  const [loading, setLoading] = useState(true);
  
  const fetchEvidence = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('observations')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data) {
        setEvidence(data);
        setLocal('observer', data);
      }
    } catch (err) {
      setEvidence(getLocal('observer'));
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => { fetchEvidence(); }, [fetchEvidence]);

  const addEvidence = async (file: File) => {
    try {
      // 1. Try Real Upload
      const { publicUrl } = await uploadToVault(file, 'vault');
      const { data, error } = await supabase
        .from('observations')
        .insert([{ image_url: publicUrl, category: 'LOOT_DROPS' }])
        .select();

      if (error) throw error;
      if (data) {
        setEvidence(prev => [data[0], ...prev]);
      }
    } catch (err) {
      console.warn('[Production DB] Upload Failed, simulating local success');
      // 2. Mock Fallback
      const localUrl = URL.createObjectURL(file);
      const mockItem: ObserverLog = {
        id: crypto.randomUUID(),
        image_url: localUrl,
        category: 'LOOT_DROPS',
        created_at: new Date().toISOString()
      };
      const updated = [mockItem, ...evidence];
      setEvidence(updated);
      setLocal('observer', updated);
    }
  };
  
  const deleteEvidence = async (id: string) => {
    try {
      await supabase.from('observations').delete().eq('id', id);
    } catch (err) {}
    const updated = evidence.filter(e => e.id !== id);
    setEvidence(updated);
    setLocal('observer', updated);
  };

  const updateEvidence = async (id: string, updates: Partial<ObserverLog>) => {
    try {
      await supabase.from('observations').update(updates).eq('id', id);
    } catch (err) {}
    const updated = evidence.map(e => e.id === id ? { ...e, ...updates } : e);
    setEvidence(updated);
    setLocal('observer', updated);
  };
  
  const loadFromBackup = (data: ObserverLog[]) => { 
    setEvidence(data);
    setLocal('observer', data);
  };
  return { evidence, addEvidence, updateEvidence, deleteEvidence, loadFromBackup, loading };
};

/**
 * useNexusFiles: Cloud Storage (table: files, bucket: nexus_files)
 */
export const useNexusFiles = () => {
  const [files, setFiles] = useState<NexusFile[]>(getLocal('files'));
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data) {
        setFiles(data);
        setLocal('files', data);
      }
    } catch (err) {
      setFiles(getLocal('files'));
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const { publicUrl, path } = await uploadToVault(file, 'nexus_files');
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

      if (error) throw error;
      if (data) setFiles(prev => [data[0], ...prev]);
    } catch (err) {
      console.warn('[Production DB] File System Offline, caching locally');
      const mockItem: NexusFile = {
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
        storage_path: 'local_temp',
        created_at: new Date().toISOString()
      };
      const updated = [mockItem, ...files];
      setFiles(updated);
      setLocal('files', updated);
    } finally {
      setUploading(false);
    }
  };
  
  const deleteFile = async (id: string, path: string) => {
    try {
      if (path !== 'local_temp') await deleteFromVault(path, 'nexus_files');
      await supabase.from('files').delete().eq('id', id);
    } catch (err) {}
    const updated = files.filter(f => f.id !== id);
    setFiles(updated);
    setLocal('files', updated);
  };
  
  return { files, uploading, uploadFile, deleteFile, loading };
};

/**
 * useTasks: Mission Parameters (table: tasks)
 */
export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>(getLocal('tasks'));
  const [loading, setLoading] = useState(true);
  
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      if (data) {
        setTasks(data);
        setLocal('tasks', data);
      }
    } catch (err) {
      setTasks(getLocal('tasks'));
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const addTask = async (taskData: Partial<Task>) => {
    const localItem: Task = { 
      id: crypto.randomUUID(), 
      date: taskData.date || new Date().toISOString().split('T')[0],
      task_title: taskData.task_title || '',
      is_completed: false,
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase.from('tasks').insert([taskData]).select();
      if (error) throw error;
      if (data) setTasks(prev => [...prev, data[0] as Task]);
    } catch (err) {
      const updated = [...tasks, localItem];
      setTasks(updated);
      setLocal('tasks', updated);
    }
  };

  const toggleTask = async (id: string, completed: boolean) => {
    try {
      const { error } = await supabase.from('tasks').update({ is_completed: completed }).eq('id', id);
      if (error) throw error;
    } catch (err) {}
    const updated = tasks.map(t => t.id === id ? { ...t, is_completed: completed } : t);
    setTasks(updated);
    setLocal('tasks', updated);
  };

  const deleteTask = async (id: string) => {
    try {
      await supabase.from('tasks').delete().eq('id', id);
    } catch (err) {}
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    setLocal('tasks', updated);
  };

  return { tasks, addTask, toggleTask, deleteTask, loading };
};

/**
 * useGhostMode: UI Blurring
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
 * useCloakMessaging: Local Ephemeral Messaging
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
