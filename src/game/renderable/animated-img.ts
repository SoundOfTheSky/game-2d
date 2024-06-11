import Game from '../game';
import Vector2 from '../physics/body/vector2';
import { Ticker } from '../ticker';

import Img from './img';

export type AnimationFrame = {
  source: HTMLImageElement;
  pos: Vector2;
  size: Vector2;
  offset: Vector2;
  scale: number;
  onDraw?: () => unknown;
  time?: number;
};

export default class AnimatedImg extends Img {
  public animation: string;
  public speed = 1;
  private frameI = 0;
  private lastFrameChange;

  public constructor(
    game: Game,
    parent: Ticker,
    public animations: Record<string, Partial<AnimationFrame>[]>,
    priority?: number,
  ) {
    const k = Object.keys(animations)[0];
    const v = animations[k][0];
    super(game, parent, v.source!, v.pos, v.size, v.offset, v.scale, priority);
    this.lastFrameChange = this.game.time;
    this.animation = k;
  }

  public playAnimation(name: string) {
    this.animation = name;
    this.lastFrameChange = this.game.time;
    this.frameI = 0;
    Object.assign(this, this.animations[name][0]);
  }

  public tick(): void {
    let timeSinceLastChange = this.game.time - this.lastFrameChange;
    const animation = this.animations[this.animation];
    let changed = false;
    while (true) {
      const { time } = animation[this.frameI];
      if (!time) break;
      timeSinceLastChange -= time / this.speed;
      if (timeSinceLastChange <= 0) break;
      if (++this.frameI === animation.length) this.frameI = 0;
      changed = true;
    }
    if (changed) {
      const frame = animation[this.frameI];
      frame.onDraw?.();
      this.lastFrameChange = this.game.time - (frame.time ?? 0) / this.speed - timeSinceLastChange;
      Object.assign(this, frame);
    }
    super.tick();
  }

  public static generateAnimation(
    s: HTMLImageElement,
    size: Vector2,
    from: number,
    to: number,
    interval: number,
    infinite?: boolean,
  ) {
    const frames: Partial<AnimationFrame>[] = [];
    for (let i = from; i <= to; i++) {
      const frame: Partial<AnimationFrame> = {
        offset: new Vector2(size.x * i, 0),
      };
      if (i === from) {
        frame.source = s;
        frame.size = size;
      }
      if (i !== to || infinite) frame.time = interval;
      frames.push(frame);
    }
    return frames;
  }
}
