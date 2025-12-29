import React, { useState } from 'react';
import { JournalEntry } from '../types';
import { ArrowRight, ArrowLeft, CheckCircle, XCircle, Loader2, Battery, BatteryLow, BatteryCharging, Sparkles, Smile, Target, Save, Check, X } from 'lucide-react';
import { generateDailyInsight } from '../services/geminiService';
import { saveEntry } from '../services/storage';

interface JournalProps {
  onComplete: () => void;
  onBack: () => void;
  existingEntry?: JournalEntry;
  yesterdayEntry?: JournalEntry;
}

// Updated Order: Happiness -> Achievements -> Drainers -> Today Review -> Tomorrow Plan
const steps = [
  { id: 'happiness', title: '小确幸', subtitle: '记录 3 件让你感到开心幸福的事', color: 'bg-pink-50 text-pink-500', icon: <Smile size={24} /> },
  { id: 'achievements', title: '高光时刻', subtitle: '记录 3 件让你有成就感的小事', color: 'bg-primary-50 text-primary-600', icon: <Sparkles size={24} /> },
  { id: 'drainers', title: '能量监测', subtitle: '今天有没有让你感到消耗的事情？', color: 'bg-mint-50 text-mint-600', icon: <Battery size={24} /> },
  { id: 'mit', title: '核心复盘', subtitle: '最重要的那一件事，完成了吗？', color: 'bg-indigo-50 text-indigo-600', icon: <CheckCircle size={24} /> },
  { id: 'tomorrow', title: '明日展望', subtitle: '明天最重要的一件事是什么？', color: 'bg-purple-50 text-purple-600', icon: <Target size={24} /> },
];

