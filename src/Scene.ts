import Mob from './Mob'
import { Position, Result } from './types'
import Phaser from 'phaser'

export default class Scene extends Phaser.Scene {
  public mobs!: Phaser.Physics.Arcade.Group
  public ORIGIN: Position = { x: 0, y: 0 }
  public towers!: Phaser.Physics.Arcade.StaticGroup

  private building!: Phaser.GameObjects.Arc
  private fireTime!: number
  private fireTarget!: Position
  private fireMuzzle!: Position
  private graphics!: Phaser.GameObjects.Graphics
  private gun!: Phaser.GameObjects.Rectangle
  private queen!: Mob
  private range!: number
  private readonly scout!: Mob
  private muzzle!: Phaser.GameObjects.Arc
  private tower!: Phaser.GameObjects.Container
  private tempMatrix!: Phaser.GameObjects.Components.TransformMatrix
  private tempParentMatrix!: Phaser.GameObjects.Components.TransformMatrix

  init (): void {
    this.cameras.main.setBackgroundColor('#FFFFFF')
  }

  create (): void {
    this.graphics = this.add.graphics()
    this.range = 500

    this.mobs = this.physics.add.group()
    this.queen = new Mob({
      scene: this, x: 150, y: 400, radius: 50, color: 0x000000
    })
    const worker = this.createWorker()
    worker.setVelocity({ x: -175, y: 100 })

    this.physics.add.collider(this.mobs, this.mobs)

    this.towers = this.physics.add.staticGroup()
    this.physics.add.collider(this.towers, this.mobs)

    this.tower = this.add.container(500, 500)
    this.tower.setSize(20, 20)

    this.towers.add(this.tower)

    if (this.tower.body instanceof Phaser.Physics.Arcade.StaticBody) {
      this.tower.body.setCircle(10)
    }

    this.building = this.add.circle(0, 0, 10, 0xff0000)
    this.tower.add(this.building)

    this.gun = this.add.rectangle(12, 0, 24, 3, 0xFF0000)
    this.tower.add(this.gun)

    this.muzzle = this.add.circle(24, 0)
    this.tower.add(this.muzzle)

    this.tempMatrix = new Phaser.GameObjects.Components.TransformMatrix()
    this.tempParentMatrix = new Phaser.GameObjects.Components.TransformMatrix()
  }

  createLine ({ a, b } = { a: this.ORIGIN, b: this.ORIGIN }): Phaser.Geom.Line {
    const line = new Phaser.Geom.Line(a.x, a.y, b.x, b.y)

    return line
  }

  attack ({ now, tracer, enemies }: {
    now: number
    tracer: Phaser.Geom.Line
    enemies: Phaser.GameObjects.Arc[]
  }): void {
    const target = this.getTarget({ line: tracer, targets: enemies })

    if (target.element != null) {
      this.fire({
        now,
        target: target.element,
        position: target.value
      })
    }
  }

  createRandom (range: number): number {
    const random = Math.random()
    const scaled = random * range
    const rounded = Math.floor(scaled)

    return rounded
  }

  createRange (step: number, _maximum = 1000): number[] {
    const values = []

    let current = step
    let lower = current < _maximum
    while (lower) {
      values.push(current)

      current = current + step
      lower = current < _maximum
    }

    return values
  }

  createRangeHorizontal (step: number): number[] {
    const values = this.createRange(step, 1000)

    return values
  }

  createWorker (): Mob {
    const x = this.createRandom(1000)
    const y = this.createRandom(1000)

    const worker = new Mob({
      scene: this, x, y, radius: 10, color: 0x000000
    })

    const dX = this.createRandom(200)
    const ddX = this.createRandom(2) - 0.5
    const vX = dX * ddX

    const dY = this.createRandom(200)
    const ddY = this.createRandom(2) - 0.5
    const vY = dY * ddY

    worker.setVelocity({ x: vX, y: vY })

    return worker
  }

  createTracer (): Phaser.Geom.Line {
    const tracer = this.createLine()

    Phaser.Geom.Line.SetToAngle(
      tracer, this.tower.x, this.tower.y, this.tower.rotation, this.range
    )

    return tracer
  }

  fire ({ now, target, position }: {
    now: number
    target: Phaser.GameObjects.Arc
    position: Position
  }): void {
    this.fireTime = now
    this.fireTarget = position

    this.muzzle.getWorldTransformMatrix(
      this.tempMatrix, this.tempParentMatrix
    )
    const decomposed: any = this.tempMatrix.decomposeMatrix()
    this.fireMuzzle = {
      x: decomposed.translateX, y: decomposed.translateY
    }

    target.destroy()

    this.createWorker()

    const length = this.mobs.getLength()
    if (length < 3) {
      this.createWorker()
    }
  }

