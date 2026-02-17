import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '../lib/constants';

// ------------------------------------------------------------------
// 🚨 SYSTEM SECURITY PROTOCOL 🚨
// Single-user Hardcoded Access Identifier
// ------------------------------------------------------------------
const ADMIN_ID = "nexus.admin.pro";
const SESSION_KEY = "nexus_local_user";

const Auth = () => {
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isBooting, setIsBooting] = useState(true);

    // Check for existing session on mount (Auto-login attempt)
    useEffect(() => {
        const checkSession = async () => {
            const savedSession = localStorage.getItem(SESSION_KEY);
            if (savedSession === ADMIN_ID) {
                // If valid session exists, force app reload to trigger Main App render
                // (App.tsx checks this key on mount)
                window.location.reload();
            } else {
                setIsBooting(false);
            }
        };
        checkSession();
    }, []);

    const handleAccess = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            // Artificial System Delay for "Processing" feel
            await new Promise(r => setTimeout(r, 800));

            const normalizedInput = username.trim().toLowerCase();

            if (normalizedInput === ADMIN_ID) {
                // ACCESS GRANTED
                localStorage.setItem(SESSION_KEY, ADMIN_ID);
                
                // Trigger success visual before reload
                setLoading(false); // Stop spinner
                // Force reload to switch App.tsx state from <Auth /> to <AppContent />
                window.location.reload();
            } else {
                // ACCESS DENIED
                throw new Error("System Unauthorized: Identity Mismatch");
            }

        } catch (err: any) {
            console.error("Access Protocol:", err);
            setError(err.message);
            setLoading(false);
            
            // Vibrate device on error if supported
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(200);
            }
        }
    };

    if (isBooting) return null; // Prevent flash before auto-login check

    return (
        <div className="min-h-screen w-full bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden font-sans text-white">
            {/* Background Ambient Effects */}
            <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-purple-900/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />

            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "circOut" }}
                className="w-full max-w-md p-8 relative z-10"
            >
                {/* Card Container */}
                <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                    
                    {/* Header */}
                    <div className="flex flex-col items-center gap-4 mb-10">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner relative group">
                            <div className="absolute inset-0 bg-blue-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            <Icons.Fingerprint width={32} height={32} className="text-white/80 relative z-10" />
                        </div>
                        <div className="text-center">
                            <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Nexus Pro</h1>
                            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">
                                Administrative Access Panel
                            </p>
                        </div>
                    </div>

                    {/* Auth Form */}
                    <form onSubmit={handleAccess} className="space-y-6">
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase tracking-widest text-white/30 ml-2">System Identifier</label>
                            <div className="relative group">
                                <input 
                                    type="text" 
                                    value={username}
                                    onChange={(e) => {
                                        setUsername(e.target.value);
                                        if (error) setError(null);
                                    }}
                                    placeholder="Enter Admin Username"
                                    className={`w-full bg-black/20 border rounded-2xl px-5 py-4 text-sm text-white focus:outline-none transition-all placeholder-white/10 font-mono tracking-wide
                                        ${error 
                                            ? 'border-red-500/50 focus:border-red-500 bg-red-500/5' 
                                            : 'border-white/10 focus:border-blue-500/50 focus:bg-black/40'}
                                    `}
                                    autoCapitalize="none"
                                    autoCorrect="off"
                                    required
                                    autoFocus
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 group-hover:text-white/40 transition-colors pointer-events-none">
                                    <Icons.Lock width={16} />
                                </div>
                            </div>
                        </div>

                        {/* Feedback Messages */}
                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0, y: -10 }} 
                                    animate={{ opacity: 1, height: 'auto', y: 0 }} 
                                    exit={{ opacity: 0, height: 0, y: -10 }}
                                    className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-3 overflow-hidden"
                                >
                                    <Icons.Skull width={16} className="text-red-500 shrink-0 mt-0.5" />
                                    <p className="text-xs text-red-200 font-medium leading-relaxed font-mono">{error}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button 
                            type="submit" 
                            disabled={loading || !username}
                            className="w-full py-4 bg-white text-black rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-gray-200 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed group"
                        >
                            {loading ? (
                                <>
                                    <div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                    <span>Verifying Identity...</span>
                                </>
                            ) : (
                                <>
                                    Initialize Uplink
                                    <Icons.ArrowRight width={14} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="mt-8 text-center space-y-2">
                    <p className="text-[9px] text-white/20 font-mono">
                        NEXUS_OS v3.5 // SECURE_GATEWAY_ACTIVE
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Auth;