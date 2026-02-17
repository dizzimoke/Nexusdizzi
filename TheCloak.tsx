
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '../lib/constants';
import { useSound } from '../lib/sound';
import { useNotification } from './NotificationProvider';
import { useCloakMessaging } from '../lib/hooks';

interface TheCloakProps {
    onSimulateReceiver?: (id: string) => void;
}

const TheCloak: React.FC<TheCloakProps> = ({ onSimulateReceiver }) => {
  return (
    <motion.div 
        initial={{ clipPath: "ellipse(100% 0% at 50% 50%)" }}
        animate={{ clipPath: "ellipse(100% 100% at 50% 50%)" }}
        transition={{ duration: 0.3, ease: "circOut" }}
        className="w-full h-full lg:max-w-[1200px] lg:mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 p-4 lg:p-0 font-sans"
    >
       {/* Left Column: COMPOSE */}
       <div className="h-[500px] lg:h-[650px] relative z-10">
          <SecureComposer onSimulateReceiver={onSimulateReceiver} />
       </div>

       {/* Right Column: DECRYPT & TOOLS */}
       <div className="flex flex-col gap-6 relative z-10 h-full">
          <div className="flex-1 min-h-[280px]">
             <DecryptionPanel />
          </div>
          <div className="h-[200px] lg:h-[250px]">
             <FileShredderPanel />
          </div>
       </div>
    </motion.div>
  );
};

const DecryptionPanel = () => {
    const [input, setInput] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const { playDing, playClick, playWhoosh } = useSound();
    
    const handleDecrypt = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input) return;
        
        setIsScanning(true);
        playWhoosh();

        setTimeout(() => {
            let targetId = input.trim();
            if (targetId.includes('cloak=')) {
                const match = targetId.match(/cloak=([^&]+)/);
                if (match) targetId = match[1];
            }

            playDing(); 
            const url = new URL(window.location.href);
            url.searchParams.set('cloak', targetId);
            window.history.pushState({}, '', url);
            window.location.reload(); 
        }, 1500);
    };

    return (
        <div className="w-full h-full bg-white/[0.01] backdrop-blur-[40px] border border-white/10 rounded-[32px] p-8 flex flex-col relative overflow-hidden group">
             {/* Subtle Glow */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-[100px] rounded-full pointer-events-none" />

             <div className="flex items-center gap-4 mb-8 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
                    <Icons.Lock width={18} />
                </div>
                <div>
                    <h3 className="text-lg font-light text-white tracking-tight">Decryption Node</h3>
                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em]">Unlock Secure Packets</p>
                </div>
             </div>

             <form onSubmit={handleDecrypt} className="flex-1 flex flex-col justify-center gap-6 relative z-10">
                 <div className="relative group/input">
                    <input 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Paste Secure Token..."
                        className="relative w-full bg-transparent border-b border-white/10 px-0 py-4 text-sm text-white placeholder-white/10 focus:outline-none focus:border-purple-500/50 transition-all font-mono tracking-wide"
                        onClick={playClick}
                        disabled={isScanning}
                    />
                    {isScanning && (
                        <motion.div 
                            className="absolute bottom-0 h-px bg-purple-500 shadow-[0_0_15px_#a855f7]"
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 1.5, ease: "linear" }}
                        />
                    )}
                 </div>
                 
                 <button 
                    type="submit"
                    disabled={!input || isScanning}
                    className="w-full py-5 bg-white/[0.03] hover:bg-white/[0.08] rounded-2xl text-[10px] font-bold text-white uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 border border-white/5 disabled:opacity-50"
                    onClick={playClick}
                >
                    {isScanning ? (
                        <span className="animate-pulse">Processing...</span>
                    ) : (
                        <>
                            <Icons.Check width={14} /> Access Payload
                        </>
                    )}
                 </button>
             </form>
        </div>
    );
};

interface SecureComposerProps {
    onSimulateReceiver?: (id: string) => void;
}

