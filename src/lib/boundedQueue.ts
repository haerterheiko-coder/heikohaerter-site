// ============================
// File: src/lib/boundedQueue.ts
// ============================
export type DropPolicy = "drop-new" | "drop-old";

/**
 * BoundedQueue<T>
 * Ringpuffer (circular buffer) mit O(1) enqueue/dequeue.
 * Warum: vermeidet O(n)-Kosten von Array.shift() bei hoher Eventrate.
 */
export class BoundedQueue<T> {
  private buf: (T | undefined)[];
  private head = 0; // liest hier
  private tail = 0; // schreibt hier
  private len = 0;

  constructor(private readonly cap: number, private policy: DropPolicy = "drop-new") {
    if (!Number.isFinite(cap) || !Number.isInteger(cap) || cap <= 0) {
      throw new Error("capacity must be a finite integer > 0");
    }
    if (policy !== "drop-new" && policy !== "drop-old") {
      throw new Error('policy must be "drop-new" or "drop-old"');
    }
    this.buf = new Array<T | undefined>(cap);
  }

  /** Anzahl aktuell gespeicherter Elemente. */
  size(): number { return this.len; }

  /** Maximalgröße des Puffers. */
  capacity(): number { return this.cap; }

  /** Noch freie Plätze. */
  remaining(): number { return this.cap - this.len; }

  /** Ist die Queue leer? */
  isEmpty(): boolean { return this.len === 0; }

  /** Ist die Queue voll? */
  isFull(): boolean { return this.len === this.cap; }

  /**
   * Fügt ein Element hinzu.
   * - "drop-new": bei voller Queue wird das neue Element verworfen → false.
   * - "drop-old": bei voller Queue wird das älteste Element überschrieben.
   */
  enqueue(item: T): boolean {
    if (this.len < this.cap) {
      this.buf[this.tail] = item;
      this.tail = (this.tail + 1) % this.cap;
      this.len++;
      return true;
    }
    if (this.policy === "drop-old") {
      // ältestes Element „verlieren“
      this.head = (this.head + 1) % this.cap;
      this.buf[this.tail] = item;
      this.tail = (this.tail + 1) % this.cap;
      // len bleibt unverändert (weiterhin voll)
      return true;
    }
    return false; // drop-new
  }

  /**
   * Entfernt und liefert das älteste Element oder undefined bei leerer Queue.
   */
  dequeue(): T | undefined {
    if (this.len === 0) return undefined;
    const val = this.buf[this.head];
    // optional: Slot leeren, damit GC schneller freigibt
    this.buf[this.head] = undefined;
    this.head = (this.head + 1) % this.cap;
    this.len--;
    return val as T | undefined;
  }

  /**
   * Schaut auf das älteste Element, ohne es zu entfernen.
   */
  peek(): T | undefined {
    if (this.len === 0) return undefined;
    return this.buf[this.head] as T | undefined;
  }

  /**
   * Leert die Queue vollständig.
   */
  clear(): void {
    // warum: schnelle Rücksetzung ohne Neuallokation
    this.buf.fill(undefined);
    this.head = 0;
    this.tail = 0;
    this.len = 0;
  }

  /**
   * Snapshot als Array in FIFO-Reihenfolge (teuer bei großen Queues → nur für Debug).
   */
  toArray(): T[] {
    const out: T[] = new Array(this.len);
    for (let i = 0; i < this.len; i++) {
      const idx = (this.head + i) % this.cap;
      out[i] = this.buf[idx] as T;
    }
    return out;
  }

  /**
   * Ändert die Drop-Policy zur Laufzeit (optional).
   */
  setPolicy(policy: DropPolicy): void {
    if (policy !== "drop-new" && policy !== "drop-old") {
      throw new Error('policy must be "drop-new" or "drop-old"');
    }
    this.policy = policy;
  }

  /**
   * Liefert aktuelle Drop-Policy.
   */
  getPolicy(): DropPolicy {
    return this.policy;
  }
}
