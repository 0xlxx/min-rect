import { describe, expect, it } from 'vitest'
import { MBR, Vector2 } from '../src/index'
import { getCenter, getMinMaxProj, getProj } from '../src/math'

describe('mBR', () => {
  describe('graham Scan (Convex Hull)', () => {
    it('should handle square points correctly', () => {
      const points = [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
      ].map(([x, y]) => new Vector2(x, y))

      const mbr = new MBR()
      const convexHull = mbr.grahamScan(points)

      expect(convexHull.length).toEqual(4)
      expect(convexHull).toEqual([
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ].map(([x, y]) => new Vector2(x, y)))
    })

    it('should handle triangle points correctly', () => {
      const points = [
        [0, 0],
        [1, 0],
        [0.5, 1],
      ].map(([x, y]) => new Vector2(x, y))

      const mbr = new MBR()
      const convexHull = mbr.grahamScan(points)

      expect(convexHull.length).toEqual(3)
      expect(convexHull).toEqual([
        [0, 0],
        [1, 0],
        [0.5, 1],
      ].map(([x, y]) => new Vector2(x, y)))
    })

    it('should remove collinear hull edge points', () => {
      const points = [
        [0, 0],
        [1, 0],
        [2, 0], // collinear on bottom edge
        [2, 1],
        [0, 1],
      ].map(([x, y]) => new Vector2(x, y))

      const mbr = new MBR()
      const hull = mbr.grahamScan(points)

      // (1,0) should be removed because (0,0)→(2,0) is a straight line
      expect(hull).toEqual([
        [0, 0],
        [2, 0],
        [2, 1],
        [0, 1],
      ].map(([x, y]) => new Vector2(x, y)))
      expect(hull.length).toEqual(4)
    })

    it('should handle all collinear points (degenerate)', () => {
      const points = [
        [0, 0],
        [1, 0],
        [2, 0],
        [3, 0],
      ].map(([x, y]) => new Vector2(x, y))

      const mbr = new MBR()
      const hull = mbr.grahamScan(points)

      expect(hull.length).toBeGreaterThanOrEqual(2)
      expect(hull.length).toBeLessThanOrEqual(3)
    })

    it('should handle duplicate points', () => {
      const points = [
        [0, 0],
        [1, 0],
        [1, 0], // duplicate
        [1, 1],
        [0, 1],
      ].map(([x, y]) => new Vector2(x, y))

      const mbr = new MBR()
      const hull = mbr.grahamScan(points)

      expect(hull.length).toEqual(4)
    })
  })

  describe('rotating Calipers Algorithm', () => {
    it('should calculate correct rectangle bounds for square case', () => {
      const hull = [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ].map(([x, y]) => new Vector2(x, y))

      const mbr = new MBR()
      const result = mbr.rotatingCalipers(hull)

      expect(result.halfSize.x).toBeCloseTo(0.5)
      expect(result.halfSize.y).toBeCloseTo(0.5)
      expect(result.rotation).toBeCloseTo(0)
    })

    it('should calculate correct rectangle bounds for 45-degree rotated square', () => {
      const hull = [
        [0, 0],
        [1, -1],
        [2, 0],
        [1, 1],
      ].map(([x, y]) => new Vector2(x, y))

      const mbr = new MBR()
      const result = mbr.rotatingCalipers(hull)

      expect(result.halfSize.x).toBeCloseTo(Math.sqrt(2) / 2)
      expect(result.halfSize.y).toBeCloseTo(Math.sqrt(2) / 2)
      expect(Math.abs(result.rotation)).toBeCloseTo(Math.PI / 4)
    })

    it('should handle degenerate hull (less than 3 points)', () => {
      const mbr = new MBR()

      let result = mbr.rotatingCalipers([])
      expect(result.halfSize.x).toEqual(0)
      expect(result.halfSize.y).toEqual(0)
      expect(result.rotation).toEqual(0)

      result = mbr.rotatingCalipers([new Vector2(0, 0)])
      expect(result.halfSize.x).toEqual(0)
      expect(result.halfSize.y).toEqual(0)

      const two = [new Vector2(0, 0), new Vector2(1, 0)]
      result = mbr.rotatingCalipers(two)
      expect(result.halfSize.x).toEqual(0)
      expect(result.halfSize.y).toEqual(0)
    })

    it('should compute correct MBR for triangle hull', () => {
      const hull = [
        [0, 0],
        [2, 0],
        [1, 2],
      ].map(([x, y]) => new Vector2(x, y))

      const mbr = new MBR()
      const result = mbr.rotatingCalipers(hull)

      // The minimum-area bounding rectangle of this isosceles triangle:
      // Aligns one edge of the rectangle with the base (0,0)-(2,0).
      // Width=2, height=2 (the apex y=2), so area=4.
      expect(result.halfSize.x).toBeCloseTo(1)
      expect(result.halfSize.y).toBeCloseTo(1)
      expect(Math.abs(result.rotation)).toBeCloseTo(0)
    })
  })

  describe('complete MBR Calculation', () => {
    it('should calculate MBR correctly for simple rectangle', () => {
      const points = [
        [0, 0],
        [2, 0],
        [2, 1],
        [0, 1],
      ].map(([x, y]) => new Vector2(x, y))

      const mbr = new MBR()
      mbr.fromPoints(points)

      expect(mbr.halfSize.x).toBeCloseTo(1)
      expect(mbr.halfSize.y).toBeCloseTo(0.5)
      expect(mbr.center.x).toBeCloseTo(1)
      expect(mbr.center.y).toBeCloseTo(0.5)
      expect(mbr.rotation).toBeCloseTo(0)
    })

    it('should calculate MBR correctly for rotated rectangle', () => {
      // Create a rectangle rotated by 45 degrees
      const points = [
        [0, 0],
        [1, -1],
        [2, 0],
        [1, 1],
      ].map(([x, y]) => new Vector2(x, y))

      const mbr = new MBR()
      mbr.fromPoints(points)

      expect(mbr.halfSize.x).toBeCloseTo(Math.sqrt(2) / 2)
      expect(mbr.halfSize.y).toBeCloseTo(Math.sqrt(2) / 2)
      expect(mbr.center.x).toBeCloseTo(1)
      expect(mbr.center.y).toBeCloseTo(0)
      expect(Math.abs(mbr.rotation)).toBeCloseTo(Math.PI / 4)
    })

    it('basic example', () => {
      const points = [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
      ].map(([x, y]) => new Vector2(x, y))

      const mbr = new MBR()
      mbr.fromPoints(points)

      expect(mbr.halfSize.x).toBeCloseTo(0.5)
      expect(mbr.halfSize.y).toBeCloseTo(0.5)
      expect(mbr.rotation).toBeCloseTo(0)
    })

    it('should contain all input points', () => {
      // Test invariant: all input points must lie within the computed MBR
      const points = circlePoints(37, 5)
      const mbr = new MBR()
      mbr.fromPoints(points)

      // Transform each point into the MBR's local coordinate frame
      const cos = Math.cos(-mbr.rotation)
      const sin = Math.sin(-mbr.rotation)
      for (const p of points) {
        const dx = p.x - mbr.center.x
        const dy = p.y - mbr.center.y
        const localX = dx * cos - dy * sin
        const localY = dx * sin + dy * cos
        expect(Math.abs(localX)).toBeLessThanOrEqual(mbr.halfSize.x + 1e-10)
        expect(Math.abs(localY)).toBeLessThanOrEqual(mbr.halfSize.y + 1e-10)
      }
    })

    it('should have area at least convex hull area for circle approximation', () => {
      const points = circlePoints(64, 5)
      const mbr = new MBR()
      mbr.fromPoints(points)

      const area = 4 * mbr.halfSize.x * mbr.halfSize.y
      // Circle area ≈ π × 5² ≈ 78.5, MBR should be at least that
      expect(area).toBeGreaterThan(78)
    })
  })

  describe('vector2', () => {
    it('normalize should produce unit vector', () => {
      const v = new Vector2(3, 4)
      const n = v.normalize()
      expect(n.length()).toBeCloseTo(1)
      expect(n.x).toBeCloseTo(0.6)
      expect(n.y).toBeCloseTo(0.8)
    })

    it('angle should return correct polar angle', () => {
      expect(new Vector2(1, 0).angle()).toBeCloseTo(0)
      expect(new Vector2(0, 1).angle()).toBeCloseTo(Math.PI / 2)
      expect(new Vector2(-1, 0).angle()).toBeCloseTo(Math.PI)
      expect(new Vector2(0, -1).angle()).toBeCloseTo(-Math.PI / 2)
    })

    it('set should modify in place', () => {
      const v = new Vector2(1, 2)
      const r = v.set(5, 6)
      expect(r).toBe(v) // returns this
      expect(v.x).toEqual(5)
      expect(v.y).toEqual(6)
    })

    it('copyFrom should copy values from another vector', () => {
      const a = new Vector2(3, 4)
      const b = new Vector2(0, 0)
      b.copyFrom(a)
      expect(b.x).toEqual(3)
      expect(b.y).toEqual(4)
      // b should be independent
      a.x = 7
      expect(b.x).toEqual(3)
    })

    it('setFromSub should compute difference in place', () => {
      const a = new Vector2(7, 9)
      const b = new Vector2(3, 5)
      const result = new Vector2(0, 0).setFromSub(a, b)
      expect(result.x).toEqual(4)
      expect(result.y).toEqual(4)
    })

    it('sub should return new difference vector', () => {
      const result = new Vector2(7, 9).sub(new Vector2(3, 5))
      expect(result.x).toEqual(4)
      expect(result.y).toEqual(4)
      expect(result).not.toBe(new Vector2(4, 4)) // new instance
    })

    it('add should return new sum vector', () => {
      const result = new Vector2(2, 3).add(new Vector2(4, 5))
      expect(result.x).toEqual(6)
      expect(result.y).toEqual(8)
    })

    it('scale should return new scaled vector', () => {
      const result = new Vector2(3, 4).scale(2)
      expect(result.x).toEqual(6)
      expect(result.y).toEqual(8)
    })
  })

  describe('utility functions', () => {
    it('getProj should compute scalar projection', () => {
      const point = new Vector2(3, 4)
      const edge = new Vector2(1, 0)
      expect(getProj(point, edge)).toBeCloseTo(3)
    })

    it('getMinMaxProj should find extremes', () => {
      const points = [
        [0, 0],
        [3, 0],
        [1, 0],
      ].map(([x, y]) => new Vector2(x, y))
      const edge = new Vector2(1, 0)
      const { min, max } = getMinMaxProj(points, edge)
      expect(min).toBeCloseTo(0)
      expect(max).toBeCloseTo(3)
    })

    it('getCenter should compute centroid', () => {
      const points = [
        [0, 0],
        [2, 0],
        [0, 2],
      ].map(([x, y]) => new Vector2(x, y))
      const center = getCenter(points)
      expect(center.x).toBeCloseTo(2 / 3)
      expect(center.y).toBeCloseTo(2 / 3)
    })
  })
})

