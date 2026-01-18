# Webcams UI

## Requirements
- Node.js (check `package.json` for the expected pnpm version).
- pnpm (matches the version in `package.json`).

## Install
```bash
pnpm install
```

## Run locally
```bash
pnpm dev
```

This runs the worker in local mode via Wrangler from `apps/worker`.

## Test
```bash
pnpm test
```

To run tests in watch mode from the worker package:
```bash
pnpm -C apps/worker test:watch
```

## Windy snapshot note
For the Bad Ramsach Windy webcam, the app uses a stable snapshot URL from the Windy embed HTML:
`https://imgproxy.windy.com/_/normal/plain/current/1352710771/original.jpg`.
The worker test `apps/worker/test/worker.test.ts` includes a fixture that shows how
`/api/html-image` would extract an `img#background` URL from the embed markup.
