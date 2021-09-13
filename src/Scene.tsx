import Phaser from 'phaser'

export default class Scene extends Phaser.Scene {
  public r1!: Phaser.GameObjects.Arc
  public r2!: Phaser.GameObjects.Arc
  public gun!: Phaser.GameObjects.Rectangle
  public cover!: Phaser.GameObjects.Rectangle
  public tower!: Phaser.GameObjects.Container
  public building!: Phaser.GameObjects.Arc

  init (): void {
    this.cameras.main.setBackgroundColor('#24252A')
  }

  create (): void {
    this.r1 = this.add.circle(200, 50, 50, 0x6666ff)

    this.r2 = this.add.circle(400, 100, 10, 0x9966ff).setStrokeStyle(4, 0xefc53f)

    const mobs = this.physics.add.group()
    mobs.add(this.r1)
    mobs.add(this.r2)

    this.physics.add.collider(mobs, mobs)

    this.r1.body.velocity.x = 100
    this.r1.body.velocity.y = 100
    if (this.r1.body instanceof Phaser.Physics.Arcade.Body) {
      this.r1.body.setBounce(1, 1)
      this.r1.body.setCircle(50)
      this.r1.body.collideWorldBounds = true
    }

    this.r2.body.velocity.x = -100
    this.r2.body.velocity.y = 100
    if (this.r2.body instanceof Phaser.Physics.Arcade.Body) {
      this.r2.body.bounce.x = 1
      this.r2.body.bounce.y = 1
      this.r2.body.setCircle(10)
      this.r2.body.collideWorldBounds = true
    }

    this.building = this.add.circle(0, 0, 30, 0x9966ff).setStrokeStyle(4, 0xefc53f)
    this.gun = this.add.rectangle(0, 50, 10, 100, 0xFF0000)

    this.tower = this.add.container(500, 500)
    this.tower.setSize(60, 60)
    this.tower.add(this.gun)
    this.tower.add(this.building)
    const towers = this.physics.add.staticGroup(this.tower)
    if (this.tower.body instanceof Phaser.Physics.Arcade.StaticBody) {
      console.log('static test:')
      this.tower.body.setCircle(30)
    }

    this.physics.add.collider(towers, mobs)
    this.physics.world.enable(this.tower)
  }

  update (): void {
    this.physics.moveTo(this.r1, 500, 500, 100)
    const radians = Phaser.Math.Angle.Between(this.r2.x, this.r2.y, 500, 500)
    const angle = Phaser.Math.RAD_TO_DEG * radians
    const gunAngle = angle + 90
    this.tower.setAngle(gunAngle)
  }
}
