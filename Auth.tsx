import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '../lib/constants';

// ------------------------------------------------------------------
// 🚨 SECURITY PROTOCOL 🚨
// Local Admin Access Configuration
// ------------------------------------------------------------------
const ADMIN_USERNAME = "nexus.admin.pro";
const ACCESS_KEY = "nexus_access";

interface AuthProps {
    onLoginSuccess: () => void;
}

export default function Auth({ onLoginSuccess }: AuthProps) {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAccess = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        // Artificial delay for system realism
        await new Promise(r => setTimeout(r, 800));

        try {
            const normalized = input.trim();
            
            if (normalized === ADMIN_USERNAME) {
                // ACCESS GRANTED
                localStorage.setItem(ACCESS_KEY, "true");
                
                // Haptic feedback if available
                if (typeof navigator !== 'undefined' && navigator.vibrate) {
                    navigator.vibrate([50, 50, 50]);
                }

                // Call parent handler to switch view immediately
                // DO NOT RELOAD WINDOW (Crashes Preview)
                onLoginSuccess();
            } else {
                // ACCESS DENIED
                throw new Error("UNAUTHORIZED ENTITY");
            }
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(200);
            }
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden font-sans text-white">
            {/* Ambient Background */}
            <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-purple-900/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />

            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "circOut" }}
                className="w-full max-w-md p-8 relative z-10"
            >
                {/* Glass Card */}
                <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
                    
                    {/* Header */}
                    <div className="flex flex-col items-center gap-6 mb-10">
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-white/10 to-transparent border border-white/10 flex items-center justify-center shadow-inner relative group">
                            <div className="absolute inset-0 bg-blue-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <Icons.Fingerprint width={40} height={40} className="text-white/90 relative z-10" />
                        </div>
                        <div className="text-center space-y-1">
                            <h1 className="text-3xl font-bold tracking-tight text-white">Nexus Pro</h1>
                            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">
                                Administrative Gateway
                            </p>
                        </div>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleAccess} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[9px] font-bold uppercase tracking-widest text-white/30 ml-3">
                                Admin Identity
                            </label>
                            <div className="relative group">
                                <input 
                                    type="text" 
                                    value={input}
                                    onChange={(e) => {
                                        setInput(e.target.value);
                                        if (error) setError(null);
                                    }}
                                    placeholder="Enter Username"
                                    className={`w-full bg-black/40 border rounded-2xl px-5 py-4 pl-12 text-sm text-white focus:outline-none transition-all placeholder-white/10 font-mono tracking-wide
                                        ${error 
                                            ? 'border-red-500/50 focus:border-red-500 bg-red-500/5' 
                                            : 'border-white/10 focus:border-blue-500/50 focus:bg-black/60'}
                                    `}
                                    autoCapitalize="none"
                                    autoCorrect="off"
                                    autoComplete="off"
                                    required
                                    autoFocus
                                />
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-hover:text-white/40 transition-colors pointer-events-none">
                                    <Icons.Lock width={16} />
                                </div>
                            </div>
                        </div>

                        {/* Error Message */}
                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0, y: -10 }} 
                                    animate={{ opacity: 1, height: 'auto', y: 0 }} 
                                    exit={{ opacity: 0, height: 0, y: -10 }}
                                    className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center justify-center gap-2 overflow-hidden"
                                >
                                    <Icons.Skull width={14} className="text-red-500" />
                                    <p className="text-[10px] text-red-200 font-bold uppercase tracking-wider">{error}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button 
                            type="submit" 
                            disabled={loading || !input}
                            className={`w-full py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 relative overflow-hidden group
                                ${loading 
                                    ? 'bg-white/10 text-white/50 cursor-wait' 
                                    : 'bg-white text-black hover:bg-gray-200 shadow-[0_0_30px_rgba(255,255,255,0.1)] active:scale-95'}
                            `}
                        >
                            {loading ? (
                                <>
                                    <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    <span>Verifying...</span>
                                </>
                            ) : (
                                <>
                                    <span>Initialize Uplink</span>
                                    <Icons.ArrowRight width={14} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="mt-8 text-center space-y-2 opacity-30 hover:opacity-100 transition-opacity">
                    <p className="text-[9px] font-mono">
                        SYSTEM_ID: NXS-8842 // SECURE_CONNECTION
                    </p>
                </div>
            </motion.div>
        </div>
    );
};