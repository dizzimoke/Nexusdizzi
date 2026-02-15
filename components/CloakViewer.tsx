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

    // Initial Fetch
    useEffect(() => {
        const msg = getMessage(messageId);
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
                // Only tick for the final 10 seconds or start of longer periods
                if (prev <= 10 || prev % 60 === 0) playTick();
                return prev - 1;
            });
        }, 1000);

        // Anti-Screenshot: Tab Switch
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
                // Update mask position
                overlay.style.webkitMaskImage = `radial-gradient(circle 120px at ${x.current}px ${y.current}px, transparent 0%, black 100%)`;
                overlay.style.maskImage = `radial-gradient(circle 120px at ${x.current}px ${y.current}px, transparent 0%, black 100%)`;
            }
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const handleBurn = () => {
        if (isBurning) return;
        setIsBurning(true);
        playWhoosh();
        burnMessage(messageId);
        setTimeout(() => {
            setStatus('burned');
            setIsBurning(false);
        }, 2000);
    };

    if (status === 'loading' || status === 'decrypting') {
        return (
            <div className="fixed inset-0 bg-black z-[9999] flex flex-col items-center justify-center cursor-wait overflow-hidden">
                <div className="absolute inset-0 opacity-30">
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-900/20 blur-[100px] rounded-full animate-pulse" />
                </div>
                
                <div className="relative z-10">
                     <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        className="w-16 h-16 border-t-2 border-r-2 border-white rounded-full"
                     />
                     <motion.div 
                        animate={{ rotate: -360 }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        className="absolute inset-2 border-b-2 border-l-2 border-purple-500 rounded-full"
                     />
                </div>
                <motion.p 
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   key={status}
                   className="mt-8 font-mono text-xs uppercase tracking-[0.3em] text-white/50"
                >
                    {status === 'loading' ? 'Retrieving Secure Packet...' : 'Decrypting Payload...'}
                </motion.p>
            </div>
        );
    }

    if (status === 'burned') {
        return (
            <div className="fixed inset-0 bg-black z-[9999] flex flex-col items-center justify-center overflow-hidden">
                 {/* Black Hole Aftermath */}
                 <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center gap-6 relative z-10"
                 >
                     <div className="relative">
                        <Icons.EyeOff width={64} height={64} className="text-white/20" />
                        <motion.div 
                            className="absolute -inset-4 bg-white/5 blur-xl rounded-full"
                            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
                            transition={{ duration: 3, repeat: Infinity }}
                        />
                     </div>
                     <h1 className="text-3xl font-bold text-white tracking-tight">Link Expired</h1>
                     <p className="text-white/40 font-mono text-xs uppercase tracking-widest">Payload has been incinerated.</p>
                     
                     <button 
                        onClick={onClose}
                        className="mt-8 px-8 py-3 bg-white/10 hover:bg-white/20 rounded-full text-xs font-bold uppercase tracking-widest transition-all"
                     >
                        Return to Nexus
                     </button>
                 </motion.div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="fixed inset-0 bg-black z-[9999] overflow-hidden cursor-crosshair select-none">
            {/* Background: Black Hole Event Horizon */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-gradient-radial from-black via-purple-900/10 to-transparent blur-[80px] rounded-full opacity-50 pointer-events-none" />
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 60, ease: "linear" }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] border border-white/5 rounded-full opacity-20 pointer-events-none" 
                />
            </div>

            {/* 1. Base Layer (Clear Content) */}
            <div className="absolute inset-0 flex items-center justify-center p-8 md:p-20 z-10">
                 <div className="max-w-2xl w-full">
                     <div className="flex items-center justify-between mb-12 border-b border-white/10 pb-6">
                         <div className="flex items-center gap-3">
                             <div className={`w-3 h-3 rounded-full animate-pulse shadow-[0_0_10px_currentColor] ${timeLeft <= 10 ? 'bg-red-500 text-red-500' : 'bg-emerald-500 text-emerald-500'}`} />
                             <span className={`font-mono text-xs font-bold uppercase tracking-widest ${timeLeft <= 10 ? 'text-red-500' : 'text-emerald-500'}`}>
                                 Self-Destruct: {timeLeft}s
                             </span>
                         </div>
                         <Icons.Cloak width={24} className="text-white/20" />
                     </div>
                     
                     <div className="prose prose-invert max-w-none">
                         {message.type === 'text' ? (
                             <p className="text-xl md:text-3xl font-mono leading-relaxed text-white/90 whitespace-pre-wrap">
                                 {message.content}
                             </p>
                         ) : (
                             <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                                 <img src={message.content} alt="Secure Payload" className="w-full h-auto opacity-90" />
                             </div>
                         )}
                     </div>

                     <div className="mt-16 pt-8 border-t border-white/10 flex flex-col items-center gap-4">
                         <button 
                             onClick={handleBurn}
                             className="px-8 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-xs font-bold uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(239,68,68,0.4)] hover:scale-105 active:scale-95"
                         >
                             I've read this, destroy it now
                         </button>
                         <p className="text-[10px] text-white/20 font-mono uppercase tracking-widest">
                             Warning: This action is irreversible.
                         </p>
                     </div>
                 </div>
            </div>

            {/* 2. Cover Layer (Blurred + Masked) */}
            <div 
                id="cloak-overlay"
                className="absolute inset-0 bg-black/95 backdrop-blur-3xl pointer-events-none transition-opacity duration-75 z-20"
                style={{
                    WebkitMaskImage: 'radial-gradient(circle 120px at -1000px -1000px, transparent 0%, black 100%)',
                    maskImage: 'radial-gradient(circle 120px at -1000px -1000px, transparent 0%, black 100%)'
                }}
            />

            {/* 3. Destruction Animation (Ash) */}
            <AnimatePresence>
                {isBurning && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-black z-50 flex items-center justify-center"
                    >
                         <div className="absolute inset-0 overflow-hidden">
                             {Array.from({ length: 100 }).map((_, i) => (
                                 <motion.div
                                     key={i}
                                     className="absolute bg-white/40 w-1 h-1 rounded-full"
                                     initial={{ 
                                         x: window.innerWidth / 2, 
                                         y: window.innerHeight / 2,
                                         scale: Math.random() * 2 
                                     }}
                                     animate={{ 
                                         y: (Math.random() - 0.5) * window.innerHeight * 2, 
                                         x: (Math.random() - 0.5) * window.innerWidth * 2,
                                         opacity: 0,
                                         scale: 0
                                     }}
                                     transition={{ duration: 1 + Math.random(), ease: "easeOut" }}
                                 />
                             ))}
                         </div>
                         <div className="relative z-10 flex flex-col items-center">
                            <Icons.Spiral className="text-white/20 animate-spin-slow mb-4" width={48} height={48} />
                            <h2 className="text-white/40 font-bold uppercase tracking-[0.5em] animate-pulse">
                                Atomizing Data...
                            </h2>
                         </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CloakViewer;