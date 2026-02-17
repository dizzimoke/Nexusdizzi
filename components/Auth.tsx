import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, useCloudEngine } from '../lib/supabase';
import { Icons } from '../lib/constants';

// ------------------------------------------------------------------
// 🚨 SECURITY WHITELIST 🚨
// Only this specific email is authorized for the magic link flow.
// ------------------------------------------------------------------
const WHITELIST = [
    'admin@nexus.pro',
];

const Auth = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            // 1. Whitelist Verification
            const normalizedEmail = email.trim().toLowerCase();
            
            // Artificial delay for UX consistency
            await new Promise(r => setTimeout(r, 600));

            if (!WHITELIST.includes(normalizedEmail)) {
                throw new Error("Access Denied: Email not authorized.");
            }

            // 2. Authentication Logic
            if (useCloudEngine) {
                // Online Mode: Magic Link / OTP
                const { error: otpError } = await supabase.auth.signInWithOtp({
                    email: normalizedEmail,
                    options: {
                        // CRITICAL FIX: Allow user creation for the first login of the admin
                        shouldCreateUser: true, 
                        emailRedirectTo: window.location.origin,
                    }
                });
                
                if (otpError) throw otpError;
                
                // Show Success State
                setSuccess(true);
            } else {
                // Offline Mode (Simulation for development without keys)
                // Simulate sending link then auto-login
                await new Promise(r => setTimeout(r, 800));
                localStorage.setItem('nexus_local_user', normalizedEmail);
                window.location.reload(); 
            }

        } catch (err: any) {
            console.error("Auth Error:", err);
            // Handle specific Supabase error messages better
            if (err.message?.includes("Signups not allowed")) {
                setError("System Lockdown: Registration Disabled.");
            } else {
                setError(err.message || 'Failed to send access link.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setSuccess(false);
        setEmail('');
        setError(null);
    };

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
                    
                    {/* Success State */}
                    <AnimatePresence mode="wait">
                        {success ? (
                            <motion.div 
                                key="success"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="flex flex-col items-center text-center space-y-6 py-4"
                            >
                                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                                    <Icons.Check width={40} height={40} className="text-green-500" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold tracking-tight">Check your inbox!</h2>
                                    <p className="text-sm text-white/50 leading-relaxed max-w-[260px] mx-auto">
                                        An access link has been sent to <span className="text-white font-medium">{email}</span>.
                                    </p>
                                </div>
                                <button 
                                    onClick={handleReset}
                                    className="text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-white transition-colors mt-4"
                                >
                                    Use different email
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                {/* Header */}
                                <div className="flex flex-col items-center gap-4 mb-10">
                                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
                                        <Icons.Fingerprint width={32} height={32} className="text-white/80" />
                                    </div>
                                    <div className="text-center">
                                        <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Nexus Pro</h1>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">
                                            {useCloudEngine ? 'Passwordless Access' : 'Offline Mode'}
                                        </p>
                                    </div>
                                </div>

                                {/* Auth Form */}
                                <form onSubmit={handleLogin} className="space-y-6">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold uppercase tracking-widest text-white/30 ml-2">Authorized Email</label>
                                        <div className="relative group">
                                            <input 
                                                type="email" 
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="admin@nexus.pro"
                                                className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:bg-black/40 transition-all placeholder-white/10"
                                                required
                                                autoFocus
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 group-hover:text-white/40 transition-colors pointer-events-none">
                                                <Icons.FileText width={16} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Feedback Messages */}
                                    <AnimatePresence mode="wait">
                                        {error && (
                                            <motion.div 
                                                initial={{ opacity: 0, height: 0 }} 
                                                animate={{ opacity: 1, height: 'auto' }} 
                                                exit={{ opacity: 0, height: 0 }}
                                                className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-3"
                                            >
                                                <Icons.Skull width={16} className="text-red-500 shrink-0 mt-0.5" />
                                                <p className="text-xs text-red-200 font-medium leading-relaxed">{error}</p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <button 
                                        type="submit" 
                                        disabled={loading}
                                        className="w-full py-4 bg-white text-black rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-gray-200 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                                <span>Sending Link...</span>
                                            </>
                                        ) : (
                                            <>Send Access Link</>
                                        )}
                                    </button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="mt-8 text-center space-y-2">
                    <p className="text-[9px] text-white/20 font-mono">
                        NEXUS_OS v3.2.0 // {useCloudEngine ? 'MAGIC_LINK_PROTOCOL' : 'OFFLINE_SIMULATION'}
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Auth;