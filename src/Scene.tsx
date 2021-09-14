import Phaser from 'phaser'
import Mob from './Mob'

export default class Scene extends Phaser.Scene {
  public mobs!: Phaser.Physics.Arcade.Group
  public towers!: Phaser.Physics.Arcade.StaticGroup

  private building!: Phaser.GameObjects.Arc
  private graphics!: Phaser.GameObjects.Graphics
  private gun!: Phaser.GameObjects.Rectangle
  private queen!: Mob
  private scout!: Mob
  private tower!: Phaser.GameObjects.Container

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

  update (): void {
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

    if (closest.element != null) {
      const radians = Phaser.Math.Angle.Between(
        closest.element.x, closest.element.y, this.tower.x, this.tower.y
      )
      const angle = Phaser.Math.RAD_TO_DEG * radians
      this.tower.setAngle(angle)
    }

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
  }
}
