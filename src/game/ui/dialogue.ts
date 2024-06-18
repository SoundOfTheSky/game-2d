import Game from '../game';
import Vector2 from '../physics/body/vector2';
import Img from '../renderable/img';
import { Ticker } from '../ticker';

export type DialogueItem = {
  text: string;
  speed?: number;
  sound?: HTMLAudioElement;
  portrait?: Img;
  name?: string;
  left?: boolean;
};
export default class Dialogue extends Ticker {
  public bg;
  public queue: DialogueItem[] = [];
  public text = '';
  public name = '???';
  public portrait?: Img;
  private queueI = 0;
  private textI = 0;
  private lastLetterTime = 0;

  public constructor(
    public game: Game,
    parent: Ticker,
    item: DialogueItem,
    priority = 0,
  ) {
    super(parent, priority);
    this.queue.push(item);
    this.bg = this.addTickable(
      new Img(
        game,
        this,
        document.createElement('img'),
        new Vector2(0, this.game.canvas.height - 300),
        new Vector2(this.game.canvas.width, 300),
      ),
    );
  }

  public tick(deltaTime: number): void {
    const item = this.queue[this.queueI];
    this.name = item.name ?? '???';
    let timeSinceLastChange = this.game.time - this.lastLetterTime;
    const speed = item.speed ?? 70;
    while (timeSinceLastChange > speed && item.text.length - 1 !== this.textI) {
      timeSinceLastChange -= speed;
      void item.sound?.play();
      const letter = item.text[++this.textI];
      if (letter !== '_') this.text += letter;
      this.lastLetterTime = this.game.time - timeSinceLastChange;
    }
    super.tick(deltaTime);
    this.game.ctx.textAlign = 'right';
    this.game.ctx.textBaseline = 'top';
    this.game.ctx.fillText(
      this.name,
      ~~(this.game.canvas.width * 0.02),
      ~~(this.game.canvas.height - 300 + this.game.canvas.width * 0.02),
    );
    this.game.ctx.fillText(
      this.text,
      ~~(this.game.canvas.width * 0.02),
      ~~(this.game.canvas.height - 328 + this.game.canvas.width * 0.02),
    );
  }
}
