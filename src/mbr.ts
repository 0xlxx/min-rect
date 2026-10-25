import { Vector2 } from './math'

/**
 * The minimum-area rectangle is determined by the convex hull only, so points
 * that are strictly inside the hull of a few extreme points can be discarded
 * before sorting (Akl & Toussaint, 1978). The prefilter costs O(n) and turns
 * the usual O(n log n) sort over every point into a sort over the few that can
 * actually be hull vertices.
 *
 * Below this many points the extra pass is not worth it.
 */
const PREFILTER_MIN_POINTS = 512
/** How many points are sampled to decide whether the prefilter pays off. */
const PREFILTER_SAMPLE_SIZE = 128
/** Skip the prefilter when this share of the sample survives it. */
const PREFILTER_SURVIVOR_RATIO = 0.4
/** Multiplicative-hash step, used to sample input-order-independently. */
const SAMPLE_STEP = 0x9E3779B1

interface Box {
  halfWidth: number
  halfHeight: number
  centerX: number
  centerY: number
  rotation: number
}

export class MBR {
  public halfSize: Vector2 = new Vector2(0, 0)
  public center: Vector2 = new Vector2(0, 0)
  public rotation: number = 0

  private readonly _box: Box = {
    halfWidth: 0,
    halfHeight: 0,
    centerX: 0,
    centerY: 0,
    rotation: 0,
  }

  constructor() {}

  public fromPoints(points: Vector2[]): void {
    const hull = this.grahamScan(points)
    rotateCalipers(hull, this._box)
    this.halfSize.set(this._box.halfWidth, this._box.halfHeight)
    this.center.set(this._box.centerX, this._box.centerY)
    this.rotation = this._box.rotation
  }

  public grahamScan(points: Vector2[]): Vector2[] {
    if (points.length < PREFILTER_MIN_POINTS)
      return hullOf(points)
    return hullOf(prefilter(points) ?? points)
  }

  public rotatingCalipers(hull: Vector2[]): { halfSize: Vector2, rotation: number, center: Vector2 } {
    rotateCalipers(hull, this._box)
    return {
      halfSize: new Vector2(this._box.halfWidth, this._box.halfHeight),
      rotation: this._box.rotation,
      center: new Vector2(this._box.centerX, this._box.centerY),
    }
  }
}

/**
 * Convex hull by Graham scan. Returns vertices counter-clockwise, starting at
 * the bottom-most (then left-most) point, with collinear points removed.
 */
function hullOf(points: Vector2[]): Vector2[] {
  const n = points.length
  if (n === 0)
    return []
  if (n === 1)
    return [points[0]]
  if (n === 2) {
    const a = points[0]
    const b = points[1]
    if (a.equals(b))
      return [a]
    const aIsBottom = a.y < b.y || (a.y === b.y && a.x < b.x)
    return aIsBottom ? [a, b] : [b, a]
  }

  let bottom = points[0]
  for (let i = 1; i < n; i++) {
    const p = points[i]
    if (p.y < bottom.y || (p.y === bottom.y && p.x < bottom.x))
      bottom = p
  }

  const bx = bottom.x
  const by = bottom.y
  const sorted: Vector2[] = []
  for (let i = 0; i < n; i++) {
    const p = points[i]
    if (p.x !== bx || p.y !== by)
      sorted.push(p)
  }

  // Every point was a duplicate of the bottom one.
  if (sorted.length === 0)
    return [bottom]

  // All points share `bottom`'s half-plane, so the sign of the cross product
  // orders them by polar angle; ties are ordered by distance.
  sorted.sort((a, b) => {
    const ax = a.x - bx
    const ay = a.y - by
    const cx = b.x - bx
    const cy = b.y - by
    const cross = ax * cy - ay * cx
    if (cross > 0)
      return -1
    if (cross < 0)
      return 1
    return ax * ax + ay * ay - (cx * cx + cy * cy)
  })

  const stack: Vector2[] = [bottom, sorted[0]]
  let k = 2
  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i]
    while (k > 1) {
      const top = stack[k - 1]
      const last = stack[k - 2]
      const turn = (top.x - last.x) * (next.y - top.y) - (top.y - last.y) * (next.x - top.x)
      if (turn <= 0)
        k--
      else
        break
    }
    stack[k++] = next
  }
  stack.length = k
  return stack
}

/**
 * Returns the points that may still be hull vertices, or `null` when the input
 * is hull-heavy enough that filtering would cost more than it saves.
 */
