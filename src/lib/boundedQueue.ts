// ============================
// File: src/lib/boundedQueue.ts
// ============================
export type DropPolicy = "drop-new" | "drop-old";

export class BoundedQueue<T> {
  private buf: T[] = [];
  constructor(private capacity: number, private policy: DropPolicy = "drop-new") {
    if (capacity <= 0) throw new Error("capacity must be > 0");
  }

  size(): number { return this.buf.length; }
  isEmpty(): boolean { return this.buf.length === 0; }
  clear(): void { this.buf = []; }

  enqueue(item: T): boolean {
    if (this.buf.length < this.capacity) {
      this.buf.push(item);
      return true;
    }
    if (this.policy === "drop-old") {
      // why: UI soll aktuell bleiben
      this.buf.shift();
      this.buf.push(item);
      return true;
    }
    return false; // drop-new: Erzeuger spürt Backpressure
  }

  dequeue(): T | undefined { return this.buf.shift(); }
}
