# Implementation Plan

This plan orders work to reduce integration risk and enable early end-to-end feedback.

## Phase 0 (Both): Repo + Tooling Baseline
1. Initialize workspace structure (`apps/spa`, `apps/worker`, `packages/domain`, `packages/config`) and pnpm workspace.
2. Add root scripts for dev/test, and CI entrypoints (even if stubbed).
3. Wire formatting/linting conventions only if needed later (skip initially to avoid churn).

## Phase 1 (Worker): Worker Contract First (Fast E2E Signal)
1. Implement Worker `/api/image` with allowlist, CORS, caching, and JSON errors.
2. Add OpenAPI file and contract tests using Miniflare + Vitest.
3. Validate local manual E2E: worker responds to a local test server.

## Phase 2 (Both): Shared Config + Domain Utilities (Low Risk, High Reuse)
1. `packages/config`: zod schema for `webcams.yml`, loader with friendly errors.
2. `packages/domain`: planar geo math in CH2056 (distance/bearing/compass).
3. Unit tests for both packages using fixed inputs.

## Phase 3 (SPA): SPA Skeleton + Data Flow (Early UI Feedback)
1. Create Vue 3 + Vite + TS app in `apps/spa`.
2. Add YAML loading from repo root; render a minimal list (name + elevation).
3. Add Worker client with base URL from YAML settings.
4. Configure Vite dev proxy `/api/*` → Worker dev URL.

## Phase 4 (SPA): Core UI + Computed Fields
1. Add geodesic computations: distance (km), bearing degrees + compass.
2. Render `WebcamCard` with name, elevation, distance, bearing.
3. Implement refresh interval per webcam and error badges for failures.

## Phase 5 (Both): E2E Loop (Before Extra Features)
1. Add Playwright smoke test: load app, assert list renders, worker proxy called.
2. Add contract tests that validate SPA → Worker error handling for forbidden host.
3. Wire CI to run unit + worker + e2e on PR.

## Phase 6 (Worker): HTML Image Extraction
1. Add `/api/html-image` extraction + redirect.
2. Extend OpenAPI file and contract tests for HTML extraction.
3. Validate with a local HTML fixture page.

## Phase 7 (SPA): Filters/Sorting + Observability
1. Add sorting/filtering UI (distance, elevation, bearing sector).
2. Add per-webcam error counts and last refresh timestamp.
3. Add integration tests for filters and error states.

## Phase 8 (Both): Polish and Deployment
1. Production build for SPA on GitHub Pages (base path config).
2. Worker deployment config and env vars for allowlist extras if needed.
3. Final manual smoke pass with a few sample webcams.
