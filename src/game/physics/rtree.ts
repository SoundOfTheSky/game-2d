import Rect from './body/rect';
import Vector2 from './body/vector2';

export default class RTree {
  public rect: Rect;
  public children: RTree[];

  public constructor(
    item: RTree[] | Rect = [],
    public max = 9,
    public min = 4,
    public leaf = true,
    public parent?: RTree,
  ) {
    if (item instanceof Rect) {
      this.rect = item;
      this.children = [];
    } else {
      this.rect = new Rect(new Vector2(Infinity, Infinity), new Vector2(-Infinity, -Infinity));
      this.children = item;
      for (let i = 0; i < this.children.length; i++) this.children[i].parent = this;
      this.updateRect(true);
    }
  }

  public clear() {
    this.children = [];
    this.rect.a.x = Infinity;
    this.rect.a.y = Infinity;
    this.rect.b.x = -Infinity;
    this.rect.b.y = -Infinity;
    this.leaf = true;
  }

  public push(rect: Rect) {
    let node: RTree | undefined = this.chooseSubtree(rect);
    node.children.push(new RTree(rect, node.max, node.min, true, node));
    if (node.children.length > node.max) {
      node.split();
      node.updateRect();
    } else
      while (node) {
        node.rect.extend(rect);
        node = node.parent;
      }
  }

  public search(rect: Rect, result: RTree[] = []): RTree[] {
    if (!rect.intersectRect(this.rect)) return result;
    const stack: RTree[] = [this];
    while (stack.length > 0) {
      const node = stack.pop()!;
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        if (!rect.intersectRect(child.rect)) continue;
        if (node.leaf) result.push(child);
        else if (rect.contains(child.rect)) child.all(result);
        else stack.push(child);
      }
    }
    return result;
  }

  public allNodes(result: RTree[] = []): RTree[] {
    for (let i = 0; i < this.children.length; i++) {
      const node = this.children[i];
      result.push(node);
      node.allNodes(result);
    }
    return result;
  }

  public all(result: RTree[] = []): RTree[] {
    const stack: RTree[] = [this];
    while (stack.length > 0) {
      const node = stack.pop()!;
      if (node.leaf) for (let i = 0; i < node.children.length; i++) result.push(node.children[i]);
      else for (let i = 0; i < node.children.length; i++) stack.push(node.children[i]);
    }
    return result;
  }

  private chooseSubtree(rect: Rect) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let node: RTree = this;
    while (!node.leaf) {
      let best = node.children[0];
      let minEnlargement = Infinity;
      let minArea = Infinity;
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        const area = child.rect.area();
        const enlargement = child.rect.clone().extend(rect).area() - area;
        if (enlargement < minEnlargement) {
          if (area < minArea) minArea = area;
          minEnlargement = enlargement;
          best = child;
        } else if (enlargement === minEnlargement && area < minArea) {
          minArea = area;
          best = child;
        }
      }
      node = best;
    }
    return node;
  }

  private split() {
    this.sortBySmallestMarginAxis();
    const splitIndex = this.chooseSplitIndex();
    if (this.parent) {
      const newNode = new RTree(this.children.splice(splitIndex), this.max, this.min, this.leaf, this.parent);
      this.parent.leaf = false;
      this.parent.children.push(newNode);
      this.updateRect();
      if (this.parent.children.length > this.parent.max) this.parent.split();
    } else {
      const leftNode = new RTree(this.children.slice(0, splitIndex), this.max, this.min, this.leaf, this);
      const rightNode = new RTree(this.children.slice(splitIndex), this.max, this.min, this.leaf, this);
      this.leaf = false;
      this.children = [leftNode, rightNode];
      this.updateRect();
    }
  }

  private chooseSplitIndex() {
    let index = this.children.length - this.min;
    let minOverlap = Infinity;
    let minArea = Infinity;
    const leftRect = new Rect(new Vector2(Infinity, Infinity), new Vector2(-Infinity, -Infinity));
    for (let i = 1; i <= this.children.length - this.min; i++) {
      leftRect.extend(this.children[i - 1].rect);
      if (i < this.min) continue;
      const rightRect = new Rect(new Vector2(Infinity, Infinity), new Vector2(-Infinity, -Infinity));
      for (let i2 = i; i2 < this.children.length; i2++) rightRect.extend(this.children[i2].rect);
      const overlap = leftRect.intersection(rightRect)?.area() ?? 0;
      const area = leftRect.area() + rightRect.area();
      if (overlap < minOverlap) {
        if (area < minArea) minArea = area;
        minOverlap = overlap;
        index = i;
      } else if (overlap === minOverlap && area < minArea) {
        minArea = area;
        index = i;
      }
    }
    return index;
  }

  private sortBySmallestMarginAxis() {
    const xSorted = [...this.children.sort(sortByMinX)];
    const xMargin = this.margin();
    this.children.sort(sortByMinY);
    const yMargin = this.margin();
    if (xMargin < yMargin) this.children = xSorted;
  }

  private margin() {
    let margin = 0;
    const leftRect = new Rect(new Vector2(Infinity, Infinity), new Vector2(-Infinity, -Infinity));
    const rightRect = new Rect(new Vector2(Infinity, Infinity), new Vector2(-Infinity, -Infinity));
    for (let i = 0; i < this.children.length - this.min; i++) {
      leftRect.extend(this.children[i].rect);
      rightRect.extend(this.children[this.children.length - i - 1].rect);
      if (i >= this.min - 1) margin += leftRect.margin() + rightRect.margin();
    }
    return margin;
  }

  private updateRect(noPropagation?: boolean) {
    this.rect.a.x = Infinity;
    this.rect.a.y = Infinity;
    this.rect.b.x = -Infinity;
    this.rect.b.y = -Infinity;
    for (let i = 0; i < this.children.length; i++) this.rect.extend(this.children[i].rect);
    if (!noPropagation) this.parent?.updateRect();
  }

  public remove(rect: Rect) {
    const stack = [...this.children];
    while (stack.length) {
      const node = stack.pop()!;
      if (node.leaf) {
        const index = node.children.findIndex((c) => c.rect.equals(rect));
        if (index !== -1) {
          node.children.splice(index, 1)[0];
          node.condense();
          return this;
        }
      } else for (let i = 0; i < node.children.length; i++) stack.push(node.children[i]);
    }
    return this;
  }

  private condense() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let node: RTree = this;
    while (true) {
      if (node.children.length === 0 && node.parent) {
        node.parent.children.splice(node.parent.children.indexOf(node), 1);
        node = node.parent;
      } else {
        node.updateRect();
        break;
      }
    }
  }
}
const sortByMinX = (a: RTree, b: RTree) => a.rect.a.x - b.rect.a.x;
const sortByMinY = (a: RTree, b: RTree) => a.rect.a.y - b.rect.a.y;
