import Game from '../game';
import { PhysicsBody } from '../physics/body';
import Circle from '../physics/body/circle';
import Vector2 from '../physics/body/vector2';
import AnimatedImg from '../renderable/animated-img';
import { Ticker } from '../ticker';

import Collision from './collision';
import DynamicEntity from './dynamic-entity';
import Entity from './entity';

export default class Player extends DynamicEntity<AnimatedImg, string> {
  public walkSpeed = 0.05;
  public runSpeed = 0.1;
  public isRunning = false;
  public disabledControlsUntil = 0;

  public constructor(game: Game, parent: Ticker, priority?: number) {
    const source = game.resources['/game/mc.png'] as HTMLImageElement;
    const genAnimation = (from: number, to: number, time = 120, infinite = true) =>
      AnimatedImg.generateAnimation(source, new Vector2(32, 32), from, to, time, infinite);
    super(
      game,
      parent,
      new AnimatedImg(game, game, {
        walkUp: genAnimation(1, 6),
        walkDown: genAnimation(7, 12),
        walkRight: genAnimation(13, 18),
        walkLeft: genAnimation(19, 24),
        idleUp: genAnimation(25, 29),
        idleDown: genAnimation(30, 34),
        idleRight: genAnimation(35, 39),
        idleLeft: genAnimation(40, 44),
        runUp: genAnimation(45, 50, 90),
        runDown: genAnimation(51, 56, 90),
        runRight: genAnimation(57, 62),
        runLeft: genAnimation(63, 68),
        emoteJump: genAnimation(69, 74, 120, false),
      }),
      priority,
    );
    this.img.animations.idleUp[0].time = 1200;
    this.img.animations.idleDown[0].time = 1200;
    this.img.animations.idleRight[0].time = 1200;
    this.img.animations.idleLeft[0].time = 1200;
    this.hitboxes.push(new Circle(new Vector2(16, 24), 8));
    this.name = 'player';
  }

  public tick(deltaTime: number): void {
    let controlEnabled = this.disabledControlsUntil < this.game.time;
    if (controlEnabled) {
      if (this.game.input.getTicks('main') === 1) {
        this.img.playAnimation('emoteJump');
        this.velocity.x = 0;
        this.velocity.y = 0;
        this.disabledControlsUntil = this.game.time + 2000;
        controlEnabled = false;
      } else {
        this.isRunning = this.game.input.has('run');
        this.maxSpeed = this.isRunning ? this.runSpeed : this.walkSpeed;
        this.velocity.x = this.game.input.move.x;
        this.velocity.y = this.game.input.move.y;
      }
    }
    super.tick(deltaTime);
    if (controlEnabled) this.updateAnimation();
  }

  private updateAnimation() {
    const d = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y) / this.maxSpeed;
    let intendedAnim = 'idle';
    if (d === 0) this.img.speed = 1;
    else {
      intendedAnim = this.isRunning ? 'run' : 'walk';
      this.img.speed = d;
    }
    intendedAnim += this.direction;
    if (this.img.animation !== intendedAnim) this.img.playAnimation(intendedAnim);
  }

  public onCollide(entity: Entity, _hitbox: PhysicsBody, _entityHitbox: PhysicsBody, separationVector: Vector2): void {
    if (entity instanceof Collision) this.pos.move(separationVector);
    else if (entity instanceof Player) this.pos.move(separationVector.scaleN(0.5));
  }
}
