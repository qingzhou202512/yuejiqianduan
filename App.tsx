import React, { useState, useEffect } from 'react';
import { Journal } from './components/Journal';
import { Meditation } from './components/Meditation';
import { History } from './components/History';
import { Home } from './components/Home';
import { ViewState } from './types';
import { Book, Brain, Plus, PenLine } from 'lucide-react';
import { getTodayEntry, getYesterdayEntry, generateMockData } from './services/storage';

export default function App() {
  const [view, setView] = useState<ViewState>(ViewState.HOME);
  const [hasTodayEntry, setHasTodayEntry] = useState(false);

  // Initialize data on load
  useEffect(() => {
    generateMockData();
    checkEntry();
  }, []);

  const checkEntry = () => {
    const entry = getTodayEntry();
    setHasTodayEntry(!!entry);
  };

  useEffect(() => {
    checkEntry();
  }, [view]);

  const renderContent = () => {
    switch (view) {
      case ViewState.JOURNAL:
        return (
          <Journal 
            onComplete={() => { setView(ViewState.HOME); checkEntry(); }} 
            existingEntry={getTodayEntry()} 
            yesterdayEntry={getYesterdayEntry()}
            onBack={() => setView(ViewState.HOME)}
          />
        );
      case ViewState.MEDITATION:
        return <Meditation />;
      case ViewState.HISTORY:
        return <History onBack={() => setView(ViewState.HOME)} />;
      case ViewState.HOME:
      default:
        return <Home onNavigate={setView} />;
    }
  };

  // Only show navigation on non-journal pages
  const showNav = view !== ViewState.JOURNAL;

  return (
    <div className="h-screen w-full bg-cream flex flex-col font-sans text-ink-900 selection:bg-primary-200 overflow-hidden">
      <main className="flex-1 overflow-hidden relative z-0">
        {renderContent()}
      </main>

      {/* Simplified Bottom Navigation - Hidden when recording */}
      {showNav && (
        <div className="absolute bottom-8 left-0 w-full px-8 z-50 pointer-events-none animate-fade-in">
          <nav className="h-20 bg-white/90 backdrop-blur-2xl rounded-[2.5rem] shadow-soft flex items-center justify-between px-10 pointer-events-auto border border-white/50 relative">
              
              {/* Left: Record (Timeline) */}
              <NavItem 
                icon={view === ViewState.HOME ? <Book size={24} fill="currentColor" /> : <Book size={24} />} 
                label="记录" 
                isActive={view === ViewState.HOME} 
                onClick={() => setView(ViewState.HOME)} 
              />
              
              {/* Center: Add Action (Floating above) */}
              <div className="absolute left-1/2 top-0 transform -translate-x-1/2 -translate-y-1/2">
                <button 
                    onClick={() => setView(ViewState.JOURNAL)}
                    className={`w-18 h-18 p-5 rounded-full flex items-center justify-center shadow-glow transition-all active:scale-95 border-[6px] border-cream group ${
                    view === ViewState.JOURNAL 
                        ? 'bg-ink-900 text-white' 
                        : 'bg-gradient-to-tr from-primary-500 to-primary-400 text-white hover:shadow-xl hover:-translate-y-1'
                    }`}
                >
                    {hasTodayEntry ? <PenLine size={28} /> : <Plus size={32} />}
                </button>
              </div>

              {/* Right: Meditation */}
              <NavItem 
                icon={view === ViewState.MEDITATION ? <Brain size={24} fill="currentColor" /> : <Brain size={24} />} 
                label="冥想" 
                isActive={view === ViewState.MEDITATION} 
                onClick={() => setView(ViewState.MEDITATION)} 
              />
              
          </nav>
        </div>
      )}
    </div>
  );
}

// Nav Helper
const NavItem = ({ icon, label, isActive, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1.5 w-16 transition-all duration-300 ${
      isActive ? 'text-primary-600 scale-105' : 'text-ink-400 hover:text-ink-600'
    }`}
  >
    <div className="relative">
      {icon}
      {isActive && <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary-500 rounded-full" />}
    </div>
    <span className="text-[11px] font-bold tracking-wide">{label}</span>
  </button>
);