const SecureComposer: React.FC<SecureComposerProps> = ({ onSimulateReceiver }) => {
    const [text, setText] = useState('');
    const [generatedId, setGeneratedId] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [burnTimer, setBurnTimer] = useState(30);
    
    const { playWhoosh, playDing, playClick } = useSound();
    const { showNotification } = useNotification();
    const { createMessage } = useCloakMessaging();

    const handleGenerate = () => {
        if (!text) return;
        setIsProcessing(true);
        playWhoosh();
        
        // Simulation of heavy encryption work
        setTimeout(() => {
            const id = createMessage(text, 'text', burnTimer);
            setGeneratedId(id);
            setText('');
            setIsProcessing(false);
            playDing();
            showNotification('Message Encrypted', 'success');
        }, 800);
    };

    const copyLink = () => {
        if (generatedId) {
            const link = `${window.location.origin}?cloak=${generatedId}`;
            navigator.clipboard.writeText(link);
            playClick();
            showNotification('Secure Link Copied', 'success');
        }
    };

    const handleSimulateView = () => {
        if (generatedId && onSimulateReceiver) {
            playClick();
            onSimulateReceiver(generatedId);
        }
    };

    const reset = () => {
        playClick();
        setGeneratedId(null);
    };

    const timerOptions = [
        { label: '30s', value: 30 },
        { label: '1m', value: 60 },
        { label: '5m', value: 300 }
    ];

    return (
        <div className="w-full h-full bg-white/[0.01] backdrop-blur-[40px] border border-white/10 rounded-[32px] p-8 flex flex-col relative overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                        <Icons.Cloak width={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-light text-white tracking-tight">Secure Composer</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-1 h-1 rounded-full bg-green-500" />
                            <span className="text-[10px] text-green-500 font-bold uppercase tracking-[0.2em]">Encrypted</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative flex-1 flex flex-col min-h-0 z-10">
                <AnimatePresence mode="wait">
                    {generatedId ? (
                        <motion.div
                            key="link"
                            initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex-1 flex flex-col items-center justify-center gap-10"
                        >
                            <div className="w-24 h-24 rounded-full bg-white/[0.03] border border-blue-500/30 flex items-center justify-center relative z-10 shadow-lg">
                                <Icons.Check width={32} className="text-blue-400" />
                            </div>
                            
                            <div className="text-center space-y-2">
                                <h3 className="text-2xl font-light text-white tracking-tight">Ready to Transmit</h3>
                                <p className="text-xs text-white/40 font-medium tracking-wide">
                                    Link self-destructs after {burnTimer}s.
                                </p>
                            </div>
                            
                            <div className="flex flex-col gap-3 w-full max-w-xs">
                                <button 
                                    onClick={copyLink}
                                    className="w-full py-4 bg-white text-black hover:bg-gray-200 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                >
                                    <Icons.Copy width={14} /> Copy Link
                                </button>
                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        onClick={handleSimulateView}
                                        className="py-4 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold text-white uppercase tracking-widest transition-all border border-white/5"
                                    >
                                        Test
                                    </button>
                                    <button 
                                        onClick={reset}
                                        className="py-4 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold text-white uppercase tracking-widest transition-all border border-white/5"
                                    >
                                        New
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="input"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col h-full"
                        >
                            <div className="flex-1 bg-transparent border-none p-0 mb-6 relative transition-colors">
                                <textarea 
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    onClick={playClick}
                                    placeholder="Enter classified message..."
                                    className="w-full h-full bg-transparent resize-none text-xl md:text-2xl font-light text-white/90 placeholder-white/10 focus:outline-none leading-relaxed"
                                />
                                <div className="absolute bottom-0 right-0 text-[9px] font-bold text-white/10 uppercase tracking-widest pointer-events-none">
                                    {text.length} Chars
                                </div>
                            </div>

                            {/* Footer Controls */}
                            <div className="flex flex-col gap-6 pt-6 border-t border-white/5">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Burn Timer</label>
                                    <div className="flex gap-2">
                                        {timerOptions.map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => { setBurnTimer(opt.value); playClick(); }}
                                                className={`px-3 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all ${
                                                    burnTimer === opt.value ? 'bg-white text-black' : 'bg-white/5 text-white/30 hover:text-white'
                                                }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button 
                                   onClick={handleGenerate}
                                   disabled={!text || isProcessing}
                                   className="w-full py-5 bg-white text-black rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
                                >
                                    {isProcessing ? (
                                        <span className="animate-pulse">Encrypting...</span>
                                    ) : (
                                        <>
                                            <Icons.Lock width={14} /> Generate Secure Link
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

const FileShredderPanel = () => {
    const [isHovering, setIsHovering] = useState(false);
    const [shredding, setShredding] = useState(false);
    const { playWhoosh, playDing } = useSound();
    const { showNotification } = useNotification();

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsHovering(false);
        setShredding(true);
        playWhoosh();
        
        setTimeout(() => {
            setShredding(false);
            playDing();
            showNotification('File Permanently Erased', 'success');
        }, 2000);
    };

    return (
        <div 
            onDragOver={(e) => { e.preventDefault(); setIsHovering(true); }}
            onDragLeave={() => setIsHovering(false)}
            onDrop={handleDrop}
            className={`
                w-full h-full bg-white/[0.01] backdrop-blur-[40px] border rounded-[32px] relative overflow-hidden flex flex-col items-center justify-center p-6 transition-all duration-300 group
                ${isHovering ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 hover:bg-white/[0.03]'}
            `}
        >
            <div className={`
                w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 relative z-10
                ${shredding ? 'bg-red-500 scale-110 shadow-[0_0_50px_rgba(239,68,68,0.6)] animate-pulse' : 'bg-white/[0.03] border border-white/10 group-hover:scale-110'}
            `}>
                <Icons.Trash width={24} className={`transition-colors ${shredding ? 'text-white' : 'text-white/30'}`} />
            </div>

            <div className="mt-6 text-center relative z-10">
                <h3 className={`text-xs font-bold mb-1 uppercase tracking-widest transition-colors ${shredding ? 'text-red-500' : 'text-white'}`}>
                    {shredding ? 'ERASING...' : 'Shredder'}
                </h3>
            </div>
        </div>
    );
};

export default TheCloak;
