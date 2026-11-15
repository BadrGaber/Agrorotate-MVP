import { useEffect, useState } from "react";

export type SoundName = "click" | "type" | "whoosh" | "resolve";

const STORAGE_KEY = "agrorotate.sound.muted";
const TYPE_THROTTLE_MS = 50;
const ROUTE_SOUND_GAP_MS = 150;

const VOLUMES: Record<SoundName, number> = {
  click: 0.75,
  type: 0.35,
  whoosh: 0.65,
  resolve: 0.75,
};

const TEXT_INPUT_TYPES = new Set([
  "text",
  "search",
  "email",
  "number",
  "tel",
  "url",
  "password",
]);

const INTERACTIVE_SELECTOR = [
  "button",
  "a[href]",
  "[role='button']",
  "input[type='checkbox']",
  "input[type='radio']",
  "select",
  "summary",
  ".btn",
  "[data-clickable='true']",
].join(",");




const TYPE_WAV_BASE64 =
  "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";

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function resolveSoundUrl(name: SoundName): string {
  const base = (typeof import.meta !== "undefined" && import.meta.env?.BASE_URL
    ? import.meta.env.BASE_URL
    : "/"
  ).replace(/\/$/, "");

  return `${base}/sounds/${name}.wav`;
}

let muted = readMuted();
let lastTypeAt = 0;
let lastCueAt = 0;
let installed = false;
const muteListeners = new Set<() => void>();


let audioCtx: AudioContext | null = null;
const audioBuffers = new Map<SoundName, AudioBuffer>();
const bufferLoading = new Set<SoundName>();

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {

    });
  }
  return audioCtx;
}


async function loadAudioBuffer(name: SoundName): Promise<AudioBuffer | null> {
  const ctx = getAudioContext();
  if (!ctx) return null;
  if (audioBuffers.has(name)) return audioBuffers.get(name)!;
  if (bufferLoading.has(name)) return null;

  bufferLoading.add(name);


  if (name === "type") {
    try {
      const decoded = await ctx.decodeAudioData(base64ToArrayBuffer(TYPE_WAV_BASE64));
      audioBuffers.set("type", decoded);
      bufferLoading.delete("type");
      return decoded;
    } catch {
      bufferLoading.delete("type");
      return null;
    }
  }

  try {
    const url = resolveSoundUrl(name);
    const res = await fetch(url);
    if (res.ok) {
      const arrayBuffer = await res.arrayBuffer();
      const decoded = await ctx.decodeAudioData(arrayBuffer);
      audioBuffers.set(name, decoded);
      bufferLoading.delete(name);
      return decoded;
    }
  } catch {

  }

  bufferLoading.delete(name);
  return null;
}


function preloadAllSounds() {
  const names: SoundName[] = ["type", "click", "whoosh", "resolve"];
  names.forEach((name) => {
    void loadAudioBuffer(name);
  });
}


function synthesizeSound(ctx: AudioContext, name: SoundName, volume: number) {
  const now = ctx.currentTime;
  const gain = ctx.createGain();
  gain.connect(ctx.destination);

  if (name === "click") {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(920, now);
    osc.frequency.exponentialRampToValueAtTime(350, now + 0.05);

    gain.gain.setValueAtTime(volume * 0.9, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.06);
  } else if (name === "type") {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1450, now);

    gain.gain.setValueAtTime(volume * 0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.03);
  } else if (name === "whoosh") {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(580, now + 0.16);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.28);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume * 0.7, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.28);
  } else if (name === "resolve") {
    const chord = [523.25, 659.25, 783.99, 1046.5];
    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);

      noteGain.gain.setValueAtTime((volume / chord.length) * 0.85, now + idx * 0.02);
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(noteGain);
      noteGain.connect(ctx.destination);
      osc.start(now + idx * 0.02);
      osc.stop(now + 0.45);
    });
  }
}

