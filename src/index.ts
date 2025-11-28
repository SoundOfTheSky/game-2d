import { WebGPUMemory, WebGPUSchemaArray } from './game/rendering/buffer'
import './global.scss'
// import { effect } from '@softsky/utils'

// import Game from './game/game'
// import DefaultWorld from './game/worlds/default.world'
// import { room } from './room'

// if (window.innerHeight > window.innerWidth) console.log('what')
// else startPCGame()
// initUI()

// function startPCGame() {
//   console.log('STARTING PC GAME')
//   globalThis.addEventListener(
//     'contextmenu',
//     (event) => {
//       event.preventDefault()
//     },
//     false,
//   )
// }

// function initUI() {
//   const $ui = document.querySelector<HTMLDivElement>('.ui')!
//   const $connect = $ui.querySelector<HTMLDivElement>('.connect')!
//   registerConnect()

//   function registerConnect() {
//     const $code = $connect.querySelector<HTMLInputElement>('input')!
//     const $submit = $connect.querySelector<HTMLButtonElement>('button')!
//     $submit.addEventListener('click', () => {
//       $submit.disabled = true
//       room.connect($code.value)
//     })

//     effect(() => {
//       if (room.connected()) {
//         $connect.classList.remove('visible')
//         $submit.disabled = false
//         const canvas = document.querySelector<HTMLCanvasElement>('canvas')!
//         new Game(canvas, new DefaultWorld(canvas)).tick(0)
//       } else {
//         $connect.classList.add('visible')
//       }
//     })
//   }
// }

// void loadImage('/game/mc.webp').then((image) => {
//   const w = 32 / image.naturalWidth
//   const h = 32 / image.naturalHeight
//   const hPadding = 0.25 / image.naturalWidth
//   const wPadding = 0.25 / image.naturalHeight

//   createGLTexture(0, image)
//   let offset = 0
//   let x = 64
//   let y = 64
//   let rotation = 0
//   atlasRenderer.add(0, {
//     aOpacity: [1],
//     aRotation: [0],
//     aScale: [4, 4],
//     aTranslate: [x, y],
//     aOffset: [0, 64],
//     aSize: [32, 32],
//   })
//   atlasRenderer.textures.set('uSampler', 0)
//   atlasRenderer.render()
//   setInterval(() => {
//     offset++
//     x += 1
//     y += 1
//     rotation += 0.01
//     if (offset === 6) offset = 0
//     atlasRenderer.update(0, {
//       aOffset: [32 * offset, 0],
//       aTranslate: [x, y],
//       aRotation: [rotation],
//     })
//     atlasRenderer.render()
//   }, 16.6)
// })

// const vertex = new Vertex({
//   pos: 'float32x2',
//   opacity: 'float32',
// })
// vertex.add(1, {
//   pos: [1, 2],
//   opacity: [1],
// })

const uniform = new WebGPUMemory(
  {
    pos: 'vec4u',
    arr: new WebGPUSchemaArray(
      {
        a: 'u32',
        b: 'vec2f',
      },
      6,
    ),
  },
  GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
)
uniform.value.pos[3] = -2
uniform.value.arr[5].b[1] = 1
uniform.upload()

// await createPipelineAndDraw()

declare global {
  function setTimeout<TArguments extends unknown[]>(
    callback: (...arguments_: TArguments) => void,
    ms?: number,
    ...arguments_: TArguments
  ): number
  function setInterval<TArguments extends unknown[]>(
    callback: (...arguments_: TArguments) => void,
    ms?: number,
    ...arguments_: TArguments
  ): number
}
