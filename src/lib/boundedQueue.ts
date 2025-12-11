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

// ===============================
// File: src/lib/boundedLogger.ts
// ===============================
import { useEffect, useMemo, useRef } from "react";
import { BoundedQueue, DropPolicy } from "./boundedQueue";

export type LoggerSink = (line: string) => void;

const state = {
  queue: new BoundedQueue<string>(100, "drop-old" as DropPolicy),
  dropped: 0,
  running: false,
};
let intervalId: number | null = null;

function startConsumer(sink: LoggerSink) {
  if (state.running) return;
  state.running = true;
  intervalId = window.setInterval(() => {
    let steps = 0;
    while (!state.queue.isEmpty() && steps < 50) {
      const line = state.queue.dequeue();
      if (line) sink(line);
      steps++;
    }
  }, 50);
}

export function initBoundedLogger(opts?: { capacity?: number; dropPolicy?: DropPolicy; sink?: LoggerSink }) {
  if (opts?.capacity || opts?.dropPolicy) {
    state.queue = new BoundedQueue<string>(opts.capacity ?? 100, opts.dropPolicy ?? "drop-old");
  }
  startConsumer(opts?.sink ?? ((line) => console.log(line)));
}

export function log(msg: string): void {
  const ok = state.queue.enqueue(msg);
  if (!ok) state.dropped++;
}

export function droppedCount(): number {
  return state.dropped;
}

export function useBoundedLogger(options?: { capacity?: number; dropPolicy?: DropPolicy; sink?: LoggerSink }) {
  const sinkRef = useRef<LoggerSink>(options?.sink ?? ((line) => console.log(line)));

  useEffect(() => {
    initBoundedLogger({
      capacity: options?.capacity,
      dropPolicy: options?.dropPolicy,
      sink: sinkRef.current,
    });
    return () => {
      if (intervalId !== null) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
      state.running = false;
    };
  }, [options?.capacity, options?.dropPolicy]);

  return useMemo(() => ({ log, droppedCount }), []);
}

// =======================================================
// A) Next.js **app Router** (du hast `app/page.tsx` etc.)
// =======================================================
// File: app/page.tsx
"use client";
import React from "react";
import { useBoundedLogger } from "../src/lib/boundedLogger"; // passe den Pfad an, falls dein tsconfig baseUrl nutzt

export default function Page() {
  const logger = useBoundedLogger({ capacity: 200, dropPolicy: "drop-old" });

  return (
    <main style={{ padding: 16 }}>
      <h1>Startseite (Next.js app router)</h1>
      <button
        onClick={() => {
          for (let i = 0; i < 500; i++) {
            logger.log(`Index event #${i} @ ${new Date().toISOString()}`);
          }
          alert(`gesendet; evtl. gedropped: ${logger.droppedCount()}`);
        }}
      >
        Events feuern
      </button>
      <p>Gedroppte Logs: {logger.droppedCount()}</p>
    </main>
  );
}

// Optional: File: app/weiterempfehlen/page.tsx
"use client";
import React from "react";
import { useBoundedLogger } from "../../src/lib/boundedLogger";

export default function WeiterempfehlenPage() {
  const logger = useBoundedLogger();
  return (
    <main style={{ padding: 16 }}>
      <h1>Weiterempfehlen</h1>
      <button onClick={() => logger.log("Share geklickt")}>Share</button>
      <p>Gedroppte Logs: {logger.droppedCount()}</p>
    </main>
  );
}

// ==================================================================
// B) Next.js **pages Router** (du hast `pages/index.tsx` etc.)
// ==================================================================
// File: pages/index.tsx
import React from "react";
import { useBoundedLogger } from "../src/lib/boundedLogger";

export default function IndexPage() {
  const logger = useBoundedLogger({ capacity: 200, dropPolicy: "drop-old" });
  return (
    <main style={{ padding: 16 }}>
      <h1>Startseite (Next.js pages router)</h1>
      <button
        onClick={() => {
          for (let i = 0; i < 300; i++) logger.log(`click ${i}`);
          alert(`gedropped: ${logger.droppedCount()}`);
        }}
      >
        Klicks simulieren
      </button>
    </main>
  );
}

// Optional: File: pages/weiterempfehlen.tsx
import React from "react";
import { useBoundedLogger } from "../src/lib/boundedLogger";

export default function Weiterempfehlen() {
  const logger = useBoundedLogger();
  return (
    <main style={{ padding: 16 }}>
      <h1>Weiterempfehlen</h1>
      <button onClick={() => logger.log("Share geklickt")}>Share</button>
      <p>Gedroppte Logs: {logger.droppedCount()}</p>
    </main>
  );
}

// ========================================================
// C) CRA / Vite (du hast `src/App.tsx` als Einstieg)
// ========================================================
// File: src/App.tsx
import React from "react";
import { useBoundedLogger } from "./lib/boundedLogger";

export default function App() {
  const logger = useBoundedLogger();
  return (
    <div style={{ padding: 16 }}>
      <h1>Startseite (CRA/Vite)</h1>
      <button onClick={() => logger.log("Klick auf Startseite")}>Klick</button>
      <p>Gedroppte Logs: {logger.droppedCount()}</p>
    </div>
  );
}
