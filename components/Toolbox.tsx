
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Tesseract from 'tesseract.js';
import QRCode from 'qrcode';
import { Icons, SPRING_CONFIG } from '../lib/constants';
import { useSound } from '../lib/sound';
import CalendarComponent from './CalendarComponent';
import GreetingHeader from './GreetingHeader';
import { useNotification } from './NotificationProvider';
import FileShareWidget from './FileShare';
import MediaDownloader from './MediaDownloader';
import ArchiveSqueezer from './ArchiveSqueezer';

type WidgetId = 'stream' | 'calendar' | 'currency' | 'image' | 'ocr' | 'clock' | 'qr' | 'fileshare' | 'downloader' | 'squeezer';

interface ToolboxProps {
    onFocusChange?: (focused: boolean) => void;
    zenMode?: boolean;
    setZenMode?: (active: boolean) => void;
    setZenPlaylist?: (id: string) => void;
}

const Toolbox: React.FC<ToolboxProps> = ({ onFocusChange, zenMode, setZenMode, setZenPlaylist }) => {
  const [activeWidget, setActiveWidget] = useState<WidgetId | null>(null);
  const { playPop } = useSound();

  // Notify parent of focus state change
  useEffect(() => {
    if (onFocusChange) {
        onFocusChange(!!activeWidget);
    }
  }, [activeWidget, onFocusChange]);

  // Widget Configuration
  const widgets = [
    { 
      id: 'clock' as const, 
      title: 'Clock', 
      icon: Icons.Clock, 
      color: 'text-white', 
      component: ClockWidget, 
      span: 'col-span-2',
      description: "Synchronize local and global temporal data in real-time.",
      accent: "shadow-white/20"
    },
    { 
      id: 'downloader' as const, 
      title: 'Media Saver', 
      icon: Icons.Download, 
      color: 'text-rose-400', 
      component: MediaDownloader, 
      span: 'col-span-2',
      description: "Archive and download external media assets locally.",
      accent: "shadow-rose-500/20"
    },
    { 
      id: 'squeezer' as const, 
      title: 'Squeezer', 
      icon: Icons.Zipper, 
      color: 'text-lime-400', 
      component: ArchiveSqueezer, 
      span: 'col-span-1',
      description: "Compress and optimize data.",
      accent: "shadow-lime-500/20"
    },
    { 
      id: 'fileshare' as const, 
      title: 'AirDrop', 
      icon: Icons.CloudUpload, 
      color: 'text-nexus-cyan', 
      component: FileShareWidget, 
      span: 'col-span-1',
      description: "Instant wireless transfer.",
      accent: "shadow-nexus-cyan/20"
    },
    { 
      id: 'calendar' as const, 
      title: 'Calendar', 
      icon: Icons.Calendar, 
      color: 'text-blue-400', 
      component: CalendarComponent,
      description: "Log priority parameters.",
      accent: "shadow-blue-500/20"
    },
    { 
      id: 'qr' as const, 
      title: 'QR Code', 
      icon: Icons.QrCode, 
      color: 'text-indigo-400', 
      component: QrWidget,
      description: "Generate encrypted links.",
      accent: "shadow-indigo-500/20"
    },
    { 
      id: 'stream' as const, 
      title: 'Nexus Stream', 
      icon: Icons.Youtube, 
      color: 'text-nexus-violet', 
      component: (props: any) => <NexusStreamWidget {...props} zenMode={zenMode} setZenMode={setZenMode} />,
      description: "Professional YouTube playlist player.",
      accent: "shadow-nexus-violet/20"
    },
    { 
      id: 'currency' as const, 
      title: 'Currency', 
      icon: Icons.Currency, 
      color: 'text-emerald-400', 
      component: CurrencyWidget,
      description: "Track global assets.",
      accent: "shadow-emerald-500/20"
    },
    { 
      id: 'image' as const, 
      title: 'Converter', 
      icon: Icons.Image, 
      color: 'text-pink-400', 
      component: ImageConverterWidget,
      description: "Translate data formats.",
      accent: "shadow-pink-500/20"
    },
    { 
      id: 'ocr' as const, 
      title: 'Scanner', 
      icon: Icons.Scan, 
      color: 'text-yellow-400', 
      component: OCRWidget,
      description: "Identify signatures.",
      accent: "shadow-yellow-500/20"
    },
  ];

  return (
    <div className="w-full flex flex-col">
      <GreetingHeader />

      {/* High-Performance Responsive Grid */}
      <div 
        className="grid gap-6 md:gap-8 auto-rows-[200px] md:auto-rows-[240px] w-full max-w-7xl"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}
      >
        {widgets.map((widget) => (
          <motion.div
            layoutId={`card-container-${widget.id}`}
            key={widget.id}
            onClick={() => {
                setActiveWidget(widget.id);
                playPop();
            }}
            whileHover={{ 
                scale: 1.02,
                y: -5
            }}
            whileTap={{ scale: 0.98 }}
            className={`glass-panel rounded-[2rem] p-8 flex flex-col justify-between cursor-pointer group transition-all duration-300 relative overflow-hidden ${widget.span || ''} hover:${widget.accent}`}
          >
             {/* Dynamic Glow Background on Hover */}
             <div className={`absolute -right-12 -top-12 w-48 h-48 ${widget.color.replace('text-', 'bg-')} opacity-0 group-hover:opacity-10 blur-[80px] rounded-full transition-opacity duration-700`} />
             
             <motion.div layoutId={`card-icon-${widget.id}`} className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center ${widget.color} backdrop-blur-md border border-white/5 group-hover:border-white/20 transition-all shrink-0 shadow-inner`}>
                <widget.icon width={24} height={24} />
             </motion.div>
             
             <div className="flex flex-col justify-end mt-4 relative z-10">
                 <div className="flex items-end justify-between">
                     <motion.h3 layoutId={`card-title-${widget.id}`} className="text-2xl font-bold text-white tracking-tight drop-shadow-lg">
                        {widget.title}
                     </motion.h3>
                     {widget.id === 'clock' && <ClockPreview />}
                 </div>
                 <motion.div layoutId={`card-separator-${widget.id}`} className="w-8 h-0.5 bg-white/10 my-2 group-hover:w-full group-hover:bg-white/20 transition-all duration-500" />
                 <motion.p 
                    initial={{ opacity: 0.5 }}
                    whileHover={{ opacity: 1 }}
                    className="text-[11px] text-white/60 font-medium leading-relaxed"
                 >
                    {widget.description}
                 </motion.p>
             </div>
          </motion.div>
        ))}
      </div>

      {/* Expansion Overlay */}
      <AnimatePresence>
        {activeWidget && (
           <>
             <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.15, ease: "easeOut" } }}
                className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60]"
                onClick={() => setActiveWidget(null)}
             />
             <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 pointer-events-none">
                {widgets.filter(w => w.id === activeWidget).map(widget => (
                   <motion.div
                     layoutId={`card-container-${widget.id}`}
                     key={widget.id}
                     exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.1, ease: "circOut" } }}
                     className={`pointer-events-auto w-full bg-[#08080a] rounded-[3rem] p-8 lg:p-10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative overflow-hidden border border-white/10 
                        ${widget.id === 'stream' 
                            ? 'max-w-[700px] h-[500px]' 
                            : 'max-w-lg lg:max-w-[500px] lg:max-h-[450px]'
                        }`}
                     transition={SPRING_CONFIG}
                   >
                      {/* Inner Glow */}
                      <div className={`absolute top-0 right-0 w-[300px] h-[300px] ${widget.color.replace('text-', 'bg-')} opacity-10 blur-[120px] pointer-events-none`} />

                      <button 
                        onClick={(e) => { e.stopPropagation(); setActiveWidget(null); }}
                        className="absolute top-8 right-8 p-3 bg-white/5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all z-20 active:scale-90 border border-white/5"
                      >
                         <Icons.Close width={20} height={20} />
                      </button>

                      <div className={`flex flex-col ${widget.id === 'stream' ? 'h-full' : 'h-full lg:h-auto lg:min-h-0 min-h-[450px]'} relative z-10`}>
                         <div className="flex items-center gap-6 mb-8">
                            <motion.div layoutId={`card-icon-${widget.id}`} className={`w-16 h-16 rounded-[1.5rem] bg-white/5 flex items-center justify-center ${widget.color} border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.2)]`}>
                               <widget.icon width={32} height={32} />
                            </motion.div>
                            <div>
                               <motion.h3 layoutId={`card-title-${widget.id}`} className="text-3xl font-bold text-white tracking-tighter">
                                  {widget.title}
                               </motion.h3>
                               <motion.div layoutId={`card-separator-${widget.id}`} className="w-12 h-0.5 bg-white/20 mt-2" />
                            </div>
                         </div>

                         <motion.div 
                           initial={{ opacity: 0, scale: 0.95 }}
                           animate={{ opacity: 1, scale: 1 }}
                           exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15, ease: "circOut" } }}
                           transition={{ delay: 0.1 }}
                           className="flex-1 overflow-y-auto no-scrollbar"
                         >
                            <widget.component />
                         </motion.div>
                      </div>
                   </motion.div>
                ))}
             </div>
           </>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Widget Components ---

const ClockPreview = () => {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    return (
        <span className="text-5xl font-thin tracking-tighter opacity-20 mr-2 tabular-nums select-none text-white drop-shadow-md">
           {time.toLocaleTimeString([], { hour: '2-digit', minute:'2-digit', hour12: false })}
        </span>
    );
};

const ClockWidget = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');
  const date = time.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-6 lg:space-y-4">
        <div className="flex items-baseline gap-4 tabular-nums">
            <span className="text-7xl lg:text-8xl font-thin tracking-tighter text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                {hours}
            </span>
            <span className="text-4xl font-thin text-white/30 animate-pulse">:</span>
            <span className="text-7xl lg:text-8xl font-thin tracking-tighter text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                {minutes}
            </span>
            <div className="flex flex-col justify-end h-16 pl-4">
                <span className="text-3xl font-medium text-white/30">{seconds}</span>
            </div>
        </div>
        <div className="text-white/40 font-bold tracking-[0.3em] uppercase text-[10px] lg:text-[11px] border-t border-white/10 pt-6 w-full text-center">
            {date}
        </div>
    </div>
  );
};

const QrWidget = () => {
    const [text, setText] = useState('');
    const [qrUrl, setQrUrl] = useState('');
    const { showNotification } = useNotification();
    const { playDing, playPop } = useSound();

    const generate = async () => {
        if (!text) return;
        try {
            const url = await QRCode.toDataURL(text, { 
                margin: 2,
                width: 400,
                color: {
                    dark: '#000000',
                    light: '#ffffff'
                }
            });
            setQrUrl(url);
            playDing();
            showNotification('Matrix Generated', 'success');
        } catch (err) {
            console.error(err);
        }
    };

    const handleDownload = () => {
        if (!qrUrl) return;
        const link = document.createElement('a');
        link.download = `nexus_qr_${Date.now()}.png`;
        link.href = qrUrl;
        link.click();
        playPop();
        showNotification('QR Saved to Disk', 'success');
    };

    const handleCopy = async () => {
        if (!qrUrl) return;
        try {
            const blob = await (await fetch(qrUrl)).blob();
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
            playPop();
            showNotification('QR Image Copied', 'success');
        } catch (e) {
            showNotification('Copy Failed', 'reminder');
        }
    };

    return (
        <div className="space-y-4 pt-2">
            <div className="flex gap-2">
                <input 
                   value={text}
                   onChange={(e) => setText(e.target.value)}
                   placeholder="Enter Data Stream..."
                   className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm font-mono text-white placeholder-white/20 focus:outline-none focus:border-indigo-500 transition-colors"
                   onKeyDown={(e) => e.key === 'Enter' && generate()}
                />
                <button 
                   onClick={generate}
                   className="px-4 bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-400 border border-indigo-500/50 rounded-2xl font-bold hover:brightness-110 active:scale-95 transition-all"
                >
                   <Icons.ArrowRight width={20} height={20} />
                </button>
            </div>
            
            <div className="w-full aspect-video lg:aspect-[16/9] bg-black/40 rounded-[2rem] flex items-center justify-center border border-white/10 overflow-hidden relative group">
                {/* Cyber Grid Background */}
                <div className="absolute inset-0 z-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                
                {qrUrl ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative z-10 flex gap-6 items-center"
                    >
                        <div className="p-3 bg-white rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                            <img src={qrUrl} alt="QR Code" className="w-28 h-28 object-contain" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <button onClick={handleDownload} className="p-2 bg-indigo-500 hover:bg-indigo-400 rounded-lg text-white shadow-lg transition-all" title="Download">
                                <Icons.Download width={16} />
                            </button>
                            <button onClick={handleCopy} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all" title="Copy">
                                <Icons.Copy width={16} />
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <div className="flex flex-col items-center gap-2 text-white/10 z-10">
                        <Icons.QrCode width={48} height={48} />
                        <span className="text-[10px] font-bold tracking-widest uppercase">System Ready</span>
                    </div>
                )}
            </div>
        </div>
    );
}

const NexusStreamWidget = ({ zenMode, setZenMode }: any) => {
  const [isPlaying, setIsPlaying] = useState(false);
  // Initialize from storage to prevent snap-back on load
  const [volume, setVolume] = useState(() => {
      const saved = localStorage.getItem('nexus_stream_vol');
      return saved ? parseInt(saved) : 100;
  });
  const [streamId, setStreamId] = useState(() => localStorage.getItem('nexus_stream_id') || 'jfKfPfyJRdk');
  
  const { showNotification } = useNotification();
  const { playClick, playDing } = useSound();

  const dispatchCommand = (command: string, value?: any) => {
      const evt = new CustomEvent('nexus-cmd', { detail: { command, value } });
      window.dispatchEvent(evt);
  };

  // Holographic Mode: Trigger on mount/unmount
  useEffect(() => {
      dispatchCommand('focus', true);
      return () => {
          dispatchCommand('focus', false);
      };
  }, []);

  // Sync with Global Player state
  useEffect(() => {
      const handleStateUpdate = (e: CustomEvent) => {
          // YT State: 1 = Playing, 2 = Paused, 3 = Buffering
          const newState = e.detail.state;
          if (newState === 1) setIsPlaying(true);
          if (newState === 2) setIsPlaying(false);
          
          // Only sync volume from event if it differs significantly to prevent jitter/loops
          if (e.detail.volume !== undefined) {
              setVolume((prev) => Math.abs(prev - e.detail.volume) > 2 ? e.detail.volume : prev);
          }
      };
      window.addEventListener('nexus-state-update' as any, handleStateUpdate);
      return () => window.removeEventListener('nexus-state-update' as any, handleStateUpdate);
  }, []);

  const togglePlay = () => {
      // Toggle local state optimistically for UI response
      setIsPlaying(!isPlaying);
      dispatchCommand(isPlaying ? 'pause' : 'play');
      playClick();
  };

  const handleSkip = (direction: 'next' | 'prev') => {
      dispatchCommand(direction);
      playClick();
  };

  const handleVolume = (val: number) => {
      setVolume(val); // Immediate UI update
      dispatchCommand('volume', val); // Dispatch to player
  };

  const handleFocusToggle = () => {
      setZenMode?.(!zenMode);
      playClick();
  };

  const handleSource = () => {
      playClick();
      const input = window.prompt("Paste YouTube Video or Playlist URL/ID:", streamId);
      if (input) {
          let newId = input.trim();
          // Extract ID logic
          const listMatch = newId.match(/[?&]list=([^#\&\?]+)/);
          if (listMatch) {
              newId = listMatch[1];
          } else {
              const vMatch = newId.match(/[?&]v=([^#\&\?]+)/);
              if (vMatch) newId = vMatch[1];
              else {
                  const sMatch = newId.match(/youtu\.be\/([^#\&\?]+)/);
                  if (sMatch) newId = sMatch[1];
              }
          }

          setStreamId(newId);
          localStorage.setItem('nexus_stream_id', newId);
          
          dispatchCommand('load', newId);
          playDing();
          showNotification('Stream Signal Synced', 'success');
      }
  };

  const getVolumeIcon = () => {
      if (volume === 0) return <Icons.VolumeX width={20} />;
      if (volume < 50) return <Icons.Volume1 width={20} />;
      return <Icons.Volume2 width={20} />;
  };

  return (
      <div className="space-y-4 h-full flex flex-col">
        {/* Holographic Window Area - Transparent to see Global Player underneath */}
        <div className="rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl relative flex-1 w-full group flex flex-col items-center justify-center bg-transparent">
            {/* Minimal Overlay Info (Only when not playing or hovered) */}
            <div className={`absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 transition-opacity duration-500 z-10 ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                    <span className="text-[9px] font-bold text-white uppercase tracking-widest">
                        {isPlaying ? 'LIVE FEED' : 'PAUSED'}
                    </span>
                </div>
            </div>
            
            {/* Central Play/Pause for huge click area if needed, though we use the bottom bar mostly */}
            <div className={`transition-opacity duration-300 ${isPlaying ? 'opacity-0' : 'opacity-100'}`}>
                 <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center pointer-events-none">
                     <Icons.Play width={32} className="text-white ml-1" />
                 </div>
            </div>
        </div>
        
        {/* Controls Bar */}
        <div className="flex flex-col gap-4 px-2">
            
            {/* Volume Slider */}
            <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/5">
                <button 
                    onClick={() => handleVolume(volume === 0 ? 100 : 0)}
                    className="text-white/50 hover:text-white transition-colors"
                >
                    {getVolumeIcon()}
                </button>
                <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={volume}
                    onChange={(e) => handleVolume(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-nexus-violet hover:accent-violet-400 transition-all"
                />
            </div>

            <div className="flex gap-4 h-16 shrink-0 items-center justify-between">
                <div className="flex gap-2">
                     <button 
                        onClick={() => handleSkip('prev')}
                        className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-all active:scale-95 border border-white/5"
                     >
                        <Icons.SkipBack width={20} />
                     </button>
                     
                     <button 
                        onClick={togglePlay}
                        className={`w-16 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-lg ${isPlaying ? 'bg-nexus-violet text-white shadow-nexus-violet/20' : 'bg-white text-black'}`}
                     >
                        {isPlaying ? <Icons.Pause width={20} /> : <Icons.Play width={20} />}
                     </button>

                     <button 
                        onClick={() => handleSkip('next')}
                        className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-all active:scale-95 border border-white/5"
                     >
                        <Icons.SkipForward width={20} />
                     </button>
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={handleSource}
                        className="h-12 px-5 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white border border-white/5 transition-all flex items-center gap-2"
                    >
                        <Icons.Settings width={14} /> Source
                    </button>
                    <button 
                        onClick={handleFocusToggle}
                        className={`h-12 px-5 rounded-2xl text-[10px] font-bold uppercase tracking-widest border transition-all flex items-center gap-2 ${zenMode ? 'bg-white text-black border-white' : 'bg-white/5 text-white/40 border-white/5 hover:text-white'}`}
                    >
                        {zenMode ? 'Focus On' : 'Focus Off'}
                    </button>
                </div>
            </div>
        </div>
      </div>
  );
};

const CurrencyWidget = () => {
  const [rates, setRates] = useState<Record<string, number>>({});
  const [amount, setAmount] = useState<string>('1');
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('BRL');
  const [loading, setLoading] = useState(true);
  const [updated, setUpdated] = useState(false);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const pairs = ['USD-BRL', 'EUR-BRL', 'GBP-BRL', 'BTC-BRL', 'ETH-BRL', 'JPY-BRL', 'SOL-BRL'].join(',');
        const res = await fetch(`https://economia.awesomeapi.com.br/last/${pairs}`);
        const data = await res.json();
        
        const newRates: Record<string, number> = {
          'BRL': 1,
          'USD': parseFloat(data.USDBRL.bid),
          'EUR': parseFloat(data.EURBRL.bid),
          'GBP': parseFloat(data.GBPBRL.bid),
          'BTC': parseFloat(data.BTCBRL.bid),
          'ETH': parseFloat(data.ETHBRL.bid),
          'JPY': parseFloat(data.JPYBRL.bid),
          'SOL': parseFloat(data.SOLBRL?.bid || '0')
        };
        if (!newRates['SOL']) newRates['SOL'] = 100;

        setRates(newRates);
        setLoading(false);
      } catch (e) {
        console.error("Currency fetch failed", e);
      }
    };
    fetchRates();
  }, []);

  const result = (rates[from] && rates[to] && !isNaN(parseFloat(amount)))
    ? ((parseFloat(amount) * rates[from]) / rates[to])
    : null;

  useEffect(() => {
      setUpdated(true);
      const t = setTimeout(() => setUpdated(false), 500);
      return () => clearTimeout(t);
  }, [result]);

  const currencies = ['USD','BRL','EUR','GBP','BTC','ETH','SOL','JPY'];

  return (
      <div className="space-y-4 pt-2">
         <div className="grid grid-cols-1 gap-2">
             <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                 <div className="flex items-center justify-between">
                     <select value={from} onChange={e => setFrom(e.target.value)} className="bg-black/40 px-2 py-1 rounded-lg text-lg font-bold text-amber-500 font-mono focus:outline-none border border-white/5">
                         {currencies.map(c => <option key={c} value={c} className="text-white bg-black">{c}</option>)}
                     </select>
                     <input 
                       type="number" 
                       value={amount}
                       onChange={e => setAmount(e.target.value)}
                       className="bg-transparent text-right text-2xl font-mono text-white focus:outline-none w-28 tracking-tighter"
                     />
                 </div>
             </div>
             
             {/* Glowing Arrow */}
             <div className="flex justify-center relative -my-4 z-10">
                 <div className={`bg-[#111] border border-white/10 rounded-full p-2 transition-all duration-300 ${updated ? 'shadow-[0_0_20px_#f59e0b] border-amber-500' : ''}`}>
                     <Icons.ArrowDown className={`${updated ? 'text-amber-500' : 'text-emerald-400'}`} width={16} height={16} />
                 </div>
             </div>

             <div className="bg-emerald-500/5 rounded-2xl p-4 border border-emerald-500/20">
                 <div className="flex items-center justify-between">
                     <select value={to} onChange={e => setTo(e.target.value)} className="bg-black/40 px-2 py-1 rounded-lg text-lg font-bold text-emerald-400 font-mono focus:outline-none border border-emerald-500/20">
                         {currencies.map(c => <option key={c} value={c} className="text-white bg-black">{c}</option>)}
                     </select>
                     <span className={`text-2xl font-mono text-emerald-400 tracking-tighter transition-all ${updated ? 'blur-[1px]' : ''}`}>
                         {result !== null ? result.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '...'}
                     </span>
                 </div>
             </div>
         </div>
      </div>
  );
};

