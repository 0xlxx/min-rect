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

function circlePoints(n: number, radius: number): Vector2[] {
  const pts: Vector2[] = []
  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i) / n
    pts.push(new Vector2(Math.cos(angle) * radius, Math.sin(angle) * radius))
  }
  return pts
}
