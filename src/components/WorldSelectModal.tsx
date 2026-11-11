import React from 'react';
import { PlayerSaveData } from '../game/types';
import { WORLDS_CONFIG } from '../game/constants';
import { sound } from '../game/audio';
import { X, Globe, Lock, Check } from 'lucide-react';

interface WorldSelectModalProps {
  saveData: PlayerSaveData;
  onUpdateSave: (newSave: PlayerSaveData) => void;
  onClose: () => void;
}

export const WorldSelectModal: React.FC<WorldSelectModalProps> = ({
  saveData,
  onUpdateSave,
  onClose,
}) => {
  const handleSelectWorld = (worldId: string) => {
    sound.playClick();
    onUpdateSave({
      ...saveData,
      selectedWorld: worldId,
    });
  };

  return (
    <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-30 select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-6 h-6 text-emerald-400" />
            <div>
              <h2 className="font-pixel text-base sm:text-lg text-white">WORLDS & DISTRICTS</h2>
              <p className="font-sans-clean text-xs text-slate-400">Unlockable Environments & Biomes</p>
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

        {/* Worlds Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
          {WORLDS_CONFIG.map((w) => {
            const isUnlocked = saveData.highScoreDistance >= w.unlockDistance;
            const isSelected = saveData.selectedWorld === w.id;

            return (
              <div
                key={w.id}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  isSelected
                    ? 'bg-slate-800 border-emerald-400 shadow-lg shadow-emerald-500/10'
                    : isUnlocked
                    ? 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-950/40 border-slate-900 opacity-60'
                }`}
              >
                <div>
                  {/* Sky Preview Bar */}
                  <div
                    className="w-full h-12 rounded-lg mb-3 border border-white/10 flex items-center justify-center relative overflow-hidden shadow-inner"
                    style={{
                      background: `linear-gradient(to right, ${w.skyTop}, ${w.skyBottom})`,
                    }}
                  >
                    <div
                      className="h-2 w-full absolute bottom-0"
                      style={{ backgroundColor: w.groundTrim }}
                    />
                  </div>

                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="font-pixel text-xs text-white">{w.name}</h3>
                    {isSelected ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-pixel text-[8px] border border-emerald-500/40">
                        ACTIVE
                      </span>
                    ) : !isUnlocked ? (
                      <div className="flex items-center gap-1 text-slate-400 text-xs">
                        <Lock className="w-3.5 h-3.5" />
                        <span className="font-mono-num text-[10px]">{w.unlockDistance}m</span>
                      </div>
                    ) : (
                      <Check className="w-4 h-4 text-slate-400" />
                    )}
                  </div>

                  <p className="font-sans-clean text-xs text-slate-400 mb-3 leading-relaxed">
                    {w.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  {isUnlocked ? (
                    <button
                      onClick={() => handleSelectWorld(w.id)}
                      disabled={isSelected}
                      className={`w-full py-2 rounded-lg font-pixel text-[8px] transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500/20 text-emerald-300 cursor-default'
                          : 'bg-slate-800 hover:bg-slate-700 text-white active:scale-95'
                      }`}
                    >
                      {isSelected ? 'CURRENT SECTOR' : 'ENTER SECTOR'}
                    </button>
                  ) : (
                    <div className="w-full py-2 text-center font-pixel text-[8px] text-slate-400">
                      REACH {w.unlockDistance}m RECORD TO UNLOCK
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