const ImageConverterWidget = () => {
  const [image, setImage] = useState<string | null>(null);
  const [format, setFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');
  const { showNotification } = useNotification();
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };
  const convertAndDownload = () => {
    if (!image) return;
    const img = new Image();
    img.src = image;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL(format, 0.9);
        const link = document.createElement('a');
        link.download = `nexus_converted.${format.split('/')[1]}`;
        link.href = dataUrl;
        link.click();
        showNotification('Conversion Completed', 'success');
      }
    };
  };
  return (
    <div className="space-y-4">
      {!image ? (
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-3xl cursor-pointer hover:bg-white/5 transition-all">
            <Icons.Image className="text-white/10 mb-2" width={32} height={32} />
            <span className="text-[9px] text-white/20 font-bold uppercase tracking-widest text-center">Load Media</span>
            <input type="file" className="hidden" accept="image/*" onChange={handleFile} />
          </label>
        ) : (
          <div className="relative h-32 w-full rounded-3xl overflow-hidden bg-black/50 border border-white/10 group">
            <img src={image} alt="Preview" className="w-full h-full object-cover opacity-60" />
            <button onClick={() => setImage(null)} className="absolute top-2 right-2 bg-black/60 text-white p-2 rounded-full backdrop-blur-md">
              <Icons.Close width={12} height={12} />
            </button>
          </div>
        )}
        <div className="grid grid-cols-3 gap-2">
          {['JPEG', 'PNG', 'WEBP'].map((fmt) => (
            <button
              key={fmt}
              onClick={() => setFormat(`image/${fmt.toLowerCase()}` as any)}
              className={`py-2 text-[9px] font-bold tracking-[0.2em] uppercase rounded-xl transition-all ${
                format === `image/${fmt.toLowerCase()}` ? 'bg-white text-black' : 'bg-white/5 text-white/20 hover:text-white'
              }`}
            >
              {fmt}
            </button>
          ))}
        </div>
        <button
          onClick={convertAndDownload}
          disabled={!image}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl text-[9px] font-bold uppercase tracking-[0.3em] text-white disabled:opacity-20 transition-all shadow-lg shadow-indigo-500/30"
        >
          Execute
        </button>
    </div>
  );
};

