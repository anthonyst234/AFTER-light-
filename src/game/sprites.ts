import { CharacterSkin, WingType, HeadType, CompanionType, Hazard, Coin, Boss, RescueBox, TagTeamPartner } from './types';
import { GROUND_Y } from './constants';

export class SpriteRenderer {
  // --- DRAW PIXEL RECT HELPER ---
  private static px(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  // --- DRAW RUNNER SPRITE ---
  static drawRunner(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    state: 'RUN' | 'JUMP' | 'DOUBLE_JUMP' | 'FALL' | 'SLIDE' | 'DASH' | 'DEAD' | 'REVIVE' | 'FLY',
    animTimer: number,
    skin: CharacterSkin,
    equipped: {
      wing: WingType;
      head: HeadType;
      companion: CompanionType;
    },
    invulnerable: boolean = false,
    hasPowerSurge: boolean = false,
    isFlightMode: boolean = false
  ) {
    ctx.save();

    // Invulnerability blink effect
    if (invulnerable && Math.floor(animTimer * 20) % 2 === 0) {
      ctx.globalAlpha = 0.45;
    }

    const rx = Math.round(x);
    const ry = Math.round(y);

    // Power Surge crackling lightning aura
    if (hasPowerSurge) {
      ctx.save();
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 12;
      for (let i = 0; i < 5; i++) {
        const ang = animTimer * 12 + (i * Math.PI * 2) / 5;
        const lx = rx + 10 + Math.cos(ang) * 18;
        const ly = ry + 14 + Math.sin(ang) * 18;
        this.px(ctx, lx, ly, 3, 3, (i % 2 === 0) ? '#fde047' : '#38bdf8');
      }
      // Floating surge banner
      ctx.font = '7px "Press Start 2P", monospace';
      ctx.fillStyle = '#fde047';
      ctx.textAlign = 'center';
      ctx.fillText('⚡ POWER SURGE ⚡', rx + 10, ry - 14);
      ctx.restore();
    }

    // Dynamic Companion render
    if (equipped.companion !== 'NONE') {
      this.drawCompanion(ctx, rx - 14, ry - 16, equipped.companion, animTimer);
    }

    // Dynamic Wings (drawn behind player or on back)
    if (equipped.wing !== 'NONE') {
      this.drawWings(ctx, rx + 4, ry + 12, equipped.wing, animTimer, state);
    }

    if (state === 'DASH') {
      // --- SUPERSONIC DASH POSE (Speed lines + forward tilt) ---
      ctx.save();
      ctx.translate(rx + 12, ry + 14);
      ctx.rotate(0.22);
      ctx.translate(-(rx + 12), -(ry + 14));

      // Speed afterimage glow
      this.px(ctx, rx - 6, ry + 6, 26, 14, skin.accentColor);
      // Head
      this.px(ctx, rx + 16, ry + 2, 9, 8, skin.primaryColor);
      this.px(ctx, rx + 21, ry + 4, 3, 2, skin.eyeColor);
      // Torso
      this.px(ctx, rx + 6, ry + 7, 12, 10, skin.primaryColor);
      this.px(ctx, rx + 8, ry + 9, 8, 6, skin.accentColor);
      // Long streaming scarf
      const dashWave = Math.sin(animTimer * 40) * 2;
      this.px(ctx, rx - 10, ry + 6 + dashWave, 16, 3, skin.scarfColor);
      this.px(ctx, rx - 18, ry + 5 + dashWave, 10, 2, skin.scarfColor);
      // Tucked legs
      this.px(ctx, rx + 2, ry + 14, 8, 6, skin.accentColor);
      this.px(ctx, rx - 4, ry + 16, 8, 4, '#0f172a');
      // Forward thrust arm
      this.px(ctx, rx + 18, ry + 10, 8, 4, skin.primaryColor);

      ctx.restore();
    } else if (state === 'SLIDE') {
      // --- SLIDING SPRITE (Height 18, Width 32) ---
      // Low prone aerodynamic crawl
      // Head
      this.px(ctx, rx + 18, ry + 4, 8, 8, skin.primaryColor);
      this.px(ctx, rx + 23, ry + 6, 2, 2, skin.eyeColor); // eye glint
      // Scarf trailing back
      const flutter = Math.sin(animTimer * 25) * 2;
      this.px(ctx, rx + 4, ry + 4 + flutter, 14, 3, skin.scarfColor);
      this.px(ctx, rx, ry + 3 + flutter, 5, 2, skin.scarfColor);
      // Torso & jacket
      this.px(ctx, rx + 8, ry + 9, 14, 6, skin.primaryColor);
      this.px(ctx, rx + 10, ry + 11, 10, 3, skin.accentColor);
      // Legs stretched backwards
      this.px(ctx, rx + 2, ry + 12, 10, 4, skin.accentColor);
      this.px(ctx, rx, ry + 14, 4, 3, '#0f172a');
      // Extended slide arm
      this.px(ctx, rx + 22, ry + 12, 6, 3, skin.primaryColor);
    } else if (state === 'DEAD') {
      // --- COLLAPSED RUNNER SPRITE ---
      this.px(ctx, rx + 4, ry + 20, 20, 4, skin.primaryColor);
      this.px(ctx, rx + 22, ry + 18, 6, 6, skin.primaryColor);
      this.px(ctx, rx + 10, ry + 17, 10, 3, skin.accentColor);
      this.px(ctx, rx - 2, ry + 21, 8, 3, skin.scarfColor);
    } else if (state === 'DOUBLE_JUMP') {
      // --- SPIN AERIAL POSE ---
      ctx.translate(rx + 12, ry + 16);
      ctx.rotate(animTimer * 18);
      ctx.translate(-(rx + 12), -(ry + 16));

      this.px(ctx, rx + 6, ry + 6, 12, 12, skin.primaryColor);
      this.px(ctx, rx + 8, ry + 8, 8, 8, skin.accentColor);
      this.px(ctx, rx + 2, ry + 10, 20, 4, skin.scarfColor);
    } else if (state === 'FLY') {
      // --- ADVANCED SOARING FLIGHT POSE ---
      const wingFlap = Math.sin(animTimer * 16) * 6;
      const pitch = Math.sin(animTimer * 6) * 0.08;

      ctx.save();
      ctx.translate(rx + 10, ry + 14);
      ctx.rotate(pitch);
      ctx.translate(-(rx + 10), -(ry + 14));

      // Dual Overdrive Flight Wings (if player has no wing equipped, render luminous energy wings!)
      if (equipped.wing === 'NONE') {
        // Holographic glider wings
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(rx + 4, ry + 10);
        ctx.lineTo(rx - 16, ry + 2 + wingFlap);
        ctx.lineTo(rx - 8, ry + 18);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#7dd3fc';
        ctx.beginPath();
        ctx.moveTo(rx + 6, ry + 8);
        ctx.lineTo(rx - 14, ry + 4 + wingFlap);
        ctx.lineTo(rx - 6, ry + 16);
        ctx.closePath();
        ctx.fill();
      }

      // Trailing jet thruster / slipstream particle line
      this.px(ctx, rx - 10, ry + 13, 8, 2, '#38bdf8');
      this.px(ctx, rx - 16, ry + 13, 5, 2, '#7dd3fc');

      // Head & visor (facing forward horizontally)
      this.px(ctx, rx + 14, ry + 4, 9, 8, skin.primaryColor);
      this.px(ctx, rx + 19, ry + 6, 3, 2, skin.eyeColor);

      // Torso & streamlined flight suit
      this.px(ctx, rx + 4, ry + 8, 14, 10, skin.primaryColor);
      this.px(ctx, rx + 6, ry + 10, 10, 6, skin.accentColor);

      // Streaming scarf flapping back
      const flutter = Math.sin(animTimer * 30) * 3;
      this.px(ctx, rx - 6, ry + 8 + flutter, 12, 3, skin.scarfColor);
      this.px(ctx, rx - 14, ry + 7 + flutter, 9, 2, skin.scarfColor);

      // Legs tucked back horizontally
      this.px(ctx, rx, ry + 12, 8, 4, skin.accentColor);
      this.px(ctx, rx - 4, ry + 13, 6, 3, '#0f172a');

      // Forward outstretched flight arm
      this.px(ctx, rx + 18, ry + 10, 8, 4, skin.primaryColor);

      if (equipped.head !== 'NONE') {
        this.drawHeadgear(ctx, rx + 14, ry + 4, equipped.head);
      }

      ctx.restore();
    } else {
      // --- RUNNING / JUMP / FALL POSE ---
      const runCycle = Math.floor(animTimer * 12) % 6;
      let bob = 0;
      let leg1Offset = 0;
      let leg2Offset = 0;

      if (state === 'RUN') {
        bob = (runCycle === 1 || runCycle === 4) ? 1 : 0;
        // 6-step leg swing
        const legFrames = [-4, -1, 3, 5, 1, -3];
        leg1Offset = legFrames[runCycle];
        leg2Offset = -legFrames[runCycle];
      } else if (state === 'JUMP') {
        bob = -2;
        leg1Offset = 3;
        leg2Offset = -2;
      } else if (state === 'FALL') {
        bob = 1;
        leg1Offset = -2;
        leg2Offset = -4;
      }

      const baseY = ry + bob;

      // Scarf trailing behind (physics wave)
      const wave = Math.sin(animTimer * 20) * 3;
      this.px(ctx, rx - 6, baseY + 9 + wave, 8, 3, skin.scarfColor);
      this.px(ctx, rx - 11, baseY + 8 + wave * 1.3, 6, 2, skin.scarfColor);

      // Back Arm
      this.px(ctx, rx + 6 - leg1Offset, baseY + 12, 4, 8, skin.accentColor);

      // Back Leg
      this.px(ctx, rx + 8 + leg2Offset, baseY + 18, 4, 10, skin.accentColor);
      this.px(ctx, rx + 8 + leg2Offset, baseY + 26, 6, 3, '#0f172a'); // shoe

      // Torso / Stylish Hoodie
      this.px(ctx, rx + 6, baseY + 8, 12, 12, skin.primaryColor);
      this.px(ctx, rx + 8, baseY + 10, 8, 8, skin.accentColor);
      // Scarf neck wrap
      this.px(ctx, rx + 5, baseY + 7, 13, 3, skin.scarfColor);

      // Head & Sleek Profile Mask/Visor
      this.px(ctx, rx + 8, baseY, 10, 8, skin.primaryColor);
      this.px(ctx, rx + 14, baseY + 2, 3, 3, skin.eyeColor); // Glowing visor/eye

      // Front Leg
      this.px(ctx, rx + 10 + leg1Offset, baseY + 18, 4, 10, skin.primaryColor);
      this.px(ctx, rx + 10 + leg1Offset, baseY + 26, 6, 3, '#0f172a'); // shoe

      // Front Arm
      this.px(ctx, rx + 12 + leg2Offset, baseY + 11, 4, 8, skin.primaryColor);

      // Headgear
      if (equipped.head !== 'NONE') {
        this.drawHeadgear(ctx, rx + 8, baseY, equipped.head);
      }
    }

    ctx.restore();
  }

  // --- DRAW WINGS ---
  private static drawWings(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    type: WingType,
    animTimer: number,
    state: string
  ) {
    const flap = Math.sin(animTimer * 16) * 4;
    const flapAng = (state === 'JUMP' || state === 'DOUBLE_JUMP') ? -0.25 : (flap * 0.05);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(flapAng);

    switch (type) {
      case 'PAPER_WINGS':
        // Origami triangular folded paper
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-14, -10 + flap);
        ctx.lineTo(-10, 4);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(-8, -4, 4, 6);
        break;

      case 'ANGEL_WINGS':
        // Pure feathered wings
        ctx.fillStyle = '#ffffff';
        this.px(ctx, -14, -12 + flap, 12, 6, '#ffffff');
        this.px(ctx, -18, -8 + flap, 14, 8, '#ffffff');
        this.px(ctx, -12, 0, 10, 6, '#f1f5f9');
        this.px(ctx, -6, -2, 6, 4, '#e2e8f0');
        // Divine halo glow
        ctx.shadowColor = '#fef08a';
        ctx.shadowBlur = 6;
        this.px(ctx, -16, -10 + flap, 4, 4, '#fef08a');
        break;

      case 'DARK_WINGS':
        // Raven shadow wings
        this.px(ctx, -16, -14 + flap, 14, 7, '#0f172a');
        this.px(ctx, -20, -7 + flap, 16, 9, '#1e293b');
        this.px(ctx, -12, 2, 10, 6, '#334155');
        this.px(ctx, -14, -10 + flap, 3, 3, '#a855f7');
        break;

      case 'MECHANICAL_WINGS':
        // Titanium thruster wings
        this.px(ctx, -16, -10 + flap, 12, 5, '#94a3b8');
        this.px(ctx, -14, -5 + flap, 10, 6, '#64748b');
        // Cyan thruster exhaust
        this.px(ctx, -20, -8 + flap, 4, 3, '#38bdf8');
        this.px(ctx, -22, -8 + flap, 2, 3, '#bae6fd');
        break;

      case 'GOLDEN_WINGS':
        // Auric gold feathers
        ctx.shadowColor = '#eab308';
        ctx.shadowBlur = 8;
        this.px(ctx, -16, -12 + flap, 14, 7, '#facc15');
        this.px(ctx, -18, -6 + flap, 16, 8, '#eab308');
        this.px(ctx, -10, 2, 8, 5, '#ca8a04');
        break;

      case 'CELESTIAL_WINGS':
        // Prismatic cosmic wings
        ctx.shadowColor = '#c084fc';
        ctx.shadowBlur = 10;
        this.px(ctx, -18, -14 + flap, 16, 8, '#f472b6');
        this.px(ctx, -22, -8 + flap, 18, 10, '#c084fc');
        this.px(ctx, -14, 2, 12, 6, '#38bdf8');
        break;
    }

    ctx.restore();
  }

