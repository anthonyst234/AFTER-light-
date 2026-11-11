import React, { useState, useEffect, useRef } from 'react';
import { PlayerSaveData, ItemRarity, WingType, HeadType, CompanionType } from '../game/types';
import { CHARACTER_SKINS } from '../game/constants';
import { SpriteRenderer } from '../game/sprites';
import { sound } from '../game/audio';
import { X, Check, Users, Sparkles, AlertCircle, Shield, Wind, Zap, HeartHandshake, Eye } from 'lucide-react';

interface CharacterSelectModalProps {
  saveData: PlayerSaveData;
  onUpdateSave: (newSave: PlayerSaveData) => void;
  onClose: () => void;
}

type PoseType = 'RUN' | 'JUMP' | 'SLIDE' | 'DASH' | 'FLY';

export const CharacterSelectModal: React.FC<CharacterSelectModalProps> = ({
  saveData,
  onUpdateSave,
  onClose,
}) => {
  const [selectedPreview, setSelectedPreview] = useState(saveData.selectedCharacter);
  const [rarityFilter, setRarityFilter] = useState<'ALL' | ItemRarity>('ALL');
  const [testPose, setTestPose] = useState<PoseType>('RUN');
  const [testWings, setTestWings] = useState<WingType>(saveData.selectedWing);
  const [testHead, setTestHead] = useState<HeadType>(saveData.selectedHead);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const activeSkin = CHARACTER_SKINS.find((s) => s.id === selectedPreview) || CHARACTER_SKINS[0];
  const isOwned = saveData.unlockedCharacters.includes(activeSkin.id);
  const isEquipped = saveData.selectedCharacter === activeSkin.id;

  // Real-time animated canvas pose rendering
  useEffect(() => {
    let animId: number;
    let timer = 0;

    const render = () => {
      timer += 0.02;
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.imageSmoothingEnabled = false;

          // Render subtle ground shadow or flight slipstream
          if (testPose !== 'FLY') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.ellipse(60, 92, 22, 6, 0, 0, Math.PI * 2);
            ctx.fill();
          }

          // Draw runner sprite in real-time
          SpriteRenderer.drawRunner(
            ctx,
            testPose === 'SLIDE' ? 44 : 50,
            testPose === 'SLIDE' ? 70 : (testPose === 'FLY' ? 46 : 60),
            testPose,
            timer,
            activeSkin,
            {
              wing: testWings,
              head: testHead,
              companion: 'NONE',
            },
            false,
            false,
            testPose === 'FLY'
          );
        }
      }
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [activeSkin, testPose, testWings, testHead]);

  const getRarityBadge = (rarity: ItemRarity = 'COMMON') => {
    switch (rarity) {
      case 'COMMON':
        return <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">COMMON</span>;
      case 'RARE':
        return <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-500/40">RARE</span>;
      case 'EPIC':
        return <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-400 border border-purple-500/40">EPIC</span>;
      case 'LEGENDARY':
        return <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-500/40">LEGENDARY</span>;
      case 'MYTHIC':
        return <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-400 border border-rose-500/40 animate-pulse">MYTHIC</span>;
    }
  };

  const filteredSkins = CHARACTER_SKINS.filter((skin) => {
    if (rarityFilter === 'ALL') return true;
    return skin.rarity === rarityFilter;
  });

  const handleBuy = () => {
    if (saveData.coins < activeSkin.cost) {
      sound.playCollision();
      setErrorMsg('Not enough gold coins!');
      setTimeout(() => setErrorMsg(null), 2500);
      return;
    }
    sound.playCoin();

    const codexKey = `char_${activeSkin.id.toLowerCase()}`;
    const codexDiscovered = Array.from(new Set([...(saveData.codexDiscovered || []), codexKey]));

    onUpdateSave({
      ...saveData,
      coins: saveData.coins - activeSkin.cost,
      unlockedCharacters: [...saveData.unlockedCharacters, activeSkin.id],
      selectedCharacter: activeSkin.id,
      codexDiscovered,
    });
  };

  const handleEquip = () => {
    sound.playClick();
    onUpdateSave({
      ...saveData,
      selectedCharacter: activeSkin.id,
    });
  };

  return (
    <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-30 select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-950/60 border border-sky-500/40 flex items-center justify-center text-sky-400 shadow-md">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-pixel text-sm sm:text-base text-white">CHARACTER DESIGN STUDIO</h2>
              <p className="text-xs text-slate-400">Interactive Runner Testing, Poses, & Tactical Specifications</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-1.5 rounded-xl border border-amber-500/40">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 flex items-center justify-center font-bold text-[9px] text-amber-950">
                $
              </div>
              <span className="font-mono font-bold text-amber-300 text-sm">{saveData.coins}</span>
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
        </div>

        {/* Rarity Filter Tabs */}
        <div className="flex gap-2 px-5 py-2 bg-slate-950/50 border-b border-slate-800 overflow-x-auto">
          {(['ALL', 'COMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC'] as const).map((r) => (
            <button
              key={r}
              onClick={() => {
                sound.playButtonClick();
                setRarityFilter(r);
              }}
              className={`px-3 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                rarityFilter === r
                  ? 'bg-sky-600 text-white font-bold shadow-md shadow-sky-600/30'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {errorMsg && (
          <div className="mx-4 mt-3 py-2 px-3 bg-rose-500/20 border border-rose-500/50 rounded-lg flex items-center gap-2 text-rose-300 text-xs animate-pulse">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Content Body: Split Grid */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left: Character Roster Grid */}
          <div className="flex-1 p-4 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {filteredSkins.map((skin) => {
              const owned = saveData.unlockedCharacters.includes(skin.id);
              const equipped = saveData.selectedCharacter === skin.id;
              const isSelected = selectedPreview === skin.id;

              return (
                <button
                  key={skin.id}
                  onClick={() => {
                    sound.playClick();
                    setSelectedPreview(skin.id);
                  }}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800 border-sky-400 shadow-lg'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-pixel text-[10px] text-white truncate max-w-[85px]">{skin.name}</span>
                    {equipped ? (
                      <span className="px-1.5 py-0.5 rounded bg-sky-500/20 border border-sky-400/40 text-[8px] font-pixel text-sky-300">
                        EQUIPPED
                      </span>
                    ) : owned ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <span className="font-mono text-[10px] text-amber-300 font-bold">{skin.cost}g</span>
                    )}
                  </div>

                  <div className="mb-2">{getRarityBadge(skin.rarity)}</div>

                  {/* Color Palette Indicators */}
                  <div className="flex items-center gap-1.5 mt-auto pt-2">
                    <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: skin.primaryColor }} title="Primary Armor" />
                    <div className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: skin.accentColor }} title="Accent Plates" />
                    <div className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: skin.scarfColor }} title="Scarf" />
                    <div className="w-3 h-3 rounded-full border border-white/20 ml-auto" style={{ backgroundColor: skin.eyeColor }} title="Optic Visor" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: Interactive Character Design Studio Stage */}
          <div className="w-full md:w-96 border-t md:border-t-0 md:border-l border-slate-800 p-5 bg-slate-950/90 flex flex-col justify-between overflow-y-auto">
            <div>
              {/* Studio Canvas Showcase */}
              <div className="w-full h-44 bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl border border-sky-500/30 flex flex-col items-center justify-center relative overflow-hidden mb-3 shadow-inner">
                {/* Visual Glow Backdrop */}
                <div
                  className="absolute inset-0 opacity-25"
                  style={{
                    background: `radial-gradient(circle, ${activeSkin.accentColor} 0%, transparent 70%)`,
                  }}
                />

                {/* Live Real-Time Canvas Sprite */}
                <canvas
                  ref={canvasRef}
                  width={120}
                  height={120}
                  className="relative z-10 w-28 h-28 crisp-canvas drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]"
                />

                {/* Real-time Pose Status */}
                <div className="absolute top-2 right-3 font-mono text-[9px] text-sky-400 font-bold tracking-wider">
                  STATE: {testPose}
                </div>
              </div>

              {/* Interactive Pose Controls */}
              <div className="mb-4">
                <span className="text-[10px] text-slate-400 font-mono block mb-1.5">LIVE POSE TESTER:</span>
                <div className="grid grid-cols-5 gap-1">
                  {(['RUN', 'JUMP', 'SLIDE', 'DASH', 'FLY'] as const).map((pose) => (
                    <button
                      key={pose}
                      onClick={() => {
                        sound.playClick();
                        setTestPose(pose);
                      }}
                      className={`py-1.5 rounded-lg font-pixel text-[8px] transition-all cursor-pointer ${
                        testPose === pose
                          ? 'bg-sky-500 text-white font-bold shadow-md shadow-sky-500/20'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {pose}
                    </button>
                  ))}
                </div>
              </div>

              {/* Character Details & Lore */}
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-pixel text-sm text-white font-bold">{activeSkin.name}</h3>
                {getRarityBadge(activeSkin.rarity)}
              </div>
              <p className="font-pixel text-[9px] text-sky-400 mb-2">{activeSkin.title}</p>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">{activeSkin.description}</p>

              {/* Tactical Specifications / Attributes */}
              <div className="space-y-2 p-3 bg-slate-900/60 rounded-xl border border-slate-800 mb-4">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Wind className="w-3 h-3 text-sky-400" /> Aerodynamic Agility
                  </span>
                  <span className="font-bold text-white">96 / 100</span>
                </div>
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-400 rounded-full" style={{ width: '96%' }} />
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Zap className="w-3 h-3 text-amber-400" /> Dash Burst Recovery
                  </span>
                  <span className="font-bold text-white">2.2s</span>
                </div>
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: '88%' }} />
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <HeartHandshake className="w-3 h-3 text-rose-400" /> Tag-Team Swap Affinity
                  </span>
                  <span className="font-bold text-white">A+ Tier</span>
                </div>
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-400 rounded-full" style={{ width: '92%' }} />
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div>
              {isOwned ? (
                <button
                  onClick={handleEquip}
                  disabled={isEquipped}
                  className={`w-full py-3 rounded-xl font-pixel text-xs transition-all cursor-pointer ${
                    isEquipped
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      : 'bg-sky-500 hover:bg-sky-400 text-white font-bold shadow-lg shadow-sky-500/25 active:scale-95'
                  }`}
                >
                  {isEquipped ? 'CURRENTLY ACTIVE RUNNER' : 'SELECT RUNNER'}
                </button>
              ) : (
                <button
                  onClick={handleBuy}
                  className="w-full py-3 rounded-xl font-pixel text-xs bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold shadow-lg shadow-amber-500/25 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>RECRUIT FOR {activeSkin.cost} COINS</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
