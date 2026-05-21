# min-rect

Computes the minimum-area oriented bounding rectangle (2D) using the rotating calipers algorithm.

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
| `grahamScan(points: Vector2[])` | Compute the convex hull (Graham scan) |
| `rotatingCalipers(hull: Vector2[])` | Find the minimum-area rectangle for a convex hull |

### `new Vector2(x, y)`

2D vector with `dot`, `cross`, `sub`, `add`, `scale`, `normalize`, `angle`, `length`, `set`, `copyFrom`, `setFromSub`.

### Utility functions

`getProj(point, edge)`, `getMinMaxProj(points, edge)`, `getCenter(points)` — exported for convenience.

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
