import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { Icons, SPRING_CONFIG } from '../lib/constants';
import { useSound } from '../lib/sound';
import { getRemainingTime } from '../lib/totp';

interface DockProps {
  activeTab: number;
  setActiveTab: (index: number) => void;
  accentColor: string;
  isFocusMode: boolean;
}

const Dock: React.FC<DockProps> = ({ activeTab, setActiveTab, accentColor, isFocusMode }) => {
  const [isPC, setIsPC] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    const handleResize = () => setIsPC(window.innerWidth > 1024);
    handleResize(); // Init
    window.addEventListener('resize', handleResize);
    
    // Global Sentinel Timer Sync for Dock Ring
    const timer = setInterval(() => {
        setTimeLeft(getRemainingTime());
    }, 1000);

    return () => {
        window.removeEventListener('resize', handleResize);
        clearInterval(timer);
    };
  }, []);

  if (isPC) {
      return <OrbitalDock activeTab={activeTab} setActiveTab={setActiveTab} accentColor={accentColor} timeLeft={timeLeft} />;
  }

  return <MobileDock activeTab={activeTab} setActiveTab={setActiveTab} accentColor={accentColor} timeLeft={timeLeft} />;
};

// --- PC ORBITAL DOCK ---
const OrbitalDock = ({ activeTab, setActiveTab, accentColor, timeLeft }: any) => {
    const [expanded, setExpanded] = useState(false);
    const { playWhoosh, playTick, playPop } = useSound();

    const toggle = () => {
        setExpanded(!expanded);
        playWhoosh();
    };

    const handleSelect = (id: number) => {
        setActiveTab(id);
        setExpanded(false);
        playPop();
    };

    // 7 Items Symmetrical Arc (Centered at 90 degrees)
    // Spacing: ~22 degrees
    const items = [
        { id: 3, label: 'Cloak', icon: Icons.Cloak, angle: 156 },
        { id: 1, label: 'Vault', icon: Icons.Vault, angle: 134 },
        { id: 2, label: 'Links', icon: Icons.Links, angle: 112 },
        { id: 0, label: 'Toolbox', icon: Icons.Toolbox, angle: 90 }, // Center
        { id: 6, label: 'Air', icon: Icons.AirPlay, angle: 68 },
        { id: 4, label: 'Sentinel', icon: Icons.Fingerprint, angle: 46 },
        { id: 5, label: 'Observer', icon: Icons.Aperture, angle: 24 },
    ];

    const radius = 180;

    return (
        <>
            <AnimatePresence>
                {expanded && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.2 } }}
                        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[6px]" 
                        onClick={() => setExpanded(false)} 
                    />
                )}
            </AnimatePresence>

            <div className="fixed bottom-[50px] left-1/2 -translate-x-1/2 z-50 flex items-center justify-center">
                <AnimatePresence>
                    {expanded && items.map((item) => {
                        const rad = (item.angle * Math.PI) / 180;
                        const x = Math.cos(rad) * radius; 
                        const y = -Math.sin(rad) * radius; 

                        return (
                            <motion.button
                                key={item.id}
                                initial={{ x: 0, y: 0, scale: 0.5, opacity: 0 }}
                                animate={{ x, y, scale: 1, opacity: 1 }}
                                exit={{ x: 0, y: 0, scale: 0.5, opacity: 0 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                onClick={() => handleSelect(item.id)}
                                className={`absolute w-16 h-16 rounded-full flex items-center justify-center backdrop-blur-xl border z-50 group hover:scale-110 transition-transform duration-200
                                    ${activeTab === item.id 
                                        ? 'bg-nexus-glass border-white text-white shadow-[0_0_30px_rgba(255,255,255,0.4)]' 
                                        : item.id === 6 
                                            ? 'bg-black/60 text-nexus-violet border-nexus-violet/50 shadow-[0_0_20px_rgba(112,0,255,0.3)]'
                                            : item.id === 4 
                                                ? 'bg-black/60 text-amber-500 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.3)]' 
                                                : 'bg-black/40 text-white/70 border-white/10 hover:bg-white/10 hover:text-white shadow-xl'}
                                `}
                            >
                                <div className="relative flex items-center justify-center w-full h-full">
                                    <item.icon width={24} height={24} />
                                    {item.id === 4 && (
                                        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none overflow-visible">
                                            <circle cx="50%" cy="50%" r="28" fill="none" stroke="rgba(245, 158, 11, 0.2)" strokeWidth="2" />
                                            <motion.circle 
                                                cx="50%" cy="50%" r="28" 
                                                fill="none" 
                                                stroke="#f59e0b" 
                                                strokeWidth="2"
                                                strokeDasharray={176} 
                                                animate={{ strokeDashoffset: 176 - (176 * (timeLeft / 30)) }}
                                                transition={{ duration: 1, ease: "linear" }}
                                            />
                                        </svg>
                                    )}
                                </div>
                                <span className={`absolute -bottom-10 text-[9px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-2 py-1 rounded-lg pointer-events-none whitespace-nowrap border border-white/10 ${item.id === 6 ? 'text-nexus-violet border-nexus-violet/30' : 'text-white'}`}>
                                    {item.label}
                                </span>
                            </motion.button>
                        );
                    })}
                </AnimatePresence>

                <motion.button
                    onClick={toggle}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.1 }}
                    className="relative w-24 h-24 rounded-full bg-nexus-glass backdrop-blur-3xl border border-white/20 flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.6)] z-[60] group overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-30" />
                    <AnimatePresence mode="wait">
                        {expanded ? (
                            <motion.div
                                key="close"
                                initial={{ rotate: -90, opacity: 0 }}
                                animate={{ rotate: 0, opacity: 1 }}
                                exit={{ rotate: 90, opacity: 0, transition: { duration: 0.15 } }}
                            >
                                <Icons.Close width={32} height={32} className="text-white" />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="menu"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0, transition: { duration: 0.15 } }}
                                className="grid grid-cols-2 gap-1.5 p-4 opacity-80 group-hover:opacity-100 transition-opacity"
                            >
                                <div className="w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_10px_white]" />
                                <div className="w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_10px_white]" />
                                <div className="w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_10px_white]" />
                                <div className="w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_10px_white]" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.button>
            </div>
        </>
    );
};

