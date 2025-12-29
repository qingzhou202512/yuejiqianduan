import React, { useState, useRef, useEffect } from 'react';
import { JournalEntry } from '../types';
import { ArrowRight, ArrowLeft, CheckCircle, Loader2, Battery, BatteryLow, BatteryCharging, Sparkles, Smile, Target, Save, Check, X, MessageCircle, Clock } from 'lucide-react';
import { generateDailyInsight } from '../services/geminiService';
import { saveEntry } from '../services/storage';

interface JournalProps {
  onComplete: () => void;
  onBack: () => void;
  existingEntry?: JournalEntry;
  yesterdayEntry?: JournalEntry;
}

// Helper component for auto-resizing textarea
const BubbleTextarea: React.FC<{
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  icon?: React.ReactNode;
  maxLength?: number;
  className?: string;
  variant?: 'default' | 'secondary' | 'note';
  focusColor?: string;
  minRows?: number;
}> = ({ value, onChange, placeholder, icon, maxLength = 200, className = "", variant = 'default', focusColor = "focus-within:border-white", minRows = 1 }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const minH = minRows * 28 + 32; 
      const actualHeight = Math.max(scrollHeight, minH);
      textareaRef.current.style.height = `${Math.min(actualHeight, 130)}px`;
    }
  }, [value, minRows]);

  const variantStyles = {
    default: "bg-white rounded-[2rem] shadow-sm",
    secondary: "bg-indigo-50/50 rounded-xl border border-indigo-200", 
    note: "bg-white rounded-xl border border-ink-200 shadow-sm"
  };

  return (
    <div className={`flex items-start gap-3 px-5 py-4 transition-all border border-transparent ${variantStyles[variant]} ${focusColor} ${className}`}>
      {/* Precision alignment for mobile: mt-[6px] for better baseline match with larger text */}
      {icon && <div className="mt-[6px] shrink-0 opacity-40">{icon}</div>}
      <textarea
        ref={textareaRef}
        rows={minRows}
        maxLength={maxLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-lg font-normal text-ink-700 placeholder:text-ink-300 outline-none resize-none no-scrollbar leading-relaxed"
      />
    </div>
  );
};

const steps = [
  { id: 'happiness', title: '小确幸', subtitle: '记录 3 件让你感到开心幸福的事', color: 'bg-pink-50 text-pink-500', icon: <Smile size={24} /> },
  { id: 'achievements', title: '高光时刻', subtitle: '记录 3 件让你有成就感的小事', color: 'bg-primary-50 text-primary-600', icon: <Sparkles size={24} /> },
  { id: 'drainers', title: '能量监测', subtitle: '今天有没有让你感到消耗的事情？', color: 'bg-mint-50 text-mint-600', icon: <Battery size={24} /> },
  { id: 'mit', title: '核心复盘', subtitle: '回顾今天最重要的那一件事', color: 'bg-indigo-50 text-indigo-600', icon: <CheckCircle size={24} /> },
  { id: 'tomorrow', title: '明日展望', subtitle: '定下明天最重要的一件事', color: 'bg-purple-50 text-purple-600', icon: <Target size={24} /> },
];

