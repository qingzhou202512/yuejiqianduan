import React, { useState, useMemo } from 'react';
import { getEntries, isValidEntry } from '../services/storage';
import { Calendar as CalendarIcon, CheckCircle, XCircle, Sparkles, BatteryLow, Battery, Search, ChevronLeft, ChevronRight, X, Filter, ArrowLeft } from 'lucide-react';

interface HistoryProps {
    onBack?: () => void;
}

export const History: React.FC<HistoryProps> = ({ onBack }) => {
  const [searchText, setSearchText] = useState('');
  const [viewDate, setViewDate] = useState(new Date()); // Controls the month being viewed
  const [selectedDate, setSelectedDate] = useState<Date | null>(null); // Controls filter
  const [showCalendar, setShowCalendar] = useState(false); // Controls calendar visibility
  
  // Only get valid entries
  const entries = getEntries().filter(isValidEntry);

  // Helper to check if two dates are same day
  const isSameDay = (d1: Date, d2: Date) => {
      return d1.getFullYear() === d2.getFullYear() &&
             d1.getMonth() === d2.getMonth() &&
             d1.getDate() === d2.getDate();
  };

  // Helper to check if a date has any entry
  const hasEntryOnDate = (date: Date) => {
      return entries.some(e => isSameDay(new Date(e.date), date));
  };

  // Calendar Logic
  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const handlePrevMonth = () => {
      setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
      setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };
  const handleDateClick = (day: number) => {
      const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
      if (selectedDate && isSameDay(selectedDate, newDate)) {
          setSelectedDate(null); // Deselect
      } else {
          setSelectedDate(newDate);
      }
  };

  // Filter Logic
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const entryDate = new Date(entry.date);
      
      // 1. Date Filter
      if (selectedDate && !isSameDay(entryDate, selectedDate)) {
        return false;
      }

      // 2. Search Filter
      if (searchText.trim()) {
        const query = searchText.toLowerCase();
        const contentToSearch = [
            entry.todayMitDescription,
            entry.mitReason,
            entry.drainerNote,
            entry.aiInsight,
            ...entry.achievements,
            ...entry.happiness
        ].join(' ').toLowerCase();
        
        return contentToSearch.includes(query);
      }

      return true;
    });
  }, [entries, selectedDate, searchText]);

  // Render Calendar Grid
  const renderCalendar = () => {
      const totalDays = daysInMonth(viewDate);
      const startOffset = firstDayOfMonth(viewDate);
      const days = [];

      // Empty slots for start offset
      for (let i = 0; i < startOffset; i++) {
          days.push(<div key={`empty-${i}`} className="h-10 w-full"></div>);
      }

      // Days
      for (let i = 1; i <= totalDays; i++) {
          const currentDayDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), i);
          const hasRecord = hasEntryOnDate(currentDayDate);
          const isSelected = selectedDate && isSameDay(selectedDate, currentDayDate);
          const isToday = isSameDay(new Date(), currentDayDate);

          days.push(
              <button 
                  key={i} 
                  onClick={() => handleDateClick(i)}
                  className={`h-10 w-full flex flex-col items-center justify-center relative rounded-xl transition-all border ${
                      isSelected ? 'bg-ink-900 text-white shadow-md scale-105 border-ink-900' : 
                      hasRecord ? 'bg-primary-50 text-primary-700 border-primary-100' :
                      'text-ink-700 border-transparent hover:bg-white'
                  }`}
              >
                  <span className={`text-sm ${isToday && !isSelected ? 'text-primary-600 font-black' : (hasRecord && !isSelected) ? 'font-bold' : ''}`}>
                      {i}
                  </span>
                  
                  {/* Enhanced Record Indicator */}
                  {hasRecord && !isSelected && (
                      <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary-400" />
                  )}
              </button>
          );
      }
      return days;
  };

  return (
    <div className="flex flex-col h-full bg-cream overflow-hidden">
      
      {/* Header Area - Keep fixed */}
      <div className="flex-none px-6 pt-10 pb-2 bg-cream z-20 flex flex-col gap-4 shadow-sm">
          <div className="flex items-center gap-3">
             {onBack && (
                 <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-white/50 text-ink-500">
                     <ArrowLeft size={24} />
                 </button>
             )}
             <h2 className="text-2xl font-bold text-ink-900">足迹</h2>
             <div className="flex-1"></div>
             {filteredEntries.length > 0 && !selectedDate && (
                <span className="text-xs font-bold text-ink-400 bg-white px-2 py-1 rounded-md border border-ink-100">
                    {filteredEntries.length} 条
                </span>
             )}
          </div>

          {/* Search Bar & Filter Toggle */}
          <div className="flex gap-3">
            <div className="relative group flex-1">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-ink-400 group-focus-within:text-primary-500 transition-colors">
                    <Search size={18} />
                </div>
                <input 
                    type="text" 
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="搜索..."
                    className="w-full bg-white pl-12 pr-10 py-3.5 rounded-2xl text-ink-900 placeholder:text-ink-300 text-sm font-medium shadow-sm outline-none border border-transparent focus:border-primary-200 focus:shadow-md transition-all"
                />
                {searchText && (
                    <button 
                        onClick={() => setSearchText('')}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-ink-300 hover:text-ink-600"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>
            
            <button 
                onClick={() => setShowCalendar(!showCalendar)}
                className={`flex items-center justify-center w-12 h-full rounded-2xl border transition-all ${
                    showCalendar || selectedDate
                    ? 'bg-ink-900 text-white border-ink-900 shadow-md' 
                    : 'bg-white text-ink-500 border-transparent shadow-sm'
                }`}
            >
                <CalendarIcon size={20} />
            </button>
          </div>

          {/* Calendar Section (Collapsible) */}
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showCalendar || selectedDate ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="bg-white/60 backdrop-blur-sm rounded-[1.5rem] p-4 border border-white/60 shadow-sm mt-1">
                <div className="flex justify-between items-center mb-4 px-2">
                    <button onClick={handlePrevMonth} className="p-1 rounded-full hover:bg-white text-ink-400 hover:text-ink-900 transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <span className="text-sm font-bold text-ink-800 uppercase tracking-widest font-serif">
                        {viewDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
                    </span>
                    <button onClick={handleNextMonth} className="p-1 rounded-full hover:bg-white text-ink-400 hover:text-ink-900 transition-colors">
                        <ChevronRight size={20} />
                    </button>
                </div>
                
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                        <div key={d} className="text-center text-[10px] font-bold text-ink-300">
                            {d}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {renderCalendar()}
                </div>
                
                {/* Active Filter Bar */}
                {selectedDate && (
                    <div className="mt-4 flex items-center justify-between bg-ink-900 text-white px-4 py-3 rounded-xl animate-fade-in shadow-lg">
                        <div className="flex items-center gap-2">
                            <Filter size={16} className="text-primary-300" />
                            <div className="flex flex-col leading-none gap-0.5">
                                <span className="text-[10px] text-ink-300 uppercase font-bold">筛选日期</span>
                                <span className="text-sm font-bold font-serif">
                                    {selectedDate.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
                                </span>
                            </div>
                        </div>
                        <button 
                            onClick={() => setSelectedDate(null)}
                            className="bg-white/20 hover:bg-white/30 p-1.5 rounded-lg transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}
            </div>
          </div>
      </div>
      
      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-32 pt-4 space-y-4 min-h-0">
        
        {filteredEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                <Search className="text-ink-300" size={24} />
            </div>
            <p className="text-ink-500 font-normal">没有找到相关记录</p>
          </div>
        ) : (
            filteredEntries.map((entry) => (
                <div key={entry.id} className="bg-white rounded-[2rem] p-5 shadow-card border border-white/50 animate-fade-in transition-transform active:scale-[0.99]">
                
                {/* Header Row */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary-50 text-primary-600 px-3 py-1 rounded-lg text-sm font-bold tracking-tight font-serif">
                            {new Date(entry.date).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}
                        </div>
                        <span className="text-xs font-medium text-ink-300">
                            {new Date(entry.date).toLocaleDateString('zh-CN', { weekday: 'long' })}
                        </span>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="space-y-3">
                    {/* MIT Status */}
                    <div className="flex items-start gap-3">
                        <div className={`mt-0.5 shrink-0 ${entry.mitCompleted ? 'text-mint-500' : 'text-peach-500'}`}>
                            {entry.mitCompleted ? <CheckCircle size={16} /> : <XCircle size={16} />}
                        </div>
                        <div className="min-w-0">
                            <p className={`text-sm font-normal leading-tight line-clamp-2 ${entry.mitCompleted ? 'text-ink-800' : 'text-ink-400 line-through'}`}>
                                {entry.todayMitDescription || '未记录重要之事'}
                            </p>
                        </div>
                    </div>

                    <div className="h-px bg-gray-50 w-full"></div>

                    {/* Highlights Row */}
                    <div className="flex flex-wrap gap-2">
                        {entry.drainerLevel === 'high' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-500 text-[11px] font-bold">
                                <BatteryLow size={12} /> 高消耗
                            </span>
                        )}
                        {entry.drainerLevel === 'low' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 text-orange-400 text-[11px] font-bold">
                                <Battery size={12} /> 低消耗
                            </span>
                        )}
                        {entry.achievements.slice(0, 2).map((a, i) => a && (
                            <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-50 text-primary-600 text-[11px] font-bold max-w-full truncate">
                                <Sparkles size={12} /> {a}
                            </span>
                        ))}
                    </div>
                </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
};