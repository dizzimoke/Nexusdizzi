
import { useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured, VaultItem, SmartLink, Task } from './supabase';
import imageCompression from 'browser-image-compression';

// In-memory fallback stores
let MOCK_VAULT: VaultItem[] = [
  { 
    id: '1', 
    title: 'Main Bank', 
    username: 'jdoe_banking', 
    password: 'secureBankPassword123!', 
    hidden_description: 'Routing #012345678, Account #987654321. Do not share with anyone.', 
    color: 'bg-emerald-500', 
    icon: '🏦' 
  },
  { 
    id: '2', 
    title: 'Netflix', 
    username: 'movie_fan_99', 
    password: 'netflixandchill', 
    hidden_description: 'Shared with family. PIN: 1122.', 
    color: 'bg-red-500', 
    icon: '🎬' 
  },
  { 
    id: '3', 
    title: 'Google', 
    username: 'john.doe@gmail', 
    password: 'GooglePass2024!', 
    hidden_description: 'Recovery email is yahoo.com account.', 
    color: 'bg-blue-500', 
    icon: 'G' 
  },
  { 
    id: '4', 
    title: 'Apple ID', 
    username: 'jdoe@icloud', 
    password: 'ApplePieRules', 
    hidden_description: '2FA enabled on old iPhone 11.', 
    color: 'bg-white', 
    icon: '' 
  },
];

let MOCK_LINKS: SmartLink[] = [
  { id: '1', title: 'Twitter', url: 'https://twitter.com' },
  { id: '2', title: 'GitHub', url: 'https://github.com' },
  { id: '3', title: 'Dribbble', url: 'https://dribbble.com' },
];

let MOCK_TASKS: Task[] = [
  { id: '1', date: new Date().toISOString().split('T')[0], task_title: 'Welcome to Nexus', is_completed: false },
];

export const useVaultItems = () => {
  const [items, setItems] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('vault_items').select('*');
      if (data) setItems(data as unknown as VaultItem[]);
    } else {
      setItems([...MOCK_VAULT]);
    }
    setLoading(false);
  };

  const addItem = async (item: Omit<VaultItem, 'id'>) => {
    const newItem = { ...item, id: crypto.randomUUID() };
    if (isSupabaseConfigured && supabase) {
      await supabase.from('vault_items').insert(newItem);
    } else {
      MOCK_VAULT.push(newItem);
    }
    // Optimistic update
    setItems(prev => [...prev, newItem]);
  };

  const updateItem = async (id: string, updates: Partial<VaultItem>) => {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('vault_items').update(updates).eq('id', id);
    } else {
      const idx = MOCK_VAULT.findIndex(i => i.id === id);
      if (idx !== -1) {
        MOCK_VAULT[idx] = { ...MOCK_VAULT[idx], ...updates };
      }
    }
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const deleteItem = async (id: string) => {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('vault_items').delete().eq('id', id);
    } else {
      MOCK_VAULT = MOCK_VAULT.filter(i => i.id !== id);
    }
    setItems(prev => prev.filter(i => i.id !== id));
  };

  useEffect(() => {
    fetchItems();
  }, []);

  return { items, loading, addItem, updateItem, deleteItem };
};

export const useSmartLinks = () => {
  const [links, setLinks] = useState<SmartLink[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLinks = async () => {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('smart_links').select('*');
      if (data) setLinks(data as unknown as SmartLink[]);
    } else {
      setLinks([...MOCK_LINKS]);
    }
    setLoading(false);
  };

  const addLink = async (link: Omit<SmartLink, 'id'>) => {
    const newLink = { ...link, id: crypto.randomUUID() };
    if (isSupabaseConfigured && supabase) {
      await supabase.from('smart_links').insert(newLink);
    } else {
      MOCK_LINKS.push(newLink);
    }
    setLinks(prev => [...prev, newLink]);
  };

  const deleteLink = async (id: string) => {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('smart_links').delete().eq('id', id);
    } else {
      MOCK_LINKS = MOCK_LINKS.filter(l => l.id !== id);
    }
    setLinks(prev => prev.filter(l => l.id !== id));
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  return { links, loading, addLink, deleteLink };
};

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('tasks').select('*');
      if (data) setTasks(data as unknown as Task[]);
    } else {
      setTasks([...MOCK_TASKS]);
    }
    setLoading(false);
  };

  const addTask = async (task: Omit<Task, 'id'>) => {
    const newTask = { ...task, id: crypto.randomUUID() };
    if (isSupabaseConfigured && supabase) {
      await supabase.from('tasks').insert(newTask);
    } else {
      MOCK_TASKS.push(newTask);
    }
    setTasks(prev => [...prev, newTask]);
  };

  const toggleTask = async (id: string, is_completed: boolean) => {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('tasks').update({ is_completed }).eq('id', id);
    } else {
      const idx = MOCK_TASKS.findIndex(t => t.id === id);
      if (idx !== -1) MOCK_TASKS[idx].is_completed = is_completed;
    }
    setTasks(prev => prev.map(t => t.id === id ? { ...t, is_completed } : t));
  };

  const deleteTask = async (id: string) => {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('tasks').delete().eq('id', id);
    } else {
      MOCK_TASKS = MOCK_TASKS.filter(t => t.id !== id);
    }
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return { tasks, loading, addTask, toggleTask, deleteTask };
};

