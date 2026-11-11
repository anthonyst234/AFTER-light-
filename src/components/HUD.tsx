import React from 'react';
import { SkillType, Boss } from '../game/types';
import { SKILLS_CONFIG } from '../game/constants';
import { sound } from '../game/audio';
import { Pause, Feather, Flame, Clock, Zap, AlertTriangle, Timer, Swords, Shield, Magnet, Ghost, Heart } from 'lucide-react';

interface HUDProps {
  distance: number;
  coins: number;
  highScore: number;
  speed: number;
  revivalWings: number;
  paletteTier: string;
  activeSkill: SkillType | null;
  skillTimeLeft: number;
  skillCooldown: number;
  skillCharges: number;
  selectedSkill: SkillType;
  boss: Boss | null;
  combo?: number;
  comboTimer?: number;
  ghostDelta?: number | null;
  dashCooldown?: number;
  isDashing?: boolean;
  score?: number;
  powerSurgeActive?: boolean;
  timeRemaining?: number;
  isFlying?: boolean;
  flightProgress?: number;
  flightDistanceRemaining?: number;
  tagTeamActive?: boolean;
  isHardcore?: boolean;
  isWaitingAtRescueBox?: boolean;
  teasingMessage?: string | null;
  onPause: () => void;
  onActivateSkill: () => void;
  onPowerSurgeStrike?: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  distance,
  coins,
  highScore,
  speed,
  revivalWings,
  paletteTier,
  activeSkill,
  skillTimeLeft,
  skillCooldown,
  skillCharges,
  selectedSkill,
  boss,
  powerSurgeActive,
  timeRemaining,
  combo = 1,
  comboTimer = 0,
  ghostDelta = null,
  dashCooldown = 0,
  isDashing = false,
  score = 0,
  isFlying = false,
  flightProgress = 0,
  flightDistanceRemaining = 0,
  tagTeamActive = false,
  isHardcore = false,
  isWaitingAtRescueBox = false,
  teasingMessage = null,
  onPause,
  onActivateSkill,
  onPowerSurgeStrike,
}) => {
  const isTrapSpawningPhase = boss && (boss.state === 'ENTERING' || boss.state === 'ACTIVE');
  const isPowerSurgeReady = powerSurgeActive || boss?.state === 'VULNERABLE';
  const remainingBarrageSeconds = boss ? Math.max(0, boss.duration - boss.timer) : 0;
  const barrageProgress = boss ? Math.min(1, Math.max(0, boss.timer / boss.duration)) : 0;
  const isUrgent = remainingBarrageSeconds <= 3.5 && isTrapSpawningPhase;

  // Render specific icon for each skill
  const renderSkillIcon = (skill: SkillType, className = 'w-3.5 h-3.5') => {
    switch (skill) {
      case 'SHIELD_BURST':
        return <Shield className={className} />;
      case 'COIN_MAGNET':
        return <Magnet className={className} />;
      case 'TIME_BEND':
        return <Clock className={className} />;
      case 'PHASE_SHIFT':
        return <Ghost className={className} />;
      case 'SECOND_CHANCE':
        return <Heart className={className} />;
      default:
        return <Zap className={className} />;
    }
  };

  return (
    <>
      {/* 1. DISTINCT VISUAL CUE: SUBTLE NON-BLOCKING TOP ACCENT WHEN POWER SURGE IS READY */}
      {isPowerSurgeReady && (
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500 shadow-[0_0_15px_#facc15] pointer-events-none z-30 animate-pulse" />
      )}

      {/* 2. NON-BLOCKING SKILL POP NOTIFICATION (Docked neatly up in top right) */}
      {activeSkill && (
        <div className="absolute top-16 right-3 sm:top-18 sm:right-5 pointer-events-none z-35 transition-all duration-300 ease-out animate-in fade-in slide-in-from-top-2">
          <div
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-950/90 backdrop-blur-md border shadow-2xl"
            style={{
              borderColor: `${SKILLS_CONFIG[activeSkill]?.color || '#38bdf8'}90`,
              boxShadow: `0 4px 20px -2px ${SKILLS_CONFIG[activeSkill]?.color || '#38bdf8'}50`,
            }}
          >
            {/* Skill Icon badge with glowing background */}
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm animate-pulse"
              style={{ backgroundColor: SKILLS_CONFIG[activeSkill]?.color || '#38bdf8' }}
            >
              {renderSkillIcon(activeSkill, 'w-3.5 h-3.5')}
            </div>

            {/* Title & Micro Countdown */}
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-pixel text-[8px] text-white tracking-wide">
                  {SKILLS_CONFIG[activeSkill]?.name || activeSkill}
                </span>
                <span
                  className="font-mono-num text-[9px] font-bold"
                  style={{ color: SKILLS_CONFIG[activeSkill]?.color || '#38bdf8' }}
                >
                  {Math.max(0, skillTimeLeft).toFixed(1)}s
                </span>
              </div>

              {/* Slim visual duration line */}
              <div className="w-20 sm:w-24 h-1 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                <div
                  className="h-full transition-all duration-75"
                  style={{
                    backgroundColor: SKILLS_CONFIG[activeSkill]?.color || '#38bdf8',
                    width: `${Math.max(0, (skillTimeLeft / (SKILLS_CONFIG[activeSkill]?.duration || 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. MAIN HUD LAYER */}
      <div className="absolute inset-0 pointer-events-none p-3 sm:p-5 flex flex-col justify-between select-none z-30">
        {/* Top Bar Cluster */}
        <div className="flex items-start justify-between w-full">
          {/* Left: Distance, Score, Combo & Ghost Lead */}
          <div className="flex flex-col gap-1.5 pointer-events-auto">
            <div className="flex items-center gap-2">
              <div className="flex items-baseline gap-2 bg-black/70 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-white/10 shadow-lg">
                <span className="font-pixel text-xs text-slate-400">DIST</span>
                <span className="font-mono-num text-xl sm:text-2xl font-bold text-white tracking-wider">
                  {distance}
                  <span className="text-xs text-sky-400 ml-1">m</span>
                </span>
              </div>

              {/* Combo Multiplier Badge */}
              {combo > 1 && (
                <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/25 border border-amber-400/60 px-2.5 py-1.5 rounded-lg shadow-lg animate-pulse">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <div className="flex flex-col">
                    <span className="font-pixel text-[9px] font-black text-amber-300">
                      x{combo} COMBO
                    </span>
                    <div className="w-12 h-1 bg-slate-900 rounded-full overflow-hidden mt-0.5">
                      <div
                        className="h-full bg-amber-400 transition-all duration-75"
                        style={{ width: `${Math.min(100, Math.max(0, (comboTimer / 2.5) * 100))}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3 text-xs text-slate-400 px-1 font-mono-num">
              <span>SCORE: <strong className="text-white">{score.toLocaleString()}</strong></span>
              <span>·</span>
              <span>BEST: <strong className="text-amber-400">{highScore}m</strong></span>
            </div>

            {/* Hardcore Mode Indicator */}
            {isHardcore && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono-num font-bold border border-rose-500/60 bg-rose-950/70 text-rose-300 shadow-md shadow-rose-950/40 w-fit">
                <span>📳</span>
                <span>HARDCORE · 3x SCORE</span>
              </div>
            )}

            {/* Tag-Team Partner Active Indicator */}
            {tagTeamActive && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono-num font-bold border border-sky-400/60 bg-sky-950/70 text-sky-300 shadow-md shadow-sky-500/20 w-fit animate-pulse">
                <span>🤝</span>
                <span>TAG-TEAM · 2ND LIFE READY</span>
              </div>
            )}

            {/* Ghost lead/lag indicator */}
            {ghostDelta !== null && (
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono-num font-bold border w-fit ${
                ghostDelta >= 0
                  ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                  : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
              }`}>
                <Ghost className="w-3 h-3 shrink-0" />
                <span>PB GHOST: {ghostDelta >= 0 ? `+${ghostDelta}m` : `${ghostDelta}m`}</span>
              </div>
            )}

            {/* Dash cooldown meter */}
            {dashCooldown > 0 && (
              <div className="flex items-center gap-1 text-[9px] font-mono text-cyan-400/90 px-1">
                <Zap className="w-2.5 h-2.5 animate-pulse" />
                <span>DASH RECHARGING: {dashCooldown.toFixed(1)}s</span>
              </div>
            )}

            {/* Palette Tier status */}
            <div className="text-[10px] text-slate-400 tracking-wider font-sans-clean px-1">
              SECTOR: <span className="text-white/80 font-medium">{paletteTier}</span>
            </div>
          </div>

          {/* Center: Boss Challenge Phase & Visual Countdown / Standard Mode Timers */}
          {boss ? (
            <div className="flex flex-col items-center pointer-events-auto max-w-[320px] sm:max-w-md w-full px-2">
              {/* CLEAR CHALLENGE PHASE NOTIFICATION */}
              {isTrapSpawningPhase ? (
                <div className="w-full flex flex-col items-center gap-1.5">
                  {/* Challenge Phase Badge */}
                  <div className="flex items-center justify-between w-full px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/50 shadow-md">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className={`w-3.5 h-3.5 text-amber-400 ${isUrgent ? 'animate-bounce text-rose-400' : 'animate-pulse'}`} />
                      <span className="font-pixel text-[8px] sm:text-[9px] text-amber-300 font-bold tracking-wider">
                        CHALLENGE PHASE
                      </span>
                    </div>
                    <span className="font-pixel text-[7px] text-amber-200/80 uppercase truncate max-w-[120px]">
                      {boss.name}
                    </span>
                  </div>

                  {/* VISUAL COUNTDOWN DURING TRAP SPAWNING SEQUENCE */}
                  <div className={`w-full bg-black/85 rounded-xl border p-2 shadow-2xl transition-all ${
                    isUrgent
                      ? 'border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.4)] animate-pulse'
                      : 'border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                  }`}>
                    {/* Countdown Header Info */}
                    <div className="flex items-center justify-between mb-1 text-[9px]">
                      <div className="flex items-center gap-1 text-slate-300 font-sans-clean">
                        <Timer className={`w-3.5 h-3.5 ${isUrgent ? 'text-rose-400 animate-spin' : 'text-amber-400'}`} />
                        <span className="font-bold tracking-tight">TRAP BARRAGE:</span>
                      </div>
                      {/* Big Digital Countdown */}
                      <div className="flex items-baseline gap-1">
                        <span className={`font-mono-num text-base sm:text-lg font-black tracking-wider ${
                          isUrgent ? 'text-rose-400' : 'text-amber-300'
                        }`}>
                          {remainingBarrageSeconds.toFixed(1)}s
                        </span>
                        <span className="font-pixel text-[7px] text-slate-400">LEFT</span>
                      </div>
                    </div>

                    {/* Visual Progress Bar (Filling towards Power Surge) */}
                    <div className="w-full h-3.5 bg-slate-950 rounded-full border border-slate-700/80 overflow-hidden relative shadow-inner">
                      <div
                        className={`h-full transition-all duration-75 relative ${
                          isUrgent
                            ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-rose-600 hazard-stripes'
                            : 'bg-gradient-to-r from-yellow-500 via-amber-500 to-amber-400 hazard-stripes-amber'
                        }`}
                        style={{ width: `${Math.round(barrageProgress * 100)}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center font-pixel text-[7.5px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                        {isUrgent ? '⚡ SURGE CHARGING: HOLD ON!' : 'DODGE HAZARDS TO CHARGE SURGE'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Non-trap phase (Vulnerable / Strike / Defeated) */
                <div className="w-full flex flex-col items-center">
                  <div className="flex items-center gap-2 mb-1">
                    <Flame className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
                    <span className="font-pixel text-[9px] sm:text-[10px] text-yellow-300 tracking-wide text-center truncate">
                      {boss.name} — {boss.state === 'VULNERABLE' ? 'DEFENSES DOWN!' : 'CRITICAL HIT!'}
                    </span>
                  </div>
                  <div className="w-full h-3.5 bg-black/80 rounded-full border border-yellow-400/60 overflow-hidden relative shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-400 via-amber-300 to-sky-300 animate-pulse transition-all duration-100"
                      style={{ width: '100%' }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center font-pixel text-[8px] font-bold text-slate-950 drop-shadow">
                      {boss.state === 'STRIKE' ? 'TITAN ONE-SHOT STRIKE!' : 'POWER SURGE UNLEASHED!'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : isFlying ? (
            <div className="flex flex-col items-center pointer-events-auto max-w-[280px] sm:max-w-sm w-full px-2">
              <div className="w-full bg-slate-950/90 rounded-xl border border-sky-400/70 p-2 shadow-[0_0_20px_rgba(56,189,248,0.35)]">
                <div className="flex items-center justify-between mb-1 text-[9px]">
                  <div className="flex items-center gap-1.5 text-sky-300 font-bold">
                    <Feather className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                    <span className="font-pixel text-[8px] sm:text-[9px]">FLIGHT EXPEDITION</span>
                  </div>
                  <span className="font-mono-num font-bold text-white text-[10px]">
                    {flightDistanceRemaining}m LEFT
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-900 rounded-full border border-sky-500/40 overflow-hidden relative shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 via-indigo-400 to-cyan-300 transition-all duration-75"
                    style={{ width: `${Math.round(flightProgress * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ) : timeRemaining !== undefined ? (
            <div className="flex items-center gap-2 bg-amber-950/80 border border-amber-500/30 px-3 py-1.5 rounded-lg pointer-events-auto">
              <Clock className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
              <span className="font-pixel text-xs text-amber-300">TIME:</span>
              <span className="font-mono-num text-lg font-bold text-white">{timeRemaining}s</span>
            </div>
          ) : null}

          {/* Right: Coins, Wings & Pause */}
          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Coins Count */}
            <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-amber-500/30 shadow-lg">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 border border-yellow-200 flex items-center justify-center shadow-xs">
                <span className="text-[9px] font-bold text-amber-950">$</span>
              </div>
              <span className="font-mono-num text-lg font-bold text-amber-300 tracking-wide">
                {coins}
              </span>
            </div>

            {/* Revival Wings Indicator */}
            <div className="flex items-center gap-1 bg-black/70 px-2.5 py-1.5 rounded-lg border border-sky-400/20 text-xs text-sky-300" title="Angel Wings available for revival">
              <Feather className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-mono-num font-bold text-white">{revivalWings}</span>
            </div>

            {/* Pause Button */}
            <button
              onClick={() => {
                sound.playClick();
                onPause();
              }}
              aria-label="Pause Game"
              className="w-9 h-9 rounded-lg bg-black/60 hover:bg-white/10 active:scale-95 border border-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-transform cursor-pointer"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4. COMPACT TOP NOTIFICATION: BOSS INCOMING (NON-BLOCKING) */}
        {boss && boss.introBannerTimer > 0 && isTrapSpawningPhase && (
          <div className="absolute top-16 sm:top-18 left-1/2 -translate-x-1/2 pointer-events-none z-35 animate-in fade-in slide-in-from-top-2 max-w-sm sm:max-w-md w-[92%] px-2">
            <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-full bg-slate-950/90 backdrop-blur-md border border-amber-400/80 shadow-[0_4px_20px_rgba(245,158,11,0.35)]">
              <div className="flex items-center gap-1.5 shrink-0">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                <span className="font-pixel text-[8px] sm:text-[9px] text-amber-300 font-bold tracking-wide">
                  BOSS INCOMING
                </span>
              </div>
              <span className="text-[10px] text-white/90 truncate font-semibold">
                Survive {boss.duration}s traps → Unlock 200g Strike!
              </span>
            </div>
          </div>
        )}

        {/* 5. COMPACT TOP ACTION PILL: POWER SURGE READY (NON-BLOCKING) */}
        {isPowerSurgeReady && (
          <div className="absolute top-16 sm:top-18 left-1/2 -translate-x-1/2 pointer-events-auto z-40 animate-bounce max-w-sm sm:max-w-md w-auto px-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/95 backdrop-blur-md border-2 border-yellow-400 shadow-[0_0_25px_rgba(250,204,21,0.6)]">
              <div className="flex items-center gap-1.5 shrink-0">
                <Zap className="w-4 h-4 text-yellow-300 fill-current animate-spin" style={{ animationDuration: '3s' }} />
                <span className="font-pixel text-[8.5px] sm:text-[9.5px] font-black text-yellow-300 tracking-wider">
                  POWER SURGE!
                </span>
              </div>

              {/* Compact One-Shot Strike Action Button */}
              <button
                onClick={() => onPowerSurgeStrike?.()}
                className="py-1 px-3 bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-amber-300 active:scale-95 text-slate-950 font-pixel text-[8px] sm:text-[9px] font-black rounded-full shadow-md flex items-center gap-1 cursor-pointer transition-all border border-white/60"
              >
                <Swords className="w-3 h-3 fill-current text-slate-950" />
                <span>STRIKE (+200g)</span>
              </button>

              <span className="text-[9px] font-mono text-slate-400 hidden sm:inline">
                [SPACE / F]
              </span>

              {boss?.powerSurgeTimer !== undefined && (
                <span className="font-mono text-[9px] font-bold text-amber-300 shrink-0">
                  {Math.max(0, boss.powerSurgeTimer).toFixed(1)}s
                </span>
              )}
            </div>
          </div>
        )}

        {/* 6. COMPACT TOP ACTION PILL: STASIS RESCUE POD NEARBY (NON-BLOCKING) */}
        {isWaitingAtRescueBox && (
          <div className="absolute top-16 sm:top-18 left-1/2 -translate-x-1/2 pointer-events-auto z-40 animate-bounce max-w-sm sm:max-w-md w-auto px-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/95 backdrop-blur-md border-2 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.6)]">
              <div className="flex items-center gap-1.5 shrink-0">
                <AlertTriangle className="w-4 h-4 text-amber-300 fill-current animate-pulse" />
                <span className="font-pixel text-[8.5px] sm:text-[9.5px] font-black text-amber-300 tracking-wider">
                  FRIEND RESCUE!
                </span>
              </div>
              <span className="font-pixel text-[8px] sm:text-[9px] text-white font-bold bg-amber-500/30 px-2 py-0.5 rounded-md">
                DASH TO SHATTER & FREE FRIEND!
              </span>
              <span className="text-[9px] font-mono text-slate-400 hidden sm:inline">
                [SHIFT / C]
              </span>
            </div>
          </div>
        )}

        {/* 7. PLAYFUL ANGEL WINGS TEASING NOTIFICATION (4th Revival+) */}
        {teasingMessage && (
          <div className="absolute top-24 sm:top-28 left-1/2 -translate-x-1/2 pointer-events-none z-45 animate-in fade-in slide-in-from-top-2 max-w-sm sm:max-w-md w-[92%] px-2">
            <div className="flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/95 backdrop-blur-md border border-rose-500/80 shadow-[0_0_20px_rgba(244,63,94,0.4)]">
              <span className="font-pixel text-[8px] sm:text-[9px] font-bold text-rose-300 tracking-wide text-center">
                {teasingMessage}
              </span>
            </div>
          </div>
        )}

        {/* Bottom HUD spacing (Touch controls overlay on bottom) */}
        <div className="h-2" />
      </div>
    </>
  );
};
