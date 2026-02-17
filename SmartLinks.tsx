import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons, SPRING_CONFIG } from '../lib/constants';
import { useSmartLinks } from '../lib/hooks';
import { useNotification } from './NotificationProvider';

interface SmartLinksProps {
    onFocusChange?: (focused: boolean) => void;
}

const SmartLinks: React.FC<SmartLinksProps> = ({ onFocusChange }) => {
  const { links, addLink, deleteLink } = useSmartLinks();
  const { showNotification } = useNotification();
  
  const [isEditing, setIsEditing] = useState(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newLink, setNewLink] = useState({ title: '', url: '' });

  useEffect(() => {
    if (onFocusChange) {
        onFocusChange(isAdding);
    }
  }, [isAdding, onFocusChange]);

  const getFavicon = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;
    } catch {
      return ''; 
    }
  };

  const handlePointerDown = () => {
    pressTimer.current = setTimeout(() => {
      setIsEditing(true);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500);
  };

  const handlePointerUp = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  const handleSave = () => {
    let url = newLink.url;
    if (!url.startsWith('http')) url = `https://${url}`;
    
    if (newLink.title && url) {
      addLink({ title: newLink.title, url });
      setIsAdding(false);
      setNewLink({ title: '', url: '' });
      showNotification('Link Added to Nexus', 'success');
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Delete this smart link?")) {
      deleteLink(id);
      showNotification('Link Removed', 'reminder');
    }
  };

  const handleLinkClick = (e: React.MouseEvent, link: any) => {
    if (isEditing) {
      e.preventDefault();
      return;
    }
    navigator.clipboard.writeText(link.url);
    showNotification('Link Copied & Opened', 'success');
  };

  return (
    <div className="w-full pb-24 min-h-[50vh]" onClick={() => isEditing && setIsEditing(false)}>
      <motion.div layout className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 md:gap-6">
        <AnimatePresence mode="popLayout">
          {links.map((link) => (
            <motion.div
              layout
              key={link.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1, rotate: isEditing ? [0, -1.5, 1.5, -1.5, 0] : 0 }}
              exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.15 } }}
              transition={{ ...SPRING_CONFIG, rotate: { repeat: Infinity, duration: 0.25, ease: "linear" } }}
              className="relative flex flex-col items-center gap-2 group"
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              <AnimatePresence>
                {isEditing && (
                  <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0, transition: { duration: 0.15 } }}
                    onClick={(e) => handleDelete(e, link.id)}
                    className="absolute -top-2 -left-2 w-7 h-7 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white z-20 shadow-lg border border-white/10"
                  >
                    <Icons.Minus width={14} />
                  </motion.button>
                )}
              </AnimatePresence>
              <motion.a
                href={isEditing ? undefined : link.url}
                onClick={(e) => handleLinkClick(e, link)}
                target="_blank"
                rel="noopener noreferrer"
                whileTap={!isEditing ? { scale: 0.95 } : undefined}
                className="w-16 h-16 sm:w-20 sm:h-20 bg-apple-gray/40 backdrop-blur-md border border-apple-border rounded-2xl flex items-center justify-center shadow-lg transition-all overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100" />
                <img src={getFavicon(link.url)} alt={link.title} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg" loading="lazy" onError={(e) => (e.currentTarget.src = 'https://www.google.com/s2/favicons?domain=google.com')} />
              </motion.a>
              <span className="text-[10px] sm:text-xs text-white/60 font-medium truncate w-full text-center">
                {link.title}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
         <motion.button layout onClick={() => setIsAdding(true)} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} className="flex flex-col items-center gap-2 group">
            <div className="w-16 h-16 sm:w-20 sm:h-20 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center bg-white/5 hover:bg-white/10 transition-all">
              <span className="text-2xl font-light text-white/20">+</span>
            </div>
            <span className="text-[10px] sm:text-xs text-white/40 font-medium group-hover:text-white">Add New</span>
          </motion.button>
      </motion.div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.15 } }} onClick={() => setIsAdding(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20, transition: { duration: 0.15, ease: "circOut" } }} transition={SPRING_CONFIG} className="relative w-full max-w-xs bg-[#1c1c1e] border border-white/10 rounded-[2rem] p-6 shadow-2xl">
              <h3 className="text-xl font-bold mb-6 text-center">New Smart Link</h3>
              <div className="space-y-4">
                <input autoFocus value={newLink.title} onChange={(e) => setNewLink({...newLink, title: e.target.value})} placeholder="Title" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none" />
                <input value={newLink.url} onChange={(e) => setNewLink({...newLink, url: e.target.value})} placeholder="URL (example.com)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none" />
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setIsAdding(false)} className="flex-1 py-3 bg-white/10 rounded-xl font-medium">Cancel</button>
                  <button onClick={handleSave} className="flex-1 py-3 bg-apple-blue rounded-xl font-medium text-white">Save</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SmartLinks;