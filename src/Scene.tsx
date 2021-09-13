import Phaser from 'phaser'

export default class Scene extends Phaser.Scene {
  init (): void {
    this.cameras.main.setBackgroundColor('#24252A')
  }

  create (): void {
    const r1 = this.add.circle(200, 150, 150, 0x6666ff)

    const r2 = this.add.circle(400, 150, 150, 0x9966ff).setStrokeStyle(4, 0xefc53f)

    this.physics.add.existing(r1)
    this.physics.add.existing(r2)

    r1.body.velocity.x = 100
    r1.body.velocity.y = 100
    if (r1.body instanceof Phaser.Physics.Arcade.Body) {
      r1.body.setBounce(1, 1)
      r1.body.collideWorldBounds = true
    }

    r2.body.velocity.x = -100
    r2.body.velocity.y = 100
    if (r2.body instanceof Phaser.Physics.Arcade.Body) {
      r2.body.bounce.x = 1
      r2.body.bounce.y = 1
      r2.body.collideWorldBounds = true
    }
  }
}
