import { PlayerSaveData } from './types';
import { INITIAL_MISSIONS } from './constants';

const SAVE_KEY = 'AFTERLIGHT_SAVE_V2';
const LEGACY_SAVE_KEY = 'AFTERLIGHT_SAVE_V1';

const DEFAULT_SAVE: PlayerSaveData = {
  coins: 100, // Starter coins to explore shop & skills
  lifetimeCoins: 100,
  highScoreDistance: 0,
  hardcoreHighScore: 0,
  revivalWings: 1, // Starter wing so revival system is readily testable
  
  // Player Profile
  playerName: 'Courier-01',
  playerCountry: 'US',

  level: 1,
  xp: 0,
  lifetimeXP: 0,

  selectedCharacter: 'classic',
  unlockedCharacters: ['classic'],
  selectedWorld: 'abandoned_city',
  unlockedWorlds: ['abandoned_city'],
  selectedWing: 'NONE',
  unlockedWings: ['NONE'],
  selectedHead: 'NONE',
  unlockedHeads: ['NONE'],
  selectedTrail: 'NONE',
  unlockedTrails: ['NONE'],
  selectedCompanion: 'NONE',
  unlockedCompanions: ['NONE'],
  selectedSkill: 'SHIELD_BURST',
  skillCharges: {
    SHIELD_BURST: 3,
    COIN_MAGNET: 2,
    TIME_BEND: 1,
    PHASE_SHIFT: 1,
    SECOND_CHANCE: 1,
    KINETIC_VAULT: 2,
  },
  missions: INITIAL_MISSIONS,
  
  ghostModeEnabled: true,
  ghostRunData: null,
  codexDiscovered: ['char_classic', 'world_neon_city', 'hazard_thorn', 'relic_soul_shard'],

  soundVolume: 0.8,
  musicVolume: 0.6,
  muted: false,
  reducedMotion: false,
  screenShakeIntensity: 1.0,

  stats: {
    totalRuns: 0,
    totalJumps: 0,
    totalSlides: 0,
    totalDashes: 0,
    totalNearMisses: 0,
    totalSkillsUsed: 0,
    bossesDefeated: 0,
    highestCombo: 0,
    bestSurvivalTime: 0,
    flightsCompleted: 0,
    friendsRescued: 0,
    hardcoreRuns: 0,
  },
};

export function loadSaveData(): PlayerSaveData {
  try {
    let raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      // Check legacy V1 save for migration
      raw = localStorage.getItem(LEGACY_SAVE_KEY);
    }
    if (!raw) return { ...DEFAULT_SAVE };
    
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SAVE,
      ...parsed,
      level: parsed.level || 1,
      xp: parsed.xp || 0,
      lifetimeXP: parsed.lifetimeXP || 0,
      ghostModeEnabled: parsed.ghostModeEnabled !== undefined ? parsed.ghostModeEnabled : true,
      ghostRunData: parsed.ghostRunData || null,
      codexDiscovered: Array.isArray(parsed.codexDiscovered) && parsed.codexDiscovered.length > 0
        ? parsed.codexDiscovered
        : DEFAULT_SAVE.codexDiscovered,
      reducedMotion: !!parsed.reducedMotion,
      screenShakeIntensity: parsed.screenShakeIntensity !== undefined ? parsed.screenShakeIntensity : 1.0,
      skillCharges: {
        ...DEFAULT_SAVE.skillCharges,
        ...(parsed.skillCharges || {}),
      },
      stats: {
        ...DEFAULT_SAVE.stats,
        ...(parsed.stats || {}),
      },
      missions: DEFAULT_SAVE.missions.map((m) => {
        const found = (parsed.missions || []).find((p: any) => p.id === m.id);
        return found ? { ...m, ...found } : m;
      }),
    };
  } catch (e) {
    console.warn('Failed to parse save data from localStorage, using default', e);
    return { ...DEFAULT_SAVE };
  }
}

export function writeSaveData(data: PlayerSaveData): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to write save data to localStorage', e);
  }
}
