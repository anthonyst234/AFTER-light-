export interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  email?: string;
  country: string;
  flag: string;
  distance: number;
  mode: 'ENDLESS' | 'HARDCORE';
  character: string;
  badge: string;
  verified: boolean;
  timestamp: number;
}

const LEADERBOARD_STORAGE_KEY = 'AFTERLIGHT_GLOBAL_LEADERBOARD_V2';

const SEED_LEADERBOARD: Omit<LeaderboardEntry, 'id' | 'timestamp'>[] = [
  { rank: 1, name: 'Vortex_Phantom', country: 'JP', flag: '🇯🇵', distance: 14820, mode: 'HARDCORE', character: 'Celestial', badge: 'Titan Conqueror', verified: true },
  { rank: 2, name: 'Apex_Kitsune', country: 'US', flag: '🇺🇸', distance: 13240, mode: 'ENDLESS', character: 'Shadow', badge: 'Void Walker', verified: true },
  { rank: 3, name: 'NeonCipher', country: 'KR', flag: '🇰🇷', distance: 11980, mode: 'HARDCORE', character: 'Neon', badge: 'Speed Specialist', verified: true },
  { rank: 4, name: 'Ghost_Operative', country: 'DE', flag: '🇩🇪', distance: 10450, mode: 'ENDLESS', character: 'Ghost', badge: 'Ghost Operator', verified: true },
  { rank: 5, name: 'Solaris_Prime', country: 'SE', flag: '🇸🇪', distance: 9870, mode: 'HARDCORE', character: 'Solar', badge: 'Apex Runner', verified: true },
  { rank: 6, name: 'Frostbite_Echo', country: 'CA', flag: '🇨🇦', distance: 8920, mode: 'ENDLESS', character: 'Frost', badge: 'Kinetic Sprinter', verified: true },
  { rank: 7, name: 'ShadowDrifter', country: 'GB', flag: '🇬🇧', distance: 7840, mode: 'ENDLESS', character: 'Ink', badge: 'Rooftop Skater', verified: true },
  { rank: 8, name: 'Vanguard_Bravo', country: 'FR', flag: '🇫🇷', distance: 6910, mode: 'HARDCORE', character: 'Signal', badge: 'Street Courier', verified: true },
  { rank: 9, name: 'BlushRenegade', country: 'BR', flag: '🇧🇷', distance: 6150, mode: 'ENDLESS', character: 'Dust Rose', badge: 'Street Courier', verified: true },
  { rank: 10, name: 'CinderCourier', country: 'AU', flag: '🇦🇺', distance: 5430, mode: 'ENDLESS', character: 'Ash', badge: 'Novice Drifter', verified: true },
];

export function getGlobalLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LEADERBOARD_STORAGE_KEY);
    if (!raw) {
      // Seed with initial entries
      const seeded: LeaderboardEntry[] = SEED_LEADERBOARD.map((item, idx) => ({
        ...item,
        id: 'seed_' + idx,
        timestamp: Date.now() - idx * 3600000,
      }));
      localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed: LeaderboardEntry[] = JSON.parse(raw);
    return parsed;
  } catch (e) {
    console.warn('Failed to load global leaderboard, returning seeded', e);
    return SEED_LEADERBOARD.map((item, idx) => ({
      ...item,
      id: 'seed_' + idx,
      timestamp: Date.now(),
    }));
  }
}

export function saveGlobalLeaderboard(entries: LeaderboardEntry[]): void {
  try {
    localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(entries));
  } catch (e) {
    console.error('Failed to save global leaderboard', e);
  }
}

export function submitScoreToLeaderboard(scoreData: {
  name: string;
  email?: string;
  country: string;
  flag: string;
  distance: number;
  mode: 'ENDLESS' | 'HARDCORE';
  character: string;
  badge?: string;
}): { rank: number; isTop10: boolean } {
  const current = getGlobalLeaderboard();

  // Find if player already has an entry for this mode
  const cleanName = scoreData.name.trim();
  const existingIndex = current.findIndex(
    (e) => (e.name.toLowerCase() === cleanName.toLowerCase() || (scoreData.email && e.email === scoreData.email)) && e.mode === scoreData.mode
  );

  if (existingIndex >= 0) {
    if (scoreData.distance > current[existingIndex].distance) {
      current[existingIndex].distance = scoreData.distance;
      current[existingIndex].character = scoreData.character;
      current[existingIndex].country = scoreData.country;
      current[existingIndex].flag = scoreData.flag;
      current[existingIndex].timestamp = Date.now();
      current[existingIndex].verified = true;
    }
  } else if (scoreData.distance > 0) {
    current.push({
      id: 'score_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
      rank: 0,
      name: cleanName,
      email: scoreData.email,
      country: scoreData.country,
      flag: scoreData.flag,
      distance: scoreData.distance,
      mode: scoreData.mode,
      character: scoreData.character,
      badge: scoreData.badge || (scoreData.distance > 10000 ? 'Titan Conqueror' : scoreData.distance > 5000 ? 'Apex Runner' : 'Street Courier'),
      verified: true,
      timestamp: Date.now(),
    });
  }

  // Sort descending by distance
  current.sort((a, b) => b.distance - a.distance);

  // Re-rank all entries
  current.forEach((entry, idx) => {
    entry.rank = idx + 1;
  });

  saveGlobalLeaderboard(current);

  const playerEntry = current.find(
    (e) => (e.name.toLowerCase() === cleanName.toLowerCase() || (scoreData.email && e.email === scoreData.email)) && e.mode === scoreData.mode
  );

  const rank = playerEntry ? playerEntry.rank : current.length;
  return {
    rank,
    isTop10: rank <= 10,
  };
}

export function removeLeaderboardEntry(id: string): void {
  const current = getGlobalLeaderboard().filter((e) => e.id !== id);
  current.forEach((e, idx) => {
    e.rank = idx + 1;
  });
  saveGlobalLeaderboard(current);
}

export function clearAllLeaderboardScores(): void {
  localStorage.removeItem(LEADERBOARD_STORAGE_KEY);
}
