
import React, { Component, useState, useEffect, ErrorInfo } from 'react';
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
import Auth from './components/Auth'; // New Local Auth
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

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("OS CRASHED:", error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen flex items-center justify-center bg-nexus-midnight text-red-500 font-mono flex-col gap-6 p-10 text-center">
           <Icons.Skull width={64} height={64} className="animate-pulse" />
           <div className="space-y-2">
             <h1 className="text-2xl tracking-[0.3em] font-bold uppercase">Critical System Failure</h1>
             <p className="text-xs opacity-50 uppercase tracking-widest max-w-xs mx-auto">The Nexus kernel has encountered an unrecoverable exception.</p>
           </div>
           <button 
              onClick={() => window.location.reload()} 
              className="px-8 py-3 border border-red-500/50 rounded-full hover:bg-red-500 hover:text-black transition-all uppercase text-[10px] font-bold tracking-widest"
           >
              Reboot Terminal
           </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Theme Configurations (Updated for Nexus Air Aesthetic) ---
const THEMES = [
  // Toolbox: Deep Blue & Cyan
  { id: 'toolbox', blob1: '#002040', blob2: '#004050', blob3: '#001020', accent: '#00F0FF', glow: 'rgba(0, 240, 255, 0.4)' },
  // Vault: Deep Red & Violet
  { id: 'vault', blob1: '#2a0a0a', blob2: '#1a0505', blob3: '#100000', accent: '#FF2A6D', glow: 'rgba(255, 42, 109, 0.4)' },
  // Links: Emerald & Teal
  { id: 'links', blob1: '#022c22', blob2: '#064e3b', blob3: '#000000', accent: '#05FFA1', glow: 'rgba(5, 255, 161, 0.4)' },
  // Cloak: Pure Darkness & White
  { id: 'cloak', blob1: '#000000', blob2: '#050505', blob3: '#020202', accent: '#FFFFFF', glow: 'rgba(255, 255, 255, 0.2)' },
  // Sentinel: Amber & Gold
  { id: 'sentinel', blob1: '#271a00', blob2: '#1a1000', blob3: '#0a0500', accent: '#FFB800', glow: 'rgba(255, 184, 0, 0.4)' },
  // Observer: Toxic Green
  { id: 'observer', blob1: '#0a1f0a', blob2: '#051005', blob3: '#000000', accent: '#39FF14', glow: 'rgba(57, 255, 20, 0.4)' },
  // Air: Deep Indigo & Atmospheric Violet (Updated)
  { id: 'air', blob1: '#0c0a20', blob2: '#050510', blob3: '#1a1033', accent: '#818cf8', glow: 'rgba(129, 140, 248, 0.4)' }
];

const MenuToggle = ({ mode, onToggle }: { mode: 'orbital' | 'ghost', onToggle: () => void }) => (
    <motion.button
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={onToggle}
        className="fixed top-6 right-6 z-[1000001] hidden lg:flex items-center gap-3 px-5 py-2.5 rounded-full bg-nexus-glass border border-nexus-border backdrop-blur-xl hover:bg-white/[0.05] transition-all group shadow-[0_0_30px_rgba(0,0,0,0.5)]"
    >
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40 group-hover:text-white transition-colors">
            {mode === 'orbital' ? 'Orbital Dock' : 'Ghost Interface'}
        </span>
        <div className="relative">
            <div className={`w-2 h-2 rounded-full transition-all duration-500 ${mode === 'ghost' ? 'bg-nexus-cyan shadow-[0_0_10px_#00F0FF]' : 'bg-white/20'}`} />
            {mode === 'ghost' && <div className="absolute inset-0 bg-nexus-cyan rounded-full animate-ping opacity-75" />}
        </div>
    </motion.button>
);

// --- MAIN APPLICATION CONTENT ---
interface AppContentProps {
  onLogout: () => void;
}

const AppContent: React.FC<AppContentProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [cloakMessageId, setCloakMessageId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  
  // Menu Configuration
  const [menuMode, setMenuMode] = useState<'orbital' | 'ghost'>(() => {
      try {
          if (typeof window !== 'undefined') {
              return (localStorage.getItem('nexus_menu_mode') as 'orbital' | 'ghost') || 'orbital';
          }
      } catch (e) {}
      return 'orbital';
  });
  
  const [isMobile, setIsMobile] = useState(false);
  const { playClick } = useSound();
  const currentTheme = THEMES[activeTab] || THEMES[0];
  const [ripples, setRipples] = useState<{x: number, y: number, id: number}[]>([]);

  // Setup
  useEffect(() => {
      // 1. Connectivity Check (Optional Visual Indicator)
      const verifyConnection = async () => {
         const status = await checkConnection();
         setIsOnline(status);
      };
      verifyConnection();

      // 2. Resize Listener
      const handleResize = () => {
          const mobile = window.innerWidth < 1024;
          setIsMobile(mobile);
          if (mobile && menuMode === 'ghost') setMenuMode('orbital');
      };
      handleResize();
      window.addEventListener('resize', handleResize);

      // 3. Cloak URL Param
      const params = new URLSearchParams(window.location.search);
      const cloakId = params.get('cloak');
      if (cloakId) setCloakMessageId(cloakId);

      return () => {
          window.removeEventListener('resize', handleResize);
      };
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

  const renderContent = () => {
    switch (activeTab) {
      case 0: return <Toolbox onFocusChange={setIsFocusMode} />;
      case 1: return <Vault onFocusChange={setIsFocusMode} />;
      case 2: return <SmartLinks onFocusChange={setIsFocusMode} />;
      case 3: return <TheCloak onSimulateReceiver={setCloakMessageId} />;
      case 4: return <TheSentinel onClose={() => setActiveTab(0)} />;
      case 5: return <TheObserver onClose={() => setActiveTab(0)} onNavigate={setActiveTab} />;
      case 6: return <NexusAir onClose={() => setActiveTab(0)} />;
      default: return <Toolbox onFocusChange={setIsFocusMode} />;
    }
  };

  // --- SPECIAL VIEWERS ---
  if (cloakMessageId) {
      return <CloakViewer messageId={cloakMessageId} onClose={() => { setCloakMessageId(null); window.history.pushState({}, '', window.location.pathname); }} />;
  }

  const titles = ['Toolbox', 'Vault', 'Links', 'The Cloak', 'Sentinel', 'Observer', 'Nexus Air'];
  const subtitles = ['Workspace Hub', 'Secure Vault', 'Quick Links', 'Encrypted Uplink', 'Recovery Sentinel', 'Visual Intel', 'Cloud Air'];

  return (
    <div 
      onClick={handleGlobalClick}
      className={`min-h-screen text-white selection:bg-nexus-cyan selection:text-black relative font-sans w-full overflow-y-auto overflow-x-hidden no-scrollbar bg-nexus-midnight transition-colors duration-1000`}
    >
      {!isMobile && <MenuToggle mode={menuMode} onToggle={toggleMenuMode} />}

      <AnimatePresence>
        {menuMode === 'ghost' && !isMobile && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <GhostSidebar onNavigate={setActiveTab} currentTab={activeTab} />
            </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Animated ambient blobs with very low opacity for deep atmosphere */}
        <motion.div animate={{ backgroundColor: currentTheme.blob1 }} transition={{ duration: 1.5 }} className="absolute top-[-10%] left-[-10%] w-[100vw] md:w-[60vw] h-[100vw] md:h-[60vw] blur-[150px] rounded-full opacity-60" />
        <motion.div animate={{ backgroundColor: currentTheme.blob2 }} transition={{ duration: 1.5 }} className="absolute bottom-[-10%] right-[-10%] w-[100vw] md:w-[60vw] h-[100vw] md:h-[60vw] blur-[150px] rounded-full opacity-60" />
        <motion.div animate={{ backgroundColor: currentTheme.blob3 }} transition={{ duration: 1.5 }} className="absolute top-[30%] left-[50%] -translate-x-1/2 w-[90vw] md:w-[70vw] h-[90vw] md:h-[70vw] blur-[120px] rounded-full opacity-40" />
        
        {/* Nexus Air Atmospheric Override */}
        <AnimatePresence>
            {activeTab === 6 && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5 }}
                    className="absolute inset-0 bg-[radial-gradient(circle_at_center,#0a0f1e_0%,#020408_100%)] z-10"
                >
                    {/* Slow moving fog/haze */}
                    <motion.div 
                        className="absolute inset-0 bg-gradient-to-t from-indigo-900/10 via-transparent to-transparent"
                        animate={{ opacity: [0.3, 0.5, 0.3] }}
                        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    />
                </motion.div>
            )}
        </AnimatePresence>

        {/* Noise Texture Overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none z-20" />
      </div>

      <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
        <AnimatePresence>
          {ripples.map((ripple) => (
            <motion.div
              key={ripple.id}
              initial={{ opacity: 0.6, scale: 0, x: ripple.x, y: ripple.y }}
              animate={{ opacity: 0, scale: 2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              onAnimationComplete={() => removeRipple(ripple.id)}
              style={{
                position: 'absolute', top: 0, left: 0, width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'transparent',
                border: `1px solid ${currentTheme.accent}`, boxShadow: `0 0 15px ${currentTheme.glow}`, transform: 'translate(-50%, -50%)', marginTop: -20, marginLeft: -20
              }}
            />
          ))}
        </AnimatePresence>
      </div>

      <main className="w-full max-w-7xl mx-auto min-h-screen px-6 md:px-12 lg:px-20 pt-24 pb-48 relative z-10 flex flex-col bg-transparent">
        <div className="mb-12 flex items-end justify-between">
           <AnimatePresence mode="wait">
             <motion.div key={activeTab} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.4, ease: "circOut" }}>
               <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">{titles[activeTab]}</h1>
               <div className="flex items-center gap-3 mt-2">
                 <div className="w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_8px_currentColor]" style={{ backgroundColor: currentTheme.accent, color: currentTheme.accent }} />
                 <p className="text-sm text-white/50 font-medium tracking-[0.2em] uppercase" style={{ textShadow: `0 0 20px ${currentTheme.glow}` }}>{subtitles[activeTab]}</p>
                 {!isOnline && (
                     <span className="ml-4 px-2 py-0.5 bg-red-500/10 border border-red-500/50 text-red-500 text-[9px] font-bold uppercase tracking-widest rounded">Offline Mode</span>
                 )}
               </div>
             </motion.div>
           </AnimatePresence>
           
           <button 
              onClick={onLogout} 
              className="text-[9px] font-bold uppercase tracking-widest text-white/30 hover:text-red-400 transition-colors bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-full backdrop-blur-md border border-white/5"
           >
              Disconnect
           </button>
        </div>

        <div className="flex-1 w-full">
           <AnimatePresence mode="popLayout">
             <motion.div key={activeTab} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={SPRING_CONFIG} className="w-full bg-transparent">
               {renderContent()}
             </motion.div>
           </AnimatePresence>
        </div>
      </main>

      {(!isFocusMode || isMobile) && (menuMode === 'orbital' || isMobile) && (
        <Dock activeTab={activeTab} setActiveTab={setActiveTab} accentColor={currentTheme.accent} isFocusMode={isFocusMode} />
      )}
    </div>
  );
};

// --- APP ENTRY POINT ---
const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('nexus_access') === 'true';
        }
        return false;
    });

    const handleLoginSuccess = () => {
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        localStorage.removeItem('nexus_access');
        setIsAuthenticated(false);
    };

    const isSharedLink = typeof window !== 'undefined' && window.location.search.includes('cloak=');

    if (!isAuthenticated && !isSharedLink) {
        return <Auth onLoginSuccess={handleLoginSuccess} />;
    }

    return (
        <ErrorBoundary>
            <NotificationProvider>
                <AppContent onLogout={handleLogout} />
            </NotificationProvider>
        </ErrorBoundary>
    );
};

export default App;
