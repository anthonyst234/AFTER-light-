import React from 'react';
import { PlayerSaveData } from '../game/types';
import { sound } from '../game/audio';
import { Play, RotateCcw, Home, Volume2, VolumeX, Sliders } from 'lucide-react';

interface PauseModalProps {
  saveData: PlayerSaveData;
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
  onUpdateSave: (newSave: PlayerSaveData) => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  saveData,
  onResume,
  onRestart,
  onMainMenu,
  onUpdateSave,
}) => {
  const handleVolumeChange = (type: 'sound' | 'music', val: number) => {
    const newSave = {
      ...saveData,
      [type === 'sound' ? 'soundVolume' : 'musicVolume']: val,
    };
    onUpdateSave(newSave);
    sound.setVolumes(newSave.soundVolume, newSave.musicVolume, newSave.muted);
  };

  const toggleMute = () => {
    sound.playClick();
    const newSave = { ...saveData, muted: !saveData.muted };
    onUpdateSave(newSave);
    sound.setVolumes(newSave.soundVolume, newSave.musicVolume, newSave.muted);
  };

  return (
    <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 z-30 select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-sm p-6 flex flex-col items-center shadow-2xl">
        <h2 className="font-pixel text-xl text-white mb-6">GAME PAUSED</h2>

        {/* Audio Settings Panel */}
        <div className="w-full bg-slate-950/70 border border-slate-800 p-4 rounded-xl mb-6 flex flex-col gap-3">
          <div className="flex items-center justify-between mb-1">
            <span className="font-pixel text-[10px] text-slate-300">AUDIO SETTINGS</span>
            <button
              onClick={toggleMute}
              className={`p-1.5 rounded-lg border text-xs cursor-pointer ${
                saveData.muted
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                  : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}
            >
              {saveData.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          {/* SFX Volume */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs text-slate-400 font-sans-clean">
              <span>Sound Effects</span>
              <span className="font-mono-num">{Math.round(saveData.soundVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={saveData.soundVolume}
              onChange={(e) => handleVolumeChange('sound', parseFloat(e.target.value))}
              className="w-full accent-sky-400 cursor-pointer"
            />
          </div>

          {/* Music Volume */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs text-slate-400 font-sans-clean">
              <span>Background Synth Music</span>
              <span className="font-mono-num">{Math.round(saveData.musicVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={saveData.musicVolume}
              onChange={(e) => handleVolumeChange('music', parseFloat(e.target.value))}
              className="w-full accent-sky-400 cursor-pointer"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            onClick={() => {
              sound.playClick();
              onResume();
            }}
            className="w-full py-3 bg-sky-500 hover:bg-sky-400 active:scale-95 text-white font-pixel text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>RESUME RUN</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onRestart();
            }}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-pixel text-[10px] rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESTART</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onMainMenu();
            }}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 font-pixel text-[10px] rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Home className="w-3.5 h-3.5" />
            <span>MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
