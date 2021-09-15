import Scene from './Scene'
import { Position } from './types'

export default class Mob {
  readonly scene: Scene
  readonly shape: Phaser.GameObjects.Arc
  readonly x: number
  readonly y: number

  constructor ({ scene, x, y, radius, color }: {
    scene: Scene
    x: number
    y: number
    radius: number
    color: number
  }) {
    this.scene = scene
    this.x = x
    this.y = y

    this.shape = this.scene.add.circle(x, y, radius, color)
    this.scene.mobs.add(this.shape)

    if (this.shape.body instanceof Phaser.Physics.Arcade.Body) {
      this.shape.body.setBounce(1, 1)
      this.shape.body.setCircle(radius)
      this.shape.body.collideWorldBounds = true
    }
  }

  moveTo ({ x, y, speed }: {
    x: number
    y: number
    speed: number
  }): void {
    if (this.shape.body != null) {
      this.scene.physics.moveTo(this.shape, x, y, speed)
    }
  }

  setVelocity ({ x, y }: Position): void {
    this.shape.body.velocity.x = x
    this.shape.body.velocity.y = y
  }
}
