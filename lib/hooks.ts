import { useState, useEffect, useCallback } from 'react';
import {
  supabase,
  uploadToVault,
  deleteFromVault,
  VaultItem,
  Task,
  ObserverLog,
  NexusFile,
  SmartLink,
  useCloudEngine
} from './supabase';

export type { SmartLink, Task, VaultItem, ObserverLog, NexusFile };

/**
 * --- ID helper (fallback safe) ---
 */
const makeId = () =>
  (globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}_${Math.random().toString(16).slice(2)}`);

/**
 * --- DUAL-ENGINE PERSISTENCE UTILS ---
 */
const getStorageData = (key: string) => {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(`nexus_v3_${key}`);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error(`[System] Storage corruption in ${key}:`, e);
    return [];
  }
};

const setStorageData = (key: string, data: any[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`nexus_v3_${key}`, JSON.stringify(data));
  } catch (e) {
    console.error(`[System] Failed to write to storage ${key}:`, e);
  }
};

/**
 * useSmartLinks: Dual-Engine
 */
export const useSmartLinks = () => {
  const [links, setLinks] = useState<SmartLink[]>(() => getStorageData('links'));
  const [loading, setLoading] = useState(true);

  const fetchLinks = useCallback(async () => {
    if (!useCloudEngine) {
      setLinks(getStorageData('links'));
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('links')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setLinks(data);
        setStorageData('links', data);
      }
    } catch (err: any) {
      console.warn('[System] Cloud Sync failed. Falling back to cache.', err?.message);
      setLinks(getStorageData('links'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const addLink = async (link: { title: string; url: string }) => {
    if (!useCloudEngine) {
      const localItem: SmartLink = {
        id: makeId(),
        ...link,
        created_at: new Date().toISOString()
      };
      const updated = [localItem, ...links];
      setLinks(updated);
      setStorageData('links', updated);
      return true;
    }

    try {
      const { error } = await supabase.from('links').insert([link]);
      if (error) throw error;
      await fetchLinks(); 
      return true;
    } catch (err: any) {
      console.error('[System] Add Link Failed:', err?.message);
      return false;
    }
  };

  const deleteLink = async (id: string) => {
    if (!useCloudEngine) {
      const updated = links.filter((l) => l.id !== id);
      setLinks(updated);
      setStorageData('links', updated);
      return;
    }

    try {
      const { error } = await supabase.from('links').delete().eq('id', id);
      if (error) throw error;
      await fetchLinks();
    } catch (err: any) {
      console.error('[System] Delete Link Failed:', err?.message);
      const updated = links.filter((l) => l.id !== id);
      setLinks(updated);
    }
  };

  return { links, addLink, deleteLink, loading };
};

/**
 * useVaultItems: Dual-Engine
 */
export const useVaultItems = () => {
  const [items, setItems] = useState<VaultItem[]>(() => getStorageData('vault'));
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    if (!useCloudEngine) {
      setItems(getStorageData('vault'));
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vault_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setItems(data);
        setStorageData('vault', data);
      }
    } catch (err: any) {
      console.warn('[System] Cloud Sync failed. Falling back to cache.', err?.message);
      setItems(getStorageData('vault'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const addItem = async (item: Partial<VaultItem>) => {
    if (!useCloudEngine) {
      const localItem: VaultItem = {
        id: makeId(),
        title: item.title || '',
        username: item.username || '',
        password: item.password || '',
        color: item.color || 'bg-emerald-500',
        icon: item.icon || '🔒',
        created_at: new Date().toISOString(),
        ...item
      } as VaultItem;

      const updated = [localItem, ...items];
      setItems(updated);
      setStorageData('vault', updated);
      return true;
    }

    try {
      const { error } = await supabase.from('vault_items').insert([item]);
      if (error) throw error;
      await fetchItems();
      return true;
    } catch (err: any) {
      console.error('[System] Add Vault Item Failed:', err?.message);
      return false;
    }
  };

  const updateItem = async (id: string, updates: Partial<VaultItem>) => {
    if (!useCloudEngine) {
      const updated = items.map((i) => (i.id === id ? { ...i, ...updates } : i));
      setItems(updated);
      setStorageData('vault', updated);
      return true;
    }

    try {
      const { error } = await supabase.from('vault_items').update(updates).eq('id', id);
      if (error) throw error;
      await fetchItems();
      return true;
    } catch (err: any) {
      console.error('[System] Update Vault Item Failed:', err?.message);
      const updated = items.map((i) => (i.id === id ? { ...i, ...updates } : i));
      setItems(updated);
      return false;
    }
  };

  const deleteItem = async (id: string) => {
    if (!useCloudEngine) {
      const updated = items.filter((i) => i.id !== id);
      setItems(updated);
      setStorageData('vault', updated);
      return true;
    }

    try {
      const { error } = await supabase.from('vault_items').delete().eq('id', id);
      if (error) throw error;
      await fetchItems();
      return true;
    } catch (err: any) {
      console.error('[System] Delete Vault Item Failed:', err?.message);
      const updated = items.filter((i) => i.id !== id);
      setItems(updated);
      return false;
    }
  };

  return { items, addItem, updateItem, deleteItem, loading };
};

/**
 * useObserver: Dual-Engine
 */
export const useObserver = () => {
  const [evidence, setEvidence] = useState<ObserverLog[]>(() => getStorageData('observer'));
  const [loading, setLoading] = useState(true);

  const fetchEvidence = useCallback(async () => {
    if (!useCloudEngine) {
      setEvidence(getStorageData('observer'));
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('observations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setEvidence(data);
        setStorageData('observer', data);
      }
    } catch (err: any) {
      console.warn('[System] Cloud Sync failed. Falling back to cache.', err?.message);
      setEvidence(getStorageData('observer'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvidence();
  }, [fetchEvidence]);

  const addEvidence = async (file: File) => {
    try {
      const { publicUrl } = await uploadToVault(file, 'vault');

      if (!useCloudEngine) {
        const localItem: ObserverLog = {
          id: makeId(),
          image_url: publicUrl,
          category: 'LOOT_DROPS',
          created_at: new Date().toISOString()
        };
        const updated = [localItem, ...evidence];
        setEvidence(updated);
        setStorageData('observer', updated);
        return true;
      }

      const { error } = await supabase
        .from('observations')
        .insert([{ image_url: publicUrl, category: 'LOOT_DROPS' }]);

      if (error) throw error;
      await fetchEvidence();
      return true;
    } catch (err: any) {
      console.error('[System] Add Evidence Failed:', err?.message);
      return false;
    }
  };

  const deleteEvidence = async (id: string) => {
    if (!useCloudEngine) {
      const updated = evidence.filter((e) => e.id !== id);
      setEvidence(updated);
      setStorageData('observer', updated);
      return true;
    }

    try {
      const { error } = await supabase.from('observations').delete().eq('id', id);
      if (error) throw error;
      await fetchEvidence();
      return true;
    } catch (err: any) {
      console.error('[System] Delete Evidence Failed:', err?.message);
      const updated = evidence.filter((e) => e.id !== id);
      setEvidence(updated);
      return false;
    }
  };

  const updateEvidence = async (id: string, updates: Partial<ObserverLog>) => {
    if (!useCloudEngine) {
      const updated = evidence.map((e) => (e.id === id ? { ...e, ...updates } : e));
      setEvidence(updated);
      setStorageData('observer', updated);
      return true;
    }

    try {
      const { error } = await supabase.from('observations').update(updates).eq('id', id);
      if (error) throw error;
      await fetchEvidence();
      return true;
    } catch (err: any) {
      console.error('[System] Update Observation Failed:', err?.message);
      const updated = evidence.map((e) => (e.id === id ? { ...e, ...updates } : e));
      setEvidence(updated);
      return false;
    }
  };

  const loadFromBackup = (data: ObserverLog[]) => {
    setEvidence(data);
    setStorageData('observer', data);
  };

  return { evidence, addEvidence, updateEvidence, deleteEvidence, loadFromBackup, loading };
};

/**
 * useNexusFiles: Dual-Engine
 */
export const useNexusFiles = () => {
  const [files, setFiles] = useState<NexusFile[]>(() => getStorageData('files'));
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchFiles = useCallback(async () => {
    if (!useCloudEngine) {
      setFiles(getStorageData('files'));
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setFiles(data);
        setStorageData('files', data);
      }
    } catch (err: any) {
      console.warn('[System] Cloud Sync failed. Falling back to cache.', err?.message);
      setFiles(getStorageData('files'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const { publicUrl, path } = await uploadToVault(file, 'nexus_files');

      if (!useCloudEngine) {
        const localItem: NexusFile = {
          id: makeId(),
          name: file.name,
          size: file.size,
          type: file.type,
          url: publicUrl,
          storage_path: path,
          created_at: new Date().toISOString()
        };
        const updated = [localItem, ...files];
        setFiles(updated);
        setStorageData('files', updated);
        return true;
      }

      const { error } = await supabase
        .from('files')
        .insert([{ name: file.name, size: file.size, type: file.type, url: publicUrl, storage_path: path }]);

      if (error) throw error;
      await fetchFiles();
      return true;
    } catch (err: any) {
      console.error('[System] File Upload Failed:', err?.message);
      return false;
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (id: string, path: string) => {
    if (!useCloudEngine) {
      const updated = files.filter((f) => f.id !== id);
      setFiles(updated);
      setStorageData('files', updated);
      return true;
    }

    try {
      await deleteFromVault(path, 'nexus_files');
      const { error } = await supabase.from('files').delete().eq('id', id);
      if (error) throw error;
      await fetchFiles();
      return true;
    } catch (err: any) {
      console.error('[System] File Deletion Error:', err?.message);
      const updated = files.filter((f) => f.id !== id);
      setFiles(updated);
      return false;
    }
  };

  return { files, uploading, uploadFile, deleteFile, loading };
};

/**
 * useTasks: Dual-Engine
 */
export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>(() => getStorageData('tasks'));
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!useCloudEngine) {
      setTasks(getStorageData('tasks'));
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (data) {
        setTasks(data);
        setStorageData('tasks', data);
      }
    } catch (err: any) {
      console.warn('[System] Cloud Sync failed. Falling back to cache.', err?.message);
      setTasks(getStorageData('tasks'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = async (taskData: Partial<Task>) => {
    if (!useCloudEngine) {
      const localItem: Task = {
        id: makeId(),
        date: taskData.date || new Date().toISOString().split('T')[0],
        task_title: taskData.task_title || '',
        is_completed: false,
        created_at: new Date().toISOString()
      };
      const updated = [...tasks, localItem];
      setTasks(updated);
      setStorageData('tasks', updated);
      return true;
    }

    try {
      const { error } = await supabase.from('tasks').insert([taskData]);
      if (error) throw error;
      await fetchTasks();
      return true;
    } catch (err: any) {
      console.error('[System] Add Task Failed:', err?.message);
      return false;
    }
  };

  const toggleTask = async (id: string, completed: boolean) => {
    if (!useCloudEngine) {
      const updated = tasks.map((t) => (t.id === id ? { ...t, is_completed: completed } : t));
      setTasks(updated);
      setStorageData('tasks', updated);
      return true;
    }

    try {
      const { error } = await supabase.from('tasks').update({ is_completed: completed }).eq('id', id);
      if (error) throw error;
      await fetchTasks();
      return true;
    } catch (err: any) {
      console.error('[System] Toggle Task Failed:', err?.message);
      const updated = tasks.map((t) => (t.id === id ? { ...t, is_completed: completed } : t));
      setTasks(updated);
      return false;
    }
  };

  const deleteTask = async (id: string) => {
    if (!useCloudEngine) {
      const updated = tasks.filter((t) => t.id !== id);
      setTasks(updated);
      setStorageData('tasks', updated);
      return true;
    }

    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
      await fetchTasks();
      return true;
    } catch (err: any) {
      console.error('[System] Delete Task Failed:', err?.message);
      const updated = tasks.filter((t) => t.id !== id);
      setTasks(updated);
      return false;
    }
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
    const stored = JSON.parse(localStorage.getItem('nexus_cloak_v3') || '{}');
    stored[id] = msg;
    localStorage.setItem('nexus_cloak_v3', JSON.stringify(stored));
    return id;
  };
  const getMessage = async (id: string) => {
    const stored = JSON.parse(localStorage.getItem('nexus_cloak_v3') || '{}');
    return stored[id] || null;
  };
  const burnMessage = async (id: string) => {
    const stored = JSON.parse(localStorage.getItem('nexus_cloak_v3') || '{}');
    delete stored[id];
    localStorage.setItem('nexus_cloak_v3', JSON.stringify(stored));
  };
  return { createMessage, getMessage, burnMessage };
};