import Mob from './Mob'
import { Position, Result } from './types'
import Phaser from 'phaser'
import { HEIGHT, RATIO } from './config'

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
  private realRange!: number
  private REAL_SIZE!: number
  private muzzle!: Phaser.GameObjects.Arc
  private tower!: Phaser.GameObjects.Container
  private tempMatrix!: Phaser.GameObjects.Components.TransformMatrix
  private tempParentMatrix!: Phaser.GameObjects.Components.TransformMatrix

  readonly SIZE = 0.01

  init (): void {
    this.cameras.main.setBackgroundColor('#FFFFFF')
  }

  create (): void {
    this.graphics = this.add.graphics()
    this.range = 0.5
    this.realRange = this.getReal(this.range)

    this.mobs = this.physics.add.group()
    this.queen = new Mob({
      scene: this, x: 0.150, y: 0.4, radius: 0.05, color: 0x000000
    })
    const worker = this.createWorker()
    worker.setVelocity({ x: -0.175, y: 0.1 })

    this.physics.add.collider(this.mobs, this.mobs)

    this.REAL_SIZE = this.getReal(this.SIZE)

    this.towers = this.physics.add.staticGroup()
    this.physics.add.collider(this.towers, this.mobs)

    this.tower = this.createContainer({ x: 0.5, y: 0.5 })
    const doubleSize = this.REAL_SIZE * 2
    this.tower.setSize(doubleSize, doubleSize)

    this.towers.add(this.tower)

    if (this.tower.body instanceof Phaser.Physics.Arcade.StaticBody) {
      this.tower.body.setCircle(this.REAL_SIZE)
    }

    this.building = this.createCircle({
      x: 0, y: 0, radius: this.SIZE, color: 0xff0000
    })
    this.tower.add(this.building)

    this.gun = this.createRectangle({
      x: 0.012, y: 0, width: 0.024, height: 0.003, color: 0xFF0000
    })
    this.tower.add(this.gun)

    this.muzzle = this.createCircle({ x: 0.024, y: 0 })
    this.tower.add(this.muzzle)

    this.tempMatrix = new Phaser.GameObjects.Components.TransformMatrix()
    this.tempParentMatrix = new Phaser.GameObjects.Components.TransformMatrix()
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

  checkReal <T> ({ value, real, getter }: {
    value?: T
    real?: T
    getter: (value: T) => T
  }): T {
    if (real != null) {
      return real
    }

    if (value == null) {
      throw new Error('Nothing is real')
    }

    real = getter(value)

    return real
  }

  checkRealNumber ({ value, real }: {
    value?: number
    real?: number
  }): number {
    return this.checkReal({ value, real, getter: this.getReal })
  }

  checkRealPosition ({ value, real }: {
    value?: Position
    real?: Position
  }): Position {
    return this.checkReal({ value, real, getter: this.getRealPosition })
  }

  createContainer ({ x, y }: {
    x: number
    y: number
  }): Phaser.GameObjects.Container {
    const position = { x, y }
    const realPosition = this.getRealPosition(position)
    const container = this.add.container(realPosition.x, realPosition.y)

    return container
  }

  createCircle ({ x, y, radius, color }: {
    x: number
    y: number
    radius?: number
    color?: number
  }): Phaser.GameObjects.Arc {
    const realX = this.getReal(x)
    const realY = this.getReal(y)

    if (radius != null) {
      radius = this.getReal(radius)
    }

    const circle = this.add.circle(realX, realY, radius, color)

    return circle
  }

  createLine ({ a, b, realA, realB }: {
    a?: Position
    b?: Position
    realA?: Position
    realB?: Position
  } = { realA: this.ORIGIN, realB: this.ORIGIN }): Phaser.Geom.Line {
    realA = this.checkRealPosition({ value: a, real: realA })
    realB = this.checkRealPosition({ value: b, real: realB })

    const line = new Phaser.Geom.Line(realA.x, realA.y, realB.x, realB.y)

    return line
  }

  createRange (step: number, _maximum = 1): number[] {
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

  createRangeRatio (step: number): number[] {
    const values = this.createRange(step, RATIO)

    return values
  }

  createRectangle ({ x, y, width, height, color }: {
    x: number
    y: number
    width: number
    height: number
    color: number
  }): Phaser.GameObjects.Rectangle {
    const realX = this.getReal(x)
    const realY = this.getReal(y)
    const realWidth = this.getReal(width)
    const realHeight = this.getReal(height)

    const rectangle = this.add.rectangle(
      realX, realY, realWidth, realHeight, color
    )

    return rectangle
  }

  createWorker (): Mob {
    const x = Math.random()
    const y = Math.random()

    const worker = new Mob({
      scene: this, x, y, radius: 0.01, color: 0x000000
    })

    const dX = Math.random()
    const vX = (dX / 3) + 0.1

    const dY = Math.random()
    const vY = (dY / 3) + 0.1

    worker.setVelocity({ x: vX, y: vY })

    return worker
  }

  createTracer (): Phaser.Geom.Line {
    const tracer = this.createLine()

    Phaser.Geom.Line.SetToAngle(
      tracer, this.tower.x, this.tower.y, this.tower.rotation, this.realRange
    )

    return tracer
  }

  fillCircle ({ x, y, radius, realX, realY, realRadius }: {
    x?: number
    y?: number
    radius?: number
    realX?: number
    realY?: number
    realRadius?: number
  }): void {
    realX = this.checkRealNumber({ value: x, real: realX })
    realY = this.checkRealNumber({ value: y, real: realY })
    realRadius = this.checkRealNumber({ value: radius, real: realRadius })

    this.graphics.fillCircle(realX, realY, realRadius)
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
    if (length < 10) {
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

      const far = distance > this.realRange
      if (far) {
        return
      }

      this.fillCircle({ realX: target.x, realY: target.y, radius: 0.1 })

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

  getReal = (value: number): number => {
    return value * HEIGHT
  }

  getRealPosition = ({ x, y }: {
    x: number
    y: number
  }): Position => {
    const realX = this.getReal(x)
    const realY = this.getReal(y)
    const position = { x: realX, y: realY }

    return position
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

  strokeLine ({ a, b, realA, realB }: {
    a?: Position
    b?: Position
    realA?: Position
    realB?: Position
  }): void {
    const line = this.createLine({ a, b, realA, realB })

    this.graphics.strokeLineShape(line)
  }

  strokeVertical (x: number): void {
    const a = { x, y: 0 }
    const b = { x, y: 1 }

    this.strokeLine({ a, b })
  }

  strokeHorizontal (y: number): void {
    const a = { x: 0, y }
    const b = { x: RATIO, y }

    this.strokeLine({ a, b })
  }

  update (): void {
    this.graphics.clear()

    const vertical = this.createRangeRatio(0.2)
    vertical.forEach(x => this.strokeVertical(x))

    const horizontal = this.createRange(0.2)
    horizontal.forEach(y => this.strokeHorizontal(y))

    this.queen.moveTo({ x: 0.5, y: 0.5, speed: 0.01 })

    const now = Date.now()

    const unfired = isNaN(this.fireTime)
    const fireDifference = unfired
      ? Infinity
      : now - this.fireTime

    const firing = fireDifference < 1000
    if (firing) {
      this.graphics.lineStyle(1, 0xFF0000, 1.0)
      this.strokeLine({ realA: this.fireMuzzle, realB: this.fireTarget })
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
      this.fillCircle({ realX: nearest.x, realY: nearest.y, radius: 0.09 })

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
