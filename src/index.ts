import './fonts.scss'
import Game from './game/game'
import './global.scss'

new Game(document.querySelector('canvas')!)

declare global {
  function setTimeout<TArguments extends unknown[]>(callback: (...arguments_: TArguments) => void, ms?: number, ...arguments_: TArguments): number
  function setInterval<TArguments extends unknown[]>(
    callback: (...arguments_: TArguments) => void,
    ms?: number,
    ...arguments_: TArguments
  ): number
}
