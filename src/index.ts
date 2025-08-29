import { startPCGame } from './pc'
import startPhoneGame from './phone'

import './global.scss'

if (window.innerHeight > window.innerWidth) startPhoneGame()
else startPCGame()

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
