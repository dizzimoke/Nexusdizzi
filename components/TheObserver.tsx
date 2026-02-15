
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons, SPRING_CONFIG } from '../lib/constants';
import { useSound } from '../lib/sound';
import { useNotification } from './NotificationProvider';
import { useObserver, ObserverEvidence } from '../lib/hooks';
import { fetchFromDatabase, SentinelService } from '../lib/totp';

interface TheObserverProps {
    onClose?: () => void;
    onNavigate?: (tabIndex: number) => void;
}

const CATEGORIES = ['ALL', 'LOOT_DROPS', 'TRADE_LOGS', 'CONFIGS'];

const TheObserver: React.FC<TheObserverProps> = ({ onClose, onNavigate }) => {
    const { evidence, addEvidence, updateEvidence, deleteEvidence } = useObserver();
    const [filter, setFilter] = useState('ALL');
    const [identities, setIdentities] = useState<SentinelService[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [ghostImage, setGhostImage] = useState<string | null>(null);
    const [ghostOpacity, setGhostOpacity] = useState(50);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { playClick, playWhoosh, playDing, playPop } = useSound();
    const { showNotification } = useNotification();

    useEffect(() => {
        setIdentities(fetchFromDatabase());
    }, []);

    // Paste Listener
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            for (const item of items) {
                if (item.type.indexOf('image') !== -1) {
                    const blob = item.getAsFile();
                    if (blob) {
                        playWhoosh();
                        showNotification('Processing Clipboard Image...', 'info');
                        addEvidence(blob).then(() => {
                             playDing();
                             showNotification('Evidence Securely Logged', 'success');
                        });
                    }
                }
            }
        };
        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [addEvidence]);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            playWhoosh();
            addEvidence(file).then(() => {
                playDing();
                showNotification('Evidence Securely Logged', 'success');
            });
        }
    };

    const sendToOCR = (imageData: string) => {
        fetch(imageData)
            .then(res => res.blob())
            .then(blob => {
                 const item = new ClipboardItem({ [blob.type]: blob });
                 navigator.clipboard.write([item]).then(() => {
                     showNotification('Evidence Copied to Clipboard', 'success');
                     if (onNavigate) {
                         onNavigate(0); // Switch to Toolbox
                         setTimeout(() => showNotification('Select OCR Scanner to Paste', 'info'), 500);
                     }
                 });
            });
    };
    
    const openGhostView = (img: string) => {
        setGhostImage(img);
        playPop();
    };

    const filteredEvidence = filter === 'ALL' 
        ? evidence 
        : evidence.filter(ev => ev.category === filter);

    return (
        <motion.div 
            className="w-full h-full lg:w-[1000px] lg:h-[700px] lg:fixed lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 bg-black/80 backdrop-blur-[40px] border border-white/10 rounded-[32px] flex flex-col justify-between relative overflow-hidden shadow-2xl z-[1000]"
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.1 } }}
        >
            {/* Background Texture */}
            <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
            <div className="absolute inset-0 pointer-events-none z-0 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent opacity-20" style={{ backgroundSize: '100% 4px' }} />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between p-8 pb-6 shrink-0 z-20 border-b border-white/10 gap-6">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-white/5 rounded-2xl border border-white/10 shadow-inner">
                            <Icons.Aperture width={28} height={28} className="text-white" />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-[0.3em] text-zinc-500">Visual Intelligence</span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-white uppercase leading-none drop-shadow-xl">
                        The Observer
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                     {/* Category Filter */}
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => { setFilter(cat); playClick(); }}
                                className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap border ${
                                    filter === cat 
                                    ? 'bg-white text-black border-white shadow-[0_0_25px_rgba(255,255,255,0.4)]' 
                                    : 'bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-600 hover:text-white'
                                }`}
                            >
                                {cat.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                     <button 
                        onClick={onClose}
                        className="p-4 bg-white/5 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-all active:scale-90 border border-white/5 hover:border-white/20"
                    >
                        <Icons.Close width={20} height={20} />
                    </button>
                </div>
            </div>

            {/* Grid Area */}
            <div className="flex-1 overflow-y-auto p-8 relative z-10 no-scrollbar bg-black/20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {filteredEvidence.map(ev => (
                            <EvidenceCard 
                                key={ev.id} 
                                data={ev} 
                                identities={identities}
                                onUpdate={updateEvidence}
                                onDelete={deleteEvidence}
                                onGhost={openGhostView}
                                onOCR={sendToOCR}
                            />
                        ))}
                    </AnimatePresence>
                </div>
                {evidence.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-700 pointer-events-none">
                        <Icons.Aperture width={80} height={80} className="mb-6 opacity-20" />
                        <span className="text-xl font-black uppercase tracking-[0.2em] text-zinc-800">No Visual Intel</span>
                    </div>
                )}
            </div>

            {/* Drop Zone Footer */}
            <div 
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                    shrink-0 h-32 border-t border-white/10 flex items-center justify-center transition-all cursor-pointer relative overflow-hidden group
                    ${isDragging ? 'bg-white/10' : 'hover:bg-white/[0.02] bg-[#050505]'}
                `}
            >
                <div className="flex flex-col items-center gap-3 relative z-10 transition-transform group-hover:scale-105">
                     <Icons.CloudUpload width={32} height={32} className={`transition-colors ${isDragging ? 'text-white' : 'text-zinc-600 group-hover:text-white'}`} />
                     <span className={`text-sm font-bold uppercase tracking-[0.3em] transition-colors ${isDragging ? 'text-white' : 'text-zinc-600 group-hover:text-white'}`}>
                        {isDragging ? 'Acquiring Target...' : 'Drop Evidence / Paste (Ctrl+V)'}
                    </span>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) addEvidence(file);
                }} />
            </div>

            {/* Ghost View Overlay */}
             <AnimatePresence>
                {ghostImage && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center"
                    >
                         <img 
                            src={ghostImage} 
                            className="w-full h-full object-contain pointer-events-none"
                            style={{ opacity: ghostOpacity / 100 }}
                         />
                         
                         {/* Controls */}
                         <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-[#111] border border-white/20 rounded-3xl p-8 flex flex-col gap-4 pointer-events-auto shadow-2xl w-96">
                             <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-white">
                                 <span>Opacity Control</span>
                                 <span className="font-mono">{ghostOpacity}%</span>
                             </div>
                             <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                value={ghostOpacity} 
                                onChange={(e) => setGhostOpacity(Number(e.target.value))}
                                className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-white"
                             />
                             <button 
                                onClick={() => setGhostImage(null)}
                                className="mt-4 w-full py-4 bg-white text-black hover:bg-zinc-200 rounded-2xl text-xs font-bold uppercase tracking-widest transition-colors"
                             >
                                 Deactivate Overlay
                             </button>
                         </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// Evidence Card Re-style
const EvidenceCard: React.FC<{
    data: ObserverEvidence;
    identities: SentinelService[];
    onUpdate: (id: string, updates: Partial<ObserverEvidence>) => void;
    onDelete: (id: string) => void;
    onGhost: (img: string) => void;
    onOCR: (img: string) => void;
}> = ({ data, identities, onUpdate, onDelete, onGhost, onOCR }) => {
    const [isHovered, setIsHovered] = useState(false);
    const { playTick, playClick } = useSound();

    const linkedIdentity = identities.find(id => id.id === data.linkedIdentityId);
    
    const date = new Date(data.timestamp);
    const timeStr = `${date.getDate()}/${date.getMonth()+1} • ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative rounded-3xl bg-white/[0.02] border border-white/10 overflow-hidden group hover:border-white/30 transition-all"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Image Thumbnail */}
            <div className="relative aspect-video bg-black/50 cursor-pointer group/img" onClick={() => onGhost(data.imageData)}>
                <img src={data.imageData} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-500" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                    <span className="bg-black/60 backdrop-blur-md text-white border border-white/20 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest shadow-xl">
                        Ghost View
                    </span>
                </div>
            </div>

            {/* Controls Overlay */}
            <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button 
                    onClick={() => onOCR(data.imageData)}
                    className="p-2.5 bg-black/50 hover:bg-white text-white hover:text-black rounded-xl backdrop-blur-md border border-white/10 transition-colors"
                    title="Send to OCR"
                 >
                     <Icons.Scan width={16} />
                 </button>
                 <button 
                    onClick={() => onDelete(data.id)}
                    className="p-2.5 bg-black/50 hover:bg-red-500 text-white hover:text-white rounded-xl backdrop-blur-md border border-white/10 transition-colors"
                    title="Delete Evidence"
                 >
                     <Icons.Trash width={16} />
                 </button>
            </div>

            {/* Data Form */}
            <div className="p-6 space-y-4 bg-[#080808]">
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                     <span className="text-sm font-bold text-white">{timeStr}</span>
                     <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{data.category}</span>
                </div>

                {/* Identity Link */}
                <div className="relative group/select">
                    <select 
                        value={data.linkedIdentityId || ''}
                        onChange={(e) => onUpdate(data.id, { linkedIdentityId: e.target.value })}
                        className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white uppercase tracking-wide appearance-none cursor-pointer hover:border-white/30 transition-colors focus:border-white focus:bg-white/5"
                        onClick={playTick}
                    >
                        <option value="">[ UNLINKED_SOURCE ]</option>
                        {identities.map(id => (
                            <option key={id.id} value={id.id} className="bg-black text-white">
                                [{id.tags?.[0] || 'ID'}] {id.name.toUpperCase()}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/40 group-hover/select:text-white transition-colors">
                        <Icons.ChevronDown width={14} />
                    </div>
                </div>

                {/* Linked Tooltip */}
                {linkedIdentity && isHovered && (
                     <motion.div 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute bottom-full left-0 right-0 bg-zinc-900/95 backdrop-blur-xl p-3 border-t border-white/20 text-[10px] font-mono text-zinc-300 z-20 shadow-2xl"
                     >
                         <div className="font-bold text-white mb-1">LINKED: {linkedIdentity.name}</div>
                         <div className="truncate opacity-70">{linkedIdentity.note || 'NO_CONTEXT'}</div>
                     </motion.div>
                )}

                {/* Note */}
                <textarea 
                    value={data.note || ''}
                    onChange={(e) => onUpdate(data.id, { note: e.target.value })}
                    placeholder="ADD FIELD NOTES..."
                    className="w-full bg-transparent border-b border-white/10 text-sm font-medium text-white placeholder-zinc-700 focus:outline-none focus:border-white resize-none h-8 focus:h-24 transition-all py-2"
                />

                {/* Quick Categorization Chips */}
                <div className="flex flex-wrap gap-2 pt-2">
                    {CATEGORIES.filter(c => c !== 'ALL').map(cat => (
                        <button 
                            key={cat}
                            onClick={() => onUpdate(data.id, { category: cat as any })}
                            className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase border transition-colors ${
                                data.category === cat 
                                ? 'bg-white text-black border-white' 
                                : 'bg-transparent text-zinc-600 border-zinc-800 hover:text-white hover:border-zinc-600'
                            }`}
                        >
                            {cat.split('_')[0]}
                        </button>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

export default TheObserver;
