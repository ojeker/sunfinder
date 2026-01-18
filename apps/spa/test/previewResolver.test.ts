import { describe, expect, it } from 'vitest';
import type { RootConfig } from '@webcam-sunline/config/parse';
import {
  isWorkerBypass,
  nextRetryDelayMs,
  resolvePreviewBaseUrl,
  shouldRetry
} from '../src/services/previewResolver';

type Webcam = RootConfig['webcams'][number];

const baseWebcam: Omit<Webcam, 'source'> = {
  id: 'cam-1',
  name: 'Cam One',
  elevation_m_asl: 100,
  coord_ch2056: { e: 1, n: 2 }
};

describe('previewResolver', () => {
  it('bypasses the worker for snapshot when worker_bypass is true', () => {
    const webcam: Webcam = {
      ...baseWebcam,
      worker_bypass: true,
      source: { kind: 'snapshot', url: 'https://example.com/image.jpg' }
    };
    expect(isWorkerBypass(webcam)).toBe(true);
    expect(resolvePreviewBaseUrl(webcam, 'http://127.0.0.1:8787')).toBe(
      'https://example.com/image.jpg'
    );
  });

  it('uses the worker for snapshot when worker_bypass is false', () => {
    const webcam: Webcam = {
      ...baseWebcam,
      worker_bypass: false,
      source: { kind: 'snapshot', url: 'https://example.com/image.jpg' }
    };
    expect(isWorkerBypass(webcam)).toBe(false);
    expect(resolvePreviewBaseUrl(webcam, 'http://127.0.0.1:8787')).toBe(
      'http://127.0.0.1:8787/api/image?url=https%3A%2F%2Fexample.com%2Fimage.jpg'
    );
  });

  it('never bypasses for page sources', () => {
    const webcam: Webcam = {
      ...baseWebcam,
      worker_bypass: true,
      source: {
        kind: 'page',
        page: 'https://example.com/embed.html',
        selector: 'img.hero'
      }
    };
    expect(isWorkerBypass(webcam)).toBe(false);
    expect(resolvePreviewBaseUrl(webcam, 'http://127.0.0.1:8787')).toBe(
      'http://127.0.0.1:8787/api/html-image?page=https%3A%2F%2Fexample.com%2Fembed.html&selector=img.hero'
    );
  });

  it('retries with a capped backoff sequence', () => {
    expect(shouldRetry(0)).toBe(true);
    expect(shouldRetry(1)).toBe(true);
    expect(shouldRetry(2)).toBe(true);
    expect(shouldRetry(3)).toBe(false);
    expect(nextRetryDelayMs(0)).toBe(2000);
    expect(nextRetryDelayMs(1)).toBe(5000);
    expect(nextRetryDelayMs(2)).toBe(10000);
    expect(nextRetryDelayMs(3)).toBe(10000);
  });
});
