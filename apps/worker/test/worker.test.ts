import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Miniflare } from 'miniflare';
import { fileURLToPath } from 'node:url';
import { createServer, type Server } from 'node:http';

const scriptPath = fileURLToPath(new URL('../src/index.ts', import.meta.url));

function createMiniflare(bindings: Record<string, string> = {}) {
  return new Miniflare({
    scriptPath,
    modules: true,
    compatibilityDate: '2024-09-25',
    bindings
  });
}

describe('worker api', () => {
  let mf: Miniflare | undefined;
  let server: Server | undefined;
  let baseUrl = '';

  afterEach(async () => {
    if (mf) {
      await mf.dispose();
      mf = undefined;
    }
    if (server) {
      await new Promise<void>(resolve => server?.close(() => resolve()));
      server = undefined;
    }
  });

  beforeEach(async () => {
    server = createServer((req, res) => {
      if (!req.url) {
        res.statusCode = 404;
        res.end();
        return;
      }
      if (req.url === '/page') {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end('<html><body><img src=\"/image.jpg\" /></body></html>');
        return;
      }
      if (req.url === '/image.jpg') {
        res.setHeader('Content-Type', 'image/jpeg');
        res.end('fake-image-bytes');
        return;
      }
      res.statusCode = 404;
      res.end();
    });

    await new Promise<void>(resolve => {
      server?.listen(0, '127.0.0.1', () => {
        const address = server?.address();
        if (address && typeof address === 'object') {
          baseUrl = `http://${address.address}:${address.port}`;
        }
        resolve();
      });
    });
  });

  it('returns missing param error for /api/image', async () => {
    mf = createMiniflare();
    const res = await mf.dispatchFetch('http://localhost/api/image');

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      code: 'E_MISSING_PARAM'
    });
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
  });

  it('returns invalid url error for /api/image', async () => {
    mf = createMiniflare();
    const res = await mf.dispatchFetch('http://localhost/api/image?url=not-a-url');

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      code: 'E_INVALID_URL'
    });
  });

  it('returns forbidden host error for /api/image', async () => {
    mf = createMiniflare();
    const res = await mf.dispatchFetch(
      'http://localhost/api/image?url=https%3A%2F%2Fexample.com%2Fimage.jpg'
    );

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toMatchObject({
      code: 'E_FORBIDDEN_HOST'
    });
  });

  it('returns missing param error for /api/html-image', async () => {
    mf = createMiniflare();
    const res = await mf.dispatchFetch('http://localhost/api/html-image');

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      code: 'E_MISSING_PARAM'
    });
  });

  it('proxies image responses for allowlisted hosts', async () => {
    mf = createMiniflare({ ALLOWLIST_EXTRA: '127.0.0.1' });
    const target = encodeURIComponent(`${baseUrl}/image.jpg`);
    const res = await mf.dispatchFetch(`http://localhost/api/image?url=${target}`);

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/jpeg');
    await expect(res.text()).resolves.toBe('fake-image-bytes');
  });

  it('extracts html image and redirects to proxy', async () => {
    mf = createMiniflare({ ALLOWLIST_EXTRA: '127.0.0.1' });
    const page = encodeURIComponent(`${baseUrl}/page`);
    const res = await mf.dispatchFetch(`http://localhost/api/html-image?page=${page}`);

    expect(res.status).toBe(302);
    const location = res.headers.get('location') ?? '';
    expect(location).toContain('/api/image?url=');
  });
});