  // --- DRAW HEADGEAR ---
  private static drawHeadgear(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    type: HeadType
  ) {
    switch (type) {
      case 'TINY_HALO':
        ctx.fillStyle = '#fde047';
        this.px(ctx, x - 2, y - 6, 14, 2, '#fde047');
        this.px(ctx, x, y - 7, 10, 1, '#ffffff');
        break;

      case 'CROWN':
        // 3-point golden crown
        this.px(ctx, x, y - 5, 10, 3, '#f59e0b');
        this.px(ctx, x, y - 8, 2, 3, '#fbbf24');
        this.px(ctx, x + 4, y - 9, 2, 4, '#fbbf24');
        this.px(ctx, x + 8, y - 8, 2, 3, '#fbbf24');
        this.px(ctx, x + 4, y - 5, 2, 2, '#ef4444'); // gem
        break;

      case 'HOOD':
        this.px(ctx, x - 2, y - 3, 13, 4, '#1e293b');
        this.px(ctx, x - 3, y - 1, 4, 8, '#1e293b');
        break;

      case 'HEADPHONES':
        // Neon band over head & ear cups
        this.px(ctx, x - 1, y - 4, 12, 2, '#06b6d4');
        this.px(ctx, x + 1, y + 1, 3, 6, '#f43f5e'); // neon cup
        break;

      case 'MASK':
        this.px(ctx, x + 4, y + 3, 7, 5, '#0f172a');
        this.px(ctx, x + 8, y + 4, 2, 2, '#38bdf8');
        break;

      case 'BANDANA':
        this.px(ctx, x - 1, y - 1, 12, 3, '#dc2626');
        this.px(ctx, x - 5, y, 4, 2, '#dc2626');
        this.px(ctx, x - 8, y + 1, 3, 2, '#b91c1c');
        break;
    }
  }