  getLineToCircle ({ line, circle }: {
    line: Phaser.Geom.Line
    circle: Phaser.Geom.Circle
  }): Position | undefined {
    const out: any = {}
    const intersection = Phaser.Geom.Intersects.LineToCircle(
      line, circle, out
    )

    if (intersection) {
      return out
    }
  }

  getNearest (
    targets: Phaser.GameObjects.Arc[]
  ): Phaser.GameObjects.Arc | undefined {
    const closest: Result<number> = { value: Infinity }

    targets.forEach((target) => {
      const distance = Phaser.Math.Distance.Between(
        this.tower.x, this.tower.y, target.x, target.y
      )

      const far = distance > this.range
      if (far) {
        return
      }

      this.graphics.fillCircle(target.x, target.y, 100)

      const radians = Phaser.Math.Angle.Between(
        this.tower.x, this.tower.y, target.x, target.y
      )
      const degrees = Phaser.Math.RadToDeg(radians)
      const difference = Phaser.Math.Angle.ShortestBetween(
        degrees, this.tower.angle
      )
      const absolute = Math.abs(difference)

      const closer = absolute < closest.value
      if (closer) {
        closest.value = absolute
        closest.element = target
      }
    })

    return closest.element
  }

  getTarget ({ line, targets }: {
    line: Phaser.Geom.Line
    targets: Phaser.GameObjects.Arc[]
  }): Result<Position> {
    const target: Result<Position> = { value: { x: 0, y: 0 } }

    let closest = Infinity
    targets.forEach((mob) => {
      const circle = new Phaser.Geom.Circle(
        mob.x, mob.y, mob.radius
      )

      const intersection = this.getLineToCircle({ line, circle })

      if (intersection == null) {
        return
      }

      const distance = Phaser.Math.Distance.Between(
        this.tower.x, this.tower.y, mob.x, mob.y
      )

      const closer = distance < closest
      if (closer) {
        closest = distance

        target.value = intersection
        target.element = mob
      }
    })

    return target
  }

  strokeLine ({ a, b }: {
    a: Position
    b: Position
  }): void {
    const line = this.createLine({ a, b })

    this.graphics.strokeLineShape(line)
  }

  strokeVertical (x: number): void {
    const a = { x, y: 0 }
    const b = { x, y: 1000 }

    this.strokeLine({ a, b })
  }

  strokeHorizontal (y: number): void {
    const a = { x: 0, y }
    const b = { x: 1000, y }

    this.strokeLine({ a, b })
  }

  update (): void {
    this.graphics.clear()

    const vertical = this.createRange(200)
    vertical.forEach(x => this.strokeVertical(x))

    const horizontal = this.createRangeHorizontal(200)
    horizontal.forEach(y => this.strokeHorizontal(y))

    this.queen.moveTo({ x: 500, y: 500, speed: 100 })

    const now = Date.now()

    const unfired = isNaN(this.fireTime)
    const fireDifference = unfired
      ? Infinity
      : now - this.fireTime

    const firing = fireDifference < 1000
    if (firing) {
      this.graphics.lineStyle(1, 0xFF0000, 1.0)
      const laser = this.createLine({ a: this.fireMuzzle, b: this.fireTarget })

      this.graphics.strokeLineShape(laser)
    }
    const mobs = this.mobs.getChildren() as Phaser.GameObjects.Arc[]

    const tracer = this.createTracer()
    const recharged = fireDifference > 2000
    if (recharged) {
      this.attack({ now, tracer, enemies: mobs })

      this.graphics.lineStyle(1, 0x00FF00, 1.0)
    } else {
      this.graphics.lineStyle(1, 0x00FFFF, 1.0)
    }
    this.graphics.strokeLineShape(tracer)

    this.graphics.fillStyle(0x0000FF)
    const nearest = this.getNearest(mobs)

    if (nearest != null) {
      this.graphics.fillStyle(0x00FF00)
      this.graphics.fillCircle(nearest.x, nearest.y, 90)

      const radians = Phaser.Math.Angle.Between(
        this.tower.x, this.tower.y, nearest.x, nearest.y
      )

      const rotated = Phaser.Math.Angle.RotateTo(
        this.tower.rotation,
        radians,
        0.001 * Math.PI
      )

      this.tower.rotation = rotated
    }
  }
}
