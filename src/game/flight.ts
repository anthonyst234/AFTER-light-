import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';
import { Coin } from './types';

export interface FlightObstaclePair {
  id: number;
  x: number;
  width: number;
  gapY: number;
  initialGapY: number;
  gapHeight: number;
  isMoving: boolean;
  moveSpeed: number;
  moveRange: number;
  tier: number;
  timer: number;
  coins: { x: number; y: number; collected: boolean }[];
}

export const FLIGHT_CEILING_Y = 22; // Dangerous spiked ceiling limit
export const FLIGHT_FLOOR_Y = 248;   // Dangerous spiked floor limit

export class FlightEnvironmentManager {
  pairs: FlightObstaclePair[] = [];
  private pairIdCounter = 0;
  private nextSpawnX = CANVAS_WIDTH + 80;
  currentTier = 1; // 1 for 5k, 2 for 10k, 3 for 15k, 4 for 20k+
  transitionAlpha = 1.0;
  isTransitioning = false;

  startExpedition(distance: number) {
    this.pairs = [];
    this.nextSpawnX = CANVAS_WIDTH + 80;
    this.currentTier = Math.min(4, Math.max(1, Math.floor(distance / 5000)));
    this.transitionAlpha = 1.0;
    this.isTransitioning = true;
  }

  update(speed: number, dt: number, playerX: number, playerY: number, onCoinCollect: () => void) {
    const moveDist = speed * dt;

    if (this.isTransitioning) {
      this.transitionAlpha = Math.max(0, this.transitionAlpha - dt * 2.5);
      if (this.transitionAlpha <= 0) {
        this.isTransitioning = false;
      }
    }

    // Move pillar pairs
    for (let i = this.pairs.length - 1; i >= 0; i--) {
      const p = this.pairs[i];
      p.x -= moveDist;
      p.timer += dt;

      // Handle vertical shifting pillars (Tier 2 and 4)
      if (p.isMoving) {
        p.gapY = p.initialGapY + Math.sin(p.timer * p.moveSpeed) * p.moveRange;
        // Clamp to safe margins
        p.gapY = Math.max(FLIGHT_CEILING_Y + p.gapHeight / 2 + 10, Math.min(FLIGHT_FLOOR_Y - p.gapHeight / 2 - 10, p.gapY));
      }

      // Check coin collection inside the gap
      for (const coin of p.coins) {
        if (!coin.collected) {
          const coinWorldX = p.x + coin.x;
          const coinWorldY = p.gapY + coin.y;
          const dist = Math.hypot((playerX + 10) - coinWorldX, (playerY + 14) - coinWorldY);
          if (dist < 22) {
            coin.collected = true;
            onCoinCollect();
          }
        }
      }

      // Remove off-screen pillars
      if (p.x + p.width < -60) {
        this.pairs.splice(i, 1);
      }
    }

    this.nextSpawnX -= moveDist;

    // Procedural generation of Flappy Bird style pillar pairs
    if (this.nextSpawnX < CANVAS_WIDTH + 80) {
      this.spawnPillarPair();
    }
  }

