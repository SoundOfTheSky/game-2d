/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
import RBush, { BBox } from 'rbush';

import Game from '../game';
import { Tickable } from '../ticker';

import Rect from './body/rect';
import Vector2 from './body/vector2';
import RTree from './rtree';

export default class Test3 implements Tickable {
  public priority = 0;
  public rtree = new RTree();
  public rtree2 = new RBush<BBox>();
  public foundRects = new Set<RTree>();

  public constructor(public game: Game) {
    void this.runTest1();
    this.game.toTick.push(this);
  }

  public cleanup(): void {
    throw new Error('Method not implemented.');
  }

  public tick() {
    if (this.game.input.getTicks(' ') === 1) {
      const a = ~~(Math.random() * this.game.canvas.width);
      const b = ~~(Math.random() * this.game.canvas.height);
      const c = ~~((Math.random() * this.game.canvas.width) / 4);
      const d = ~~((Math.random() * this.game.canvas.height) / 4);
      const rect = new Rect(new Vector2(a, b), new Vector2(a + c, b + d));
      this.rtree.push(rect);
      this.rtree2.insert({
        minX: rect.a.x,
        minY: rect.a.y,
        maxX: rect.b.x,
        maxY: rect.b.y,
      });
      console.log('trees', this.rtree.children, (this.rtree2 as any).data.children);
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

  public runTest1() {
    const collider = new Rect(new Vector2(0, 0), new Vector2(100, 100));
    const p: Rect[] = [];
    let colliding = 0;
    for (let i = 0; i < 100000; i++) {
      const a = ~~(Math.random() * this.game.canvas.width);
      const b = ~~(Math.random() * this.game.canvas.height);
      const c = ~~((Math.random() * this.game.canvas.width) / 4);
      const d = ~~((Math.random() * this.game.canvas.height) / 4);
      p.push(new Rect(new Vector2(a, b), new Vector2(a + c, b + d)));
      if (collider.collision(p[i])) colliding++;
    }
    console.log('colliding', colliding);
    let t = performance.now();
    for (const rect of p)
      this.rtree2.insert({
        minX: rect.a.x,
        minY: rect.a.y,
        maxX: rect.b.x,
        maxY: rect.b.y,
      });
    console.log('performance 2', performance.now() - t);
    t = performance.now();
    for (const rect of p) this.rtree.push(rect);
    console.log('performance 1', performance.now() - t);
    console.log('trees', this.rtree.children, (this.rtree2 as any).data.children);
    const r = this.rtree.search(collider);
    const r2 = this.rtree2.search({
      minX: collider.a.x,
      minY: collider.a.y,
      maxX: collider.b.x,
      maxY: collider.b.y,
    });
    console.log('answers', r.length, r2.length);

    t = performance.now();
    for (let i = 0; i < 1000; i++) this.rtree.search(collider);
    console.log('performance 3', performance.now() - t);
    t = performance.now();
    for (let i = 0; i < 1000; i++)
      this.rtree2.search({
        minX: collider.a.x,
        minY: collider.a.y,
        maxX: collider.b.x,
        maxY: collider.b.y,
      });
    console.log('performance 4', performance.now() - t);
    this.foundRects.clear();
    for (const i of r) this.foundRects.add(i);
  }
}
