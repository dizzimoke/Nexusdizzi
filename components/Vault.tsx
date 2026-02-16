import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons, SPRING_CONFIG } from '../lib/constants';
import { useVaultItems, useGhostMode } from '../lib/hooks';
import { useSound } from '../lib/sound';
import { useNotification } from './NotificationProvider';

interface VaultProps {
    onFocusChange?: (focused: boolean) => void;
}

const GhostContent = ({ children, className = '', isGhost }: { children?: React.ReactNode, className?: string, isGhost: boolean }) => (
  <motion.div 
    className={className}
    animate={{ 
      filter: isGhost ? 'blur(12px)' : 'blur(0px)',
      opacity: isGhost ? 0 : 1,
      pointerEvents: isGhost ? 'none' : 'auto'
    }}
    transition={{ duration: 1 }}
  >
    {children}
  </motion.div>
);

const Vault: React.FC<VaultProps> = ({ onFocusChange }) => {
  const { items, addItem, updateItem, deleteItem } = useVaultItems();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { playShimmer, playClick } = useSound();
  const { showNotification } = useNotification();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const isGhost = useGhostMode(30000, isAuthenticated);
  const [isEditing, setIsEditing] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  const [formData, setFormData] = useState({ 
    title: '', 
    username: '', 
    password: '', 
    hidden_description: '', 
    icon: '🔒', 
    color: 'bg-emerald-500' 
  });
  
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    if (onFocusChange) {
        onFocusChange(!!selectedId || isAdding || !!editingItemId);
    }
  }, [selectedId, isAdding, editingItemId, onFocusChange]);

  useEffect(() => {
    let mounted = true;
    const timer = setTimeout(() => {
        if (!mounted) return;
        setIsScanning(false);
        setIsAuthenticated(true);
        playShimmer(); 
        showNotification('Identity Verified', 'success');
    }, 2000); 
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [playShimmer, showNotification]);

  useEffect(() => {
    if (!selectedId) {
      setShowPassword(false);
      setDeleteConfirm(false);
    }
  }, [selectedId]);

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
    if (formData.title && formData.username) {
      if (editingItemId) {
        updateItem(editingItemId, formData);
        setEditingItemId(null);
        showNotification('Matrix Entry Updated', 'success');
      } else {
        addItem(formData);
        setIsAdding(false);
        showNotification('Data Encrypted & Saved', 'success');
      }
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({ 
      title: '', 
      username: '', 
      password: '', 
      hidden_description: '', 
      icon: '🔒', 
      color: 'bg-emerald-500' 
    });
    setShowFormPassword(false);
  };

  const openEditModal = (item: any) => {
    setFormData({
      title: item.title,
      username: item.username,
      password: item.password || '',
      hidden_description: item.hidden_description || '',
      icon: item.icon,
      color: item.color
    });
    setEditingItemId(item.id);
    setIsEditing(false);
    playClick();
  };

  const handleCopy = (text: string | undefined, field: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showNotification(`${field === 'username' ? 'ID' : 'Password'} Copied`, 'info');
  };

  const handleDeleteFromDetail = (id: string) => {
    if (deleteConfirm) {
      deleteItem(id);
      setSelectedId(null);
      showNotification('Item Deleted', 'reminder');
    } else {
      setDeleteConfirm(true);
      setTimeout(() => setDeleteConfirm(false), 3000);
    }
  };

  const isImageIcon = (icon: string) => icon.startsWith('data:') || icon.startsWith('http');

  if (!isAuthenticated) {
    return (
        <div className="w-full h-[60vh] flex flex-col items-center justify-center relative">
            <AnimatePresence>
                {isScanning && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.2, transition: { duration: 0.15 } }}
                        className="relative"
                    >
                        <div className="w-32 h-32 rounded-full border border-white/10 flex items-center justify-center relative overflow-hidden bg-black/40 backdrop-blur-xl">
                             <motion.div 
                                className="absolute inset-0 bg-emerald-500/20"
                                animate={{ y: ['-100%', '100%'] }}
                                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                             />
                             <Icons.Fingerprint width={48} height={48} className="text-emerald-500" />
                        </div>
                        <motion.p 
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="mt-6 text-[10px] font-bold uppercase tracking-[0.4em] text-white/40 text-center"
                        >
                            Scanning Biometrics
                        </motion.p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
  }

  return (
    <div className="w-full h-full pb-32">
        <GhostContent isGhost={isGhost}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                <AnimatePresence mode="popLayout">
                    {items.map((item) => (
                        <motion.div
                            key={item.id}
                            layoutId={`vault-card-${item.id}`}
                            onClick={() => { if (!isEditing) setSelectedId(item.id); }}
                            onPointerDown={handlePointerDown}
                            onPointerUp={handlePointerUp}
                            onPointerLeave={handlePointerUp}
                            className={`aspect-square aura-border rounded-[2.5rem] p-6 flex flex-col items-center justify-center gap-4 cursor-pointer relative group transition-all duration-300 ${isEditing ? 'animate-pulse scale-95' : 'hover:scale-105'}`}
                        >
                             <div className={`w-16 h-16 rounded-3xl ${item.color} flex items-center justify-center text-3xl shadow-xl border border-white/10 relative overflow-hidden`}>
                                 {isImageIcon(item.icon) ? (
                                     <img src={item.icon} className="w-full h-full object-cover" alt={item.title} />
                                 ) : (
                                     <span>{item.icon}</span>
                                 )}
                             </div>
                             <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 group-hover:text-white transition-colors text-center">{item.title}</span>
                             
                             {isEditing && (
                                 <button 
                                    onClick={(e) => { e.stopPropagation(); openEditModal(item); }}
                                    className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg border border-white/20 z-20"
                                 >
                                     <Icons.Settings width={14} />
                                 </button>
                             )}
                        </motion.div>
                    ))}
                </AnimatePresence>

                <motion.button
                    onClick={() => setIsAdding(true)}
                    className="aspect-square border-2 border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 bg-white/5 hover:bg-white/10 transition-all group"
                >
                    <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-white/20 transition-all">
                        <Icons.Plus width={24} className="text-white/20 group-hover:text-white transition-colors" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/20 group-hover:text-white">Add Entry</span>
                </motion.button>
            </div>
        </GhostContent>

        <AnimatePresence>
            {(selectedId || isAdding || editingItemId) && (
                <>
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[100] pointer-events-auto" 
                        onClick={() => { setSelectedId(null); setIsAdding(false); setEditingItemId(null); setIsEditing(false); }} 
                    />
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 pointer-events-none">
                        <motion.div 
                            layoutId={selectedId ? `vault-card-${selectedId}` : undefined}
                            className="pointer-events-auto w-full max-w-md bg-[#1c1c1e] rounded-[3rem] p-10 shadow-2xl relative overflow-hidden border border-white/10"
                            transition={SPRING_CONFIG}
                        >
                            {selectedId ? (
                                <DetailView 
                                    item={items.find(i => i.id === selectedId)!} 
                                    onCopy={handleCopy} 
                                    onDelete={handleDeleteFromDetail} 
                                    showPassword={showPassword} 
                                    setShowPassword={setShowPassword} 
                                    deleteConfirm={deleteConfirm}
                                />
                            ) : (
                                <FormView 
                                    formData={formData} 
                                    setFormData={setFormData} 
                                    onSave={handleSave} 
                                    onCancel={() => { setIsAdding(false); setEditingItemId(null); resetForm(); }}
                                    isEditing={!!editingItemId}
                                    showPassword={showFormPassword}
                                    setShowPassword={setShowFormPassword}
                                />
                            )}
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    </div>
  );
};

const DetailView = ({ item, onCopy, onDelete, showPassword, setShowPassword, deleteConfirm }: any) => (
    <div className="space-y-8">
        <div className="flex items-center gap-6">
            <div className={`w-20 h-20 rounded-[2rem] ${item.color} flex items-center justify-center text-4xl shadow-2xl border border-white/20`}>
                {item.icon.startsWith('data:') ? <img src={item.icon} className="w-full h-full object-cover" alt={item.title} /> : item.icon}
            </div>
            <div>
                <h3 className="text-3xl font-bold text-white tracking-tight">{item.title}</h3>
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mt-1">Secured Identity</p>
            </div>
        </div>

        <div className="space-y-4">
            <div className="bg-white/5 rounded-3xl p-5 border border-white/5 flex items-center justify-between group">
                <div className="min-w-0 flex-1">
                    <label className="text-[9px] font-bold text-white/20 uppercase tracking-widest block mb-1">Identity UID</label>
                    <div className="text-lg font-mono text-white truncate">{item.username}</div>
                </div>
                <button onClick={() => onCopy(item.username, 'username')} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors">
                    <Icons.Copy width={18} height={18} className="text-white/40" />
                </button>
            </div>

            <div className="bg-white/5 rounded-3xl p-5 border border-white/5 flex items-center justify-between group">
                <div className="min-w-0 flex-1">
                    <label className="text-[9px] font-bold text-white/20 uppercase tracking-widest block mb-1">Access Cipher</label>
                    <div className="text-lg font-mono text-white truncate">{showPassword ? item.password : '••••••••••••'}</div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowPassword(!showPassword)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors">
                        {showPassword ? <Icons.EyeOff width={18} /> : <Icons.Eye width={18} />}
                    </button>
                    <button onClick={() => onCopy(item.password, 'password')} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors">
                        <Icons.Copy width={18} />
                    </button>
                </div>
            </div>
        </div>

        {item.hidden_description && (
             <div className="bg-white/[0.02] rounded-2xl p-5 border border-white/5">
                <label className="text-[9px] font-bold text-white/20 uppercase tracking-widest block mb-2">Internal Note</label>
                <p className="text-sm text-white/60 leading-relaxed">{item.hidden_description}</p>
             </div>
        )}

        <button 
            onClick={() => onDelete(item.id)}
            className={`w-full py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all border ${deleteConfirm ? 'bg-red-500 text-white border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'bg-red-500/5 text-red-500 border-red-500/20 hover:bg-red-500/10'}`}
        >
            {deleteConfirm ? 'Confirm Deletion' : 'Request Erasure'}
        </button>
    </div>
);

const FormView = ({ formData, setFormData, onSave, onCancel, isEditing, showPassword, setShowPassword }: any) => (
    <div className="space-y-6">
        <h3 className="text-2xl font-bold text-white tracking-tight text-center">{isEditing ? 'Modify Identity' : 'New Identity'}</h3>
        
        <div className="grid grid-cols-2 gap-3">
             <input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="Title" className="col-span-2 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-blue-500 transition-all" />
             <input value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} placeholder="Username / Email" className="col-span-2 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-blue-500 transition-all" />
             <div className="col-span-2 relative">
                <input type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder="Password" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-blue-500 transition-all pr-12" />
                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white">
                    {showPassword ? <Icons.EyeOff width={18} /> : <Icons.Eye width={18} />}
                </button>
             </div>
             <textarea value={formData.hidden_description} onChange={(e) => setFormData({...formData, hidden_description: e.target.value})} placeholder="Secret Notes (Optional)" className="col-span-2 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-blue-500 transition-all min-h-[100px] resize-none" />
        </div>

        <div className="flex gap-2">
            <button onClick={onCancel} className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all">Cancel</button>
            <button onClick={onSave} className="flex-1 py-4 bg-blue-500 hover:bg-blue-400 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-white transition-all shadow-lg shadow-blue-500/20">Commit</button>
        </div>
    </div>
);

export default Vault;