  // --- DRAW COMPANION ---
  private static drawCompanion(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    type: CompanionType,
    animTimer: number
  ) {
    const bob = Math.sin(animTimer * 5) * 4;
    const cx = Math.round(x);
    const cy = Math.round(y + bob);

    switch (type) {
      case 'POCKET_BIRD':
        // Tiny fluttering bird
        this.px(ctx, cx, cy, 6, 5, '#38bdf8');
        this.px(ctx, cx + 4, cy + 1, 2, 2, '#fbbf24'); // beak
        const wingFlap = Math.sin(animTimer * 20) * 3;
        this.px(ctx, cx - 1, cy - 2 + wingFlap, 4, 3, '#0284c7');
        break;

      case 'FLOATING_SPIRIT':
        ctx.shadowColor = '#67e8f9';
        ctx.shadowBlur = 6;
        this.px(ctx, cx, cy, 8, 8, '#cffafe');
        this.px(ctx, cx + 2, cy + 2, 4, 4, '#67e8f9');
        this.px(ctx, cx + 1, cy + 7, 6, 3, '#a5f3fc');
        break;

      case 'MINI_ROBOT':
        this.px(ctx, cx, cy, 8, 7, '#64748b');
        this.px(ctx, cx + 2, cy + 2, 4, 2, '#38bdf8'); // visor
        this.px(ctx, cx + 3, cy - 3, 2, 3, '#94a3b8'); // antenna
        this.px(ctx, cx + 2, cy + 7, 4, 2, '#f59e0b'); // mini thruster
        break;

      case 'TINY_GHOST':
        this.px(ctx, cx, cy, 8, 8, '#f1f5f9');
        this.px(ctx, cx + 2, cy + 2, 2, 2, '#0f172a'); // eyes
        this.px(ctx, cx + 5, cy + 2, 2, 2, '#0f172a');
        const skirt = Math.sin(animTimer * 12) * 2;
        this.px(ctx, cx, cy + 8, 8, 3 + skirt, '#e2e8f0');
        break;
    }
  }

