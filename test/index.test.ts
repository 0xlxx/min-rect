import { describe, expect, it } from 'vitest'
import { Vector2 } from '../src/math'
import { MBR } from '../src/mbr'

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

    it('should handle points with interior points correctly', () => {
      const points = [
        [0, 0],
        [2, 0],
        [2, 2],
        [0, 2], // outer points
        [1, 1], // inner point
      ].map(([x, y]) => new Vector2(x, y))

      const mbr = new MBR()
      const convexHull = mbr.grahamScan(points)

      expect(convexHull.length).toEqual(4)
      expect(convexHull).toEqual([
        [0, 0],
        [2, 0],
        [2, 2],
        [0, 2],
      ].map(([x, y]) => new Vector2(x, y)))
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
  })
})
