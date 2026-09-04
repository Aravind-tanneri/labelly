import { useEffect, useState } from "react";
import NetInfo from "@react-native-community/netinfo";
import { syncPendingDrafts } from "../services/sync";

export function useOffline() {
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      // isInternetReachable can falsely report false on local Wi-Fi, emulators, or institutional networks
      // Only mark as offline if the network interface is disconnected (isConnected === false).
      const online = state.isConnected !== false;
      setIsOnline(online);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isOnline) return;
    let cancelled = false;
    void (async () => {
      setSyncing(true);
      try {
        await syncPendingDrafts();
      } catch {
        // Sync failures are recorded per-draft by the sync service.
      } finally {
        if (!cancelled) setSyncing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOnline]);

  return { isOnline, syncing };
}