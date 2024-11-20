import Game from '../game'

import SimpleMap from './simple-map'

export default class WB extends SimpleMap {
  public constructor(game: Game, playerSpawnName?: string, priority?: number) {
    super(game, 'wb', playerSpawnName, priority)
  }
}
