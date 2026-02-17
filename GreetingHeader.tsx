import React from 'react';
import { motion } from 'framer-motion';
import { useTasks } from '../lib/hooks';

const GreetingHeader: React.FC = () => {
  const { tasks } = useTasks();
  
  const hour = new Date().getHours();
  let greeting = 'Good Morning';
  if (hour >= 12 && hour < 18) greeting = 'Good Afternoon';
  else if (hour >= 18) greeting = 'Good Evening';

  const today = new Date().toISOString().split('T')[0];
  const pendingTasks = tasks.filter(t => t.date === today && !t.is_completed).length;

  return (
    <div className="mb-8 mt-2 px-2">
      <motion.h2 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-thin tracking-tight text-white/90"
      >
        {greeting}
      </motion.h2>
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-sm text-white/50 font-medium mt-1 tracking-wide"
      >
        {pendingTasks > 0 
          ? `You have ${pendingTasks} tasks scheduled for today.` 
          : "Your schedule is clear. Enjoy the focus."}
      </motion.p>
    </div>
  );
};

export default GreetingHeader;