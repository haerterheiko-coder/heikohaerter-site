// ===============================
// File: src/lib/boundedLogger.ts
// ===============================
import { useEffect, useMemo, useRef } from "react";
import { BoundedQueue, DropPolicy } from "./boundedQueue";

export type LoggerSink = (line: string) => void;
export type LoggerFormatter = (msg: string) => string;

type LoggerState = {
  queue: BoundedQueue<string>;
  dropped: number;
  running: boolean;
  subscribers: number;
  sink: LoggerSink;
  formatter: LoggerFormatter;
};

const state: LoggerState = {
  queue: new BoundedQueue<string>(100, "drop-old"),
  dropped: 0,
  running: false,
  subscribers: 0,
  sink: (line) => console.log(line),
  // Warum: immer Zeitkontext für spätere Auswertung
  formatter: (msg) => `[LOG ${new Date().toISOString()}] ${msg}`,
};

let intervalId: number | null = null;

function hasWindow(): boolean {
  // Warum: SSR-Support; im Server-Kontext keine Timer/Register
  return typeof window !== "undefined" && typeof window.setInterval === "function";
}

function startConsumer() {
  if (state.running || !hasWindow()) return;
  state.running = true;
  intervalId = window.setInterval(() => {
    // warum: harte Obergrenze verhindert UI-Stalls
    let steps = 0;
    while (!state.queue.isEmpty() && steps < 50) {
      const line = state.queue.dequeue();
      if (line) state.sink(line);
      steps++;
    }
  }, 60);
}

function stopConsumer() {
  if (!state.running || !hasWindow()) return;
  if (intervalId !== null) {
    window.clearInterval(intervalId);
    intervalId = null;
  }
  state.running = false;
}

export function initBoundedLogger(opts?: {
  capacity?: number;
  dropPolicy?: DropPolicy;
  sink?: LoggerSink;
  formatter?: LoggerFormatter;
}): void {
  if (opts?.capacity || opts?.dropPolicy) {
    state.queue = new BoundedQueue<string>(opts?.capacity ?? 100, opts?.dropPolicy ?? "drop-old");
  }
  if (opts?.sink) state.sink = opts.sink;
  if (opts?.formatter) state.formatter = opts.formatter;
  startConsumer();
}

export function setSink(sink: LoggerSink): void {
  state.sink = sink;
}

export function setFormatter(formatter: LoggerFormatter): void {
  state.formatter = formatter;
}

export function log(msg: string): void {
  const ok = state.queue.enqueue(state.formatter(msg));
  if (!ok) state.dropped++;
}

export function droppedCount(): number {
  return state.dropped;
}

export function getQueueLength(): number {
  return state.queue.size?.() ?? (state as any).queue?.["buf"]?.length ?? 0;
}

export function flush(maxSteps = Infinity): number {
  // Warum: gezielt vor pagehide/unload leeren
  let n = 0;
  while (!state.queue.isEmpty() && n < maxSteps) {
    const line = state.queue.dequeue();
    if (line) state.sink(line);
    n++;
  }
  return n;
}

export function stop(): void {
  // Warum: explizites Abschalten (Tests/Hard reset)
  stopConsumer();
}

/**
 * React-Hook:
 * - Initialisiert Logger (optional: capacity, policy, sink, formatter)
 * - Kapselt Start/Stop via Subscriber-Refcount (kein globaler Stop bei unmount eines Consumers)
 * - Sink-Ref bleibt stabil; ändert sich `options.sink`, wird sie übernommen
 */
export function useBoundedLogger(options?: {
  capacity?: number;
  dropPolicy?: DropPolicy;
  sink?: LoggerSink;
  formatter?: LoggerFormatter;
}) {
  const sinkRef = useRef<LoggerSink>(options?.sink ?? state.sink);
  const fmtRef = useRef<LoggerFormatter>(options?.formatter ?? state.formatter);

  // Sink/Formatter live aktualisieren, ohne Consumer neu zu starten
  useEffect(() => {
    if (options?.sink) {
      sinkRef.current = options.sink;
      setSink((line) => sinkRef.current(line)); // warum: Delegation erlaubt späten Austausch
      setSink(options.sink); // direkte Übergabe, damit keine doppelten Wraps
    }
  }, [options?.sink]);

  useEffect(() => {
    if (options?.formatter) {
      fmtRef.current = options.formatter;
      setFormatter(options.formatter);
    }
  }, [options?.formatter]);

  // Init + Refcount
  useEffect(() => {
    initBoundedLogger({
      capacity: options?.capacity,
      dropPolicy: options?.dropPolicy,
      sink: sinkRef.current,
      formatter: fmtRef.current,
    });
    state.subscribers++;

    return () => {
      state.subscribers = Math.max(0, state.subscribers - 1);
      if (state.subscribers === 0) stopConsumer(); // nur letzter Subscriber stoppt
    };
    // capacity/policy ändern die Queue; absichtlich im Dep-Array
  }, [options?.capacity, options?.dropPolicy]);

  // Optional: Bei Tab-Verlust schnell flushen (best effort)
  useEffect(() => {
    if (!hasWindow()) return;
    const onHide = () => flush(200);
    window.addEventListener("pagehide", onHide);
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") onHide();
    });
    return () => {
      window.removeEventListener("pagehide", onHide);
    };
  }, []);

  return useMemo(
    () => ({
      log,
      droppedCount,
      getQueueLength,
      flush,
      setSink,
      setFormatter,
      stop,
    }),
    []
  );
}
