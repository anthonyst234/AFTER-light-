import { Hazard, HazardType, Coin } from './types';
import { CANVAS_WIDTH, GROUND_Y } from './constants';

interface PatternTemplate {
  name: string;
  minDistance: number;
  width: number;
  hazards: Array<{
    type: HazardType;
    relX: number;
    relY: number;
    width: number;
    height: number;
    slideAllowed?: boolean;
    jumpAllowed?: boolean;
    active?: boolean;
  }>;
  coins: Array<{
    relX: number;
    relY: number;
  }>;
}

export class ObstacleManager {
  hazards: Hazard[] = [];
  coins: Coin[] = [];
  private hazardId = 0;
  private coinId = 0;
  private lastSpawnX = CANVAS_WIDTH + 100;
  private minGapBetweenPatterns = 220; // Safe breathing room between patterns

  // 20+ Reusable Procedural Patterns (Fairness-Certified)
  private patterns: PatternTemplate[] = [
    // 1. Single Thorn Vine (easy jump)
    {
      name: 'Thorn Vine',
      minDistance: 0,
      width: 120,
      hazards: [
        { type: 'THORN_VINES', relX: 0, relY: GROUND_Y - 22, width: 26, height: 22, jumpAllowed: true },
      ],
      coins: [
        { relX: 13, relY: GROUND_Y - 50 },
        { relX: 40, relY: GROUND_Y - 60 },
        { relX: 70, relY: GROUND_Y - 50 },
      ],
    },
    // 2. High Laser Barrier (requires slide)
    {
      name: 'High Laser Slide',
      minDistance: 0,
      width: 140,
      hazards: [
        { type: 'LASER_BARRIER', relX: 0, relY: GROUND_Y - 48, width: 44, height: 26, slideAllowed: true, jumpAllowed: false },
      ],
      coins: [
        { relX: 10, relY: GROUND_Y - 14 },
        { relX: 30, relY: GROUND_Y - 14 },
        { relX: 50, relY: GROUND_Y - 14 },
      ],
    },
    // 3. Spike Bed Double Jump
    {
      name: 'Spike Bed Section',
      minDistance: 100,
      width: 160,
      hazards: [
        { type: 'SPIKE_BED', relX: 0, relY: GROUND_Y - 24, width: 48, height: 24, jumpAllowed: true },
      ],
      coins: [
        { relX: 10, relY: GROUND_Y - 55 },
        { relX: 25, relY: GROUND_Y - 75 },
        { relX: 40, relY: GROUND_Y - 55 },
      ],
    },
    // 4. Ground Saw Blade
    {
      name: 'Rotating Saw',
      minDistance: 150,
      width: 140,
      hazards: [
        { type: 'ROTATING_SAW', relX: 0, relY: GROUND_Y - 28, width: 28, height: 28, jumpAllowed: true },
      ],
      coins: [
        { relX: 14, relY: GROUND_Y - 60 },
        { relX: 45, relY: GROUND_Y - 70 },
        { relX: 75, relY: GROUND_Y - 45 },
      ],
    },
    // 5. Overhead Guillotine (slide or wait)
    {
      name: 'Guillotine Pass',
      minDistance: 250,
      width: 150,
      hazards: [
        { type: 'GUILLOTINE', relX: 0, relY: GROUND_Y - 56, width: 36, height: 56, slideAllowed: true },
      ],
      coins: [
        { relX: 12, relY: GROUND_Y - 12 },
        { relX: 26, relY: GROUND_Y - 12 },
      ],
    },
    // 6. Flame Vent
    {
      name: 'Flame Vent Burst',
      minDistance: 200,
      width: 150,
      hazards: [
        { type: 'FLAME_VENT', relX: 0, relY: GROUND_Y - 32, width: 28, height: 32, active: true, jumpAllowed: true },
      ],
      coins: [
        { relX: 14, relY: GROUND_Y - 65 },
        { relX: 45, relY: GROUND_Y - 65 },
      ],
    },
    // 7. Swinging Pendulum Axe
    {
      name: 'Swinging Blade',
      minDistance: 350,
      width: 180,
      hazards: [
        { type: 'SWINGING_BLADE', relX: 20, relY: GROUND_Y - 60, width: 40, height: 60, jumpAllowed: true, slideAllowed: true },
      ],
      coins: [
        { relX: 0, relY: GROUND_Y - 16 },
        { relX: 40, relY: GROUND_Y - 16 },
        { relX: 80, relY: GROUND_Y - 16 },
      ],
    },
    // 8. Falling Crusher Block
    {
      name: 'Crusher Drop',
      minDistance: 450,
      width: 160,
      hazards: [
        { type: 'FALLING_CRUSHER', relX: 10, relY: GROUND_Y - 70, width: 36, height: 42, slideAllowed: true },
      ],
      coins: [
        { relX: 20, relY: GROUND_Y - 14 },
        { relX: 40, relY: GROUND_Y - 14 },
      ],
    },
    // 9. Electric Arcs
    {
      name: 'Electric Barrier',
      minDistance: 300,
      width: 150,
      hazards: [
        { type: 'ELECTRIC_HAZARD', relX: 0, relY: GROUND_Y - 30, width: 32, height: 30, jumpAllowed: true },
      ],
      coins: [
        { relX: 16, relY: GROUND_Y - 64 },
        { relX: 36, relY: GROUND_Y - 74 },
        { relX: 56, relY: GROUND_Y - 64 },
      ],
    },
    // 10. Spiked Hazard Wall
    {
      name: 'Spiked Wall Leap',
      minDistance: 600,
      width: 160,
      hazards: [
        { type: 'SPIKED_WALL', relX: 0, relY: GROUND_Y - 36, width: 22, height: 36, jumpAllowed: true },
      ],
      coins: [
        { relX: 11, relY: GROUND_Y - 65 },
        { relX: 35, relY: GROUND_Y - 80 },
        { relX: 60, relY: GROUND_Y - 50 },
      ],
    },
    // 11. Moving Spikes Patrol
    {
      name: 'Moving Spikes',
      minDistance: 700,
      width: 170,
      hazards: [
        { type: 'MOVING_SPIKE', relX: 10, relY: GROUND_Y - 22, width: 30, height: 22, jumpAllowed: true },
      ],
      coins: [
        { relX: 20, relY: GROUND_Y - 60 },
        { relX: 50, relY: GROUND_Y - 60 },
      ],
    },
    // 12. Falling Debris Girders
    {
      name: 'Falling Debris',
      minDistance: 800,
      width: 160,
      hazards: [
        { type: 'FALLING_DEBRIS', relX: 15, relY: GROUND_Y - 50, width: 28, height: 28, slideAllowed: true },
      ],
      coins: [
        { relX: 25, relY: GROUND_Y - 15 },
        { relX: 55, relY: GROUND_Y - 15 },
      ],
    },
    // 13. Collapsing Floor Tile
    {
      name: 'Collapsing Bridge',
      minDistance: 650,
      width: 180,
      hazards: [
        { type: 'COLLAPSING_FLOOR', relX: 10, relY: GROUND_Y - 12, width: 44, height: 12, jumpAllowed: true },
      ],
      coins: [
        { relX: 20, relY: GROUND_Y - 40 },
        { relX: 45, relY: GROUND_Y - 50 },
      ],
    },
    // 14. Hidden Pop-up Trap
    {
      name: 'Hidden Floor Spikes',
      minDistance: 500,
      width: 150,
      hazards: [
        { type: 'HIDDEN_TRAP', relX: 10, relY: GROUND_Y - 20, width: 26, height: 20, active: true, jumpAllowed: true },
      ],
      coins: [
        { relX: 20, relY: GROUND_Y - 55 },
      ],
    },
    // 15. Combination: Low laser + high vine jump
    {
      name: 'Slide Then Leap',
      minDistance: 750,
      width: 240,
      hazards: [
        { type: 'LASER_BARRIER', relX: 0, relY: GROUND_Y - 46, width: 36, height: 24, slideAllowed: true },
        { type: 'THORN_VINES', relX: 110, relY: GROUND_Y - 22, width: 24, height: 22, jumpAllowed: true },
      ],
      coins: [
        { relX: 15, relY: GROUND_Y - 14 },
        { relX: 70, relY: GROUND_Y - 30 },
        { relX: 122, relY: GROUND_Y - 60 },
      ],
    },
    // 16. Combination: Double Saw Rhythm
    {
      name: 'Double Saw Cadence',
      minDistance: 900,
      width: 260,
      hazards: [
        { type: 'ROTATING_SAW', relX: 0, relY: GROUND_Y - 26, width: 26, height: 26, jumpAllowed: true },
        { type: 'ROTATING_SAW', relX: 120, relY: GROUND_Y - 26, width: 26, height: 26, jumpAllowed: true },
      ],
      coins: [
        { relX: 13, relY: GROUND_Y - 60 },
        { relX: 65, relY: GROUND_Y - 20 },
        { relX: 133, relY: GROUND_Y - 60 },
      ],
    },
    // 17. Combination: Crusher underpass + Flame Vent
    {
      name: 'Crusher to Vent',
      minDistance: 1100,
      width: 250,
      hazards: [
        { type: 'FALLING_CRUSHER', relX: 0, relY: GROUND_Y - 68, width: 36, height: 40, slideAllowed: true },
        { type: 'FLAME_VENT', relX: 110, relY: GROUND_Y - 30, width: 26, height: 30, active: true, jumpAllowed: true },
      ],
      coins: [
        { relX: 15, relY: GROUND_Y - 12 },
        { relX: 70, relY: GROUND_Y - 25 },
        { relX: 123, relY: GROUND_Y - 65 },
      ],
    },
    // 18. Combination: Multi-tier Spike Trench
    {
      name: 'Spike Trench Arc',
      minDistance: 1200,
      width: 220,
      hazards: [
        { type: 'SPIKE_BED', relX: 20, relY: GROUND_Y - 24, width: 64, height: 24, jumpAllowed: true },
      ],
      coins: [
        { relX: 10, relY: GROUND_Y - 40 },
        { relX: 30, relY: GROUND_Y - 70 },
        { relX: 52, relY: GROUND_Y - 90 },
        { relX: 74, relY: GROUND_Y - 70 },
        { relX: 95, relY: GROUND_Y - 40 },
      ],
    },
    // 19. Combination: High Electric field + ground creep
    {
      name: 'Electric Field & Vine',
      minDistance: 1400,
      width: 250,
      hazards: [
        { type: 'ELECTRIC_HAZARD', relX: 0, relY: GROUND_Y - 50, width: 36, height: 28, slideAllowed: true },
        { type: 'THORN_VINES', relX: 120, relY: GROUND_Y - 24, width: 28, height: 24, jumpAllowed: true },
      ],
      coins: [
        { relX: 18, relY: GROUND_Y - 14 },
        { relX: 70, relY: GROUND_Y - 30 },
        { relX: 134, relY: GROUND_Y - 64 },
      ],
    },
    // 20. Pure Golden Coin Runway (Bonus Relief)
    {
      name: 'Golden Highway',
      minDistance: 50,
      width: 220,
      hazards: [],
      coins: [
        { relX: 20, relY: GROUND_Y - 25 },
        { relX: 50, relY: GROUND_Y - 35 },
        { relX: 80, relY: GROUND_Y - 45 },
        { relX: 110, relY: GROUND_Y - 45 },
        { relX: 140, relY: GROUND_Y - 35 },
        { relX: 170, relY: GROUND_Y - 25 },
      ],
    },
  ];

