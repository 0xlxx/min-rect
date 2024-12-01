import { getCenter, getMinMaxProj, Vector2 } from './math'

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
    this.center = getCenter(convexHull)
  }

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
        const angle_1 = a.sub(bottom).angle()
        const angle_2 = b.sub(bottom).angle()

        if (Math.abs(angle_1 - angle_2) < Number.EPSILON) {
          return a.sub(bottom).length() - b.sub(bottom).length()
        }

        return angle_1 - angle_2
      })

    const stack = [bottom, sorted[0]]

    for (let i = 1; i < sorted.length; i++) {
      const next = sorted[i]

      while (stack.length > 1) {
        const top = stack[stack.length - 1]
        const last = stack[stack.length - 2]

        const v1 = top.sub(last)
        const v2 = next.sub(top)

        if (v1.cross(v2) <= 0)
          stack.pop()
        else
          break
      }
      stack.push(next)
    }

    return stack
  }

  public rotatingCalipers(hull: Vector2[]): { halfSize: Vector2, rotation: number } {
    let minArea = Infinity
    const result = {
      halfSize: new Vector2(0, 0),
      rotation: 0,
    }

    const edges = hull.map((p, i) => {
      const next = hull[(i + 1) % hull.length]
      return next.sub(p).normalize()
    })

    for (const edge of edges) {
      const { min: left, max: right } = getMinMaxProj(hull, edge)
      const width = Math.abs(right - left)
      const { min: bottom, max: top } = getMinMaxProj(hull, new Vector2(-edge.y, edge.x))
      const height = Math.abs(top - bottom)

      const area = width * height

      if (area < minArea) {
        minArea = area
        result.halfSize = new Vector2(width / 2, height / 2)
        result.rotation = edge.angle()
      }
    }

    return result
  }
}
