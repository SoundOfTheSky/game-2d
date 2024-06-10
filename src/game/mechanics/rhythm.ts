import Game from '../game';
import { Tickable } from '../ticker';

export type RhythmOptions = {
  timings: number[];
  activateNoteTime: number;
};
export type Note = {
  key: string;
  time: number;
  mouse?: {
    x: number;
    y: number;
    r: number;
  };
  holdFor?: number;
  timings?: number[];
};

export default class Rhythm implements Tickable {
  public notes: Note[] = [];
  public combo = 0;
  public notesSoFar = 0;
  public accuracyScore = 0;
  public lastDelta = 0;
  public holdNotes: Note[] = [];

  public constructor(
    protected game: Game,
    public options: RhythmOptions,
  ) {}

  public add(note: Note) {
    this.notes.push(note);
  }

  public tick() {
    this.checkHoldNotes();
    this.checkNotes();
  }

  private getTimings(note: Note) {
    return note.timings ?? this.options.timings;
  }

  private checkIfNoteIsHit(note: Note) {
    return (
      (note.holdFor ? this.game.input.has(note.key) : this.game.input.getTicks(note.key) === 1) &&
      (note.mouse === undefined ||
        Math.sqrt((this.game.input.mouseX - note.mouse.x) ** 2 + (this.game.input.mouseY - note.mouse.y) ** 2) <=
          note.mouse.r)
    );
  }

  private checkNotes() {
    const usedKeys = new Set<string>();
    for (let i = 0; i < this.notes.length; i++) {
      const note = this.notes[i];
      const delta = note.time - this.game.time;
      if (delta > this.options.activateNoteTime) break;
      if (-delta > this.options.activateNoteTime) {
        this.notes.splice(i--, 1);
        this.notesSoFar++;
        continue;
      }
      if (!usedKeys.has(note.key) && this.checkIfNoteIsHit(note)) {
        const timings = this.getTimings(note);
        const deltaAbs = Math.abs(delta);
        this.lastDelta = delta;
        usedKeys.add(note.key);
        if (note.holdFor) this.holdNotes.push(note);
        const timing = timings.findIndex((x) => x > deltaAbs);
        if (timing !== -1) this.accuracyScore += 1 - timing / timings.length;
        this.notes.splice(i--, 1);
        this.notesSoFar++;
      }
    }
  }

  private checkHoldNotes() {
    for (let i = 0; i < this.holdNotes.length; i++) {
      const note = this.holdNotes[i];
      if (this.checkIfNoteIsHit(note)) {
        if (note.time + note.holdFor! + this.options.activateNoteTime >= this.game.time) {
          this.holdNotes.splice(i--, 1);
          this.notesSoFar++;
        }
      } else {
        const timings = this.getTimings(note);
        const deltaAbs = Math.abs(note.time + note.holdFor! - this.game.time);
        const timing = timings.findIndex((x) => x > deltaAbs);
        if (timing !== -1) this.accuracyScore += 1 - timing / timings.length;
        this.notes.splice(i--, 1);
        this.notesSoFar++;
      }
    }
  }
}
