import Phaser from 'phaser'
import { IonPhaser } from '@ion-phaser/react'

import Scene from './Scene'
import GlobalStyle from './style/global'

export default function App (): JSX.Element {
  const game = {
    type: Phaser.AUTO,
    width: 1000,
    height: 1000,
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 200 }
      }
    },
    scene: Scene
  }

  return (
    <>
      <GlobalStyle />

      <IonPhaser game={game} initialize />
    </>
  )
}
