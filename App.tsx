import React, { useState, useEffect, ErrorInfo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Dock from './components/Dock';
import Toolbox from './components/Toolbox';
import Vault from './components/Vault';
import SmartLinks from './components/SmartLinks';
import TheCloak from './components/TheCloak';
import TheSentinel from './components/TheSentinel';
import TheObserver from './components/TheObserver';
import NexusAir from './components/NexusAir';
import CloakViewer from './components/CloakViewer';
import GhostSidebar from './components/GhostSidebar';
import { SPRING_CONFIG, Icons } from './lib/constants';
import { useSound } from './lib/sound';
import { NotificationProvider } from './components/NotificationProvider';
import { checkConnection } from './lib/supabase';

// --- Error Boundary ---
interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen flex items-center justify-center bg-black text-red-500 font-mono flex-col gap-4">
           <Icons.Skull width={48} height={48} />
           <h1 className="text-xl tracking-[0.2em] font-bold uppercase">System Critical Failure</h1>
           <button onClick={() => window.location.reload()} className="px-6 py-2 border border-red-500 rounded hover:bg-red-500 hover:text-black transition-colors uppercase text-xs">Reboot System</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Theme Configurations ---
const THEMES = [
  { 
    id: 'toolbox',
    blob1: 'rgba(30, 58, 138, 0.4)', 
    blob2: 'rgba(19, 78, 74, 0.4)',  
    blob3: 'rgba(49, 46, 129, 0.3)', 
    accent: '#3b82f6', 
    glow: 'rgba(59, 130, 246, 0.5)'
  },
  { 
    id: 'vault',
    blob1: 'rgba(127, 29, 29, 0.4)', 
    blob2: 'rgba(88, 28, 135, 0.4)', 
    blob3: 'rgba(136, 19, 55, 0.3)', 
    accent: '#ef4444', 
    glow: 'rgba(239, 68, 68, 0.5)'
  },
  { 
    id: 'links',
    blob1: 'rgba(6, 78, 59, 0.4)',  
    blob2: 'rgba(20, 83, 45, 0.4)',  
    blob3: 'rgba(63, 98, 18, 0.3)',  
    accent: '#10b981', 
    glow: 'rgba(16, 185, 129, 0.5)'
  },
  { 
    id: 'cloak',
    blob1: 'rgba(20, 20, 20, 0.8)', 
    blob2: 'rgba(10, 10, 10, 0.8)', 
    blob3: 'rgba(5, 5, 5, 0.8)',    
    accent: '#ffffff', 
    glow: 'rgba(255, 255, 255, 0.2)'
  },
  { 
    id: 'sentinel',
    blob1: 'rgba(180, 83, 9, 0.3)',  
    blob2: 'rgba(245, 158, 11, 0.2)', 
    blob3: 'rgba(146, 64, 14, 0.3)',  
    accent: '#f59e0b', 
    glow: 'rgba(245, 158, 11, 0.5)'
  },
  { 
    id: 'observer',
    blob1: 'rgba(20, 83, 45, 0.5)',   
    blob2: 'rgba(34, 197, 94, 0.15)',  
    blob3: 'rgba(0, 0, 0, 0.9)',       
    accent: '#22c55e', 
    glow: 'rgba(34, 197, 94, 0.5)'
  },
  { 
    id: 'air',
    blob1: 'rgba(15, 23, 42, 1)', 
    blob2: 'rgba(2, 6, 23, 1)',   
    blob3: 'rgba(30, 41, 59, 0.5)', 
    accent: '#38bdf8', 
    glow: 'rgba(56, 189, 248, 0.5)'
  }
];

// --- Menu Toggle Component ---
const MenuToggle = ({ mode, onToggle }: { mode: 'orbital' | 'ghost', onToggle: () => void }) => (
    <motion.button
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={onToggle}
        className="fixed top-6 right-6 z-[1000001] hidden lg:flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-xl hover:bg-white/[0.08] transition-all group shadow-[0_0_30px_rgba(0,0,0,0.5)]"
    >
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40 group-hover:text-white transition-colors">
            {mode === 'orbital' ? 'Orbital Dock' : 'Ghost Interface'}
        </span>
        <div className="relative">
            <div className={`w-2 h-2 rounded-full transition-all duration-500 ${mode === 'ghost' ? 'bg-blue-500 shadow-[0_0_10px_#3b82f6]' : 'bg-white/20'}`} />
            {mode === 'ghost' && <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75" />}
        </div>
    </motion.button>
);

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [cloakMessageId, setCloakMessageId] = useState<string | null>(null);
  const [zenMode, setZenMode] = useState(false);
  const [zenPlaylist, setZenPlaylist] = useState('37i9dQZF1DWZeKCadgRdKQ');
  const [isOnline, setIsOnline] = useState(true);
  
  // --- Menu System State ---
  const [menuMode, setMenuMode] = useState<'orbital' | 'ghost'>(() => {
      if (typeof window !== 'undefined') {
          return (localStorage.getItem('nexus_menu_mode') as 'orbital' | 'ghost') || 'orbital';
      }
      return 'orbital';
  });
  const [isMobile, setIsMobile] = useState(false);

  const { playClick } = useSound();

  let currentTheme = THEMES[activeTab] || THEMES[0];
  const [ripples, setRipples] = useState<{x: number, y: number, id: number}[]>([]);

  // Mobile Detection, Connection Check & Deep Linking
  useEffect(() => {
    const handleResize = () => {
        const mobile = window.innerWidth < 1024;
        setIsMobile(mobile);
        if (mobile && menuMode === 'ghost') {
            setMenuMode('orbital'); // Force orbital on mobile
        }
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const params = new URLSearchParams(window.location.search);
    const cloakId = params.get('cloak');
    if (cloakId) setCloakMessageId(cloakId);

    // Initial Connection Check
    checkConnection().then(setIsOnline);

    return () => window.removeEventListener('resize', handleResize);
  }, [menuMode]);

  const toggleMenuMode = () => {
      const newMode = menuMode === 'orbital' ? 'ghost' : 'orbital';
      setMenuMode(newMode);
      localStorage.setItem('nexus_menu_mode', newMode);
      playClick();
  };

  const handleGlobalClick = (e: React.MouseEvent) => {
    const newRipple = { x: e.clientX, y: e.clientY, id: Date.now() };
    setRipples(prev => [...prev, newRipple]);
  };

  const removeRipple = (id: number) => {
    setRipples(prev => prev.filter(r => r.id !== id));
  };

  const handleCloseCloak = () => {
      window.history.pushState({}, '', window.location.pathname);
      setCloakMessageId(null);
  };

  // Determine which navigation to show
  const showOrbital = isMobile || menuMode === 'orbital';
  const showGhost = !isMobile && menuMode === 'ghost';

  const renderContent = () => {
    switch (activeTab) {
      case 0: return <Toolbox onFocusChange={setIsFocusMode} zenMode={zenMode} setZenMode={setZenMode} setZenPlaylist={setZenPlaylist} />;
      case 1: return <Vault onFocusChange={setIsFocusMode} />;
      case 2: return <SmartLinks onFocusChange={setIsFocusMode} />;
      case 3: return <TheCloak onSimulateReceiver={setCloakMessageId} />;
      case 4: return <TheSentinel onClose={() => setActiveTab(0)} />;
      case 5: return <TheObserver onClose={() => setActiveTab(0)} onNavigate={setActiveTab} />;
      case 6: return <NexusAir onClose={() => setActiveTab(0)} />;
      default: return <Toolbox onFocusChange={setIsFocusMode} zenMode={zenMode} setZenMode={setZenMode} setZenPlaylist={setZenPlaylist} />;
    }
  };

  const titles = ['Toolbox', 'Vault', 'Links', 'The Cloak', 'Sentinel', 'Observer', 'Nexus Air'];
  const subtitles = ['Nexus Pro // Workspace', 'Secure Storage', 'Quick Access', 'Encrypted Uplink', '2FA Authenticator', 'Visual Intelligence', 'Cloud File System'];

  if (cloakMessageId) {
      return <CloakViewer messageId={cloakMessageId} onClose={handleCloseCloak} />;
  }

  // --- SPECIAL CASE: FULL SCREEN APP (AIR) ---
  if (activeTab === 6) {
      return (
          <div className="fixed inset-0 z-0 flex items-center justify-center bg-slate-950">
             {/* Global Toggle inside Context */}
             {!isMobile && <MenuToggle mode={menuMode} onToggle={toggleMenuMode} />}

             {/* Navigation Systems */}
             <AnimatePresence>
                {showGhost && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <GhostSidebar onNavigate={setActiveTab} currentTab={activeTab} />
                    </motion.div>
                )}
             </AnimatePresence>

             {/* Deep Mesh Gradient Background */}
             <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-black z-0" />
             <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_50%_50%,_rgba(56,189,248,0.1),transparent_50%)]" />
             
             {/* Component Render */}
             <NexusAir onClose={() => setActiveTab(0)} />
             
             {/* Orbital Dock (Conditional) */}
             <AnimatePresence>
                {showOrbital && (
                    <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}>
                        <Dock activeTab={activeTab} setActiveTab={setActiveTab} accentColor={currentTheme.accent} isFocusMode={false} />
                    </motion.div>
                )}
             </AnimatePresence>
          </div>
      );
  }

  // --- STANDARD LAYOUT ---
  return (
    <div 
      onClick={handleGlobalClick}
      className={`min-h-screen text-white selection:bg-apple-blue selection:text-white relative font-sans w-full overflow-y-auto overflow-x-hidden no-scrollbar transition-colors duration-1000 ${activeTab >= 3 ? 'bg-[#000000]' : 'bg-[#050505]'}`}
    >
      <style>{`
        .aura-border {
          background: 
            linear-gradient(rgba(28, 28, 30, 0.3), rgba(28, 28, 30, 0.3)) padding-box,
            linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.05) 50%, rgba(255, 255, 255, 0) 100%) border-box;
          border: 1px solid transparent;
        }
        .aura-border-dark {
           background: 
            linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)) padding-box,
            linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.05) 50%, rgba(255, 255, 255, 0) 100%) border-box;
          border: 1px solid transparent;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Global Interface Toggle (Desktop Only) */}
      {!isMobile && <MenuToggle mode={menuMode} onToggle={toggleMenuMode} />}

      {/* Navigation Systems */}
      <AnimatePresence>
        {showGhost && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <GhostSidebar onNavigate={setActiveTab} currentTab={activeTab} />
            </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div animate={{ backgroundColor: currentTheme.blob1 }} transition={{ duration: 1.5 }} className="absolute top-[-10%] left-[-10%] w-[100vw] md:w-[60vw] h-[100vw] md:h-[60vw] blur-[120px] rounded-full" />
        <motion.div animate={{ backgroundColor: currentTheme.blob2 }} transition={{ duration: 1.5 }} className="absolute bottom-[-10%] right-[-10%] w-[100vw] md:w-[60vw] h-[100vw] md:h-[60vw] blur-[120px] rounded-full" />
        <motion.div animate={{ backgroundColor: currentTheme.blob3 }} transition={{ duration: 1.5 }} className="absolute top-[30%] left-[50%] -translate-x-1/2 w-[90vw] md:w-[70vw] h-[90vw] md:h-[70vw] blur-[100px] rounded-full" />
      </div>

      <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
        <AnimatePresence>
          {ripples.map((ripple) => (
            <motion.div
              key={ripple.id}
              initial={{ opacity: 0.8, scale: 0, x: ripple.x, y: ripple.y }}
              animate={{ opacity: 0, scale: 2.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              onAnimationComplete={() => removeRipple(ripple.id)}
              style={{
                position: 'absolute', top: 0, left: 0, width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'transparent',
                border: `1px solid ${currentTheme.accent}`, boxShadow: `0 0 20px ${currentTheme.glow}`, transform: 'translate(-50%, -50%)', marginTop: -30, marginLeft: -30
              }}
            />
          ))}
        </AnimatePresence>
      </div>

      <main className="w-full max-w-7xl mx-auto min-h-screen px-6 md:px-12 lg:px-20 pt-24 pb-48 relative z-10 flex flex-col bg-transparent">
        <div className="mb-10 flex items-end justify-between">
           <AnimatePresence mode="wait">
             <motion.div key={activeTab} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.4, ease: "circOut" }}>
               <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white/95 drop-shadow-2xl">{titles[activeTab]}</h1>
               <div className="flex items-center gap-2 mt-2">
                 <div className={`w-2 h-2 rounded-full animate-pulse`} style={{ backgroundColor: currentTheme.accent }} />
                 <p className="text-sm text-white/40 font-semibold tracking-[0.2em] uppercase">{subtitles[activeTab]}</p>
                 {!isOnline && (
                     <span className="ml-4 px-2 py-0.5 bg-red-500/10 border border-red-500/50 text-red-500 text-[9px] font-bold uppercase tracking-widest rounded">System Offline</span>
                 )}
               </div>
             </motion.div>
           </AnimatePresence>
        </div>

        <div className="flex-1 w-full">
           <AnimatePresence mode="popLayout">
             <motion.div key={activeTab} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={SPRING_CONFIG} className="w-full bg-transparent">
               {renderContent()}
             </motion.div>
           </AnimatePresence>
        </div>
      </main>

      <AnimatePresence>
        {showOrbital && (
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}>
                <Dock activeTab={activeTab} setActiveTab={setActiveTab} accentColor={currentTheme.accent} isFocusMode={isFocusMode} />
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const App: React.FC = () => (
  <ErrorBoundary>
    <NotificationProvider>
        <AppContent />
    </NotificationProvider>
  </ErrorBoundary>
);

export default App;