export const useGhostMode = (timeoutMs: number = 30000, isActive: boolean = true) => {
  const [isGhost, setIsGhost] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isActive) return;

    const resetTimer = () => {
      setIsGhost(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setIsGhost(true);
      }, timeoutMs);
    };

    // Initial trigger
    resetTimer();

    // Listeners
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('touchstart', resetTimer);
    window.addEventListener('click', resetTimer);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
      window.removeEventListener('click', resetTimer);
    };
  }, [timeoutMs, isActive]);

  return isGhost;
};

// -- Encrypted Messaging System (The Cloak) --

export interface CloakMessage {
  id: string;
  content: string; // Encrypted or plain text
  createdAt: number;
  expiresAt: number;
  viewsLeft: number;
  type: 'text' | 'image' | 'file';
  burnTimer: number; // Duration in seconds after opening
  filename?: string;
}

export const useCloakMessaging = () => {
  // Mock Backend using LocalStorage for the demo
  const STORAGE_KEY = 'nexus_cloak_messages';

  const createMessage = (content: string, type: 'text' | 'image' = 'text', burnTimer: number = 30, filename?: string): string => {
    const id = Math.random().toString(36).substring(2, 9);
    const newMessage: CloakMessage = {
      id,
      content, // In a real app, encrypt this before storing
      createdAt: Date.now(),
      expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour hard limit for retrieval
      viewsLeft: 1, // Burn after reading
      type,
      burnTimer,
      filename
    };

    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    existing[id] = newMessage;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    
    return id;
  };

  const getMessage = (id: string): CloakMessage | null => {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const msg = existing[id];

    if (!msg) return null;

    // Check expiration
    if (Date.now() > msg.expiresAt || msg.viewsLeft <= 0) {
      delete existing[id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
      return null;
    }

    return msg;
  };

  const burnMessage = (id: string) => {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (existing[id]) {
        delete existing[id];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    }
  };

  return { createMessage, getMessage, burnMessage };
};

// -- Visual Intelligence Hub (The Observer) --

export interface ObserverEvidence {
  id: string;
  imageData: string; // Base64
  timestamp: number;
  category: 'LOOT_DROPS' | 'TRADE_LOGS' | 'CONFIGS' | 'UNCATEGORIZED';
  linkedIdentityId?: string;
  note?: string;
}

export const useObserver = () => {
  const STORAGE_KEY = 'nexus_observer_data';
  const [evidence, setEvidence] = useState<ObserverEvidence[]>([]);

  useEffect(() => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      try {
        setEvidence(JSON.parse(data));
      } catch (e) {
        console.error("Observer data corruption", e);
      }
    }
  }, []);

  const saveToStorage = (newData: ObserverEvidence[]) => {
    setEvidence(newData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  };

  const compressImage = async (file: File): Promise<string> => {
    const options = {
      maxSizeMB: 0.7, // Target ~700KB max
      maxWidthOrHeight: 1600,
      useWebWorker: true,
      initialQuality: 0.7 // 70% quality as requested
    };
    
    try {
      const compressedBlob = await imageCompression(file, options);
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(compressedBlob);
      });
    } catch (error) {
      console.error("Compression failed, using original", error);
      return new Promise((resolve, reject) => {
         const reader = new FileReader();
         reader.onloadend = () => resolve(reader.result as string);
         reader.onerror = reject;
         reader.readAsDataURL(file);
      });
    }
  };

  const addEvidence = async (file: File) => {
    const base64 = await compressImage(file);
    const newEvidence: ObserverEvidence = {
      id: crypto.randomUUID(),
      imageData: base64,
      timestamp: Date.now(),
      category: 'UNCATEGORIZED',
      note: ''
    };
    saveToStorage([newEvidence, ...evidence]);
  };

  const updateEvidence = (id: string, updates: Partial<ObserverEvidence>) => {
    const updated = evidence.map(ev => ev.id === id ? { ...ev, ...updates } : ev);
    saveToStorage(updated);
  };

  const deleteEvidence = (id: string) => {
    const updated = evidence.filter(ev => ev.id !== id);
    saveToStorage(updated);
  };

  // For global import logic in Sentinel
  const loadFromBackup = (data: ObserverEvidence[]) => {
      saveToStorage(data);
  }

  return { evidence, addEvidence, updateEvidence, deleteEvidence, loadFromBackup };
};
