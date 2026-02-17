
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons, SPRING_CONFIG } from '../lib/constants';
import { useSound } from '../lib/sound';
import { useNotification } from './NotificationProvider';
import { 
  generateTOTP, 
  getRemainingTime, 
  SentinelService, 
  fetchFromDatabase, 
  syncToDatabase
} from '../lib/totp';
import { useObserver } from '../lib/hooks';

interface TheSentinelProps {
    userDatabase?: SentinelService[];
    onClose?: () => void;
}

const TAG_OPTIONS = ['MAIN', 'ALT', 'FARM', 'TRADE'];

// Visual mapping for tags
const getTagColor = (tag: string) => {
    switch (tag) {
        case 'MAIN': return 'border-amber-500 text-amber-500';
        case 'ALT': return 'border-zinc-500 text-zinc-400';
        case 'FARM': return 'border-emerald-500 text-emerald-500';
        case 'TRADE': return 'border-blue-500 text-blue-500';
        default: return 'border-white/10 text-white/40';
    }
};

const TheSentinel: React.FC<TheSentinelProps> = ({ userDatabase, onClose }) => {
    const [services, setServices] = useState<SentinelService[]>([]);
    const [codes, setCodes] = useState<Record<string, string>>({});
    const [timeLeft, setTimeLeft] = useState(30);
    const [isAdding, setIsAdding] = useState(false);
    
    // Observer Hook for Backup integration
    const { evidence, loadFromBackup } = useObserver();
    
    // Selection & Recovery Vault State
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [editingSlot, setEditingSlot] = useState<number | null>(null);
    const [revealedSlot, setRevealedSlot] = useState<number | null>(null);
    const slotInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Visual Feedback State
    const [justPasted, setJustPasted] = useState<number[]>([]);

    // Note Interaction State
    const [hoveredNoteId, setHoveredNoteId] = useState<string | null>(null);
    const [focusedNoteId, setFocusedNoteId] = useState<string | null>(null);
    const [revealHiddenDesc, setRevealHiddenDesc] = useState(false);

    // Tagging & Filtering State
    const [tagMenuId, setTagMenuId] = useState<string | null>(null);
    const [filterTag, setFilterTag] = useState<string | null>(null); // null means ALL

    // Form State
    const [newService, setNewService] = useState({ 
        name: '', 
        secret: '', 
        note: '', // Identity Token
        hiddenDescription: '', // Pass-phrase
        tags: [] as string[] 
    });
    const [showNewSecret, setShowNewSecret] = useState(false);
    const [showNewHiddenDesc, setShowNewHiddenDesc] = useState(false);
    
    const { playTick, playDing, playWhoosh, playClick } = useSound();
    const { showNotification } = useNotification();

    // Init Data
    useEffect(() => {
        if (userDatabase && userDatabase.length > 0) {
            setServices(userDatabase);
        } else {
            setServices(fetchFromDatabase());
        }
    }, [userDatabase]);

    // Timer Loop
    useEffect(() => {
        const update = async () => {
            const remaining = getRemainingTime();
            setTimeLeft(remaining);
            const newCodes: Record<string, string> = {};
            for (const service of services) {
                newCodes[service.id] = await generateTOTP(service.secret);
            }
            setCodes(newCodes);
        };
        const interval = setInterval(update, 1000);
        update(); 
        return () => clearInterval(interval);
    }, [services]);

    // Focus input when editing a slot
    useEffect(() => {
        if (editingSlot !== null && slotInputRef.current) {
            slotInputRef.current.focus();
        }
    }, [editingSlot]);

    // Reset view state when switching accounts
    useEffect(() => {
        setEditingSlot(null);
        setRevealedSlot(null);
        setJustPasted([]);
        setRevealHiddenDesc(false);
    }, [selectedId]);

    const handleCopy = (code: string) => {
        if (!code || code === 'EMPTY_SLOT') return;
        navigator.clipboard.writeText(code);
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(20);
        playDing();
        showNotification('Secure Code Copied', 'success');
    };

    const handleSecureCopy = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(20);
        playDing();
        showNotification('CLIPBOARD_SECURED: Auto-clearing in 30s', 'success');
    };

    // --- Portability Protocol (Export/Import) ---
    const handleExport = () => {
        // Global Backup: Sentinel + Observer
        const exportPayload = {
            version: 2,
            sentinel: services,
            observer: evidence
        };
        
        const dataStr = JSON.stringify(exportPayload, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `nexus_global_backup_${Date.now()}.nexus`;
        link.click();
        URL.revokeObjectURL(url);
        playDing();
        showNotification('Global System Exported (.nexus)', 'success');
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const imported = JSON.parse(ev.target?.result as string);
                
                if (window.confirm('Overwrite current Nexus system with imported data? This affects Sentinel and Observer.')) {
                    // Detect Format Version
                    let sentinelData: any[] = [];
                    let observerData: any[] = [];

                    if (Array.isArray(imported)) {
                        // V1 Format (Legacy Sentinel only)
                        sentinelData = imported;
                    } else if (imported.sentinel) {
                        // V2 Format (Global)
                        sentinelData = imported.sentinel || [];
                        observerData = imported.observer || [];
                    }

                    // Process Sentinel
                    const sanitizedSentinel = sentinelData.map((item: any) => ({
                            ...item,
                            vault: Array.isArray(item.vault) ? item.vault : Array(10).fill('EMPTY_SLOT'),
                            tags: Array.isArray(item.tags) ? item.tags : [],
                            note: item.note || '',
                            hiddenDescription: item.hiddenDescription || ''
                    }));
                    setServices(sanitizedSentinel);
                    syncToDatabase(sanitizedSentinel);
                    
                    // Process Observer
                    if (observerData.length > 0) {
                        loadFromBackup(observerData);
                        showNotification(`Observer: ${observerData.length} records restored`, 'info');
                    }

                    playWhoosh();
                    showNotification('System Link Re-established', 'success');
                }
            } catch (err) {
                showNotification('Corrupt Nexus File', 'reminder');
            }
        };
        reader.readAsText(file);
    };

    const handleAddService = () => {
        if (!newService.name || !newService.secret) return;
        const base32Regex = /^[A-Z2-7]+=*$/;
        if (!base32Regex.test(newService.secret.toUpperCase().replace(/\s/g, ''))) {
            showNotification('Invalid Secret (Base32 Required)', 'reminder');
            return;
        }
        const newItem: SentinelService = {
            id: crypto.randomUUID(),
            name: newService.name,
            secret: newService.secret.replace(/\s/g, '').toUpperCase(),
            vault: Array(10).fill('EMPTY_SLOT'),
            note: newService.note,
            hiddenDescription: newService.hiddenDescription,
            tags: newService.tags
        };
        const updated = [...services, newItem];
        setServices(updated);
        syncToDatabase(updated);
        setNewService({ name: '', secret: '', note: '', hiddenDescription: '', tags: [] });
        setIsAdding(false);
        playWhoosh();
        showNotification('Channel Established', 'success');
    };

    const toggleNewTag = (tag: string) => {
        setNewService(prev => {
            const tags = prev.tags.includes(tag)
                ? prev.tags.filter(t => t !== tag)
                : [...prev.tags, tag];
            return { ...prev, tags };
        });
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm("Disconnect this secure channel?")) {
            const updated = services.filter(s => s.id !== id);
            setServices(updated);
            syncToDatabase(updated);
            if (selectedId === id) setSelectedId(null);
            showNotification('Channel Terminated', 'reminder');
        }
    };

    // --- Tagging Logic ---
    const toggleTag = (id: string, tag: string) => {
        const updated = services.map(s => {
            if (s.id === id) {
                const currentTags = s.tags || [];
                // Toggle tag
                const newTags = currentTags.includes(tag) 
                    ? currentTags.filter(t => t !== tag) 
                    : [...currentTags, tag];
                return { ...s, tags: newTags };
            }
            return s;
        });
        setServices(updated);
        syncToDatabase(updated);
        setTagMenuId(null);
    };

    // Update Note Logic
    const updateNote = (id: string, note: string) => {
        const updated = services.map(s => s.id === id ? { ...s, note } : s);
        setServices(updated);
        syncToDatabase(updated);
    };

    // Update Hidden Description Logic
    const updateHiddenDesc = (id: string, desc: string) => {
        const updated = services.map(s => s.id === id ? { ...s, hiddenDescription: desc } : s);
        setServices(updated);
        syncToDatabase(updated);
    };

    // Recovery Vault Logic
    const handleSlotClick = (index: number, val: string) => {
        if (!selectedId) return;
        
        if (val === 'EMPTY_SLOT') {
            setEditingSlot(index);
            playTick();
        } else {
            setRevealedSlot(revealedSlot === index ? null : index);
            playTick();
        }
    };

    const saveSlot = (index: number, val: string) => {
        if (!selectedId) return;

        const updatedServices = services.map(service => {
            if (service.id === selectedId) {
                const newVault = [...service.vault];
                newVault[index] = val.trim() || 'EMPTY_SLOT';
                return { ...service, vault: newVault };
            }
            return service;
        });

        setServices(updatedServices);
        syncToDatabase(updatedServices);
        setEditingSlot(null);
        if (val.trim()) showNotification('Vault Slot Updated', 'success');
    };

    // Smart Paste Logic
    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, startIndex: number) => {
        if (!selectedId) return;
        e.preventDefault();
        
        const text = e.clipboardData.getData('text');
        const tokens = text.split(/[\n, ]+/).map(t => t.trim()).filter(t => t.length > 0);

        if (tokens.length === 0) return;

        const pastedIndices: number[] = [];
        const updatedServices = services.map(service => {
            if (service.id === selectedId) {
                const newVault = [...service.vault];
                tokens.forEach((token, i) => {
                    if (startIndex + i < 10) {
                        newVault[startIndex + i] = token;
                        pastedIndices.push(startIndex + i);
                    }
                });
                return { ...service, vault: newVault };
            }
            return service;
        });

        setServices(updatedServices);
        syncToDatabase(updatedServices);
        
        if (pastedIndices.length > 0) {
            setJustPasted(pastedIndices);
            setTimeout(() => setJustPasted([]), 1500); 
            playDing();
            showNotification(`${pastedIndices.length} Codes Securely Pasted`, 'success');
        } else {
             showNotification('Vault Slot Updated', 'success');
        }
        setEditingSlot(null);
    };

    // Get current active service
    const activeService = services.find(s => s.id === selectedId);
    const activeVault = activeService ? activeService.vault : [];

    // Filter Logic
    const filteredServices = filterTag 
        ? services.filter(s => s.tags?.includes(filterTag)) 
        : services;

    // Get primary tag color of active service for border
    const activeServicePrimaryTag = activeService?.tags?.[0] || 'DEFAULT';
    const activeBorderColor = getTagColor(activeServicePrimaryTag).split(' ')[0];

    return (
        <motion.div 
            className="w-full h-full lg:w-[850px] lg:h-[600px] lg:fixed lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 bg-[#0a0a0a] border border-amber-500/20 rounded-[2rem] flex flex-col justify-between relative overflow-hidden group shadow-[0_0_100px_rgba(245,158,11,0.05)] z-[1000]"
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.1 } }}
        >
            
            {/* 1. Header (Fixed) */}
            <div className="flex items-center justify-between p-6 pb-4 shrink-0 bg-[#0a0a0a]/80 backdrop-blur-xl z-20 border-b border-white/5 h-[80px]">
                <div className="flex items-center gap-4 text-amber-500">
                    <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                        <Icons.Fingerprint width={20} height={20} />
                    </div>
                    <div>
                        <span className="text-sm font-bold uppercase tracking-[0.2em] block text-white">The Sentinel</span>
                        <span className="text-[10px] font-mono text-amber-500 block mt-0.5">Identity & Recovery Protocol</span>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    {/* Export/Import Controls */}
                    <div className="flex items-center gap-1 mr-4 border-r border-white/10 pr-4">
                        <button onClick={() => fileInputRef.current?.click()} className="p-2 text-white/30 hover:text-white transition-colors" title="Import .nexus">
                            <Icons.Download width={16} />
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" accept=".json,.nexus" onChange={handleImport} />
                        <button onClick={handleExport} className="p-2 text-white/30 hover:text-amber-500 transition-colors" title="Export .nexus">
                            <Icons.CloudUpload width={16} />
                        </button>
                    </div>

                    {/* Timer */}
                    <div className="relative w-9 h-9 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90">
                            <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(245, 158, 11, 0.1)" strokeWidth="3" />
                            <motion.circle 
                                cx="18" cy="18" r="16" 
                                fill="none" 
                                stroke="#f59e0b" 
                                strokeWidth="3"
                                strokeDasharray={100}
                                animate={{ strokeDashoffset: 100 - (100 * (timeLeft / 30)) }}
                                transition={{ duration: 1, ease: "linear" }}
                            />
                        </svg>
                        <span className="absolute text-[9px] font-mono font-bold text-amber-500">{timeLeft}</span>
                    </div>
                    
                    {/* Close Button */}
                    <button 
                        onClick={onClose}
                        className="p-2.5 bg-white/5 hover:bg-red-500/20 hover:text-red-500 rounded-full text-white/20 transition-all active:scale-90"
                    >
                        <Icons.Close width={18} height={18} />
                    </button>
                </div>
            </div>

            {/* 2. Top Section: Active Identities (Scrollable) */}
            <div className="flex-1 overflow-y-auto no-scrollbar relative z-10 px-6 py-4 space-y-3 pb-24">
                
                {/* Horizontal Filter Bar */}
                <div className="sticky top-0 bg-[#0a0a0a]/95 backdrop-blur-md z-20 pb-2 mb-2 flex items-center justify-between border-b border-white/5">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
                        <button 
                            onClick={() => { setFilterTag(null); playClick(); }}
                            className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${!filterTag ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                        >
                            ALL
                        </button>
                        {TAG_OPTIONS.map(tag => (
                            <button
                                key={tag}
                                onClick={() => { setFilterTag(tag); playClick(); }}
                                className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all border ${filterTag === tag ? getTagColor(tag).replace('text-', 'bg-').replace('border-', 'border-transparent text-black ') : 'bg-transparent border-white/10 text-white/40 hover:border-white/30'}`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                    {!isAdding && (
                        <button onClick={() => setIsAdding(true)} className="text-[10px] text-amber-500 hover:text-amber-400 font-bold uppercase tracking-widest flex items-center gap-1 transition-colors pl-4">
                            <Icons.Plus width={12} /> Add
                        </button>
                    )}
                </div>

                <AnimatePresence mode="popLayout">
                    {services.length === 0 && !isAdding && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-32 flex flex-col items-center justify-center text-amber-500/20 gap-3 border-2 border-dashed border-amber-500/10 rounded-3xl">
                            <Icons.Lock width={24} />
                            <p className="text-[10px] uppercase tracking-widest font-bold">Secure Vault Empty</p>
                        </motion.div>
                    )}

                    {filteredServices.map((service) => {
                        const isMenuOpen = tagMenuId === service.id;
                        const isSelected = selectedId === service.id;

                        return (
                        <motion.div
                            layout
                            key={service.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={() => { setSelectedId(service.id); playTick(); }}
                            className={`
                                relative p-4 rounded-2xl flex items-center justify-between group transition-all cursor-pointer border
                                ${isSelected 
                                    ? 'bg-amber-500/10 border-amber-500 shadow-[0_0_20px_#f59e0b]' 
                                    : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'}
                            `}
                        >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border flex-shrink-0 ${isSelected ? 'bg-amber-500 text-black border-amber-500' : 'bg-black/40 border-white/10 text-amber-500'}`}>
                                    {service.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className={`font-bold text-sm tracking-wide truncate ${isSelected ? 'text-white' : 'text-white/80'}`}>{service.name}</h4>
                                        
                                        {/* Tag Badges (Filterable) */}
                                        {service.tags?.map(tag => (
                                            <button 
                                                key={tag} 
                                                onClick={(e) => { e.stopPropagation(); setFilterTag(tag); playClick(); }}
                                                className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider hover:bg-white/20 transition-colors ${getTagColor(tag).replace('border-', 'bg-transparent border ')}`}
                                            >
                                                {tag}
                                            </button>
                                        ))}

                                        {/* Link/Identity Menu */}
                                        <div className="relative">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setTagMenuId(isMenuOpen ? null : service.id); playClick(); }}
                                                className={`p-1 rounded-md transition-colors ${isMenuOpen || isSelected ? 'text-amber-500' : 'text-white/20 hover:text-white/60'}`}
                                            >
                                                <Icons.Links width={12} />
                                            </button>
                                            {isMenuOpen && (
                                                <div className="absolute top-full left-0 mt-1 bg-black border border-white/20 rounded-xl p-1 z-50 flex flex-col gap-0.5 shadow-2xl min-w-[100px]">
                                                    <div className="px-2 py-1 text-[8px] font-bold text-white/30 uppercase tracking-widest border-b border-white/10 mb-1">Identity Tag</div>
                                                    {TAG_OPTIONS.map(tag => (
                                                        <button 
                                                            key={tag}
                                                            onClick={(e) => { e.stopPropagation(); toggleTag(service.id, tag); }}
                                                            className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1.5 rounded-lg text-left hover:bg-white/10 ${service.tags?.includes(tag) ? 'text-amber-500 bg-amber-500/10' : 'text-white/60'}`}
                                                        >
                                                            {tag}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div 
                                        onClick={(e) => { e.stopPropagation(); handleCopy(codes[service.id]); setSelectedId(service.id); }}
                                        className="font-mono text-xl md:text-2xl font-bold text-amber-500/90 tracking-[0.1em] hover:text-white transition-colors"
                                    >
                                        {codes[service.id] ? `${codes[service.id].substring(0,3)} ${codes[service.id].substring(3)}` : '...'}
                                    </div>
                                    
                                    {/* Integrated Info Display (Preview) */}
                                    <div className="mt-2 w-full max-w-[200px]" onClick={(e) => e.stopPropagation()}>
                                        <label className={`text-[8px] font-bold uppercase tracking-widest block mb-0.5 ${isSelected ? 'text-amber-500' : 'text-amber-500/40'}`}>
                                            UPLINK_SECURITY_NOTE
                                        </label>
                                        <input 
                                            type={hoveredNoteId === service.id || focusedNoteId === service.id ? "text" : "password"}
                                            value={service.note || ''}
                                            onChange={(e) => updateNote(service.id, e.target.value)}
                                            onFocus={() => { setFocusedNoteId(service.id); setSelectedId(service.id); }}
                                            onBlur={() => setFocusedNoteId(null)}
                                            onMouseEnter={() => setHoveredNoteId(service.id)}
                                            onMouseLeave={() => setHoveredNoteId(null)}
                                            className={`
                                                w-full bg-transparent border-b text-[10px] font-mono outline-none transition-all placeholder-white/10
                                                ${isSelected 
                                                    ? 'border-amber-500/50 text-amber-500' 
                                                    : 'border-white/5 text-white/40 hover:text-white/60'}
                                            `}
                                            placeholder="NO_DATA_LINKED"
                                        />
                                    </div>
                                </div>
                            </div>
                            <button onClick={(e) => handleDelete(service.id, e)} className="p-2 text-white/10 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 self-start">
                                <Icons.Minus width={14} />
                            </button>
                        </motion.div>
                    )})}
                </AnimatePresence>
            </div>

            {/* Secure Card Matrix (Add Modal) */}
            <AnimatePresence>
                {isAdding && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAdding(false)} className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
                         <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 30 }} 
                            animate={{ scale: 1, opacity: 1, y: 0 }} 
                            exit={{ scale: 0.9, opacity: 0, y: 30 }} 
                            transition={SPRING_CONFIG} 
                            className="relative w-full max-w-sm bg-[#111] border border-white/10 rounded-[3rem] p-10 shadow-2xl overflow-hidden max-h-[85vh] overflow-y-auto no-scrollbar"
                         >
                             <h3 className="text-2xl font-bold mb-8 text-center tracking-tighter text-amber-500">Secure Card Matrix</h3>
                             <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1 mb-2 block">Service Descriptor</label>
                                    <input 
                                        autoFocus 
                                        value={newService.name} 
                                        onChange={(e) => setNewService({...newService, name: e.target.value})} 
                                        placeholder="e.g. Master Intelligence" 
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-amber-500 transition-all placeholder-white/20" 
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1 mb-2 block">Uplink Key (Base32)</label>
                                    <div className="relative">
                                        <input 
                                            type={showNewSecret ? "text" : "password"}
                                            value={newService.secret} 
                                            onChange={(e) => setNewService({...newService, secret: e.target.value})} 
                                            placeholder="JBSWY3DPEHPK3PXP" 
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-amber-500 transition-all font-mono uppercase placeholder-white/20" 
                                        />
                                        <button onClick={() => setShowNewSecret(!showNewSecret)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors">
                                            {showNewSecret ? <Icons.EyeOff width={16} /> : <Icons.Eye width={16} />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1 mb-2 block">Identity Token</label>
                                    <input 
                                        value={newService.note} 
                                        onChange={(e) => setNewService({...newService, note: e.target.value})} 
                                        placeholder="user_id@nexus" 
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-amber-500 transition-all placeholder-white/20" 
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1 mb-2 block">Secure Description / Pass-phrase</label>
                                    <div className="relative">
                                        <input 
                                            type={showNewHiddenDesc ? "text" : "password"} 
                                            value={newService.hiddenDescription} 
                                            onChange={(e) => setNewService({...newService, hiddenDescription: e.target.value})} 
                                            placeholder="Required System Entry" 
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-amber-500 transition-all pr-12 placeholder-white/20" 
                                        />
                                        <button onClick={() => setShowNewHiddenDesc(!showNewHiddenDesc)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors">
                                            {showNewHiddenDesc ? <Icons.EyeOff width={16} /> : <Icons.Eye width={16} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Tag Selection */}
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1 mb-2 block">Classification</label>
                                    <div className="flex flex-wrap gap-2">
                                        {TAG_OPTIONS.map(tag => (
                                            <button 
                                                key={tag}
                                                onClick={() => toggleNewTag(tag)}
                                                className={`px-3 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest border transition-all ${
                                                    newService.tags.includes(tag) 
                                                    ? 'bg-amber-500 text-black border-amber-500' 
                                                    : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20'
                                                }`}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button onClick={() => setIsAdding(false)} className="flex-1 py-4 bg-white/5 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all hover:bg-white/10 text-white/60">ABORT</button>
                                    <button onClick={handleAddService} className="flex-1 py-4 bg-amber-500 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-black hover:brightness-110 transition-all shadow-xl shadow-amber-500/20">COMMIT</button>
                                </div>
                             </div>
                         </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Divider */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-500/30 to-transparent shadow-[0_0_10px_#f59e0b] shrink-0" />

            {/* 3. Bottom Section: Recovery Vault (Fixed) */}
            <div className={`p-6 bg-black/60 backdrop-blur-2xl shrink-0 h-auto min-h-[280px] flex flex-col justify-start transition-all duration-500 ${selectedId ? 'shadow-[0_-10px_40px_rgba(245,158,11,0.1)] border-t border-amber-500/20' : ''}`}>
                <div className="flex items-center justify-between mb-4">
                     <div>
                         <h3 className="text-amber-500 font-bold tracking-[0.2em] text-[10px] flex items-center gap-2 uppercase">
                            <Icons.Shield width={12} /> 
                            {activeService ? `RESERVE // ${activeService.name}` : 'RECOVERY_UPLINK_RESERVE'}
                         </h3>
                         <p className="text-[9px] text-white/30 font-mono mt-1 ml-5">
                            {activeService ? 'Static emergency bypass codes for this identity.' : 'Select an identity above to view codes.'}
                         </p>
                     </div>
                </div>
                
                {activeService ? (
                    <div className="flex flex-col gap-4">
                         {/* Hidden Description Area (Restored Feature) */}
                         <div 
                             className={`relative group/desc p-3 rounded-xl border bg-black/40 transition-colors ${activeBorderColor}`}
                             onClick={() => setRevealHiddenDesc(!revealHiddenDesc)}
                             onMouseEnter={() => setRevealHiddenDesc(true)}
                             onMouseLeave={() => setRevealHiddenDesc(false)}
                         >
                             <div className="flex items-center justify-between mb-1">
                                 <span className={`text-[8px] font-bold uppercase tracking-widest ${activeServicePrimaryTag === 'MAIN' ? 'text-amber-500' : 'text-white/40'}`}>
                                     Sensitive Identity Data
                                 </span>
                                 <div className="flex gap-2">
                                     <button 
                                         onClick={(e) => { e.stopPropagation(); handleSecureCopy(activeService.hiddenDescription || ''); }}
                                         className="text-white/20 hover:text-white transition-colors"
                                     >
                                         <Icons.Copy width={12} />
                                     </button>
                                     <span className="text-white/20">
                                         {revealHiddenDesc ? <Icons.EyeOff width={12} /> : <Icons.Eye width={12} />}
                                     </span>
                                 </div>
                             </div>
                             
                             {/* Editable Field */}
                             <input 
                                value={activeService.hiddenDescription || ''}
                                onChange={(e) => updateHiddenDesc(activeService.id, e.target.value)}
                                onClick={(e) => e.stopPropagation()} // Allow clicking into input without toggling reveal
                                type={revealHiddenDesc ? "text" : "password"}
                                placeholder="NO_SENSITIVE_DATA_LINKED"
                                className={`w-full bg-transparent border-none outline-none text-xs font-mono tracking-wider ${revealHiddenDesc ? 'text-white' : 'text-white/30'}`}
                             />
                         </div>

                         {/* Recovery Codes Grid */}
                         <div className="grid grid-cols-2 gap-2 overflow-y-auto no-scrollbar max-h-[120px]">
                             {activeVault.map((code, idx) => {
                                 const isEmpty = code === 'EMPTY_SLOT';
                                 const isRevealed = revealedSlot === idx;
                                 const isEdit = editingSlot === idx;
                                 const isPasted = justPasted.includes(idx);

                                 return (
                                     <div 
                                        key={`${activeService.id}-${idx}`}
                                        onClick={() => !isEdit && handleSlotClick(idx, code)}
                                        className={`
                                            relative h-10 rounded-lg border flex items-center px-3 transition-all duration-500 cursor-pointer group
                                            ${isPasted 
                                                ? 'bg-amber-500/20 shadow-[0_0_20px_#f59e0b] border-amber-500' 
                                                : isEmpty 
                                                    ? 'bg-white/5 border-white/5 text-white/20 hover:bg-white/10' 
                                                    : 'bg-amber-500/5 border-amber-500/20 text-amber-500'}
                                        `}
                                     >
                                         <span className={`text-[9px] font-mono mr-3 w-4 transition-colors ${isPasted ? 'text-amber-500 font-bold' : 'text-white/20'}`}>{String(idx + 1).padStart(2, '0')}</span>
                                         
                                         {isEdit ? (
                                             <input 
                                                ref={slotInputRef}
                                                defaultValue={isEmpty ? '' : code}
                                                onPaste={(e) => handlePaste(e, idx)}
                                                onBlur={(e) => saveSlot(idx, e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && saveSlot(idx, e.currentTarget.value)}
                                                className="bg-transparent border-none outline-none text-xs font-mono text-white w-full uppercase placeholder-white/20"
                                                placeholder="ENTER CODE"
                                             />
                                         ) : (
                                             <div className="flex-1 flex items-center justify-between">
                                                 <span className={`text-xs font-mono tracking-widest ${isPasted ? 'text-white' : (isEmpty ? 'text-white/20' : 'text-amber-500')} ${!isEmpty && !isRevealed && !isPasted ? 'blur-[4px]' : ''}`}>
                                                     {code}
                                                 </span>
                                                 {!isEmpty && isRevealed && (
                                                     <button 
                                                        onClick={(e) => { e.stopPropagation(); handleCopy(code); }}
                                                        className="text-amber-500/50 hover:text-amber-500"
                                                     >
                                                         <Icons.Copy width={12} />
                                                     </button>
                                                 )}
                                             </div>
                                         )}
                                     </div>
                                 );
                             })}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-white/20 border-2 border-dashed border-white/5 rounded-2xl gap-2">
                        <Icons.Lock width={24} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">SELECT_UPLINK_FOR_RESERVE</span>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default TheSentinel;
