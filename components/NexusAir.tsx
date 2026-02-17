
import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Icons } from '../lib/constants';
import { useSound } from '../lib/sound';
import { useNotification } from './NotificationProvider';
import { useNexusFiles } from '../lib/hooks';
import { NexusFile } from '../lib/supabase';

// --- Types ---
type FileType = 'IMAGE' | 'DOC' | 'MEDIA' | 'ARCHIVE' | 'UNKNOWN';

// --- Helpers ---
const getFileType = (mime: string): FileType => {
    if (!mime) return 'UNKNOWN';
    if (mime.startsWith('image/')) return 'IMAGE';
    if (mime.startsWith('video/') || mime.startsWith('audio/')) return 'MEDIA';
    if (mime.includes('pdf') || mime.includes('text') || mime.includes('document')) return 'DOC';
    if (mime.includes('zip') || mime.includes('compressed')) return 'ARCHIVE';
    return 'UNKNOWN';
};

const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// --- Animations ---
const containerVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
        opacity: 1, 
        scale: 1,
        transition: { 
            duration: 0.4, 
            ease: [0.22, 1, 0.36, 1] as const,
            staggerChildren: 0.05 
        }
    },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

const floatingAnimation = {
    y: [0, -8, 0],
    transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut" as const
    }
};

interface NexusAirProps {
    onClose?: () => void;
}

