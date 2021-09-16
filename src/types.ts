export interface Position {
  x: number
  y: number
}

export interface Result <T> {
  value: T
  element?: Phaser.GameObjects.Arc
}
