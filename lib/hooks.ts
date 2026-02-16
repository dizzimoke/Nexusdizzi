import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';

export const useSmartLinks = () => {
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLinks = useCallback(async () => {
    const { data, error } = await supabase.from('links').select('*').order('created_at', { ascending: false });
    if (!error && data) setLinks(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchLinks(); }, [fetchLinks]);

  const addLink = async (link: { title: string; url: string }) => {
    const formattedUrl = link.url.startsWith('http') ? link.url : `https://${link.url}`;
    const { data, error } = await supabase.from('links').insert([{ title: link.title, url: formattedUrl, category: 'Geral' }]).select();
    if (!error && data) {
      setLinks(prev => [data[0], ...prev]);
      return true;
    }
    return false;
  };

  const deleteLink = async (id: string) => {
    await supabase.from('links').delete().eq('id', id);
    setLinks(prev => prev.filter(l => l.id !== id));
  };

  return { links, loading, addLink, deleteLink };
};

// Se você usa o To-Do (Tasks), adicione este aqui também:
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

  return { tasks, addTask };
};