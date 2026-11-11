export type GameState = 
  | 'MENU'
  | 'PLAYING'
  | 'PAUSED'
  | 'REVIVING'
  | 'GAME_OVER';

export type GameMode = 
  | 'ENDLESS'
  | 'DAILY_CHALLENGE'
  | 'TIME_TRIAL'
  | 'BOSS_RUSH'
  | 'COIN_RUSH'
  | 'SURVIVAL'
  | 'HARDCORE';

export type SkillType = 
  | 'SHIELD_BURST'
  | 'COIN_MAGNET'
  | 'TIME_BEND'
  | 'PHASE_SHIFT'
  | 'SECOND_CHANCE'
  | 'KINETIC_VAULT';

export interface SkillConfig {
  id: SkillType;
  name: string;
  description: string;
  duration: number; // in seconds
  cooldown: number; // in seconds
  cost: number;
  icon: string;
  color: string;
}

export type WingType = 
  | 'NONE'
  | 'PAPER_WINGS'
  | 'ANGEL_WINGS'
  | 'DARK_WINGS'
  | 'MECHANICAL_WINGS'
  | 'GOLDEN_WINGS'
  | 'CELESTIAL_WINGS';

export type HeadType = 
  | 'NONE'
  | 'TINY_HALO'
  | 'CROWN'
  | 'HOOD'
  | 'HEADPHONES'
  | 'MASK'
  | 'BANDANA';

export type TrailType = 
  | 'NONE'
  | 'EMBER_TRAIL'
  | 'GHOST_TRAIL'
  | 'SPARK_TRAIL'
  | 'STAR_TRAIL'
  | 'SMOKE_TRAIL';

export type CompanionType = 
  | 'NONE'
  | 'POCKET_BIRD'
  | 'FLOATING_SPIRIT'
  | 'MINI_ROBOT'
  | 'TINY_GHOST';

export type ItemRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC';

export interface CharacterSkin {
  id: string;
  name: string;
  title: string;
  cost: number;
  rarity: ItemRarity;
  primaryColor: string;
  accentColor: string;
  scarfColor: string;
  eyeColor: string;
  trailColor: string;
  description: string;
}

export interface WorldConfig {
  id: string;
  name: string;
  description: string;
  unlockDistance: number;
  skyTop: string;
  skyBottom: string;
  buildingFar: string;
  buildingMid: string;
  buildingNear: string;
  groundColor: string;
  groundTrim: string;
  particleColor: string;
  accentGlow: string;
}

export type HazardType = 
  | 'THORN_VINES'
  | 'SPIKE_BED'
  | 'ROTATING_SAW'
  | 'SWINGING_BLADE'
  | 'FLAME_VENT'
  | 'FALLING_CRUSHER'
  | 'LASER_BARRIER'
  | 'COLLAPSING_FLOOR'
  | 'MOVING_SPIKE'
  | 'ELECTRIC_HAZARD'
  | 'GUILLOTINE'
  | 'SPIKED_WALL'
  | 'FALLING_DEBRIS'
  | 'HIDDEN_TRAP'
  | 'COMBINATION_TRAP';

export interface Hazard {
  id: number;
  type: HazardType;
  x: number;
  y: number;
  width: number;
  height: number;
  initialY?: number;
  stateTimer?: number;
  active?: boolean;
  angle?: number;
  speed?: number;
  slideAllowed?: boolean; // if slide can pass safely
  jumpAllowed?: boolean;
  telegraphTimer?: number;
  isTriggered?: boolean;
  isVaulted?: boolean;
  vy?: number;
}

export interface Coin {
  id: number;
  x: number;
  y: number;
  baseY: number;
  collected: boolean;
  animTimer: number;
}

export interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  life: number;
}

export interface RescueBox {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  shattered: boolean;
  partnerSkinId: string;
  glowTimer: number;
}

export interface TagTeamPartner {
  active: boolean;
  skinId: string;
  x: number;
  y: number;
  animState: 'RUN' | 'JUMP' | 'DOUBLE_JUMP' | 'FALL' | 'SLIDE' | 'DASH' | 'FLY' | 'REVIVE';
  animTimer: number;
}

