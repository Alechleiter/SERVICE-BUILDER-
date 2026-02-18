"use client";
import { useEffect, useRef, useCallback } from "react";

/**
 * Auto-save hook: debounced save to localStorage.
 *
 * - Saves `data` under `storageKey` after `delay` ms of inactivity
 * - **Flushes immediately on unmount / tab close** so no data is ever lost
 * - Returns { clear, restore } helpers
 */
export interface AutoSaveData {
  templateId: string;
  formData: Record<string, string>;
  inspectionDate: string;
  selectedClientId?: string;
  proposalName?: string;
  photoCount?: number;
  savedAt: number; // timestamp
}

const STORAGE_PREFIX = "sb-autosave-";

function writeToStorage(key: string, data: AutoSaveData): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch {
    /* localStorage full or unavailable — ignore */
  }
}

export function useAutoSave(
  storageKey: string,
  data: AutoSaveData | null,
  delay = 2000,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fullKey = STORAGE_PREFIX + storageKey;

  // Keep a ref to the latest data so we can flush it on unmount
  const latestDataRef = useRef<AutoSaveData | null>(data);
  latestDataRef.current = data;

  const fullKeyRef = useRef(fullKey);
  fullKeyRef.current = fullKey;

  // Debounced save — writes after `delay` ms of inactivity
  useEffect(() => {
    if (!data) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      writeToStorage(fullKey, data);
      timerRef.current = null;
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [data, fullKey, delay]);

  // Flush on unmount — if there's pending data, write it NOW
  useEffect(() => {
    return () => {
      if (latestDataRef.current) {
        writeToStorage(fullKeyRef.current, latestDataRef.current);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Also flush on tab close / before-unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (latestDataRef.current) {
        writeToStorage(fullKeyRef.current, latestDataRef.current);
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Also flush on visibility change (user switches tabs / minimizes)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden" && latestDataRef.current) {
        writeToStorage(fullKeyRef.current, latestDataRef.current);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // Clear saved draft
  const clear = useCallback(() => {
    try {
      window.localStorage.removeItem(fullKey);
    } catch {
      /* ignore */
    }
  }, [fullKey]);

  // Restore saved draft (synchronous)
  const restore = useCallback((): AutoSaveData | null => {
    try {
      const raw = window.localStorage.getItem(fullKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as AutoSaveData;
      // Expire drafts older than 7 days
      if (Date.now() - parsed.savedAt > 7 * 24 * 60 * 60 * 1000) {
        window.localStorage.removeItem(fullKey);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }, [fullKey]);

  return { clear, restore };
}
