import React, { useState, useEffect } from 'react';
import { PlayerSaveData } from '../game/types';
import { getGlobalLeaderboard, submitScoreToLeaderboard, LeaderboardEntry } from '../game/leaderboard';
import { sound } from '../game/audio';
import { X, Trophy, Globe, Flame, ShieldCheck, User, Sparkles, Filter, CheckCircle2 } from 'lucide-react';

interface LeaderboardModalProps {
  saveData: PlayerSaveData;
  onUpdateSave: (newSave: PlayerSaveData) => void;
  onClose: () => void;
}

const COUNTRIES = [
  { code: 'US', flag: '🇺🇸', name: 'United States' },
  { code: 'JP', flag: '🇯🇵', name: 'Japan' },
  { code: 'DE', flag: '🇩🇪', name: 'Germany' },
  { code: 'GB', flag: '🇬🇧', name: 'United Kingdom' },
  { code: 'FR', flag: '🇫🇷', name: 'France' },
  { code: 'BR', flag: '🇧🇷', name: 'Brazil' },
  { code: 'CA', flag: '🇨🇦', name: 'Canada' },
  { code: 'KR', flag: '🇰🇷', name: 'South Korea' },
  { code: 'AU', flag: '🇦🇺', name: 'Australia' },
  { code: 'SE', flag: '🇸🇪', name: 'Sweden' },
  { code: 'ES', flag: '🇪🇸', name: 'Spain' },
  { code: 'IT', flag: '🇮🇹', name: 'Italy' },
];

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  saveData,
  onUpdateSave,
  onClose,
}) => {
  const [tab, setTab] = useState<'GLOBAL' | 'WEEKLY' | 'HARDCORE'>('GLOBAL');
  const [editingProfile, setEditingProfile] = useState(false);
  const [nameInput, setNameInput] = useState(saveData.playerName || 'Courier-01');
  const [countryInput, setCountryInput] = useState(saveData.playerCountry || 'US');
  const [leaderboardList, setLeaderboardList] = useState<LeaderboardEntry[]>(() => getGlobalLeaderboard());

  const playerFlag = COUNTRIES.find((c) => c.code === (saveData.playerCountry || 'US'))?.flag || '🌐';

  // Automatically ensure current player's personal best is recorded in the global leaderboard
  useEffect(() => {
    const flag = COUNTRIES.find((c) => c.code === (saveData.playerCountry || 'US'))?.flag || '🇺🇸';
    if (saveData.highScoreDistance > 0) {
      submitScoreToLeaderboard({
        name: saveData.playerName || 'Courier-01',
        country: saveData.playerCountry || 'US',
        flag,
        distance: saveData.highScoreDistance,
        mode: 'ENDLESS',
        character: saveData.selectedCharacter || 'Classic',
      });
    }
    if ((saveData.hardcoreHighScore || 0) > 0) {
      submitScoreToLeaderboard({
        name: saveData.playerName || 'Courier-01',
        country: saveData.playerCountry || 'US',
        flag,
        distance: saveData.hardcoreHighScore || 0,
        mode: 'HARDCORE',
        character: saveData.selectedCharacter || 'Classic',
      });
    }
    setLeaderboardList(getGlobalLeaderboard());
  }, [saveData.highScoreDistance, saveData.hardcoreHighScore, saveData.playerName, saveData.playerCountry]);

  const handleSaveProfile = () => {
    sound.playClick();
    const cleanName = nameInput.trim() || 'Courier-01';
    const flag = COUNTRIES.find((c) => c.code === countryInput)?.flag || '🇺🇸';

    onUpdateSave({
      ...saveData,
      playerName: cleanName,
      playerCountry: countryInput,
    });

    if (saveData.highScoreDistance > 0) {
      submitScoreToLeaderboard({
        name: cleanName,
        country: countryInput,
        flag,
        distance: saveData.highScoreDistance,
        mode: 'ENDLESS',
        character: saveData.selectedCharacter || 'Classic',
      });
    }

    setLeaderboardList(getGlobalLeaderboard());
    setEditingProfile(false);
  };

  // Filter entries based on tab
  const entries = leaderboardList.filter((entry) => {
    if (tab === 'HARDCORE') return entry.mode === 'HARDCORE';
    return true;
  });

  const playerDistance = tab === 'HARDCORE' ? (saveData.hardcoreHighScore || 0) : saveData.highScoreDistance;
  
  // Find player's real rank in the list
  const playerRankIndex = entries.findIndex(
    (e) => e.name.toLowerCase() === (saveData.playerName || 'Courier-01').toLowerCase()
  );
  const playerRank = playerRankIndex >= 0 ? entries[playerRankIndex].rank : entries.length + 1;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-40 select-none font-sans overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-pixel text-sm sm:text-base text-white tracking-wide">
                INTERNATIONAL LEADERBOARD
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Real-Time Global Verified Runner Standings
              </p>
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

        {/* Player Profile Banner */}
        <div className="px-5 py-3 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-sky-400/50 flex items-center justify-center text-base">
              {playerFlag}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-pixel text-xs text-white font-bold">{saveData.playerName || 'Courier-01'}</span>
                <span className="text-[10px] text-sky-400 font-mono">[{saveData.playerCountry || 'US'}]</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono flex items-center gap-1">
                  <ShieldCheck className="w-2.5 h-2.5" /> VERIFIED
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                Your Record: <span className="text-amber-300 font-bold">{playerDistance}m</span> · Global Rank: <span className="text-cyan-400 font-bold">#{playerRank}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              setEditingProfile(!editingProfile);
            }}
            className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold text-slate-200 transition-colors cursor-pointer"
          >
            {editingProfile ? 'Cancel' : 'Edit Call Sign / Flag'}
          </button>
        </div>

        {/* Profile Editor Collapse */}
        {editingProfile && (
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-mono text-slate-400">Call Sign:</label>
              <input
                type="text"
                maxLength={16}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-mono text-slate-400">Country:</label>
              <select
                value={countryInput}
                onChange={(e) => setCountryInput(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code} className="bg-slate-900 text-white">
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSaveProfile}
              className="px-4 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-pixel text-[9px] font-bold rounded-lg transition-colors cursor-pointer"
            >
              SAVE PROFILE
            </button>
          </div>
        )}

        {/* Mode Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-4 text-xs font-mono font-bold">
          <button
            onClick={() => {
              sound.playClick();
              setTab('GLOBAL');
            }}
            className={`py-2.5 px-4 flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              tab === 'GLOBAL'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>GLOBAL ALL-TIME</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setTab('WEEKLY');
            }}
            className={`py-2.5 px-4 flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              tab === 'WEEKLY'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>WEEKLY TOURNAMENT</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setTab('HARDCORE');
            }}
            className={`py-2.5 px-4 flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              tab === 'HARDCORE'
                ? 'border-rose-500 text-rose-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>HARDCORE PERMADEATH 📳</span>
          </button>
        </div>

        {/* Standings Table */}
        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-2">
          {entries.map((entry) => {
            const isCurrentPlayer = entry.name.toLowerCase() === (saveData.playerName || 'Courier-01').toLowerCase();
            return (
              <div
                key={entry.id}
                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  isCurrentPlayer
                    ? 'bg-amber-500/15 border-amber-400/80 shadow-md shadow-amber-500/10'
                    : entry.rank === 1
                    ? 'bg-gradient-to-r from-amber-950/40 to-slate-900 border-amber-500/40'
                    : entry.rank === 2
                    ? 'bg-gradient-to-r from-slate-800/40 to-slate-900 border-slate-600/40'
                    : entry.rank === 3
                    ? 'bg-gradient-to-r from-amber-950/20 to-slate-900 border-amber-700/30'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Left: Rank, Flag, Name, Badges */}
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-pixel text-xs font-bold ${
                    entry.rank === 1
                      ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30'
                      : entry.rank === 2
                      ? 'bg-slate-300 text-slate-950'
                      : entry.rank === 3
                      ? 'bg-amber-700 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {entry.rank}
                  </div>

                  <span className="text-lg leading-none">{entry.flag}</span>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className={`font-pixel text-xs font-bold ${isCurrentPlayer ? 'text-amber-300' : 'text-white'}`}>
                        {entry.name}
                      </span>
                      {isCurrentPlayer && (
                        <span className="text-[8px] font-pixel px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-black">
                          YOU
                        </span>
                      )}
                      {entry.verified && (
                        <span title="Verified Integrity Score">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                      <span>{entry.badge}</span>
                      <span>·</span>
                      <span className="text-slate-500">{entry.character}</span>
                      {entry.mode === 'HARDCORE' && (
                        <span className="text-rose-400 font-bold">· 📳 HARDCORE</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Distance Score */}
                <div className="flex flex-col items-end">
                  <span className="font-mono text-base font-bold text-amber-300 tracking-tight">
                    {entry.distance.toLocaleString()}m
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono">DISTANCE RECORD</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
