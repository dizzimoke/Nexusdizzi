
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '../lib/constants';
import { useSound } from '../lib/sound';

interface NexusPlayProps {
    onClose?: () => void;
}

type SectionId = 'dashboard' | 'news' | 'releases' | 'library' | 'reviews' | 'guides';

// --- MOCK DATA ---
const HERO_GAME = {
    title: "GRAND THEFT AUTO VI",
    developer: "ROCKSTAR GAMES",
    release: "FALL 2025",
    image: "https://images.unsplash.com/photo-1605901309584-818e25960b8f?q=80&w=2600&auto=format&fit=crop",
    tags: ["OPEN WORLD", "ACTION", "CRIME SIM"]
};

const NEWS_TICKER = [
    "CYBERPUNK 2077: ORION PROJECT ENTERING FULL PRODUCTION",
    "NVIDIA ANNOUNCES RTX 6090 WITH QUANTUM CORES",
    "VALVE RELEASES HALF-LIFE 3... JUST KIDDING",
    "ELDER SCROLLS VI LOCATION CONFIRMED: HAMMERFELL"
];

const LATEST_HEADLINES = [
    { id: 1, title: "Starfield: Shattered Space DLC Review", source: "IGN", time: "2H AGO", color: "text-amber-400" },
    { id: 2, title: "The Game Awards 2024: All Nominees", source: "POLYGON", time: "5H AGO", color: "text-cyan-400" },
    { id: 3, title: "Hollow Knight Silksong Release Date?", source: "REDDIT", time: "12H AGO", color: "text-rose-400" },
];

const NEXT_DROP = {
    title: "SHADOW OF THE ERDTREE",
    days: "03",
    hours: "14",
    platform: "STEAM"
};

