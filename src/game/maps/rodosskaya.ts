import Game from '../game'

import SimpleMap from './simple-map'

export default class Rodosskaya extends SimpleMap {
  public constructor(game: Game, playerSpawnName?: string, priority?: number) {
    super(game, 'rodosskaya', playerSpawnName, priority)
  }
}
