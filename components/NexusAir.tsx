
import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '../lib/constants';
import { useSound } from '../lib/sound';
import { useNotification } from './NotificationProvider';
import { useNexusFiles } from '../lib/hooks';
import { NexusFile } from '../lib/supabase';

// --- Helpers ---
type FileType = 'IMAGE' | 'DOC' | 'MEDIA' | 'ARCHIVE' | 'UNKNOWN';

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

interface NexusAirProps {
    onClose?: () => void;
}

const NexusAir = ({ onClose }: NexusAirProps) => {
    const { files, uploading, uploadFile, deleteFile } = useNexusFiles();
    const [expandedStack, setExpandedStack] = useState<FileType | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [previewFile, setPreviewFile] = useState<NexusFile | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { playClick, playDing, playPop } = useSound();
    const { showNotification } = useNotification();

    const handleFileUpload = async (file: File) => {
        try {
            await uploadFile(file);
            playDing();
            showNotification('Secured in Air Vault', 'success');
        } catch (e) {
            showNotification('Upload Failed', 'reminder');
        }
    };

    const handleDeleteFile = async (id: string, path: string) => {
        if (window.confirm('Permanently erase this file from cloud storage?')) {
            await deleteFile(id, path);
            setPreviewFile(null);
            playPop();
            showNotification('File Erased', 'reminder');
        }
    };

    const stacks = useMemo(() => {
        const groups: Record<string, NexusFile[]> = {
            'IMAGE': [], 'DOC': [], 'MEDIA': [], 'ARCHIVE': [], 'UNKNOWN': []
        };
        files.forEach(f => {
            const type = getFileType(f.type);
            if (groups[type]) groups[type].push(f);
            else groups['UNKNOWN'].push(f);
        });
        return groups;
    }, [files]);

    const totalSize = files.reduce((acc, f) => acc + f.size, 0);
    const maxCapacity = 5 * 1024 * 1024 * 1024; // 5GB Limit for Pro
    const usagePercent = Math.min((totalSize / maxCapacity) * 100, 100);

    return (
        <div className="fixed inset-0 z-0 flex flex-col font-sans text-white overflow-hidden bg-[#030303]">
            {/* Ultra-Minimal Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] to-black z-0 pointer-events-none" />
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent z-20" />

            <div 
                className="w-full h-full relative pointer-events-auto z-10 pt-24 lg:pt-32 px-8 lg:px-16 max-w-[1600px] mx-auto flex flex-col"
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); e.dataTransfer.files?.[0] && handleFileUpload(e.dataTransfer.files[0]); }}
            >
                {/* Content Wrapper */}
                <motion.div 
                    className="flex flex-col h-full"
                    animate={{ 
                        scale: isDragging ? 0.96 : 1, 
                        opacity: isDragging ? 0.4 : 1,
                        filter: isDragging ? 'blur(4px)' : 'blur(0px)'
                    }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                >
                    {/* --- TOP NAV: Header & Categories --- */}
                    <div className="flex flex-col gap-10 mb-8 shrink-0">
                        <div className="flex items-end justify-between border-b border-white/[0.04] pb-6">
                            <div>
                                <h1 className="text-3xl font-light tracking-tight text-white mb-1">Nexus Air</h1>
                                <p className="text-xs text-white/30 font-medium tracking-[0.2em] uppercase">Supabase Cloud System</p>
                            </div>
                            
                            {/* Storage Pill */}
                            <div className="flex flex-col items-end gap-2">
                                <span className="text-[10px] font-bold text-white/20 tracking-widest">{formatSize(totalSize)} / 5 GB</span>
                                <div className="w-32 h-0.5 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }} 
                                        animate={{ width: `${usagePercent}%` }}
                                        className={`h-full ${uploading ? 'bg-blue-500 animate-pulse' : 'bg-white/50'}`}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Horizontal Category Row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <CategoryCard 
                                type="IMAGE" 
                                count={stacks['IMAGE'].length} 
                                active={expandedStack === 'IMAGE'}
                                onClick={() => { setExpandedStack(expandedStack === 'IMAGE' ? null : 'IMAGE'); playClick(); }} 
                            />
                            <CategoryCard 
                                type="DOC" 
                                count={stacks['DOC'].length} 
                                active={expandedStack === 'DOC'}
                                onClick={() => { setExpandedStack(expandedStack === 'DOC' ? null : 'DOC'); playClick(); }} 
                            />
                            <CategoryCard 
                                type="MEDIA" 
                                count={stacks['MEDIA'].length} 
                                active={expandedStack === 'MEDIA'}
                                onClick={() => { setExpandedStack(expandedStack === 'MEDIA' ? null : 'MEDIA'); playClick(); }} 
                            />
                            <CategoryCard 
                                type="ARCHIVE" 
                                count={stacks['ARCHIVE'].length} 
                                active={expandedStack === 'ARCHIVE'}
                                onClick={() => { setExpandedStack(expandedStack === 'ARCHIVE' ? null : 'ARCHIVE'); playClick(); }} 
                            />
                        </div>
                    </div>

                    {/* --- CENTER: Content or Drop Zone --- */}
                    <div className="flex-1 relative min-h-0">
                        <AnimatePresence mode="wait">
                            {expandedStack ? (
                                <motion.div
                                    key="grid"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                    className="h-full overflow-y-auto no-scrollbar pb-32"
                                >
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                                        {/* Upload Button */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                            className="aspect-[4/5] rounded-[20px] border border-dashed border-white/10 flex flex-col items-center justify-center gap-4 hover:bg-white/[0.02] hover:border-white/20 transition-all duration-200 group"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/30 group-hover:text-white group-hover:bg-white/10 transition-colors">
                                                {uploading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Icons.Plus width={20} />}
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">{uploading ? 'Uplink...' : 'Upload'}</span>
                                        </button>

                                        {/* Files */}
                                        {stacks[expandedStack].map((file) => (
                                            <FileNode 
                                                key={file.id} 
                                                file={file} 
                                                onClick={() => { setPreviewFile(file); playPop(); }} 
                                            />
                                        ))}
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="empty"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 flex flex-col items-center justify-center text-white/10 pointer-events-none select-none pb-20"
                                >
                                    <div className="w-64 h-64 rounded-full bg-white/[0.01] flex items-center justify-center blur-3xl" />
                                    <div className="relative z-10 flex flex-col items-center gap-6">
                                        <Icons.CloudUpload width={64} height={64} strokeWidth={0.5} />
                                        <h2 className="text-2xl font-light tracking-tight text-white/20">Drop Data Stream</h2>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* --- DRAG OVERLAY --- */}
                <AnimatePresence>
                    {isDragging && (
                        <div className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none">
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                className="w-[90%] h-[80%] border-4 border-dashed border-sky-500/50 bg-sky-500/10 rounded-[3rem] flex flex-col items-center justify-center gap-8 backdrop-blur-sm"
                            >
                                <motion.div
                                    animate={{ y: [0, -15, 0], scale: [1, 1.1, 1] }}
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                    className="p-8 bg-sky-500 rounded-full text-black shadow-[0_0_50px_rgba(14,165,233,0.6)]"
                                >
                                    <Icons.CloudUpload width={64} height={64} strokeWidth={2} />
                                </motion.div>
                                <h2 className="text-3xl font-bold tracking-[0.2em] text-white uppercase">Initialize Uplink</h2>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* --- PREVIEW MODAL --- */}
                <AnimatePresence>
                    {previewFile && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-[200] bg-black/90 backdrop-blur-[50px] flex items-center justify-center p-8 lg:p-24"
                            onClick={() => setPreviewFile(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.95 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.95 }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full max-w-5xl h-full bg-[#080808] border border-white/10 rounded-[32px] overflow-hidden flex flex-col md:flex-row relative shadow-2xl"
                            >
                                <button onClick={() => setPreviewFile(null)} className="absolute top-6 left-6 z-20 p-2 text-white/50 hover:text-white transition-colors">
                                    <Icons.Close width={24} />
                                </button>

                                <div className="flex-1 flex items-center justify-center bg-[#050505] relative p-8">
                                    {previewFile.type.startsWith('image/') ? (
                                        <img src={previewFile.url} className="max-h-full max-w-full object-contain rounded-lg shadow-2xl" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-4 text-white/20">
                                            <Icons.FileText width={100} strokeWidth={0.5} />
                                            <span className="font-mono text-xs">PREVIEW UNAVAILABLE</span>
                                        </div>
                                    )}
                                </div>

                                <div className="w-full md:w-[320px] bg-[#0a0a0a] border-l border-white/5 p-8 flex flex-col justify-between">
                                    <div>
                                        <h2 className="text-xl font-medium text-white mb-6 break-all leading-snug">{previewFile.name}</h2>
                                        <div className="space-y-6">
                                            <MetaRow label="Type" value={previewFile.type.split('/')[1]?.toUpperCase() || 'FILE'} />
                                            <MetaRow label="Size" value={formatSize(previewFile.size)} />
                                            <MetaRow label="Created" value={new Date(previewFile.created_at).toLocaleDateString()} />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <a href={previewFile.url} download target="_blank" rel="noreferrer" className="block w-full py-3 bg-white text-black rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors text-center">Download</a>
                                        <button onClick={() => handleDeleteFile(previewFile.id, previewFile.storage_path)} className="w-full py-3 bg-red-500/10 text-red-500 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-500/20 transition-colors">Delete</button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
            </div>
        </div>
    );
};

const CategoryCard = ({ type, count, active, onClick }: { type: string, count: number, active: boolean, onClick: () => void }) => {
    let Icon = Icons.File;
    let label = 'Files';

    if (type === 'IMAGE') { Icon = Icons.Image; label = 'Images'; }
    if (type === 'DOC') { Icon = Icons.FileText; label = 'Documents'; }
    if (type === 'MEDIA') { Icon = Icons.Film; label = 'Media'; }
    if (type === 'ARCHIVE') { Icon = Icons.Archive; label = 'Archives'; }

    return (
        <button
            onClick={onClick}
            className={`
                relative h-[120px] w-full rounded-[24px] p-6 flex flex-col justify-between items-start transition-all duration-200 group
                border-b-2
                ${active 
                    ? 'bg-white/[0.05] border-white backdrop-blur-2xl' 
                    : 'bg-white/[0.01] border-white/5 hover:bg-white/[0.03] hover:border-white/20 backdrop-blur-[40px]'}
            `}
        >
            <Icon width={24} strokeWidth={1.5} className={active ? 'text-white' : 'text-white/40 group-hover:text-white/80 transition-colors'} />
            
            <div className="flex flex-col items-start gap-1">
                <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${active ? 'text-white/60' : 'text-white/20'}`}>
                    {label}
                </span>
                <span className={`text-2xl font-light tracking-tight ${active ? 'text-white' : 'text-white/80'}`}>
                    {count}
                </span>
            </div>
        </button>
    );
};

const FileNode: React.FC<{ file: NexusFile, onClick: () => void }> = ({ file, onClick }) => {
    const isImage = file.type.startsWith('image/');
    
    return (
        <div
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className="flex flex-col gap-3 cursor-pointer group will-change-transform transition-transform duration-200 hover:scale-[1.02]"
        >
            <div className="aspect-[4/5] w-full rounded-[20px] bg-white/[0.02] border border-white/5 overflow-hidden relative group-hover:border-white/20 transition-colors">
                {isImage ? (
                    <img src={file.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300" loading="lazy" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/10 group-hover:text-white/40 transition-colors">
                        <Icons.FileText width={40} strokeWidth={1} />
                    </div>
                )}
                
                {/* Minimal Hover Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <div className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
                        <span className="text-[9px] font-bold text-white uppercase tracking-widest">{formatSize(file.size)}</span>
                    </div>
                </div>
            </div>
            <span className="text-[10px] font-medium text-white/30 truncate w-full text-center group-hover:text-white/80 transition-colors tracking-wide">{file.name}</span>
        </div>
    );
};

const MetaRow = ({ label, value }: { label: string, value: string }) => (
    <div className="flex justify-between items-center text-xs border-b border-white/5 pb-3">
        <span className="text-white/30 font-medium uppercase tracking-widest text-[9px]">{label}</span>
        <span className="text-white/80 font-light tracking-wide">{value}</span>
    </div>
);

export default NexusAir;
