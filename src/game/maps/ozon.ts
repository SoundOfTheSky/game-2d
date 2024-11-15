import Game from '../game'
import { Ticker } from '../ticker'

import SimpleMap from './simple-map'

export default class Ozon extends SimpleMap {
  public constructor(game: Game, parent: Ticker, playerSpawnName?: string, priority?: number) {
    super(game, parent, 'ozon', playerSpawnName, priority)
  }
}
