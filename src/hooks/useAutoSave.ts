"use client";
import { useEffect, useRef, useCallback } from "react";

/**
 * Auto-save hook: debounced save to localStorage.
 *
 * - Saves `data` under `storageKey` after `delay` ms of inactivity
 * - Returns { clear, restore } helpers
 * - `clear()` removes the saved draft
 * - `restore()` returns the saved draft (or null)
 */
export interface AutoSaveData {
  templateId: string;
  formData: Record<string, string>;
  inspectionDate: string;
  selectedClientId?: string;
  proposalName?: string;
  // Photos & mapData are complex objects — we save metadata only
  photoCount?: number;
  savedAt: number; // timestamp
}

const STORAGE_PREFIX = "sb-autosave-";

export function useAutoSave(
  storageKey: string,
  data: AutoSaveData | null,
  delay = 2000,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fullKey = STORAGE_PREFIX + storageKey;

  // Debounced save
  useEffect(() => {
    if (!data) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        window.localStorage.setItem(fullKey, JSON.stringify(data));
      } catch {
        /* localStorage full or unavailable — ignore */
      }
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [data, fullKey, delay]);

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
