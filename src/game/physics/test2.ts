/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */

import Game from '../game';
import { Tickable } from '../ticker';

import { PhysicsBody } from './body';
import Circle from './body/circle';
import Line from './body/line';
import Poly from './body/poly';
import Rect from './body/rect';
import Vector2 from './body/vector2';
import RTree from './rtree';

export default class Test2 implements Tickable {
  public priority = 0;
  //public player = new Rect(new Vector2(0, 0), new Vector2(80, 80));
  // public player = new Line(new Vector2(0, 0), new Vector2(80, 80));
  public player = new Circle(new Vector2(80, 80), 80);
  // public player = new Poly([new Vector2(0, 0), new Vector2(0, 90), new Vector2(180, 60), new Vector2(30, 0)]);
  public figures: PhysicsBody[] = [
    new Vector2(100, 500),
    new Line(new Vector2(300, 500), new Vector2(400, 600)),
    new Rect(new Vector2(100, 100), new Vector2(200, 200)),
    new Circle(new Vector2(700, 400), 200),
    new Poly(new Vector2(1000, 400), new Vector2(1000, 600), new Vector2(1200, 500)),
  ];
  public rtree = new RTree();
  public foundRects = new Set<RTree>();

  public constructor(public game: Game) {
    this.game.toTick.push(this);
  }

  public cleanup(): void {
    throw new Error('Method not implemented.');
  }

  public tick() {
    // Player move
    const move = new Vector2();
    if (this.game.input.has('d')) move.x = 1;
    if (this.game.input.has('a')) move.x = -1;
    if (this.game.input.has('s')) move.y = 1;
    if (this.game.input.has('w')) move.y = -1;
    move.normalize().scale(new Vector2(10, 10));
    this.player.move(move);
    // RTree
    this.rtree = new RTree();
    const bboxFigure = new WeakMap<Rect, PhysicsBody>();
    for (let i = 0; i < this.figures.length; i++) {
      const bbox = this.figures[i].toRect();
      bboxFigure.set(bbox, this.figures[i]);
      this.rtree.push(bbox);
    }
    const f = this.rtree.search(this.player.toRect()).map((x) => bboxFigure.get(x.rect)!);
    // Collission
    const c = new Set<PhysicsBody>();
    for (let i = 0; i < f.length; i++) {
      const separation = f[i].collision(this.player);
      if (!separation) continue;
      c.add(f[i]);
      this.player.move(separation);
    }
    // Render
    for (let fi = -1; fi < this.figures.length; fi++) {
      const figure = fi === -1 ? this.player : this.figures[fi];
      this.game.ctx.fillStyle = c.has(figure) ? 'green' : 'red';
      this.game.ctx.strokeStyle = this.game.ctx.fillStyle;
      this.game.ctx.beginPath();
      if (figure instanceof Vector2) this.game.ctx.ellipse(figure.x, figure.y, 2, 2, 0, 0, 360);
      else if (figure instanceof Line) {
        this.game.ctx.moveTo(figure.a.x, figure.a.y);
        this.game.ctx.lineTo(figure.b.x, figure.b.y);
      } else if (figure instanceof Rect) this.game.ctx.rect(figure.a.x, figure.a.y, figure.w, figure.h);
      else if (figure instanceof Circle) this.game.ctx.ellipse(figure.c.x, figure.c.y, figure.r, figure.r, 0, 0, 360);
      else {
        this.game.ctx.moveTo(figure[figure.length - 1].x, figure[figure.length - 1].y);
        for (let i = 0; i < figure.length; i++) {
          const p = figure[i];
          this.game.ctx.lineTo(p.x, p.y);
        }
      }
      this.game.ctx.closePath();
      this.game.ctx.fill();
      this.game.ctx.stroke();
    }

    // const stack: RTree[] = [this.rtree];
    // this.game.ctx.textAlign = 'left';
    // this.game.ctx.textBaseline = 'top';
    // while (stack.length !== 0) {
    //   let lvl = 1;
    //   const node = stack.pop()!;
    //   for (const child of node.children) stack.push(child);
    //   let n = node;
    //   while (n.parent) {
    //     n = n.parent;
    //     lvl++;
    //   }
    //   this.game.ctx.fillStyle = '#fff';
    //   this.game.ctx.fillText(lvl.toString(), node.rect.a.x, node.rect.a.y);
    //   this.game.ctx.fillStyle = this.foundRects.has(node)
    //     ? 'rgba(18,90,184,0.5)'
    //     : node.children.length === 0
    //       ? 'rgba(100,225,100,0.5)'
    //       : 'rgba(225,225,225,0.1)';
    //   this.game.ctx.fillRect(node.rect.a.x, node.rect.a.y, node.rect.w, node.rect.h);
    // }
    // this.game.ctx.fillStyle = 'rgba(200,90,90,0.5)';
    // this.game.ctx.fillRect(400, 400, 2000, 200);
    // this.game.ctx.fillStyle = 'rgba(200,90,184,0.5)';
    // this.game.ctx.fillRect(this.rtree.rect.a.x, this.rtree.rect.a.y, this.rtree.rect.w, this.rtree.rect.h);
    // for (const item of this.rtree.allNodes()) {
    //   this.game.ctx.fillStyle = item.children.length > 0 ? 'rgba(18,90,184,0.5)' : 'rgba(225,225,225,0.5)';
    //   this.game.ctx.fillRect(item.rect.a.x, item.rect.a.y, item.rect.w, item.rect.h);
    // }
  }
}