const NexusAir = ({ onClose }: NexusAirProps) => {
    const { files, uploading, uploadFile, deleteFile } = useNexusFiles();
    const [activeCategory, setActiveCategory] = useState<FileType | 'ALL'>('ALL');
    const [isDragging, setIsDragging] = useState(false);
    const [previewFile, setPreviewFile] = useState<NexusFile | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { playClick, playDing, playWhoosh } = useSound();
    const { showNotification } = useNotification();

    const handleFileUpload = async (file: File) => {
        playWhoosh();
        try {
            await uploadFile(file);
            playDing();
            showNotification('Data Stream Secured', 'success');
        } catch (e) {
            showNotification('Uplink Failed', 'reminder');
        }
    };

    const handleDeleteFile = async (id: string, path: string) => {
        if (window.confirm('Purge this data packet permanently?')) {
            await deleteFile(id, path);
            setPreviewFile(null);
            showNotification('Data Purged', 'reminder');
        }
    };

    const categoryCounts = useMemo(() => {
        const counts = { 'ALL': 0, 'IMAGE': 0, 'DOC': 0, 'MEDIA': 0, 'ARCHIVE': 0, 'UNKNOWN': 0 };
        files.forEach(f => {
            counts['ALL']++;
            const type = getFileType(f.type);
            if (counts[type] !== undefined) counts[type]++;
            else counts['UNKNOWN']++;
        });
        return counts;
    }, [files]);

    const filteredFiles = useMemo(() => {
        let result = files;
        if (activeCategory !== 'ALL') {
            result = files.filter(f => getFileType(f.type) === activeCategory);
        }
        return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }, [files, activeCategory]);

    const totalSize = files.reduce((acc, f) => acc + f.size, 0);

    return (
        <motion.div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-8 font-sans perspective-1000"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-[#000000]/80 backdrop-blur-xl transition-all duration-500" onClick={onClose} />
            
            {/* Main Floating Container */}
            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="w-full max-w-[1200px] h-full max-h-[85vh] relative z-10 flex flex-col overflow-hidden rounded-[2.5rem] shadow-[0_0_100px_rgba(99,102,241,0.1)] border border-white/5"
                style={{ 
                    background: 'linear-gradient(180deg, rgba(2,6,23,0.95) 0%, rgba(2,6,23,0.98) 100%)',
                }}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); e.dataTransfer.files?.[0] && handleFileUpload(e.dataTransfer.files[0]); }}
            >
                {/* Ambient Light Effects */}
                <motion.div animate={floatingAnimation} className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-900/10 blur-[120px] rounded-full mix-blend-screen" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-violet-900/10 blur-[100px] rounded-full mix-blend-screen" />
                </motion.div>

                {/* Noise Texture */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay" />

                {/* Header */}
                <div className="px-10 py-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01] backdrop-blur-md shrink-0 relative z-20">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-gradient-to-tr from-indigo-600/20 to-violet-500/20 rounded-2xl flex items-center justify-center border border-white/10 shadow-[0_0_30px_rgba(99,102,241,0.15)] group">
                            <Icons.AirPlay width={28} height={28} className="text-white group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">Nexus Air</h1>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse shadow-[0_0_8px_#818cf8]" />
                                <span className="text-[10px] text-indigo-400/80 font-bold tracking-[0.2em] uppercase">Cloud_Sync v4.0</span>
                                <span className="text-[10px] text-white/20 font-mono tracking-widest">• {formatSize(totalSize)} USED</span>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all active:scale-90 border border-white/5"
                    >
                        <Icons.Close width={20} height={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
                    
                    {/* Categories */}
                    <div className="px-10 pt-8 grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
                        <CategoryCard 
                            label="Images" 
                            sub="Visual Assets"
                            count={categoryCounts['IMAGE']} 
                            icon={Icons.Image} 
                            active={activeCategory === 'IMAGE'} 
                            onClick={() => setActiveCategory(activeCategory === 'IMAGE' ? 'ALL' : 'IMAGE')}
                            color="from-indigo-500 to-violet-500"
                        />
                        <CategoryCard 
                            label="Docs" 
                            sub="Text Data"
                            count={categoryCounts['DOC']} 
                            icon={Icons.FileText} 
                            active={activeCategory === 'DOC'} 
                            onClick={() => setActiveCategory(activeCategory === 'DOC' ? 'ALL' : 'DOC')}
                            color="from-blue-500 to-indigo-500"
                        />
                        <CategoryCard 
                            label="Media" 
                            sub="Audio / Video"
                            count={categoryCounts['MEDIA']} 
                            icon={Icons.Film} 
                            active={activeCategory === 'MEDIA'} 
                            onClick={() => setActiveCategory(activeCategory === 'MEDIA' ? 'ALL' : 'MEDIA')}
                            color="from-fuchsia-500 to-pink-500"
                        />
                        <CategoryCard 
                            label="Archives" 
                            sub="Compressed"
                            count={categoryCounts['ARCHIVE']} 
                            icon={Icons.Archive} 
                            active={activeCategory === 'ARCHIVE'} 
                            onClick={() => setActiveCategory(activeCategory === 'ARCHIVE' ? 'ALL' : 'ARCHIVE')}
                            color="from-amber-500 to-orange-500"
                        />
                    </div>

                    {/* Files Grid */}
                    <div className="flex-1 overflow-y-auto p-10 no-scrollbar pb-32">
                        <motion.div 
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
                        >
                            <AnimatePresence mode="popLayout">
                                {filteredFiles.length > 0 ? (
                                    filteredFiles.map((file) => (
                                        <FileCard 
                                            key={file.id} 
                                            file={file} 
                                            onClick={() => setPreviewFile(file)} 
                                        />
                                    ))
                                ) : (
                                    <motion.div 
                                        initial={{ opacity: 0 }} 
                                        animate={{ opacity: 1 }} 
                                        className="col-span-full h-64 flex flex-col items-center justify-center text-white/20"
                                    >
                                        <Icons.CloudUpload width={48} height={48} className="mb-4 opacity-50" />
                                        <span className="text-xs font-bold uppercase tracking-widest">Sector Empty</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </div>

                    {/* Footer Upload Zone */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#020617] via-[#020617] to-transparent z-30 pointer-events-none">
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className={`
                                pointer-events-auto h-20 rounded-[2rem] border transition-all duration-500 flex items-center justify-center gap-6 cursor-pointer group relative overflow-hidden backdrop-blur-md
                                ${isDragging 
                                    ? 'border-indigo-500 bg-indigo-500/10 scale-[1.02]' 
                                    : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20'}
                            `}
                        >
                            {/* Animated Border/Glow */}
                            {uploading && <div className="absolute inset-0 bg-indigo-500/10 animate-pulse" />}
                            
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isDragging ? 'bg-indigo-500 text-black scale-110' : 'bg-white/5 text-white/40 group-hover:text-white group-hover:scale-110'}`}>
                                {uploading ? (
                                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Icons.Plus width={20} />
                                )}
                            </div>
                            
                            <div className="flex flex-col items-start">
                                <span className={`text-sm font-bold tracking-tight transition-colors ${isDragging ? 'text-indigo-400' : 'text-white/80 group-hover:text-white'}`}>
                                    {uploading ? 'Processing Data Stream...' : (isDragging ? 'Release to Upload' : 'Initialize Upload')}
                                </span>
                                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30 group-hover:text-white/50 transition-colors">
                                    Drag & Drop or Click
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />

                {/* Preview Modal */}
                <AnimatePresence>
                    {previewFile && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 z-[60] bg-[#020617]/90 backdrop-blur-2xl flex items-center justify-center p-8 lg:p-20"
                            onClick={() => setPreviewFile(null)}
                        >
                            <motion.div 
                                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full h-full max-w-5xl bg-[#0a0a0a] rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl flex flex-col md:flex-row relative"
                            >
                                <button onClick={() => setPreviewFile(null)} className="absolute top-6 right-6 z-50 p-2 bg-black/50 hover:bg-white text-white hover:text-black rounded-full transition-all">
                                    <Icons.Close width={20} />
                                </button>

                                {/* Image/Preview Side */}
                                <div className="flex-1 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-opacity-5 flex items-center justify-center p-10 relative">
                                    {previewFile.type.startsWith('image/') ? (
                                        <img src={previewFile.url} className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-4 text-white/20">
                                            <Icons.FileText width={80} height={80} strokeWidth={1} />
                                            <span className="text-xs font-bold uppercase tracking-[0.3em]">No Preview</span>
                                        </div>
                                    )}
                                </div>

                                {/* Info Side */}
                                <div className="w-full md:w-96 bg-[#080808] border-l border-white/5 p-10 flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-2xl font-bold text-white mb-8 leading-snug break-words">{previewFile.name}</h3>
                                        <div className="space-y-6">
                                            <MetaItem label="Format" value={previewFile.type.split('/')[1]?.toUpperCase() || 'UNKNOWN'} />
                                            <MetaItem label="Size" value={formatSize(previewFile.size)} />
                                            <MetaItem label="Uploaded" value={new Date(previewFile.created_at).toLocaleDateString()} />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <a 
                                            href={previewFile.url} 
                                            download 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="w-full py-4 bg-white text-black rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Icons.Download width={14} /> Download Asset
                                        </a>
                                        <button 
                                            onClick={() => handleDeleteFile(previewFile.id, previewFile.storage_path)}
                                            className="w-full py-4 bg-red-500/5 text-red-500 border border-red-500/20 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Icons.Trash width={14} /> Purge
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
};

// --- Sub-Components ---

const CategoryCard = ({ label, sub, count, icon: Icon, active, onClick, color }: any) => {
    return (
        <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
                relative h-32 rounded-[2rem] p-6 flex flex-col justify-between transition-all duration-500 overflow-hidden group
                ${active 
                    ? 'bg-white/[0.05] border-white/20 shadow-[0_0_40px_rgba(0,0,0,0.5)]' 
                    : 'bg-transparent border border-white/5 hover:border-white/10 hover:bg-white/[0.02]'}
            `}
        >
            {active && (
                <motion.div 
                    layoutId="activeGlow"
                    className={`absolute inset-0 bg-gradient-to-br ${color} opacity-10`} 
                />
            )}
            
            <div className="flex justify-between items-start relative z-10">
                <div className={`p-2.5 rounded-xl transition-colors ${active ? 'bg-white/10 text-white' : 'bg-white/5 text-white/40 group-hover:text-white'}`}>
                    <Icon width={18} height={18} />
                </div>
                <span className={`text-3xl font-thin tracking-tighter transition-colors ${active ? 'text-white' : 'text-white/20 group-hover:text-white/40'}`}>
                    {count}
                </span>
            </div>
            
            <div className="text-left relative z-10">
                <span className={`block text-sm font-bold tracking-tight transition-colors ${active ? 'text-white' : 'text-white/60 group-hover:text-white'}`}>
                    {label}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">
                    {sub}
                </span>
            </div>
        </motion.button>
    );
};

const FileCard = ({ file, onClick }: { file: NexusFile, onClick: () => void }) => {
    const isImage = file.type.startsWith('image/');
    
    return (
        <motion.div 
            variants={itemVariants}
            onClick={onClick}
            whileHover={{ scale: 1.05, y: -5 }}
            className="group cursor-pointer relative"
        >
            {/* Main Card Body */}
            <div className="aspect-[4/5] bg-white/[0.03] border border-white/5 rounded-[1.5rem] overflow-hidden relative transition-all duration-300 group-hover:border-white/20 group-hover:bg-white/[0.05] group-hover:shadow-2xl">
                {/* Background Noise */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] pointer-events-none mix-blend-overlay" />

                {isImage ? (
                    <img src={file.url} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-all duration-500 scale-100 group-hover:scale-110" loading="lazy" />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-white/20 group-hover:text-white/60 transition-colors">
                        <div className="p-4 rounded-full border border-white/5 bg-white/[0.02]">
                            <Icons.FileText width={32} strokeWidth={1.5} />
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-white/5 bg-black/20">
                            {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                        </span>
                    </div>
                )}
                
                {/* Hover Overlay Info */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-5">
                    <p className="text-xs font-bold text-white truncate w-full mb-1">{file.name}</p>
                    
                    <div className="flex justify-between items-end">
                        <p className="text-[9px] font-mono text-indigo-400">{formatSize(file.size)}</p>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1 h-1 bg-indigo-400 rounded-full animate-pulse" />
                            <span className="text-[8px] font-bold uppercase tracking-widest text-indigo-400/80">Syncing...</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const MetaItem = ({ label, value }: { label: string, value: string }) => (
    <div className="flex justify-between items-center py-3 border-b border-white/5">
        <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">{label}</span>
        <span className="text-xs font-mono text-white/80">{value}</span>
    </div>
);

export default NexusAir;
