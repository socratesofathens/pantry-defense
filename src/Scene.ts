import Mob from './Mob'
import { Position, Result } from './types'
import Phaser from 'phaser'

function random (range: number): number {
  const random = Math.random()
  const scaled = random * range
  const rounded = Math.floor(scaled)

  return rounded
}

export default class Scene extends Phaser.Scene {
  public mobs!: Phaser.Physics.Arcade.Group
  public towers!: Phaser.Physics.Arcade.StaticGroup

  private building!: Phaser.GameObjects.Arc
  private fireTime!: number
  private firePosition!: Position
  private graphics!: Phaser.GameObjects.Graphics
  private gun!: Phaser.GameObjects.Rectangle
  private queen!: Mob
  private range!: number
  private scout!: Mob
  private tower!: Phaser.GameObjects.Container

  init (): void {
    this.cameras.main.setBackgroundColor('#FFFFFF')
  }

  create (): void {
    this.graphics = this.add.graphics()
    this.range = 500

    this.mobs = this.physics.add.group()
    this.queen = new Mob({
      scene: this, x: 250, y: 100, radius: 50, color: 0x000000
    })
    this.scout = new Mob({
      scene: this, x: 400, y: 100, radius: 10, color: 0x000000
    })
    this.scout.setVelocity({ x: -100, y: 100 })

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
  }

  fire ({ target, position }: {
    target: Phaser.GameObjects.Arc
    position: Position
  }): void {
    this.fireTime = Date.now()
    this.firePosition = position

    target.destroy()

    const x = random(1000)
    const y = random(1000)

    const scout = new Mob({
      scene: this, x, y, radius: 10, color: 0x000000
    })

    const dX = random(200)
    const ddX = random(2) - 0.5
    const vX = dX * ddX

    const dY = random(200)
    const ddY = random(2) - 0.5
    const vY = dY * ddY

    scout.setVelocity({ x: vX, y: vY })

    const length = this.mobs.getLength()
    if (length < 3) {
      const x = random(1000)
      const y = random(1000)

      const scout = new Mob({
        scene: this, x, y, radius: 10, color: 0x000000
      })

      const dX = random(200)
      const ddX = random(2) - 0.5
      const vX = dX * ddX

      const dY = random(200)
      const ddY = random(2) - 0.5
      const vY = dY * ddY

      scout.setVelocity({ x: vX, y: vY })
    }
  }

  update (): void {
    this.graphics.clear()

    this.graphics.fillStyle(0xFF0000)
    if (this.firePosition != null) {
      this.graphics.fillCircle(this.firePosition.x, this.firePosition.y, 20)
    }

    this.graphics.lineStyle(1, 0x000000, 1.0)

    const vertical = new Phaser.Geom.Line(
      500,
      0,
      500,
      1000
    )
    this.graphics.strokeLineShape(vertical)

    const horizontal = new Phaser.Geom.Line(
      0,
      500,
      1000,
      500
    )
    this.graphics.strokeLineShape(horizontal)

    this.queen.moveTo({ x: 500, y: 500, speed: 500 })

    const mobs = this.mobs.getChildren() as Phaser.GameObjects.Arc[]

    const closest: Result = { value: Infinity }
    mobs.forEach((mob) => {
      if (mob.body instanceof Phaser.Physics.Arcade.Body) {
        const distance = Phaser.Math.Distance.Between(
          this.tower.x, this.tower.y, mob.x, mob.y
        )
        const close = distance <= 500
        if (close) {
          const radians = Phaser.Math.Angle.Between(
            this.tower.x, this.tower.y, mob.body.x, mob.body.y
          )
          const closer = radians < closest.value

          if (closer) {
            closest.value = radians
            closest.element = mob
          }
        }
      }
    })

    const now = Date.now()
    const difference = isNaN(this.fireTime) ? 2000 : now - this.fireTime
    const firing = difference < 1000
    if (firing) {
      console.log('this.firePosition test:', this.firePosition)
      this.graphics.lineStyle(1, 0xFF0000, 1.0)
      const laser = new Phaser.Geom.Line(
        this.tower.x,
        this.tower.y,
        this.firePosition.x,
        this.firePosition.y
      )
      this.graphics.strokeLineShape(laser)
    }

    if (closest.element != null) {
      const radians = Phaser.Math.Angle.Between(
        this.tower.x, this.tower.y, closest.element.x, closest.element.y
      )

      const rotated = Phaser.Math.Angle.RotateTo(
        this.tower.rotation,
        radians,
        0.001 * Math.PI
      )

      const change = this.tower.rotation - rotated
      if (change > 0.0032) {
        console.log('old test:', this.tower.rotation)
        console.log('rotated test:', rotated)
        console.log('change test:', change)

        throw new Error('Invalid rotation')
      }

      this.tower.rotation = rotated
      const tracer = new Phaser.Geom.Line(this.tower.x, this.tower.y, 0, 0)
      Phaser.Geom.Line.SetToAngle(
        tracer, this.tower.x, this.tower.y, this.tower.rotation, this.range
      )

      const recharged = difference > 1000
      if (recharged) {
        this.graphics.lineStyle(1, 0x00FF00, 1.0)
        this.graphics.strokeLineShape(tracer)

        const target: Result = { value: Infinity }
        let point: any
        mobs.forEach((mob) => {
          const circle = new Phaser.Geom.Circle(
            mob.x, mob.y, mob.radius
          )

          const out: any = {}
          const intersection = Phaser.Geom.Intersects.LineToCircle(
            tracer, circle, out
          )

          if (intersection) {
            point = out
            const distance = Phaser.Math.Distance.Between(
              this.tower.x, this.tower.y, mob.x, mob.y
            )

            const closer = distance < target.value
            if (closer) {
              target.value = distance
              target.element = mob
            }
          }
        })

        if (target.element != null) {
          this.fire({
            target: target.element,
            position: point
          })
        }

        this.graphics.lineStyle(1, 0x00FF00, 1.0)
      } else {
        this.graphics.lineStyle(1, 0x00FFFF, 1.0)
      }
      this.graphics.strokeLineShape(tracer)
    }
  }
}
