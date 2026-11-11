import React, { useState } from 'react';
import { PlayerSaveData } from '../game/types';
import { sound } from '../game/audio';
import { X, Target, CheckCircle2, Gift, Sparkles, Calendar, Flame } from 'lucide-react';

interface MissionsModalProps {
  saveData: PlayerSaveData;
  onUpdateSave: (newSave: PlayerSaveData) => void;
  onClose: () => void;
}

type MissionFilter = 'ALL' | 'DAILY' | 'WEEKLY' | 'SPECIAL';

export const MissionsModal: React.FC<MissionsModalProps> = ({
  saveData,
  onUpdateSave,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<MissionFilter>('ALL');

  const handleClaim = (missionId: string, reward: number) => {
    sound.playCoin();
    const updatedMissions = saveData.missions.map((m) =>
      m.id === missionId ? { ...m, claimed: true } : m
    );

    // Also award bonus XP for mission completions
    const bonusXP = reward * 2;
    onUpdateSave({
      ...saveData,
      coins: saveData.coins + reward,
      lifetimeCoins: saveData.lifetimeCoins + reward,
      xp: saveData.xp + bonusXP,
      lifetimeXP: saveData.lifetimeXP + bonusXP,
      missions: updatedMissions,
    });
  };

  const filteredMissions = saveData.missions.filter((m) => {
    if (activeTab === 'ALL') return true;
    return (m.category || 'DAILY') === activeTab;
  });

  const getCategoryBadge = (category: string = 'DAILY') => {
    switch (category) {
      case 'DAILY':
        return (
          <span className="flex items-center gap-1 text-[8px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-500/30 font-bold">
            <Calendar className="w-2.5 h-2.5" /> DAILY
          </span>
        );
      case 'WEEKLY':
        return (
          <span className="flex items-center gap-1 text-[8px] font-mono px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-400 border border-indigo-500/30 font-bold">
            <Flame className="w-2.5 h-2.5" /> WEEKLY
          </span>
        );
      case 'SPECIAL':
        return (
          <span className="flex items-center gap-1 text-[8px] font-mono px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-500/30 font-bold">
            <Sparkles className="w-2.5 h-2.5" /> SPECIAL
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-30 select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-950/60 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-pixel text-sm sm:text-base text-white">OPERATIONAL MISSIONS</h2>
              <p className="text-xs text-slate-400">Complete Runner Objectives to Claim Soul Gold & Bonus XP</p>
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

        {/* Category Tabs */}
        <div className="flex gap-2 px-5 py-2.5 bg-slate-950/50 border-b border-slate-800 overflow-x-auto">
          {(['ALL', 'DAILY', 'WEEKLY', 'SPECIAL'] as MissionFilter[]).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                sound.playButtonClick();
                setActiveTab(tab);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Missions List */}
        <div className="p-4 sm:p-5 overflow-y-auto flex flex-col gap-3 flex-1">
          {filteredMissions.map((m) => {
            const pct = Math.min(100, Math.round((m.current / m.target) * 100));

            return (
              <div
                key={m.id}
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                  m.claimed
                    ? 'bg-slate-950/40 border-slate-900 opacity-60'
                    : m.completed
                    ? 'bg-indigo-950/30 border-indigo-500/50 shadow-md shadow-indigo-500/10'
                    : 'bg-slate-950/70 border-slate-800'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    {getCategoryBadge(m.category)}
                    <h3 className="font-pixel text-xs text-white">{m.title}</h3>
                    {m.completed && !m.claimed && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-pixel text-[8px] border border-emerald-500/40 animate-pulse">
                        READY!
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 mb-2 leading-relaxed">{m.description}</p>

                  {/* Progress Bar */}
                  <div className="w-full max-w-xs h-2 bg-slate-800 rounded-full overflow-hidden relative border border-slate-700/50">
                    <div
                      className={`h-full transition-all duration-300 ${
                        m.completed ? 'bg-emerald-400' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="font-mono text-[10px] text-slate-400 mt-1">
                    {m.current} / {m.target} ({pct}%)
                  </div>
                </div>

                {/* Reward & Action */}
                <div className="flex items-center gap-2 sm:self-center shrink-0">
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1 font-mono text-xs font-bold text-amber-300 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-amber-500/30">
                      <span>+{m.rewardCoins}</span>
                      <span className="text-[10px] text-amber-500">COINS</span>
                    </div>
                    <span className="text-[9px] font-mono text-indigo-400 mt-0.5">+{m.rewardCoins * 2} XP</span>
                  </div>

                  {m.claimed ? (
                    <div className="flex items-center gap-1 text-slate-400 font-pixel text-[9px] px-2 py-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>CLAIMED</span>
                    </div>
                  ) : m.completed ? (
                    <button
                      onClick={() => handleClaim(m.id, m.rewardCoins)}
                      className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-pixel text-[9px] font-bold rounded-lg shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Gift className="w-3.5 h-3.5" />
                      <span>CLAIM</span>
                    </button>
                  ) : (
                    <span className="font-pixel text-[8px] text-slate-400 px-2">IN PROGRESS</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 text-center text-xs text-slate-400">
          Missions refresh automatically upon completion. No penalties for missed days.
        </div>
      </div>
    </div>
  );
};