  update(
    speed: number,
    dt: number,
    distanceTraveled: number,
    bossActive: boolean
  ) {
    const moveDist = speed * dt;

    // Dynamically adjust pattern gap for progressive difficulty (scales from 220 down to 175)
    this.minGapBetweenPatterns = Math.max(175, 220 - Math.floor(distanceTraveled / 1000) * 5);

    // Move hazards
    for (let i = this.hazards.length - 1; i >= 0; i--) {
      const h = this.hazards[i];
      h.x -= moveDist;
      if (h.stateTimer !== undefined) {
        h.stateTimer += dt;
      }

      // Smooth horizontal patrol for MOVING_SPIKE
      if (h.type === 'MOVING_SPIKE') {
        h.x += Math.sin((h.stateTimer || 0) * 3) * 45 * dt;
      }

      // Kinetic Vault: obstacle leaps into the air
      if (h.isVaulted) {
        h.vy = (h.vy || -420) + 850 * dt;
        h.y += (h.vy || 0) * dt;
      }

      if (h.x + h.width < -60 || h.y < -120) {
        this.hazards.splice(i, 1);
      }
    }

    // Move coins
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const c = this.coins[i];
      c.x -= moveDist;
      c.animTimer += dt;
      c.y = c.baseY + Math.sin(c.animTimer * 5) * 3;
      if (c.x < -40 || c.collected) {
        this.coins.splice(i, 1);
      }
    }

