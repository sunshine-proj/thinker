/**
 * Short synthesized tones and sound effects through the Web Audio API. Everything is
 * generated in the browser, so it works offline and needs no audio files. Sound is
 * always an extra: every game shows the same information as text.
 */

const MUTE_KEY = "physics-playground.muted";
type AudioContextConstructor = new () => AudioContext;

let context: AudioContext | null = null;
const listeners = new Set<(muted: boolean) => void>();

function audioConstructor(): AudioContextConstructor | null {
  if (typeof window === "undefined") {
    return null;
  }
  const candidate = (window as unknown as { AudioContext?: AudioContextConstructor; webkitAudioContext?: AudioContextConstructor });
  return candidate.AudioContext ?? candidate.webkitAudioContext ?? null;
}

export function isAudioSupported(): boolean {
  return audioConstructor() !== null;
}

export function isMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === "true";
  } catch {
    return false;
  }
}

export function setMuted(muted: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, String(muted));
  } catch {
    // The choice lasts only for this page view.
  }
  listeners.forEach((listener) => listener(muted));
}

export function subscribeMuted(listener: (muted: boolean) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getContext(): AudioContext | null {
  const Constructor = audioConstructor();
  if (!Constructor) {
    return null;
  }
  context ??= new Constructor();
  if (context.state === "suspended") {
    void context.resume();
  }
  return context;
}

export interface ToneOptions {
  readonly frequency: number;
  readonly durationSeconds?: number;
  /** 0–1; kept low by default to protect hearing. */
  readonly volume?: number;
  readonly type?: OscillatorType;
  /** Optional harmonic amplitudes (fundamental first) for a richer timbre. */
  readonly harmonics?: readonly number[];
}

/** Plays a tone; returns false when sound is muted or unavailable. */
export function playTone({ frequency, durationSeconds = 0.8, volume = 0.15, type = "sine", harmonics }: ToneOptions): boolean {
  if (isMuted() || !Number.isFinite(frequency) || frequency <= 0) {
    return false;
  }
  const audio = getContext();
  if (!audio) {
    return false;
  }
  const now = audio.currentTime;
  const gain = audio.createGain();
  // A short fade in and out avoids clicks.
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(Math.min(0.4, Math.max(0, volume)), now + 0.02);
  gain.gain.setValueAtTime(Math.min(0.4, Math.max(0, volume)), now + Math.max(0.03, durationSeconds - 0.08));
  gain.gain.linearRampToValueAtTime(0, now + durationSeconds);
  gain.connect(audio.destination);
  const partials = harmonics && harmonics.length > 0 ? harmonics : [1];
  const total = partials.reduce((sum, amplitude) => sum + Math.abs(amplitude), 0) || 1;
  partials.forEach((amplitude, index) => {
    if (amplitude === 0) {
      return;
    }
    const oscillator = audio.createOscillator();
    const partialGain = audio.createGain();
    oscillator.type = harmonics ? "sine" : type;
    oscillator.frequency.setValueAtTime(frequency * (index + 1), now);
    partialGain.gain.value = amplitude / total;
    oscillator.connect(partialGain).connect(gain);
    oscillator.start(now);
    oscillator.stop(now + durationSeconds);
  });
  return true;
}

/** Short original feedback sounds. */
export function playEffect(effect: "success" | "miss" | "complete"): boolean {
  const notes: Record<typeof effect, readonly number[]> = {
    success: [660, 880],
    miss: [330, 262],
    complete: [523, 659, 784, 1047],
  };
  const sequence = notes[effect];
  if (isMuted() || !getContext()) {
    return false;
  }
  sequence.forEach((frequency, index) => {
    window.setTimeout(() => playTone({ frequency, durationSeconds: 0.14, volume: 0.08, type: "triangle" }), index * 110);
  });
  return true;
}
