import type { RootConfig } from '@webcam-sunline/config/parse';
import { WorkerClient } from './workerClient';

type Webcam = RootConfig['webcams'][number];

const RETRY_DELAYS_MS = [2000, 5000, 10000];

export function isWorkerBypass(webcam: Webcam): boolean {
  return Boolean(webcam.worker_bypass) && webcam.source.kind === 'snapshot' && Boolean(webcam.source.url);
}

export function resolvePreviewBaseUrl(webcam: Webcam, workerBaseUrl: string): string | null {
  if (webcam.source.kind === 'snapshot' && webcam.source.url) {
    if (isWorkerBypass(webcam)) {
      return webcam.source.url;
    }
    return new WorkerClient(workerBaseUrl).imageUrl(webcam.source.url);
  }

  if (webcam.source.kind === 'page' && webcam.source.page) {
    return new WorkerClient(workerBaseUrl).htmlImageUrl(webcam.source.page, webcam.source.selector);
  }

  return null;
}

export function shouldRetry(attempt: number): boolean {
  return attempt < RETRY_DELAYS_MS.length;
}

export function nextRetryDelayMs(attempt: number): number {
  return RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)];
}