export const Journal: React.FC<JournalProps> = ({ onComplete, onBack, existingEntry, yesterdayEntry }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  
  // Pre-fill logic
  const initialTodayMit = existingEntry?.todayMitDescription || yesterdayEntry?.tomorrowMit || '';
  
  // Default to false (Incomplete) if creating new based on yesterday's plan. 
  // If editing existing, respect its state.
  const initialMitCompleted = existingEntry ? existingEntry.mitCompleted : false;

  const [formData, setFormData] = useState<Partial<JournalEntry>>({
    achievements: ['', '', ''],
    happiness: ['', '', ''],
    drainerLevel: 'none',
    drainerNote: '',
    todayMitDescription: initialTodayMit,
    mitCompleted: initialMitCompleted,
    mitReason: '',
    tomorrowMit: '',
    ...existingEntry
  });

  const handleArrayChange = (field: 'achievements' | 'happiness', index: number, value: string) => {
    const newArray = [...(formData[field] || [])];
    newArray[index] = value;
    setFormData({ ...formData, [field]: newArray });
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(c => c + 1);
    } else {
      handleSubmit(true); // True means complete flow
    }
  };

  const handleBackStep = () => {
    if (currentStep > 0) {
        setCurrentStep(c => c - 1);
    }
  };

  // Save without closing (Draft mode)
  const handleSaveDraft = () => {
      handleSubmit(false);
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 2000);
  };

  const handleSubmit = async (isCompleteFlow: boolean) => {
    if (isCompleteFlow) setIsSubmitting(true);
    
    const entry: JournalEntry = {
      id: existingEntry?.id || crypto.randomUUID(),
      date: new Date().toISOString(),
      timestamp: Date.now(),
      achievements: formData.achievements as string[],
      happiness: formData.happiness as string[],
      drainerLevel: formData.drainerLevel || 'none',
      drainerNote: formData.drainerNote,
      todayMitDescription: formData.todayMitDescription || '',
      mitCompleted: !!formData.mitCompleted,
      mitReason: formData.mitReason,
      tomorrowMit: formData.tomorrowMit || '',
      // Preserve existing insight if just saving draft, or generate new one later
      aiInsight: existingEntry?.aiInsight,
      aiMood: existingEntry?.aiMood
    };

    if (isCompleteFlow) {
        // Only generate AI insight on final submission
        try {
            const analysis = await generateDailyInsight(entry);
            entry.aiInsight = analysis.text;
            entry.aiMood = analysis.mood;
        } catch (e) {
            console.error("AI generation failed", e);
        }
        saveEntry(entry);
        setIsSubmitting(false);
        onComplete();
    } else {
        // Just save to storage
        saveEntry(entry);
    }
  };

  const activeStep = steps[currentStep];

  return (
    <div className="flex flex-col h-full w-full bg-cream relative overflow-hidden z-40">
      {/* Dynamic Background Blobs */}
      <div className={`absolute -top-20 -right-20 w-96 h-96 rounded-full blur-3xl opacity-30 transition-colors duration-700 pointer-events-none ${
        currentStep === 0 ? 'bg-pink-300' : 
        currentStep === 1 ? 'bg-primary-300' :
        currentStep === 2 ? 'bg-mint-300' : 
        currentStep === 3 ? 'bg-indigo-300' : 'bg-purple-300'
      }`} />
      
      {/* Toast Notification */}
      <div className={`absolute top-6 left-1/2 transform -translate-x-1/2 bg-ink-900/90 text-white px-6 py-3 rounded-full text-sm font-bold shadow-lg transition-all duration-300 z-[60] flex items-center gap-2 ${showSaveToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
          <CheckCircle size={18} className="text-mint-400" />
          已保存您的分享
      </div>

      {/* Top Bar - Simplified */}
      <div className="pt-8 px-6 relative z-10 flex-none">
         <div className="flex justify-between items-center mb-6">
            {/* Top Left is now Exit/Home */}
            <button
              onClick={onBack}
              className="p-3 rounded-full text-ink-500 hover:bg-white/50 transition-all active:scale-95"
            >
              <ArrowLeft size={24} />
            </button>
            
            <div className="flex gap-1">
                {steps.map((_, i) => (
                    <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${
                        i === currentStep ? 'w-8 bg-ink-900' : 
                        i < currentStep ? 'w-1.5 bg-ink-300' : 'w-1.5 bg-ink-200'
                    }`} />
                ))}
            </div>

            <div className="w-12" /> {/* Spacer for centering */}
         </div>

         <div className="space-y-3 animate-fade-in px-2">
             <div className="flex items-center gap-3">
                 <div className={`p-2.5 rounded-2xl shadow-sm ${activeStep.color}`}>
                    {activeStep.icon}
                 </div>
                 <h2 className="text-2xl font-bold text-ink-900 tracking-tight">
                    {activeStep.title}
                 </h2>
             </div>
             <p className="text-ink-500 text-lg leading-relaxed font-medium">{activeStep.subtitle}</p>
         </div>
      </div>

      {/* Main Content Area - Input Bubbles */}
      <div className="flex-1 overflow-y-auto px-6 py-6 no-scrollbar relative z-10">
        {/* Deep padding to ensure content clears the double bottom bars */}
        <div className="min-h-[50vh] flex flex-col pt-2 pb-56 animate-fade-in">
            
            {/* Step 1: Happiness */}
            {currentStep === 0 && (
            <div className="space-y-4">
                {[0, 1, 2].map((i) => (
                <div key={i} className="group relative">
                    <div className="absolute left-4 top-4 text-lg">
                        {i === 0 ? '🥞' : i === 1 ? '🌤️' : '🎵'}
                    </div>
                    <input
                    type="text"
                    autoFocus={i === 0}
                    placeholder={i === 0 ? "吃到好吃的早餐..." : "..."}
                    value={formData.happiness?.[i]}
                    onChange={(e) => handleArrayChange('happiness', i, e.target.value)}
                    className="w-full pl-12 pr-6 py-5 bg-white rounded-[2rem] text-lg font-normal text-ink-700 placeholder:text-ink-300 shadow-sm focus:shadow-md focus:scale-[1.02] outline-none transition-all border border-transparent focus:border-pink-100"
                    />
                </div>
                ))}
            </div>
            )}

            {/* Step 2: Achievements */}
            {currentStep === 1 && (
            <div className="space-y-4">
                {[0, 1, 2].map((i) => (
                <div key={i} className="group relative">
                    <div className="absolute left-4 top-4 text-xs font-bold text-primary-400">0{i+1}</div>
                    <input
                    type="text"
                    autoFocus={i === 0}
                    placeholder={i === 0 ? "早起喝了一杯温水..." : "..."}
                    value={formData.achievements?.[i]}
                    onChange={(e) => handleArrayChange('achievements', i, e.target.value)}
                    className="w-full pl-12 pr-6 py-5 bg-white rounded-[2rem] text-lg font-normal text-ink-700 placeholder:text-ink-300 shadow-sm focus:shadow-md focus:scale-[1.02] outline-none transition-all border border-transparent focus:border-primary-100"
                    />
                </div>
                ))}
            </div>
            )}

            {/* Step 3: Drainers */}
            {currentStep === 2 && (
            <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                {[
                    { id: 'none', label: '无消耗，状态不错', icon: BatteryCharging, color: 'text-mint-600 bg-mint-50 border-mint-200' },
                    { id: 'low', label: '少量消耗，有一点累', icon: Battery, color: 'text-peach-500 bg-peach-50 border-peach-200' },
                    { id: 'high', label: '大量消耗，非常疲惫', icon: BatteryLow, color: 'text-red-500 bg-red-50 border-red-200' }
                ].map((option) => (
                    <button
                    key={option.id}
                    onClick={() => setFormData({ ...formData, drainerLevel: option.id as any })}
                    className={`flex items-center gap-4 px-6 py-5 rounded-[2rem] text-left transition-all duration-300 border ${
                        formData.drainerLevel === option.id 
                        ? `${option.color} ring-2 ring-offset-2 ring-offset-cream shadow-md scale-[1.02]` 
                        : 'bg-white text-ink-500 border-transparent shadow-sm hover:bg-white/80'
                    }`}
                    >
                    <div className={`p-2 rounded-full bg-white/50`}>
                        <option.icon size={24} />
                    </div>
                    <span className="text-lg font-bold">{option.label}</span>
                    </button>
                ))}
                </div>

                <div className={`transition-all duration-500 overflow-hidden ${formData.drainerLevel !== 'none' ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <label className="text-sm font-bold text-ink-400 ml-4 mb-2 block">是什么消耗了你？</label>
                    <textarea
                    value={formData.drainerNote}
                    onChange={(e) => setFormData({...formData, drainerNote: e.target.value})}
                    placeholder="写下来，把负面情绪留在这里..."
                    className="w-full h-32 p-6 bg-white rounded-[2rem] text-base font-normal text-ink-700 placeholder:text-ink-300 shadow-sm focus:ring-0 border-none resize-none outline-none"
                    />
                </div>
            </div>
            )}

            {/* Step 4: Today's MIT */}
            {currentStep === 3 && (
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm">
                    <label className="block text-xs font-bold text-ink-400 uppercase tracking-wider mb-3 ml-1">今日要事</label>
                    <input
                        type="text"
                        value={formData.todayMitDescription}
                        onChange={(e) => setFormData({...formData, todayMitDescription: e.target.value})}
                        placeholder="今天最重要的事情是..."
                        className="w-full text-xl font-normal text-ink-900 placeholder:text-ink-300 bg-transparent outline-none mb-4"
                    />
                    
                    <div className="h-px bg-gray-100 w-full mb-6"></div>

                    <div className="flex gap-4">
                        <button
                        onClick={() => setFormData({...formData, mitCompleted: true})}
                        className={`flex-1 py-4 rounded-2xl transition-all duration-300 flex flex-col items-center gap-2 ${
                            formData.mitCompleted 
                            ? 'bg-ink-900 text-white shadow-lg transform scale-105' 
                            : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                        }`}
                        >
                        <CheckCircle size={24} />
                        <span className="font-bold text-sm">完成了</span>
                        </button>
                        <button
                        onClick={() => setFormData({...formData, mitCompleted: false})}
                        className={`flex-1 py-4 rounded-2xl transition-all duration-300 flex flex-col items-center gap-2 ${
                            !formData.mitCompleted 
                            ? 'bg-peach-100 text-peach-600 ring-2 ring-peach-200' 
                            : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                        }`}
                        >
                        <XCircle size={24} />
                        <span className="font-bold text-sm">未完成</span>
                        </button>
                    </div>
                </div>

                {!formData.mitCompleted && (
                 <div className="animate-fade-in">
                     <label className="text-sm font-bold text-ink-400 ml-4 mb-2 block">没关系，原因是什么？</label>
                     <textarea
                        value={formData.mitReason}
                        onChange={(e) => setFormData({...formData, mitReason: e.target.value})}
                        placeholder="记录一下，下次改进..."
                        className="w-full p-6 bg-white rounded-[2rem] text-base font-normal text-ink-700 placeholder:text-ink-300 shadow-sm focus:ring-0 border-none resize-none outline-none"
                    />
                </div>
                )}
            </div>
            )}

            {/* Step 5: Tomorrow's MIT */}
            {currentStep === 4 && (
            <div className="flex flex-col items-center justify-center h-full pt-10">
                <div className="w-20 h-20 bg-primary-100 text-primary-500 rounded-full flex items-center justify-center mb-8 shadow-inner animate-float">
                    <Target size={40} />
                </div>
                
                <h3 className="text-2xl font-bold text-ink-900 mb-2">最后一步</h3>
                <p className="text-ink-500 mb-8 text-center max-w-xs">
                    明天最重要的一件事是什么？<br/>少即是多，专注当下。
                </p>
                
                <div className="w-full relative group">
                    <input
                        type="text"
                        autoFocus
                        value={formData.tomorrowMit}
                        onChange={(e) => setFormData({...formData, tomorrowMit: e.target.value})}
                        placeholder="写下明天最重要的那件事..."
                        className="w-full p-8 bg-white rounded-[2.5rem] text-xl text-center font-bold text-ink-900 placeholder:text-ink-300 shadow-soft focus:shadow-glow outline-none transition-all border-2 border-transparent focus:border-primary-200"
                    />
                </div>
            </div>
            )}
        </div>
      </div>

      {/* Floating Action Buttons Container - FIXED ABOVE BOTTOM NAV */}
      {/* 
         Bottom Nav is ~80px (h-20) + 24px (bottom-6) = 104px. 
         We position this bar at bottom-28 (7rem = 112px) to float just above it.
      */}
      <div className="absolute bottom-32 left-0 w-full px-6 z-50 flex gap-3 pointer-events-auto">
          
          {/* Previous Step (Visible only after step 1) */}
          {currentStep > 0 && (
             <button
                onClick={handleBackStep}
                disabled={isSubmitting}
                className="w-14 h-14 bg-white text-ink-500 border border-ink-100 rounded-[1.5rem] shadow-sm hover:shadow-md active:scale-95 transition-all flex items-center justify-center"
             >
                <ArrowLeft size={20} />
             </button>
          )}

          {/* Save Button */}
          <button
             onClick={handleSaveDraft}
             disabled={isSubmitting}
             className="flex-1 h-14 bg-white text-ink-900 border border-ink-100 rounded-[1.5rem] font-bold text-base shadow-sm hover:shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
          >
             <Save size={18} className="text-ink-400" />
             保存
          </button>

          {/* Next/Complete Button */}
          <button
            onClick={currentStep === steps.length - 1 ? () => handleSubmit(true) : handleNext}
            disabled={isSubmitting}
            className="flex-[2] h-14 bg-ink-900 text-white rounded-[1.5rem] font-bold text-base shadow-glow hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-80"
          >
             {isSubmitting ? <Loader2 className="animate-spin" /> : currentStep === steps.length - 1 ? '完成' : '下一步'}
             {!isSubmitting && (currentStep === steps.length - 1 ? <Check size={18} /> : <ArrowRight size={18} />)}
          </button>
      </div>
    </div>
  );
};