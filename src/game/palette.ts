export interface PaletteColors {
  name: string;
  skyTop: [number, number, number];
  skyBottom: [number, number, number];
  bgFar: [number, number, number];
  bgMid: [number, number, number];
  bgNear: [number, number, number];
  ground: [number, number, number];
  groundTrim: [number, number, number];
  accent: [number, number, number];
  particle: [number, number, number];
}

export const PALETTE_TIERS: PaletteColors[] = [
  // 0-19: Monochrome Gray City
  {
    name: 'Monochrome Grayscale',
    skyTop: [12, 12, 14],
    skyBottom: [28, 28, 32],
    bgFar: [40, 40, 46],
    bgMid: [62, 62, 70],
    bgNear: [85, 85, 95],
    ground: [24, 24, 28],
    groundTrim: [120, 120, 130],
    accent: [220, 220, 230],
    particle: [180, 180, 190],
  },
  // 20-39: Cool Blue City
  {
    name: 'Cool Blue City',
    skyTop: [10, 25, 47],
    skyBottom: [20, 48, 80],
    bgFar: [30, 65, 105],
    bgMid: [45, 95, 145],
    bgNear: [56, 189, 248],
    ground: [15, 30, 55],
    groundTrim: [56, 189, 248],
    accent: [125, 211, 252],
    particle: [186, 230, 253],
  },
  // 40-59: Warm Sunset Colours
  {
    name: 'Warm Sunset Glow',
    skyTop: [55, 15, 30],
    skyBottom: [120, 30, 45],
    bgFar: [160, 50, 45],
    bgMid: [215, 80, 50],
    bgNear: [245, 140, 55],
    ground: [45, 15, 25],
    groundTrim: [251, 146, 60],
    accent: [253, 186, 116],
    particle: [254, 215, 170],
  },
  // 60-79: Purple Twilight
  {
    name: 'Purple Twilight',
    skyTop: [28, 12, 50],
    skyBottom: [55, 20, 85],
    bgFar: [80, 30, 120],
    bgMid: [115, 45, 165],
    bgNear: [168, 85, 247],
    ground: [30, 15, 50],
    groundTrim: [192, 132, 252],
    accent: [232, 121, 249],
    particle: [245, 208, 254],
  },
  // 80-99: Overgrown Green
  {
    name: 'Overgrown Emerald',
    skyTop: [4, 40, 25],
    skyBottom: [8, 65, 40],
    bgFar: [12, 90, 55],
    bgMid: [18, 125, 75],
    bgNear: [52, 211, 153],
    ground: [6, 45, 30],
    groundTrim: [110, 231, 183],
    accent: [167, 243, 208],
    particle: [209, 250, 229],
  },
  // 100+: Vivid Celestial / Void Aurora
  {
    name: 'Celestial Aurora',
    skyTop: [22, 10, 45],
    skyBottom: [40, 15, 75],
    bgFar: [88, 28, 135],
    bgMid: [147, 51, 234],
    bgNear: [234, 179, 8],
    ground: [25, 12, 45],
    groundTrim: [250, 204, 21],
    accent: [56, 189, 248],
    particle: [254, 240, 138],
  },
];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpColor(c1: [number, number, number], c2: [number, number, number], t: number): [number, number, number] {
  return [
    Math.round(lerp(c1[0], c2[0], t)),
    Math.round(lerp(c1[1], c2[1], t)),
    Math.round(lerp(c1[2], c2[2], t)),
  ];
}

export function rgbToString(c: [number, number, number], alpha = 1): string {
  if (alpha < 1) {
    return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha})`;
  }
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

export class PaletteManager {
  currentTierIndex = 0;
  targetTierIndex = 0;
  transitionProgress = 1; // 0 to 1

  update(coins: number, dt: number) {
    // Each 20 coins = next tier (tier 0 to 5)
    const target = Math.min(Math.floor(coins / 20), PALETTE_TIERS.length - 1);
    if (target !== this.targetTierIndex) {
      this.targetTierIndex = target;
      this.transitionProgress = 0;
    }

    if (this.transitionProgress < 1) {
      // Smooth gradual fade over 1.8 seconds
      this.transitionProgress += dt * 0.55;
      if (this.transitionProgress >= 1) {
        this.transitionProgress = 1;
        this.currentTierIndex = this.targetTierIndex;
      }
    }
  }

  getCurrentPalette() {
    const from = PALETTE_TIERS[this.currentTierIndex];
    const to = PALETTE_TIERS[this.targetTierIndex];
    const t = Math.min(1, Math.max(0, this.transitionProgress));

    return {
      tierName: to.name,
      skyTop: rgbToString(lerpColor(from.skyTop, to.skyTop, t)),
      skyBottom: rgbToString(lerpColor(from.skyBottom, to.skyBottom, t)),
      bgFar: rgbToString(lerpColor(from.bgFar, to.bgFar, t)),
      bgMid: rgbToString(lerpColor(from.bgMid, to.bgMid, t)),
      bgNear: rgbToString(lerpColor(from.bgNear, to.bgNear, t)),
      ground: rgbToString(lerpColor(from.ground, to.ground, t)),
      groundTrim: rgbToString(lerpColor(from.groundTrim, to.groundTrim, t)),
      accent: rgbToString(lerpColor(from.accent, to.accent, t)),
      particle: rgbToString(lerpColor(from.particle, to.particle, t)),
    };
  }
}