  private spawnPillarPair() {
    const pillarWidth = 38;
    // Spacing between vertical gates: 190px - 220px (fair, predictable reaction time)
    const spacing = Math.max(190, 220 - this.currentTier * 8);

    // Opening height: Tier 1: 88px, Tier 2: 84px, Tier 3: 80px, Tier 4: 76px (player height is 28px)
    const gapHeight = Math.max(76, 88 - (this.currentTier - 1) * 4);

    // Gap vertical position: comfortably between ceiling and floor
    const minCenterY = FLIGHT_CEILING_Y + gapHeight / 2 + 15;
    const maxCenterY = FLIGHT_FLOOR_Y - gapHeight / 2 - 15;
    const gapY = Math.floor(minCenterY + Math.random() * (maxCenterY - minCenterY));

    const isMoving = this.currentTier >= 2 && Math.random() < (this.currentTier === 2 ? 0.4 : 0.65);
    const moveSpeed = 1.6 + Math.random() * 0.8;
    const moveRange = Math.min(24, 15 + this.currentTier * 3);

    // Coins placed within the safe gap
    const coins: { x: number; y: number; collected: boolean }[] = [];
    if (Math.random() < 0.75) {
      coins.push({ x: pillarWidth / 2, y: 0, collected: false });
      if (this.currentTier >= 3) {
        coins.push({ x: pillarWidth / 2 - 14, y: -8, collected: false });
        coins.push({ x: pillarWidth / 2 + 14, y: 8, collected: false });
      }
    }

    const startX = Math.max(CANVAS_WIDTH + 80, this.nextSpawnX + spacing);

    this.pairs.push({
      id: ++this.pairIdCounter,
      x: startX,
      width: pillarWidth,
      gapY,
      initialGapY: gapY,
      gapHeight,
      isMoving,
      moveSpeed,
      moveRange,
      tier: this.currentTier,
      timer: Math.random() * Math.PI,
      coins,
    });

    this.nextSpawnX = startX;
  }

  checkCollision(playerBox: { x: number; y: number; w: number; h: number }): boolean {
    // 1. Spiked Dangerous Ceiling Hit
    if (playerBox.y <= FLIGHT_CEILING_Y) {
      return true;
    }

    // 2. Spiked Dangerous Floor Abyss Hit
    if (playerBox.y + playerBox.h >= FLIGHT_FLOOR_Y) {
      return true;
    }

    // 3. Narrow Passage Pillar Pairs
    for (const p of this.pairs) {
      // Horizontal AABB overlap with pillar
      if (playerBox.x + playerBox.w > p.x + 3 && playerBox.x < p.x + p.width - 3) {
        const topPillarBottom = p.gapY - p.gapHeight / 2;
        const bottomPillarTop = p.gapY + p.gapHeight / 2;

        // Hit top stone block / stalactite
        if (playerBox.y < topPillarBottom) {
          return true;
        }

        // Hit bottom stone block / stalagmite
        if (playerBox.y + playerBox.h > bottomPillarTop) {
          return true;
        }
      }
    }

    return false;
  }

