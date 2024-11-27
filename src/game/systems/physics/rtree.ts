import Rect from './body/rect'
import Vector2 from './body/vector2'

export default class RTree {
  public rect: Rect
  public children: RTree[]

  public constructor(
    item: RTree[] | Rect = [],
    public max = 9,
    public min = 4,
    public leaf = true,
    public parent?: RTree,
  ) {
    if (item instanceof Rect) {
      this.rect = item
      this.children = []
    }
    else {
      this.rect = new Rect(new Vector2(Infinity, Infinity), new Vector2(-Infinity, -Infinity))
      this.children = item
      for (let index = 0; index < this.children.length; index++) this.children[index]!.parent = this
      this.updateRect(true)
    }
  }

  public clear() {
    this.children = []
    this.rect.a.x = Infinity
    this.rect.a.y = Infinity
    this.rect.b.x = -Infinity
    this.rect.b.y = -Infinity
    this.leaf = true
  }

  public push(rect: Rect) {
    let node: RTree | undefined = this.chooseSubtree(rect)
    node.children.push(new RTree(rect, node.max, node.min, true, node))
    if (node.children.length > node.max) {
      node.split()
      node.updateRect()
    }
    else
      while (node) {
        node.rect.extend(rect)
        node = node.parent
      }
  }

  public search(rect: Rect, result: RTree[] = []): RTree[] {
    if (!rect.intersectRect(this.rect)) return result
    const stack: RTree[] = [this]
    while (stack.length > 0) {
      const node = stack.pop()!
      for (let index = 0; index < node.children.length; index++) {
        const child = node.children[index]!
        if (!rect.intersectRect(child.rect)) continue
        if (node.leaf) result.push(child)
        else if (rect.contains(child.rect)) child.all(result)
        else stack.push(child)
      }
    }
    return result
  }

  public allNodes(result: RTree[] = []): RTree[] {
    for (let index = 0; index < this.children.length; index++) {
      const node = this.children[index]!
      result.push(node)
      node.allNodes(result)
    }
    return result
  }

  public all(result: RTree[] = []): RTree[] {
    const stack: RTree[] = [this]
    while (stack.length > 0) {
      const node = stack.pop()!
      if (node.leaf) for (let index = 0; index < node.children.length; index++) result.push(node.children[index]!)
      else for (let index = 0; index < node.children.length; index++) stack.push(node.children[index]!)
    }
    return result
  }

  private chooseSubtree(rect: Rect) {
    // eslint-disable-next-line unicorn/no-this-assignment, @typescript-eslint/no-this-alias
    let node: RTree = this
    while (!node.leaf) {
      let best = node.children[0]!
      let minEnlargement = Infinity
      let minArea = Infinity
      for (let index = 0; index < node.children.length; index++) {
        const child = node.children[index]!
        const area = child.rect.area()
        const enlargement = child.rect.clone().extend(rect).area() - area
        if (enlargement < minEnlargement) {
          if (area < minArea) minArea = area
          minEnlargement = enlargement
          best = child
        }
        else if (enlargement === minEnlargement && area < minArea) {
          minArea = area
          best = child
        }
      }
      node = best
    }
    return node
  }

  private split() {
    this.sortBySmallestMarginAxis()
    const splitIndex = this.chooseSplitIndex()
    if (this.parent) {
      const newNode = new RTree(this.children.splice(splitIndex), this.max, this.min, this.leaf, this.parent)
      this.parent.leaf = false
      this.parent.children.push(newNode)
      this.updateRect()
      if (this.parent.children.length > this.parent.max) this.parent.split()
    }
    else {
      const leftNode = new RTree(this.children.slice(0, splitIndex), this.max, this.min, this.leaf, this)
      const rightNode = new RTree(this.children.slice(splitIndex), this.max, this.min, this.leaf, this)
      this.leaf = false
      this.children = [leftNode, rightNode]
      this.updateRect()
    }
  }

  private chooseSplitIndex() {
    let index = this.children.length - this.min
    let minOverlap = Infinity
    let minArea = Infinity
    const leftRect = new Rect(new Vector2(Infinity, Infinity), new Vector2(-Infinity, -Infinity))
    for (let index1 = 1; index1 <= this.children.length - this.min; index1++) {
      leftRect.extend(this.children[index1 - 1]!.rect)
      if (index1 < this.min) continue
      const rightRect = new Rect(new Vector2(Infinity, Infinity), new Vector2(-Infinity, -Infinity))
      for (let index2 = index1; index2 < this.children.length; index2++) rightRect.extend(this.children[index2]!.rect)
      const overlap = leftRect.intersection(rightRect)?.area() ?? 0
      const area = leftRect.area() + rightRect.area()
      if (overlap < minOverlap) {
        if (area < minArea) minArea = area
        minOverlap = overlap
        index = index1
      }
      else if (overlap === minOverlap && area < minArea) {
        minArea = area
        index = index1
      }
    }
    return index
  }

  private sortBySmallestMarginAxis() {
    const xSorted = [...this.children.sort(sortByMinX)]
    const xMargin = this.margin()
    this.children.sort(sortByMinY)
    const yMargin = this.margin()
    if (xMargin < yMargin) this.children = xSorted
  }

  private margin() {
    let margin = 0
    const leftRect = new Rect(new Vector2(Infinity, Infinity), new Vector2(-Infinity, -Infinity))
    const rightRect = new Rect(new Vector2(Infinity, Infinity), new Vector2(-Infinity, -Infinity))
    for (let index = 0; index < this.children.length - this.min; index++) {
      leftRect.extend(this.children[index]!.rect)
      rightRect.extend(this.children[this.children.length - index - 1]!.rect)
      if (index >= this.min - 1) margin += leftRect.margin() + rightRect.margin()
    }
    return margin
  }

  private updateRect(noPropagation?: boolean) {
    this.rect.a.x = Infinity
    this.rect.a.y = Infinity
    this.rect.b.x = -Infinity
    this.rect.b.y = -Infinity
    for (let index = 0; index < this.children.length; index++) this.rect.extend(this.children[index]!.rect)
    if (!noPropagation) this.parent?.updateRect()
  }

  public remove(rect: Rect) {
    const stack: RTree[] = [this]
    while (stack.length > 0) {
      const node = stack.pop()!
      if (node.leaf) {
        for (let index = 0; index < node.children.length; index++)
          if (node.children[index]!.rect.equals(rect)) {
            node.children.splice(index, 1)
            node.condense()
            return this
          }
      }
      else for (let index = 0; index < node.children.length; index++) stack.push(node.children[index]!)
    }
    return this
  }

  private condense() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias, unicorn/no-this-assignment
    let node: RTree = this
    while (true) {
      if (node.children.length === 0 && node.parent) {
        node.parent.children.splice(node.parent.children.indexOf(node), 1)
        node = node.parent
      }
      else {
        node.updateRect()
        break
      }
    }
  }
}
const sortByMinX = (a: RTree, b: RTree) => a.rect.a.x - b.rect.a.x
const sortByMinY = (a: RTree, b: RTree) => a.rect.a.y - b.rect.a.y
