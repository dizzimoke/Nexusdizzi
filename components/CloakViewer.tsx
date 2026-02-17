import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '../lib/constants';
import { useCloakMessaging } from '../lib/hooks';
import { useSound } from '../lib/sound';

interface CloakViewerProps {
    messageId: string;
    onClose: () => void;
}

const CloakViewer: React.FC<CloakViewerProps> = ({ messageId, onClose }) => {
    const { getMessage, burnMessage } = useCloakMessaging();
    const [message, setMessage] = useState<any>(null);
    const [isBurning, setIsBurning] = useState(false);
    const [status, setStatus] = useState<'loading' | 'decrypting' | 'viewing' | 'burned'>('loading');
    const [timeLeft, setTimeLeft] = useState(30);
    const { playWhoosh, playTick } = useSound();
    
    // Mouse tracking for flashlight
    const containerRef = useRef<HTMLDivElement>(null);
    const x = useRef(0);
    const y = useRef(0);

    // ANTI-TRACKING: Scrub URL & Title immediately
    useEffect(() => {
        document.title = "Secure Transmission";
        if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
            const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
        }
    }, []);

    // Initial Fetch
    useEffect(() => {
        const loadMessage = async () => {
            const msg = await getMessage(messageId);
            if (msg) {
                // Set dynamic timer based on message config
                setTimeLeft(msg.burnTimer || 30);
                
                setTimeout(() => {
                    setStatus('decrypting');
                    setTimeout(() => {
                        setMessage(msg);
                        setStatus('viewing');
                        playWhoosh();
                    }, 1500); // Fake decryption delay
                }, 1000);
            } else {
                setStatus('burned');
            }
        };
        loadMessage();
    }, [messageId]);

    // Timer & Visibility Logic
    useEffect(() => {
        if (status !== 'viewing') return;

        // Dynamic Countdown
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    handleBurn();
                    return 0;
                }
                if (prev <= 10 || prev % 60 === 0) playTick();
                return prev - 1;
            });
        }, 1000);

        // Anti-Screenshot: Tab Switch triggers Burn
        const handleVisibilityChange = () => {
            if (document.hidden) {
                handleBurn();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        return () => {
            clearInterval(timer);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [status]);

    // Flashlight Effect
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return;
            x.current = e.clientX;
            y.current = e.clientY;
            
            const overlay = document.getElementById('cloak-overlay');
            if (overlay) {
                overlay.style.webkitMaskImage = `radial-gradient(circle 150px at ${x.current}px ${y.current}px, transparent 0%, black 100%)`;
                overlay.style.maskImage = `radial-gradient(circle 150px at ${x.current}px ${y.current}px, transparent 0%, black 100%)`;
            }
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // DEAD END: Kill Switch (Immediate Redirect)
    useEffect(() => {
        if (status === 'burned') {
            // Force redirect to external domain to prevent history traversal back to app
            window.location.replace('https://google.com');
        }
    }, [status]);

    const handleBurn = () => {
        if (isBurning) return;
        setIsBurning(true);
        playWhoosh();
        burnMessage(messageId);
        
        // Short delay for animation before redirect kicks in via status change
        setTimeout(() => {
            setStatus('burned');
        }, 1500);
    };

    if (status === 'loading' || status === 'decrypting') {
        return (
            <div className="fixed inset-0 bg-black z-[9999] flex flex-col items-center justify-center cursor-wait overflow-hidden font-mono">
                <div className="relative z-10">
                     <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        className="w-12 h-12 border-t-2 border-r-2 border-white/50 rounded-full"
                     />
                </div>
                <motion.p 
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   key={status}
                   className="mt-8 text-xs uppercase tracking-[0.3em] text-white/50"
                >
                    {status === 'loading' ? 'Establishing Secure Handshake...' : 'Deciphering Payload...'}
                </motion.p>
            </div>
        );
    }

    if (status === 'burned') {
        // Black screen while redirect happens
        return <div className="fixed inset-0 bg-black z-[9999]" />;
    }

    return (
        <div ref={containerRef} className="fixed inset-0 bg-black z-[9999] overflow-hidden cursor-crosshair select-none font-mono text-white">
            {/* 1. Base Layer (Clear Content) */}
            <div className="absolute inset-0 flex items-center justify-center p-8 md:p-20 z-10">
                 <div className="max-w-2xl w-full">
                     <div className="flex items-center justify-between mb-12 border-b border-white/10 pb-6">
                         <div className="flex items-center gap-3">
                             <div className={`w-3 h-3 rounded-full animate-pulse shadow-[0_0_10px_currentColor] ${timeLeft <= 10 ? 'bg-red-500 text-red-500' : 'bg-emerald-500 text-emerald-500'}`} />
                             <span className={`text-xs font-bold uppercase tracking-widest ${timeLeft <= 10 ? 'text-red-500' : 'text-emerald-500'}`}>
                                 TTL: {timeLeft}s
                             </span>
                         </div>
                         <Icons.Lock width={20} className="text-white/20" />
                     </div>
                     
                     <div className="prose prose-invert max-w-none">
                         {message.type === 'text' ? (
                             <p className="text-xl md:text-2xl leading-relaxed text-white/90 whitespace-pre-wrap tracking-wide">
                                 {message.content}
                             </p>
                         ) : (
                             <div className="relative rounded-lg overflow-hidden border border-white/10 shadow-2xl">
                                 <img src={message.content} alt="Payload" className="w-full h-auto opacity-90" />
                             </div>
                         )}
                     </div>

                     <div className="mt-20 pt-8 border-t border-white/10 flex flex-col items-center gap-4">
                         <button 
                             onClick={handleBurn}
                             className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white border border-red-500 text-xs font-bold uppercase tracking-[0.2em] transition-all shadow-[0_0_30px_rgba(220,38,38,0.4)] hover:scale-105 active:scale-95"
                         >
                             Terminate Link
                         </button>
                         <p className="text-[9px] text-white/20 uppercase tracking-widest">
                             Warning: Payload self-destructs upon closure
                         </p>
                     </div>
                 </div>
            </div>

            {/* 2. Cover Layer (High Opacity) */}
            <div 
                id="cloak-overlay"
                className="absolute inset-0 bg-black/98 pointer-events-none transition-opacity duration-75 z-20"
                style={{
                    WebkitMaskImage: 'radial-gradient(circle 150px at -1000px -1000px, transparent 0%, black 100%)',
                    maskImage: 'radial-gradient(circle 150px at -1000px -1000px, transparent 0%, black 100%)'
                }}
            />

            {/* 3. Destruction Animation */}
            <AnimatePresence>
                {isBurning && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-black z-50 flex items-center justify-center"
                    >
                         <div className="flex flex-col items-center gap-6">
                            <Icons.EyeOff className="text-red-500 animate-pulse" width={64} height={64} />
                            <h2 className="text-red-500 font-bold uppercase tracking-[0.5em] animate-pulse">
                                CONNECTION SEVERED
                            </h2>
                         </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CloakViewer;