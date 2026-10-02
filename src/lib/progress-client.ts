import type { Progress } from "../schemas/progress";

type ProgressListener = (progress: Progress) => void;

const KEEPALIVE_MS = 30_000;
const MAX_RECONNECT_DELAY_MS = 30_000;

const listeners = new Set<ProgressListener>();
let latest: Progress | null = null;
let connectedStudentId: string | null = null;

function emit(progress: Progress): void {
  latest = progress;
  for (const listener of listeners) listener(progress);
}

async function fetchProgress(studentId: string): Promise<void> {
  try {
    const response = await fetch(`/api/progress/${studentId}`);
    if (response.ok) emit((await response.json()) as Progress);
  } catch (error) {
    console.error("Failed to fetch progress", error);
  }
}

/**
 * Holds one WebSocket per page to the student's ProgressHub Durable Object
 * (src/durable-objects/progress-hub.ts), which pushes the full Progress
 * whenever the student's agent PUTs /api/progress. Fetches over HTTP on every
 * (re)connect so nothing missed while disconnected is lost.
 */
function connect(studentId: string): void {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const url = `${protocol}//${window.location.host}/api/progress/${studentId}/live`;
  let reconnectDelay = 1000;
  let socket: WebSocket;
  let keepalive: ReturnType<typeof setInterval> | undefined;
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

  function open(): void {
    reconnectTimer = undefined;
    socket = new WebSocket(url);
    socket.addEventListener("open", () => {
      reconnectDelay = 1000;
      void fetchProgress(studentId);
      keepalive = setInterval(() => socket.send("ping"), KEEPALIVE_MS);
    });
    socket.addEventListener("message", (event) => {
      if (event.data === "pong") return;
      emit(JSON.parse(event.data as string) as Progress);
    });
    socket.addEventListener("close", () => {
      clearInterval(keepalive);
      reconnectTimer = setTimeout(open, reconnectDelay);
      reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY_MS);
    });
  }

  // Skip the rest of the backoff when the student comes back to this tab
  // (e.g. after a laptop sleep dropped the connection).
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible" || reconnectTimer === undefined) return;
    clearTimeout(reconnectTimer);
    reconnectDelay = 1000;
    open();
  });

  open();
}

/**
 * Calls `listener` with the student's progress now (if known) and again on
 * every change. Safe to call from several client modules on the same page:
 * they share one connection.
 */
export function subscribeToProgress(studentId: string, listener: ProgressListener): void {
  listeners.add(listener);
  if (connectedStudentId === studentId) {
    if (latest) listener(latest);
    return;
  }
  connectedStudentId = studentId;
  connect(studentId);
}