function prefilter(points: Vector2[]): Vector2[] | null {
  const n = points.length
  const sampleSize = Math.min(n, PREFILTER_SAMPLE_SIZE)

  // Sample the whole input, not a prefix: sorted or gridded input would
  // otherwise give a completely unrepresentative sample.
  const probes: Vector2[] = []
  for (let i = 0; i < sampleSize; i++)
    probes.push(points[(Math.imul(i + 1, SAMPLE_STEP) >>> 0) % n])

  const probe = octagon(probes)
  if (probe === null)
    return null

  if (countSurvivors(probes, probe) >= sampleSize * PREFILTER_SURVIVOR_RATIO)
    return null

  const poly = octagon(points)
  if (poly === null)
    return null
  return filterByPolygon(points, poly)
}

/**
 * Convex hull of the extreme points along x, y, x+y and x-y. Every point
 * strictly inside this octagon is strictly inside the input's hull.
 */
function octagon(points: Vector2[]): Vector2[] | null {
  const n = points.length
  if (n < 3)
    return null

  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  let minSum = Infinity
  let maxSum = -Infinity
  let minDiff = Infinity
  let maxDiff = -Infinity

  let byMinX = points[0]
  let byMaxX = points[0]
  let byMinY = points[0]
  let byMaxY = points[0]
  let byMinSum = points[0]
  let byMaxSum = points[0]
  let byMinDiff = points[0]
  let byMaxDiff = points[0]

  for (let i = 0; i < n; i++) {
    const p = points[i]
    const x = p.x
    const y = p.y
    const sum = x + y
    const diff = x - y

    if (x < minX) {
      minX = x
      byMinX = p
    }
    if (x > maxX) {
      maxX = x
      byMaxX = p
    }
    if (y < minY) {
      minY = y
      byMinY = p
    }
    if (y > maxY) {
      maxY = y
      byMaxY = p
    }
    if (sum < minSum) {
      minSum = sum
      byMinSum = p
    }
    if (sum > maxSum) {
      maxSum = sum
      byMaxSum = p
    }
    if (diff < minDiff) {
      minDiff = diff
      byMinDiff = p
    }
    if (diff > maxDiff) {
      maxDiff = diff
      byMaxDiff = p
    }
  }

  const poly = hullOf([
    byMinX,
    byMaxX,
    byMinY,
    byMaxY,
    byMinSum,
    byMaxSum,
    byMinDiff,
    byMaxDiff,
  ])
  return poly.length >= 3 ? poly : null
}

/** Counts the points that are on or outside the (counter-clockwise) polygon. */
function countSurvivors(points: Vector2[], poly: Vector2[]): number {
  const m = poly.length
  let kept = 0
  for (let i = 0; i < points.length; i++) {
    if (!isStrictlyInside(points[i], poly, m))
      kept++
  }
  return kept
}

function filterByPolygon(points: Vector2[], poly: Vector2[]): Vector2[] {
  const m = poly.length
  const out: Vector2[] = []
  for (let i = 0; i < points.length; i++) {
    const p = points[i]
    if (!isStrictlyInside(p, poly, m))
      out.push(p)
  }
  return out
}

function isStrictlyInside(p: Vector2, poly: Vector2[], m: number): boolean {
  for (let k = 0; k < m; k++) {
    const a = poly[k]
    const b = poly[k + 1 === m ? 0 : k + 1]
    if ((b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x) <= 0)
      return false
  }
  return true
}

/**
 * Rotating calipers (Toussaint, 1983).
 *
 * Edges are kept unnormalized: support points only need the sign of a
 * projection, and the area is `(maxE - minE) * (maxP - minP) / |e|^2`. Areas
 * are compared by cross-multiplication, so the loop has no sqrt and no
 * division; both are applied once to the winning box.
 */
