

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '../lib/constants';
import { useSound } from '../lib/sound';
import { useNotification } from './NotificationProvider';

// --- Types & Constants ---
const DB_NAME = 'NexusVaultDB';
const STORE_NAME = 'files';

interface VaultFile {
    id: string;
    name: string;
    size: number;
    type: string;
    data: Blob;
    timestamp: number;
}

type ToolType = 'SELECT' | 'RAZOR' | 'TEXT' | 'HAND' | 'WAND';
type PanelTab = 'PROPERTIES' | 'COLOR' | 'NEURAL' | 'EXPORT';

// --- Database Logic ---
const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 2);
        request.onupgradeneeded = (event) => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

const getFilesFromDB = async (): Promise<VaultFile[]> => {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    } catch (e) {
        console.error("DB Error", e);
        return [];
    }
};

// --- Sub Components (Moved to top to prevent used-before-declaration issues) ---

const ToolButton = ({ icon: Icon, active, onClick, tooltip }: any) => (
    <button 
        onClick={onClick}
        title={tooltip}
        className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-zinc-400 hover:text-white hover:bg-white/10'}`}
    >
        <Icon width={16} height={16} />
    </button>
);

const IconButton = ({ icon: Icon }: any) => (
    <button className="w-8 h-8 flex items-center justify-center rounded text-zinc-400 hover:text-white hover:bg-white/10 transition-colors">
        <Icon width={14} height={14} />
    </button>
);

