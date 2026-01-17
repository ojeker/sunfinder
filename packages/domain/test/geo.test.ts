import { describe, expect, it } from 'vitest';
import { compass8FromBearing, planarBearingDeg, planarDistanceKm } from '../src/geo';

describe('planar geo', () => {
  it('computes planar distance in km', () => {
    const a = { e: 2600000, n: 1200000 };
    const b = { e: 2603000, n: 1204000 };

    expect(planarDistanceKm(a, b)).toBeCloseTo(5, 5);
  });

  it('computes planar bearing in degrees', () => {
    const a = { e: 2600000, n: 1200000 };
    const north = { e: 2600000, n: 1201000 };
    const east = { e: 2601000, n: 1200000 };

    expect(planarBearingDeg(a, north)).toBeCloseTo(0, 5);
    expect(planarBearingDeg(a, east)).toBeCloseTo(90, 5);
  });

  it('maps bearing to 8-point compass', () => {
    expect(compass8FromBearing(0)).toBe('N');
    expect(compass8FromBearing(44)).toBe('NE');
    expect(compass8FromBearing(91)).toBe('E');
    expect(compass8FromBearing(225)).toBe('SW');
  });
});
