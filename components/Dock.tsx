
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons, SPRING_CONFIG } from '../lib/constants';
import { useSound } from '../lib/sound';
import { getRemainingTime } from '../lib/totp';
import { NavItem } from '../App';

interface DockProps {
  activeTab: string;
  setActiveTab: (id: string) => void;
  accentColor: string;
  navItems: NavItem[];
}

const Dock: React.FC<DockProps> = ({ activeTab, setActiveTab, accentColor, navItems }) => {
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
      return <OrbitalDock activeTab={activeTab} setActiveTab={setActiveTab} accentColor={accentColor} timeLeft={timeLeft} navItems={navItems} />;
  }

  return <MobileDock activeTab={activeTab} setActiveTab={setActiveTab} accentColor={accentColor} timeLeft={timeLeft} navItems={navItems} />;
};

// --- PC ORBITAL DOCK ---
const OrbitalDock = ({ activeTab, setActiveTab, accentColor, timeLeft, navItems }: any) => {
    const [expanded, setExpanded] = useState(false);
    const { playWhoosh, playPop } = useSound();

    const toggle = () => {
        setExpanded(!expanded);
        playWhoosh();
    };

    const handleSelect = (id: string) => {
        setActiveTab(id);
        setExpanded(false);
        playPop();
    };

    const radius = 180;
    const totalItems = navItems.length;
    // Calculate math: Spread 180 degrees (PI). 
    // Start from Left (180deg) to Right (0deg).
    // Angle = 180 - (index * (180 / (total - 1)))
    
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
                    {expanded && navItems.map((item: NavItem, index: number) => {
                        // Mathematical Distribution
                        // We map index 0 to 180 degrees (Left) and index N to 0 degrees (Right)
                        const angleDeg = 180 - (index * (180 / (totalItems - 1)));
                        const rad = (angleDeg * Math.PI) / 180;
                        const x = Math.cos(rad) * radius; 
                        const y = -Math.sin(rad) * radius; // Negative because CSS Y is down

                        const isActive = activeTab === item.id;
                        // Determine color style
                        const colorClass = item.color.includes('text-') 
                            ? item.color.replace('text-', '') 
                            : 'white'; // Fallback

                        return (
                            <motion.button
                                key={item.id}
                                initial={{ x: 0, y: 0, scale: 0.5, opacity: 0 }}
                                animate={{ x, y, scale: 1, opacity: 1 }}
                                exit={{ x: 0, y: 0, scale: 0.5, opacity: 0 }}
                                transition={{ duration: 0.3, ease: "backOut", delay: index * 0.02 }}
                                onClick={() => handleSelect(item.id)}
                                className={`absolute w-16 h-16 rounded-full flex items-center justify-center backdrop-blur-xl border z-50 group hover:scale-110 transition-transform duration-200
                                    ${isActive 
                                        ? 'bg-nexus-glass border-white text-white shadow-[0_0_30px_rgba(255,255,255,0.4)]' 
                                        : `bg-black/60 ${item.color} border-white/10 shadow-lg`}
                                `}
                                style={{
                                    borderColor: isActive ? 'white' : 'rgba(255,255,255,0.1)',
                                    boxShadow: isActive ? `0 0 20px ${item.theme.accent}` : 'none'
                                }}
                            >
                                <div className="relative flex items-center justify-center w-full h-full">
                                    <item.icon width={24} height={24} />
                                    {item.id === 'sentinel' && (
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
                                <span className={`absolute -bottom-10 text-[9px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-2 py-1 rounded-lg pointer-events-none whitespace-nowrap border border-white/10 text-white`}>
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
const MobileDock = ({ activeTab, setActiveTab, accentColor, timeLeft, navItems }: any) => {
    const [isMobileExpanded, setIsMobileExpanded] = useState(false);
    const { playTick, playPop } = useSound();
    
    const primaryItems = navItems.slice(0, 3);
    const secondaryItems = navItems.slice(3);

    const activeItem = navItems.find((i: any) => i.id === activeTab) || navItems[0];
    const isExtraActive = secondaryItems.some((i: any) => i.id === activeTab);

    const handleMobileMenuSelect = (id: string) => {
        setActiveTab(id);
        setIsMobileExpanded(false);
        playPop();
    };

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-[400px] flex flex-col items-center justify-end pointer-events-none">
            <AnimatePresence>
                {isMobileExpanded && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9, transition: { duration: 0.15, ease: "circOut" } }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="absolute bottom-[110%] left-0 right-0 pointer-events-auto z-10 grid grid-cols-2 gap-2"
                    >
                        {secondaryItems.map((item: any) => (
                             <button 
                                key={item.id}
                                onClick={() => handleMobileMenuSelect(item.id)}
                                className={`px-4 py-3 bg-black/90 backdrop-blur-[20px] border border-white/10 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeTab === item.id ? 'bg-white text-black' : `text-white/60 hover:text-white`}`}
                            >
                                <item.icon width={14} className={activeTab === item.id ? 'text-black' : item.color} /> 
                                {item.label}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
            <motion.div 
                className="flex flex-wrap justify-center items-center gap-2 px-3 py-3 rounded-[2rem] bg-nexus-glass backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/50 pointer-events-auto relative z-20 w-full"
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ ease: [0.4, 0, 0.2, 1], duration: 0.5 }}
            >
                {primaryItems.map((item: any) => (
                    <DockIcon
                        key={item.id}
                        tab={item}
                        isActive={activeTab === item.id}
                        onClick={() => { setActiveTab(item.id); playTick(); setIsMobileExpanded(false); }}
                        accentColor={accentColor}
                    />
                ))}
                
                <div className="relative flex items-center">
                    {/* The "More" active indicator or current active secondary item */}
                    <DockIcon 
                        tab={isExtraActive ? activeItem : secondaryItems[0]} 
                        isActive={isExtraActive}
                        onClick={() => {
                            setIsMobileExpanded(true);
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