export type BossType = 'VINEKEEPER' | 'IRON_STAG' | 'HOLLOW_GIANT' | 'VOID_COLOSSUS' | 'CHRONO_SPECTER';

export interface BossPowerUp {
  x: number;
  y: number;
  collected: boolean;
  animTimer: number;
}

export interface Boss {
  type: BossType;
  name: string;
  subtitle: string;
  x: number;
  y: number;
  width: number;
  height: number;
  progress: number; // 0 to 1 survival progress
  duration: number; // seconds to survive (10-20 sec)
  timer: number;
  attackTimer: number;
  currentAttack: 'NONE' | 'LUNGE' | 'SHOCKWAVE' | 'SWIPE' | 'PROJECTILE' | 'ROAR';
  attackTelegraph: number;
  state: 'ENTERING' | 'ACTIVE' | 'VULNERABLE' | 'STRIKE' | 'DEFEATED';
  introBannerTimer: number;
  color: string;
  accentColor: string;
  powerUp?: BossPowerUp | null;
  oneShotStrikeTimer?: number;
  powerSurgeActive?: boolean;
  powerSurgeTimer?: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  gravity?: number;
}

export interface GhostSnapshot {
  d: number; // distance in meters
  y: number; // y position
  state: 'RUN' | 'JUMP' | 'DOUBLE_JUMP' | 'FALL' | 'SLIDE' | 'DASH' | 'DEAD' | 'REVIVE' | 'FLY';
  isSliding: boolean;
}

export interface GhostRunData {
  distance: number;
  characterId: string;
  snapshots: GhostSnapshot[];
}

export type CodexCategory = 'CHARACTERS' | 'WORLDS' | 'HAZARDS' | 'BOSSES' | 'RELICS';

export interface CodexEntry {
  id: string;
  name: string;
  category: CodexCategory;
  icon: string;
  description: string;
  lore: string;
  requirement: string;
  unlockHint?: string;
  secret?: boolean;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  rewardCoins: number;
  completed: boolean;
  claimed: boolean;
  type: 'DISTANCE' | 'COINS' | 'JUMPS' | 'SLIDES' | 'SKILLS' | 'BOSSES' | 'DASHES' | 'NEAR_MISSES' | 'COMBOS';
  category: 'DAILY' | 'WEEKLY' | 'SPECIAL';
}

export interface PlayerSaveData {
  coins: number;
  lifetimeCoins: number;
  highScoreDistance: number;
  hardcoreHighScore: number;
  revivalWings: number; // packs of 3 or single counts
  
  // Player Profile
  playerName: string;
  playerCountry: string; // ISO code, e.g., 'US', 'JP', 'DE', 'GB', 'FR', 'BR', etc.
  
  // Progression & Level System
  level: number;
  xp: number;
  lifetimeXP: number;

  selectedCharacter: string;
  unlockedCharacters: string[];
  selectedWorld: string;
  unlockedWorlds: string[];
  selectedWing: WingType;
  unlockedWings: WingType[];
  selectedHead: HeadType;
  unlockedHeads: HeadType[];
  selectedTrail: TrailType;
  unlockedTrails: TrailType[];
  selectedCompanion: CompanionType;
  unlockedCompanions: CompanionType[];
  selectedSkill: SkillType;
  skillCharges: Record<SkillType, number>;
  missions: Mission[];
  
  // Ghost Runner Data
  ghostModeEnabled: boolean;
  ghostRunData?: GhostRunData | null;

  // Codex discoveries
  codexDiscovered: string[];

  // Audio & Accessibility
  soundVolume: number;
  musicVolume: number;
  muted: boolean;
  reducedMotion: boolean;
  screenShakeIntensity: number;

  stats: {
    totalRuns: number;
    totalJumps: number;
    totalSlides: number;
    totalDashes: number;
    totalNearMisses: number;
    totalSkillsUsed: number;
    bossesDefeated: number;
    highestCombo: number;
    bestSurvivalTime: number;
    flightsCompleted: number;
    friendsRescued: number;
    hardcoreRuns: number;
  };
}