  // --- DRAW COIN ---
  static drawCoin(ctx: CanvasRenderingContext2D, coin: Coin) {
    const cx = Math.round(coin.x);
    const cy = Math.round(coin.y);
    const frame = Math.floor(coin.animTimer * 8) % 6;

    // 6-step coin rotating widths: 12 -> 9 -> 5 -> 2 -> 5 -> 9
    const widths = [12, 10, 6, 2, 6, 10];
    const w = widths[frame];
    const offsetX = Math.round((12 - w) / 2);

    ctx.save();
    // Gold outer border
    this.px(ctx, cx + offsetX, cy, w, 12, '#ca8a04');
    // Bright gold core
    if (w > 3) {
      this.px(ctx, cx + offsetX + 1, cy + 1, w - 2, 10, '#facc15');
      // Highlight glint
      this.px(ctx, cx + offsetX + 2, cy + 2, Math.max(1, w - 4), 3, '#fef08a');
      this.px(ctx, cx + offsetX + 2, cy + 7, Math.max(1, w - 4), 2, '#eab308');
    }
    ctx.restore();
  }

  // --- DRAW HAZARD / TRAP ---
  static drawHazard(ctx: CanvasRenderingContext2D, h: Hazard, animTimer: number) {
    const hx = Math.round(h.x);
    const hy = Math.round(h.y);

    ctx.save();

    switch (h.type) {
      case 'THORN_VINES': {
        // Ground creep thorns with sharp points
        this.px(ctx, hx, hy + h.height - 4, h.width, 4, '#14532d');
        const spikes = Math.floor(h.width / 10);
        for (let i = 0; i < spikes; i++) {
          const sx = hx + i * 10 + 2;
          const sway = Math.sin(animTimer * 6 + i) * 2;
          this.px(ctx, sx, hy + 4 + sway, 5, h.height - 8, '#15803d');
          this.px(ctx, sx + 1, hy + sway, 3, 5, '#4ade80');
          this.px(ctx, sx + 2, hy - 2 + sway, 1, 3, '#86efac'); // thorn tip
        }
        break;
      }

      case 'SPIKE_BED': {
        // Metal/stone spikes emerging from floor
        this.px(ctx, hx, hy + h.height - 4, h.width, 4, '#334155');
        const count = Math.floor(h.width / 8);
        for (let i = 0; i < count; i++) {
          const spX = hx + i * 8;
          this.px(ctx, spX + 2, hy, 4, h.height - 4, '#94a3b8');
          this.px(ctx, spX + 3, hy - 3, 2, 4, '#e2e8f0');
          this.px(ctx, spX + 1, hy + 4, 2, h.height - 8, '#cbd5e1');
        }
        break;
      }

      case 'ROTATING_SAW': {
        // Circular spinning blade
        ctx.translate(hx + h.width / 2, hy + h.height / 2);
        ctx.rotate(animTimer * 14);

        const r = h.width / 2;
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(0, 0, r - 3, 0, Math.PI * 2);
        ctx.fill();

        // Jagged teeth
        ctx.fillStyle = '#e2e8f0';
        for (let a = 0; a < 8; a++) {
          const ang = (a / 8) * Math.PI * 2;
          const tx = Math.cos(ang) * r;
          const ty = Math.sin(ang) * r;
          ctx.fillRect(tx - 2, ty - 2, 4, 4);
        }

        // Center rivet
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'SWINGING_BLADE': {
        // Large blade hanging from ceiling chain swinging back and forth
        const pivotX = hx + h.width / 2;
        const pivotY = 0;
        const swingAngle = Math.sin(animTimer * 3.5) * 0.7;

        ctx.translate(pivotX, pivotY);
        ctx.rotate(swingAngle);

        // Chain links down
        const chainLen = hy - pivotY + h.height / 2;
        for (let cy = 0; cy < chainLen; cy += 8) {
          this.px(ctx, -2, cy, 4, 6, '#475569');
          this.px(ctx, -1, cy + 2, 2, 3, '#94a3b8');
        }

        // Curved axe head
        this.px(ctx, -14, chainLen - 12, 28, 24, '#64748b');
        this.px(ctx, -18, chainLen - 4, 36, 12, '#cbd5e1');
        this.px(ctx, -20, chainLen + 4, 40, 4, '#f8fafc'); // blade edge
        break;
      }

      case 'FLAME_VENT': {
        // Floor vent pipe
        this.px(ctx, hx, hy + h.height - 8, h.width, 8, '#334155');
        this.px(ctx, hx + 3, hy + h.height - 10, h.width - 6, 2, '#475569');

        if (h.active) {
          // Blasting flame column
          const flameH = h.height - 8;
          for (let f = 0; f < 3; f++) {
            const flicker = Math.sin(animTimer * 30 + f) * 3;
            this.px(ctx, hx + 4 + f * 5, hy + flicker, 5, flameH, '#ea580c');
            this.px(ctx, hx + 5 + f * 5, hy + 4 + flicker, 3, flameH - 6, '#facc15');
          }
        } else {
          // Warning smoke puffs
          if (h.telegraphTimer && h.telegraphTimer > 0) {
            const puff = Math.sin(animTimer * 20) * 2;
            this.px(ctx, hx + h.width / 2 - 2 + puff, hy + h.height - 14, 4, 4, '#fb923c');
          }
        }
        break;
      }

      case 'FALLING_CRUSHER': {
        // Spiked stone block suspended above
        this.px(ctx, hx, hy, h.width, h.height, '#475569');
        this.px(ctx, hx + 2, hy + 2, h.width - 4, h.height - 8, '#64748b');
        // Bottom crusher spikes
        const sc = Math.floor(h.width / 8);
        for (let s = 0; s < sc; s++) {
          this.px(ctx, hx + s * 8 + 2, hy + h.height, 4, 6, '#cbd5e1');
        }
        // Red warning eyes
        this.px(ctx, hx + 6, hy + 10, 4, 4, '#ef4444');
        this.px(ctx, hx + h.width - 10, hy + 10, 4, 4, '#ef4444');

        // Warning ground shadow
        this.px(ctx, hx, GROUND_Y - 2, h.width, 2, 'rgba(239, 68, 68, 0.45)');
        break;
      }

      case 'LASER_BARRIER': {
        // High laser requiring slide, or vertical gate
        // Pylon emitters
        this.px(ctx, hx - 4, hy - 4, 6, h.height + 8, '#0f172a');
        this.px(ctx, hx + h.width - 2, hy - 4, 6, h.height + 8, '#0f172a');

        // Laser beam with pulsing core
        const pulse = Math.sin(animTimer * 25) * 1.5;
        ctx.fillStyle = '#06b6d4';
        ctx.fillRect(hx, hy + 2 - pulse / 2, h.width, h.height - 4 + pulse);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hx, hy + 4, h.width, Math.max(1, h.height - 8));
        break;
      }

      case 'COLLAPSING_FLOOR': {
        // Stone platform that shatters
        this.px(ctx, hx, hy, h.width, h.height, '#3f3f46');
        this.px(ctx, hx + 1, hy + 1, h.width - 2, h.height - 2, '#52525b');
        if (h.isTriggered) {
          // Crack lines
          this.px(ctx, hx + 10, hy + 2, 2, h.height - 4, '#ef4444');
          this.px(ctx, hx + 22, hy + 4, 3, h.height - 6, '#ef4444');
        }
        break;
      }

      case 'MOVING_SPIKE': {
        // Ground spike patrol moving back and forth
        this.px(ctx, hx, hy + h.height - 4, h.width, 4, '#0f172a');
        this.px(ctx, hx + 4, hy, h.width - 8, h.height - 4, '#ef4444');
        this.px(ctx, hx + 6, hy - 3, h.width - 12, 3, '#fca5a5');
        break;
      }

      case 'ELECTRIC_HAZARD': {
        // Electric field arcing between pylons
        this.px(ctx, hx, hy, 6, h.height, '#1e293b');
        this.px(ctx, hx + h.width - 6, hy, 6, h.height, '#1e293b');
        // Arc
        const boltOffset = Math.sin(animTimer * 40) * 4;
        this.px(ctx, hx + 6, hy + h.height / 2 + boltOffset, h.width - 12, 3, '#38bdf8');
        this.px(ctx, hx + 6, hy + h.height / 2 + boltOffset + 1, h.width - 12, 1, '#ffffff');
        break;
      }

      case 'GUILLOTINE': {
        // Scaffolding + high-speed blade
        this.px(ctx, hx, hy, 4, h.height, '#475569');
        this.px(ctx, hx + h.width - 4, hy, 4, h.height, '#475569');
        this.px(ctx, hx, hy, h.width, 4, '#334155');
        // Blade: smooth drop and rise with clear overhead clearance
        const dropProgress = (Math.sin((h.stateTimer || 0) * 5) + 1) / 2;
        const bladeY = hy + 4 + dropProgress * (h.height - 22);
        this.px(ctx, hx + 4, bladeY, h.width - 8, 12, '#cbd5e1');
        this.px(ctx, hx + 4, bladeY + 10, h.width - 8, 2, '#f8fafc');
        break;
      }

      case 'SPIKED_WALL': {
        // Hazard striped concrete barrier
        this.px(ctx, hx, hy, h.width, h.height, '#18181b');
        for (let s = 0; s < h.height; s += 8) {
          this.px(ctx, hx + 2, hy + s, h.width - 4, 4, (s % 16 === 0) ? '#eab308' : '#18181b');
        }
        // Wall spikes
        this.px(ctx, hx - 4, hy + 6, 4, 6, '#ef4444');
        this.px(ctx, hx - 4, hy + 18, 4, 6, '#ef4444');
        break;
      }

      case 'FALLING_DEBRIS': {
        // Broken girder / boulder falling
        this.px(ctx, hx, hy, h.width, h.height, '#78350f');
        this.px(ctx, hx + 2, hy + 2, h.width - 4, h.height - 4, '#92400e');
        this.px(ctx, hx + 4, hy + 4, 4, 4, '#d97706');
        break;
      }

      case 'HIDDEN_TRAP': {
        // Trap plate popping spikes
        this.px(ctx, hx, hy + h.height - 3, h.width, 3, '#27272a');
        if (h.active) {
          this.px(ctx, hx + 2, hy, h.width - 4, h.height - 3, '#dc2626');
          this.px(ctx, hx + 4, hy - 4, h.width - 8, 4, '#f87171');
        }
        break;
      }

      default: {
        // Combination or generic fallback trap
        this.px(ctx, hx, hy, h.width, h.height, '#ef4444');
        this.px(ctx, hx + 2, hy + 2, h.width - 4, h.height - 4, '#f87171');
      }
    }

    ctx.restore();
  }

