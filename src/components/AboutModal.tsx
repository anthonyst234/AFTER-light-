import React from 'react';
import { sound } from '../game/audio';
import { X, Info, Gamepad2, Sparkles, Feather, Flame, Shield, ArrowUp, ArrowDown, Zap, BookOpen, Ghost } from 'lucide-react';

interface AboutModalProps {
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
  return (
    <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-40 select-none font-sans">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-950/60 border border-sky-500/40 flex items-center justify-center text-sky-400">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-pixel text-sm sm:text-base text-white">ABOUT AFTERLIGHT 2.0</h2>
              <p className="text-xs text-slate-400">The City Never Sleeps. Neither Do You.</p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed">
          {/* Lore Section */}
          <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl">
            <h3 className="font-pixel text-xs text-sky-400 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>THE PREMISE & WORLD</span>
            </h3>
            <p>
              In a sprawling cyberpunk metropolis suspended above an abyss, you run without pause. As you recover lost gold coins scattered across the spires, vibrant frequencies of light and colour flood back into the architecture. Survive procedural hazard gauntlets, outrun colossal predatory titans, discover ancient lore in the Codex, and race against your personal best Ghost.
            </p>
          </div>

          {/* Controls Breakdown */}
          <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl">
            <h3 className="font-pixel text-xs text-amber-400 mb-3 flex items-center gap-2">
              <Gamepad2 className="w-4 h-4" />
              <span>CONTROLS & MOVEMENT</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-start gap-2.5">
                <ArrowUp className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-pixel text-[9px] mb-0.5">JUMP & DOUBLE JUMP</strong>
                  <span className="text-[11px]">Press <kbd className="bg-slate-800 px-1 py-0.5 rounded text-sky-300">Space</kbd>, <kbd className="bg-slate-800 px-1 py-0.5 rounded text-sky-300">W</kbd>, or <kbd className="bg-slate-800 px-1 py-0.5 rounded text-sky-300">↑</kbd>. Tap midair for double jump. On mobile, use Jump / 2x Jump or swipe up.</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-start gap-2.5">
                <ArrowDown className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-pixel text-[9px] mb-0.5">CROUCH & SLIDE</strong>
                  <span className="text-[11px]">Press <kbd className="bg-slate-800 px-1 py-0.5 rounded text-amber-300">S</kbd> or <kbd className="bg-slate-800 px-1 py-0.5 rounded text-amber-300">↓</kbd> or swipe down. Drops collision height to slide under overhead lasers, guillotines, and spikes.</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-start gap-2.5">
                <Zap className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-pixel text-[9px] mb-0.5">SUPERSONIC DASH</strong>
                  <span className="text-[11px]">Press <kbd className="bg-slate-800 px-1 py-0.5 rounded text-cyan-300">Shift</kbd> or <kbd className="bg-slate-800 px-1 py-0.5 rounded text-cyan-300">C</kbd> or swipe right. High speed invulnerable burst through dangerous traps with a 1.8s recharge.</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-start gap-2.5">
                <Shield className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-pixel text-[9px] mb-0.5">RUNNER SKILLS</strong>
                  <span className="text-[11px]">Press <kbd className="bg-slate-800 px-1 py-0.5 rounded text-indigo-300">E</kbd> or <kbd className="bg-slate-800 px-1 py-0.5 rounded text-indigo-300">X</kbd> or tap Skill button to trigger Shield Burst, Coin Magnet, Time Bend, or Phase Shift.</span>
                </div>
              </div>
            </div>
          </div>

          {/* New 2.0 Features */}
          <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl">
            <h3 className="font-pixel text-xs text-rose-400 mb-2 flex items-center gap-2">
              <Flame className="w-4 h-4" />
              <span>AFTERLIGHT 2.0 HIGHLIGHTS</span>
            </h3>
            <ul className="space-y-1.5 text-slate-300 list-disc list-inside text-[11px]">
              <li><strong>Near-Miss & Combo Multipliers:</strong> Skim close to razor hazards to trigger Near-Miss bonuses and escalate your Combo Multiplier up to 10x for massive scores.</li>
              <li><strong>Personal Best Ghost Runner:</strong> Compete live against your recorded PB ghost with real-time distance delta tracking.</li>
              <li><strong>Player Leveling & Prestige Titles:</strong> Accumulate lifetime XP from runs, combos, and missions to unlock 50+ player levels and prestigious courier titles.</li>
              <li><strong>Afterlight Codex:</strong> Complete your comprehensive archive of 30+ characters, worlds, hazards, bosses, and ancient relics.</li>
              <li><strong>Boss Trap Barrage & Power Surge:</strong> Dodge all obstacles during boss sequences to charge the 200-coin One-Shot Titan Strike!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