const OCRWidget = () => {
  const [text, setText] = useState('');
  const [scanning, setScanning] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showNotification } = useNotification();
  const { playWhoosh, playDing } = useSound();

  // Handle Ctrl+V Paste
  useEffect(() => {
      const handlePaste = async (e: ClipboardEvent) => {
          const items = e.clipboardData?.items;
          if (!items) return;
          for (const item of items) {
              if (item.type.indexOf('image') !== -1) {
                  const blob = item.getAsFile();
                  if (blob) {
                      await processFile(blob);
                  }
              }
          }
      };
      window.addEventListener('paste', handlePaste);
      return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const processFile = async (file: File) => {
      // Preview
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);

      setScanning(true);
      playWhoosh();
      try {
        const { data: { text } } = await Tesseract.recognize(file, 'eng');
        setText(text);
        playDing();
        showNotification('Text Extraction Complete', 'success');
      } catch (err) {
        setText('Recognition failed.');
      } finally {
        setScanning(false);
      }
  };

  const handleOCR = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processFile(file);
  };

  return (
    <div className="space-y-4">
        <div className="flex gap-4">
            <div className="flex-1 p-4 bg-black/40 border border-white/5 rounded-2xl min-h-[100px] max-h-[150px] overflow-y-auto text-[10px] text-white/70 font-mono no-scrollbar leading-relaxed">
              {scanning ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-yellow-400">
                   <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                   <span className="text-[9px] font-bold uppercase tracking-[0.3em]">Scanning</span>
                </div>
              ) : (
                text || <span className="text-white/10 italic text-[9px] uppercase tracking-widest font-bold">Paste Image (Ctrl+V) or Load...</span>
              )}
            </div>
            {/* Image Thumbnail */}
            <div className="w-24 bg-white/5 rounded-2xl border border-white/10 overflow-hidden flex items-center justify-center relative">
                {preview ? (
                    <img src={preview} alt="Scan Target" className="w-full h-full object-cover opacity-80" />
                ) : (
                    <Icons.Image width={20} className="text-white/10" />
                )}
                {scanning && <div className="absolute inset-0 bg-yellow-400/10 animate-pulse" />}
            </div>
        </div>

        <div className="flex gap-2">
           <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-3 bg-white/5 rounded-2xl text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 border border-white/5 hover:bg-white/10 transition-colors">
             <Icons.Scan width={14} height={14} /> Load File
           </button>
           {text && (
             <button onClick={() => { navigator.clipboard.writeText(text); showNotification('Copied', 'info'); }} className="px-4 bg-yellow-400/5 text-yellow-400 border border-yellow-400/10 rounded-2xl hover:bg-yellow-400/10 transition-colors">
               <Icons.Copy width={16} height={16} />
             </button>
           )}
        </div>
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleOCR} />
    </div>
  );
};

export default Toolbox;