describe('edge cases', () => {
  it('empty input yields an empty hull and a zero box', () => {
    const mbr = new MBR()

    expect(mbr.grahamScan([])).toEqual([])

    mbr.fromPoints([])
    expect(mbr.halfSize.x).toBe(0)
    expect(mbr.halfSize.y).toBe(0)
    expect(mbr.center.x).toBe(0)
    expect(mbr.center.y).toBe(0)
    expect(mbr.rotation).toBe(0)
  })

  it('single point yields a one-vertex hull and a zero box', () => {
    const mbr = new MBR()
    const p = new Vector2(3, -4)

    expect(mbr.grahamScan([p])).toEqual([p])

    mbr.fromPoints([p])
    expect(mbr.halfSize.x).toBe(0)
    expect(mbr.halfSize.y).toBe(0)
  })

  it('all points identical yields a single-vertex hull (no undefined entry)', () => {
    const mbr = new MBR()
    const p = new Vector2(1, 2)

    const hull = mbr.grahamScan([p, p, p])
    expect(hull).toEqual([p])
    expect(hull).toHaveLength(1)

    mbr.fromPoints([p, p, p])
    expect(mbr.halfSize.x).toBe(0)
    expect(mbr.halfSize.y).toBe(0)
  })

  it('two distinct points keep the bottom-most point first', () => {
    const mbr = new MBR()
    const a = new Vector2(0, 1)
    const b = new Vector2(1, 0)

    expect(mbr.grahamScan([a, b])).toEqual([b, a])
    expect(mbr.grahamScan([b, a])).toEqual([b, a])
  })

  it('resets the box when called again with an empty input', () => {
    const mbr = new MBR()
    mbr.fromPoints([new Vector2(0, 0), new Vector2(2, 0), new Vector2(2, 1), new Vector2(0, 1)])
    expect(mbr.halfSize.x).toBeCloseTo(1)

    mbr.fromPoints([])
    expect(mbr.halfSize.x).toBe(0)
    expect(mbr.halfSize.y).toBe(0)
    expect(mbr.center.x).toBe(0)
    expect(mbr.center.y).toBe(0)
    expect(mbr.rotation).toBe(0)
  })

  it('terminates on a degenerate collinear hull (regression: infinite loop)', () => {
    const mbr = new MBR()
    const collinear = [0, 1, 2, 3].map(i => new Vector2(i, i * 2))

    const result = mbr.rotatingCalipers(collinear)

    expect(result.halfSize.x).toBe(0)
    expect(result.halfSize.y).toBe(0)
    expect(result.center.x).toBe(0)
    expect(result.center.y).toBe(0)
    expect(result.rotation).toBe(0)
  }, 2000)

  it('terminates on a hull of identical vertices and produces no NaN', () => {
    const mbr = new MBR()
    const p = new Vector2(5, 5)
    const result = mbr.rotatingCalipers([p, p, p])

    expect(Number.isNaN(result.halfSize.x)).toBe(false)
    expect(Number.isNaN(result.halfSize.y)).toBe(false)
    expect(result.halfSize.x).toBe(0)
    expect(result.halfSize.y).toBe(0)
  }, 2000)

  it('handles a large collinear input without hanging', () => {
    const mbr = new MBR()
    const points = Array.from({ length: 5000 }, (_, i) => new Vector2(i, i))

    expect(() => mbr.fromPoints(points)).not.toThrow()
    expect(mbr.halfSize.x).toBe(0)
    expect(mbr.halfSize.y).toBe(0)
  }, 5000)

  it('does not mutate the input array', () => {
    const mbr = new MBR()
    const points = randomPoints(1000, 100, 7)
    const snapshot = points.slice()

    mbr.fromPoints(points)

    expect(points).toEqual(snapshot)
  })

  it('handles duplicate-heavy inputs', () => {
    const mbr = new MBR()
    const points = [...circlePoints(100, 5), ...circlePoints(100, 5)]

    mbr.fromPoints(points)

    // the duplicates collapse; the result is the same as the unique set
    const unique = new MBR()
    unique.fromPoints(circlePoints(100, 5))
    expect(mbr.halfSize.x).toBeCloseTo(unique.halfSize.x)
    expect(mbr.halfSize.y).toBeCloseTo(unique.halfSize.y)
  })
})

