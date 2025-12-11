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
