import './fonts.scss';
import Game from './game/game';
import './global.scss';

new Game(document.querySelector('canvas')!);

declare global {
  function setTimeout<TArgs extends unknown[]>(callback: (...args: TArgs) => void, ms?: number, ...args: TArgs): number;
  function setInterval<TArgs extends unknown[]>(
    callback: (...args: TArgs) => void,
    ms?: number,
    ...args: TArgs
  ): number;
}
