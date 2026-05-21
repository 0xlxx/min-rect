import { Vector2 } from './math'

export class MBR {
  public halfSize: Vector2 = new Vector2(0, 0)
  public center: Vector2 = new Vector2(0, 0)
  public rotation: number = 0

  constructor() {}

  public fromPoints(points: Vector2[]): void {
    const convexHull = this.grahamScan(points)
    const result = this.rotatingCalipers(convexHull)
    this.halfSize = result.halfSize
    this.rotation = result.rotation
    this.center = result.center
  }

  private _tmpA = new Vector2(0, 0)
  private _tmpB = new Vector2(0, 0)

  public grahamScan(points: Vector2[]): Vector2[] {
    const bottom = points.reduce((prev, curr) => {
      if (prev.y < curr.y)
        return prev
      else if (prev.y > curr.y)
        return curr
      else return prev.x < curr.x ? prev : curr
    }, points[0])

    const sorted = points
      .filter(p => !p.equals(bottom))
      .sort((a, b) => {
        // Cross-product based polar angle comparison (faster than atan2)
        const da = this._tmpA.setFromSub(a, bottom)
        const db = this._tmpB.setFromSub(b, bottom)
        const cross = da.cross(db)

        if (Math.abs(cross) < Number.EPSILON) {
          // Collinear: closer point first
          return da.x * da.x + da.y * da.y - db.x * db.x - db.y * db.y
        }

        return -cross // negative cross -> clockwise (larger angle) -> later in sort
      })

    const stack = [bottom, sorted[0]]

    for (let i = 1; i < sorted.length; i++) {
      const next = sorted[i]

      while (stack.length > 1) {
        const top = stack[stack.length - 1]
        const last = stack[stack.length - 2]

        const v1 = this._tmpA.setFromSub(top, last)
        const v2 = this._tmpB.setFromSub(next, top)

        if (v1.cross(v2) <= 0)
          stack.pop()
        else
          break
      }
      stack.push(next)
    }

    return stack
  }

  public rotatingCalipers(hull: Vector2[]): { halfSize: Vector2, rotation: number, center: Vector2 } {
    const n = hull.length
    if (n < 3) {
      return {
        halfSize: new Vector2(0, 0),
        rotation: 0,
        center: new Vector2(0, 0),
      }
    }

    let minArea = Infinity
    const resultHalf = new Vector2(0, 0)
    let resultRot = 0
    const resultCenter = new Vector2(0, 0)

    let iLeft = 0
    let iRight = 0
    let iTop = 0
    let iBottom = 0

    // Initialize extreme points by scanning first edge
    {
      const p0 = hull[0]
      const p1 = hull[1]
      const ex = p1.x - p0.x
      const ey = p1.y - p0.y
      const elen = Math.sqrt(ex * ex + ey * ey)
      const enx = ex / elen
      const eny = ey / elen
      const pnx = -eny
      const pny = enx
      let minE = Infinity
      let maxE = -Infinity
      let minP = Infinity
      let maxP = -Infinity
      for (let j = 0; j < n; j++) {
        const pe = hull[j].x * enx + hull[j].y * eny
        const pp = hull[j].x * pnx + hull[j].y * pny
        if (pe < minE) {
          minE = pe
          iLeft = j
        }
        if (pe > maxE) {
          maxE = pe
          iRight = j
        }
        if (pp < minP) {
          minP = pp
          iBottom = j
        }
        if (pp > maxP) {
          maxP = pp
          iTop = j
        }
      }
    }

    for (let i = 0; i < n; i++) {
      const p0 = hull[i]
      const p1 = hull[(i + 1) % n]

      const edgeX = p1.x - p0.x
      const edgeY = p1.y - p0.y
      const edgeLen = Math.sqrt(edgeX * edgeX + edgeY * edgeY)
      const enx = edgeX / edgeLen
      const eny = edgeY / edgeLen
      const pnx = -eny
      const pny = enx

      // Advance iLeft (minimum edge projection)
      while (true) {
        const cur = hull[iLeft]
        const nxt = hull[(iLeft + 1) % n]
        if ((nxt.x - cur.x) * enx + (nxt.y - cur.y) * eny <= 0)
          iLeft = (iLeft + 1) % n
        else
          break
      }

      // Advance iRight (maximum edge projection)
      while (true) {
        const cur = hull[iRight]
        const nxt = hull[(iRight + 1) % n]
        if ((nxt.x - cur.x) * enx + (nxt.y - cur.y) * eny >= 0)
          iRight = (iRight + 1) % n
        else
          break
      }

      // Advance iTop (maximum perp projection)
      while (true) {
        const cur = hull[iTop]
        const nxt = hull[(iTop + 1) % n]
        if ((nxt.x - cur.x) * pnx + (nxt.y - cur.y) * pny >= 0)
          iTop = (iTop + 1) % n
        else
          break
      }

      // Advance iBottom (minimum perp projection)
      while (true) {
        const cur = hull[iBottom]
        const nxt = hull[(iBottom + 1) % n]
        if ((nxt.x - cur.x) * pnx + (nxt.y - cur.y) * pny <= 0)
          iBottom = (iBottom + 1) % n
        else
          break
      }

      const projLeft = hull[iLeft].x * enx + hull[iLeft].y * eny
      const projRight = hull[iRight].x * enx + hull[iRight].y * eny
      const width = projRight - projLeft

      const projBottom = hull[iBottom].x * pnx + hull[iBottom].y * pny
      const projTop = hull[iTop].x * pnx + hull[iTop].y * pny
      const height = projTop - projBottom

      const area = width * height
      if (area < minArea) {
        minArea = area
        resultHalf.set(width / 2, height / 2)
        resultRot = Math.atan2(eny, enx)
        resultCenter.set(
          (projLeft + projRight) / 2 * enx + (projBottom + projTop) / 2 * pnx,
          (projLeft + projRight) / 2 * eny + (projBottom + projTop) / 2 * pny,
        )
      }
    }

    return { halfSize: resultHalf, rotation: resultRot, center: resultCenter }
  }
}
