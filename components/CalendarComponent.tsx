
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons, SPRING_CONFIG } from '../lib/constants';
import { useTasks } from '../lib/hooks';

// Helper: Get days in month
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

// Helper: Get day of week for the 1st of the month
const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

const CalendarComponent: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [isLightMode, setIsLightMode] = useState(false);
  
  const { tasks, addTask, toggleTask, deleteTask } = useTasks();

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Generate calendar grid
  const renderCalendarDays = () => {
    const days = [];
    
    // Empty slots for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 sm:h-10" />);
    }

    // "Today" check using local system time
    const now = new Date();
    const realDay = now.getDate();
    const realMonth = now.getMonth();
    const realYear = now.getFullYear();

    // Days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(currentYear, currentMonth, day);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const d = String(dateObj.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${d}`;
      
      const hasTask = tasks.some(t => t.date === dateStr && !t.is_completed);
      const isSelected = selectedDateStr === dateStr;
      
      // Strict check for "Today"
      const isToday = (day === realDay && currentMonth === realMonth && currentYear === realYear);

      // Styles
      const baseStyle = "relative h-8 sm:h-10 flex items-center justify-center rounded-full text-sm cursor-pointer transition-all";
      const lightText = isLightMode ? 'text-black/80' : 'text-white/80';
      const hoverStyle = isLightMode ? 'hover:bg-black/5' : 'hover:bg-white/10';
      
      // Today Highlight (Blue Glow)
      const todayStyle = "bg-blue-600 text-white font-bold shadow-[0_0_15px_rgba(37,99,235,0.6)] z-10";
      
      // Selection Ring
      const selectedStyle = isLightMode
        ? 'ring-2 ring-black/20 font-bold bg-black/5'
        : 'ring-1 ring-white/50 font-bold bg-white/10';

      days.push(
        <motion.div
          key={day}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedDateStr(dateStr);
          }}
          className={`
            ${baseStyle}
            ${isToday ? todayStyle : ''}
            ${isSelected && !isToday ? selectedStyle : ''}
            ${!isToday && !isSelected ? `${lightText} ${hoverStyle}` : ''}
          `}
        >
          {day}
          {/* Task Dot Indicator */}
          {hasTask && !isSelected && !isToday && (
            <div className={`absolute bottom-1 w-1 h-1 rounded-full ${isLightMode ? 'bg-black/40' : 'bg-white/40'}`} />
          )}
          {hasTask && isToday && (
             <div className="absolute bottom-1 w-1 h-1 bg-white rounded-full opacity-80" />
          )}
        </motion.div>
      );
    }
    return days;
  };

  return (
    <div className={`w-full h-full flex flex-col transition-all duration-500 ease-in-out ${isLightMode ? 'bg-[#F2F2F7] text-black rounded-3xl p-5 shadow-inner' : 'text-white'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className={`flex items-center gap-3 ${isLightMode ? 'text-black/50' : 'text-white/50'}`}>
          <Icons.Calendar width={18} height={18} />
          <span className="text-xs font-medium uppercase tracking-wider">Schedule</span>
        </div>
        
        <div className="flex items-center gap-2">
             {/* Mode Toggle */}
             <button 
                onClick={(e) => { e.stopPropagation(); setIsLightMode(!isLightMode); }}
                className={`p-1.5 rounded-full transition-colors ${isLightMode ? 'bg-white shadow-sm text-black/70' : 'bg-white/10 hover:bg-white/20 text-white/70'}`}
             >
                {isLightMode ? <Icons.Moon width={14} height={14} /> : <Icons.Sun width={14} height={14} />}
             </button>

             <div className={`w-px h-4 mx-1 ${isLightMode ? 'bg-black/10' : 'bg-white/20'}`} />

             <button onClick={handlePrevMonth} className={`p-1 rounded-full transition-colors ${isLightMode ? 'hover:bg-black/5 text-black/70' : 'hover:bg-white/10 text-white/70'}`}><Icons.ChevronLeft width={16} /></button>
             <span className="text-sm font-semibold w-24 text-center select-none">{monthNames[currentMonth]} {currentYear}</span>
             <button onClick={handleNextMonth} className={`p-1 rounded-full transition-colors ${isLightMode ? 'hover:bg-black/5 text-black/70' : 'hover:bg-white/10 text-white/70'}`}><Icons.ChevronRight width={16} /></button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 mb-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className={`text-center text-[10px] font-medium uppercase ${isLightMode ? 'text-black/30' : 'text-white/30'}`}>{d}</div>
          ))}
        </div>
        
        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-y-2">
          {renderCalendarDays()}
        </div>
      </div>

      {/* Task Modal Overlay */}
      <AnimatePresence>
        {selectedDateStr && (
           <TaskModal 
              dateStr={selectedDateStr} 
              onClose={() => setSelectedDateStr(null)} 
              tasks={tasks}
              addTask={addTask}
              toggleTask={toggleTask}
              deleteTask={deleteTask}
              isLightMode={isLightMode}
           />
        )}
      </AnimatePresence>
    </div>
  );
};

// Sub-component for Daily Tasks
const TaskModal = ({ 
    dateStr, 
    onClose, 
    tasks, 
    addTask,
    toggleTask,
    deleteTask,
    isLightMode
}: { 
    dateStr: string, 
    onClose: () => void,
    tasks: any[],
    addTask: any,
    toggleTask: any,
    deleteTask: any,
    isLightMode: boolean
}) => {
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const dayTasks = tasks.filter(t => t.date === dateStr);
    
    // Format date for display (e.g., "Mon, Jan 01")
    const dateDisplay = new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, {
       weekday: 'short', month: 'short', day: 'numeric'
    });

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if(!newTaskTitle.trim()) return;
        addTask({ date: dateStr, task_title: newTaskTitle, is_completed: false });
        setNewTaskTitle('');
    };

    return (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-2">
             {/* Backdrop */}
             <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`absolute inset-0 backdrop-blur-sm ${isLightMode ? 'bg-black/5' : 'bg-black/60'}`}
                onClick={(e) => { e.stopPropagation(); onClose(); }}
             />

             {/* Modal Card */}
             <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                transition={SPRING_CONFIG}
                onClick={(e) => e.stopPropagation()}
                className={`
                    relative w-full h-full max-h-[380px] rounded-2xl overflow-hidden flex flex-col shadow-2xl
                    ${isLightMode ? 'bg-white border border-black/5 shadow-black/10' : 'bg-[#1c1c1e] border border-white/10'}
                `}
            >
                {/* Header */}
                <div className={`p-4 border-b flex items-center justify-between backdrop-blur-xl ${isLightMode ? 'bg-gray-50/90 border-black/5' : 'bg-white/5 border-white/5'}`}>
                   <div>
                      <h3 className={`text-lg font-bold ${isLightMode ? 'text-black' : 'text-white'}`}>{dateDisplay}</h3>
                      <p className={`text-xs ${isLightMode ? 'text-black/40' : 'text-white/40'}`}>{dayTasks.length} Tasks</p>
                   </div>
                   <button 
                      onClick={(e) => { e.stopPropagation(); onClose(); }} 
                      className={`p-2 rounded-full transition-colors ${isLightMode ? 'bg-black/5 hover:bg-black/10 text-black/50' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                   >
                      <Icons.Close width={16} />
                   </button>
                </div>

                {/* Task List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                   {dayTasks.length === 0 && (
                      <div className={`h-full flex flex-col items-center justify-center space-y-2 ${isLightMode ? 'text-black/20' : 'text-white/20'}`}>
                         <Icons.CheckCircle width={32} height={32} />
                         <p className="text-sm">No tasks yet.</p>
                      </div>
                   )}
                   
                   <AnimatePresence initial={false} mode="popLayout">
                       {dayTasks.map(task => (
                           <motion.div 
                             layout
                             initial={{ opacity: 0, y: 10, scale: 0.95 }}
                             animate={{ opacity: 1, y: 0, scale: 1 }}
                             exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                             key={task.id} 
                             className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${isLightMode ? 'bg-gray-50 border-black/5' : 'bg-white/5 border-white/5'}`}
                           >
                              <button 
                                onClick={(e) => { e.stopPropagation(); toggleTask(task.id, !task.is_completed); }}
                                className={`flex-shrink-0 transition-colors ${task.is_completed ? 'text-blue-500' : (isLightMode ? 'text-black/20 hover:text-black/40' : 'text-white/20 hover:text-white/40')}`}
                              >
                                 {task.is_completed ? <Icons.CheckCircle width={20} /> : <Icons.Circle width={20} />}
                              </button>
                              <span className={`flex-1 text-sm transition-colors ${
                                  task.is_completed 
                                    ? (isLightMode ? 'text-black/30 line-through' : 'text-white/30 line-through') 
                                    : (isLightMode ? 'text-black/90' : 'text-white/90')
                              }`}>
                                 {task.task_title}
                              </span>
                              <button 
                                onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                                className={`transition-colors p-1 ${isLightMode ? 'text-black/10 hover:text-red-500' : 'text-white/10 hover:text-red-500'}`}
                              >
                                 <Icons.Trash width={14} />
                              </button>
                           </motion.div>
                       ))}
                   </AnimatePresence>
                </div>

                {/* Input Area */}
                <form onSubmit={handleAdd} className={`p-4 border-t backdrop-blur-xl ${isLightMode ? 'bg-gray-50/90 border-black/5' : 'bg-white/5 border-white/5'}`}>
                   <div className="flex gap-2">
                      <input 
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Add a new task..."
                        className={`flex-1 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors ${
                            isLightMode 
                                ? 'bg-white border-black/10 text-black placeholder-black/30' 
                                : 'bg-black/20 border-white/10 text-white placeholder-white/20'
                        }`}
                      />
                      <button 
                        type="submit"
                        className="bg-blue-500 text-white rounded-xl px-4 font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-blue-500/20"
                      >
                         +
                      </button>
                   </div>
                </form>
            </motion.div>
        </div>
    );
};

export default CalendarComponent;
