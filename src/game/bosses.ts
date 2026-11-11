import { Boss, BossType, Hazard } from './types';
import { CANVAS_WIDTH, GROUND_Y } from './constants';
import { sound } from './audio';

export class BossController {
  currentBoss: Boss | null = null;
  bossHazards: Hazard[] = [];
  bossProjectiles: { x: number; y: number; vx: number; vy: number; radius: number; color: string }[] = [];
  private hazardIdCounter = 10000;

  isBossActive(): boolean {
    return this.currentBoss !== null;
  }

  startBoss(type: BossType) {
    let name = 'THE VINEKEEPER';
    let subtitle = 'ANCIENT ARBOREAL BEHEMOTH';
    let duration = 12; // 12 seconds dodge barrage
    let color = '#10b981';
    let accentColor = '#064e3b';

    if (type === 'IRON_STAG') {
      name = 'THE IRON STAG';
      subtitle = 'BIOMECHANICAL APEX JUGGERNAUT';
      duration = 15; // 15 seconds dodge barrage
      color = '#38bdf8';
      accentColor = '#1e293b';
    } else if (type === 'HOLLOW_GIANT') {
      name = 'THE HOLLOW GIANT';
      subtitle = 'ABYSSAL REALITY EATER';
      duration = 18; // 18 seconds dodge barrage
      color = '#c084fc';
      accentColor = '#3b0764';
    } else if (type === 'VOID_COLOSSUS') {
      name = 'THE VOID COLOSSUS';
      subtitle = 'OBSIDIAN GRAVITY CORE';
      duration = 16;
      color = '#f43f5e';
      accentColor = '#881337';
    } else if (type === 'CHRONO_SPECTER') {
      name = 'THE CHRONO SPECTER';
      subtitle = 'TEMPORAL REALITY PHANTOM';
      duration = 18;
      color = '#f59e0b';
      accentColor = '#78350f';
    }

    this.currentBoss = {
      type,
      name,
      subtitle,
      x: CANVAS_WIDTH + 40, // slides into view from right
      y: GROUND_Y - 95,
      width: 80,
      height: 90,
      progress: 0,
      duration,
      timer: 0,
      attackTimer: 1.2, // fast initial barrage attack
      currentAttack: 'NONE',
      attackTelegraph: 0,
      state: 'ENTERING',
      introBannerTimer: 3.5,
      color,
      accentColor,
      powerUp: null,
      oneShotStrikeTimer: 0,
    };

    sound.playBossRoar();
    sound.setBossTheme(true);
  }

