
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, VaultItem, SmartLink, Task, NexusFile, ObserverLog, uploadToVault, deleteFromVault } from './supabase';
import imageCompression from 'browser-image-compression';

// --- Vault Hooks ---
export const useVaultItems = () => {
  const [items, setItems] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }
    const { data, error } = await supabase.from('vault_items').select('*').order('created_at', { ascending: false });
    if (!error && data) setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchItems();
    if (!supabase) return;
    const channel = supabase.channel('vault_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'vault_items' }, () => fetchItems())
        .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchItems]);

  const addItem = async (item: Omit<VaultItem, 'id' | 'created_at'>) => {
    if (supabase) await supabase.from('vault_items').insert(item);
  };

  const updateItem = async (id: string, updates: Partial<VaultItem>) => {
    if (supabase) await supabase.from('vault_items').update(updates).eq('id', id);
  };

  const deleteItem = async (id: string) => {
    if (supabase) await supabase.from('vault_items').delete().eq('id', id);
  };

  return { items, loading, addItem, updateItem, deleteItem };
};

// --- Smart Link Hooks ---
export const useSmartLinks = () => {
  const [links, setLinks] = useState<SmartLink[]>([]);
  
  const fetchLinks = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.from('smart_links').select('*').order('created_at', { ascending: true });
    if (data) setLinks(data);
  }, []);

  useEffect(() => {
    fetchLinks();
    if (!supabase) return;
    const sub = supabase.channel('links_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'smart_links' }, fetchLinks)
        .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [fetchLinks]);

  const addLink = async (link: Omit<SmartLink, 'id'>) => {
    if (supabase) await supabase.from('smart_links').insert(link);
  };

  const deleteLink = async (id: string) => {
    if (supabase) await supabase.from('smart_links').delete().eq('id', id);
  };

  return { links, addLink, deleteLink };
};

// --- Task Hooks ---
export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);

  const fetchTasks = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: true });
    if (data) setTasks(data);
  }, []);

  useEffect(() => {
    fetchTasks();
    if (!supabase) return;
    const sub = supabase.channel('tasks_sub')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchTasks)
        .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [fetchTasks]);

  const addTask = async (task: Omit<Task, 'id'>) => {
    if (supabase) await supabase.from('tasks').insert(task);
  };

  const toggleTask = async (id: string, is_completed: boolean) => {
    if (supabase) await supabase.from('tasks').update({ is_completed }).eq('id', id);
  };

  const deleteTask = async (id: string) => {
    if (supabase) await supabase.from('tasks').delete().eq('id', id);
  };

  return { tasks, addTask, toggleTask, deleteTask };
};

// --- Nexus Air Hooks (Files) ---
export const useNexusFiles = () => {
    const [files, setFiles] = useState<NexusFile[]>([]);
    const [uploading, setUploading] = useState(false);

    const fetchFiles = useCallback(async () => {
        if (!supabase) return;
        const { data, error } = await supabase
            .from('nexus_files')
            .select('*')
            .order('created_at', { ascending: false });
        if (!error && data) setFiles(data);
    }, []);

    useEffect(() => {
        fetchFiles();
        if (!supabase) return;
        const sub = supabase.channel('files_sub')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'nexus_files' }, fetchFiles)
            .subscribe();
        return () => { supabase.removeChannel(sub); };
    }, [fetchFiles]);

    const uploadFile = async (file: File) => {
        setUploading(true);
        try {
            const { publicUrl, path } = await uploadToVault(file, 'nexus-vault');
            
            const { error } = await supabase!.from('nexus_files').insert({
                name: file.name,
                size: file.size,
                type: file.type,
                url: publicUrl,
                storage_path: path
            });
            if (error) throw error;
        } catch (e) {
            console.error("Upload failed", e);
            throw e;
        } finally {
            setUploading(false);
        }
    };

    const deleteFile = async (id: string, storagePath: string) => {
        if (!supabase) return;
        await deleteFromVault(storagePath, 'nexus-vault');
        await supabase.from('nexus_files').delete().eq('id', id);
    };

    return { files, uploading, uploadFile, deleteFile };
};

// --- Observer Hooks (Logs) ---
export const useObserver = () => {
    const [evidence, setEvidence] = useState<ObserverLog[]>([]);

    const fetchLogs = useCallback(async () => {
        if (!supabase) return;
        const { data } = await supabase.from('logs').select('*').order('created_at', { ascending: false });
        if (data) setEvidence(data);
    }, []);

    useEffect(() => {
        fetchLogs();
        if (!supabase) return;
        const sub = supabase.channel('logs_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'logs' }, fetchLogs)
            .subscribe();
        return () => { supabase.removeChannel(sub); };
    }, [fetchLogs]);

    const compressImage = async (file: File): Promise<File> => {
        const options = {
            maxSizeMB: 0.8,
            maxWidthOrHeight: 1920,
            useWebWorker: true
        };
        try {
            return await imageCompression(file, options);
        } catch {
            return file;
        }
    };

    const addEvidence = async (file: File) => {
        if (!supabase) return;
        try {
            const compressed = await compressImage(file);
            const { publicUrl } = await uploadToVault(compressed, 'nexus-vault');
            
            await supabase.from('logs').insert({
                image_url: publicUrl,
                category: 'UNCATEGORIZED',
                note: ''
            });
        } catch (e) {
            console.error("Observer log failed", e);
            throw e;
        }
    };

    const updateEvidence = async (id: string, updates: Partial<ObserverLog>) => {
        if (supabase) await supabase.from('logs').update(updates).eq('id', id);
    };

    const deleteEvidence = async (id: string) => {
        if (supabase) await supabase.from('logs').delete().eq('id', id);
    };

    const loadFromBackup = async (data: ObserverLog[]) => {
        if (supabase && data.length > 0) {
            await supabase.from('logs').insert(data);
        }
    }

    return { evidence, addEvidence, updateEvidence, deleteEvidence, loadFromBackup };
};

// --- Ghost Mode Hook ---
export const useGhostMode = (timeoutMs: number = 30000, isActive: boolean = true) => {
  const [isGhost, setIsGhost] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isActive) return;
    const resetTimer = () => {
      setIsGhost(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setIsGhost(true), timeoutMs);
    };
    resetTimer();
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
    };
  }, [timeoutMs, isActive]);

  return isGhost;
};

// --- Cloak Messaging Hook ---
export const useCloakMessaging = () => {
    const createMessage = async (content: string, type: 'text' | 'image' = 'text', burnTimer: number = 30) => {
        if (!supabase) throw new Error("Offline");
        
        const { data, error } = await supabase.from('cloak_messages').insert({
            content,
            type,
            burn_timer: burnTimer,
            views_left: 1
        }).select().single();
        
        if (error) throw error;
        return data.id;
    };

    const getMessage = async (id: string) => {
        if (!supabase) return null;
        const { data, error } = await supabase.from('cloak_messages').select('*').eq('id', id).single();
        if (error || !data) return null;
        if (data.views_left <= 0) return null;
        return data;
    };

    const burnMessage = async (id: string) => {
        if (supabase) await supabase.from('cloak_messages').delete().eq('id', id);
    };

    return { createMessage, getMessage, burnMessage };
};
