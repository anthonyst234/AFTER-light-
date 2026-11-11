import React, { useEffect, useState } from 'react';
import { sound } from '../game/audio';
import { Terminal, Shield, Sparkles, Zap, ChevronRight } from 'lucide-react';

interface LoadingScreenProps {
  onComplete: () => void;
}

const BOOT_LOGS = [
  'BOOTSTRAP: INITIALIZING AFTERLIGHT ENGINE V2.0...',
  'GFX: CONFIGURING DUAL-LAYER PARALLAX SHADERS...',
  'AUDIO: MOUNTING WEB AUDIO SYNTHESIS PIPELINE...',
  'PHYSICS: TUNING RUNNER GRAVITY & FLIGHT MATRIX...',
  'SECURITY: SECURING ISOLATED RUNNER PROFILES...',
  'SYSTEM: ALL CIRCUITS NOMINAL. READY FOR ENTRY.',
];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [logIndex, setLogIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 2200; // 2.2 seconds smooth simulated arcade boot

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(pct);

      const targetLog = Math.min(
        BOOT_LOGS.length - 1,
        Math.floor((pct / 100) * BOOT_LOGS.length)
      );
      setLogIndex(targetLog);

      if (pct >= 100) {
        clearInterval(interval);
        setIsReady(true);
      }
    }, 40);

    return () => clearInterval(interval);
  }, []);

  const handleEnter = () => {
    sound.initAudio();
    sound.playClick();
    onComplete();
  };

  return (
    <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-between p-6 sm:p-12 text-white font-sans select-none overflow-hidden">
      {/* Background Cyber Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />
      <div className="absolute inset-0 bg-radial from-cyan-950/20 via-black/80 to-black pointer-events-none" />
      <div className="scanlines absolute inset-0 pointer-events-none opacity-40" />

      {/* Header Info */}
      <div className="w-full max-w-xl flex items-center justify-between text-xs font-mono text-cyan-400/80 z-10 border-b border-cyan-900/50 pb-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="tracking-widest uppercase">AFTERLIGHT // SYSTEM BOOTLOADER</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>PORT 3000 · ONLINE</span>
        </div>
      </div>

      {/* Center Cinematic Logo & Progress */}
      <div className="w-full max-w-lg flex flex-col items-center my-auto z-10">
        {/* Animated Cyber Logo */}
        <div className="relative mb-6 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 p-0.5 shadow-[0_0_40px_rgba(6,182,212,0.4)] animate-pulse">
            <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center">
              <Zap className="w-8 h-8 text-cyan-400 fill-cyan-400/20" />
            </div>
          </div>

          <h1 className="font-pixel text-2xl sm:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-purple-300 tracking-wider text-center mt-4 drop-shadow-[0_0_15px_rgba(6,182,212,0.6)]">
            AFTERLIGHT
          </h1>
          <p className="font-mono text-xs text-slate-400 tracking-widest mt-1 uppercase">
            2D Endless Cyberpunk Runner · V2.0
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl p-1.5 shadow-2xl backdrop-blur-md">
          <div className="relative h-4 bg-slate-950 rounded-lg overflow-hidden flex items-center">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 transition-all duration-75 ease-out rounded-lg"
              style={{ width: `${progress}%` }}
            />
            {/* Gloss shine */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Progress Percentage & Status */}
        <div className="w-full flex justify-between items-center mt-3 text-xs font-mono">
          <span className="text-cyan-400 font-bold tracking-wider">
            {progress < 100 ? 'INITIALIZING PROTOCOLS...' : 'BOOT COMPLETE'}
          </span>
          <span className="font-pixel text-sm text-white">{progress}%</span>
        </div>

        {/* Terminal Boot Log */}
        <div className="w-full mt-4 bg-black/60 border border-slate-800 rounded-lg p-2.5 font-mono text-[11px] text-slate-400 flex items-center gap-2">
          <span className="text-cyan-400 font-bold">&gt;</span>
          <span className="truncate">{BOOT_LOGS[logIndex]}</span>
        </div>

        {/* Enter Button (Appears when ready or user can click) */}
        {isReady && (
          <button
            onClick={handleEnter}
            className="mt-8 px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-95 text-slate-950 font-pixel text-xs sm:text-sm font-bold tracking-wider rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.6)] flex items-center gap-2.5 transition-all cursor-pointer animate-bounce"
          >
            <span>ENTER CYBERSPACE</span>
            <ChevronRight className="w-4 h-4 text-slate-950" />
          </button>
        )}
      </div>

      {/* Footer Info */}
      <div className="w-full max-w-xl text-center text-[10px] font-mono text-slate-500 z-10 border-t border-slate-900 pt-3">
        <span>AUTHENTIC ARCADE GAMEPLAY · RESPONSIVE DESKTOP & MOBILE · STEREO AUDIO</span>
      </div>
    </div>
  );
};
