import Game from '../game'

import SimpleMap from './simple-map'

export default class Ozon extends SimpleMap {
  public constructor(game: Game, playerSpawnName?: string, priority?: number) {
    super(game, 'ozon', playerSpawnName, priority)
  }
}
