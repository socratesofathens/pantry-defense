import Scene from './Scene'

const config = {
  type: Phaser.AUTO,
  width: 1000,
  height: 1000,
  physics: {
    default: 'arcade',
    arcade: {
      debug: true
    }
  },
  scene: Scene
}

export default config
