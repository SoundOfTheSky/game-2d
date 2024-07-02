import Entity from '../entities/entity';
import Player from '../entities/player';
import Game from '../game';
import Rodosskaya from '../maps/rodosskaya';
import { PhysicsBody } from '../physics/body';
import Vector2 from '../physics/body/vector2';
import AnimatedImg from '../renderable/animated-img';
import Img from '../renderable/img';
import { Ticker } from '../ticker';

const maps = import.meta.glob<true, string, () => Promise<{ default: typeof Rodosskaya }>>('../maps/*.ts');

export default class ChangeMap extends Entity<undefined, undefined> {
  public constructor(game: Game, parent: Ticker, name: string) {
    super(game, parent, undefined);
    this.name = name;
  }

  public onCollide(
    entity: Entity<AnimatedImg | Img | undefined, unknown>,
    _hitbox: PhysicsBody,
    _entityHitbox: PhysicsBody,
    _separationVector: Vector2,
  ): void {
    if (entity instanceof Player && entity.disabledControlsUntil < this.game.time) {
      const name = this.name.split('_');
      const path = `../maps/${name[1].toLowerCase()}.ts`;
      name[1] = this.game.map!.name;
      if (path in maps)
        void maps[path]().then((map) => {
          this.game.map = new map.default(this.game, this.game, name.join('_'));
        });
      else throw new Error('Unknown level');
    }
  }
}
