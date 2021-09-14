import Phaser from 'phaser'
import Mob from './Mob'

export default class Scene extends Phaser.Scene {
  public mobs!: Phaser.Physics.Arcade.Group
  private r1!: Mob
  private r2!: Mob
  private tower!: Phaser.GameObjects.Container
  private gun!: Phaser.GameObjects.Rectangle
  private building!: Phaser.GameObjects.Arc

  init (): void {
    this.cameras.main.setBackgroundColor('#24252A')
  }

  create (): void {
    this.mobs = this.physics.add.group()
    this.r1 = new Mob({
      scene: this, x: 250, y: 100, radius: 50, color: 0x6666ff
    })
    this.r2 = new Mob({
      scene: this, x: 400, y: 100, radius: 10, color: 0x9966ff
    })
    this.r2.setVelocity({ x: -100, y: 100 })

    this.physics.add.collider(this.mobs, this.mobs)

    this.building = this.add.circle(0, 0, 30, 0x9966ff).setStrokeStyle(4, 0xefc53f)
    this.gun = this.add.rectangle(-50, 0, 100, 10, 0xFF0000)

    this.tower = this.add.container(500, 500)
    this.tower.setSize(60, 60)
    this.tower.add(this.gun)
    this.tower.add(this.building)
    const towers = this.physics.add.staticGroup(this.tower)
    if (this.tower.body instanceof Phaser.Physics.Arcade.StaticBody) {
      this.tower.body.setCircle(30)
    }

    this.physics.add.collider(towers, this.mobs)
    this.physics.world.enable(this.tower)
  }

  update (): void {
    this.r1.moveTo({ x: 500, y: 500, speed: 10 })
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
  }
}