describe('prefilter invariants', () => {
  // Datasets on both sides of the prefilter threshold, plus hull-heavy input
  // where the prefilter must decline to run.
  const datasets: [string, Vector2[]][] = [
    ['random 120 (below threshold)', randomPoints(120, 10, 11)],
    ['random 600', randomPoints(600, 20, 14)],
    ['random 1k', randomPoints(1000, 100, 12)],
    ['random 20k', randomPoints(20000, 1000, 13)],
    ['grid 64x64', Array.from({ length: 4096 }, (_, i) => new Vector2(i % 64, Math.floor(i / 64)))],
    ['circle 5k', circlePoints(5000, 10)],
  ]

  for (const [name, points] of datasets) {
    it(`selects the same hull with and without the prefilter (${name})`, () => {
      const mbr = new MBR()
      const hull = mbr.grahamScan(points)
      const reference = referenceHull(points)

      expect(hullKey(hull)).toBe(hullKey(reference))
    })

    it(`matches the brute-force minimum area (${name})`, () => {
      const mbr = new MBR()
      mbr.fromPoints(points)

      const area = 4 * mbr.halfSize.x * mbr.halfSize.y
      const reference = referenceMinArea(points)

      expect(Math.abs(area - reference) / reference).toBeLessThan(1e-9)
    })

    it(`contains every point (${name})`, () => {
      const mbr = new MBR()
      mbr.fromPoints(points)

      const cos = Math.cos(-mbr.rotation)
      const sin = Math.sin(-mbr.rotation)
      for (const p of points) {
        const dx = p.x - mbr.center.x
        const dy = p.y - mbr.center.y
        const localX = Math.abs(dx * cos - dy * sin)
        const localY = Math.abs(dx * sin + dy * cos)
        expect(localX).toBeLessThanOrEqual(mbr.halfSize.x + 1e-9)
        expect(localY).toBeLessThanOrEqual(mbr.halfSize.y + 1e-9)
      }
    })
  }
})

