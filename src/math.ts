export class Vector2 {
  public x: number
  public y: number

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }

  dot(other: Vector2): number {
    return this.x * other.x + this.y * other.y
  }

  equals(other: Vector2): boolean {
    return this.x === other.x && this.y === other.y
  }

  cross(other: Vector2): number {
    return this.x * other.y - this.y * other.x
  }

  sub(other: Vector2): Vector2 {
    return new Vector2(this.x - other.x, this.y - other.y)
  }

  add(other: Vector2): Vector2 {
    return new Vector2(this.x + other.x, this.y + other.y)
  }

  scale(scalar: number): Vector2 {
    return new Vector2(this.x * scalar, this.y * scalar)
  }

  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y)
  }

  normalize(): Vector2 {
    const length = this.length()
    return new Vector2(this.x / length, this.y / length)
  }

  angle(): number {
    return Math.atan2(this.y, this.x)
  }
}

export function getProj(point: Vector2, edge: Vector2): number {
  return point.dot(edge) / edge.length()
}

export function getMinMaxProj(points: Vector2[], edge: Vector2): { min: number, max: number } {
  let min = Infinity
  let max = -Infinity

  for (const point of points) {
    const proj = getProj(point, edge)
    min = Math.min(min, proj)
    max = Math.max(max, proj)
  }

  return { min, max }
}

export function getCenter(points: Vector2[]): Vector2 {
  let center = new Vector2(0, 0)
  for (const point of points) {
    center = center.add(point)
  }
  return center.scale(1 / points.length)
}
