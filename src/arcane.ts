export interface ArcanePlayer {
  play: () => void;
  emitUIEvent: (descriptor: string | object) => boolean;
  onReceiveEvent: (name: string, listener: (response: string) => void) => void;
  onPlayerEvent: (name: string, listener: (data?: unknown) => void) => void;
  toggleFullscreen: () => boolean;
}

declare global {
  interface Window {
    ArcanePlayer?: ArcanePlayer;
    initArcanePlayer?: () => void;
  }
}

export function initArcanePlayer() {
  if (
    typeof window === "undefined" ||
    typeof window.initArcanePlayer !== "function"
  )
    return;
  window.initArcanePlayer();
}

export function getArcane(): ArcanePlayer {
  const arcane = getArcaneOrNull();
  if (!arcane) throw new Error("could not load arcane player");
  return arcane;
}

export function getArcaneOrNull(): ArcanePlayer | null {
  return typeof window !== "undefined" ? window["ArcanePlayer"] ?? null : null;
}
