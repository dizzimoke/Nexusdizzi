import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '../lib/constants';

type NotificationType = 'success' | 'info' | 'reminder';

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
}

interface NotificationContextType {
  showNotification: (message: string, type?: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queue, setQueue] = useState<Notification[]>([]);
  const [current, setCurrent] = useState<Notification | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dynamic Island Spring Physics
  const islandSpring = {
    type: "spring",
    stiffness: 300,
    damping: 25,
    mass: 0.8
  };

  const showNotification = useCallback((message: string, type: NotificationType = 'info') => {
    setQueue((prev) => {
      // Smart Deduplication: Don't add if the exact same message is already pending or currently showing
      const isPending = prev.some(n => n.message === message);
      const isCurrent = current?.message === message;
      
      if (isPending || isCurrent) return prev;

      return [...prev, { id: Date.now().toString(), type, message }];
    });
  }, [current]);

  // Queue Processor
  useEffect(() => {
    if (!current && queue.length > 0) {
      const nextNotification = queue[0];
      setQueue((prev) => prev.slice(1));
      setCurrent(nextNotification);

      // Auto-dismiss after 3 seconds
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setCurrent(null);
      }, 3000);
    }
  }, [queue, current]);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <div className="fixed top-4 left-0 right-0 z-[9999] flex justify-center pointer-events-none">
        <AnimatePresence mode="wait">
          {current && (
            <motion.div
              key={current.id}
              layout
              initial={{ opacity: 0, scale: 0.5, y: -20, width: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0, width: 'auto' }}
              exit={{ opacity: 0, scale: 0.9, y: -10, filter: 'blur(5px)' }}
              transition={islandSpring}
              className="bg-black backdrop-blur-2xl border border-white/10 rounded-full py-3 pl-4 pr-6 flex items-center gap-4 shadow-[0_10px_40px_rgba(0,0,0,0.6)]"
            >
              {/* Animated Status Icon */}
              <motion.div 
                 initial={{ scale: 0, rotate: -45 }}
                 animate={{ scale: 1, rotate: 0 }}
                 transition={{ delay: 0.1, type: "spring" }}
                 className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    current.type === 'success' ? 'bg-emerald-500 text-black' :
                    current.type === 'reminder' ? 'bg-purple-500 text-white' :
                    'bg-blue-500 text-white'
                 }`}
              >
                 {current.type === 'success' && <Icons.Check width={12} strokeWidth={3} />}
                 {current.type === 'reminder' && <Icons.Clock width={12} strokeWidth={3} />}
                 {current.type === 'info' && <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
              </motion.div>

              {/* Text Content */}
              <div className="flex flex-col">
                <motion.span 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-xs font-semibold text-white tracking-tight leading-none whitespace-nowrap"
                >
                  {current.message}
                </motion.span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};