const TabButton = ({ label, active, onClick }: any) => (
    <button 
        onClick={onClick}
        className={`flex-1 py-3 text-[9px] font-bold uppercase tracking-widest border-b-2 transition-colors ${active ? 'border-blue-500 text-white bg-white/5' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
    >
        {label}
    </button>
);

const Label = ({ children }: { children?: React.ReactNode }) => (
    <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 border-b border-white/5 pb-1 mb-2">{children}</h4>
);

const NumberInput = ({ label, value, unit }: any) => (
    <div className="bg-black/40 border border-white/10 rounded px-2 py-1 flex justify-between items-center group hover:border-white/20 transition-colors">
        <span className="text-[9px] text-zinc-500 font-bold uppercase">{label}</span>
        <span className="text-[10px] font-mono text-white group-hover:text-blue-400 cursor-ew-resize">{value}{unit}</span>
    </div>
);

const Slider = ({ label, value, min, max, onChange }: any) => (
    <div>
        {label && (
            <div className="flex justify-between mb-1.5">
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">{label}</span>
                <span className="text-[9px] font-mono text-zinc-500">{value}</span>
            </div>
        )}
        <input 
            type="range" 
            min={min} 
            max={max} 
            value={value} 
            onChange={(e) => onChange && onChange(Number(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
        />
    </div>
);

const NeuralButton = ({ label, icon, onClick }: any) => (
    <button 
        onClick={onClick}
        className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg flex items-center justify-between px-4 group transition-all"
    >
        <div className="flex items-center gap-3">
            <div className="text-zinc-500 group-hover:text-blue-400 transition-colors">{icon}</div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 group-hover:text-white">{label}</span>
        </div>
        <Icons.ArrowRight width={12} className="text-zinc-600 group-hover:text-white transition-colors" />
    </button>
);

const NexusStudio: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
    const [assets, setAssets] = useState<VaultFile[]>([]);
    const [activeFile, setActiveFile] = useState<VaultFile | null>(null);
    const [activeTool, setActiveTool] = useState<ToolType>('SELECT');
    const [activeTab, setActiveTab] = useState<PanelTab>('PROPERTIES');
    
    // Timeline State
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [zoomLevel, setZoomLevel] = useState(1);
    
    // Media State
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const [volume, setVolume] = useState(1);
    
    // Image State
    const [imgAdjustments, setImgAdjustments] = useState({
        brightness: 100, contrast: 100, saturate: 100, hue: 0, blur: 0
    });

    const { playClick, playDing, playWhoosh, playTick } = useSound();
    const { showNotification } = useNotification();

    // Init
    useEffect(() => {
        loadAssets();
    }, []);

    const loadAssets = async () => {
        const files = await getFilesFromDB();
        setAssets(files.sort((a, b) => b.timestamp - a.timestamp));
    };

    const handleFileSelect = (file: VaultFile) => {
        setActiveFile(file);
        setCurrentTime(0);
        setIsPlaying(false);
        playClick();
        
        // Auto-switch tabs based on type
        if (file.type.startsWith('image/')) setActiveTab('COLOR');
        else setActiveTab('PROPERTIES');
    };

    const togglePlayback = () => {
        if (videoRef.current) {
            if (videoRef.current.paused) {
                videoRef.current.play();
                setIsPlaying(true);
            } else {
                videoRef.current.pause();
                setIsPlaying(false);
            }
        } else if (audioRef.current) {
             if (audioRef.current.paused) {
                audioRef.current.play();
                setIsPlaying(true);
            } else {
                audioRef.current.pause();
                setIsPlaying(false);
            }
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
            setDuration(videoRef.current.duration || 0);
        } else if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            setDuration(audioRef.current.duration || 0);
        }
    };

    const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percent = Math.max(0, Math.min(1, x / rect.width));
        const newTime = percent * duration;
        
        if (videoRef.current) videoRef.current.currentTime = newTime;
        if (audioRef.current) audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
    };

    // --- AI Simulation ---
    const runNeuralTask = (task: string) => {
        playWhoosh();
        showNotification(`Initializing ${task}...`, 'info');
        setTimeout(() => {
            playDing();
            showNotification(`${task} Completed`, 'success');
        }, 2000);
    };

    return (
        <div className="fixed inset-0 z-[50] flex flex-col bg-[#050505] text-white font-sans overflow-hidden select-none">
            
            {/* 1. TOP BAR (Tools & Transport) */}
            <div className="h-12 border-b border-white/5 bg-[#0a0a0a] flex items-center justify-between px-4 shrink-0 z-50">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-white/40 hover:text-white transition-colors cursor-pointer" onClick={onClose}>
                        <Icons.Close width={16} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Exit Studio</span>
                    </div>
                    <div className="h-4 w-px bg-white/10" />
                    {/* Tool Palette */}
                    <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
                        <ToolButton icon={Icons.Move} active={activeTool === 'SELECT'} onClick={() => setActiveTool('SELECT')} tooltip="Select (V)" />
                        <ToolButton icon={Icons.Scissors} active={activeTool === 'RAZOR'} onClick={() => setActiveTool('RAZOR')} tooltip="Razor (C)" />
                        <ToolButton icon={Icons.Type} active={activeTool === 'TEXT'} onClick={() => setActiveTool('TEXT')} tooltip="Text (T)" />
                        <ToolButton icon={Icons.Wand} active={activeTool === 'WAND'} onClick={() => setActiveTool('WAND')} tooltip="Magic Wand (W)" />
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="font-mono text-xs text-blue-400 font-bold tracking-widest bg-blue-500/10 px-3 py-1 rounded border border-blue-500/20">
                        {new Date(currentTime * 1000).toISOString().substr(11, 8)}:{(Math.floor((currentTime % 1) * 30)).toString().padStart(2, '0')}
                    </div>
                    <div className="flex gap-1">
                        <IconButton icon={Icons.Undo} />
                        <IconButton icon={Icons.Redo} />
                    </div>
                    <button className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-[10px] font-bold uppercase tracking-widest rounded transition-colors">Export</button>
                </div>
            </div>

            {/* 2. MAIN WORKSPACE */}
            <div className="flex-1 flex min-h-0">
                
                {/* LEFT: VAULT */}
                <div className="w-64 border-r border-white/5 bg-[#080808] flex flex-col shrink-0">
                    <div className="p-3 border-b border-white/5 flex justify-between items-center">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Project Bin</span>
                        <Icons.Plus width={14} className="text-zinc-500 hover:text-white cursor-pointer" />
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 no-scrollbar">
                        {assets.map(file => (
                            <div 
                                key={file.id}
                                onClick={() => handleFileSelect(file)}
                                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all group border ${activeFile?.id === file.id ? 'bg-white/10 border-white/20' : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/5'}`}
                            >
                                <div className="w-8 h-8 rounded bg-black/50 border border-white/10 flex items-center justify-center overflow-hidden">
                                    {file.type.startsWith('image/') ? (
                                        <img src={URL.createObjectURL(file.data)} className="w-full h-full object-cover opacity-70 group-hover:opacity-100" />
                                    ) : file.type.startsWith('video/') ? (
                                        <Icons.Film width={12} className="text-blue-400" />
                                    ) : (
                                        <Icons.Music width={12} className="text-green-400" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <div className={`text-[10px] font-bold truncate ${activeFile?.id === file.id ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`}>{file.name}</div>
                                    <div className="text-[9px] text-zinc-600 font-mono">{file.type.split('/')[1].toUpperCase()}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CENTER: STAGE & TIMELINE */}
                <div className="flex-1 flex flex-col min-w-0 bg-[#050505]">
                    
                    {/* STAGE (Viewport) */}
                    <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-opacity-5">
                        {/* Checkerboard Pattern for transparency */}
                        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(45deg, #222 25%, transparent 25%), linear-gradient(-45deg, #222 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #222 75%), linear-gradient(-45deg, transparent 75%, #222 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px' }} />
                        
                        {activeFile ? (
                            <div className="relative shadow-2xl group">
                                {activeFile.type.startsWith('image/') ? (
                                    <img 
                                        src={URL.createObjectURL(activeFile.data)} 
                                        className="max-w-[90%] max-h-[60vh] object-contain border border-white/5"
                                        style={{
                                            filter: `brightness(${imgAdjustments.brightness}%) contrast(${imgAdjustments.contrast}%) saturate(${imgAdjustments.saturate}%) hue-rotate(${imgAdjustments.hue}deg) blur(${imgAdjustments.blur}px)`
                                        }}
                                    />
                                ) : activeFile.type.startsWith('video/') ? (
                                    <video 
                                        ref={videoRef}
                                        src={URL.createObjectURL(activeFile.data)}
                                        className="max-w-[90%] max-h-[60vh] border border-white/5"
                                        onTimeUpdate={handleTimeUpdate}
                                        onClick={togglePlayback}
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-4">
                                        <audio ref={audioRef} src={URL.createObjectURL(activeFile.data)} onTimeUpdate={handleTimeUpdate} />
                                        <div className="w-64 h-64 border border-green-500/20 bg-green-500/5 rounded-full flex items-center justify-center animate-pulse">
                                            <Icons.Music width={64} className="text-green-500" />
                                        </div>
                                        <span className="text-xs font-mono text-green-500 tracking-widest">AUDIO VISUALIZER ACTIVE</span>
                                    </div>
                                )}
                                
                                {/* Overlay Controls */}
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="bg-black/60 backdrop-blur text-[10px] font-bold px-2 py-1 rounded border border-white/10">100%</div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-zinc-700 flex flex-col items-center gap-4">
                                <Icons.Layout width={48} className="opacity-20" />
                                <span className="text-xs font-bold uppercase tracking-widest">No Media Loaded</span>
                            </div>
                        )}
                    </div>

                    {/* TIMELINE (Bottom Panel) */}
                    <div className="h-64 bg-[#0a0a0a] border-t border-white/5 flex flex-col shrink-0">
                        {/* Timeline Header */}
                        <div className="h-8 border-b border-white/5 flex items-center justify-between px-4 bg-[#0e0e0e]">
                            <div className="flex gap-4">
                                <button onClick={togglePlayback} className="text-white hover:text-blue-400 transition-colors">
                                    {isPlaying ? <Icons.Pause width={14} /> : <Icons.Play width={14} />}
                                </button>
                                <span className="text-[10px] font-mono text-zinc-500 mt-0.5">{duration.toFixed(2)}s Duration</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Icons.Minus width={12} className="text-zinc-600 cursor-pointer" onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))} />
                                <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500" style={{ width: `${zoomLevel * 100}%` }} />
                                </div>
                                <Icons.Plus width={12} className="text-zinc-600 cursor-pointer" onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.1))} />
                            </div>
                        </div>

                        {/* Tracks Area */}
                        <div className="flex-1 relative overflow-hidden" onMouseDown={handleScrub}>
                            {/* Time Ruler */}
                            <div className="h-6 border-b border-white/5 flex items-end px-2 select-none">
                                {Array.from({ length: 20 }).map((_, i) => (
                                    <div key={i} className="flex-1 border-l border-white/5 text-[9px] font-mono text-zinc-600 pl-1 h-3">
                                        {i * 5}:00
                                    </div>
                                ))}
                            </div>

                            {/* Playhead */}
                            <div 
                                className="absolute top-0 bottom-0 w-px bg-red-500 z-20 pointer-events-none"
                                style={{ left: `${(currentTime / (duration || 1)) * 100}%` }}
                            >
                                <div className="absolute top-0 -translate-x-1/2 -mt-1 w-3 h-3 bg-red-500 rotate-45 transform" />
                            </div>

                            {/* Track V1 */}
                            <div className="h-16 border-b border-white/5 relative bg-[#0c0c0c] flex items-center px-4 group">
                                <div className="absolute left-0 top-0 bottom-0 w-24 border-r border-white/5 bg-[#111] flex items-center justify-center text-[10px] font-bold text-zinc-500 z-10">V1</div>
                                <div className="pl-24 w-full h-full flex items-center p-1">
                                    {activeFile && (activeFile.type.startsWith('video/') || activeFile.type.startsWith('image/')) && (
                                        <div className="h-full w-full bg-blue-500/10 border border-blue-500/30 rounded flex items-center justify-center overflow-hidden relative">
                                            <div className="absolute inset-0 flex items-center justify-around opacity-20">
                                                {Array.from({length: 10}).map((_,i) => <div key={i} className="w-16 h-10 bg-white/10" />)}
                                            </div>
                                            <span className="text-[10px] font-bold text-blue-400 truncate px-2 relative z-10">{activeFile.name}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Track A1 */}
                            <div className="h-16 border-b border-white/5 relative bg-[#0c0c0c] flex items-center px-4 group">
                                <div className="absolute left-0 top-0 bottom-0 w-24 border-r border-white/5 bg-[#111] flex items-center justify-center text-[10px] font-bold text-zinc-500 z-10">A1</div>
                                <div className="pl-24 w-full h-full flex items-center p-1">
                                    {activeFile && (activeFile.type.startsWith('video/') || activeFile.type.startsWith('audio/')) && (
                                        <div className="h-full w-full bg-green-500/10 border border-green-500/30 rounded flex items-center overflow-hidden relative">
                                            {/* Fake Waveform */}
                                            <div className="flex items-center gap-px h-full w-full opacity-50 px-1">
                                                {Array.from({ length: 100 }).map((_, i) => (
                                                    <div 
                                                        key={i} 
                                                        className="flex-1 bg-green-500" 
                                                        style={{ height: `${Math.random() * 100}%` }} 
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: INSPECTOR */}
                <div className="w-72 border-l border-white/5 bg-[#080808] flex flex-col shrink-0">
                    <div className="flex border-b border-white/5">
                        <TabButton label="Props" active={activeTab === 'PROPERTIES'} onClick={() => setActiveTab('PROPERTIES')} />
                        <TabButton label="Color" active={activeTab === 'COLOR'} onClick={() => setActiveTab('COLOR')} />
                        <TabButton label="Neural" active={activeTab === 'NEURAL'} onClick={() => setActiveTab('NEURAL')} />
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
                        {activeFile ? (
                            <>
                                {activeTab === 'PROPERTIES' && (
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <Label>File Metadata</Label>
                                            <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-400 font-mono bg-white/5 p-2 rounded">
                                                <span>RES:</span> <span className="text-right text-white">1920x1080</span>
                                                <span>SIZE:</span> <span className="text-right text-white">{(activeFile.size / 1024 / 1024).toFixed(2)} MB</span>
                                                <span>FPS:</span> <span className="text-right text-white">60.00</span>
                                                <span>CODEC:</span> <span className="text-right text-white">H.264</span>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            <Label>Transform</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <NumberInput label="Pos X" value={960} />
                                                <NumberInput label="Pos Y" value={540} />
                                                <NumberInput label="Scale" value={100} unit="%" />
                                                <NumberInput label="Rot" value={0} unit="°" />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <Label>Opacity</Label>
                                            <Slider value={100} min={0} max={100} />
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'COLOR' && (
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <Label>Exposure / Contrast</Label>
                                            <Slider label="Exposure" value={imgAdjustments.brightness} min={0} max={200} onChange={(v) => setImgAdjustments({...imgAdjustments, brightness: v})} />
                                            <Slider label="Contrast" value={imgAdjustments.contrast} min={0} max={200} onChange={(v) => setImgAdjustments({...imgAdjustments, contrast: v})} />
                                        </div>
                                        <div className="space-y-4">
                                            <Label>HSL</Label>
                                            <Slider label="Saturation" value={imgAdjustments.saturate} min={0} max={200} onChange={(v) => setImgAdjustments({...imgAdjustments, saturate: v})} />
                                            <Slider label="Hue Shift" value={imgAdjustments.hue} min={0} max={360} onChange={(v) => setImgAdjustments({...imgAdjustments, hue: v})} />
                                        </div>
                                        <div className="space-y-4">
                                            <Label>Effects</Label>
                                            <Slider label="Gaussian Blur" value={imgAdjustments.blur} min={0} max={20} onChange={(v) => setImgAdjustments({...imgAdjustments, blur: v})} />
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'NEURAL' && (
                                    <div className="space-y-4">
                                        <div className="p-3 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-mono mb-4">
                                            NEURAL ENGINE READY. GPU ACCELERATION ACTIVE.
                                        </div>
                                        <NeuralButton label="Remove Background" icon={<Icons.Scan width={14} />} onClick={() => runNeuralTask('Background Removal')} />
                                        <NeuralButton label="Upscale 4X" icon={<Icons.ArrowDown className="rotate-180" width={14} />} onClick={() => runNeuralTask('Super Resolution')} />
                                        <NeuralButton label="Auto-Caption" icon={<Icons.Type width={14} />} onClick={() => runNeuralTask('Speech Transcription')} />
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-zinc-600 text-[10px] text-center font-bold uppercase tracking-widest mt-10">
                                Select an Asset to Inspect
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NexusStudio;