// --- MOBILE LINEAR DOCK ---
const MobileDock = ({ activeTab, setActiveTab, accentColor, timeLeft }: any) => {
    const [isMobileExpanded, setIsMobileExpanded] = useState(false);
    const { playTick, playPop } = useSound();
    
    const tabs = [
        { id: 0, label: 'Toolbox', icon: Icons.Toolbox },
        { id: 1, label: 'Vault', icon: Icons.Vault },
        { id: 2, label: 'Links', icon: Icons.Links },
        { id: 3, label: 'Cloak', icon: Icons.Cloak },
        // ID 7 Removed
        { id: 5, label: 'Observer', icon: Icons.Aperture },
        { id: 4, label: 'Sentinel', icon: Icons.Fingerprint },
        { id: 6, label: 'Air', icon: Icons.AirPlay },
    ];

    const isExtraActive = activeTab === 3 || activeTab === 4 || activeTab === 5 || activeTab === 6;

    const handleMobileMenuSelect = (index: number) => {
        setActiveTab(index);
        setIsMobileExpanded(false);
        playPop();
    };

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[400px] flex flex-col items-center justify-end pointer-events-none">
            <AnimatePresence>
                {isMobileExpanded && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9, transition: { duration: 0.15, ease: "circOut" } }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="absolute bottom-[110%] left-0 right-0 pointer-events-auto z-10 grid grid-cols-2 gap-2"
                    >
                         <button 
                            onClick={() => handleMobileMenuSelect(3)}
                            className={`px-4 py-3 bg-black/90 backdrop-blur-[20px] border border-white/10 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeTab === 3 ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}
                        >
                            <Icons.Cloak width={14} /> Cloak
                        </button>
                        <button 
                            onClick={() => handleMobileMenuSelect(5)}
                            className={`px-4 py-3 bg-black/90 backdrop-blur-[20px] border border-white/10 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeTab === 5 ? 'bg-green-500 text-black' : 'text-white/60 hover:text-white'}`}
                        >
                            <Icons.Aperture width={14} /> Observer
                        </button>
                        <button 
                            onClick={() => handleMobileMenuSelect(4)}
                            className={`px-4 py-3 bg-black/90 backdrop-blur-[20px] border border-white/10 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeTab === 4 ? 'bg-amber-500 text-black' : 'text-white/60 hover:text-white'}`}
                        >
                            <Icons.Fingerprint width={14} /> Sentinel
                        </button>
                        <button 
                            onClick={() => handleMobileMenuSelect(6)}
                            className={`px-4 py-3 bg-black/90 backdrop-blur-[20px] border border-white/10 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeTab === 6 ? 'bg-nexus-violet text-white' : 'text-white/60 hover:text-nexus-violet'}`}
                        >
                            <Icons.AirPlay width={14} /> Air
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
            <motion.div 
                className="flex flex-wrap justify-center items-center gap-2 px-3 py-3 rounded-[2rem] bg-nexus-glass backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/50 pointer-events-auto relative z-20 w-full"
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ ease: [0.4, 0, 0.2, 1], duration: 0.5 }}
            >
                {[0, 1, 2].map((id) => (
                    <DockIcon
                        key={id}
                        tab={tabs[id]}
                        isActive={activeTab === id}
                        onClick={() => { setActiveTab(id); playTick(); setIsMobileExpanded(false); }}
                        accentColor={accentColor}
                    />
                ))}
                <div className="relative flex items-center">
                    <DockIcon 
                        tab={tabs.find(t => t.id === activeTab) || tabs[3]} 
                        isActive={isExtraActive}
                        onClick={() => {
                            if (activeTab === 3) setActiveTab(5);
                            else if (activeTab === 5) setActiveTab(4);
                            else if (activeTab === 4) setActiveTab(6);
                            else setActiveTab(3);
                            playTick();
                        }}
                        accentColor={accentColor}
                    />
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsMobileExpanded(!isMobileExpanded);
                            playTick();
                        }}
                        className={`ml-1 w-8 h-12 flex items-center justify-center rounded-xl transition-colors ${isMobileExpanded ? 'text-white bg-white/10' : 'text-white/30 hover:text-white'}`}
                    >
                        <motion.div animate={{ rotate: isMobileExpanded ? -90 : 90 }}>
                            <Icons.ChevronRight width={16} />
                        </motion.div>
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

const DockIcon = ({ tab, isActive, onClick }: any) => {
    return (
        <motion.button
            layoutId={`dock-item-${tab.id}`}
            onClick={onClick}
            className={`
                relative w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-2xl transition-all duration-300
                ${isActive ? 'bg-white text-black shadow-lg shadow-white/20 scale-110' : 'text-white/50 hover:bg-white/10 hover:text-white'}
            `}
        >
            <tab.icon width={24} height={24} strokeWidth={isActive ? 2.5 : 2} />
            {isActive && (
                <motion.div
                    layoutId="active-dot"
                    className="absolute -bottom-1 w-1 h-1 bg-white rounded-full"
                />
            )}
        </motion.button>
    )
}

export default Dock;