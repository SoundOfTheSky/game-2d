import Game from '../game';
import Rhythm from '../mechanics/rhythm';
import { Renderable, Tickable } from '../ticker';

export default class Beat implements Tickable, Renderable {
  public seeTime = 3000;
  private rhythm;

  public constructor(protected game: Game) {
    this.game.toTick.push(this);
    this.game.toRender.push(this);
    this.rhythm = new Rhythm(this.game, {
      timings: [100, 200, 300],
      activateNoteTime: 400,
    });
    for (let i = 0; i < 60000; i += 250 + 750 * Math.random()) {
      if (Math.random() < 0.1) {
        const holdFor = 1000 * Math.random();
        this.rhythm.add({
          key: 'm0',
          time: 5000 + game.time + i,
          holdFor,
        });
        i += holdFor;
      } else {
        this.rhythm.add({
          key: 'm0',
          time: 5000 + game.time + i,
        });
      }
    }
  }

  public tick(): void {
    this.rhythm.tick();
  }

  public render(): void {
    this.game.utils.line(
      this.game.utils.x(0.1),
      this.game.utils.y(0.1),
      this.game.utils.xn(0.1),
      this.game.utils.y(0.1),
      '#fff',
      1,
    );
    this.game.utils.line(
      this.game.utils.x(0.2),
      this.game.utils.y(0.05),
      this.game.utils.x(0.2),
      this.game.utils.y(0.15),
      '#fff',
      1,
    );
    for (const note of this.rhythm.notes) {
      const p = (note.time - this.game.time) / this.seeTime;
      if (p > 1) break;
      const x = this.game.utils.x(0.2) + this.game.utils.x(0.7 * p);
      if (note.holdFor) {
        this.game.utils.rect(
          x,
          this.game.utils.y(0.05),
          this.game.utils.x(((note.time + note.holdFor) / this.seeTime) * 0.7),
          this.game.utils.y(0.1),
          'blue',
        );
      } else this.game.utils.line(x, this.game.utils.y(0.05), x, this.game.utils.y(0.15), '#fff', 1);
    }
    if (this.rhythm.lastDelta !== 0) {
      const x = this.game.utils.x(0.2) + this.game.utils.x((this.rhythm.lastDelta / this.seeTime) * 0.7);
      this.game.utils.line(x, this.game.utils.y(0.05), x, this.game.utils.y(0.15), 'lime', 1);
    }
    // for (const timing of this.rhythm.options.timings) {
    //   let x = this.game.render.x(0.2) + this.game.render.x((timing / this.seeTime) * 0.7);
    //   this.game.render.line(x, this.game.render.y(0.05), x, this.game.render.y(0.15), 'yellow', 1);
    //   x = this.game.render.x(0.2) - this.game.render.x((timing / this.seeTime) * 0.7);
    //   this.game.render.line(x, this.game.render.y(0.05), x, this.game.render.y(0.15), 'yellow', 1);
    // }
    // let x = this.game.render.x(0.2) + this.game.render.x((this.rhythm.options.activateNoteTime / this.seeTime) * 0.7);
    // this.game.render.line(x, this.game.render.y(0.05), x, this.game.render.y(0.15), 'red', 1);
    // x = this.game.render.x(0.2) - this.game.render.x((this.rhythm.options.activateNoteTime / this.seeTime) * 0.7);
    // this.game.render.line(x, this.game.render.y(0.05), x, this.game.render.y(0.15), 'red', 1);
    if (this.rhythm.notesSoFar > 0)
      this.game.ctx.fillText(
        `${~~((this.rhythm.accuracyScore / this.rhythm.notesSoFar) * 100)}`,
        this.game.canvas.width,
        50,
      );
    this.game.ctx.fillText(this.rhythm.lastDelta.toString(), this.game.canvas.width, 100);
  }
}
