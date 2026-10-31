# min-rect

Computes the exact minimum-area oriented bounding rectangle of a set of 2D points, using a convex hull plus rotating calipers. No dependencies.

## Install

```bash
npm install min-rect
```

## Usage

```ts
import { MBR, Vector2 } from 'min-rect'

const points = [
  [0, 0],
  [1, 0],
  [0, 1],
  [1, 1],
].map(([x, y]) => new Vector2(x, y))

const mbr = new MBR()
mbr.fromPoints(points)

console.log(mbr)
// {
//   halfSize: Vector2 { x: 0.5, y: 0.5 },
//   center: Vector2 { x: 0.5, y: 0.5 },
//   rotation: 0
// }
```

## API

### `new MBR()`

The minimum bounding rectangle instance. Call `fromPoints()` to compute.

| Property | Type | Description |
|----------|------|-------------|
| `halfSize` | `Vector2` | Half width and half height of the rectangle |
| `center` | `Vector2` | Geometric center of the rectangle |
| `rotation` | `number` | Orientation in radians |

| Method | Description |
|--------|-------------|
| `fromPoints(points: Vector2[])` | Compute the MBR from a set of 2D points |
| `grahamScan(points: Vector2[])` | Compute the convex hull (Graham scan, interior points prefiltered for large inputs) |
| `rotatingCalipers(hull: Vector2[])` | Find the minimum-area rectangle for a convex hull |

`fromPoints` writes into the instance properties. `rotatingCalipers` returns the result without touching them. A zero-size box is returned for fewer than three distinct points, and for inputs where every point is collinear.

### `new Vector2(x, y)`

2D vector with `dot`, `cross`, `sub`, `add`, `scale`, `normalize`, `angle`, `length`, `set`, `copyFrom`, `setFromSub`.

### Utility functions

`getProj(point, edge)`, `getMinMaxProj(points, edge)`, `getCenter(points)` — exported for convenience.

## How it works

1. **Convex hull.** Only hull vertices can touch the minimum rectangle, so everything else is irrelevant. For inputs of 512+ points, an [Akl–Toussaint](https://www.sciencedirect.com/science/article/pii/0020019078900030) prefilter drops points that are strictly inside the octagon spanned by the 8 extreme points (`x`, `y`, `x+y`, `x−y`) before the Graham scan sorts anything. A 128-point sample decides whether the pass pays off, so hull-heavy inputs skip it.
2. **Rotating calipers.** The optimal rectangle always has a side flush with a hull edge ([Freeman & Shapira, 1975](https://dl.acm.org/doi/10.1145/360881.360919)), and the four support points only move forward as that edge sweeps the hull, so all candidate orientations are checked in O(h) ([Toussaint, 1983](https://web.cs.swarthmore.edu/~adanner/cs97/s08/pdf/calipers.pdf)).

Total cost is O(n log n) for the hull plus O(h) for the rectangle, where h is the number of hull vertices. Edges are kept unnormalized and areas are compared by cross-multiplication, so the calipers loop contains no `sqrt` and no division.

## Performance

Median throughput (`pnpm vitest bench`, Node 26, macOS):

| Input | `fromPoints` |
| --- | --- |
| 20 points | ~1.1M ops/s |
| 1,000 uniform points | ~32k ops/s |
| 200 points on a circle (every point on the hull) | ~112k ops/s |

## License

[MIT](./LICENSE)

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![JSDocs][jsdocs-src]][jsdocs-href]
[![License][license-src]][license-href]

[npm-version-src]: https://img.shields.io/npm/v/min-rect?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/min-rect
[npm-downloads-src]: https://img.shields.io/npm/dm/min-rect?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/min-rect
[bundle-src]: https://img.shields.io/bundlephobia/minzip/min-rect?style=flat&colorA=080f12&colorB=1fa669&label=minzip
[bundle-href]: https://bundlephobia.com/result?p=min-rect
[license-src]: https://img.shields.io/github/license/0xlxx/min-rect.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/0xlxx/min-rect/blob/main/LICENSE
[jsdocs-src]: https://img.shields.io/badge/jsdocs-reference-080f12?style=flat&colorA=080f12&colorB=1fa669
[jsdocs-href]: https://www.jsdocs.io/package/min-rect