    this.lastSpawnX -= moveDist;

    // Do not spawn procedural traps during active boss fight (boss spawns its own attacks)
    if (bossActive) return;

    // Spawn new pattern if screen space allows
    if (this.lastSpawnX < CANVAS_WIDTH + 80) {
      this.spawnNextPattern(distanceTraveled);
    }
  }

  private spawnNextPattern(distance: number) {
    // Filter available patterns by player's current distance
    const eligible = this.patterns.filter((p) => p.minDistance <= distance);
    if (eligible.length === 0) return;

    const pattern = eligible[Math.floor(Math.random() * eligible.length)];
    const startX = Math.max(CANVAS_WIDTH + 80, this.lastSpawnX + this.minGapBetweenPatterns);

    // Spawn hazards
    for (const hz of pattern.hazards) {
      this.hazards.push({
        id: ++this.hazardId,
        type: hz.type,
        x: startX + hz.relX,
        y: hz.relY,
        width: hz.width,
        height: hz.height,
        slideAllowed: hz.slideAllowed,
        jumpAllowed: hz.jumpAllowed,
        active: hz.active ?? true,
        stateTimer: 0,
      });
    }

    // Spawn coins
    for (const cn of pattern.coins) {
      this.coins.push({
        id: ++this.coinId,
        x: startX + cn.relX,
        y: cn.relY,
        baseY: cn.relY,
        collected: false,
        animTimer: Math.random() * 2,
      });
    }

    this.lastSpawnX = startX + pattern.width;
  }

  clearNearObstacles(playerX: number, radius = 320) {
    // Used on revival or shield explosion to ensure safe re-entry
    this.hazards = this.hazards.filter((h) => Math.abs(h.x - playerX) > radius);
  }

  reset() {
    this.hazards = [];
    this.coins = [];
    this.lastSpawnX = CANVAS_WIDTH + 100;
  }
}
