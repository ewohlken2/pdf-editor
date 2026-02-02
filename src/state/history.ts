export class History<T> {
  private past: T[] = [];
  private present: T;
  private future: T[] = [];

  constructor(initial: T) {
    this.present = initial;
  }

  current() {
    return this.present;
  }

  push(next: T) {
    this.past.push(this.present);
    this.present = next;
    this.future = [];
  }

  undo() {
    const previous = this.past.pop();
    if (previous === undefined) return this.present;
    this.future.unshift(this.present);
    this.present = previous;
    return this.present;
  }

  redo() {
    const next = this.future.shift();
    if (next === undefined) return this.present;
    this.past.push(this.present);
    this.present = next;
    return this.present;
  }
}
