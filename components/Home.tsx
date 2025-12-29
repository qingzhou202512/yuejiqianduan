import React, { useState } from 'react';
import { ViewState } from '../types';
import { Sparkles, Plus, CheckCircle, XCircle, Smile, BatteryLow, Battery, Quote, ArrowRight, Flame, History, X, Clock, ChevronRight } from 'lucide-react';
import { getTodayEntry, getEntries, getRecordedDaysCount, isValidEntry } from '../services/storage';

interface HomeProps {
  onNavigate: (view: ViewState) => void;
}

// Modal Component for viewing details
const DetailModal = ({ moment, onClose }: { moment: any, onClose: () => void }) => {
  if (!moment) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
      {/* Backdrop - Transparent to keep background visible as requested */}
      <div 
        className="absolute inset-0 bg-transparent"
        onClick={onClose}
      />
      
      {/* Card */}
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative z-10 animate-fade-in transform scale-100 transition-all border border-gray-100">
         <button 
           onClick={onClose}
           className="absolute top-6 right-6 p-2 bg-gray-50 rounded-full text-ink-400 hover:text-ink-900 hover:bg-gray-100 transition-all"
         >
           <X size={20} />
         </button>

         <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl ${moment.bgColor} ${moment.color}`}>
                    <moment.icon size={32} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                    <span className={`text-xs font-black uppercase tracking-widest opacity-60 ${moment.color}`}>
                        {moment.label}
                    </span>
                    <span className="text-sm font-bold text-ink-400 font-serif">
                        {moment.date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
                    </span>
                </div>
            </div>

            <div className="max-h-[50vh] overflow-y-auto no-scrollbar">
                <p className={`text-xl font-normal leading-relaxed ${moment.isDone === false ? 'text-ink-500' : 'text-ink-800'}`}>
                    {moment.text}
                </p>
                
                {moment.subtext && (
                    <div className="mt-6 p-5 bg-cream rounded-2xl border border-primary-50">
                        <span className="text-xs font-bold text-ink-400 uppercase tracking-wider block mb-2">备注 / 原因</span>
                        <p className="text-ink-600 font-normal leading-relaxed">
                            {moment.subtext}
                        </p>
                    </div>
                )}
            </div>
         </div>
      </div>
    </div>
  );
};

// Background Component - Defined outside Home to prevent re-renders
const Background = React.memo(() => (
    <>
      <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-primary-50/80 via-cream to-cream pointer-events-none" />
      <div className="absolute top-[-5%] right-[-10%] w-64 h-64 bg-pink-100 rounded-full blur-3xl opacity-40 animate-breathe pointer-events-none" />
      <div className="absolute top-[20%] left-[-10%] w-48 h-48 bg-mint-100 rounded-full blur-3xl opacity-30 animate-float pointer-events-none" />
    </>
));

// Header Component - Defined outside Home to prevent re-renders and re-animations
interface HeaderProps {
    onNavigate: (view: ViewState) => void;
    recordedDays: number;
}

const Header: React.FC<HeaderProps> = React.memo(({ onNavigate, recordedDays }) => {
    // Date Logic
    const date = new Date();
    const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const dayName = weekDays[date.getDay()];
    const dayNum = date.getDate();
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });

    // Daily Quotes Logic
    const quotes = [
        "今天也要好好爱自己",
        "生活原本沉闷，但跑起来就有风",
        "允许自己做自己，允许别人做别人",
        "凡是过往，皆为序章",
        "心有山海，静而无边",
        "你若盛开，清风自来",
        "热爱可抵岁月漫长",
        "星光不问赶路人",
        "好好生活，慢慢相遇",
        "保持热爱，奔赴山海"
    ];
    const quoteIndex = (date.getFullYear() * 1000 + date.getMonth() * 31 + date.getDate()) % quotes.length;
    const dailyQuote = quotes[quoteIndex];

    return (
      <header className="px-6 pt-8 pb-1 relative z-10 animate-fade-in">
        <div className="flex justify-between items-center">
            {/* Left: Date Info - More compact */}
            <div className="flex items-center gap-3">
                <span className="text-4xl font-light text-ink-900 tracking-tighter leading-none font-serif">
                    {dayNum}
                </span>
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-ink-400 uppercase tracking-widest leading-none mb-1">
                        {monthName} {dayName}
                    </span>
                    <p className="text-xs text-ink-700 font-serif leading-none italic pr-4">
                        "{dailyQuote}"
                    </p>
                </div>
            </div>

            {/* Right: Merged Streak & History Badge - More compact */}
            <button 
                onClick={() => onNavigate(ViewState.HISTORY)}
                className="flex items-center gap-2 bg-white/60 backdrop-blur-md rounded-xl p-1.5 pl-2.5 border border-white/60 shadow-sm active:scale-95 transition-transform group"
            >
                 <div className="flex items-center gap-1">
                    <Flame size={10} className="text-orange-500 fill-orange-500" />
                    <span className="text-[11px] font-bold text-ink-900">{recordedDays} 天</span>
                 </div>
                 <div className="w-px h-3 bg-ink-200"></div>
                 <ChevronRight size={12} className="text-ink-400 group-hover:text-primary-500" />
            </button>
        </div>
      </header>
    );
});

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const [selectedMoment, setSelectedMoment] = useState<any>(null);
  
  const todayEntry = getTodayEntry();
  const allEntries = getEntries().filter(isValidEntry); // Only show valid entries
  const hasEntry = !!todayEntry && isValidEntry(todayEntry);
  const recordedDays = getRecordedDaysCount();

  // State 1: No Entry (Guide Mode)
  if (!hasEntry && allEntries.length === 0) {
      return (
        <div className="flex flex-col h-full bg-cream relative">
           <Background />
           <Header onNavigate={onNavigate} recordedDays={recordedDays} />

           <div className="flex-1 px-6 flex flex-col items-center justify-center pb-32 animate-fade-in gap-8 relative z-10">
              <div className="relative w-full max-w-xs aspect-square flex items-center justify-center">
                  <div className="absolute inset-0 bg-white/40 rounded-full blur-2xl animate-pulse"></div>
                  <div className="relative bg-white/60 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-soft border border-white/60 flex flex-col items-center text-center gap-4 transform rotate-3 transition-transform hover:rotate-0 duration-500">
                      <div className="w-16 h-16 bg-primary-100 text-primary-500 rounded-2xl flex items-center justify-center mb-2">
                          <Sparkles size={32} />
                      </div>
                      <div>
                          <h3 className="text-lg font-bold text-ink-900 mb-1">今天过得怎么样？</h3>
                          <p className="text-sm text-ink-500 leading-relaxed font-normal">
                              记录三件小事，一点思考<br/>
                              是爱自己的开始
                          </p>
                      </div>
                  </div>
              </div>

              <button 
                onClick={() => onNavigate(ViewState.JOURNAL)}
                className="w-full max-w-xs bg-ink-900 text-white rounded-[2rem] py-5 font-bold text-lg shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              >
                 <Plus size={20} />
                 <span>开始记录今天</span>
              </button>
           </div>
        </div>
      );
  }

  // State 2: Timeline Mode
  interface Moment {
      id: string;
      type: 'happy' | 'achievement' | 'focus' | 'drainer';
      text: string;
      subtext?: string;
      date: Date;
      icon: any;
      color: string;
      bgColor: string;
      borderColor?: string;
      label: string;
      isDone?: boolean;
  }

  const moments: Moment[] = [];
  const DISPLAY_LIMIT = 15;
  const entriesToShow = allEntries.slice(0, DISPLAY_LIMIT);
  const totalEntriesCount = allEntries.length;

  entriesToShow.forEach(entry => {
      const d = new Date(entry.date);
      
      // Happy
      entry.happiness.forEach((text, i) => {
          if (text) moments.push({ id: `${entry.id}-h-${i}`, type: 'happy', text, date: d, icon: Smile, color: 'text-pink-500', bgColor: 'bg-pink-100', label: '小确幸' });
      });
      
      // Achievements
      entry.achievements.forEach((text, i) => {
          if (text) moments.push({ id: `${entry.id}-a-${i}`, type: 'achievement', text, date: d, icon: Sparkles, color: 'text-primary-500', bgColor: 'bg-primary-100', label: '高光时刻' });
      });
      
      // MIT (Focus)
      if (entry.todayMitDescription) {
          const isDone = entry.mitCompleted;
          
          moments.push({ 
              id: `${entry.id}-mit`, 
              type: 'focus', 
              text: entry.todayMitDescription, 
              subtext: !isDone && entry.mitReason ? `原因: ${entry.mitReason}` : undefined,
              date: d, 
              icon: isDone ? CheckCircle : XCircle, 
              color: isDone ? 'text-green-600' : 'text-orange-500', 
              bgColor: isDone ? 'bg-green-100' : 'bg-orange-100', 
              label: '今日要事',
              isDone: isDone 
          });
      }
      
      // Drainer (Energy)
      if (entry.drainerLevel && entry.drainerLevel !== 'none') {
          const isHigh = entry.drainerLevel === 'high';
          const defaultLabel = isHigh ? '大量消耗，非常疲惫' : '少量消耗，有一点累';
          const displayText = entry.drainerNote ? entry.drainerNote : defaultLabel;

          moments.push({ 
              id: `${entry.id}-drain`, 
              type: 'drainer', 
              text: displayText, 
              date: d, 
              icon: isHigh ? BatteryLow : Battery, 
              color: isHigh ? 'text-red-500' : 'text-orange-400', 
              bgColor: isHigh ? 'bg-red-100' : 'bg-orange-100', 
              label: isHigh ? '高能量消耗' : '低能量消耗' 
          });
      }
  });

  moments.sort((a, b) => b.date.getTime() - a.date.getTime());

  const grouped: Record<string, Moment[]> = {};
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dayBefore = new Date();
  dayBefore.setDate(dayBefore.getDate() - 2);

  const isSameDay = (d1: Date, d2: Date) => d1.toDateString() === d2.toDateString();

  moments.forEach(m => {
      let label = '';
      if (isSameDay(m.date, today)) label = '今天';
      else if (isSameDay(m.date, yesterday)) label = '昨天';
      else if (isSameDay(m.date, dayBefore)) label = '前天';
      else label = m.date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }).replace('/', '月') + '日';
      
      if (!grouped[label]) grouped[label] = [];
      grouped[label].push(m);
  });

  const sortedKeys = Object.keys(grouped).sort((a, b) => {
      if (a === '今天') return -1;
      if (b === '今天') return 1;
      if (a === '昨天') return -1;
      if (b === '昨天') return 1;
      if (a === '前天') return -1;
      if (b === '前天') return 1;
      const dateA = grouped[a][0].date.getTime();
      const dateB = grouped[b][0].date.getTime();
      return dateB - dateA;
  });

  return (
    <div className="flex flex-col h-full bg-cream relative">
      <Background />
      <Header onNavigate={onNavigate} recordedDays={recordedDays} />

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-32 pt-4 z-10 min-h-0">
         <div className="flex flex-col gap-5 max-w-md mx-auto">
             {sortedKeys.map((label, groupIdx) => (
                 <div key={label} className="w-full flex flex-col gap-3 animate-fade-in" style={{ animationDelay: `${groupIdx * 100}ms` }}>
                     
                     <div className="flex items-center gap-4 mt-1">
                        <div className="px-3 py-1 bg-white/50 rounded-lg backdrop-blur-sm border border-white/50 shadow-sm">
                            <h3 className="text-sm font-bold text-ink-900">{label}</h3>
                        </div>
                        <div className="h-px bg-ink-100 flex-1"></div>
                     </div>

                     <div className="w-full flex flex-col gap-3">
                         {grouped[label].map((m) => {
                             return (
                                <div 
                                    key={m.id} 
                                    onClick={() => setSelectedMoment(m)}
                                    className="w-full bg-white/80 backdrop-blur-sm rounded-[2rem] p-5 shadow-card border border-white/50 flex items-start gap-4 cursor-pointer active:scale-[0.98] transition-transform"
                                >
                                    <div className={`p-3 rounded-2xl shrink-0 ${m.bgColor} ${m.color}`}>
                                        <m.icon size={20} />
                                    </div>
                                    <div className="flex-1 pt-0.5 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-md ${m.bgColor} ${m.color} bg-opacity-30 font-bold tracking-wide`}>
                                            {m.label}
                                            </span>
                                        </div>
                                        <p className={`text-[15px] leading-relaxed font-normal line-clamp-2 overflow-hidden text-ellipsis ${m.isDone === false ? 'text-ink-500 line-through decoration-ink-300' : 'text-ink-700'}`}>
                                            {m.text}
                                        </p>
                                    </div>
                                </div>
                             );
                         })}
                     </div>
                 </div>
             ))}

             <div className="py-6 flex justify-center w-full">
                {totalEntriesCount > DISPLAY_LIMIT ? (
                    <button 
                        onClick={() => onNavigate(ViewState.HISTORY)}
                        className="flex items-center gap-2 text-ink-400 font-bold text-sm bg-white px-5 py-3 rounded-full shadow-sm hover:text-primary-500 hover:shadow-md transition-all active:scale-95"
                    >
                        去历史记录查看更多 <ArrowRight size={14} />
                    </button>
                ) : (
                    <div className="flex flex-col items-center gap-2 opacity-50">
                        <div className="w-1 h-1 bg-ink-300 rounded-full"></div>
                        <span className="text-xs font-medium text-ink-400">全部记录已加载</span>
                    </div>
                )}
             </div>
         </div>
      </div>
      
      <DetailModal moment={selectedMoment} onClose={() => setSelectedMoment(null)} />
    </div>
  );
};