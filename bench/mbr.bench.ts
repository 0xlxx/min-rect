import { bench, describe } from 'vitest'
import { Vector2 } from '../src/math'
import { MBR } from '../src/mbr'

function randomPoints(n: number, range: number): Vector2[] {
  const pts: Vector2[] = []
  for (let i = 0; i < n; i++) {
    pts.push(new Vector2(
      (Math.random() - 0.5) * 2 * range,
      (Math.random() - 0.5) * 2 * range,
    ))
  }
  return pts
}

function circlePoints(n: number, radius: number): Vector2[] {
  const pts: Vector2[] = []
  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i) / n
    pts.push(new Vector2(Math.cos(angle) * radius, Math.sin(angle) * radius))
  }
  return pts
}

// Pre-generate datasets (stable across bench iterations via vitest's setup)
const tinySquare = [
  new Vector2(0, 0),
  new Vector2(1, 0),
  new Vector2(0, 1),
  new Vector2(1, 1),
]
const smallRandom = randomPoints(20, 10)
const circle100 = circlePoints(100, 10)
const largeRandom = randomPoints(1000, 100)
const circle200 = circlePoints(200, 10)

const mbr = new MBR()

describe('grahamScan', () => {
  bench('tiny square (4 pts)', () => {
    mbr.grahamScan(tinySquare)
  })

  bench('small random (20 pts)', () => {
    mbr.grahamScan(smallRandom)
  })

  bench('circle (100 pts)', () => {
    mbr.grahamScan(circle100)
  })

  bench('large random (1000 pts)', () => {
    mbr.grahamScan(largeRandom)
  })

  bench('circle (200 pts)', () => {
    mbr.grahamScan(circle200)
  })
})

describe('rotatingCalipers', () => {
  const hullTiny = mbr.grahamScan(tinySquare)
  const hullSmall = mbr.grahamScan(smallRandom)
  const hull100 = mbr.grahamScan(circle100)
  const hullLarge = mbr.grahamScan(largeRandom)
  const hull200 = mbr.grahamScan(circle200)

  bench('tiny (4 hull pts)', () => {
    mbr.rotatingCalipers(hullTiny)
  })

  bench('small (~10 hull pts)', () => {
    mbr.rotatingCalipers(hullSmall)
  })

  bench('circle (100 hull pts)', () => {
    mbr.rotatingCalipers(hull100)
  })

  bench('large (~30 hull pts)', () => {
    mbr.rotatingCalipers(hullLarge)
  })

  bench('circle (200 hull pts)', () => {
    mbr.rotatingCalipers(hull200)
  })
})

describe('fromPoints (end-to-end)', () => {
  bench('tiny square (4 pts)', () => {
    mbr.fromPoints(tinySquare)
  })

  bench('small random (20 pts)', () => {
    mbr.fromPoints(smallRandom)
  })

  bench('circle (100 pts)', () => {
    mbr.fromPoints(circle100)
  })

  bench('large random (1000 pts)', () => {
    mbr.fromPoints(largeRandom)
  })

  bench('circle (200 pts)', () => {
    mbr.fromPoints(circle200)
  })
})
