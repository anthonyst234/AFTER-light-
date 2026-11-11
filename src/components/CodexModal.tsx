import React, { useState } from 'react';
import { X, BookOpen, Lock, Sparkles, Compass, Shield, Skull, Award } from 'lucide-react';
import { CODEX_ENTRIES } from '../game/constants';
import { CodexCategory, CodexEntry, PlayerSaveData } from '../game/types';
import { sound } from '../game/audio';

interface CodexModalProps {
  saveData: PlayerSaveData;
  onClose: () => void;
}

type TabType = 'ALL' | CodexCategory;

export const CodexModal: React.FC<CodexModalProps> = ({ saveData, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [selectedEntry, setSelectedEntry] = useState<CodexEntry | null>(null);

  const discoveredSet = new Set(saveData.codexDiscovered || []);
  const totalEntries = CODEX_ENTRIES.length;
  const discoveredCount = CODEX_ENTRIES.filter(e => discoveredSet.has(e.id)).length;
  const progressPct = Math.round((discoveredCount / totalEntries) * 100);

  const filteredEntries = CODEX_ENTRIES.filter(entry => {
    if (activeTab === 'ALL') return true;
    return entry.category === activeTab;
  });

  const getCategoryIcon = (category: CodexCategory) => {
    switch (category) {
      case 'CHARACTERS': return <Sparkles size={12} className="text-cyan-400" />;
      case 'WORLDS': return <Compass size={12} className="text-emerald-400" />;
      case 'HAZARDS': return <Shield size={12} className="text-amber-400" />;
      case 'BOSSES': return <Skull size={12} className="text-rose-400" />;
      case 'RELICS': return <Award size={12} className="text-purple-400" />;
    }
  };

  const getCategoryColor = (category: CodexCategory) => {
    switch (category) {
      case 'CHARACTERS': return 'text-cyan-400 border-cyan-500/30 bg-cyan-950/20';
      case 'WORLDS': return 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20';
      case 'HAZARDS': return 'text-amber-400 border-amber-500/30 bg-amber-950/20';
      case 'BOSSES': return 'text-rose-400 border-rose-500/30 bg-rose-950/20';
      case 'RELICS': return 'text-purple-400 border-purple-500/30 bg-purple-950/20';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-950 border-2 border-slate-700/80 rounded-xl shadow-2xl overflow-hidden font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <BookOpen size={20} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white tracking-wider font-['Press_Start_2P']">AFTERLIGHT CODEX</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                  {discoveredCount} / {totalEntries}
                </span>
              </div>
              <p className="text-xs text-slate-400">Archive of discovered entities, worlds, bosses and ancient lore</p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playButtonClick();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-900 px-5 py-2 border-b border-slate-800/80 flex items-center space-x-3">
          <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Discovery</span>
          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-500 rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-cyan-400">{progressPct}%</span>
        </div>

        {/* Category Tabs */}
        <div className="flex overflow-x-auto gap-2 px-5 py-2.5 bg-slate-900/30 border-b border-slate-800 scrollbar-none">
          {(['ALL', 'CHARACTERS', 'WORLDS', 'HAZARDS', 'BOSSES', 'RELICS'] as TabType[]).map(tab => (
            <button
              key={tab}
              onClick={() => {
                sound.playButtonClick();
                setActiveTab(tab);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
                activeTab === tab
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <span>{tab}</span>
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredEntries.map(entry => {
            const isDiscovered = discoveredSet.has(entry.id);

            return (
              <div
                key={entry.id}
                onClick={() => {
                  if (isDiscovered) {
                    sound.playButtonClick();
                    setSelectedEntry(entry);
                  }
                }}
                className={`relative p-3.5 rounded-xl border transition-all ${
                  isDiscovered
                    ? 'bg-slate-900/70 border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/60 cursor-pointer shadow-sm'
                    : 'bg-slate-950/60 border-slate-900 opacity-70 cursor-not-allowed'
                }`}
              >
                {/* Card Top: Icon & Category */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{isDiscovered ? entry.icon : '🔒'}</span>
                    <div>
                      <h3 className={`text-xs font-bold ${isDiscovered ? 'text-white' : 'text-slate-500'}`}>
                        {isDiscovered ? entry.name : 'Unknown Entity'}
                      </h3>
                      <div className="flex items-center space-x-1 mt-0.5">
                        {getCategoryIcon(entry.category)}
                        <span className={`text-[10px] font-mono uppercase tracking-wider ${isDiscovered ? 'text-slate-400' : 'text-slate-600'}`}>
                          {entry.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isDiscovered ? (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border font-mono ${getCategoryColor(entry.category)}`}>
                      DISCOVERED
                    </span>
                  ) : (
                    <span className="text-[9px] px-1.5 py-0.5 rounded border border-slate-800 text-slate-500 bg-slate-900/80 flex items-center space-x-1">
                      <Lock size={9} />
                      <span>LOCKED</span>
                    </span>
                  )}
                </div>

                {/* Description or Hint */}
                <p className="text-[11px] leading-relaxed text-slate-300 line-clamp-2">
                  {isDiscovered ? entry.description : entry.unlockHint}
                </p>

                {/* Lore footer teaser */}
                {isDiscovered && entry.lore && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800/60 text-[10px] text-cyan-400/80 italic line-clamp-1">
                    "{entry.lore}"
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Detail Inspection Modal if clicked */}
        {selectedEntry && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <div className="relative w-full max-w-md bg-slate-900 border-2 border-cyan-500/60 rounded-xl p-5 shadow-2xl">
              <button
                onClick={() => setSelectedEntry(null)}
                className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X size={16} />
              </button>

              <div className="flex items-center space-x-3 mb-4">
                <span className="text-4xl p-2 bg-slate-950 rounded-xl border border-slate-800">{selectedEntry.icon}</span>
                <div>
                  <h3 className="text-sm font-bold text-white font-['Press_Start_2P']">{selectedEntry.name}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-mono ${getCategoryColor(selectedEntry.category)}`}>
                      {selectedEntry.category}
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400 font-bold">ARCHIVE ENTRY</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 font-mono">Overview</h4>
                  <p className="text-slate-200 leading-relaxed bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
                    {selectedEntry.description}
                  </p>
                </div>

                {selectedEntry.lore && (
                  <div>
                    <h4 className="text-[10px] uppercase font-bold text-purple-400 tracking-wider mb-1 font-mono">Ancient Lore</h4>
                    <p className="text-slate-300 italic leading-relaxed bg-purple-950/20 p-3 rounded-lg border border-purple-500/20">
                      "{selectedEntry.lore}"
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedEntry(null)}
                className="mt-5 w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs tracking-wider uppercase transition-colors cursor-pointer"
              >
                Close Archive
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
          <span>Hint: Explore worlds, reach deep distances, defeat bosses, and collect relics to complete your Codex.</span>
          <button
            onClick={() => {
              sound.playButtonClick();
              onClose();
            }}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            Back
          </button>
        </div>

      </div>
    </div>
  );
};
