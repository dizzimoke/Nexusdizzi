
import React, { useState, useRef } from 'react';
import { useSound } from '../lib/sound';
import { NavItem } from '../App';

interface GhostSidebarProps {
    onNavigate: (id: string) => void;
    currentTab: string;
    navItems: NavItem[];
}

const GhostSidebar: React.FC<GhostSidebarProps> = ({ onNavigate, currentTab, navItems }) => {
    const [isOpen, setIsOpen] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { playTick, playWhoosh } = useSound();

    const handleEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (!isOpen) playWhoosh();
        setIsOpen(true);
    };

    const handleLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setIsOpen(false);
        }, 300);
    };

    return (
        <>
            {/* 1. Edge Trigger (Invisible Zone) */}
            <div 
                id="edge-trigger"
                className="hidden lg:block fixed top-0 right-0 w-[40px] h-screen z-[999999] bg-transparent"
                onMouseEnter={handleEnter}
                onMouseLeave={handleLeave}
            />

            {/* 2. Ghost Pill Menu */}
            <div
                id="ghost-sidebar"
                onMouseEnter={handleEnter}
                onMouseLeave={handleLeave}
                className="hidden lg:flex fixed top-1/2 -translate-y-1/2 w-[70px] flex-col items-center justify-center py-8 gap-5 bg-white/[0.03] backdrop-blur-[50px] border border-white/[0.08] rounded-[35px] shadow-[0_20px_80px_rgba(0,0,0,0.8)] z-[999999] transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1)"
                style={{ right: isOpen ? '20px' : '-100px', height: 'auto', minHeight: '600px' }}
            >
                {navItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => { if(onNavigate) onNavigate(item.id); playTick(); }}
                        className={`group relative p-3.5 rounded-2xl transition-all duration-300 ${currentTab === item.id ? 'bg-white text-black shadow-[0_0_25px_rgba(255,255,255,0.4)] scale-110' : 'text-white/40 hover:text-white hover:bg-white/10'}`}
                    >
                        <item.icon width={22} height={22} strokeWidth={currentTab === item.id ? 2.5 : 1.5} />
                        
                        {/* Hover Tooltip */}
                        <span className="absolute right-full mr-6 top-1/2 -translate-y-1/2 bg-black/90 backdrop-blur-md px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10 pointer-events-none shadow-xl">
                            {item.label}
                        </span>
                    </button>
                ))}
            </div>
        </>
    );
};

export default GhostSidebar;
