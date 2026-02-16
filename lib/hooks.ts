import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './supabase';

// --- 1. VAULT HOOK (Cofre de Arquivos/Senhas) ---
export const useVaultItems = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('vault_items') // Nome da tabela no banco
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const addItem = async (item: any) => {
    if (!supabase) return;
    const { data, error } = await supabase.from('vault_items').insert([item]).select();
    if (!error && data) setItems(prev => [data[0], ...prev]);
  };

  const deleteItem = async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('vault_items').delete().eq('id', id);
    if (!error) setItems(prev => prev.filter(i => i.id !== id));
  };

  return { items, loading, addItem, deleteItem };
};

// --- 2. SMART LINKS HOOK (Links Rápidos) ---
export const useSmartLinks = () => {
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLinks = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('links') // Tabela que você criou
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setLinks(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchLinks(); }, [fetchLinks]);

  const addLink = async (link: { title: string; url: string }) => {
    if (!supabase) return false;
    const formattedUrl = link.url.startsWith('http') ? link.url : `https://${link.url}`;
    const { data, error } = await supabase
      .from('links')
      .insert([{ title: link.title, url: formattedUrl, category: 'Geral' }])
      .select();

    if (!error && data) {
      setLinks(prev => [data[0], ...prev]);
      return true;
    }
    return false;
  };

  const deleteLink = async (id: string) => {
    if (!supabase) return;
    await supabase.from('links').delete().eq('id', id);
    setLinks(prev => prev.filter(l => l.id !== id));
  };

  return { links, loading, addLink, deleteLink };
};

// --- 3. TASKS HOOK (Tarefas/To-Do) ---
export const useTasks = () => {
  const [tasks, setTasks] = useState<any[]>([]);

  const fetchTasks = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: true });
    if (!error && data) setTasks(data);
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const addTask = async (title: string) => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('tasks')
      .insert([{ task_title: title, is_completed: false }])
      .select();
    if (!error && data) setTasks(prev => [...prev, data[0]]);
  };

  const toggleTask = async (id: string, completed: boolean) => {
    if (!supabase) return;
    await supabase.from('tasks').update({ is_completed: !completed }).eq('id', id);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, is_completed: !completed } : t));
  };

  return { tasks, addTask, toggleTask };
};

// --- 4. CLOAK MESSAGING (Mensagens que se destroem) ---
export const useCloakMessaging = () => {
  const createMessage = async (content: string) => {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('cloak_messages')
      .insert([{ content, views_left: 1 }])
      .select()
      .single();
    if (error) return null;
    return data.id;
  };

  return { createMessage };
};