// --- independent reference implementations, deliberately not sharing code ---

function hullKey(hull: Vector2[]): string {
  return hull.map(p => `${p.x},${p.y}`).sort().join(';')
}

function turn(o: Vector2, a: Vector2, b: Vector2): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
}

/** Andrew's monotone chain, used only as a test oracle. */
function referenceHull(points: Vector2[]): Vector2[] {
  const sorted = points.slice().sort((a, b) => a.x - b.x || a.y - b.y)
  const unique: Vector2[] = []
  for (const p of sorted) {
    const last = unique[unique.length - 1]
    if (!last || last.x !== p.x || last.y !== p.y)
      unique.push(p)
  }
  if (unique.length < 3)
    return unique

  const lower: Vector2[] = []
  for (const p of unique) {
    while (lower.length >= 2 && turn(lower[lower.length - 2], lower[lower.length - 1], p) <= 0)
      lower.pop()
    lower.push(p)
  }
  const upper: Vector2[] = []
  for (let i = unique.length - 1; i >= 0; i--) {
    const p = unique[i]
    while (upper.length >= 2 && turn(upper[upper.length - 2], upper[upper.length - 1], p) <= 0)
      upper.pop()
    upper.push(p)
  }
  lower.pop()
  upper.pop()
  return lower.concat(upper)
}

