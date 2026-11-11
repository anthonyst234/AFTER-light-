import React, { useCallback } from 'react';
import { ArrowUp, ArrowDown, Zap, ChevronUp } from 'lucide-react';
import { SkillType } from '../game/types';
import { SKILLS_CONFIG } from '../game/constants';

interface MobileControlsProps {
  onJump: () => void;
  onDoubleJump: () => void;
  onSlide: () => void;
  onDash?: () => void;
  dashCooldown?: number;
  isDashing?: boolean;
  onSkill: () => void;
  selectedSkill: SkillType;
  skillCharges: number;
  skillCooldown: number;
  activeSkill: SkillType | null;
  powerSurgeActive?: boolean;
  onPowerSurge?: () => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onJump,
  onDoubleJump,
  onSlide,
  onDash,
  dashCooldown = 0,
  isDashing = false,
  onSkill,
  selectedSkill,
  skillCharges,
  skillCooldown,
  activeSkill,
  powerSurgeActive,
  onPowerSurge,
}) => {
  const skill = SKILLS_CONFIG[selectedSkill];

  // Prevent event propagation and double-clicks
  const handleTouch = useCallback((e: React.PointerEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  }, []);

  return (
    <div className="absolute bottom-0 inset-x-0 pointer-events-none p-3 sm:p-5 flex items-end justify-between select-none z-10">
      {/* Left Hand: SLIDE & DASH BUTTONS */}
      <div className="pointer-events-auto flex items-end gap-2.5 sm:gap-3">
        {/* SLIDE BUTTON */}
        <button
          type="button"
          onPointerDown={(e) => handleTouch(e, onSlide)}
          className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-slate-900/80 hover:bg-slate-800/80 active:scale-90 border-2 border-slate-700/60 active:border-amber-400 flex flex-col items-center justify-center text-slate-200 shadow-2xl backdrop-blur-xs transition-transform touch-none cursor-pointer"
          aria-label="Slide"
        >
          <ArrowDown className="w-5 h-5 text-amber-400 mb-0.5" />
          <span className="font-pixel text-[8px] tracking-wider text-slate-300 font-bold">SLIDE</span>
          <span className="text-[7px] text-slate-400 font-sans-clean mt-0.5 hidden sm:block">↓ / S</span>
        </button>

        {/* DASH BUTTON */}
        <button
          type="button"
          onPointerDown={(e) => handleTouch(e, onDash || (() => {}))}
          disabled={dashCooldown > 0}
          className={`w-16 h-16 sm:w-18 sm:h-18 rounded-2xl flex flex-col items-center justify-center shadow-2xl backdrop-blur-xs transition-transform touch-none cursor-pointer border-2 ${
            isDashing
              ? 'bg-cyan-500 border-white text-slate-950 scale-95 animate-pulse'
              : dashCooldown <= 0
              ? 'bg-slate-900/80 hover:bg-slate-800/80 active:scale-90 border-cyan-400/60 text-cyan-300'
              : 'bg-slate-950/70 border-slate-800 text-slate-600 opacity-60'
          }`}
          aria-label="Dash"
        >
          <Zap className="w-5 h-5 text-cyan-400 mb-0.5" />
          <span className="font-pixel text-[8px] tracking-wider font-bold">
            {dashCooldown > 0 ? `${dashCooldown.toFixed(1)}s` : 'DASH'}
          </span>
          <span className="text-[7px] text-slate-400 font-sans-clean mt-0.5 hidden sm:block">SHIFT / C</span>
        </button>
      </div>

      {/* Right Hand: SKILL, DOUBLE JUMP, JUMP */}
      <div className="pointer-events-auto flex items-end gap-2.5 sm:gap-3.5">
        {/* SKILL BUTTON */}
        <button
          type="button"
          onPointerDown={(e) => handleTouch(e, onSkill)}
          disabled={skillCharges <= 0 || activeSkill !== null || skillCooldown > 0}
          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex flex-col items-center justify-center border-2 shadow-2xl backdrop-blur-xs transition-transform touch-none cursor-pointer ${
            activeSkill
              ? 'bg-sky-500/80 border-sky-300 text-white animate-pulse'
              : skillCharges > 0 && skillCooldown <= 0
              ? 'bg-slate-900/75 hover:bg-slate-800/80 active:scale-90 border-sky-400/60 text-sky-300'
              : 'bg-slate-950/60 border-slate-800 text-slate-600 opacity-60'
          }`}
          aria-label="Activate Skill"
        >
          <Zap className="w-5 h-5 mb-0.5" />
          <span className="font-pixel text-[8px] tracking-wide font-bold">
            {activeSkill ? 'ACTIVE' : `x${skillCharges}`}
          </span>
          <span className="text-[7px] text-slate-400 font-sans-clean hidden sm:block">E / X</span>
        </button>

        {/* DOUBLE JUMP BUTTON */}
        <button
          type="button"
          onPointerDown={(e) => handleTouch(e, onDoubleJump)}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-900/75 hover:bg-slate-800/80 active:scale-90 border-2 border-indigo-500/50 active:border-indigo-400 flex flex-col items-center justify-center text-indigo-300 shadow-2xl backdrop-blur-xs transition-transform touch-none cursor-pointer"
          aria-label="Double Jump"
        >
          <div className="flex flex-col items-center -space-y-2 mb-0.5">
            <ChevronUp className="w-4 h-4 text-indigo-400" />
            <ChevronUp className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="font-pixel text-[7px] tracking-tight font-bold text-slate-200">2x JUMP</span>
        </button>

        {/* PRIMARY JUMP BUTTON / ONE-SHOT STRIKE */}
        <button
          type="button"
          onPointerDown={(e) => handleTouch(e, powerSurgeActive ? (onPowerSurge || onJump) : onJump)}
          className={`w-18 h-18 sm:w-20 sm:h-20 rounded-2xl flex flex-col items-center justify-center shadow-2xl backdrop-blur-xs transition-transform touch-none cursor-pointer ${
            powerSurgeActive
              ? 'bg-gradient-to-t from-yellow-400 to-amber-300 border-2 border-white animate-pulse text-slate-950 font-black shadow-[0_0_20px_rgba(250,204,21,0.8)]'
              : 'bg-gradient-to-t from-sky-600/80 to-sky-500/90 active:scale-90 border-2 border-sky-300 text-white'
          }`}
          aria-label={powerSurgeActive ? 'One-Shot Strike' : 'Jump'}
        >
          {powerSurgeActive ? (
            <>
              <Zap className="w-7 h-7 text-slate-950 mb-0.5 fill-current animate-bounce" />
              <span className="font-pixel text-[8px] tracking-tight font-black text-slate-950">STRIKE!</span>
            </>
          ) : (
            <>
              <ArrowUp className="w-7 h-7 text-white mb-0.5" />
              <span className="font-pixel text-[10px] tracking-wider font-bold">JUMP</span>
              <span className="text-[8px] text-sky-100/80 font-sans-clean mt-0.5 hidden sm:block">SPACE / ↑</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
