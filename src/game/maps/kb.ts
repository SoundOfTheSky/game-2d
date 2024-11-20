import Game from '../game'

import SimpleMap from './simple-map'

export default class KB extends SimpleMap {
  public constructor(game: Game, playerSpawnName?: string, priority?: number) {
    super(game, 'kb', playerSpawnName, priority)
  }
}