  // --- DRAW BOSSES ---
  static drawBoss(ctx: CanvasRenderingContext2D, boss: Boss, animTimer: number) {
    const bx = Math.round(boss.x);
    const by = Math.round(boss.y);

    ctx.save();

    if (boss.type === 'VINEKEEPER') {
      // --- BOSS 1: THE VINEKEEPER (Plant Behemoth) ---
      // Giant breathing body
      const breathe = Math.sin(animTimer * 4) * 3;
      // Main thorn pod body
      this.px(ctx, bx + 16, by + 12 + breathe, 56, 68, '#064e3b');
      this.px(ctx, bx + 22, by + 18 + breathe, 44, 52, '#047857');
      this.px(ctx, bx + 28, by + 24 + breathe, 32, 40, '#10b981');

      // Glowing bioluminescent central core eye
      this.px(ctx, bx + 36, by + 32 + breathe, 16, 16, '#facc15');
      this.px(ctx, bx + 40, by + 36 + breathe, 8, 8, '#ef4444');

      // Thorny animated vine appendages lunging forward
      for (let v = 0; v < 4; v++) {
        const vineWave = Math.sin(animTimer * 8 + v * 1.5) * 8;
        const vx = bx - 16 + v * 6;
        const vy = by + 20 + v * 14 + vineWave;
        this.px(ctx, vx, vy, 20, 6, '#065f46');
        this.px(ctx, vx - 6, vy + 1, 6, 4, '#34d399');
        this.px(ctx, vx - 10, vy + 2, 4, 2, '#86efac'); // sharp vine stinger
      }

      // Root base gripping ground
      this.px(ctx, bx + 8, by + 76, 72, 14, '#022c22');

    } else if (boss.type === 'IRON_STAG') {
      // --- BOSS 2: THE IRON STAG (Mechanical Titan) ---
      const gallop = Math.sin(animTimer * 10) * 4;
      // Armored mechanical beast chassis
      this.px(ctx, bx + 18, by + 14 + gallop, 64, 42, '#334155');
      this.px(ctx, bx + 22, by + 18 + gallop, 56, 34, '#475569');
      // Furnace core glowing inside ribs
      this.px(ctx, bx + 36, by + 24 + gallop, 20, 14, '#ea580c');
      this.px(ctx, bx + 40, by + 28 + gallop, 12, 6, '#facc15');

      // Heavy mechanical head
      this.px(ctx, bx - 2, by + 10 + gallop, 24, 20, '#1e293b');
      this.px(ctx, bx, by + 14 + gallop, 6, 4, '#38bdf8'); // Visor

      // Giant jagged metallic antlers branching forward
      this.px(ctx, bx - 14, by - 6 + gallop, 18, 5, '#94a3b8');
      this.px(ctx, bx - 22, by - 16 + gallop, 12, 5, '#cbd5e1');
      this.px(ctx, bx - 10, by - 14 + gallop, 5, 12, '#cbd5e1');
      this.px(ctx, bx - 28, by - 14 + gallop, 8, 4, '#f1f5f9');

      // Heavy piston legs
      this.px(ctx, bx + 12, by + 54, 10, 22, '#475569');
      this.px(ctx, bx + 54, by + 54, 10, 22, '#475569');

    } else if (boss.type === 'VOID_COLOSSUS') {
      // --- BOSS 4: THE VOID COLOSSUS (Obsidian Gravity Core) ---
      const hover = Math.sin(animTimer * 2.8) * 5;
      // Monolithic obsidian body
      this.px(ctx, bx + 14, by + 10 + hover, 68, 76, '#0f172a');
      this.px(ctx, bx + 20, by + 16 + hover, 56, 64, '#1e293b');
      this.px(ctx, bx + 26, by + 22 + hover, 44, 52, '#881337');

      // Pulsing crimson gravitational core
      const corePulse = Math.sin(animTimer * 12) * 2;
      this.px(ctx, bx + 36 - corePulse, by + 34 + hover - corePulse, 24 + corePulse * 2, 24 + corePulse * 2, '#f43f5e');
      this.px(ctx, bx + 42, by + 40 + hover, 12, 12, '#ffffff');

      // Floating gravitational orbital shards
      for (let s = 0; s < 4; s++) {
        const sAngle = animTimer * 3 + (s * Math.PI) / 2;
        const sx = bx + 48 + Math.cos(sAngle) * 48;
        const sy = by + 46 + Math.sin(sAngle) * 32 + hover;
        this.px(ctx, sx - 5, sy - 5, 10, 10, '#334155');
        this.px(ctx, sx - 2, sy - 2, 4, 4, '#fb7185');
      }

    } else if (boss.type === 'CHRONO_SPECTER') {
      // --- BOSS 5: THE CHRONO SPECTER (Temporal Reality Phantom) ---
      const floatVal = Math.sin(animTimer * 5) * 4;
      // Clockwork temporal phantom shroud
      this.px(ctx, bx + 16, by + 12 + floatVal, 64, 78, '#1e1b4b');
      this.px(ctx, bx + 22, by + 18 + floatVal, 52, 66, '#312e81');
      this.px(ctx, bx + 28, by + 24 + floatVal, 40, 54, '#78350f');

      // Arcane golden clock dial
      this.px(ctx, bx + 36, by + 28 + floatVal, 24, 24, '#f59e0b');
      this.px(ctx, bx + 40, by + 32 + floatVal, 16, 16, '#fef3c7');
      // Clock hands
      const handAngle = animTimer * 8;
      const hx = bx + 48 + Math.cos(handAngle) * 8;
      const hy = by + 40 + floatVal + Math.sin(handAngle) * 8;
      this.px(ctx, hx - 1, hy - 1, 3, 3, '#1e1b4b');

      // Phase scythe blades
      this.px(ctx, bx - 6, by + 18 + floatVal, 18, 6, '#fbbf24');
      this.px(ctx, bx - 14, by + 22 + floatVal, 10, 14, '#fde68a');
      this.px(ctx, bx - 18, by + 34 + floatVal, 6, 22, '#ffffff');

    } else {
      // --- BOSS 3: THE HOLLOW GIANT (Shadow Colossus) ---
      const hover = Math.sin(animTimer * 3) * 6;
      // Swirling abyssal shroud
      this.px(ctx, bx + 10, by + 16 + hover, 76, 84, '#09090b');
      this.px(ctx, bx + 16, by + 22 + hover, 64, 70, '#18181b');
      this.px(ctx, bx + 22, by + 28 + hover, 52, 56, '#3b0764');

      // Floating arcane hollow mask
      this.px(ctx, bx + 30, by + 8 + hover, 36, 32, '#fafafa');
      this.px(ctx, bx + 36, by + 16 + hover, 8, 8, '#7e22ce'); // void eye 1
      this.px(ctx, bx + 52, by + 16 + hover, 8, 8, '#7e22ce'); // void eye 2
      this.px(ctx, bx + 44, by + 28 + hover, 8, 6, '#09090b'); // hollow mouth

      // Floating void orbs around hands
      for (let o = 0; o < 3; o++) {
        const orbAngle = animTimer * 4 + (o * Math.PI * 2) / 3;
        const ox = bx + 48 + Math.cos(orbAngle) * 44;
        const oy = by + 56 + Math.sin(orbAngle) * 28 + hover;
        this.px(ctx, ox - 6, oy - 6, 12, 12, '#c084fc');
        this.px(ctx, ox - 3, oy - 3, 6, 6, '#ffffff');
      }
    }

    // Vulnerable staggered flash when trap barrage is survived
    if (boss.state === 'VULNERABLE' && Math.floor(animTimer * 12) % 2 === 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(bx, by, boss.width, boss.height);
    }

    ctx.restore();
  }

