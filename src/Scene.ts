import Mob from './Mob'
import { Position } from './types'
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
  private closest!: Phaser.GameObjects.Arc
  private graphics!: Phaser.GameObjects.Graphics
  private gun!: Phaser.GameObjects.Rectangle
  private queen!: Mob
  private scout!: Mob
  private tower!: Phaser.GameObjects.Container
  private fireTime!: number
  private firePosition!: Position

  init (): void {
    this.cameras.main.setBackgroundColor('#FFFFFF')
  }

  create (): void {
    this.graphics = this.add.graphics()

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

    this.gun = this.add.rectangle(-12, 0, 24, 3, 0xFF0000)
    this.tower.add(this.gun)
  }

  fire (): void {
    console.log('fire test:')
    this.fireTime = Date.now()
    this.firePosition = this.closest.body.position

    this.closest.destroy()

    const x = random(1000)
    const y = random(1000)

    const scout = new Mob({
      scene: this, x, y, radius: 10, color: 0x000000
    })

    const dX = random(200)
    const ddX = random(2) - 1
    const vX = dX * ddX

    const dY = random(200)
    const ddY = random(2) - 1
    const vY = dY * ddY

    scout.setVelocity({ x: vX, y: vY })
  }

  update (): void {
    this.graphics.clear()

    this.queen.moveTo({ x: 500, y: 500, speed: 500 })

    const mobs = this.mobs.getChildren() as Phaser.GameObjects.Arc[]

    interface Result <T> {
      value: number
      element?: T
    }
    const closest: Result<Phaser.GameObjects.Arc> = { value: Infinity }
    mobs.forEach((mob) => {
      if (mob.body instanceof Phaser.Physics.Arcade.Body) {
        const distance = Phaser.Math.Distance.BetweenPoints(this.tower, mob.body)
        const closer = distance < closest.value

        if (closer) {
          closest.value = distance
          closest.element = mob
        }
      }
    })

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

    const now = Date.now()
    const difference = now - this.fireTime
    const firing = difference < 500
    if (firing) {
      this.graphics.lineStyle(1, 0xFF0000, 1.0)
      const laser = new Phaser.Geom.Line(
        500,
        500,
        this.firePosition.x,
        this.firePosition.y
      )
      this.graphics.strokeLineShape(laser)
    }

    if (closest.element != null) {
      this.closest = closest.element
      const radians = Phaser.Math.Angle.Between(
        this.closest.x, this.closest.y, this.tower.x, this.tower.y
      )
      this.tower.rotation = Phaser.Math.Angle.RotateTo(
        this.tower.rotation,
        radians,
        0.01 * Math.PI // delta
      )
      const recharged = difference > 1000
      if (recharged) {
        const angle = Phaser.Math.RAD_TO_DEG * radians
        const laser = new Phaser.Geom.Line(this.tower.x, this.tower.y, 0, 0)
        Phaser.Geom.Line.SetToAngle(laser, this.tower.x, this.tower.y, angle, 500)
        this.graphics.strokeLineShape(laser)
      }
    }
  }
}