  update(
    dt: number,
    playerX: number,
    playerY: number,
    onVictory: (boss: Boss, rewardCoins: number) => void
  ) {
    if (!this.currentBoss) return;
    const b = this.currentBoss;

    if (b.introBannerTimer > 0) {
      b.introBannerTimer -= dt;
    }

    if (b.state === 'ENTERING') {
      // Move to combat chase position near right edge
      const targetX = CANVAS_WIDTH - 110;
      b.x += (targetX - b.x) * dt * 2.5;
      if (Math.abs(b.x - targetX) < 4) {
        b.x = targetX;
        b.state = 'ACTIVE';
      }
    } else if (b.state === 'ACTIVE') {
      // 10-20 second dodge barrage timer
      b.timer += dt;
      b.progress = Math.min(1, b.timer / b.duration);

      // Check if player survived the entire barrage without dying
      if (b.timer >= b.duration) {
        // Dodged all obstacles! Grant player the 'Power Surge' effect!
        b.state = 'VULNERABLE';
        b.powerSurgeActive = true;
        b.powerSurgeTimer = 5.0; // 5 seconds window to unleash one-shot attack
        this.bossHazards = [];
        this.bossProjectiles = [];
        b.powerUp = {
          x: CANVAS_WIDTH + 20,
          y: GROUND_Y - 45,
          collected: false,
          animTimer: 0,
        };
        sound.playSkillActivate();
        return;
      }

      // Attack cycle - spawns barrage of traps and projectiles
      b.attackTimer -= dt;
      if (b.attackTimer <= 0) {
        this.triggerBossAttack(b);
      }

      // Update active attack telegraph or execution
      if (b.attackTelegraph > 0) {
        b.attackTelegraph -= dt;
        if (b.attackTelegraph <= 0) {
          this.executeBossAttack(b);
        }
      }
    } else if (b.state === 'VULNERABLE') {
      // Countdown for Power Surge duration (auto-triggers if time expires)
      if (b.powerSurgeTimer !== undefined) {
        b.powerSurgeTimer -= dt;
        if (b.powerSurgeTimer <= 0) {
          this.triggerPowerSurgeStrike();
          return;
        }
      }

      // Staggered boss, power-up / surge orb glides towards runner
      if (b.powerUp && !b.powerUp.collected) {
        b.powerUp.animTimer += dt;
        b.powerUp.x -= 240 * dt;

        // Player touches power-up or gets close
        const pCenterX = playerX + 10;
        const pCenterY = playerY + 14;
        const dist = Math.hypot(pCenterX - b.powerUp.x, pCenterY - b.powerUp.y);

        if (dist < 42 || b.powerUp.x <= pCenterX + 15) {
          b.powerUp.collected = true;
          this.triggerPowerSurgeStrike();
        }
      }
    } else if (b.state === 'STRIKE') {
      // One-shot hyper strike connecting runner to boss!
      if (b.oneShotStrikeTimer !== undefined) {
        b.oneShotStrikeTimer -= dt;
        if (b.oneShotStrikeTimer <= 0) {
          b.state = 'DEFEATED';
          b.powerSurgeActive = false;
          sound.playBossDefeat();
          sound.setBossTheme(false);
          // Award exactly 200 coins for one-shotting the boss!
          onVictory(b, 200);
        }
      }
    } else if (b.state === 'DEFEATED') {
      // Dissolves into ground/sky
      b.y += dt * 50;
      b.x += dt * 65;
      if (b.y > GROUND_Y + 130) {
        this.currentBoss = null;
        this.bossHazards = [];
        this.bossProjectiles = [];
      }
    }

    // Update boss spawned hazards (move left at speed)
    for (let i = this.bossHazards.length - 1; i >= 0; i--) {
      const h = this.bossHazards[i];
      h.x -= 280 * dt;
      if (h.x + h.width < -50) {
        this.bossHazards.splice(i, 1);
      }
    }

    // Update boss projectiles
    for (let i = this.bossProjectiles.length - 1; i >= 0; i--) {
      const p = this.bossProjectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.x < -30 || p.y > GROUND_Y + 50) {
        this.bossProjectiles.splice(i, 1);
      }
    }
  }

  private triggerBossAttack(b: Boss) {
    b.attackTelegraph = 1.0; // 1 second warning telegraph
    sound.playTrapWarning();

    if (b.type === 'VINEKEEPER') {
      // Alternates between Vine Whip (jump over) and Ground Root Eruption
      b.currentAttack = Math.random() > 0.5 ? 'SHOCKWAVE' : 'LUNGE';
      b.attackTimer = 4.2;
    } else if (b.type === 'IRON_STAG') {
      // Charge across screen (requires slide or high jump) or Debris Shockwave
      b.currentAttack = Math.random() > 0.5 ? 'PROJECTILE' : 'LUNGE';
      b.attackTimer = 4.0;
    } else if (b.type === 'VOID_COLOSSUS') {
      b.currentAttack = Math.random() > 0.5 ? 'SHOCKWAVE' : 'SWIPE';
      b.attackTimer = 3.5;
    } else if (b.type === 'CHRONO_SPECTER') {
      b.currentAttack = Math.random() > 0.5 ? 'PROJECTILE' : 'SWIPE';
      b.attackTimer = 3.2;
    } else {
      // Hollow Giant: launches void orbs or shadow ground spikes
      b.currentAttack = Math.random() > 0.5 ? 'PROJECTILE' : 'SHOCKWAVE';
      b.attackTimer = 3.6;
    }
  }

  private executeBossAttack(b: Boss) {
    if (b.currentAttack === 'SWIPE') {
      // High energy slash requiring slide
      this.bossHazards.push({
        id: ++this.hazardIdCounter,
        type: 'LASER_BARRIER',
        x: b.x - 20,
        y: GROUND_Y - 50,
        width: 44,
        height: 22,
        slideAllowed: true,
        jumpAllowed: false,
      });
    } else if (b.currentAttack === 'SHOCKWAVE') {
      // Spawns low ground wave moving across screen
      this.bossHazards.push({
        id: ++this.hazardIdCounter,
        type: 'SPIKE_BED',
        x: b.x - 20,
        y: GROUND_Y - 24,
        width: 32,
        height: 24,
        slideAllowed: false,
        jumpAllowed: true,
      });
    } else if (b.currentAttack === 'LUNGE') {
      // Overhead swipe requiring slide under!
      this.bossHazards.push({
        id: ++this.hazardIdCounter,
        type: 'LASER_BARRIER',
        x: b.x - 20,
        y: GROUND_Y - 48,
        width: 38,
        height: 20,
        slideAllowed: true, // must slide under
        jumpAllowed: false,
      });
    } else if (b.currentAttack === 'PROJECTILE') {
      // Launches 2 aimed projectiles
      this.bossProjectiles.push({
        x: b.x - 10,
        y: b.y + 30,
        vx: -310,
        vy: -20,
        radius: 6,
        color: b.type === 'HOLLOW_GIANT' ? '#c084fc' : '#ea580c',
      });
      this.bossProjectiles.push({
        x: b.x - 10,
        y: b.y + 55,
        vx: -270,
        vy: 10,
        radius: 6,
        color: b.type === 'HOLLOW_GIANT' ? '#e879f9' : '#f59e0b',
      });
    }
    b.currentAttack = 'NONE';
  }

  drawProjectiles(ctx: CanvasRenderingContext2D) {
    for (const p of this.bossProjectiles) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(Math.round(p.x), Math.round(p.y), p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.round(p.x - 2), Math.round(p.y - 2), 4, 4);
    }
  }

  triggerPowerSurgeStrike(): boolean {
    if (!this.currentBoss || this.currentBoss.state !== 'VULNERABLE') return false;
    this.currentBoss.state = 'STRIKE';
    this.currentBoss.oneShotStrikeTimer = 0.5;
    this.currentBoss.powerSurgeActive = false;
    sound.playSkillActivate();
    sound.playDoubleJump();
    return true;
  }

  reset() {
    this.currentBoss = null;
    this.bossHazards = [];
    this.bossProjectiles = [];
    sound.setBossTheme(false);
  }
}