const NexusPlay: React.FC<NexusPlayProps> = ({ onClose }) => {
  const [activeSection, setActiveSection] = useState<SectionId>('dashboard');
  const [tickerIndex, setTickerIndex] = useState(0);
  const { playClick } = useSound();

  // Ticker Animation
  useEffect(() => {
    const interval = setInterval(() => {
        setTickerIndex((prev) => (prev + 1) % NEWS_TICKER.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[50] w-full h-full bg-[#050505] overflow-hidden font-sans select-none flex"
    >
        {/* --- THE PHANTOM RAIL (LEFT SIDEBAR) --- */}
        {/* Z-Index 100 to stay above content */}
        <div className="fixed left-0 top-0 h-full z-[100] group w-[20px] hover:w-[90px] transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col items-center justify-center 
            border-r border-white/5 bg-transparent shadow-none
            hover:border-r hover:border-purple-500/50 hover:bg-black/80 hover:backdrop-blur-xl hover:shadow-[0_0_50px_rgba(168,85,247,0.4)]"
        >
            {/* The Plasma Line (Visual Indicator) */}
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-white/5 shadow-none transition-all duration-500 group-hover:w-[3px] group-hover:bg-purple-500 group-hover:shadow-[0_0_20px_#a855f7]" />

            {/* Nav Items Container */}
            <div className="relative z-10 flex flex-col gap-8 w-full items-center">
                
                {/* Top Brand (Hidden by default, slides in) */}
                <div className="mb-8 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 delay-75 pointer-events-none group-hover:pointer-events-auto">
                    <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                        <Icons.Gamepad width={20} height={20} />
                    </div>
                </div>

                <GhostNavBtn id="dashboard" icon={Icons.Layout} label="Home" active={activeSection} onClick={setActiveSection} delay={100} />
                <GhostNavBtn id="news" icon={Icons.Newspaper} label="Intel" active={activeSection} onClick={setActiveSection} delay={150} />
                <GhostNavBtn id="releases" icon={Icons.Calendar} label="Drops" active={activeSection} onClick={setActiveSection} delay={200} />
                <GhostNavBtn id="library" icon={Icons.Library} label="Lib" active={activeSection} onClick={setActiveSection} delay={250} />
                
                <div className="w-8 h-px bg-white/10 my-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-300" />
                
                <GhostNavBtn id="reviews" icon={Icons.Star} label="Reviews" active={activeSection} onClick={setActiveSection} delay={350} />
                <GhostNavBtn id="guides" icon={Icons.BookOpen} label="Guides" active={activeSection} onClick={setActiveSection} delay={400} />

                {/* Bottom Close */}
                <div className="mt-12 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 delay-500 pointer-events-none group-hover:pointer-events-auto">
                    <button 
                        onClick={() => { playClick(); onClose?.(); }}
                        className="w-10 h-10 rounded-full bg-white/5 hover:bg-red-500/20 text-white/30 hover:text-red-500 flex items-center justify-center transition-all border border-white/5 hover:border-red-500/30"
                    >
                        <Icons.Close width={16} />
                    </button>
                </div>
            </div>
        </div>

        {/* --- MAIN CONTENT (FULL WIDTH) --- */}
        {/* pl-[20px] ensures content starts after the idle ghost bar */}
        <div className="flex-1 w-full h-full relative overflow-y-auto bg-gradient-to-br from-[#050505] to-[#0a0a0a] no-scrollbar pl-[20px] z-[50]">
            
            {/* Header Overlay (Fixed Top Right) */}
            <div className="sticky top-0 z-40 px-10 py-8 pointer-events-none flex justify-end items-center bg-gradient-to-b from-[#050505] to-transparent">
                <div className="pointer-events-auto flex items-center gap-6">
                    <div className="text-right hidden md:block">
                        <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">
                            Nexus<span className="text-purple-500">Play</span>
                        </h2>
                        <p className="text-[10px] font-mono text-purple-500/60 uppercase tracking-widest">
                            System Online // Ver 2.4
                        </p>
                    </div>
                    <div className="h-10 w-px bg-white/10 hidden md:block" />
                    <div className="h-10 px-5 bg-white/5 rounded-full border border-white/5 flex items-center gap-3 text-zinc-500 hover:border-white/20 transition-colors backdrop-blur-md">
                        <Icons.Scan width={16} />
                        <input className="bg-transparent border-none outline-none text-[10px] w-32 placeholder-zinc-600 font-bold uppercase tracking-widest text-white" placeholder="Search Database..." />
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 border border-white/10 shadow-[0_0_20px_rgba(147,51,234,0.4)]" />
                </div>
            </div>

            <div className="px-6 md:px-12 pb-24">
                <AnimatePresence mode="wait">
                    {activeSection === 'dashboard' ? (
                        <DashboardView key="dashboard" tickerText={NEWS_TICKER[tickerIndex]} />
                    ) : (
                        <PlaceholderView key="placeholder" id={activeSection} />
                    )}
                </AnimatePresence>
            </div>
        </div>
    </motion.div>
  );
};

// --- SUB COMPONENTS ---

const GhostNavBtn = ({ id, icon: Icon, label, active, onClick, delay }: any) => {
    const isActive = active === id;
    return (
        <button
            onClick={() => onClick(id)}
            className={`
                group/btn relative flex flex-col items-center gap-1 w-full
                opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0
                transition-all duration-300 ease-out pointer-events-none group-hover:pointer-events-auto
            `}
            style={{ transitionDelay: `${delay}ms` }}
        >
            <div className={`
                p-2 rounded-xl transition-all duration-300 transform group-hover/btn:scale-110
                ${isActive ? 'text-white bg-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'text-purple-300/40 hover:text-white hover:bg-white/5'}
            `}>
                <Icon width={22} height={22} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            
            {/* Tooltip Label */}
            <span className={`text-[8px] uppercase tracking-widest font-bold transition-colors ${isActive ? 'text-white' : 'text-zinc-600 group-hover/btn:text-zinc-400'}`}>
                {label}
            </span>
            
            {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-purple-400 shadow-[0_0_10px_#c084fc]" />
            )}
        </button>
    );
};

const DashboardView: React.FC<{ tickerText: string }> = ({ tickerText }) => (
    <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6"
    >
        {/* HERO CARD (Span 3x2) */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3 row-span-2 relative h-[550px] rounded-[2.5rem] overflow-hidden border border-white/5 group shadow-2xl bg-[#0a0a0a]">
            <div className="absolute inset-0">
                <img src={HERO_GAME.image} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-1000" alt="Hero" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/90 via-transparent to-transparent" />
            </div>
            
            {/* Holographic Decoration */}
            <div className="absolute top-8 right-8 border border-white/10 bg-black/30 backdrop-blur-md px-4 py-2 rounded-full text-[10px] font-mono text-purple-300 uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                Trending Now
            </div>
            
            {/* SAFE ZONE: pl-28 (112px) > Sidebar Expanded Width (90px) */}
            <div className="absolute bottom-0 left-0 p-12 pl-28 w-full max-w-3xl">
                <div className="flex gap-2 mb-8">
                    {HERO_GAME.tags.map(tag => (
                        <span key={tag} className="px-4 py-1.5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-white shadow-lg">
                            {tag}
                        </span>
                    ))}
                </div>
                <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-white mb-4 leading-[0.85] drop-shadow-2xl mix-blend-overlay">
                    {HERO_GAME.title}
                </h1>
                <p className="text-sm font-mono text-purple-400 tracking-[0.3em] uppercase mb-12 flex items-center gap-4">
                    <span className="w-px h-8 bg-purple-500/50" />
                    {HERO_GAME.developer} // {HERO_GAME.release}
                </p>
                <div className="flex gap-4">
                    <button className="px-10 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-purple-400 hover:text-white transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                        Pre-Order Now
                    </button>
                    <button className="px-10 py-4 bg-black/40 border border-white/20 text-white rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-white/10 backdrop-blur-md transition-colors">
                        Watch Trailer
                    </button>
                </div>
            </div>
        </div>

        {/* WIDGET: INTEL FEED (Span 1x2) */}
        <div className="col-span-1 row-span-2 bg-[#080808] border border-white/5 rounded-[2.5rem] p-8 flex flex-col relative overflow-hidden group hover:border-purple-500/20 transition-colors">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Icons.Newspaper width={14} /> Intel Feed
                </span>
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]" />
            </div>
            <div className="flex-1 flex flex-col gap-4 overflow-y-auto no-scrollbar">
                {LATEST_HEADLINES.map((news) => (
                    <div key={news.id} className="p-5 bg-white/[0.02] rounded-3xl border border-white/5 hover:bg-white/[0.05] transition-colors cursor-pointer group/item">
                        <div className="flex justify-between items-start mb-3">
                            <span className={`text-[8px] font-black uppercase tracking-wider ${news.color}`}>{news.source}</span>
                            <span className="text-[8px] font-mono text-zinc-600">{news.time}</span>
                        </div>
                        <h3 className="text-xs font-bold leading-relaxed text-zinc-300 group-hover/item:text-white transition-colors line-clamp-3">
                            {news.title}
                        </h3>
                    </div>
                ))}
            </div>
            <button className="mt-6 w-full py-4 text-[9px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white border border-white/5 rounded-2xl hover:bg-white/5 transition-all">
                Access Archives
            </button>
        </div>

        {/* LIVE TICKER (Full Width) */}
        <div className="col-span-1 md:col-span-3 lg:col-span-4 h-14 bg-purple-900/5 border-y border-white/5 flex items-center overflow-hidden relative">
            <div className="absolute left-0 top-0 bottom-0 bg-purple-600 px-8 flex items-center z-10 skew-x-12 -ml-6 shadow-[0_0_50px_rgba(147,51,234,0.4)]">
                <span className="text-[10px] font-black uppercase tracking-widest text-white -skew-x-12 ml-4">LIVE WIRE</span>
            </div>
            <div className="flex-1 overflow-hidden relative h-full flex items-center pl-32">
                <AnimatePresence mode="wait">
                    <motion.div 
                        key={tickerText}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        className="text-[10px] font-mono font-bold text-purple-300 uppercase tracking-widest truncate w-full"
                    >
                        {tickerText}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>

        {/* WIDGET: NEXT DROP */}
        <div className="col-span-1 bg-[#080808] border border-white/5 rounded-[2.5rem] p-8 relative group overflow-hidden hover:border-purple-500/20 transition-colors">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <Icons.Calendar width={80} height={80} />
            </div>
            <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest block mb-3">Incoming Drop</span>
            <h3 className="text-lg font-black text-white leading-none max-w-[80%] mb-10">{NEXT_DROP.title}</h3>
            
            <div className="flex items-baseline gap-1">
                <span className="text-6xl font-black text-white tracking-tighter">{NEXT_DROP.days}</span>
                <span className="text-[9px] font-bold text-zinc-500 uppercase mr-4 tracking-widest">Days</span>
                <span className="text-6xl font-black text-zinc-700 tracking-tighter group-hover:text-zinc-600 transition-colors">{NEXT_DROP.hours}</span>
                <span className="text-[9px] font-bold text-zinc-800 uppercase tracking-widest">Hrs</span>
            </div>
            <div className="mt-8 w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                <div className="w-[70%] h-full bg-gradient-to-r from-purple-600 to-indigo-600 shadow-[0_0_10px_#9333ea]" />
            </div>
        </div>

        {/* WIDGET: SYSTEM STATUS */}
        <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 border border-white/5 rounded-[2.5rem] p-8 flex items-center justify-between relative overflow-hidden group hover:border-indigo-500/20 transition-colors">
            <div className="relative z-10">
                <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest block mb-3">System Diagnostics</span>
                <h3 className="text-2xl font-black text-white tracking-tight mb-2">OPTIMAL PERFORMANCE</h3>
                <p className="text-[10px] text-indigo-300/60 font-medium max-w-xs leading-relaxed">
                    GPU Temperature stable at 45°C. Network latency minimal (12ms). All drivers updated.
                </p>
            </div>
            <div className="relative z-10 flex gap-10 pr-6">
                <div className="text-center">
                    <div className="text-5xl font-black text-white tracking-tighter">120</div>
                    <div className="text-[8px] font-bold text-indigo-500/50 uppercase tracking-widest mt-2">FPS</div>
                </div>
                <div className="w-px h-16 bg-white/10" />
                <div className="text-center">
                    <div className="text-5xl font-black text-white tracking-tighter">14<span className="text-lg align-top text-white/50 ml-1">ms</span></div>
                    <div className="text-[8px] font-bold text-indigo-500/50 uppercase tracking-widest mt-2">PING</div>
                </div>
            </div>
            {/* Background Graphic */}
            <div className="absolute right-0 bottom-0 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                <Icons.Settings width={200} height={200} />
            </div>
        </div>

        {/* WIDGET: WISHLIST MINI */}
        <div className="col-span-1 bg-[#080808] border border-white/5 rounded-[2.5rem] p-8 flex flex-col justify-between group hover:border-purple-500/20 transition-colors">
            <div className="flex justify-between items-start">
                <div>
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Library</span>
                    <div className="flex items-center gap-3 mt-3">
                        <span className="text-4xl font-black text-white tracking-tighter">12</span>
                        <span className="text-[8px] bg-green-500/10 border border-green-500/20 text-green-500 px-2 py-1 rounded font-bold uppercase tracking-widest">3 Sales</span>
                    </div>
                </div>
                <Icons.Library width={28} className="text-zinc-700 group-hover:text-white transition-colors" />
            </div>
            <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 bg-white/[0.03] rounded-2xl border border-white/5">
                    <div className="w-10 h-10 bg-zinc-800 rounded-xl flex-shrink-0" />
                    <div className="flex-1">
                        <div className="h-2 w-20 bg-zinc-700 rounded mb-2" />
                        <div className="h-1.5 w-10 bg-purple-900 rounded" />
                    </div>
                </div>
                <div className="flex items-center gap-4 p-3 rounded-2xl opacity-30 grayscale">
                    <div className="w-10 h-10 bg-zinc-800 rounded-xl flex-shrink-0" />
                    <div className="flex-1">
                        <div className="h-2 w-24 bg-zinc-700 rounded mb-2" />
                        <div className="h-1.5 w-12 bg-zinc-800 rounded" />
                    </div>
                </div>
            </div>
        </div>

    </motion.div>
);

const PlaceholderView: React.FC<{ id: string }> = ({ id }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full h-[600px] flex flex-col items-center justify-center border border-dashed border-white/10 rounded-[3rem] bg-white/[0.01]"
    >
        <div className="p-12 bg-zinc-900/50 rounded-full mb-8 border border-white/5 shadow-2xl relative">
            <div className="absolute inset-0 bg-purple-500/10 rounded-full blur-xl animate-pulse" />
            <div className="relative z-10">
                {id === 'news' && <Icons.Newspaper width={64} height={64} className="text-zinc-500" />}
                {id === 'releases' && <Icons.Calendar width={64} height={64} className="text-zinc-500" />}
                {id === 'library' && <Icons.Library width={64} height={64} className="text-zinc-500" />}
                {id === 'reviews' && <Icons.Star width={64} height={64} className="text-zinc-500" />}
                {id === 'guides' && <Icons.BookOpen width={64} height={64} className="text-zinc-500" />}
            </div>
        </div>
        <h2 className="text-4xl font-black text-zinc-800 uppercase tracking-widest select-none">{id}</h2>
        <p className="text-[10px] font-mono text-zinc-700 mt-4 uppercase tracking-[0.3em] font-bold bg-zinc-900/50 px-4 py-2 rounded-full border border-white/5">Construction In Progress</p>
    </motion.div>
);

export default NexusPlay;