/** Brute force: one candidate rectangle per hull edge, O(h * n). */
function referenceMinArea(points: Vector2[]): number {
  const hull = referenceHull(points)
  if (hull.length < 3)
    return 0

  let best = Infinity
  for (let i = 0; i < hull.length; i++) {
    const a = hull[i]
    const b = hull[(i + 1) % hull.length]
    const ex = b.x - a.x
    const ey = b.y - a.y
    const length = Math.hypot(ex, ey)
    if (length === 0)
      continue
    const ux = ex / length
    const uy = ey / length

    let minU = Infinity
    let maxU = -Infinity
    let minV = Infinity
    let maxV = -Infinity
    for (const p of points) {
      const u = p.x * ux + p.y * uy
      const v = -p.x * uy + p.y * ux
      if (u < minU)
        minU = u
      if (u > maxU)
        maxU = u
      if (v < minV)
        minV = v
      if (v > maxV)
        maxV = v
    }

    const area = (maxU - minU) * (maxV - minV)
    if (area < best)
      best = area
  }
  return best
}

function randomPoints(n: number, range: number, seed: number): Vector2[] {
  const rnd = mulberry32(seed)
  const out: Vector2[] = []
  for (let i = 0; i < n; i++)
    out.push(new Vector2((rnd() - 0.5) * 2 * range, (rnd() - 0.5) * 2 * range))
  return out
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6D2B79F5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function circlePoints(n: number, radius: number): Vector2[] {
  const pts: Vector2[] = []
  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i) / n
    pts.push(new Vector2(Math.cos(angle) * radius, Math.sin(angle) * radius))
  }
  return pts
}
