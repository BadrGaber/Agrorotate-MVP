export interface OfflineCacheStatus {
  supported: boolean;
  ready: boolean;
  entries: number;
  bytes: number;
  version?: string;
  precache?: {
    version: string;
    total: number;
    failed: number;
    manifestVersion: string | null;
    generatedAtIso: string;
    cachedAtIso: string;
  } | null;
  error?: string;
}

export const EMPTY_OFFLINE_STATUS: OfflineCacheStatus = {
  supported: typeof navigator !== "undefined" && "serviceWorker" in navigator,
  ready: false,
  entries: 0,
  bytes: 0,
};

let registration: Promise<ServiceWorkerRegistration | null> | null = null;

function serviceWorkerUrl(): string {
  const base = import.meta.env.BASE_URL || "/";
  return `${base}sw.js`.replace(/\/{2,}/g, "/");
}

export function registerOfflineSupport(): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (registration) return;

  registration = new Promise((resolve) => {
    const start = () => {
      navigator.serviceWorker
        .register(serviceWorkerUrl(), { scope: import.meta.env.BASE_URL || "/" })
        .then((reg) => {
          if (reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });
          resolve(reg);
        })
        .catch(() => resolve(null));
    };
    if (document.readyState === "complete") {
      start();
    } else {
      window.addEventListener("load", start, { once: true });
    }
  });
}


export async function requestOfflineStatus(): Promise<OfflineCacheStatus> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return { ...EMPTY_OFFLINE_STATUS, supported: false };
  }
  try {
    const reg = await navigator.serviceWorker.ready;
    const worker = reg.active || navigator.serviceWorker.controller;
    if (!worker) return EMPTY_OFFLINE_STATUS;
    return await new Promise<OfflineCacheStatus>((resolve) => {
      const channel = new MessageChannel();
      const timeout = window.setTimeout(() => resolve(EMPTY_OFFLINE_STATUS), 2500);
      channel.port1.onmessage = (event: MessageEvent<OfflineCacheStatus>) => {
        window.clearTimeout(timeout);
        resolve(event.data);
      };
      worker.postMessage({ type: "AGROTATE_CACHE_STATUS" }, [channel.port2]);
    });
  } catch {
    return EMPTY_OFFLINE_STATUS;
  }
}


export function precacheNow(): void {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker.ready
    .then((reg) => (reg.active || navigator.serviceWorker.controller)?.postMessage({ type: "AGROTATE_PRECACHE_NOW" }))
    .catch(() => undefined);
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