function nowMs(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function readMuted(): boolean {
  try {
    return typeof window !== "undefined" && window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function notifyMuted() {
  muteListeners.forEach((listener) => listener());
}

export function isSoundMuted(): boolean {
  return muted;
}

export function setSoundMuted(next: boolean): void {
  muted = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
  } catch {

  }
  notifyMuted();
}

export function subscribeSoundMuted(listener: () => void): () => void {
  muteListeners.add(listener);
  return () => {
    muteListeners.delete(listener);
  };
}


export function useSoundMuted(): [boolean, (next: boolean) => void] {
  const [current, setCurrent] = useState(isSoundMuted);
  useEffect(() => subscribeSoundMuted(() => setCurrent(isSoundMuted())), []);
  return [current, setSoundMuted];
}


export function playSound(name: SoundName): void {
  if (muted) return;
  const now = nowMs();
  if (name === "type") {
    if (now - lastTypeAt < TYPE_THROTTLE_MS) return;
    lastTypeAt = now;
  }
  lastCueAt = now;

  const ctx = getAudioContext();
  if (!ctx) {

    try {
      const url = resolveSoundUrl(name);
      const audio = new Audio(url);
      audio.volume = VOLUMES[name];
      audio.play().catch(() => {});
    } catch {}
    return;
  }


  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  const buffer = audioBuffers.get(name);
  if (buffer) {
    try {
      const source = ctx.createBufferSource();
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(VOLUMES[name], ctx.currentTime);
      source.buffer = buffer;
      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      source.start();
      return;
    } catch {

    }
  }


  try {
    synthesizeSound(ctx, name, VOLUMES[name]);
  } catch {}
}




export function playRouteSound(): void {
  if (nowMs() - lastCueAt < ROUTE_SOUND_GAP_MS) return;
  playSound("whoosh");
}

function handleClick(event: MouseEvent) {

  getAudioContext();

  const target = event.target;
  if (!(target instanceof Element)) return;
  const control = target.closest(INTERACTIVE_SELECTOR);
  if (!control) return;
  if (control.closest("[data-sound='off']")) return;
  if (control.getAttribute("aria-disabled") === "true") return;
  if (control instanceof HTMLButtonElement && control.disabled) return;
  if (control instanceof HTMLAnchorElement && !control.getAttribute("href")) return;

  const cue = control.getAttribute("data-sound");
  if (cue === "off") return;
  if (cue === "click" || cue === "type" || cue === "whoosh" || cue === "resolve") {
    playSound(cue);
    return;
  }


  if (control instanceof HTMLButtonElement && control.type === "submit") return;

  playSound("click");
}

function handleSubmit(event: Event) {
  getAudioContext();
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;
  if (form.closest("[data-sound='off']")) return;
  playSound("resolve");
}

function handleInput(event: Event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;
  if (target.closest("[data-sound='off']")) return;
  if (target.readOnly || target.disabled) return;
  if (target instanceof HTMLInputElement && !TEXT_INPUT_TYPES.has(target.type)) return;
  if (event instanceof InputEvent && event.isComposing) return;
  playSound("type");
}




export function installSoundEffects(): () => void {
  if (installed || typeof document === "undefined") return () => undefined;
  installed = true;


  preloadAllSounds();

  const unlockAudio = () => {
    getAudioContext();
    window.removeEventListener("pointerdown", unlockAudio);
    window.removeEventListener("keydown", unlockAudio);
  };
  window.addEventListener("pointerdown", unlockAudio, { once: true, passive: true });
  window.addEventListener("keydown", unlockAudio, { once: true, passive: true });

  document.addEventListener("click", handleClick, true);
  document.addEventListener("submit", handleSubmit, true);
  document.addEventListener("input", handleInput, true);

  return () => {
    document.removeEventListener("click", handleClick, true);
    document.removeEventListener("submit", handleSubmit, true);
    document.removeEventListener("input", handleInput, true);
    window.removeEventListener("pointerdown", unlockAudio);
    window.removeEventListener("keydown", unlockAudio);
    installed = false;
  };
}
