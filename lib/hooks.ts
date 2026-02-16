import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';

// Mock de tipos para evitar erro de compilação nos outros arquivos
export type SmartLink = { id: string; title: string; url: string };
export type Task = { id: string; task_title: string; is_completed: boolean };

export const useSmartLinks = () => {
  const [links, setLinks] = useState<any[]>([]);
  const fetchLinks = useCallback(async () => {
    const { data, error } = await supabase.from('links').select('*').order('created_at', { ascending: false });
    if (!error && data) setLinks(data);
  }, []);
  useEffect(() => { fetchLinks(); }, [fetchLinks]);

  const addLink = async (link: { title: string; url: string }) => {
    const formattedUrl = link.url.startsWith('http') ? link.url : `https://${link.url}`;
    const { data, error } = await supabase.from('links').insert([{ title: link.title, url: formattedUrl, category: 'Geral' }]).select();
    if (!error && data) { setLinks(prev => [data[0], ...prev]); return true; }
    return false;
  };
  const deleteLink = async (id: string) => {
    await supabase.from('links').delete().eq('id', id);
    setLinks(prev => prev.filter(l => l.id !== id));
  };
  return { links, addLink, deleteLink, loading: false };
};

export const useTasks = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const fetchTasks = useCallback(async () => {
    const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: true });
    if (!error && data) setTasks(data);
  }, []);
  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const addTask = async (title: string) => {
    const { data, error } = await supabase.from('tasks').insert([{ task_title: title, is_completed: false }]).select();
    if (!error && data) setTasks(prev => [...prev, data[0]]);
  };
  const toggleTask = async (id: string, completed: boolean) => {
    await supabase.from('tasks').update({ is_completed: !completed }).eq('id', id);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, is_completed: !completed } : t));
  };
  return { tasks, addTask, toggleTask };
};

// Hooks vazios para os outros módulos não darem erro de import
export const useVaultItems = () => ({ items: [], addItem: () => {}, deleteItem: () => {}, loading: false });
export const useCloakMessaging = () => ({ createMessage: async () => '' });