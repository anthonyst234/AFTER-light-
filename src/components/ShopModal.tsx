import React, { useState } from 'react';
import { 
  PlayerSaveData, WingType, HeadType, TrailType, CompanionType, SkillType 
} from '../game/types';
import { 
  CHARACTER_SKINS, WINGS_CONFIG, HEAD_CONFIG, TRAILS_CONFIG, COMPANIONS_CONFIG, SKILLS_CONFIG 
} from '../game/constants';
import { sound } from '../game/audio';
import { X, Check, ShoppingBag, Feather, Zap, Sparkles, AlertCircle } from 'lucide-react';

interface ShopModalProps {
  saveData: PlayerSaveData;
  onUpdateSave: (newSave: PlayerSaveData) => void;
  onClose: () => void;
}

type ShopCategory = 'CHARACTERS' | 'REVIVAL_WINGS' | 'SKILLS' | 'WINGS' | 'HEAD' | 'TRAILS' | 'COMPANIONS';

export const ShopModal: React.FC<ShopModalProps> = ({
  saveData,
  onUpdateSave,
  onClose,
}) => {
  const [activeCategory, setActiveCategory] = useState<ShopCategory>('CHARACTERS');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 2500);
  };

  // --- REVIVAL WINGS 3-PACK PURCHASE ---
  const handleBuyWingsPack = () => {
    const cost = 150;
    if (saveData.coins < cost) {
      sound.playCollision();
      triggerError('Insufficient gold coins!');
      return;
    }
    sound.playCoin();
    onUpdateSave({
      ...saveData,
      coins: saveData.coins - cost,
      revivalWings: saveData.revivalWings + 3,
    });
  };

  // --- SKILL CHARGES PURCHASE ---
  const handleBuySkillCharge = (skillId: SkillType, cost: number) => {
    if (saveData.coins < cost) {
      sound.playCollision();
      triggerError('Insufficient gold coins!');
      return;
    }
    sound.playCoin();
    const current = saveData.skillCharges[skillId] || 0;
    onUpdateSave({
      ...saveData,
      coins: saveData.coins - cost,
      skillCharges: {
        ...saveData.skillCharges,
        [skillId]: current + 1,
      },
    });
  };

  const handleSelectActiveSkill = (skillId: SkillType) => {
    sound.playClick();
    onUpdateSave({
      ...saveData,
      selectedSkill: skillId,
    });
  };

  // --- COSMETICS PURCHASE & EQUIP ---
  const handleBuyCosmetic = (
    type: 'WING' | 'HEAD' | 'TRAIL' | 'COMPANION',
    id: string,
    cost: number
  ) => {
    if (saveData.coins < cost) {
      sound.playCollision();
      triggerError('Insufficient gold coins!');
      return;
    }
    sound.playCoin();

    const newSave = { ...saveData, coins: saveData.coins - cost };

    if (type === 'WING') {
      newSave.unlockedWings = [...saveData.unlockedWings, id as WingType];
      newSave.selectedWing = id as WingType;
    } else if (type === 'HEAD') {
      newSave.unlockedHeads = [...saveData.unlockedHeads, id as HeadType];
      newSave.selectedHead = id as HeadType;
    } else if (type === 'TRAIL') {
      newSave.unlockedTrails = [...saveData.unlockedTrails, id as TrailType];
      newSave.selectedTrail = id as TrailType;
    } else if (type === 'COMPANION') {
      newSave.unlockedCompanions = [...saveData.unlockedCompanions, id as CompanionType];
      newSave.selectedCompanion = id as CompanionType;
    }

    onUpdateSave(newSave);
  };

  const handleEquipCosmetic = (
    type: 'WING' | 'HEAD' | 'TRAIL' | 'COMPANION',
    id: string
  ) => {
    sound.playClick();
    const newSave = { ...saveData };
    if (type === 'WING') newSave.selectedWing = id as WingType;
    if (type === 'HEAD') newSave.selectedHead = id as HeadType;
    if (type === 'TRAIL') newSave.selectedTrail = id as TrailType;
    if (type === 'COMPANION') newSave.selectedCompanion = id as CompanionType;
    onUpdateSave(newSave);
  };

  const handleBuyCharacter = (id: string, cost: number) => {
    if (saveData.coins < cost) {
      sound.playCollision();
      triggerError('Insufficient gold coins!');
      return;
    }
    sound.playCoin();
    onUpdateSave({
      ...saveData,
      coins: saveData.coins - cost,
      unlockedCharacters: [...saveData.unlockedCharacters, id],
      selectedCharacter: id,
    });
  };

  const handleEquipCharacter = (id: string) => {
    sound.playClick();
    onUpdateSave({
      ...saveData,
      selectedCharacter: id,
    });
  };

  const categories: { id: ShopCategory; label: string }[] = [
    { id: 'CHARACTERS', label: 'CHARACTERS' },
    { id: 'REVIVAL_WINGS', label: 'REVIVAL WINGS' },
    { id: 'SKILLS', label: 'ACTIVE SKILLS' },
    { id: 'WINGS', label: 'WINGS' },
    { id: 'HEAD', label: 'HEADWEAR' },
    { id: 'TRAILS', label: 'TRAILS' },
    { id: 'COMPANIONS', label: 'COMPANIONS' },
  ];

  return (
    <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-30 select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-amber-400" />
            <div>
              <h2 className="font-pixel text-base sm:text-lg text-white">THE RUNNER'S VAULT</h2>
              <p className="font-sans-clean text-xs text-slate-400">Equipment, Skills & Revival Packs</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Coins indicator */}
            <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-1.5 rounded-xl border border-amber-500/40">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 flex items-center justify-center font-bold text-[9px] text-amber-950">
                $
              </div>
              <span className="font-mono-num font-bold text-amber-300 text-sm">{saveData.coins}</span>
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

        {/* Error Toast if insufficient funds */}
        {errorMsg && (
          <div className="mx-4 mt-3 py-2 px-3 bg-rose-500/20 border border-rose-500/50 rounded-lg flex items-center gap-2 text-rose-300 text-xs font-sans-clean animate-pulse">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 p-3 overflow-x-auto border-b border-slate-800 bg-slate-950/40">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                sound.playClick();
                setActiveCategory(cat.id);
              }}
              className={`px-3 py-1.5 rounded-lg font-pixel text-[8px] sm:text-[9px] whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-amber-500 text-amber-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          {/* --- CHARACTERS CATEGORY --- */}
          {activeCategory === 'CHARACTERS' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {CHARACTER_SKINS.map((skin) => {
                const isOwned = saveData.unlockedCharacters.includes(skin.id);
                const isEquipped = saveData.selectedCharacter === skin.id;

                return (
                  <div
                    key={skin.id}
                    className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                      isEquipped ? 'bg-slate-800 border-sky-400' : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-pixel text-[10px] text-white">{skin.name}</span>
                        {isEquipped ? (
                          <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-[7px] font-pixel text-sky-300">
                            IN USE
                          </span>
                        ) : isOwned ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : null}
                      </div>
                      <p className="font-pixel text-[8px] text-sky-400 mb-1">{skin.title}</p>
                      <p className="font-sans-clean text-[11px] text-slate-400 mb-2 leading-relaxed">
                        {skin.description}
                      </p>
                      {/* Color dots */}
                      <div className="flex items-center gap-1 mb-3">
                        <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: skin.primaryColor }} />
                        <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: skin.accentColor }} />
                        <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: skin.scarfColor }} />
                      </div>
                    </div>

                    {isOwned ? (
                      <button
                        onClick={() => handleEquipCharacter(skin.id)}
                        disabled={isEquipped}
                        className={`w-full py-1.5 rounded-lg font-pixel text-[8px] transition-all cursor-pointer ${
                          isEquipped
                            ? 'bg-slate-800 text-slate-400 cursor-default'
                            : 'bg-sky-500 hover:bg-sky-400 text-white font-bold active:scale-95'
                        }`}
                      >
                        {isEquipped ? 'EQUIPPED' : 'EQUIP'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBuyCharacter(skin.id, skin.cost)}
                        className="w-full py-1.5 rounded-lg font-pixel text-[8px] bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold transition-all cursor-pointer"
                      >
                        BUY FOR {skin.cost}g
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* --- REVIVAL WINGS CATEGORY --- */}
          {activeCategory === 'REVIVAL_WINGS' && (
            <div className="flex flex-col items-center justify-center text-center py-6 max-w-md mx-auto">
              <div className="w-20 h-20 rounded-full bg-sky-500/10 border-2 border-sky-400 flex items-center justify-center mb-4 shadow-lg shadow-sky-500/20 animate-pulse">
                <Feather className="w-10 h-10 text-sky-400" />
              </div>

              <h3 className="font-pixel text-base text-white mb-2">PACK OF 3 ANGEL WINGS</h3>
              <p className="font-sans-clean text-xs text-slate-300 mb-4 leading-relaxed">
                Cheat death in the heat of a run! Each wing grants an instant resurrection, 3.8s holy invulnerability, and blasts away all nearby obstacles.
              </p>

              <div className="flex items-center gap-2 bg-slate-950 px-4 py-2 rounded-xl border border-sky-400/30 text-xs text-sky-300 font-pixel mb-6">
                <span>OWNED WINGS:</span>
                <span className="font-mono-num font-bold text-white text-base">{saveData.revivalWings}</span>
              </div>

              <button
                onClick={handleBuyWingsPack}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-amber-950 font-pixel text-xs font-bold rounded-xl shadow-lg active:scale-95 transition-all cursor-pointer flex items-center gap-2"
              >
                <span>PURCHASE 3-PACK FOR 150 COINS</span>
              </button>
            </div>
          )}

          {/* --- SKILLS CATEGORY --- */}
          {activeCategory === 'SKILLS' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {Object.values(SKILLS_CONFIG).map((sk) => {
                const charges = saveData.skillCharges[sk.id] || 0;
                const isEquipped = saveData.selectedSkill === sk.id;

                return (
                  <div
                    key={sk.id}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                      isEquipped
                        ? 'bg-slate-800/90 border-sky-400 shadow-md shadow-sky-500/10'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-sky-400" />
                          <h4 className="font-pixel text-xs text-white">{sk.name}</h4>
                        </div>
                        <span className="font-mono-num text-xs text-sky-300 font-bold bg-sky-950/80 px-2 py-0.5 rounded border border-sky-500/30">
                          {charges} charges
                        </span>
                      </div>
                      <p className="font-sans-clean text-xs text-slate-400 mb-3">{sk.description}</p>
                    </div>

                    <div className="flex items-center gap-2 mt-auto pt-2 border-t border-slate-800/80">
                      <button
                        onClick={() => handleSelectActiveSkill(sk.id)}
                        className={`flex-1 py-1.5 rounded-lg font-pixel text-[8px] transition-all cursor-pointer ${
                          isEquipped
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        {isEquipped ? 'EQUIPPED' : 'SELECT SKILL'}
                      </button>

                      <button
                        onClick={() => handleBuySkillCharge(sk.id, sk.cost)}
                        className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 text-amber-300 border border-amber-500/40 rounded-lg font-pixel text-[8px] transition-all cursor-pointer whitespace-nowrap"
                      >
                        +1 CHARGE ({sk.cost}g)
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* --- WINGS COSMETICS --- */}
          {activeCategory === 'WINGS' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {WINGS_CONFIG.map((w) => {
                const isOwned = saveData.unlockedWings.includes(w.id);
                const isEquipped = saveData.selectedWing === w.id;

                return (
                  <div
                    key={w.id}
                    className={`p-3 rounded-xl border flex flex-col justify-between ${
                      isEquipped ? 'bg-slate-800 border-sky-400' : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-pixel text-[10px] text-white">{w.name}</span>
                        {isEquipped && <Check className="w-3.5 h-3.5 text-sky-400" />}
                      </div>
                      <p className="font-sans-clean text-[11px] text-slate-400 mb-2.5">{w.description}</p>
                    </div>

                    {isOwned ? (
                      <button
                        onClick={() => handleEquipCosmetic('WING', w.id)}
                        className={`w-full py-1.5 rounded-lg font-pixel text-[8px] transition-all cursor-pointer ${
                          isEquipped ? 'bg-sky-500 text-white font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        {isEquipped ? 'EQUIPPED' : 'EQUIP'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBuyCosmetic('WING', w.id, w.cost)}
                        className="w-full py-1.5 rounded-lg font-pixel text-[8px] bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold transition-all cursor-pointer"
                      >
                        BUY FOR {w.cost}g
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* --- HEADWEAR COSMETICS --- */}
          {activeCategory === 'HEAD' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {HEAD_CONFIG.map((h) => {
                const isOwned = saveData.unlockedHeads.includes(h.id);
                const isEquipped = saveData.selectedHead === h.id;

                return (
                  <div
                    key={h.id}
                    className={`p-3 rounded-xl border flex flex-col justify-between ${
                      isEquipped ? 'bg-slate-800 border-sky-400' : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-pixel text-[10px] text-white">{h.name}</span>
                        {isEquipped && <Check className="w-3.5 h-3.5 text-sky-400" />}
                      </div>
                      <p className="font-sans-clean text-[11px] text-slate-400 mb-2.5">{h.description}</p>
                    </div>

                    {isOwned ? (
                      <button
                        onClick={() => handleEquipCosmetic('HEAD', h.id)}
                        className={`w-full py-1.5 rounded-lg font-pixel text-[8px] transition-all cursor-pointer ${
                          isEquipped ? 'bg-sky-500 text-white font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        {isEquipped ? 'EQUIPPED' : 'EQUIP'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBuyCosmetic('HEAD', h.id, h.cost)}
                        className="w-full py-1.5 rounded-lg font-pixel text-[8px] bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold transition-all cursor-pointer"
                      >
                        BUY FOR {h.cost}g
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* --- TRAILS COSMETICS --- */}
          {activeCategory === 'TRAILS' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {TRAILS_CONFIG.map((t) => {
                const isOwned = saveData.unlockedTrails.includes(t.id);
                const isEquipped = saveData.selectedTrail === t.id;

                return (
                  <div
                    key={t.id}
                    className={`p-3 rounded-xl border flex flex-col justify-between ${
                      isEquipped ? 'bg-slate-800 border-sky-400' : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-pixel text-[10px] text-white">{t.name}</span>
                        {isEquipped && <Check className="w-3.5 h-3.5 text-sky-400" />}
                      </div>
                      <p className="font-sans-clean text-[11px] text-slate-400 mb-2.5">{t.description}</p>
                    </div>

                    {isOwned ? (
                      <button
                        onClick={() => handleEquipCosmetic('TRAIL', t.id)}
                        className={`w-full py-1.5 rounded-lg font-pixel text-[8px] transition-all cursor-pointer ${
                          isEquipped ? 'bg-sky-500 text-white font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        {isEquipped ? 'EQUIPPED' : 'EQUIP'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBuyCosmetic('TRAIL', t.id, t.cost)}
                        className="w-full py-1.5 rounded-lg font-pixel text-[8px] bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold transition-all cursor-pointer"
                      >
                        BUY FOR {t.cost}g
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* --- COMPANIONS COSMETICS --- */}
          {activeCategory === 'COMPANIONS' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {COMPANIONS_CONFIG.map((c) => {
                const isOwned = saveData.unlockedCompanions.includes(c.id);
                const isEquipped = saveData.selectedCompanion === c.id;

                return (
                  <div
                    key={c.id}
                    className={`p-3 rounded-xl border flex flex-col justify-between ${
                      isEquipped ? 'bg-slate-800 border-sky-400' : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-pixel text-[10px] text-white">{c.name}</span>
                        {isEquipped && <Check className="w-3.5 h-3.5 text-sky-400" />}
                      </div>
                      <p className="font-sans-clean text-[11px] text-slate-400 mb-2.5">{c.description}</p>
                    </div>

                    {isOwned ? (
                      <button
                        onClick={() => handleEquipCosmetic('COMPANION', c.id)}
                        className={`w-full py-1.5 rounded-lg font-pixel text-[8px] transition-all cursor-pointer ${
                          isEquipped ? 'bg-sky-500 text-white font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        {isEquipped ? 'EQUIPPED' : 'EQUIP'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBuyCosmetic('COMPANION', c.id, c.cost)}
                        className="w-full py-1.5 rounded-lg font-pixel text-[8px] bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold transition-all cursor-pointer"
                      >
                        BUY FOR {c.cost}g
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
