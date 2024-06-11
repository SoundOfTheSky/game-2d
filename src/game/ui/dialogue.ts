import Game from "../game";
import { Tickable, Ticker } from "../ticker";

export default class Dialogue extends Ticker {
  public constructor(public game: Game, parent: Ticker, priority = 0) {
    super(parent, priority);
  }

  public tick(deltaTime: number): void {
      
  }
}