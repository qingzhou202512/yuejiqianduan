import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, CloudRain, Wind, Radio } from 'lucide-react';

type SoundType = 'rain' | 'wind' | 'white';

export const Meditation: React.FC = () => {
  const [duration, setDuration] = useState(180); // 3 mins default
  const [timeLeft, setTimeLeft] = useState(180);
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [soundType, setSoundType] = useState<SoundType>('rain');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const soundNodesRef = useRef<any[]>([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopSound();
  }, []);

  // Update timer
  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      stopSound();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  const createWhiteNoiseBuffer = (ctx: AudioContext) => {
    const bufferSize = ctx.sampleRate * 2; // 2 seconds
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  };

  const playSound = () => {
    stopSound(); // Ensure clear previous
    initAudio();
    const ctx = audioContextRef.current;
    if (!ctx) return;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(isMuted ? 0 : 0.5, ctx.currentTime);
    masterGain.connect(ctx.destination);
    gainNodeRef.current = masterGain;

    const noiseBuffer = createWhiteNoiseBuffer(ctx);
    
    // Sound synthesis logic (same as before but preserved functionality)
    if (soundType === 'white') {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer;
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1000;
      src.connect(filter).connect(masterGain);
      src.start();
      soundNodesRef.current.push(src);
    } 
    else if (soundType === 'wind') {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer;
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400;
      filter.Q.value = 0;
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.1; 
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 300; 
      lfo.connect(lfoGain).connect(filter.frequency);
      src.connect(filter).connect(masterGain);
      src.start();
      lfo.start();
      soundNodesRef.current.push(src, lfo);
    }
    else if (soundType === 'rain') {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer;
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800; 
      const lfo = ctx.createOscillator();
      lfo.type = 'triangle';
      lfo.frequency.value = 4; 
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.1; 
      const rainGain = ctx.createGain();
      rainGain.gain.value = 0.8;
      lfo.connect(lfoGain).connect(rainGain.gain);
      src.connect(filter).connect(rainGain).connect(masterGain);
      src.start();
      lfo.start();
      soundNodesRef.current.push(src, lfo);
    }
  };

  const stopSound = () => {
    soundNodesRef.current.forEach(node => {
      try { node.stop(); } catch(e) {}
      try { node.disconnect(); } catch(e) {}
    });
    soundNodesRef.current = [];
  };

  const toggleTimer = () => {
    if (!isActive) {
      setIsActive(true);
      playSound();
    } else {
      setIsActive(false);
      stopSound();
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    stopSound();
    setTimeLeft(duration);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (gainNodeRef.current && audioContextRef.current) {
      gainNodeRef.current.gain.setTargetAtTime(!isMuted ? 0 : 0.5, audioContextRef.current.currentTime, 0.1);
    }
  };

  const changeSound = (type: SoundType) => {
    setSoundType(type);
    if (isActive) {
      setTimeout(() => { if (isActive) playSound(); }, 50);
    }
  };

  useEffect(() => {
    if (isActive) { playSound(); }
  }, [soundType]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const setPreset = (mins: number) => {
    const newTime = mins * 60;
    setDuration(newTime);
    setTimeLeft(newTime);
    setIsActive(false);
    stopSound();
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center relative overflow-hidden bg-cream">
      {/* Background Blobs */}
      <div className={`absolute top-1/4 left-1/4 w-72 h-72 bg-primary-200/40 rounded-full blur-3xl transition-all duration-[3000ms] mix-blend-multiply ${isActive ? 'scale-150 animate-breathe' : 'scale-100'}`} />
      <div className={`absolute bottom-1/4 right-1/4 w-72 h-72 bg-mint-200/40 rounded-full blur-3xl transition-all duration-[4000ms] mix-blend-multiply ${isActive ? 'scale-125 animate-float' : 'scale-100'}`} />

      <div className="z-10 w-full max-w-sm flex flex-col items-center">
        <h2 className="text-3xl font-bold text-ink-900 mb-2">呼吸 & 冥想</h2>
        <p className="text-ink-500 mb-12">关注当下，感受呼吸</p>

        {/* Timer Display */}
        <div className="mb-12 relative group">
          <div className="text-7xl font-light text-ink-900 tabular-nums tracking-tight">
            {formatTime(timeLeft)}
          </div>
          {/* Subtle indicator under timer */}
          {isActive && (
              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-bounce delay-0"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-bounce delay-150"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-bounce delay-300"></div>
              </div>
          )}
        </div>

        {/* Play Controls */}
        <div className="flex items-center gap-10 mb-12">
            <button onClick={toggleMute} className="p-4 text-ink-400 hover:text-ink-900 bg-white shadow-soft rounded-full transition-all hover:scale-110">
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            
            <button 
            onClick={toggleTimer}
            className="w-24 h-24 bg-ink-900 text-white rounded-[2rem] flex items-center justify-center shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all"
            >
            {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
            </button>

            <button onClick={resetTimer} className="p-4 text-ink-400 hover:text-ink-900 bg-white shadow-soft rounded-full transition-all hover:scale-110">
                <RotateCcw size={20} />
            </button>
        </div>

        {/* Settings Container */}
        <div className="bg-white/60 backdrop-blur-md p-2 rounded-[2rem] shadow-sm w-full">
            {/* Sound Presets */}
            <div className="flex justify-between p-2 mb-2">
                {[
                { id: 'rain', icon: CloudRain },
                { id: 'wind', icon: Wind },
                { id: 'white', icon: Radio },
                ].map((s) => (
                <button
                    key={s.id}
                    onClick={() => changeSound(s.id as SoundType)}
                    className={`p-3 rounded-2xl transition-all ${
                    soundType === s.id 
                        ? 'bg-primary-100 text-primary-600 shadow-inner' 
                        : 'text-ink-400 hover:bg-white'
                    }`}
                >
                    <s.icon size={24} />
                </button>
                ))}
            </div>
            
            {/* Divider */}
            <div className="h-px w-full bg-gray-100 my-1"></div>

            {/* Time Presets */}
            <div className="flex justify-between p-2">
                {[3, 5, 10].map(min => (
                <button
                    key={min}
                    onClick={() => setPreset(min)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                    duration === min * 60 
                    ? 'bg-white text-ink-900 shadow-sm' 
                    : 'text-ink-400 hover:text-ink-600'
                    }`}
                >
                    {min} min
                </button>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};