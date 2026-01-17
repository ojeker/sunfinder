export type ChCoord = {
  e: number;
  n: number;
};

export function planarDistanceKm(a: ChCoord, b: ChCoord) {
  const dx = b.e - a.e;
  const dy = b.n - a.n;
  return Math.hypot(dx, dy) / 1000;
}

export function planarBearingDeg(a: ChCoord, b: ChCoord) {
  const dx = b.e - a.e;
  const dy = b.n - a.n;
  const radians = Math.atan2(dx, dy);
  const degrees = (radians * 180) / Math.PI;
  return degrees >= 0 ? degrees : degrees + 360;
}

const COMPASS_8 = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;

export type Compass8 = (typeof COMPASS_8)[number];

export function compass8FromBearing(bearingDeg: number): Compass8 {
  const normalized = ((bearingDeg % 360) + 360) % 360;
  const index = Math.round(normalized / 45) % 8;
  return COMPASS_8[index];
}