  // --- DRAW TITAN ONE-SHOT POWER-UP ---
  static drawBossPowerUp(ctx: CanvasRenderingContext2D, px: number, py: number, animTimer: number) {
    const bob = Math.sin(animTimer * 8) * 4;
    const x = Math.round(px);
    const y = Math.round(py + bob);

    ctx.save();

    // Outer pulsating radiant aura
    const pulse = Math.sin(animTimer * 14) * 4;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 14 + pulse;

    // Glowing core diamond
    this.px(ctx, x - 10, y - 10, 20, 20, '#0284c7');
    this.px(ctx, x - 8, y - 8, 16, 16, '#38bdf8');
    this.px(ctx, x - 5, y - 5, 10, 10, '#facc15');
    this.px(ctx, x - 2, y - 2, 4, 4, '#ffffff');

    // 4 orbital energy spark particles
    for (let i = 0; i < 4; i++) {
      const ang = animTimer * 6 + (i * Math.PI) / 2;
      const ox = x + Math.cos(ang) * 16;
      const oy = y + Math.sin(ang) * 16;
      this.px(ctx, ox - 2, oy - 2, 4, 4, '#fef08a');
    }

    // Floating pixel banner
    ctx.shadowBlur = 4;
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillStyle = '#fde047';
    ctx.textAlign = 'center';
    ctx.fillText('TITAN ONE-SHOT!', x, y - 18);

    ctx.restore();
  }

