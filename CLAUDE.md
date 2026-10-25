# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm build          # Build with unbuild (outputs ESM + CJS to dist/)
pnpm dev            # Build with stubs for development
pnpm test           # Run all tests via vitest
pnpm test -- --run  # Run tests once (no watch mode)
pnpm lint           # Lint via ESLint (@antfu/eslint-config, lib preset)
pnpm lint:fix       # Lint and auto-fix
pnpm typecheck      # Type-check without emitting (tsc --noEmit)
```

This project uses `@antfu/ni`, so `nr <script>`, `nci`, etc. also work.

## Architecture

A TypeScript library that computes the **minimum-area oriented bounding rectangle** for a set of 2D points using the rotating calipers algorithm.

Three source files:

- **`src/math.ts`** — `Vector2` class (2D vector with dot/cross/add/sub/scale/normalize/angle, plus mutable `set`/`copyFrom`/`setFromSub` for reusing instances in hot paths). Exports `getProj`, `getMinMaxProj`, `getCenter`.
- **`src/mbr.ts`** — `MBR` class. `fromPoints()` computes the MBR: `grahamScan()` builds the convex hull, `rotatingCalipers()` finds the minimum-area bounding rectangle in O(h) using incremental extreme-point advancement (iLeft, iRight, iTop, iBottom). Writes into `halfSize`, `center`, `rotation` on the instance.
  - `grahamScan()` sorts by polar angle with inlined arithmetic (no temporary vectors) and removes collinear points. For `n >= 512` it first runs an Akl–Toussaint prefilter: points strictly inside the hull of the 8 extreme points (x, y, x±y) cannot be hull vertices, so only the survivors are sorted. A 128-point hashed sample gates it, so hull-heavy inputs (circles, polygon boundaries) skip the extra pass.
  - `rotatingCalipers()` keeps edges unnormalized — supports only need the sign of a projection, and areas are compared by cross-multiplication — so the loop has no `sqrt` and no division; both happen once on the winning box. Support loops terminate by monotonicity; a collinear or all-duplicate hull returns the zero box instead of spinning.
- **`src/index.ts`** — Re-exports everything from `./math` and `./mbr`.

Built with `unbuild` (rollup-based), emitting ESM (`.mjs`) and CJS (`.cjs`) plus `.d.ts` declarations into `dist/`. No runtime dependencies.

## Testing

- `test/index.test.ts` — 53 tests covering convex hull (collinear, degenerate, duplicate), rotating calipers (square, triangle, degenerate n<3), end-to-end MBR (containment invariant, area lower bound), Vector2 public methods, and utility functions.
- Edge cases pin the empty / single / all-identical / collinear inputs (including a regression test that a collinear hull must not hang) and input immutability.
- Prefilter invariants compare `grahamScan` and `fromPoints` against independent test oracles — a monotone-chain hull and an O(h·n) edge sweep — across both sides of the 512-point threshold. Add cases there when touching the prefilter.
- `bench/mbr.bench.ts` — vitest bench with 5 scenarios (tiny square, small random, circle 100, large random 1000, circle 200) × 3 operations (grahamScan, rotatingCalipers, fromPoints).

## CI

GitHub Actions runs lint + typecheck + test (vitest across ubuntu/windows/macos) on pushes and PRs to `main`.
