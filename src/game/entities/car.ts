import Game from '../game';
import { PhysicsBody } from '../physics/body';
import Rect from '../physics/body/rect';
import Vector2 from '../physics/body/vector2';
import Img from '../renderable/img';
import { Ticker } from '../ticker';

import Entity from './entity';
import Player, { Direction } from './player';

export default class Car extends Entity<Img, string> {
  public direction = Direction.DOWN;
  public speed = 0.05;
  public maxVelocity = 0.3;
  public acceleration = new Vector2();
  public stopZones = new Set<Entity>();
  protected inStopZone = false;
  protected pointI = 0;
  protected directionSettings = {
    [Direction.RIGHT]: {
      hitboxes: [new Rect(new Vector2(0, 16), new Vector2(64, 32)), new Rect(new Vector2(-64, 16), new Vector2(0, 32))],
      offset: new Vector2(0, 16),
      size: new Vector2(64, 48),
    },
    [Direction.LEFT]: {
      hitboxes: [
        new Rect(new Vector2(0, 16), new Vector2(64, 32)),
        new Rect(new Vector2(64, 16), new Vector2(128, 32)),
      ],
      offset: new Vector2(96, 16),
      size: new Vector2(64, 48),
    },
    [Direction.UP]: {
      hitboxes: [new Rect(new Vector2(0, 0), new Vector2(32, 64)), new Rect(new Vector2(0, 64), new Vector2(32, 128))],
      offset: new Vector2(64, 0),
      size: new Vector2(32, 64),
    },
    [Direction.DOWN]: {
      hitboxes: [new Rect(new Vector2(0, 0), new Vector2(32, 64)), new Rect(new Vector2(0, -64), new Vector2(32, 0))],
      offset: new Vector2(160, 0),
      size: new Vector2(32, 64),
    },
  };

  public constructor(
    game: Game,
    parent: Ticker,
    public path: Vector2[],
    priority?: number,
  ) {
    const source = game.resources['/game/tilesets/10_Vehicles_16x16.png'] as HTMLImageElement;
    super(game, parent, new Img(game, game, source), priority);
    this.name = 'car';
    this.pos.x = path[0].x;
    this.pos.y = path[0].y;
  }

  public tick(deltaTime: number): void {
    const point = this.path[this.pointI];
    if (this.pos.distance(point) < 16 && ++this.pointI === this.path.length) {
      this.pos.x = this.path[0].x;
      this.pos.y = this.path[0].y;
      this.pointI = 0;
    }
    if (this.inStopZone) {
      this.inStopZone = false;
      this.velocity.scaleN(0.92);
    } else {
      const acceleration = new Vector2(point.x - this.pos.x, point.y - this.pos.y).normalize().scaleN(0.001);
      this.velocity.x += acceleration.x;
      this.velocity.y += acceleration.y;
      const d = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
      if (d > this.maxVelocity) {
        this.velocity.x /= d / this.maxVelocity;
        this.velocity.y /= d / this.maxVelocity;
      }
    }
    if (Math.abs(this.velocity.y) > Math.abs(this.velocity.x)) {
      if (this.velocity.y > 0) this.direction = Direction.DOWN;
      else this.direction = Direction.UP;
    } else if (this.velocity.x > 0) this.direction = Direction.RIGHT;
    else this.direction = Direction.LEFT;
    this.updateAnimation();
    super.tick(deltaTime);
  }

  private updateAnimation() {
    const settings = this.directionSettings[this.direction];
    this.img.offset = settings.offset;
    this.img.size = settings.size;
    this.hitboxes = [...settings.hitboxes];
    this.hitboxMeta.set(this.hitboxes[0], 'hitbox');
    this.hitboxMeta.set(this.hitboxes[1], 'stopZone');
  }

  public onCollide(entity: Entity, hitbox: PhysicsBody, entityHitbox: PhysicsBody, separationVector: Vector2): void {
    const meta = this.hitboxMeta.get(hitbox);
    if (entity instanceof Player && meta === 'hitbox') {
      this.inStopZone = true;
      entity.pos.move(separationVector.scaleN(-1));
    } else if (this.stopZones.has(entity) || (meta === 'hitbox' && entity.hitboxMeta.get(entityHitbox) === 'stopZone'))
      this.inStopZone = true;
  }
}
