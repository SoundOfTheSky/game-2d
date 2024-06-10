import Game from '../game';
import { PhysicsBody } from '../physics/body';
import Circle from '../physics/body/circle';
import Vector2 from '../physics/body/vector2';
import AnimatedImg from '../renderable/animated-img';
import { Ticker } from '../ticker';

import Entity from './entity';

export enum Direction {
  UP,
  RIGHT,
  DOWN,
  LEFT,
}

export default class Player extends Entity<AnimatedImg, string> {
  public direction = Direction.DOWN;
  public speed = 0.05;

  public constructor(game: Game, parent: Ticker, priority?: number) {
    const source = document.createElement('img');
    source.src = '/game/mc.png';
    super(
      game,
      parent,
      new AnimatedImg(game, game, {
        idle2: AnimatedImg.generateAnimation(source, new Vector2(16, 32), 6, 11, 175, true),
        idle1: AnimatedImg.generateAnimation(source, new Vector2(16, 32), 0, 5, 175, true),
        idle3: AnimatedImg.generateAnimation(source, new Vector2(16, 32), 0, 5, 175, true),
        idle0: AnimatedImg.generateAnimation(source, new Vector2(16, 32), 12, 17, 175, true),
        walk2: AnimatedImg.generateAnimation(source, new Vector2(16, 32), 6, 11, 175, true),
        walk1: AnimatedImg.generateAnimation(source, new Vector2(16, 32), 0, 5, 175, true),
        walk3: AnimatedImg.generateAnimation(source, new Vector2(16, 32), 0, 5, 175, true),
        walk0: AnimatedImg.generateAnimation(source, new Vector2(16, 32), 12, 17, 175, true),
      }),
      priority,
    );
    this.hitboxes.push(new Circle(new Vector2(8, 24), 8));
    this.name = 'player';
  }

  public tick(deltaTime: number): void {
    //console.log(this.pos.x, this.pos.y, this.velocity.x, this.velocity.y);
    this.velocity.x = 0;
    this.velocity.y = 0;
    if (this.game.input.has('w')) this.velocity.y -= 1;
    if (this.game.input.has('s')) this.velocity.y += 1;
    if (this.game.input.has('a')) this.velocity.x -= 1;
    if (this.game.input.has('d')) this.velocity.x += 1;
    if (this.velocity.x > 0) this.direction = Direction.RIGHT;
    else if (this.velocity.x !== 0) this.direction = Direction.LEFT;
    else if (this.velocity.y > 0) this.direction = Direction.DOWN;
    else if (this.velocity.y !== 0) this.direction = Direction.UP;
    this.velocity.normalize().scaleN(this.speed);
    this.updateAnimation();
    super.tick(deltaTime);
  }

  private updateAnimation() {
    const intendedAnim = (this.velocity.x !== 0 || this.velocity.y !== 0 ? 'walk' : 'idle') + this.direction;
    if (this.img.animation !== intendedAnim) this.img.playAnimation(intendedAnim);
  }

  public onCollide(entity: Entity, _hitbox: PhysicsBody, _entityHitbox: PhysicsBody, separationVector: Vector2): void {
    if (entity.name === 'collision') this.pos.move(separationVector);
    else if ((entity.name = 'player')) this.pos.move(separationVector.scaleN(0.5));
  }
}