function rotateCalipers(hull: Vector2[], out: Box): void {
  out.halfWidth = 0
  out.halfHeight = 0
  out.centerX = 0
  out.centerY = 0
  out.rotation = 0

  const n = hull.length
  if (n < 3)
    return

  // Skip duplicate vertices so the starting edge has a direction. Hulls built
  // by `grahamScan` never contain them, but `rotatingCalipers` is public.
  let start = 0
  let startNext = 1
  while (start < n) {
    startNext = start + 1 === n ? 0 : start + 1
    const a = hull[start]
    const b = hull[startNext]
    if (a.x !== b.x || a.y !== b.y)
      break
    start++
  }
  if (start === n)
    return

  let ex = hull[startNext].x - hull[start].x
  let ey = hull[startNext].y - hull[start].y
  let px = -ey
  let py = ex

  let iLeft = 0
  let iRight = 0
  let iTop = 0
  let iBottom = 0
  {
    let minE = Infinity
    let maxE = -Infinity
    let minP = Infinity
    let maxP = -Infinity
    for (let j = 0; j < n; j++) {
      const q = hull[j]
      const projE = q.x * ex + q.y * ey
      const projP = q.x * px + q.y * py
      if (projE < minE) {
        minE = projE
        iLeft = j
      }
      if (projE > maxE) {
        maxE = projE
        iRight = j
      }
      if (projP < minP) {
        minP = projP
        iBottom = j
      }
      if (projP > maxP) {
        maxP = projP
        iTop = j
      }
    }
    // All vertices lie on one line: there is no rectangle to report. This also
    // keeps the support loops below from walking the hull forever.
    if (minP === maxP)
      return
  }

  let bestScaledArea = Infinity
  let bestLengthSq = 1
  let bestDeltaE = 0
  let bestDeltaP = 0
  let bestEX = 1
  let bestEY = 0
  let bestMinE = 0
  let bestMaxE = 0
  let bestMinP = 0
  let bestMaxP = 0

  for (let k = 0; k < n; k++) {
    const i = start + k < n ? start + k : start + k - n
    const p0 = hull[i]
    const p1 = hull[i + 1 === n ? 0 : i + 1]
    ex = p1.x - p0.x
    ey = p1.y - p0.y
    // A repeated vertex has no direction; the previous box already covered it.
    if (ex === 0 && ey === 0)
      continue
    px = -ey
    py = ex

    // Each support only moves forward. A full lap would mean every projection
    // is equal, which cannot happen on a non-degenerate hull.
    let cur = hull[iLeft]
    let next = iLeft + 1 === n ? 0 : iLeft + 1
    let nxt = hull[next]
    while ((nxt.x - cur.x) * ex + (nxt.y - cur.y) * ey <= 0) {
      iLeft = next
      cur = nxt
      next = next + 1 === n ? 0 : next + 1
      nxt = hull[next]
    }
    cur = hull[iRight]
    next = iRight + 1 === n ? 0 : iRight + 1
    nxt = hull[next]
    while ((nxt.x - cur.x) * ex + (nxt.y - cur.y) * ey >= 0) {
      iRight = next
      cur = nxt
      next = next + 1 === n ? 0 : next + 1
      nxt = hull[next]
    }
    cur = hull[iTop]
    next = iTop + 1 === n ? 0 : iTop + 1
    nxt = hull[next]
    while ((nxt.x - cur.x) * px + (nxt.y - cur.y) * py >= 0) {
      iTop = next
      cur = nxt
      next = next + 1 === n ? 0 : next + 1
      nxt = hull[next]
    }
    cur = hull[iBottom]
    next = iBottom + 1 === n ? 0 : iBottom + 1
    nxt = hull[next]
    while ((nxt.x - cur.x) * px + (nxt.y - cur.y) * py <= 0) {
      iBottom = next
      cur = nxt
      next = next + 1 === n ? 0 : next + 1
      nxt = hull[next]
    }

    const ql = hull[iLeft]
    const qr = hull[iRight]
    const qb = hull[iBottom]
    const qt = hull[iTop]

    const minE = ql.x * ex + ql.y * ey
    const maxE = qr.x * ex + qr.y * ey
    const minP = qb.x * px + qb.y * py
    const maxP = qt.x * px + qt.y * py
    const deltaE = maxE - minE
    const deltaP = maxP - minP
    const lengthSq = ex * ex + ey * ey

    // area = deltaE * deltaP / lengthSq, compared without dividing
    if (deltaE * deltaP * bestLengthSq < bestScaledArea * lengthSq) {
      bestScaledArea = deltaE * deltaP
      bestLengthSq = lengthSq
      bestDeltaE = deltaE
      bestDeltaP = deltaP
      bestEX = ex
      bestEY = ey
      bestMinE = minE
      bestMaxE = maxE
      bestMinP = minP
      bestMaxP = maxP
    }
  }

  const length = Math.sqrt(bestLengthSq)
  const midE = (bestMinE + bestMaxE) / 2
  const midP = (bestMinP + bestMaxP) / 2
  const invLengthSq = 1 / bestLengthSq

  out.halfWidth = bestDeltaE / (2 * length)
  out.halfHeight = bestDeltaP / (2 * length)
  out.rotation = Math.atan2(bestEY, bestEX)
  out.centerX = (midE * bestEX - midP * bestEY) * invLengthSq
  out.centerY = (midE * bestEY + midP * bestEX) * invLengthSq
}
