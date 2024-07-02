import Game from '../game';
import { Ticker } from '../ticker';

import SimpleMap from './simple-map';

export default class WB extends SimpleMap {
  public constructor(game: Game, parent: Ticker, playerSpawnName?: string, priority?: number) {
    super(game, parent, 'wb', playerSpawnName, priority);
  }
}