  // --- DRAW ONE-SHOT STRIKE BEAM ---
  static drawOneShotStrike(
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    timer: number
  ) {
    ctx.save();

    // Thunderous energy beam from runner directly into boss core
    const beamAlpha = Math.max(0, timer / 0.5);
    ctx.globalAlpha = beamAlpha;

    // Outer cyan flare
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(targetX + 40, targetY + 45);
    ctx.stroke();

    // Inner bright gold core
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(targetX + 40, targetY + 45);
    ctx.stroke();

    // White core laser
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(targetX + 40, targetY + 45);
    ctx.stroke();

    // Target explosion nova
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(targetX + 40, targetY + 45, (1 - timer / 0.5) * 55, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // --- DRAW GHOST RUNNER (Personal Best recorded playback) ---
  static drawGhostRunner(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    state: string,
    animTimer: number,
    isAhead: boolean
  ) {
    ctx.save();
    ctx.globalAlpha = 0.35;
    const ghostColor = isAhead ? '#22d3ee' : '#a78bfa';

    const rx = Math.round(x);
    const ry = Math.round(y);

    // Subtle neon spectral outline
    this.px(ctx, rx + 6, ry + 8, 12, 12, ghostColor);
    this.px(ctx, rx + 8, ry, 10, 8, '#ffffff');
    this.px(ctx, rx + 13, ry + 2, 3, 3, ghostColor);
    this.px(ctx, rx + 4, ry + 16, 6, 8, ghostColor);
    this.px(ctx, rx + 12, ry + 16, 6, 8, ghostColor);

    // Floating tag
    ctx.font = '6px "Press Start 2P", monospace';
    ctx.fillStyle = ghostColor;
    ctx.textAlign = 'center';
    ctx.fillText('PB GHOST', rx + 10, ry - 6);

    ctx.restore();
  }

  // --- DRAW STASIS RESCUE CAPSULE (Friend Box) ---
  static drawRescueBox(
    ctx: CanvasRenderingContext2D,
    box: RescueBox,
    animTimer: number,
    isPlayerNear: boolean
  ) {
    if (box.shattered) return;
    const bx = Math.round(box.x);
    const by = Math.round(box.y);
    const pulse = Math.sin(animTimer * 8) * 0.2 + 0.8;

    ctx.save();

    // 1. Cybernetic outer pod frame
    this.px(ctx, bx - 2, by - 2, box.width + 4, box.height + 4, '#0f172a');
    this.px(ctx, bx, by, box.width, box.height, '#1e293b');

    // 2. Cryo glass chamber
    this.px(ctx, bx + 3, by + 4, box.width - 6, box.height - 8, '#083344');
    ctx.fillStyle = `rgba(34, 211, 238, ${0.28 * pulse})`;
    ctx.fillRect(bx + 4, by + 5, box.width - 8, box.height - 10);

    // 3. Trapped Friend Silhouette inside
    // Head & visor
    this.px(ctx, bx + 12, by + 8, 8, 7, '#38bdf8');
    this.px(ctx, bx + 16, by + 10, 3, 2, '#ffffff');
    // Body & arms
    this.px(ctx, bx + 10, by + 15, 12, 10, '#0284c7');
    this.px(ctx, bx + 11, by + 25, 4, 7, '#0369a1');
    this.px(ctx, bx + 17, by + 25, 4, 7, '#0369a1');

    // 4. Stasis bubbles floating up
    const b1 = (animTimer * 20) % (box.height - 10);
    const b2 = (animTimer * 25 + 10) % (box.height - 10);
    this.px(ctx, bx + 8, by + box.height - 6 - b1, 2, 2, '#67e8f9');
    this.px(ctx, bx + 22, by + box.height - 6 - b2, 2, 2, '#bae6fd');

    // 5. Neon Energy Security Beams & Lock Coils
    this.px(ctx, bx - 1, by + 2, 3, 4, '#f59e0b');
    this.px(ctx, bx + box.width - 2, by + 2, 3, 4, '#f59e0b');
    this.px(ctx, bx - 1, by + box.height - 6, 3, 4, '#f59e0b');
    this.px(ctx, bx + box.width - 2, by + box.height - 6, 3, 4, '#f59e0b');

    // Energy cross-lock laser
    ctx.strokeStyle = `rgba(245, 158, 11, ${pulse})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bx + 2, by + 6);
    ctx.lineTo(bx + box.width - 2, by + box.height - 6);
    ctx.moveTo(bx + box.width - 2, by + 6);
    ctx.lineTo(bx + 2, by + box.height - 6);
    ctx.stroke();

    // 6. Overhead Call to Action (Breaks with Dash!)
    ctx.font = '6px "Press Start 2P", monospace';
    ctx.textAlign = 'center';

    if (isPlayerNear) {
      // Urgent indicator when player approaches
      ctx.fillStyle = '#fde047';
      ctx.fillText('⚡ DASH TO BREAK!', bx + box.width / 2, by - 12);
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('RESCUE FRIEND', bx + box.width / 2, by - 4);
    } else {
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('STASIS POD', bx + box.width / 2, by - 6);
    }

    ctx.restore();
  }

  // --- DRAW TAG-TEAM RESCUED FRIEND RUNNER ---
  static drawTagTeamPartner(
    ctx: CanvasRenderingContext2D,
    partner: TagTeamPartner,
    skin: CharacterSkin,
    animTimer: number
  ) {
    if (!partner.active) return;
    const px = Math.round(partner.x);
    const py = Math.round(partner.y);

    ctx.save();
    // Soft holographic partner glow
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 8;

    // Draw partner runner using their skin
    this.drawRunner(
      ctx,
      px,
      py,
      partner.animState,
      partner.animTimer,
      skin,
      { wing: 'PAPER_WINGS', head: 'BANDANA', companion: 'NONE' },
      false,
      false,
      partner.animState === 'FLY'
    );

    // Floating tag above partner
    ctx.font = '6px "Press Start 2P", monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.fillText('PARTNER [SWAP READY]', px + 10, py - 6);

    ctx.restore();
  }
}
