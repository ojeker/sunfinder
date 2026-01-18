import { describe, expect, it } from 'vitest';
import { ConfigError, parseWebcamsYaml } from '../src/loader';

describe('config loader', () => {
  it('parses valid yaml', () => {
    const yaml = `
settings:
  user_coord_ch2056: { e: 2600000, n: 1200000 }
  worker_base_url: "http://127.0.0.1:8787"
  refresh_minutes: 0.5
webcams:
  - id: test
    name: Test Cam
    elevation_m_asl: 1000
    coord_ch2056: { e: 2600100, n: 1200200 }
    source:
      kind: snapshot
      url: "https://example.com/image.jpg"
`;

    const result = parseWebcamsYaml(yaml);
    expect(result.webcams).toHaveLength(1);
    expect(result.webcams[0].id).toBe('test');
  });

  it('coerces numeric ids to strings', () => {
    const yaml = `
settings:
  user_coord_ch2056: { e: 2600000, n: 1200000 }
  worker_base_url: "http://127.0.0.1:8787"
  refresh_minutes: 0.5
webcams:
  - id: 4702
    name: Test Cam
    elevation_m_asl: 1000
    coord_ch2056: { e: 2600100, n: 1200200 }
    source:
      kind: snapshot
      url: "https://example.com/image.jpg"
`;

    const result = parseWebcamsYaml(yaml);
    expect(result.webcams[0].id).toBe('4702');
  });

  it('rejects invalid yaml shape', () => {
    const yaml = `
settings: {}
webcams: []
`;

    expect(() => parseWebcamsYaml(yaml)).toThrowError(ConfigError);
  });
});
