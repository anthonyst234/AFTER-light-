import React from 'react';
import { GameMode, PlayerSaveData } from '../game/types';
import { UserAccount, isAuthorizedAdmin } from '../game/auth';
import { getLevelForXP } from '../game/constants';
import { sound } from '../game/audio';
import { 
  Play, ShoppingBag, Users, Globe, Target, Sliders, CheckSquare, Sparkles, Trophy, Feather, Info, BookOpen, Ghost, Zap, ShieldAlert, KeyRound, Maximize, UserCheck
} from 'lucide-react';

interface MainMenuProps {
  saveData: PlayerSaveData;
  selectedMode: GameMode;
  currentUser: UserAccount | null;
  onSelectMode: (mode: GameMode) => void;
  onStartGame: () => void;
  onOpenShop: () => void;
  onOpenCharacters: () => void;
  onOpenWorlds: () => void;
  onOpenMissions: () => void;
  onOpenCodex: () => void;
  onOpenSettings: () => void;
  onOpenTestChecklist: () => void;
  onOpenAbout: () => void;
  onOpenLeaderboard: () => void;
  onOpenAdmin: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onToggleGhostMode?: () => void;
  onToggleFullscreen?: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  saveData,
  selectedMode,
  currentUser,
  onSelectMode,
  onStartGame,
  onOpenShop,
  onOpenCharacters,
  onOpenWorlds,
  onOpenMissions,
  onOpenCodex,
  onOpenSettings,
  onOpenTestChecklist,
  onOpenAbout,
  onOpenLeaderboard,
  onOpenAdmin,
  onOpenAuth,
  onLogout,
  onToggleGhostMode,
  onToggleFullscreen,
}) => {
  const modes: { id: GameMode; label: string; desc: string }[] = [
    { id: 'ENDLESS', label: 'ENDLESS', desc: 'Survive the eternal city with progressive speed, dash mechanics & boss chases' },
    { id: 'HARDCORE', label: 'HARDCORE 📳', desc: 'Permadeath run! 340 px/s speed, device vibration & 3x score multiplier' },
    { id: 'DAILY_CHALLENGE', label: 'DAILY RUN', desc: 'Standardized daily obstacle sequence with double rewards' },
    { id: 'TIME_TRIAL', label: 'TIME TRIAL', desc: 'Sprint 90 seconds to maximize distance & score' },
    { id: 'BOSS_RUSH', label: 'BOSS RUSH', desc: 'Direct back-to-back encounters with all 3 titans' },
    { id: 'COIN_RUSH', label: 'COIN RUSH', desc: 'Dense golden coin cascades and speed boosts' },
    { id: 'SURVIVAL', label: 'SURVIVAL', desc: 'Hyper trap frequency testing supreme reflexes' },
  ];

  const levelInfo = getLevelForXP(saveData.xp || 0);

  return (
    <div className="absolute inset-0 flex flex-col justify-between items-center p-3 sm:p-5 z-20 overflow-y-auto select-none bg-gradient-to-b from-black/85 via-black/60 to-black/90 backdrop-blur-xs font-sans">
      
      {/* Top Bar: Auth Profile, Level/XP, Bank, PB & Ghost Mode */}
      <div className="w-full max-w-5xl flex flex-wrap items-center justify-between gap-2">
        
        {/* Left: Player / Admin Account Profile & Level */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Active Auth Badge */}
          {isAuthorizedAdmin(currentUser) ? (
            /* Master Admin Exclusive Badge */
            <div className="flex items-center gap-2 bg-gradient-to-r from-red-950/90 via-slate-900 to-amber-950/90 border border-amber-500/70 px-3 py-1.5 rounded-xl shadow-lg shadow-amber-500/10">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="flex flex-col">
                <span className="font-pixel text-[8px] text-amber-300 font-bold tracking-wider">
                  MASTER ADMIN
                </span>
                <span className="font-mono text-[9px] text-slate-300 truncate max-w-[130px]">
                  {currentUser?.displayName}
                </span>
              </div>

              {/* Exclusive Admin Console Button (Only visible to authenticated Master Admin) */}
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenAdmin();
                }}
                className="ml-1 px-2.5 py-1 bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-400 hover:to-red-400 text-slate-950 font-pixel text-[8px] font-bold rounded-lg shadow-md transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                title="Open Owner Admin Console"
              >
                <KeyRound className="w-3 h-3 text-slate-950" />
                <span>CONSOLE</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  onLogout();
                }}
                className="text-slate-400 hover:text-white text-[10px] font-mono px-1.5 py-0.5 rounded hover:bg-white/10 cursor-pointer"
                title="Switch Account"
              >
                Exit
              </button>
            </div>
          ) : (
            /* Regular Player Profile */
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 rounded-xl shadow-lg">
              <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center font-bold text-xs text-cyan-300">
                {currentUser?.isGuest ? '👤' : '🏃'}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-pixel text-[8.5px] text-white font-bold truncate max-w-[120px]">
                    {currentUser?.displayName || saveData.playerName || 'Runner'}
                  </span>
                  <span className="text-[10px]">{saveData.playerCountry === 'US' ? '🇺🇸' : '🌐'}</span>
                </div>
                <span className="font-mono text-[8.5px] text-slate-400 truncate max-w-[120px]">
                  {currentUser?.isGuest ? 'Guest Runner' : currentUser?.email || 'Authenticated'}
                </span>
              </div>

              <button
                onClick={() => {
                  sound.playClick();
                  onOpenAuth();
                }}
                className="text-[9px] font-mono text-cyan-400 hover:text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                title="Switch Account or Sign Up"
              >
                {currentUser?.isGuest ? 'Sign Up' : 'Switch'}
              </button>
            </div>
          )}

          {/* Level Progress */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 rounded-xl shadow-lg">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center font-pixel text-[10px] text-white font-bold shadow-md">
              {levelInfo.level}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-pixel text-[8.5px] text-white font-bold">{levelInfo.title}</span>
                <span className="text-[9px] text-slate-400 font-mono">({levelInfo.currentXP}/{levelInfo.nextLevelXP} XP)</span>
              </div>
              <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-0.5 border border-slate-700/50">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-300 rounded-full"
                  style={{ width: `${levelInfo.progressPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Center/Right: PB Distance, Ghost Mode, Currency, Wings & Fullscreen */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Ghost Runner Toggle */}
          <button
            onClick={() => {
              sound.playClick();
              onToggleGhostMode?.();
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[11px] font-mono font-bold transition-all cursor-pointer ${
              saveData.ghostModeEnabled
                ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-300 shadow-md shadow-cyan-500/20'
                : 'bg-slate-900/60 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title="Toggle Personal Best Ghost Runner on track"
          >
            <Ghost className="w-3.5 h-3.5" />
            <span className="hidden md:inline">GHOST:</span>
            <span>{saveData.ghostModeEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* Best Distance */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-700/60 px-2.5 py-1.5 rounded-xl text-xs">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-pixel text-[8.5px] text-slate-400 hidden sm:inline">BEST:</span>
            <span className="font-mono font-bold text-amber-300 text-xs">
              {saveData.highScoreDistance}m
            </span>
          </div>

          {/* Currency */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 border border-amber-500/40 px-2.5 py-1.5 rounded-xl text-xs">
            <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 flex items-center justify-center font-bold text-[8.5px] text-amber-950 shadow-xs">
              $
            </div>
            <span className="font-mono font-bold text-amber-300 text-xs">
              {saveData.coins}
            </span>
          </div>

          {/* Revival Angel Wings */}
          <div className="flex items-center gap-1 bg-slate-900/80 border border-sky-400/30 px-2.5 py-1.5 rounded-xl text-xs" title="Revival Angel Wings">
            <Feather className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-mono font-bold text-sky-200 text-xs">
              {saveData.revivalWings}
            </span>
          </div>

          {/* Sizable / Fullscreen Toggle for PC & Mobile */}
          {onToggleFullscreen && (
            <button
              onClick={() => {
                sound.playClick();
                onToggleFullscreen();
              }}
              className="p-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Toggle Fullscreen"
            >
              <Maximize className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Hero Centerpiece: Bespoke Logo & Tagline */}
      <div className="flex flex-col items-center text-center my-auto py-2">
        <div className="relative mb-2">
          <h1 className="font-pixel text-4xl sm:text-6xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-400 drop-shadow-[0_4px_16px_rgba(56,189,248,0.4)]">
            AFTERLIGHT
          </h1>
          <div className="h-1 w-full bg-gradient-to-r from-transparent via-sky-400 to-transparent mt-1" />
        </div>

        <p className="font-pixel text-[9.5px] sm:text-xs text-sky-300 tracking-wider mb-4">
          THE CITY NEVER SLEEPS. NEITHER DO YOU.
        </p>

        {/* Mode Selector Tabs (7 Game Modes) */}
        <div className="grid grid-cols-2 sm:grid-cols-7 gap-1.5 p-1.5 bg-slate-950/80 border border-white/10 rounded-xl mb-4 max-w-3xl w-full">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                sound.playClick();
                onSelectMode(m.id);
              }}
              className={`px-2 py-2 rounded-lg font-pixel text-[8px] sm:text-[9px] transition-all cursor-pointer truncate ${
                selectedMode === m.id
                  ? m.id === 'HARDCORE'
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/40 font-black border border-rose-400'
                    : 'bg-sky-500 text-white shadow-lg shadow-sky-500/30 font-bold'
                  : m.id === 'HARDCORE'
                  ? 'text-rose-400 hover:text-rose-200 hover:bg-rose-950/30 border border-rose-900/50'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Primary Start CTA Button */}
        <button
          onClick={() => {
            sound.playClick();
            onStartGame();
          }}
          className={`group relative px-10 py-3.5 text-white rounded-2xl shadow-xl active:scale-95 transition-all cursor-pointer flex items-center gap-3 border ${
            selectedMode === 'HARDCORE'
              ? 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 shadow-rose-600/35 border-rose-300/50 animate-pulse'
              : 'bg-gradient-to-r from-sky-500 via-indigo-500 to-sky-500 hover:from-sky-400 hover:to-indigo-400 shadow-sky-500/25 border-sky-300/40'
          }`}
        >
          <Play className="w-5 h-5 fill-current text-white group-hover:translate-x-0.5 transition-transform" />
          <span className="font-pixel text-sm sm:text-base font-bold tracking-wider">
            {selectedMode === 'HARDCORE' ? 'START HARDCORE RUN (3x)' : 'START RUN'}
          </span>
        </button>

        <p className="font-mono text-[10px] sm:text-[11px] text-slate-400 mt-2">
          Space/Enter: Jump · S/↓: Slide · Shift/C: Dash · E: Skill · 2x Space: Double Jump · Mobile: Buttons or Screen Gestures
        </p>
      </div>

      {/* Bottom Nav Bar: Shop, Studio, Worlds, Missions, Ranks, Codex, Audio, About, QA */}
      {/* NOTE: Admin button has been REMOVED from the main menu and background as requested! Only Master Admin has access via their private verified top bar console. */}
      <div className="w-full max-w-5xl grid grid-cols-5 sm:grid-cols-9 gap-1.5">
        <button
          onClick={() => {
            sound.playClick();
            onOpenShop();
          }}
          className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-1 bg-slate-900/80 hover:bg-slate-800/90 active:scale-95 border border-slate-700/60 hover:border-amber-400/50 rounded-xl transition-all cursor-pointer text-slate-300 hover:text-white"
        >
          <ShoppingBag className="w-4 h-4 text-amber-400" />
          <span className="font-pixel text-[7.5px]">SHOP</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            onOpenCharacters();
          }}
          className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-1 bg-slate-900/80 hover:bg-slate-800/90 active:scale-95 border border-slate-700/60 hover:border-sky-400/50 rounded-xl transition-all cursor-pointer text-slate-300 hover:text-white"
        >
          <Users className="w-4 h-4 text-sky-400" />
          <span className="font-pixel text-[7.5px]">STUDIO</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            onOpenWorlds();
          }}
          className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-1 bg-slate-900/80 hover:bg-slate-800/90 active:scale-95 border border-slate-700/60 hover:border-emerald-400/50 rounded-xl transition-all cursor-pointer text-slate-300 hover:text-white"
        >
          <Globe className="w-4 h-4 text-emerald-400" />
          <span className="font-pixel text-[7.5px]">WORLDS</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            onOpenMissions();
          }}
          className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-1 bg-slate-900/80 hover:bg-slate-800/90 active:scale-95 border border-slate-700/60 hover:border-indigo-400/50 rounded-xl transition-all cursor-pointer text-slate-300 hover:text-white"
        >
          <Target className="w-4 h-4 text-indigo-400" />
          <span className="font-pixel text-[7.5px]">MISSIONS</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            onOpenLeaderboard();
          }}
          className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-1 bg-slate-900/80 hover:bg-slate-800/90 active:scale-95 border border-amber-500/50 hover:border-amber-400 rounded-xl transition-all cursor-pointer text-amber-300 hover:text-white"
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="font-pixel text-[7.5px]">RANKS</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            onOpenCodex();
          }}
          className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-1 bg-slate-900/80 hover:bg-slate-800/90 active:scale-95 border border-cyan-500/50 hover:border-cyan-400 rounded-xl transition-all cursor-pointer text-cyan-300 hover:text-white"
        >
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <span className="font-pixel text-[7.5px]">CODEX</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            onOpenSettings();
          }}
          className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-1 bg-slate-900/80 hover:bg-slate-800/90 active:scale-95 border border-slate-700/60 hover:border-white/40 rounded-xl transition-all cursor-pointer text-slate-300 hover:text-white"
        >
          <Sliders className="w-4 h-4 text-slate-300" />
          <span className="font-pixel text-[7.5px]">AUDIO</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            onOpenAbout();
          }}
          className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-1 bg-slate-900/80 hover:bg-slate-800/90 active:scale-95 border border-slate-700/60 hover:border-sky-400/50 rounded-xl transition-all cursor-pointer text-slate-300 hover:text-white"
        >
          <Info className="w-4 h-4 text-sky-400" />
          <span className="font-pixel text-[7.5px]">ABOUT</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            onOpenTestChecklist();
          }}
          className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-1 bg-slate-900/80 hover:bg-slate-800/90 active:scale-95 border border-purple-500/40 hover:border-purple-400 rounded-xl transition-all cursor-pointer text-purple-300 hover:text-white"
        >
          <CheckSquare className="w-4 h-4 text-purple-400" />
          <span className="font-pixel text-[7.5px]">QA TEST</span>
        </button>
      </div>
    </div>
  );
};