  // --- RENDERING DEDICATED AERIAL ENVIRONMENT ---
  render(ctx: CanvasRenderingContext2D, animTimer: number, flightProgress: number) {
    ctx.save();

    // 1. Flight Sky Gradient (High-altitude atmospheric monochrome)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    skyGrad.addColorStop(0, '#020617'); // Dark void stratosphere
    skyGrad.addColorStop(0.5, '#0f172a');
    skyGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 2. Parallax Drifting Aerial Cloud Banks & Monoliths
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    for (let i = 0; i < 5; i++) {
      const cx = ((animTimer * 20 * (i + 1) + i * 140) % (CANVAS_WIDTH + 200)) - 100;
      const cy = 40 + i * 35;
      ctx.beginPath();
      ctx.arc(CANVAS_WIDTH - cx, cy, 35 + i * 10, 0, Math.PI * 2);
      ctx.arc(CANVAS_WIDTH - cx + 25, cy - 10, 25 + i * 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Distant floating monolith silhouettes
    ctx.fillStyle = '#0f172a';
    for (let m = 0; m < 4; m++) {
      const mx = ((animTimer * 15 + m * 170) % (CANVAS_WIDTH + 150));
      const my = 50 + m * 40;
      ctx.fillRect(CANVAS_WIDTH - mx, my, 22, 45);
      // Faint glowing rune on floating monolith
      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.fillRect(CANVAS_WIDTH - mx + 8, my + 14, 6, 16);
      ctx.fillStyle = '#0f172a';
    }

    // 3. Spiked Dangerous Ceiling (Top Stalactites)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, FLIGHT_CEILING_Y - 8);
    // Jagged tooth stalactites
    ctx.fillStyle = '#334155';
    for (let x = 0; x < CANVAS_WIDTH; x += 12) {
      const toothH = (x % 24 === 0) ? 14 : 9;
      ctx.beginPath();
      ctx.moveTo(x, FLIGHT_CEILING_Y - 8);
      ctx.lineTo(x + 6, FLIGHT_CEILING_Y - 8 + toothH);
      ctx.lineTo(x + 12, FLIGHT_CEILING_Y - 8);
      ctx.fill();
    }
    // Crimson laser warning line on ceiling
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(0, FLIGHT_CEILING_Y, CANVAS_WIDTH, 1.5);

    // 4. Spiked Dangerous Floor Abyss (Bottom Stalagmites)
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(0, FLIGHT_FLOOR_Y, CANVAS_WIDTH, 1.5);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, FLIGHT_FLOOR_Y + 8, CANVAS_WIDTH, CANVAS_HEIGHT - FLIGHT_FLOOR_Y);
    // Jagged tooth stalagmites
    ctx.fillStyle = '#334155';
    for (let x = 0; x < CANVAS_WIDTH; x += 12) {
      const toothH = (x % 24 === 0) ? 14 : 9;
      ctx.beginPath();
      ctx.moveTo(x, FLIGHT_FLOOR_Y + 8);
      ctx.lineTo(x + 6, FLIGHT_FLOOR_Y + 8 - toothH);
      ctx.lineTo(x + 12, FLIGHT_FLOOR_Y + 8);
      ctx.fill();
    }

    // 5. Vertical Pillar Pairs (Flappy Bird style stone passageways)
    for (const p of this.pairs) {
      const px = Math.round(p.x);
      const topH = Math.round(p.gapY - p.gapHeight / 2);
      const bottomY = Math.round(p.gapY + p.gapHeight / 2);
      const bottomH = Math.round(CANVAS_HEIGHT - bottomY);

      // Top Stone Pillar (hanging from ceiling)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(px, 0, p.width, topH);
      // Stone bevel highlight
      ctx.fillStyle = '#334155';
      ctx.fillRect(px + 2, 0, p.width - 4, topH - 4);
      // Carved stone blocks pattern
      ctx.fillStyle = '#0f172a';
      for (let sy = 12; sy < topH - 6; sy += 16) {
        ctx.fillRect(px + 4, sy, p.width - 8, 2);
      }
      // Pillar Cap / Opening rim
      ctx.fillStyle = '#475569';
      ctx.fillRect(px - 3, topH - 8, p.width + 6, 8);
      // Green/Cyan entrance light beacon
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(px + p.width / 2 - 3, topH - 6, 6, 4);

      // Bottom Stone Pillar (rising from floor)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(px, bottomY, p.width, bottomH);
      // Stone bevel highlight
      ctx.fillStyle = '#334155';
      ctx.fillRect(px + 2, bottomY + 4, p.width - 4, bottomH - 4);
      // Carved stone blocks pattern
      ctx.fillStyle = '#0f172a';
      for (let sy = bottomY + 12; sy < CANVAS_HEIGHT - 6; sy += 16) {
        ctx.fillRect(px + 4, sy, p.width - 8, 2);
      }
      // Pillar Cap / Opening rim
      ctx.fillStyle = '#475569';
      ctx.fillRect(px - 3, bottomY, p.width + 6, 8);
      // Green/Cyan entrance light beacon
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(px + p.width / 2 - 3, bottomY + 2, 6, 4);

      // Floating coins inside the gap
      for (const coin of p.coins) {
        if (!coin.collected) {
          const cx = Math.round(px + coin.x);
          const cy = Math.round(p.gapY + coin.y + Math.sin(animTimer * 6) * 3);
          // Golden floating coin
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(cx, cy, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(cx - 1, cy - 1, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 6. Transition Overlay (Smooth dissolve when entering aerial map)
    if (this.isTransitioning && this.transitionAlpha > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.transitionAlpha * 0.4})`;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    ctx.restore();
  }
}
