import { createGlobalStyle } from 'styled-components'

const GlobalStyle = createGlobalStyle`
  body, html, div, ion-phaser { 
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  canvas {
    margin: 1vmin auto;
    height: 98vmin;
    width: 98vmin;
    display: block;
  }
`

export default GlobalStyle
