import React from 'react';
import { PlayerSaveData } from '../game/types';
import { getLevelForXP } from '../game/constants';
import { sound } from '../game/audio';
import { RotateCcw, ShoppingBag, Home, Feather, Trophy, AlertTriangle, Sparkles, Flame, Zap } from 'lucide-react';

interface GameOverModalProps {
  distance: number;
  coins: number;
  isNewRecord: boolean;
  saveData: PlayerSaveData;
  isReviving: boolean;
  xpEarned?: number;
  highestCombo?: number;
  score?: number;
  onRevive: () => void;
  onRestart: () => void;
  onOpenShop: () => void;
  onMainMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  distance,
  coins,
  isNewRecord,
  saveData,
  isReviving,
  xpEarned = 0,
  highestCombo = 1,
  score,
  onRevive,
  onRestart,
  onOpenShop,
  onMainMenu,
}) => {
  const levelInfo = getLevelForXP(saveData.xp);

  return (
    <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 z-30 select-none font-sans">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md p-5 sm:p-6 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-12 -left-12 w-36 h-36 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

        {isReviving ? (
          /* --- REVIVAL OPPORTUNITY --- */
          <div className="flex flex-col items-center w-full">
            <div className="w-16 h-16 rounded-full bg-sky-500/20 border-2 border-sky-400 flex items-center justify-center mb-3 animate-pulse shadow-lg shadow-sky-500/25">
              <Feather className="w-8 h-8 text-sky-400" />
            </div>

            <h2 className="font-pixel text-lg text-white mb-1">ANGEL WING REVIVAL</h2>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Cheat death! Resume run with 3.8s holy invulnerability and blast away nearby hazards.
            </p>

            <div className="bg-slate-950/80 border border-sky-400/30 px-4 py-2 rounded-xl mb-5 flex items-center gap-2">
              <span className="font-pixel text-[9px] text-sky-300">WINGS AVAILABLE:</span>
              <span className="font-mono font-bold text-white text-base">{saveData.revivalWings}</span>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                onRevive();
              }}
              className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white font-pixel text-xs font-bold rounded-xl shadow-xl shadow-sky-500/25 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 mb-3 border border-sky-300/40"
            >
              <Feather className="w-4 h-4" />
              <span>REVIVE NOW (-1 WING)</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onRestart();
              }}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-pixel text-[9px] rounded-xl transition-all cursor-pointer"
            >
              DECLINE & VIEW RESULTS
            </button>
          </div>
        ) : (
          /* --- STANDARD RUN SUMMARY --- */
          <div className="flex flex-col items-center w-full">
            {isNewRecord ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 font-pixel text-[9px] mb-3 animate-bounce">
                <Sparkles className="w-3.5 h-3.5" />
                <span>NEW PERSONAL BEST!</span>
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-2">
                <AlertTriangle className="w-6 h-6 text-rose-500" />
              </div>
            )}

            <h2 className="font-pixel text-lg sm:text-xl text-white mb-1">RUN TERMINATED</h2>
            <p className="text-xs text-slate-400 mb-4">The city claimed another runner</p>

            {/* Stats Grid */}
            <div className="w-full grid grid-cols-2 gap-2.5 mb-3">
              <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl flex flex-col items-center">
                <span className="font-pixel text-[8px] text-slate-400 mb-1">DISTANCE</span>
                <span className="font-mono text-xl sm:text-2xl font-bold text-white tracking-wider">
                  {distance}<span className="text-xs text-sky-400 ml-1">m</span>
                </span>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl flex flex-col items-center">
                <span className="font-pixel text-[8px] text-slate-400 mb-1">COINS EARNED</span>
                <span className="font-mono text-xl sm:text-2xl font-bold text-amber-300 tracking-wider">
                  +{coins}
                </span>
              </div>
            </div>

            {/* XP and Combo Secondary Metrics */}
            <div className="w-full grid grid-cols-2 gap-2.5 mb-3 text-xs">
              <div className="bg-slate-950/50 border border-slate-800/80 p-2 rounded-xl flex items-center justify-between px-3">
                <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                  <Zap className="w-3 h-3 text-cyan-400" /> XP
                </span>
                <span className="font-mono font-bold text-cyan-300">+{xpEarned}</span>
              </div>

              <div className="bg-slate-950/50 border border-slate-800/80 p-2 rounded-xl flex items-center justify-between px-3">
                <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                  <Flame className="w-3 h-3 text-amber-400" /> BEST COMBO
                </span>
                <span className="font-mono font-bold text-amber-300">x{highestCombo}</span>
              </div>
            </div>

            {/* Player Level & XP Progress Bar */}
            <div className="w-full bg-slate-950/60 border border-indigo-500/20 p-2.5 rounded-xl mb-4 text-left">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <div className="flex items-center space-x-1.5">
                  <span className="font-pixel text-[9px] text-indigo-400">LVL {levelInfo.level}</span>
                  <span className="text-slate-400">· {levelInfo.title}</span>
                </div>
                <span className="font-mono text-[10px] text-slate-400">
                  {levelInfo.currentXP} / {levelInfo.nextLevelXP} XP
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500"
                  style={{ width: `${levelInfo.progressPct}%` }}
                />
              </div>
            </div>

            {/* Record row */}
            <div className="w-full bg-slate-950/40 border border-slate-800/80 px-4 py-2 rounded-xl mb-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span className="font-pixel text-[8px]">ALL-TIME BEST</span>
              </div>
              <span className="font-mono font-bold text-white text-sm">
                {saveData.highScoreDistance}m
              </span>
            </div>

            {/* Actions */}
            <div className="w-full flex flex-col gap-2">
              <button
                onClick={() => {
                  sound.playClick();
                  onRestart();
                }}
                className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white font-pixel text-xs font-bold rounded-xl shadow-lg active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 border border-sky-300/30"
              >
                <RotateCcw className="w-4 h-4" />
                <span>TRY AGAIN</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    sound.playClick();
                    onOpenShop();
                  }}
                  className="py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-pixel text-[9px] rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-amber-500/20"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>VAULT SHOP</span>
                </button>

                <button
                  onClick={() => {
                    sound.playClick();
                    onMainMenu();
                  }}
                  className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-pixel text-[9px] rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>MAIN MENU</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
