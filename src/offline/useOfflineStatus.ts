import { useEffect, useState } from "react";
import {
  EMPTY_OFFLINE_STATUS,
  requestOfflineStatus,
  type OfflineCacheStatus,
} from "./register";






export function useOfflineStatus(): OfflineCacheStatus {
  const [status, setStatus] = useState<OfflineCacheStatus>(EMPTY_OFFLINE_STATUS);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      setStatus({ ...EMPTY_OFFLINE_STATUS, supported: false });
      return;
    }

    let alive = true;
    const refresh = () => {
      requestOfflineStatus().then((next) => {
        if (alive) setStatus(next);
      });
    };
    const onMessage = (event: MessageEvent<{ type?: string } & OfflineCacheStatus>) => {
      if (event.data?.type === "AGROTATE_CACHE_STATUS" && alive) {
        setStatus(event.data);
      }
    };

    navigator.serviceWorker.addEventListener("message", onMessage);
    navigator.serviceWorker.ready.then(refresh).catch(() => undefined);
    const timer = window.setTimeout(refresh, 1800);

    return () => {
      alive = false;
      window.clearTimeout(timer);
      navigator.serviceWorker.removeEventListener("message", onMessage);
    };
  }, []);

  return status;
}
