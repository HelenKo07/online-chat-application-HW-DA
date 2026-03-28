import { useEffect } from 'react';
import { api } from '../lib/api';

const HEARTBEAT_INTERVAL_MS = 25000;
const ACTIVE_WINDOW_MS = 60 * 1000;
const TAB_ID_STORAGE_KEY = 'chat_presence_tab_id';
const TABS_ACTIVITY_KEY = 'chat_tabs_activity_v1';

export function usePresenceHeartbeat(enabled: boolean) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const tabId = getOrCreateTabId();

    const sendHeartbeat = () => {
      const isActive = isAnyTabActive(tabId);
      void api.heartbeat({ isActive, tabId });
    };

    const markActive = () => {
      touchTabActivity(tabId);
      sendHeartbeat();
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        touchTabActivity(tabId);
      }
      sendHeartbeat();
    };

    touchTabActivity(tabId);
    sendHeartbeat();

    const intervalId = window.setInterval(() => {
      sendHeartbeat();
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
      clearTabActivity(tabId);
    };
  }, [enabled]);
}

function getOrCreateTabId() {
  const existing = window.sessionStorage.getItem(TAB_ID_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const generated =
    (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random()}`).replace(
      /[^a-zA-Z0-9_-]/g,
      '',
    );
  window.sessionStorage.setItem(TAB_ID_STORAGE_KEY, generated);
  return generated;
}

function readTabsActivity() {
  const raw = window.localStorage.getItem(TABS_ACTIVITY_KEY);
  if (!raw) {
    return {} as Record<string, number>;
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, number>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeTabsActivity(activity: Record<string, number>) {
  window.localStorage.setItem(TABS_ACTIVITY_KEY, JSON.stringify(activity));
}

function cleanupTabs(activity: Record<string, number>) {
  const now = Date.now();
  const next: Record<string, number> = {};

  for (const [tabId, lastActiveAt] of Object.entries(activity)) {
    if (now - lastActiveAt <= ACTIVE_WINDOW_MS * 3) {
      next[tabId] = lastActiveAt;
    }
  }

  return next;
}

function touchTabActivity(tabId: string) {
  const current = cleanupTabs(readTabsActivity());
  current[tabId] = Date.now();
  writeTabsActivity(current);
}

function clearTabActivity(tabId: string) {
  const current = cleanupTabs(readTabsActivity());
  delete current[tabId];
  writeTabsActivity(current);
}

function isAnyTabActive(tabId: string) {
  const current = cleanupTabs(readTabsActivity());
  current[tabId] = Math.max(current[tabId] ?? 0, Date.now() - 5_000);
  writeTabsActivity(current);

  const now = Date.now();
  return Object.values(current).some((lastActiveAt) => now - lastActiveAt <= ACTIVE_WINDOW_MS);
}
