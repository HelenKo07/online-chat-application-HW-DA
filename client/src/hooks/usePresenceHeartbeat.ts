import { useEffect } from 'react';
import { api } from '../lib/api';

const HEARTBEAT_INTERVAL_MS = 25000;

export function usePresenceHeartbeat(enabled: boolean) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    let isActive = true;

    const sendHeartbeat = () => {
      void api.heartbeat({ isActive });
    };

    const markActive = () => {
      isActive = true;
      sendHeartbeat();
    };

    const handleVisibility = () => {
      isActive = document.visibilityState === 'visible';
      sendHeartbeat();
    };

    sendHeartbeat();

    const intervalId = window.setInterval(() => {
      sendHeartbeat();
      isActive = false;
    }, HEARTBEAT_INTERVAL_MS);

    window.addEventListener('pointerdown', markActive);
    window.addEventListener('keydown', markActive);
    window.addEventListener('focus', markActive);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('pointerdown', markActive);
      window.removeEventListener('keydown', markActive);
      window.removeEventListener('focus', markActive);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [enabled]);
}
