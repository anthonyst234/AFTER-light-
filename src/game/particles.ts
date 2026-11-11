import { Particle, FloatingText } from './types';

export class ParticleManager {
  particles: Particle[] = [];
  floatingTexts: FloatingText[] = [];
  private textIdCounter = 0;

  // Maximum active particles for steady 60 FPS
  private maxParticles = 250;

  spawn(p: Omit<Particle, 'life'>) {
    if (this.particles.length >= this.maxParticles) {
      this.particles.shift(); // Evict oldest
    }
    this.particles.push({
      ...p,
      life: p.maxLife,
    });
  }

  spawnText(text: string, x: number, y: number, color = '#fbbf24') {
    this.floatingTexts.push({
      id: ++this.textIdCounter,
      text,
      x,
      y,
      color,
      alpha: 1,
      life: 0.8,
    });
  }

  // --- PRESET EMITTERS ---

  emitRunDust(x: number, y: number, color = '#94a3b8') {
    for (let i = 0; i < 2; i++) {
      this.spawn({
        x: x + (Math.random() * 6 - 3),
        y: y + Math.random() * 2,
        vx: -(Math.random() * 40 + 20),
        vy: -(Math.random() * 20 + 5),
        size: Math.random() * 2.5 + 1.5,
        color,
        alpha: 0.6,
        maxLife: 0.35,
        gravity: 15,
      });
    }
  }

  emitJumpBurst(x: number, y: number, color = '#e2e8f0') {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 0.8) + (Math.random() * Math.PI * 0.4);
      const speed = Math.random() * 70 + 30;
      this.spawn({
        x: x + (Math.random() * 12 - 6),
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3 + 2,
        color,
        alpha: 0.8,
        maxLife: 0.4,
        gravity: 80,
      });
    }
  }

  emitDoubleJumpSpin(x: number, y: number, color = '#38bdf8') {
    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2;
      const speed = Math.random() * 80 + 50;
      this.spawn({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3 + 2,
        color,
        alpha: 0.9,
        maxLife: 0.45,
        gravity: 30,
      });
    }
  }

  emitSlideSparks(x: number, y: number, color = '#f59e0b') {
    for (let i = 0; i < 3; i++) {
      this.spawn({
        x: x + Math.random() * 8,
        y: y - 2,
        vx: -(Math.random() * 90 + 40),
        vy: -(Math.random() * 40 + 10),
        size: Math.random() * 2 + 1,
        color,
        alpha: 0.9,
        maxLife: 0.3,
        gravity: 120,
      });
    }
  }

  emitCoinBurst(x: number, y: number) {
    const colors = ['#fde047', '#fbbf24', '#f59e0b', '#ffffff'];
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 90 + 30;
      this.spawn({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 2.5 + 1.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        maxLife: 0.5,
        gravity: 40,
      });
    }
  }

  emitRevivalWings(x: number, y: number) {
    // Holy feather blast
    for (let i = 0; i < 32; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 160 + 60;
      this.spawn({
        x,
        y: y - 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 2,
        color: i % 2 === 0 ? '#ffffff' : '#fde047',
        alpha: 1,
        maxLife: 0.8,
        gravity: 20,
      });
    }
  }

  emitDashTrail(x: number, y: number, color = '#38bdf8') {
    for (let i = 0; i < 4; i++) {
      this.spawn({
        x: x - i * 6,
        y: y + Math.random() * 20,
        vx: -(Math.random() * 120 + 80),
        vy: (Math.random() * 20 - 10),
        size: Math.random() * 3 + 2,
        color,
        alpha: 0.9,
        maxLife: 0.28,
      });
    }
  }

  emitNearMiss(x: number, y: number) {
    const colors = ['#67e8f9', '#ffffff', '#a855f7'];
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 60 + 40;
      this.spawn({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 2.5 + 1.5,
        color: colors[i % colors.length],
        alpha: 1,
        maxLife: 0.35,
        gravity: 10,
      });
    }
  }

  emitLevelUp(x: number, y: number) {
    const colors = ['#facc15', '#38bdf8', '#c084fc', '#ffffff'];
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 180 + 50;
      this.spawn({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 40,
        size: Math.random() * 3.5 + 2,
        color: colors[i % colors.length],
        alpha: 1,
        maxLife: 0.85,
        gravity: 70,
      });
    }
  }

  emitExplosion(x: number, y: number, color = '#f43f5e') {
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 120 + 40;
      this.spawn({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 1.5,
        color,
        alpha: 1,
        maxLife: 0.6,
        gravity: 150,
      });
    }
  }

  update(dt: number) {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.gravity) {
        p.vy += p.gravity * dt;
      }
      p.alpha = Math.max(0, p.life / p.maxLife);
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
        continue;
      }
      ft.y -= 35 * dt; // float upwards
      ft.alpha = Math.max(0, ft.life / 0.8);
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    // Render particles as crisp pixel squares
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      const s = Math.round(p.size);
      ctx.fillRect(Math.round(p.x), Math.round(p.y), s, s);
    }

    // Render floating texts with pixel font
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.fillStyle = ft.color;
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 3;
      ctx.fillText(ft.text, Math.round(ft.x), Math.round(ft.y));
      ctx.restore();
    }

    ctx.globalAlpha = 1;
  }

  clear() {
    this.particles = [];
    this.floatingTexts = [];
  }
}
