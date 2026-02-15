
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons, SPRING_CONFIG, SPRING_BOUNCY } from '../lib/constants';
import { useVaultItems, useGhostMode } from '../lib/hooks';
import { useSound } from '../lib/sound';
import { useNotification } from './NotificationProvider';

interface VaultProps {
    onFocusChange?: (focused: boolean) => void;
}

const COLORS = [
  'bg-emerald-500', 'bg-red-500', 'bg-blue-500', 
  'bg-white', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'
];

const PRESET_ICONS = [
  '🔒', '🔑', '💳', '🏦', '🆔', 
  '📱', '💻', '📧', '🎮', '🎵', 
  '📺', '🛒', '✈️', '💼', '🏠',
  '❤️', '💰', '🛡️', '☁️', '🚀'
];

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
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const iconInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (onFocusChange) {
        onFocusChange(!!selectedId || isAdding || !!editingItemId);
    }
  }, [selectedId, isAdding, editingItemId, onFocusChange]);

  useEffect(() => {
    let mounted = true;
    const timer = setTimeout(() => {
        if (!mounted) return;
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([10, 50, 10]);
        setIsScanning(false);
        setIsAuthenticated(true);
        playShimmer(); 
        showNotification('Identity Verified', 'success');
    }, 2000); 
    return () => {
      mounted = false;
      clearTimeout(timer);
      if (isAuthenticated) {
          showNotification('Vault Locked', 'reminder');
      }
    };
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setShowPassword(false);
      setCopiedField(null);
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
    setIsEditing(false); // Stop jiggling when modal opens
    playClick();
  };

  const handleCopy = (text: string | undefined, field: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    showNotification(`${field === 'username' ? 'ID' : 'Password'} Copied`, 'info');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDeleteFromDetail = (id: string) => {
    if (deleteConfirm) {
      deleteItem(id);
      setSelectedId(null);
      showNotification('Item Deleted', 'reminder');
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([50, 50]);
    } else {
      setDeleteConfirm(true);
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(20);
      setTimeout(() => setDeleteConfirm(false), 3000);
    }
  };

  const handleDeleteFromGrid = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this card? This cannot be undone.")) {
       deleteItem(id);
       showNotification('Item Deleted', 'reminder');
    }
  };

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (file.size > 2 * 1024 * 1024) { // 2MB Limit
            showNotification('Image too large (Max 2MB)', 'reminder');
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
            if (ev.target?.result) {
                setFormData(prev => ({ ...prev, icon: ev.target!.result as string }));
                showNotification('Custom Icon Loaded', 'success');
            }
        };
        reader.readAsDataURL(file);
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
                             <Icons.Fingerprint width={64} height={64} className="text-white/20" />
                             <motion.div 
                                className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_rgba(52,211,153,0.8)]"
                                animate={{ top: ['0%', '100%', '0%'] }}
                                transition={{ duration: 1.5, ease: "linear", repeat: Infinity }}
                             />
                        </div>
                        <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-8 text-[10px] font-bold text-emerald-400/60 text-center tracking-[0.5em] uppercase"
                        >
                            Authenticating Bio-Link
                        </motion.p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
  }

  return (
    <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full h-full relative" 
        onClick={() => isEditing && setIsEditing(false)}
    >
      <AnimatePresence>
        {isGhost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
          >
            <div className="bg-black/80 backdrop-blur-2xl px-10 py-5 rounded-full border border-white/10 flex items-center gap-4 shadow-2xl">
               <Icons.EyeOff className="text-white/40" width={24} />
               <span className="text-xs font-bold uppercase tracking-[0.4em] text-white/60">Privacy Protocol Active</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8 auto-rows-max p-1 max-w-7xl">
        <AnimatePresence mode="popLayout" initial={false}>
          {items.map((item) => (
            <motion.div
              layout
              layoutId={`card-container-${item.id}`}
              key={item.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, rotate: isEditing ? [0, -1, 1, -1, 0] : 0 }}
              exit={{ scale: 0.5, opacity: 0, transition: { duration: 0.15, ease: "circOut" } }}
              transition={{ 
                layout: { type: "spring", stiffness: 180, damping: 22 },
                ...SPRING_CONFIG,
                rotate: { repeat: Infinity, duration: 0.3, ease: "linear" } 
              }}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onClick={(e) => {
                e.stopPropagation();
                if (isEditing) {
                  openEditModal(item);
                } else {
                  setSelectedId(item.id);
                }
              }}
              className="relative bg-apple-gray/40 backdrop-blur-2xl border border-apple-border rounded-[2.5rem] p-6 flex flex-col items-center justify-center gap-4 aspect-square cursor-pointer overflow-visible group active:scale-95 transition-all shadow-xl hover:shadow-2xl"
            >
              <AnimatePresence>
                {isEditing && (
                  <>
                    <motion.button
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0, transition: { duration: 0.15 } }}
                      onClick={(e) => handleDeleteFromGrid(e, item.id)}
                      className="absolute -top-3 -left-3 w-10 h-10 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white z-20 shadow-xl border border-white/10 hover:bg-red-500"
                    >
                      <Icons.Minus width={18} strokeWidth={3} />
                    </motion.button>
                    <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute bottom-4 bg-apple-blue/20 text-apple-blue border border-apple-blue/30 px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest backdrop-blur-md"
                    >
                        Edit
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
              <motion.div layoutId={`card-icon-${item.id}`} className={`w-16 h-16 rounded-3xl ${item.color} flex items-center justify-center text-3xl shadow-2xl border border-white/10 group-hover:scale-110 transition-transform overflow-hidden`}>
                {isImageIcon(item.icon) ? (
                    <img src={item.icon} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                    <span className={item.color === 'bg-white' ? 'text-black' : 'text-white'}>{item.icon}</span>
                )}
              </motion.div>
              <motion.h3 layoutId={`card-title-${item.id}`} className="text-sm font-bold text-white/80 tracking-tight truncate max-w-full uppercase">
                {item.title}
              </motion.h3>
            </motion.div>
          ))}
        </AnimatePresence>
        <motion.button 
          layout
          onClick={() => { resetForm(); setIsAdding(true); }}
          className="border-2 border-dashed border-white/5 rounded-[2.5rem] flex items-center justify-center aspect-square text-white/10 hover:bg-white/5 transition-all active:scale-95"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ layout: { type: "spring", stiffness: 180, damping: 22 } }}
        >
           <Icons.Plus width={48} strokeWidth={1} />
        </motion.button>
      </motion.div>

      {/* Form Modal (Add / Edit) */}
      <AnimatePresence>
        {(isAdding || editingItemId) && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.15 } }} onClick={() => { setIsAdding(false); setEditingItemId(null); }} className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30, transition: { duration: 0.15, ease: "circOut" } }} transition={SPRING_CONFIG} className="relative w-full max-w-sm bg-[#111] border border-white/10 rounded-[3rem] p-10 shadow-2xl overflow-hidden max-h-[85vh] overflow-y-auto no-scrollbar">
              <h3 className="text-2xl font-bold mb-6 text-center tracking-tighter">
                {editingItemId ? 'Calibrate Identity' : 'Secure Card Matrix'}
              </h3>
              
              <div className="space-y-6">
                
                {/* Icon Selection */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1 mb-3 block">Security Icon</label>
                  <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-20 h-20 rounded-3xl ${formData.color} flex items-center justify-center text-4xl shadow-2xl border border-white/10 overflow-hidden relative group shrink-0`}>
                            {isImageIcon(formData.icon) ? (
                                <img src={formData.icon} alt="Icon" className="w-full h-full object-cover" />
                            ) : (
                                <span className={formData.color === 'bg-white' ? 'text-black' : 'text-white'}>{formData.icon}</span>
                            )}
                            {/* Overlay Upload Trigger */}
                            <div 
                                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-[2px]"
                                onClick={() => iconInputRef.current?.click()}
                            >
                                <Icons.CloudUpload width={24} className="text-white" />
                            </div>
                        </div>
                        
                        <div className="flex-1 grid grid-cols-5 gap-2">
                             {PRESET_ICONS.slice(0, 10).map(icon => (
                                <button 
                                    key={icon}
                                    onClick={() => setFormData({...formData, icon})}
                                    className={`aspect-square rounded-xl flex items-center justify-center text-lg hover:bg-white/10 transition-colors border ${formData.icon === icon ? 'bg-white/10 border-white/50' : 'bg-transparent border-white/5'}`}
                                >
                                    {icon}
                                </button>
                             ))}
                        </div>
                      </div>
                      
                      {/* Expanded Colors/Icons if needed or just simple list */}
                      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                         {COLORS.map(color => (
                             <button
                                key={color}
                                onClick={() => setFormData({...formData, color})}
                                className={`w-8 h-8 rounded-full border-2 transition-all ${color} ${formData.color === color ? 'border-white scale-110' : 'border-transparent opacity-50 hover:opacity-100'}`}
                             />
                         ))}
                      </div>
                      <input type="file" ref={iconInputRef} className="hidden" accept="image/*" onChange={handleIconUpload} />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1 mb-2 block">Service Descriptor</label>
                  <input autoFocus value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="e.g. Master Intelligence" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-apple-blue transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1 mb-2 block">Identity Token</label>
                  <input value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} placeholder="user_id@nexus" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-apple-blue transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1 mb-2 block">Pass-Phrase</label>
                  <div className="relative">
                    <input type={showFormPassword ? "text" : "password"} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder="Required System Entry" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-apple-blue transition-all pr-12" />
                    <button onClick={() => setShowFormPassword(!showFormPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white">{showFormPassword ? <Icons.EyeOff width={20} /> : <Icons.Eye width={20} />}</button>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1 mb-2 block">Hidden Metadata</label>
                  <textarea value={formData.hidden_description} onChange={(e) => setFormData({...formData, hidden_description: e.target.value})} placeholder="Secret notes, PINs, or recovery data..." className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-apple-blue transition-all h-20 resize-none" />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button onClick={() => { setIsAdding(false); setEditingItemId(null); }} className="flex-1 py-4 bg-white/5 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all hover:bg-white/10">Abort</button>
                  <button onClick={handleSave} className="flex-1 py-4 bg-apple-blue rounded-2xl text-[10px] font-bold uppercase tracking-widest text-white hover:brightness-110 transition-all shadow-xl shadow-apple-blue/20">
                    {editingItemId ? 'Update' : 'Commit'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedId && !isEditing && !editingItemId && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.15 } }} className="fixed inset-0 bg-black/80 backdrop-blur-2xl z-[120]" onClick={() => setSelectedId(null)} />
            <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 pointer-events-none">
              {items.filter(i => i.id === selectedId).map(item => (
                <motion.div
                  layoutId={`card-container-${item.id}`}
                  key={item.id}
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15, ease: "circOut" } }}
                  className="pointer-events-auto w-full max-w-md bg-[#111] rounded-[3.5rem] p-10 shadow-2xl overflow-hidden relative border border-white/10 max-h-[90vh] overflow-y-auto no-scrollbar"
                  transition={SPRING_BOUNCY}
                >
                  <button onClick={() => handleDeleteFromDetail(item.id)} className={`absolute top-8 left-8 p-3 rounded-full transition-all duration-300 z-10 flex items-center gap-2 ${deleteConfirm ? 'bg-red-500 text-white pl-5 pr-4' : 'bg-white/5 text-white/30'}`}>
                    {deleteConfirm && <span className="text-[10px] font-bold uppercase tracking-widest">Wipe?</span>}
                    <Icons.Trash width={20} height={20} />
                  </button>
                  <div className="absolute top-8 right-8 flex gap-2">
                    <button onClick={() => openEditModal(item)} className="p-3 bg-white/5 rounded-full text-white/20 hover:text-white transition-all z-10">
                        <Icons.Settings width={20} height={20} />
                    </button>
                    <button onClick={() => setSelectedId(null)} className="p-3 bg-white/5 rounded-full text-white/20 hover:text-white transition-all z-10">
                        <Icons.Close width={20} height={20} />
                    </button>
                  </div>
                  <div className="flex flex-col items-center pt-10 pb-10">
                     <motion.div layoutId={`card-icon-${item.id}`} className={`w-28 h-28 rounded-[2rem] ${item.color} flex items-center justify-center text-6xl shadow-2xl mb-8 border border-white/20 overflow-hidden`}>
                        {isImageIcon(item.icon) ? (
                            <img src={item.icon} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                            <span className={item.color === 'bg-white' ? 'text-black' : 'text-white'}>{item.icon}</span>
                        )}
                     </motion.div>
                    <motion.h2 layoutId={`card-title-${item.id}`} className="text-3xl font-bold text-white mb-10 text-center tracking-tighter">
                      {item.title}
                    </motion.h2>
                    <div className="w-full space-y-4">
                      <div className="w-full bg-black/40 border border-white/5 rounded-3xl p-5 flex items-center justify-between">
                        <div className="flex items-center gap-4 overflow-hidden">
                           <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center flex-shrink-0 text-white/20">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                           </div>
                           <GhostContent isGhost={isGhost} className="flex flex-col overflow-hidden">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">Identity</span>
                              <span className="text-base text-white/90 truncate font-mono">{item.username}</span>
                           </GhostContent>
                        </div>
                        <button onClick={() => handleCopy(item.username, 'username')} className="p-3 hover:bg-white/10 rounded-full active:scale-75">
                           <Icons.Copy className="text-white/20" width={20} />
                        </button>
                      </div>
                      <div className="w-full bg-black/40 border border-white/5 rounded-3xl p-5 flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1 overflow-hidden">
                          <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center flex-shrink-0 text-white/20">
                            <Icons.Lock width={20} />
                          </div>
                          <GhostContent isGhost={isGhost} className="flex flex-col flex-1 min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">Pass-phrase</span>
                            <input type={showPassword ? "text" : "password"} value={item.password || ''} readOnly className="bg-transparent text-base font-mono tracking-widest text-white/90 w-full focus:outline-none" />
                          </GhostContent>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setShowPassword(!showPassword)} className="p-3 hover:bg-white/10 rounded-full text-white/20">{showPassword ? <Icons.EyeOff width={20} /> : <Icons.Eye width={20} />}</button>
                          <button onClick={() => handleCopy(item.password, 'password')} className="p-3 hover:bg-white/10 rounded-full active:scale-75">
                             <Icons.Copy className="text-white/20" width={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Vault;