export const Journal: React.FC<JournalProps> = ({ onComplete, onBack, existingEntry, yesterdayEntry }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  
  const initialTodayMit = existingEntry?.todayMitDescription || yesterdayEntry?.tomorrowMit || '';
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
      handleSubmit(true);
    }
  };

  const handleBackStep = () => {
    if (currentStep > 0) {
        setCurrentStep(c => c - 1);
    }
  };

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
      achievements: (formData.achievements || ['', '', '']) as string[],
      happiness: (formData.happiness || ['', '', '']) as string[],
      drainerLevel: formData.drainerLevel || 'none',
      drainerNote: formData.drainerNote || '',
      todayMitDescription: formData.todayMitDescription || '',
      mitCompleted: !!formData.mitCompleted,
      mitReason: formData.mitReason || '',
      tomorrowMit: formData.tomorrowMit || '',
      aiInsight: existingEntry?.aiInsight,
      aiMood: existingEntry?.aiMood
    };

    if (isCompleteFlow) {
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
        saveEntry(entry);
    }
  };

  const activeStep = steps[currentStep];

  return (
    <div className="flex flex-col h-full w-full bg-cream relative overflow-hidden z-40">
      <div className={`absolute top-0 right-0 w-[50rem] h-[50rem] rounded-full blur-[120px] opacity-80 transition-colors duration-1000 pointer-events-none z-0 translate-x-1/3 -translate-y-1/3 ${
        currentStep === 0 ? 'bg-pink-300' : 
        currentStep === 1 ? 'bg-primary-300' :
        currentStep === 2 ? 'bg-mint-300' : 
        currentStep === 3 ? 'bg-indigo-300' : 'bg-purple-300'
      }`} />
      
      <div className={`absolute top-6 left-1/2 transform -translate-x-1/2 bg-ink-900/90 text-white px-6 py-3 rounded-full text-sm font-bold shadow-lg transition-all duration-300 z-[60] flex items-center gap-2 ${showSaveToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
          <CheckCircle size={18} className="text-mint-400" />
          已保存您的记录
      </div>

      <div className="pt-8 px-6 relative z-10 flex-none">
         <div className="flex justify-between items-center mb-6">
            <button onClick={onBack} className="p-3 rounded-full text-ink-500 hover:bg-white/50 transition-all active:scale-95">
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
            <div className="w-12" />
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

      <div className="flex-1 overflow-y-auto px-6 py-6 no-scrollbar relative z-10">
        <div className="min-h-[50vh] flex flex-col pt-2 pb-40 animate-fade-in">
            
            {(currentStep === 0 || currentStep === 1) && (
              <div className="space-y-4">
                  {[0, 1, 2].map((i) => (
                    <BubbleTextarea
                      key={i}
                      icon={currentStep === 0 ? <Smile size={20} /> : <Sparkles size={20} />}
                      value={currentStep === 0 ? (formData.happiness?.[i] || '') : (formData.achievements?.[i] || '')}
                      onChange={(val) => handleArrayChange(currentStep === 0 ? 'happiness' : 'achievements', i, val)}
                      placeholder={i === 0 ? (currentStep === 0 ? "吃到好吃的早餐..." : "早起喝了一杯温水...") : "..."}
                    />
                  ))}
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                  {[
                      { id: 'none', label: '无消耗，状态不错', icon: BatteryCharging, color: 'text-mint-600 bg-mint-50 border-mint-200' },
                      { id: 'low', label: '少量消耗，有一点累', icon: Battery, color: 'text-orange-500 bg-orange-50 border-orange-200' },
                      { id: 'high', label: '大量消耗，非常疲惫', icon: BatteryLow, color: 'text-red-500 bg-red-50 border-red-200' }
                  ].map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setFormData({ ...formData, drainerLevel: option.id as any })}
                        className={`flex items-center gap-4 px-6 py-5 rounded-[2rem] text-left transition-all duration-300 border ${
                            formData.drainerLevel === option.id 
                            ? `${option.color} shadow-md scale-[1.01]` 
                            : 'bg-white text-ink-500 border-transparent shadow-sm hover:bg-white/80'
                        }`}
                      >
                        <option.icon size={24} />
                        <span className="text-lg font-bold">{option.label}</span>
                      </button>
                  ))}
                  </div>
                  
                  {formData.drainerLevel !== 'none' && (
                    <div className="animate-fade-in mt-2 px-1">
                      <BubbleTextarea
                        variant="note"
                        value={formData.drainerNote || ''}
                        onChange={(val) => setFormData({...formData, drainerNote: val})}
                        placeholder="是因为什么感到消耗？写下来，释放它..."
                        focusColor="focus-within:border-mint-400"
                        minRows={2}
                      />
                    </div>
                  )}
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                  <BubbleTextarea
                    icon={<CheckCircle size={20} />}
                    value={formData.todayMitDescription || ''}
                    onChange={(val) => setFormData({...formData, todayMitDescription: val})}
                    placeholder="原定的重要计划是..."
                    focusColor="focus-within:border-indigo-100"
                    className={formData.mitCompleted ? 'opacity-60' : ''}
                  />

                  <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setFormData({...formData, mitCompleted: true})}
                        className={`py-5 rounded-[1.8rem] flex items-center justify-center gap-2 transition-all border ${formData.mitCompleted ? 'bg-indigo-600 text-white shadow-md scale-[1.02]' : 'bg-white text-ink-400 border-transparent shadow-sm'}`}
                      >
                        <Check size={18} strokeWidth={3} />
                        <span className="font-bold">已完成</span>
                      </button>
                      <button
                        onClick={() => setFormData({...formData, mitCompleted: false})}
                        className={`py-5 rounded-[1.8rem] flex items-center justify-center gap-2 transition-all border ${!formData.mitCompleted ? 'bg-orange-100 text-orange-600 border-orange-200 shadow-sm scale-[1.02]' : 'bg-white text-ink-400 border-transparent shadow-sm'}`}
                      >
                        <X size={18} strokeWidth={3} />
                        <span className="font-bold">未完成</span>
                      </button>
                  </div>

                  <BubbleTextarea
                    variant="secondary"
                    minRows={2}
                    icon={<MessageCircle size={20} />}
                    value={formData.mitReason || ''}
                    onChange={(val) => setFormData({...formData, mitReason: val})}
                    placeholder={formData.mitCompleted ? "有什么达成心得吗？" : "遇到了什么阻碍？记录下来即是进步..."}
                    focusColor="focus-within:border-indigo-400"
                  />
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-12">
                  <BubbleTextarea
                    icon={<Target size={24} />} 
                    value={formData.tomorrowMit || ''}
                    onChange={(val) => setFormData({...formData, tomorrowMit: val})}
                    placeholder="定下一个核心目标..."
                    focusColor="focus-within:border-purple-200"
                    className="text-xl font-bold items-start"
                  />

                  {/* Help text as background content (No box) */}
                  <div className="flex items-start gap-3 px-6 py-2 opacity-60">
                      <Clock size={16} className="mt-1 text-purple-600 shrink-0" />
                      <p className="text-sm text-purple-900 font-medium leading-relaxed">
                        专注能让明天更高效。只需要写下这一件事，其它的，交给明天的你去解决。
                      </p>
                  </div>
              </div>
            )}
        </div>
      </div>

      <div className="absolute bottom-10 left-0 w-full px-6 z-50 flex gap-3 pointer-events-auto animate-fade-in">
          {currentStep > 0 && (
             <button onClick={handleBackStep} disabled={isSubmitting} className="w-14 h-14 bg-white text-ink-500 border border-ink-100 rounded-[1.5rem] shadow-sm active:scale-95 transition-all flex items-center justify-center shrink-0">
                <ArrowLeft size={20} />
             </button>
          )}

          <button onClick={handleSaveDraft} disabled={isSubmitting} className="flex-1 h-14 bg-white text-ink-900 border border-ink-100 rounded-[1.5rem] font-bold text-base shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2">
             <Save size={18} className="text-ink-400" />
             保存
          </button>

          <button
            onClick={currentStep === steps.length - 1 ? () => handleSubmit(true) : handleNext}
            disabled={isSubmitting}
            className="flex-[2] h-14 bg-ink-900 text-white rounded-[1.5rem] font-bold text-base shadow-glow hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-80"
          >
             {isSubmitting ? <Loader2 className="animate-spin" /> : (currentStep === steps.length - 1 ? '完成' : '下一步')}
             {!isSubmitting && (currentStep === steps.length - 1 ? <Check size={18} /> : <ArrowRight size={18} />)}
          </button>
      </div>
    </div>
  );
};