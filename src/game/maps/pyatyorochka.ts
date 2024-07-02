import Game from '../game';
import { Ticker } from '../ticker';

import SimpleMap from './simple-map';

export default class Pyatyorochka extends SimpleMap {
  public constructor(game: Game, parent: Ticker, playerSpawnName?: string, priority?: number) {
    super(game, parent, 'pyatyorochka', playerSpawnName, priority);
  }
}
