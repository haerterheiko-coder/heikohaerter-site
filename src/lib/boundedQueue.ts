// ============================
// File: src/lib/boundedQueue.ts
// ============================
export type DropPolicy = "drop-new" | "drop-old";

/**
 * BoundedQueue<T>
 * - Ringpuffer (circular buffer) mit O(1) enqueue/dequeue.
 * - Keine Array.shift()-Kosten bei hoher Eventrate.
 * - Null-Alloc im Hot Path (bis auf .toArray()).
 * - API bleibt rückwärtskompatibel zu deiner bisherigen Version.
 */
export class BoundedQueue<T> {
  // intern: fester Ringpuffer
  private buf: (T | undefined)[];
  private head = 0; // liest hier
  private tail = 0; // schreibt hier
  private len = 0;

  constructor(
    private readonly cap: number,
    private policy: DropPolicy = "drop-new"
  ) {
    if (!Number.isFinite(cap) || !Number.isInteger(cap) || cap <= 0) {
      throw new Error("capacity must be a finite integer > 0");
    }
    if (policy !== "drop-new" && policy !== "drop-old") {
      throw new Error('policy must be "drop-new" or "drop-old"');
    }
    this.buf = new Array<T | undefined>(cap);
  }

  /** Anzahl aktuell gespeicherter Elemente. */
  size(): number {
    return this.len;
  }

  /** Maximalgröße des Puffers. */
  capacity(): number {
    return this.cap;
  }

  /** Noch freie Plätze. */
  remaining(): number {
    return this.cap - this.len;
  }

  /** Ist die Queue leer? */
  isEmpty(): boolean {
    return this.len === 0;
  }

  /** Ist die Queue voll? */
  isFull(): boolean {
    return this.len === this.cap;
  }

  /**
   * Fügt ein Element hinzu.
   * - "drop-new": bei voller Queue wird das neue Element verworfen → false.
   * - "drop-old": bei voller Queue wird das älteste Element überschrieben → true.
   */
  enqueue(item: T): boolean {
    if (this.len < this.cap) {
      this.buf[this.tail] = item;
      this.tail = (this.tail + 1) % this.cap;
      this.len++;
      return true;
    }
    if (this.policy === "drop-old") {
      // ältestes Element „verlieren“ und am Tail überschreiben
      this.head = (this.head + 1) % this.cap;
      this.buf[this.tail] = item;
      this.tail = (this.tail + 1) % this.cap;
      // len bleibt unverändert (weiterhin voll)
      return true;
    }
    return false; // drop-new
  }

  /**
   * Verbose-Variante von enqueue – liefert Status zurück.
   * ok          → erfolgreich enqueued
   * dropped     → neues Element verworfen (drop-new)
   * overwrote   → ältestes Element überschrieben (drop-old)
   */
  enqueueVerbose(item: T): "ok" | "dropped" | "overwrote" {
    if (this.len < this.cap) {
      this.buf[this.tail] = item;
      this.tail = (this.tail + 1) % this.cap;
      this.len++;
      return "ok";
    }
    if (this.policy === "drop-old") {
      this.head = (this.head + 1) % this.cap;
      this.buf[this.tail] = item;
      this.tail = (this.tail + 1) % this.cap;
      return "overwrote";
    }
    return "dropped";
  }

  /**
   * Entfernt und liefert das älteste Element oder undefined bei leerer Queue.
   */
  dequeue(): T | undefined {
    if (this.len === 0) return undefined;
    const val = this.buf[this.head];
    // Slot leeren, damit GC schneller freigibt
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
   * Leert die Queue vollständig (O(n) wegen Slot-Clear für GC).
   */
  clear(): void {
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
   * Drain: bis zu `max` Elemente effizient abholen.
   * Optional mit Consumer-Funktion (vermeidet Array-Alloc).
   * Rückgabewert ist die Anzahl verarbeiteter Elemente.
   */
  drain(max = Infinity, consumer?: (item: T) => void): number {
    if (this.len === 0 || max <= 0) return 0;
    let n = 0;
    if (consumer) {
      while (this.len > 0 && n < max) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const val = this.buf[this.head]!;
        this.buf[this.head] = undefined;
        this.head = (this.head + 1) % this.cap;
        this.len--;
        consumer(val);
        n++;
      }
      return n;
    }
    // Ohne Consumer → Array zurückgeben wäre Allokation.
    // Hier nur zählen (nützlich für Hot-Path-Prechecks).
    while (this.len > 0 && n < max) {
      this.buf[this.head] = undefined;
      this.head = (this.head + 1) % this.cap;
      this.len--;
      n++;
    }
    return n;
  }

  /** Ändert die Drop-Policy zur Laufzeit (optional). */
  setPolicy(policy: DropPolicy): void {
    if (policy !== "drop-new" && policy !== "drop-old") {
      throw new Error('policy must be "drop-new" or "drop-old"');
    }
    this.policy = policy;
  }

  /** Liefert aktuelle Drop-Policy. */
  getPolicy(): DropPolicy {
    return this.policy;
  }

  /** Iterator (FIFO) – nur zum Debuggen, nicht im Hot Path nutzen. */
  *[Symbol.iterator](): IterableIterator<T> {
    for (let i = 0; i < this.len; i++) {
      const idx = (this.head + i) % this.cap;
      yield this.buf[idx] as T;
    }
  }

  /** Debug-Tag in DevTools. */
  get [Symbol.toStringTag](): string {
    return `BoundedQueue(size=${this.len}, cap=${this.cap}, policy=${this.policy})`;
    }
}
