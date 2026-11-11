import { 
  GameState, GameMode, SkillType, CharacterSkin, WorldConfig, Hazard, Coin, Boss, GhostSnapshot,
  RescueBox, TagTeamPartner
} from './types';
import { 
  CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y, 
  INITIAL_RUNNER_SPEED, SPEED_INCREASE_INTERVAL, SPEED_INCREASE_AMOUNT, MAX_RUNNER_SPEED,
  BOSS_DISTANCES, CHARACTER_SKINS, WORLDS_CONFIG, SKILLS_CONFIG, getLevelForXP,
  RUNNER_PHYSICS, FLIGHT_PHYSICS
} from './constants';
import { SoundEngine, sound } from './audio';
import { ParticleManager } from './particles';
import { PaletteManager } from './palette';
import { SpriteRenderer } from './sprites';
import { ObstacleManager } from './obstacles';
import { BossController } from './bosses';
import { FlightEnvironmentManager } from './flight';
import { PlayerSaveData } from './types';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  // State
  gameState: GameState = 'MENU';
  gameMode: GameMode = 'ENDLESS';
  saveData: PlayerSaveData;

  // Runner Physics
  player = {
    x: 80,
    y: GROUND_Y - 28,
    vy: 0,
    width: 20,
    height: 28,
    isGrounded: true,
    hasDoubleJumped: false,
    isSliding: false,
    slideTimer: 0,
    slideCooldown: 0,
    isDashing: false,
    dashTimer: 0,
    dashCooldown: 0,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    animTimer: 0,
    animState: 'RUN' as 'RUN' | 'JUMP' | 'DOUBLE_JUMP' | 'FALL' | 'SLIDE' | 'DASH' | 'DEAD' | 'REVIVE' | 'FLY',
    invulnerableTimer: 0,
    footstepTimer: 0,
  };

  // Run Stats
  distance = 0; // in meters
  runCoins = 0;
  score = 0;
  runXP = 0;
  currentSpeed = INITIAL_RUNNER_SPEED;
  speedTimer = 0;
  timeTrialRemaining = 90; // For TIME_TRIAL mode

  // Combo System (1x to 10x multiplier)
  combo = 1;
  comboTimer = 0;

  // Ghost Runner Data
  runTime = 0;
  runSnapshots: GhostSnapshot[] = [];
  snapshotTimer = 0;
  ghostDelta: number | null = null;

  // Near miss detection tracking
  nearMissedHazards = new Set<number>();

  // Active Skill
  activeSkill: SkillType | null = null;
  activeSkillTimer = 0;
  skillCooldownTimer = 0;

  // Boss milestone tracker for current run (5 unique bosses)
  bossesEncountered: Record<string, boolean> = {
    BOSS_1: false,
    BOSS_2: false,
    BOSS_3: false,
    BOSS_4: false,
    BOSS_5: false,
  };

  // Rescue Box & Tag-Team Partner System
  rescueBox: RescueBox | null = null;
  tagTeamPartner: TagTeamPartner | null = null;
  rescueBoxSpawnedMilestones = new Set<number>();
  isWaitingAtRescueBox = false;

  // Flight Mode System (Every 5,000m for 1,000m with dedicated aerial map)
  isFlying = false;
  flightDistance = 0;
  nextFlightMilestone = FLIGHT_PHYSICS.INTERVAL_METERS;
  flightManager = new FlightEnvironmentManager();

  // Angel Wings per-run tracker and player teasing system
  runWingsUsed = 0;
  teasingMessage: string | null = null;

  // Systems
  particles = new ParticleManager();
  palette = new PaletteManager();
  obstacles = new ObstacleManager();
  bosses = new BossController();

  // Screen shake
  screenShake = 0;

  // Parallax offsets
  bgFarOffset = 0;
  bgMidOffset = 0;
  bgNearOffset = 0;
  groundOffset = 0;

  // Animation frame id
  private animFrameId: number | null = null;
  private lastTime = 0;

  // Callbacks to React UI
  private onStateChange?: (state: GameState) => void;
  private onStatsUpdate?: (stats: {
    distance: number;
    coins: number;
    speed: number;
    paletteTier: string;
    activeSkill: SkillType | null;
    skillTimeLeft: number;
    skillCooldown: number;
    skillCharges: number;
    boss: Boss | null;
    powerSurgeActive?: boolean;
    timeRemaining?: number;
    combo: number;
    comboTimer: number;
    dashCooldown: number;
    isDashing: boolean;
    ghostDelta: number | null;
    score: number;
    level: number;
    xp: number;
    isFlying?: boolean;
    flightProgress?: number;
    flightDistanceRemaining?: number;
    tagTeamActive?: boolean;
    isHardcore?: boolean;
    isWaitingAtRescueBox?: boolean;
    teasingMessage?: string | null;
  }) => void;
  private onReviveOffered?: () => void;
  private onGameOver?: (result: { 
    distance: number; 
    coins: number; 
    isNewRecord: boolean;
    xpEarned?: number;
    level?: number;
    highestCombo?: number;
  }) => void;

  constructor(
    canvas: HTMLCanvasElement,
    saveData: PlayerSaveData,
    callbacks: {
      onStateChange?: (state: GameState) => void;
      onStatsUpdate?: (stats: any) => void;
      onReviveOffered?: () => void;
      onGameOver?: (result: any) => void;
    }
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.saveData = saveData;
    this.onStateChange = callbacks.onStateChange;
    this.onStatsUpdate = callbacks.onStatsUpdate;
    this.onReviveOffered = callbacks.onReviveOffered;
    this.onGameOver = callbacks.onGameOver;

    this.initCanvasSize();
    this.startLoop();
  }

  private initCanvasSize() {
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
    this.ctx.imageSmoothingEnabled = false;
  }

  setSaveData(data: PlayerSaveData) {
    this.saveData = data;
    sound.setVolumes(data.soundVolume, data.musicVolume, data.muted);
  }

  // --- GAMEPLAY CONTROLS ---

  triggerPowerSurge() {
    if (this.gameState !== 'PLAYING') return;
    if (this.bosses.currentBoss?.powerSurgeActive) {
      this.bosses.triggerPowerSurgeStrike();
    }
  }

  triggerJump() {
    if (this.gameState !== 'PLAYING') return;

    // If Power Surge is active, jump key unleashes the one-shot attack!
    if (this.bosses.currentBoss?.powerSurgeActive) {
      this.triggerPowerSurge();
      return;
    }

    // In Flight Mode, jump/tap flaps wings upwards!
    if (this.isFlying) {
      this.triggerFlap();
      return;
    }

    // If waiting in front of Rescue Box, prompt dash
    if (this.isWaitingAtRescueBox) {
      this.triggerDash();
      return;
    }

    // Buffer the jump input slightly
    this.player.jumpBufferTimer = RUNNER_PHYSICS.JUMP_BUFFER;

    if (this.player.isGrounded || this.player.coyoteTimer > 0) {
      // Normal ground jump (Snappy, punchy jump curve)
      this.player.vy = RUNNER_PHYSICS.JUMP_IMPULSE;
      this.player.isGrounded = false;
      this.player.coyoteTimer = 0;
      this.player.jumpBufferTimer = 0;
      this.player.isSliding = false;
      this.player.animState = 'JUMP';
      this.particles.emitJumpBurst(this.player.x + 10, GROUND_Y);
      sound.playJump();
      this.saveData.stats.totalJumps++;
    } else if (!this.player.hasDoubleJumped) {
      // Mid-air double jump (resets only on landing)
      this.player.vy = RUNNER_PHYSICS.DOUBLE_JUMP_IMPULSE;
      this.player.hasDoubleJumped = true;
      this.player.animState = 'DOUBLE_JUMP';
      this.player.animTimer = 0;
      this.particles.emitDoubleJumpSpin(this.player.x + 10, this.player.y + 14);
      sound.playDoubleJump();
      this.saveData.stats.totalJumps++;
    }
  }

  triggerFlap() {
    if (!this.isFlying || this.gameState !== 'PLAYING') return;
    this.player.vy = FLIGHT_PHYSICS.FLAP_IMPULSE;
    this.player.animState = 'FLY';
    this.particles.emitDoubleJumpSpin(this.player.x + 4, this.player.y + 16);
    sound.playJump();
  }

  triggerSlide() {
    if (this.gameState !== 'PLAYING') return;
    if (this.player.slideCooldown > 0) return;

    // In flight mode, slide dives downwards rapidly
    if (this.isFlying) {
      this.player.vy = 320;
      return;
    }

    if (this.player.isGrounded) {
      this.player.isSliding = true;
      this.player.slideTimer = 0.55; // 550ms slide duration
      this.player.slideCooldown = 0.8;
      this.player.height = 16;
      this.player.y = GROUND_Y - 16;
      this.player.animState = 'SLIDE';
      this.particles.emitSlideSparks(this.player.x, GROUND_Y);
      sound.playSlide();
      this.saveData.stats.totalSlides++;
    } else {
      // Fast-fall response if pressed in air (anti-floatiness)
      this.player.vy = Math.max(this.player.vy, RUNNER_PHYSICS.FAST_FALL_VELOCITY);
    }
  }

  triggerDash() {
    if (this.gameState !== 'PLAYING') return;

    // Check if player is dashing into the Stasis Rescue Box to free partner
    if (this.rescueBox && !this.rescueBox.shattered) {
      const dist = Math.abs((this.player.x + this.player.width) - this.rescueBox.x);
      if (dist < 50 || this.isWaitingAtRescueBox) {
        this.shatterRescueBox();
      }
    }

    if (this.player.dashCooldown > 0 || this.player.isDashing) return;

    this.player.isDashing = true;
    this.player.dashTimer = RUNNER_PHYSICS.DASH_BURST_TIME;
    this.player.dashCooldown = RUNNER_PHYSICS.DASH_COOLDOWN;
    this.player.animState = 'DASH';
    this.player.animTimer = 0;
    
    // Brief invulnerability during dash burst
    this.player.invulnerableTimer = Math.max(this.player.invulnerableTimer, RUNNER_PHYSICS.DASH_BURST_TIME);

    sound.playDash();
    this.particles.emitDashTrail(this.player.x + 10, this.player.y + 6);
    this.particles.spawnText('DASH!', this.player.x, this.player.y - 12, '#38bdf8');
    
    this.saveData.stats.totalDashes++;
    this.addCombo(1);

    // If waiting at rescue box, dashing immediately shatters it
    if (this.rescueBox && !this.rescueBox.shattered) {
      this.shatterRescueBox();
    }

    // Update mission progress
    for (const m of this.saveData.missions) {
      if (!m.completed && m.type === 'DASHES') {
        m.current++;
        if (m.current >= m.target) {
          m.completed = true;
          m.current = m.target;
        }
      }
    }
  }

  addCombo(amount = 1) {
    this.combo = Math.min(10, this.combo + amount);
    this.comboTimer = 3.8; // 3.8s decay window
    this.saveData.stats.highestCombo = Math.max(this.saveData.stats.highestCombo, this.combo);
    sound.playCombo(this.combo);
    if (this.combo >= 2) {
      this.particles.spawnText(`x${this.combo} COMBO!`, this.player.x + 15, this.player.y - 20, '#facc15');
    }
    // Update combo mission progress
    for (const m of this.saveData.missions) {
      if (!m.completed && m.type === 'COMBOS') {
        m.current = Math.max(m.current, this.combo);
        if (m.current >= m.target) {
          m.completed = true;
          m.current = m.target;
        }
      }
    }
  }

  triggerActiveSkill() {
    if (this.gameState !== 'PLAYING') return;
    const skillType = this.saveData.selectedSkill;
    const charges = this.saveData.skillCharges[skillType] || 0;

    if (charges <= 0) return;
    if (this.activeSkill !== null || this.skillCooldownTimer > 0) return;

    const config = SKILLS_CONFIG[skillType];
    this.activeSkill = skillType;
    this.activeSkillTimer = config.duration;
    this.skillCooldownTimer = config.cooldown;

    // Deduct charge & persist
    this.saveData.skillCharges[skillType] = charges - 1;
    this.saveData.stats.totalSkillsUsed++;

    sound.playSkillActivate();
    this.particles.spawnText(`${config.name}!`, this.player.x, this.player.y - 12, config.color);
  }

  // --- RESCUE BOX & FLIGHT METHODS ---

  spawnRescueBox() {
    const friendSkins = ['ghost', 'ash', 'frost', 'signal', 'dust_rose', 'ink'];
    const randomSkin = friendSkins[Math.floor(Math.random() * friendSkins.length)];
    this.rescueBox = {
      id: Date.now(),
      x: CANVAS_WIDTH + 120,
      y: GROUND_Y - 36,
      width: 32,
      height: 36,
      shattered: false,
      partnerSkinId: randomSkin,
      glowTimer: 0,
    };
    this.isWaitingAtRescueBox = false;
  }

  shatterRescueBox() {
    if (!this.rescueBox || this.rescueBox.shattered) return;
    this.rescueBox.shattered = true;
    this.isWaitingAtRescueBox = false;
    this.screenShake = 18;

    // Cryo pod burst particles
    this.particles.emitExplosion(this.rescueBox.x + 16, this.rescueBox.y + 18, '#38bdf8');
    this.particles.emitDoubleJumpSpin(this.rescueBox.x + 16, this.rescueBox.y + 18);
    sound.playRevival();

    // Spawn partner runner!
    this.tagTeamPartner = {
      active: true,
      skinId: this.rescueBox.partnerSkinId,
      x: this.player.x - 32,
      y: this.player.y,
      animState: this.player.animState === 'DEAD' ? 'RUN' : this.player.animState,
      animTimer: 0,
    };

    this.saveData.stats.friendsRescued++;
    this.particles.spawnText('FRIEND RESCUED! TAG-TEAM ACTIVE!', this.player.x - 10, this.player.y - 20, '#38bdf8');
    this.particles.spawnText('SECOND LIFE SECURED!', this.player.x, this.player.y - 8, '#fde047');

    setTimeout(() => {
      this.rescueBox = null;
    }, 800);
  }

  startFlightMode() {
    if (this.isFlying) return;
    this.isFlying = true;
    this.flightDistance = 0;
    this.flightManager.startExpedition(this.distance);
    this.player.vy = -180;
    this.player.isGrounded = false;
    this.player.animState = 'FLY';
    this.particles.emitDoubleJumpSpin(this.player.x + 10, this.player.y + 14);
    this.particles.spawnText('AERIAL FLIGHT EXPEDITION!', CANVAS_WIDTH / 2 - 120, 60, '#38bdf8');
    this.particles.spawnText('TAP/SPACE TO FLAP WINGS!', CANVAS_WIDTH / 2 - 110, 80, '#facc15');
    sound.playSkillActivate();
  }

  endFlightMode() {
    if (!this.isFlying) return;
    this.isFlying = false;
    this.player.vy = 40;
    this.player.animState = 'FALL';
    this.nextFlightMilestone += FLIGHT_PHYSICS.INTERVAL_METERS;
    this.saveData.stats.flightsCompleted++;
    this.runCoins += FLIGHT_PHYSICS.COMPLETION_BONUS_COINS;
    this.particles.spawnText(`FLIGHT EXPEDITION CLEAR! +${FLIGHT_PHYSICS.COMPLETION_BONUS_COINS} COINS`, CANVAS_WIDTH / 2 - 140, 70, '#fde047');
    this.particles.emitCoinBurst(this.player.x, this.player.y);
    sound.playBossDefeat();
  }

  // --- START / RESTART / REVIVE ---

  startGame(mode: GameMode = 'ENDLESS') {
    this.gameMode = mode;
    this.gameState = 'PLAYING';
    this.distance = 0;
    this.runCoins = 0;
    this.score = 0;
    this.runXP = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.currentSpeed = mode === 'HARDCORE' ? 340 : INITIAL_RUNNER_SPEED;
    this.speedTimer = 0;
    this.timeTrialRemaining = 90;
    this.runSnapshots = [];
    this.snapshotTimer = 0;
    this.runTime = 0;
    this.ghostDelta = null;
    this.nearMissedHazards.clear();

    this.player.x = 80;
    this.player.y = GROUND_Y - 28;
    this.player.vy = 0;
    this.player.height = 28;
    this.player.isGrounded = true;
    this.player.hasDoubleJumped = false;
    this.player.isSliding = false;
    this.player.slideTimer = 0;
    this.player.slideCooldown = 0;
    this.player.isDashing = false;
    this.player.dashTimer = 0;
    this.player.dashCooldown = 0;
    this.player.invulnerableTimer = 1.0; // 1s start grace
    this.player.animState = 'RUN';

    this.activeSkill = null;
    this.activeSkillTimer = 0;
    this.skillCooldownTimer = 0;

    this.bossesEncountered = {
      BOSS_1: false,
      BOSS_2: false,
      BOSS_3: false,
      BOSS_4: false,
      BOSS_5: false,
    };

    // Reset Flight Mode & Rescue Box
    this.isFlying = false;
    this.flightDistance = 0;
    this.nextFlightMilestone = FLIGHT_PHYSICS.INTERVAL_METERS;
    this.rescueBox = null;
    this.tagTeamPartner = null;
    this.rescueBoxSpawnedMilestones.clear();
    this.isWaitingAtRescueBox = false;

    // Reset run Angel Wings counter and teasing
    this.runWingsUsed = 0;
    this.teasingMessage = null;

    this.obstacles.reset();
    this.bosses.reset();
    this.particles.clear();

    if (mode === 'BOSS_RUSH') {
      // Immediate Boss 1 encounter
      this.bosses.startBoss('VINEKEEPER');
    } else if (mode === 'SURVIVAL') {
      // High speed test of reflexes
      this.currentSpeed = 330;
    } else if (mode === 'HARDCORE') {
      // Hardcore mode starts fast with crimson intensity
      this.currentSpeed = 340;
    } else if (mode === 'COIN_RUSH') {
      // Auto activate Coin Magnet for excitement
      this.activeSkill = 'COIN_MAGNET';
      this.activeSkillTimer = 10;
    }

    sound.startMusic(mode === 'BOSS_RUSH');
    this.saveData.stats.totalRuns++;
    this.onStateChange?.(this.gameState);
  }

  pauseGame() {
    if (this.gameState === 'PLAYING') {
      this.gameState = 'PAUSED';
      sound.stopMusic();
      this.onStateChange?.(this.gameState);
    }
  }

  resumeGame() {
    if (this.gameState === 'PAUSED') {
      this.gameState = 'PLAYING';
      sound.startMusic(this.bosses.isBossActive());
      this.onStateChange?.(this.gameState);
    }
  }

  revivePlayer() {
    if (this.saveData.revivalWings <= 0) return;
    this.saveData.revivalWings--;

    this.runWingsUsed++;

    // Teasing on 4th revival and beyond
    if (this.runWingsUsed >= 4) {
      const teasingLines = [
        "BRO, YOU COULDN'T SURVIVE WITHOUT ANGEL WINGS? 💀",
        "At this point, the wings are playing the game for you 🪽",
        `Wings Counter: ${this.runWingsUsed}. Gravity's favorite runner! 😭`,
        "Legend says the wings have beaten more bosses than you 🏆",
        `Emergency rescue #${this.runWingsUsed}! Need training wheels? 😂`,
      ];
      this.teasingMessage = teasingLines[(this.runWingsUsed - 4) % teasingLines.length];
      this.particles.spawnText(this.teasingMessage, CANVAS_WIDTH / 2 - 140, 52, '#f43f5e');
    }

    this.gameState = 'PLAYING';
    this.player.y = GROUND_Y - 45;
    this.player.vy = -180;
    this.player.isGrounded = false;
    this.player.hasDoubleJumped = false;
    this.player.isSliding = false;
    this.player.height = 28;
    this.player.invulnerableTimer = 3.8; // 3.8s temporary invulnerability
    this.player.animState = 'RUN';

    // Clear all hazards around player
    this.obstacles.clearNearObstacles(this.player.x, 340);
    this.bosses.bossHazards = [];
    this.bosses.bossProjectiles = [];

    // Holy blast wave
    this.particles.emitRevivalWings(this.player.x + 10, this.player.y + 14);
    this.particles.spawnText('REVIVED!', this.player.x, this.player.y - 16, '#fde047');
    sound.playRevival();
    sound.startMusic(this.bosses.isBossActive());

    this.onStateChange?.(this.gameState);
  }

  private handlePlayerDeath() {
    if (this.player.animState === 'DEAD') return;

    // 1. Check for Tag-Team Partner Second Life Swap!
    if (this.tagTeamPartner?.active) {
      this.tagTeamPartner.active = false;
      this.player.invulnerableTimer = 3.5;
      this.combo = Math.max(1, this.combo);
      this.screenShake = 18;
      this.obstacles.clearNearObstacles(this.player.x, 320);
      this.bosses.bossHazards = [];
      this.bosses.bossProjectiles = [];
      this.particles.emitExplosion(this.player.x + 10, this.player.y + 14, '#38bdf8');
      this.particles.spawnText('TAG-TEAM SWAP! 2ND LIFE!', this.player.x, this.player.y - 18, '#38bdf8');
      sound.playRevival();
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([60, 40, 100]);
      }
      return;
    }

    // 2. Check for Second Chance skill safeguard
    if (this.activeSkill === 'SECOND_CHANCE' || (this.saveData.selectedSkill === 'SECOND_CHANCE' && this.saveData.skillCharges.SECOND_CHANCE > 0)) {
      if (this.saveData.selectedSkill === 'SECOND_CHANCE' && this.activeSkill !== 'SECOND_CHANCE') {
        this.saveData.skillCharges.SECOND_CHANCE--;
      }
      this.activeSkill = 'SHIELD_BURST';
      this.activeSkillTimer = 3.5;
      this.player.invulnerableTimer = 3.5;
      this.obstacles.clearNearObstacles(this.player.x, 260);
      this.particles.spawnText('SECOND CHANCE!', this.player.x, this.player.y - 14, '#f43f5e');
      sound.playSkillActivate();
      return;
    }

    // 3. Hardcore Mode: Permadeath (No Revivals) + Haptic Vibration
    if (this.gameMode === 'HARDCORE') {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([180, 80, 320]);
      }
      this.player.animState = 'DEAD';
      this.screenShake = 22;
      this.particles.emitExplosion(this.player.x + 10, this.player.y + 14, '#f43f5e');
      sound.playCollision();
      sound.stopMusic();
      this.endGame();
      return;
    }

    this.player.animState = 'DEAD';
    this.screenShake = 16;
    this.particles.emitExplosion(this.player.x + 10, this.player.y + 14);
    sound.playCollision();
    sound.stopMusic();

    // Check if player has revival wings (Standard modes)
    if (this.saveData.revivalWings > 0) {
      this.gameState = 'REVIVING';
      this.onStateChange?.(this.gameState);
      this.onReviveOffered?.();
    } else {
      this.endGame();
    }
  }

  discoverCodex(id: string) {
    if (!this.saveData.codexDiscovered.includes(id)) {
      this.saveData.codexDiscovered.push(id);
      sound.playCodexDiscover();
      this.particles.spawnText('CODEX ENTRY UNLOCKED!', CANVAS_WIDTH / 2 - 90, 55, '#38bdf8');
    }
  }

  private checkNearMisses() {
    if (this.player.animState === 'DEAD') return;
    const px = this.player.x;
    const py = this.player.y;
    const pw = this.player.width;
    const ph = this.player.height;

    const allHazards = [...this.obstacles.hazards, ...this.bosses.bossHazards];
    for (const h of allHazards) {
      if (!h.active || this.nearMissedHazards.has(h.id)) continue;

      const dx = Math.abs((px + pw / 2) - (h.x + h.width / 2));
      const dy = Math.abs((py + ph / 2) - (h.y + h.height / 2));
      const combinedHalfW = (pw + h.width) / 2;
      const combinedHalfH = (ph + h.height) / 2;

      // Close proximity but not touching
      if (dx < combinedHalfW + 18 && dy < combinedHalfH + 20) {
        this.nearMissedHazards.add(h.id);
        this.saveData.stats.totalNearMisses++;
        this.addCombo(1);
        this.runXP += 30;
        this.particles.emitNearMiss(h.x + h.width / 2, h.y + h.height / 2);
        this.particles.spawnText('NEAR MISS! +30 XP', px + 10, py - 18, '#67e8f9');
        sound.playNearMiss();

        // Update near misses mission
        for (const m of this.saveData.missions) {
          if (!m.completed && m.type === 'NEAR_MISSES') {
            m.current++;
            if (m.current >= m.target) {
              m.completed = true;
              m.current = m.target;
            }
          }
        }
      }
    }
  }

  endGame() {
    this.gameState = 'GAME_OVER';
    sound.stopMusic();

    const isNewRecord = this.distance > this.saveData.highScoreDistance;
    if (isNewRecord) {
      this.saveData.highScoreDistance = Math.floor(this.distance);
      // Save ghost run data on new record
      if (this.runSnapshots.length > 5) {
        this.saveData.ghostRunData = {
          distance: Math.floor(this.distance),
          characterId: this.saveData.selectedCharacter,
          snapshots: this.runSnapshots,
        };
      }
    }
    this.saveData.coins += this.runCoins;
    this.saveData.lifetimeCoins += this.runCoins;

    // Calculate XP gained from distance, coins, and combo mastery
    const earnedXP = Math.floor(this.distance * 1.5) + (this.runCoins * 10) + (this.saveData.stats.highestCombo * 25);
    this.runXP = earnedXP;
    this.saveData.xp += earnedXP;
    this.saveData.lifetimeXP += earnedXP;

    // Level up verification
    const prevLevel = this.saveData.level;
    const { level: newLevel } = getLevelForXP(this.saveData.xp);
    if (newLevel > prevLevel) {
      this.saveData.level = newLevel;
      sound.playLevelUp();
      this.particles.emitLevelUp(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }

    // Codex discoveries for distance milestones
    if (this.distance >= 400) this.discoverCodex('world_forest');
    if (this.distance >= 1000) this.discoverCodex('world_underground');
    if (this.distance >= 2000) this.discoverCodex('world_frozen');
    if (this.distance >= 3500) this.discoverCodex('world_kingdom');
    if (this.distance >= 5000) this.discoverCodex('world_void');

    // Update missions progress
    this.checkMissionsProgress();

    this.onStateChange?.(this.gameState);
    this.onGameOver?.({
      distance: Math.floor(this.distance),
      coins: this.runCoins,
      isNewRecord,
      xpEarned: earnedXP,
      level: this.saveData.level,
      highestCombo: this.saveData.stats.highestCombo,
    });
  }

  private checkMissionsProgress() {
    for (const m of this.saveData.missions) {
      if (m.completed) continue;
      if (m.type === 'DISTANCE') {
        m.current = Math.max(m.current, Math.floor(this.distance));
      } else if (m.type === 'COINS') {
        m.current += this.runCoins;
      } else if (m.type === 'JUMPS') {
        m.current = this.saveData.stats.totalJumps;
      } else if (m.type === 'SLIDES') {
        m.current = this.saveData.stats.totalSlides;
      } else if (m.type === 'DASHES') {
        m.current = this.saveData.stats.totalDashes;
      } else if (m.type === 'NEAR_MISSES') {
        m.current = this.saveData.stats.totalNearMisses;
      } else if (m.type === 'COMBOS') {
        m.current = Math.max(m.current, this.saveData.stats.highestCombo);
      } else if (m.type === 'SKILLS') {
        m.current = this.saveData.stats.totalSkillsUsed;
      } else if (m.type === 'BOSSES') {
        m.current = this.saveData.stats.bossesDefeated;
      }
      if (m.current >= m.target) {
        m.completed = true;
        m.current = m.target;
      }
    }
  }

  // --- MAIN ENGINE LOOP ---

  private startLoop() {
    const loop = (timestamp: number) => {
      if (!this.lastTime) this.lastTime = timestamp;
      const rawDt = (timestamp - this.lastTime) / 1000;
      this.lastTime = timestamp;

      // Clamp delta time to avoid physics tunneling
      const dt = Math.min(rawDt, 0.05);

      if (this.gameState === 'PLAYING') {
        this.update(dt);
      } else if (this.gameState === 'MENU') {
        // Run demo background animation for title screen
        this.updateMenuDemo(dt);
      }

      this.render();

      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  destroy() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    sound.stopMusic();
  }

  // --- UPDATE SIMULATION ---

  private update(dt: number) {
    // 1. World Time Dilation (Time Bend active skill)
    let effectiveDt = dt;
    if (this.activeSkill === 'TIME_BEND') {
      effectiveDt = dt * 0.45; // 55% slowdown
    }

    // 2. Speed ramp: increases every 10 seconds by ~11 px/s
    this.speedTimer += dt;
    if (this.speedTimer >= SPEED_INCREASE_INTERVAL) {
      this.speedTimer -= SPEED_INCREASE_INTERVAL;
      if (this.currentSpeed < MAX_RUNNER_SPEED) {
        this.currentSpeed = Math.min(MAX_RUNNER_SPEED, this.currentSpeed + SPEED_INCREASE_AMOUNT);
      }
    }

    // If waiting in front of Rescue Box to dash, freeze world scrolling
    const effectiveWorldSpeed = this.isWaitingAtRescueBox ? 0 : this.currentSpeed * (this.activeSkill === 'TIME_BEND' ? 0.45 : 1.0);

    // 3. Distance, Score & Time Trial
    const frameDistance = this.isWaitingAtRescueBox ? 0 : (this.currentSpeed * dt) / 10;
    this.distance += frameDistance;
    const scoreMultiplier = (this.gameMode === 'HARDCORE' ? 3 : 1) * this.combo;
    this.score += Math.round(frameDistance * 10 * scoreMultiplier);

    if (this.gameMode === 'TIME_TRIAL') {
      this.timeTrialRemaining -= dt;
      if (this.timeTrialRemaining <= 0) {
        this.endGame();
        return;
      }
    }

    // Dash timer and cooldown management
    if (this.player.isDashing) {
      this.player.dashTimer -= dt;
      this.particles.emitDashTrail(this.player.x + 8, this.player.y + 12);
      if (this.player.dashTimer <= 0) {
        this.player.isDashing = false;
        this.player.animState = this.isFlying ? 'FLY' : (this.player.isGrounded ? 'RUN' : 'FALL');
      }
    }
    if (this.player.dashCooldown > 0) {
      this.player.dashCooldown -= dt;
    }

    // Combo timer decay
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 1;
      }
    }

    // Ghost runner recording & lead/lag tracking
    this.runTime += dt;
    this.snapshotTimer += dt;
    if (this.snapshotTimer >= 0.15) {
      this.snapshotTimer = 0;
      this.runSnapshots.push({
        d: Math.floor(this.distance),
        y: Math.round(this.player.y),
        state: this.player.animState,
        isSliding: this.player.isSliding,
      });
    }
    if (this.saveData.ghostModeEnabled && this.saveData.ghostRunData && this.saveData.ghostRunData.snapshots.length > 0) {
      const ghostIndex = Math.min(
        Math.floor(this.runTime / 0.15),
        this.saveData.ghostRunData.snapshots.length - 1
      );
      const ghostSnap = this.saveData.ghostRunData.snapshots[ghostIndex];
      this.ghostDelta = Math.floor(this.distance - ghostSnap.d);
    } else {
      this.ghostDelta = null;
    }

    // 4. Boss Encounter Milestones (5 Unique Titans)
    if (this.gameMode === 'ENDLESS') {
      if (this.distance >= BOSS_DISTANCES.BOSS_1 && !this.bossesEncountered.BOSS_1) {
        this.bossesEncountered.BOSS_1 = true;
        this.bosses.startBoss('VINEKEEPER');
        this.discoverCodex('boss_vinekeeper');
      } else if (this.distance >= BOSS_DISTANCES.BOSS_2 && !this.bossesEncountered.BOSS_2) {
        this.bossesEncountered.BOSS_2 = true;
        this.bosses.startBoss('IRON_STAG');
        this.discoverCodex('boss_iron_stag');
      } else if (this.distance >= BOSS_DISTANCES.BOSS_3 && !this.bossesEncountered.BOSS_3) {
        this.bossesEncountered.BOSS_3 = true;
        this.bosses.startBoss('HOLLOW_GIANT');
        this.discoverCodex('boss_hollow_giant');
      } else if (this.distance >= BOSS_DISTANCES.BOSS_4 && !this.bossesEncountered.BOSS_4) {
        this.bossesEncountered.BOSS_4 = true;
        this.bosses.startBoss('VOID_COLOSSUS');
        this.discoverCodex('boss_void_colossus');
      } else if (this.distance >= BOSS_DISTANCES.BOSS_5 && !this.bossesEncountered.BOSS_5) {
        this.bossesEncountered.BOSS_5 = true;
        this.bosses.startBoss('CHRONO_SPECTER');
        this.discoverCodex('boss_chrono_specter');
      }
    }

    // 4.5. Stasis Rescue Box Milestones (e.g. 500m, 1,200m, 2,500m, 5,000m, 7,500m, 10,000m)
    const rescueMilestones = [500, 1200, 2500, 5000, 7500, 10000, 15000, 20000];
    for (const rm of rescueMilestones) {
      if (
        this.distance >= rm &&
        !this.rescueBoxSpawnedMilestones.has(rm) &&
        !this.tagTeamPartner?.active &&
        !this.rescueBox &&
        !this.isFlying &&
        !this.bosses.isBossActive()
      ) {
        this.rescueBoxSpawnedMilestones.add(rm);
        this.spawnRescueBox();
        break;
      }
    }

    // Update Rescue Box state & proximity check
    if (this.rescueBox && !this.rescueBox.shattered) {
      if (!this.isWaitingAtRescueBox) {
        this.rescueBox.x -= effectiveWorldSpeed * dt;
      }
      this.rescueBox.glowTimer += dt;

      const playerFront = this.player.x + this.player.width;
      const boxDist = this.rescueBox.x - playerFront;

      // When player reaches the front of the capsule
      if (boxDist <= 16 && boxDist >= -24) {
        if (this.player.isDashing) {
          this.shatterRescueBox();
        } else if (!this.isWaitingAtRescueBox) {
          this.isWaitingAtRescueBox = true;
          this.player.isGrounded = true;
          this.player.vy = 0;
          this.player.y = GROUND_Y - this.player.height;
          sound.playClick();
        }
      }

      if (this.rescueBox.x < -60) {
        this.rescueBox = null;
        this.isWaitingAtRescueBox = false;
      }
    }

    // 4.6. Advanced Flight Mode Milestones (Every 5,000m for 1,000m)
    if (this.gameMode === 'ENDLESS' || this.gameMode === 'HARDCORE') {
      if (!this.isFlying && this.distance >= this.nextFlightMilestone && !this.bosses.isBossActive()) {
        this.startFlightMode();
      }
    }

    // 5. Active Skill timers
    if (this.activeSkillTimer > 0) {
      this.activeSkillTimer -= dt;
      if (this.activeSkillTimer <= 0) {
        this.activeSkill = null;
      }
    }
    if (this.skillCooldownTimer > 0) {
      this.skillCooldownTimer -= dt;
    }

    // 6. Invulnerability
    if (this.player.invulnerableTimer > 0) {
      this.player.invulnerableTimer -= dt;
    }

    // 7. Parallax background scroll
    this.bgFarOffset = (this.bgFarOffset + effectiveWorldSpeed * 0.15 * dt) % CANVAS_WIDTH;
    this.bgMidOffset = (this.bgMidOffset + effectiveWorldSpeed * 0.4 * dt) % CANVAS_WIDTH;
    this.bgNearOffset = (this.bgNearOffset + effectiveWorldSpeed * 0.7 * dt) % CANVAS_WIDTH;
    this.groundOffset = (this.groundOffset + effectiveWorldSpeed * dt) % 32;

    // 8. Player Movement & Physics
    this.player.animTimer += dt;

    // Update Tag Team partner if active
    if (this.tagTeamPartner?.active) {
      this.tagTeamPartner.animTimer += dt;
      this.tagTeamPartner.x = this.player.x - 30;
      this.tagTeamPartner.y = this.player.y;
      this.tagTeamPartner.animState = this.player.animState === 'DEAD' ? 'RUN' : this.player.animState;
    }

    // Coyote timer
    if (!this.player.isGrounded && this.player.coyoteTimer > 0) {
      this.player.coyoteTimer -= dt;
    }

    // Jump buffer timer
    if (this.player.jumpBufferTimer > 0) {
      this.player.jumpBufferTimer -= dt;
    }

    // Flight Physics vs Ground Physics
    if (this.isFlying) {
      this.flightDistance += frameDistance;
      this.player.vy += FLIGHT_PHYSICS.GRAVITY * dt;
      this.player.y += this.player.vy * dt;
      this.player.isGrounded = false;
      this.player.animState = 'FLY';

      // Altitude clamps
      if (this.player.y < FLIGHT_PHYSICS.CEILING_Y) {
        this.player.y = FLIGHT_PHYSICS.CEILING_Y;
        this.player.vy = Math.max(0, this.player.vy);
      }
      if (this.player.y > FLIGHT_PHYSICS.FLOOR_Y) {
        this.player.y = FLIGHT_PHYSICS.FLOOR_Y;
        this.player.vy = Math.min(0, this.player.vy);
      }

      // Update dedicated aerial environment (stone pillars, floating coins, shifting gates)
      this.flightManager.update(
        effectiveWorldSpeed,
        effectiveDt,
        this.player.x,
        this.player.y,
        () => {
          this.runCoins += 1;
          sound.playCoin();
        }
      );

      // Check flight collisions against spiked ceiling, spiked floor, and pillar gates
      if (this.player.invulnerableTimer <= 0 && !this.player.isDashing && this.activeSkill !== 'PHASE_SHIFT') {
        const pBox = {
          x: this.player.x + 4,
          y: this.player.y + 2,
          w: this.player.width - 8,
          h: this.player.height - 4,
        };
        if (this.flightManager.checkCollision(pBox)) {
          if (this.activeSkill === 'SHIELD_BURST') {
            this.activeSkill = null;
            this.activeSkillTimer = 0;
            this.player.invulnerableTimer = 1.2;
            this.particles.emitExplosion(this.player.x + 10, this.player.y + 14, '#38bdf8');
            sound.playClick();
          } else {
            this.combo = 1;
            this.handlePlayerDeath();
            return;
          }
        }
      }

      // Atmospheric cloud particles during flight
      if (Math.random() < 0.25) {
        this.particles.spawn({
          x: CANVAS_WIDTH,
          y: Math.random() * (GROUND_Y - 40) + 20,
          vx: -(effectiveWorldSpeed * 1.5 + 40),
          vy: 0,
          size: Math.random() * 2 + 1,
          color: 'rgba(255, 255, 255, 0.45)',
          alpha: 0.6,
          maxLife: 0.5,
        });
      }

      if (this.flightDistance >= FLIGHT_PHYSICS.DURATION_METERS) {
        this.endFlightMode();
      }
    } else {
      // Kinetic Vault skill: automatic repulsor launch on approaching obstacles
      if (this.activeSkill === 'KINETIC_VAULT') {
        for (const h of this.obstacles.hazards) {
          if (!h.isVaulted && h.x > this.player.x && h.x < this.player.x + 160 && h.y >= GROUND_Y - 45) {
            h.isVaulted = true;
            h.vy = -440;
            this.particles.emitExplosion(h.x + h.width / 2, h.y + h.height / 2, '#38bdf8');
            this.particles.spawnText('VAULT!', h.x, h.y - 12, '#38bdf8');
            sound.playJump();
          }
        }
      }
      // Ground Gravity & Vertical Motion (Snappy, responsive jump arc)
      if (!this.player.isGrounded) {
        this.player.vy += RUNNER_PHYSICS.GRAVITY * dt;
        this.player.y += this.player.vy * dt;

        if (this.player.vy > 0 && this.player.animState !== 'DOUBLE_JUMP' && this.player.animState !== 'DASH') {
          this.player.animState = 'FALL';
        }

        // Check ground landing
        if (this.player.y >= GROUND_Y - this.player.height) {
          this.player.y = GROUND_Y - this.player.height;
          this.player.vy = 0;
          this.player.isGrounded = true;
          this.player.hasDoubleJumped = false; // Reset double jump on land
          if (!this.player.isDashing) {
            this.player.animState = this.player.isSliding ? 'SLIDE' : 'RUN';
          }
          this.particles.emitRunDust(this.player.x + 8, GROUND_Y);

          // Consume buffered jump if pressed right before landing
          if (this.player.jumpBufferTimer > 0) {
            this.triggerJump();
          }
        }
      }
    }

    // Slide state machine
    if (this.player.isSliding) {
      this.player.slideTimer -= dt;
      this.player.height = 16;
      this.player.y = GROUND_Y - 16;
      this.particles.emitSlideSparks(this.player.x + 4, GROUND_Y);

      if (this.player.slideTimer <= 0) {
        this.player.isSliding = false;
        this.player.height = 28;
        this.player.y = GROUND_Y - 28;
        if (!this.player.isDashing) {
          this.player.animState = 'RUN';
        }
      }
    }
    if (this.player.slideCooldown > 0) {
      this.player.slideCooldown -= dt;
    }

    // Footstep audio cadence when running on ground
    if (this.player.isGrounded && !this.player.isSliding && !this.player.isDashing) {
      this.player.footstepTimer += dt;
      if (this.player.footstepTimer > 0.22) {
        this.player.footstepTimer = 0;
        sound.playFootstep();
        this.particles.emitRunDust(this.player.x + 4, GROUND_Y);
      }
    }

    // Trail particle emissions
    if (this.saveData.selectedTrail !== 'NONE') {
      this.emitPlayerTrail();
    }

    // 9. Update Palette progression
    this.palette.update(this.runCoins, dt);

    // 10. Update Obstacles & Boss
    this.obstacles.update(effectiveWorldSpeed, effectiveDt, this.distance, this.bosses.isBossActive());
    
    this.bosses.update(
      effectiveDt,
      this.player.x,
      this.player.y,
      (defeatedBoss, rewardCoins) => {
        // Exactly 200 coins as requested! (doubled in daily challenge)
        const earnedBonus = this.gameMode === 'DAILY_CHALLENGE' ? rewardCoins * 2 : rewardCoins;
        this.runCoins += earnedBonus;
        this.screenShake = 22;
        this.addCombo(3);
        this.particles.spawnText(`TITAN ONE-SHOT! +${earnedBonus} COINS`, CANVAS_WIDTH / 2 - 110, 85, '#fde047');
        this.particles.emitCoinBurst(CANVAS_WIDTH / 2, 130);
        this.particles.emitExplosion(defeatedBoss.x + 40, defeatedBoss.y + 40, '#facc15');
        this.saveData.stats.bossesDefeated++;
        this.discoverCodex('relic_power_surge');
        sound.playBossDefeat();

        // Check Boss Rush successive sequence (All 5 Boss Titans)
        if (this.gameMode === 'BOSS_RUSH') {
          if (defeatedBoss.type === 'VINEKEEPER') {
            setTimeout(() => {
              if (this.gameState === 'PLAYING') {
                this.bosses.startBoss('IRON_STAG');
                this.discoverCodex('boss_iron_stag');
              }
            }, 3500);
          } else if (defeatedBoss.type === 'IRON_STAG') {
            setTimeout(() => {
              if (this.gameState === 'PLAYING') {
                this.bosses.startBoss('HOLLOW_GIANT');
                this.discoverCodex('boss_hollow_giant');
              }
            }, 3500);
          } else if (defeatedBoss.type === 'HOLLOW_GIANT') {
            setTimeout(() => {
              if (this.gameState === 'PLAYING') {
                this.bosses.startBoss('VOID_COLOSSUS');
                this.discoverCodex('boss_void_colossus');
              }
            }, 3500);
          } else if (defeatedBoss.type === 'VOID_COLOSSUS') {
            setTimeout(() => {
              if (this.gameState === 'PLAYING') {
                this.bosses.startBoss('CHRONO_SPECTER');
                this.discoverCodex('boss_chrono_specter');
              }
            }, 3500);
          } else if (defeatedBoss.type === 'CHRONO_SPECTER') {
            this.particles.spawnText('ALL 5 TITANS CONQUERED! +1000 COINS', CANVAS_WIDTH / 2 - 140, 80, '#38bdf8');
            this.runCoins += 1000;
          }
        } else {
          sound.startMusic(false);
        }
      }
    );

    // 11. Coin Collection (with Coin Magnet support)
    this.updateCoins(dt);

    // 11.5 Near-Miss Detection
    this.checkNearMisses();

    // 12. Hazard Collisions
    this.checkCollisions();

    // 13. Particles update & Screen Shake decay
    this.particles.update(dt);
    if (this.screenShake > 0) {
      this.screenShake -= dt * 30;
      if (this.screenShake < 0) this.screenShake = 0;
    }

    // 14. Report stats to React HUD
    this.onStatsUpdate?.({
      distance: Math.floor(this.distance),
      coins: this.runCoins,
      speed: Math.round(this.currentSpeed),
      paletteTier: this.palette.getCurrentPalette().tierName,
      activeSkill: this.activeSkill,
      skillTimeLeft: Math.max(0, this.activeSkillTimer),
      skillCooldown: Math.max(0, this.skillCooldownTimer),
      skillCharges: this.saveData.skillCharges[this.saveData.selectedSkill] || 0,
      boss: this.bosses.currentBoss,
      powerSurgeActive: !!this.bosses.currentBoss?.powerSurgeActive,
      timeRemaining: this.gameMode === 'TIME_TRIAL' ? Math.max(0, Math.ceil(this.timeTrialRemaining)) : undefined,
      combo: this.combo,
      comboTimer: this.comboTimer,
      dashCooldown: Math.max(0, this.player.dashCooldown),
      isDashing: this.player.isDashing,
      ghostDelta: this.ghostDelta,
      score: this.score,
      level: this.saveData.level,
      xp: this.saveData.xp,
      isFlying: this.isFlying,
      flightProgress: this.isFlying ? Math.min(1, this.flightDistance / FLIGHT_PHYSICS.DURATION_METERS) : 0,
      flightDistanceRemaining: this.isFlying ? Math.max(0, Math.round(FLIGHT_PHYSICS.DURATION_METERS - this.flightDistance)) : 0,
      tagTeamActive: !!this.tagTeamPartner?.active,
      isHardcore: this.gameMode === 'HARDCORE',
      isWaitingAtRescueBox: this.isWaitingAtRescueBox,
      teasingMessage: this.teasingMessage,
    });
  }

  private updateMenuDemo(dt: number) {
    // Idle background scroll for title screen
    this.bgFarOffset = (this.bgFarOffset + 40 * dt) % CANVAS_WIDTH;
    this.bgMidOffset = (this.bgMidOffset + 90 * dt) % CANVAS_WIDTH;
    this.bgNearOffset = (this.bgNearOffset + 180 * dt) % CANVAS_WIDTH;
    this.groundOffset = (this.groundOffset + 240 * dt) % 32;
    this.player.animTimer += dt;
    this.particles.update(dt);
  }

  private emitPlayerTrail() {
    const t = this.saveData.selectedTrail;
    const px = this.player.x;
    const py = this.player.y + (this.player.isSliding ? 10 : 16);

    if (t === 'EMBER_TRAIL') {
      this.particles.spawn({
        x: px - 2,
        y: py + (Math.random() * 6 - 3),
        vx: -(Math.random() * 60 + 20),
        vy: -(Math.random() * 20),
        size: Math.random() * 2.5 + 1,
        color: Math.random() > 0.5 ? '#f97316' : '#facc15',
        alpha: 0.8,
        maxLife: 0.35,
        gravity: 5,
      });
    } else if (t === 'GHOST_TRAIL') {
      this.particles.spawn({
        x: px,
        y: py,
        vx: -30,
        vy: 0,
        size: 3,
        color: '#cffafe',
        alpha: 0.5,
        maxLife: 0.4,
      });
    } else if (t === 'SPARK_TRAIL') {
      this.particles.spawn({
        x: px + (Math.random() * 4 - 2),
        y: py + (Math.random() * 4 - 2),
        vx: -(Math.random() * 80 + 30),
        vy: (Math.random() * 40 - 20),
        size: 2,
        color: '#38bdf8',
        alpha: 0.9,
        maxLife: 0.25,
      });
    } else if (t === 'STAR_TRAIL') {
      this.particles.spawn({
        x: px,
        y: py,
        vx: -(Math.random() * 40 + 20),
        vy: -(Math.random() * 30 + 5),
        size: 3,
        color: '#fef08a',
        alpha: 0.9,
        maxLife: 0.45,
        gravity: 20,
      });
    }
  }

  private updateCoins(dt: number) {
    const px = this.player.x + this.player.width / 2;
    const py = this.player.y + this.player.height / 2;

    const isMagnet = this.activeSkill === 'COIN_MAGNET';

    for (const c of this.obstacles.coins) {
      if (c.collected) continue;

      if (isMagnet) {
        // Magnet pulls coins across screen
        const dx = px - c.x;
        const dy = py - c.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 340) {
          c.x += (dx / dist) * 440 * dt;
          c.y += (dy / dist) * 440 * dt;
        }
      }

      // Check collision with player
      const cx = c.x + 6;
      const cy = c.y + 6;
      const pLeft = this.player.x;
      const pRight = this.player.x + this.player.width;
      const pTop = this.player.y;
      const pBottom = this.player.y + this.player.height;

      if (cx >= pLeft - 8 && cx <= pRight + 8 && cy >= pTop - 8 && cy <= pBottom + 8) {
        c.collected = true;
        const multiplier = (this.gameMode === 'COIN_RUSH' || this.gameMode === 'DAILY_CHALLENGE') ? 2 : 1;
        this.runCoins += multiplier;
        this.particles.emitCoinBurst(c.x + 6, c.y + 6);
        this.particles.spawnText(multiplier > 1 ? `+${multiplier}` : '+1', c.x + 4, c.y - 4, '#fbbf24');
        sound.playCoin();
      }
    }
  }

  private checkCollisions() {
    if (this.player.animState === 'DEAD') return;
    if (this.player.invulnerableTimer > 0) return;
    if (this.player.isDashing) return; // Dash burst phases through hazards
    if (this.activeSkill === 'PHASE_SHIFT') return; // Safe pass

    const pBox = {
      x: this.player.x + 4,
      y: this.player.y + 2,
      w: this.player.width - 8,
      h: this.player.height - 4,
    };

    // Combine obstacle hazards + boss hazards
    const allHazards = [...this.obstacles.hazards, ...this.bosses.bossHazards];

    for (const h of allHazards) {
      if (!h.active) continue;

      // Safe pass if vaulted into the air by Kinetic Vault skill
      if (h.isVaulted && (h.y < GROUND_Y - 45 || (h.vy || 0) < 0)) {
        continue;
      }

      // Special rule: if sliding, safe under slideAllowed overhead hazards
      if (this.player.isSliding && h.slideAllowed) {
        continue;
      }

      // Dynamic Arc Collision for SWINGING_BLADE (axe follows pendulum curve)
      if (h.type === 'SWINGING_BLADE') {
        const pivotX = h.x + h.width / 2;
        const pivotY = 0;
        const swingAngle = Math.sin(this.player.animTimer * 3.5) * 0.7;
        const chainLen = h.y - pivotY + h.height / 2;
        const bladeX = pivotX + Math.sin(swingAngle) * chainLen;
        const bladeY = pivotY + Math.cos(swingAngle) * chainLen;
        const axeBox = {
          x: bladeX - 16,
          y: bladeY - 8,
          w: 32,
          h: 18,
        };
        if (
          pBox.x < axeBox.x + axeBox.w &&
          pBox.x + pBox.w > axeBox.x &&
          pBox.y < axeBox.y + axeBox.h &&
          pBox.y + pBox.h > axeBox.y
        ) {
          if (this.activeSkill === 'SHIELD_BURST') {
            this.activeSkill = null;
            this.activeSkillTimer = 0;
            this.player.invulnerableTimer = 1.2;
            this.combo = 1;
            this.obstacles.clearNearObstacles(this.player.x, 180);
            this.particles.emitExplosion(this.player.x + 10, this.player.y + 14, '#38bdf8');
            sound.playClick();
            return;
          }
          this.combo = 1;
          this.handlePlayerDeath();
          return;
        }
        continue;
      }

      // Dynamic Slide & Drop Collision for GUILLOTINE
      if (h.type === 'GUILLOTINE') {
        const dropProgress = (Math.sin((h.stateTimer || 0) * 5) + 1) / 2;
        const bladeY = h.y + 4 + dropProgress * (h.height - 22);
        // Safe slide under when blade is raised above ground slide clearance
        if (this.player.isSliding && bladeY + 12 < GROUND_Y - 14) {
          continue;
        }
        const bladeBox = {
          x: h.x + 4,
          y: bladeY,
          w: h.width - 8,
          h: 12,
        };
        if (
          pBox.x < bladeBox.x + bladeBox.w &&
          pBox.x + pBox.w > bladeBox.x &&
          pBox.y < bladeBox.y + bladeBox.h &&
          pBox.y + pBox.h > bladeBox.y
        ) {
          if (this.activeSkill === 'SHIELD_BURST') {
            this.activeSkill = null;
            this.activeSkillTimer = 0;
            this.player.invulnerableTimer = 1.2;
            this.combo = 1;
            this.obstacles.clearNearObstacles(this.player.x, 180);
            this.particles.emitExplosion(this.player.x + 10, this.player.y + 14, '#38bdf8');
            sound.playClick();
            return;
          }
          this.combo = 1;
          this.handlePlayerDeath();
          return;
        }
        continue;
      }

      const hBox = {
        x: h.x + 3,
        y: h.y + 3,
        w: h.width - 6,
        h: h.height - 6,
      };

      // AABB overlap check
      if (
        pBox.x < hBox.x + hBox.w &&
        pBox.x + pBox.w > hBox.x &&
        pBox.y < hBox.y + hBox.h &&
        pBox.y + pBox.h > hBox.y
      ) {
        // Collision hit!
        if (this.activeSkill === 'SHIELD_BURST') {
          // Absorb hit with shield
          this.activeSkill = null;
          this.activeSkillTimer = 0;
          this.player.invulnerableTimer = 1.2;
          this.combo = 1; // reset combo on hit
          this.obstacles.clearNearObstacles(this.player.x, 180);
          this.particles.emitExplosion(this.player.x + 10, this.player.y + 14, '#38bdf8');
          sound.playClick();
          return;
        }

        // Fatal collision
        this.combo = 1;
        this.handlePlayerDeath();
        return;
      }
    }

    // Check boss projectiles
    for (const p of this.bosses.bossProjectiles) {
      const dist = Math.hypot(
        (pBox.x + pBox.w / 2) - p.x,
        (pBox.y + pBox.h / 2) - p.y
      );
      if (dist < p.radius + 10) {
        if (this.activeSkill === 'SHIELD_BURST') {
          this.activeSkill = null;
          this.player.invulnerableTimer = 1.2;
          this.particles.emitExplosion(p.x, p.y, '#38bdf8');
          return;
        }
        this.handlePlayerDeath();
        return;
      }
    }
  }

  // --- RENDERING ---

  private render() {
    const ctx = this.ctx;
    ctx.save();

    // Screen Shake transform
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake;
      const shakeY = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(shakeX, shakeY);
    }

    const pal = this.palette.getCurrentPalette();
    const activeWorld = WORLDS_CONFIG.find((w) => w.id === this.saveData.selectedWorld) || WORLDS_CONFIG[0];
    const activeSkin = CHARACTER_SKINS.find((s) => s.id === this.saveData.selectedCharacter) || CHARACTER_SKINS[0];

    if (this.isFlying) {
      // 1. DEDICATED FLIGHT-MODE MAP (Flappy Bird Inspired Stone Pillars, Dangerous Ceilings & Floors)
      this.flightManager.render(ctx, this.player.animTimer, this.flightDistance / FLIGHT_PHYSICS.DURATION_METERS);
    } else {
      // 1. Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
      skyGrad.addColorStop(0, pal.skyTop);
      skyGrad.addColorStop(1, pal.skyBottom);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // 2. Parallax Layer 1: Distant Skyline Silhouette
      this.drawDistantCity(ctx, pal.bgFar, this.bgFarOffset);

      // 3. Parallax Layer 2: Mid-ground Cranes, Towers, Neon
      this.drawMidgroundIndustrial(ctx, pal.bgMid, this.bgMidOffset);

      // 4. Parallax Layer 3: Foreground Rooftop Structures
      this.drawNearBuildings(ctx, pal.bgNear, this.bgNearOffset);

      // 5. Ground Road & Sidewalk
      this.drawGround(ctx, pal.ground, pal.groundTrim, this.groundOffset);

      // 6. Draw Ground Hazards & Obstacles
      for (const h of this.obstacles.hazards) {
        SpriteRenderer.drawHazard(ctx, h, this.player.animTimer);
      }
      for (const bh of this.bosses.bossHazards) {
        SpriteRenderer.drawHazard(ctx, bh, this.player.animTimer);
      }

      // 7. Draw Ground Gold Coins
      for (const c of this.obstacles.coins) {
        if (!c.collected) {
          SpriteRenderer.drawCoin(ctx, c);
        }
      }

      // 8.5 Draw Stasis Rescue Capsule (Friend Pod)
      if (this.rescueBox && !this.rescueBox.shattered) {
        const isNear = Math.abs((this.player.x + this.player.width) - this.rescueBox.x) < 40;
        SpriteRenderer.drawRescueBox(ctx, this.rescueBox, this.player.animTimer, this.isWaitingAtRescueBox || isNear);
      }
    }

    // 7. Draw Boss Projectiles
    this.bosses.drawProjectiles(ctx);

    // 9. Draw Boss (if active)
    if (this.bosses.currentBoss) {
      SpriteRenderer.drawBoss(ctx, this.bosses.currentBoss, this.player.animTimer);
      this.drawBossIntroBanner(ctx, this.bosses.currentBoss);

      // Draw floating Titan One-Shot Power-Up
      if (this.bosses.currentBoss.powerUp && !this.bosses.currentBoss.powerUp.collected) {
        SpriteRenderer.drawBossPowerUp(
          ctx,
          this.bosses.currentBoss.powerUp.x,
          this.bosses.currentBoss.powerUp.y,
          this.player.animTimer
        );
      }

      // Draw one-shot hyper strike connecting runner to boss
      if (this.bosses.currentBoss.state === 'STRIKE') {
        SpriteRenderer.drawOneShotStrike(
          ctx,
          this.player.x + 10,
          this.player.y + 14,
          this.bosses.currentBoss.x,
          this.bosses.currentBoss.y,
          this.bosses.currentBoss.oneShotStrikeTimer || 0.5
        );
      }
    }

    // 9.5 Draw Ghost Runner (Personal Best recorded playback)
    if (this.saveData.ghostModeEnabled && this.saveData.ghostRunData && this.saveData.ghostRunData.snapshots.length > 0) {
      const ghostIndex = Math.min(
        Math.floor(this.runTime / 0.15),
        this.saveData.ghostRunData.snapshots.length - 1
      );
      const ghostSnap = this.saveData.ghostRunData.snapshots[ghostIndex];
      const ghostScreenX = this.player.x + (ghostSnap.d - this.distance) * 2.2;
      if (ghostScreenX >= -60 && ghostScreenX <= CANVAS_WIDTH + 60) {
        SpriteRenderer.drawGhostRunner(
          ctx,
          ghostScreenX,
          ghostSnap.y,
          ghostSnap.state,
          this.player.animTimer,
          (this.ghostDelta ?? 0) >= 0
        );
      }
    }

    // 9.7 Draw Rescued Tag-Team Partner (Runs alongside with second-life ready)
    if (this.tagTeamPartner?.active) {
      const partnerSkin = CHARACTER_SKINS.find((s) => s.id === this.tagTeamPartner!.skinId) || CHARACTER_SKINS[1];
      SpriteRenderer.drawTagTeamPartner(ctx, this.tagTeamPartner, partnerSkin, this.player.animTimer);
    }

    // 10. Draw Runner
    SpriteRenderer.drawRunner(
      ctx,
      this.player.x,
      this.player.y,
      this.player.animState,
      this.player.animTimer,
      activeSkin,
      {
        wing: this.saveData.selectedWing,
        head: this.saveData.selectedHead,
        companion: this.saveData.selectedCompanion,
      },
      this.player.invulnerableTimer > 0,
      !!this.bosses.currentBoss?.powerSurgeActive,
      this.isFlying
    );

    // Draw active Shield Dome bubble if shielded
    if (this.activeSkill === 'SHIELD_BURST') {
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.player.x + 10, this.player.y + 14, 22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.fill();
      ctx.restore();
    }

    // 11. Particles & Floating Texts
    this.particles.draw(ctx);

    ctx.restore();
  }

  // --- PARALLAX BACKGROUND DRAWING ---

  private drawDistantCity(ctx: CanvasRenderingContext2D, color: string, offset: number) {
    ctx.fillStyle = color;
    // Spire skyline blocks repeated horizontally
    const skyline = [
      { w: 32, h: 90 }, { w: 24, h: 120 }, { w: 45, h: 80 }, { w: 18, h: 140 },
      { w: 38, h: 100 }, { w: 28, h: 70 }, { w: 50, h: 110 }, { w: 30, h: 95 },
      { w: 20, h: 130 }, { w: 40, h: 85 }, { w: 35, h: 105 }, { w: 25, h: 75 },
    ];

    let startX = -offset;
    while (startX < CANVAS_WIDTH + 60) {
      for (const b of skyline) {
        ctx.fillRect(Math.round(startX), GROUND_Y - b.h, b.w, b.h);
        // Distant illuminated windows
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        for (let wy = GROUND_Y - b.h + 12; wy < GROUND_Y - 10; wy += 14) {
          ctx.fillRect(Math.round(startX + 4), wy, 3, 4);
        }
        ctx.fillStyle = color;
        startX += b.w + 6;
      }
    }
  }

  private drawMidgroundIndustrial(ctx: CanvasRenderingContext2D, color: string, offset: number) {
    ctx.fillStyle = color;
    const structures = [
      { w: 45, h: 65, crane: true },
      { w: 60, h: 45, crane: false },
      { w: 35, h: 80, crane: true },
      { w: 55, h: 50, crane: false },
      { w: 40, h: 70, crane: false },
    ];

    let startX = -offset;
    while (startX < CANVAS_WIDTH + 80) {
      for (const s of structures) {
        ctx.fillRect(Math.round(startX), GROUND_Y - s.h, s.w, s.h);
        if (s.crane) {
          // Construction crane arm
          ctx.fillRect(Math.round(startX + s.w / 2 - 2), GROUND_Y - s.h - 30, 4, 30);
          ctx.fillRect(Math.round(startX - 10), GROUND_Y - s.h - 30, 50, 3);
          ctx.fillRect(Math.round(startX + 38), GROUND_Y - s.h - 27, 2, 14); // hoist cable
        }
        startX += s.w + 40;
      }
    }
  }

  private drawNearBuildings(ctx: CanvasRenderingContext2D, color: string, offset: number) {
    ctx.fillStyle = color;
    const rooftops = [
      { w: 70, h: 35 }, { w: 85, h: 25 }, { w: 60, h: 42 }, { w: 90, h: 30 },
    ];

    let startX = -offset;
    while (startX < CANVAS_WIDTH + 100) {
      for (const r of rooftops) {
        ctx.fillRect(Math.round(startX), GROUND_Y - r.h, r.w, r.h);
        // Air vent / HVAC box on roof
        ctx.fillStyle = '#18181b';
        ctx.fillRect(Math.round(startX + 12), GROUND_Y - r.h - 8, 14, 8);
        ctx.fillStyle = color;
        startX += r.w + 18;
      }
    }
  }

  private drawGround(ctx: CanvasRenderingContext2D, groundColor: string, trimColor: string, offset: number) {
    // Road asphalt
    ctx.fillStyle = groundColor;
    ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);

    // Curb edge line
    ctx.fillStyle = trimColor;
    ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, 3);

    // Dashed road lane stripes
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    for (let x = -offset; x < CANVAS_WIDTH + 32; x += 32) {
      ctx.fillRect(Math.round(x), GROUND_Y + 22, 16, 2);
    }
  }

  private drawBossIntroBanner(ctx: CanvasRenderingContext2D, boss: Boss) {
    if (boss.introBannerTimer <= 0) return;

    ctx.save();
    const alpha = Math.min(1, boss.introBannerTimer / 0.8);
    ctx.globalAlpha = alpha;

    // Slim, non-blocking top edge ticker (never covers playfield)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, 18);

    ctx.fillStyle = boss.color;
    ctx.fillRect(0, 17, CANVAS_WIDTH, 1.5);

    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillStyle = boss.color;
    ctx.textAlign = 'center';
    ctx.fillText(`! WARNING: ${boss.name} ENCOUNTER — ${boss.subtitle} !`, CANVAS_WIDTH / 2, 12);

    ctx.restore();
  }
}
