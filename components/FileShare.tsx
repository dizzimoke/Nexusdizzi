
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode';
import { Icons, SPRING_CONFIG } from '../lib/constants';
import { useSound } from '../lib/sound';
import { useNotification } from './NotificationProvider';
import { uploadToVault } from '../lib/supabase';

const FileShareWidget: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);

  const { playWhoosh, playDing, playPop } = useSound();
  const { showNotification } = useNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = async (selectedFile: File) => {
     setFile(selectedFile);
     setIsUploading(true);
     setUploadProgress(0);
     playWhoosh(); // SFX: Start Transfer

     // Simulate Progress for Visuals
     const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
            if (prev >= 90) {
                clearInterval(progressInterval);
                return 90;
            }
            return prev + 10;
        });
     }, 150);

     try {
         // Fix: Added missing bucket argument 'nexus-air' to uploadToVault call
         const { publicUrl } = await uploadToVault(selectedFile, 'nexus-air');
         const url = publicUrl;
         
         // Complete
         clearInterval(progressInterval);
         setUploadProgress(100);
         setShareUrl(url);
         
         // Generate QR
         const qr = await QRCode.toDataURL(url, { margin: 2, width: 256, color: { dark: '#000000', light: '#ffffff' } });
         setQrCode(qr);

         playDing(); // SFX: Success
         showNotification('File Ready for Transfer', 'success');
     } catch (error) {
         console.error(error);
         showNotification('Transfer Failed', 'reminder');
         setFile(null);
     } finally {
         setIsUploading(false);
     }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) processFile(droppedFile);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) processFile(selectedFile);
  };

  const reset = () => {
    setFile(null);
    setShareUrl(null);
    setQrCode(null);
    setUploadProgress(0);
    playPop();
  };

  return (
    <div className="h-full flex flex-col justify-between relative">
        {/* Main Drop Zone */}
        <AnimatePresence mode="wait">
            {!shareUrl ? (
                <motion.div
                   key="dropzone"
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   onDragOver={handleDragOver}
                   onDragLeave={handleDragLeave}
                   onDrop={handleDrop}
                   onClick={() => !isUploading && fileInputRef.current?.click()}
                   className={`
                       relative flex-1 rounded-[2rem] border-2 border-dashed transition-all duration-500 flex flex-col items-center justify-center gap-6 p-6 cursor-pointer group overflow-hidden
                       ${isDragging ? 'border-cyan-400 bg-cyan-400/10 scale-[1.02]' : 'border-white/10 hover:border-white/30 hover:bg-white/5'}
                   `}
                >
                   {/* Background Pulse Effect on Drag */}
                   {isDragging && (
                       <motion.div 
                          layoutId="drag-pulse"
                          className="absolute inset-0 bg-cyan-400/20 blur-3xl rounded-full"
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1.5, opacity: 1 }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                       />
                   )}

                   {/* Icon Animation */}
                   <motion.div
                      animate={isUploading ? { y: [0, -20, 0] } : { y: 0 }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className={`relative z-10 w-20 h-20 rounded-3xl flex items-center justify-center transition-colors duration-500
                         ${isDragging ? 'bg-cyan-400 text-black shadow-[0_0_30px_rgba(34,211,238,0.5)]' : 'bg-white/5 text-white/50 border border-white/10 group-hover:bg-white/10 group-hover:text-white'}
                      `}
                   >
                       {isUploading ? (
                           <span className="font-bold text-2xl tracking-tighter">{Math.round(uploadProgress)}%</span>
                       ) : (
                           <Icons.CloudUpload width={40} height={40} />
                       )}
                   </motion.div>

                   {/* Text Status */}
                   <div className="text-center relative z-10">
                       <h3 className="text-lg font-bold text-white mb-1">
                           {isUploading ? 'Securing Data...' : (isDragging ? 'Drop to Upload' : 'AirDrop Share')}
                       </h3>
                       <p className="text-xs font-medium text-white/30 uppercase tracking-widest">
                           {isUploading ? 'Encryption Active' : 'Drag & Drop or Tap'}
                       </p>
                   </div>

                   {/* Progress Bar */}
                   {isUploading && (
                       <div className="absolute bottom-0 left-0 right-0 h-2 bg-white/5">
                           <motion.div 
                               className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_20px_rgba(34,211,238,0.5)]"
                               initial={{ width: 0 }}
                               animate={{ width: `${uploadProgress}%` }}
                           />
                       </div>
                   )}

                   <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
                </motion.div>
            ) : (
                <motion.div
                   key="success"
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.9 }}
                   className="flex-1 flex flex-col items-center relative"
                >
                    {/* Header */}
                    <div className="text-center mb-6">
                        <h3 className="text-xl font-bold text-white tracking-tight truncate max-w-[200px] mx-auto">{file?.name}</h3>
                        <p className="text-xs text-cyan-400 font-bold uppercase tracking-[0.2em] mt-1">Ready to Scan</p>
                    </div>

                    {/* QR Card - With Pulsating Border */}
                    <div className="bg-white p-4 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.5)] relative group mb-6 border-[3px] border-cyan-400/50 animate-pulse">
                        <div className="absolute -inset-1 bg-gradient-to-tr from-cyan-400 to-blue-500 rounded-[2.8rem] opacity-50 blur-xl group-hover:opacity-80 transition-opacity" />
                        <div className="relative bg-white rounded-[2rem] overflow-hidden p-2">
                             {qrCode && <img src={qrCode} alt="Share QR" className="w-40 h-40 mix-blend-multiply" />}
                        </div>
                    </div>

                    {/* Footer Actions & Status (Separated) */}
                    <div className="w-full flex flex-col gap-4">
                        <div className="flex items-center justify-center gap-2">
                             <div className="px-3 py-1 bg-white/5 rounded-full backdrop-blur-md border border-white/10 flex items-center gap-2">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
                                    Expires 1h
                                </span>
                             </div>
                        </div>

                        <div className="flex gap-3 justify-center">
                            <button 
                                onClick={() => {
                                    if (shareUrl) {
                                        navigator.clipboard.writeText(shareUrl);
                                        showNotification('Link Copied', 'info');
                                    }
                                }}
                                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors"
                            >
                                Copy Link
                            </button>
                            <button 
                                onClick={reset}
                                className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
};

export default FileShareWidget;
