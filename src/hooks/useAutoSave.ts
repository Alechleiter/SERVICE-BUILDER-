"use client";
import { useEffect, useRef, useCallback } from "react";
import type { PhotoEntry, MapData } from "@/lib/proposals/types";

/**
 * Auto-save hook using IndexedDB for full proposal data (photos, map, form).
 *
 * - Debounced save every `delay` ms
 * - Flushes immediately on unmount / tab close / visibility change
 * - Uses IndexedDB (not localStorage) so photos & map images don't hit the 5MB limit
 */
export interface AutoSaveData {
  templateId: string;
  formData: Record<string, string>;
  inspectionDate: string;
  selectedClientId?: string;
  proposalName?: string;
  photos: PhotoEntry[];
  mapData: MapData | null;
  savedAt: number;
}

const DB_NAME = "sb-autosave";
const DB_VERSION = 1;
const STORE_NAME = "drafts";

// ── IndexedDB helpers (sync-friendly) ──

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function writeToDB(key: string, data: AutoSaveData): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(data, key);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    /* IndexedDB unavailable — ignore */
  }
}

async function readFromDB(key: string): Promise<AutoSaveData | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(key);
    const result = await new Promise<AutoSaveData | null>((resolve, reject) => {
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    if (result && Date.now() - result.savedAt > 7 * 24 * 60 * 60 * 1000) {
      // Expired — clean up
      deleteFromDB(key);
      return null;
    }
    return result;
  } catch {
    return null;
  }
}

async function deleteFromDB(key: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(key);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    /* ignore */
  }
}

export function useAutoSave(
  storageKey: string,
  data: AutoSaveData | null,
  delay = 2000,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep refs so we can flush the latest data on unmount
  const latestDataRef = useRef<AutoSaveData | null>(data);
  latestDataRef.current = data;

  const keyRef = useRef(storageKey);
  keyRef.current = storageKey;

  // Debounced save
  useEffect(() => {
    if (!data) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      writeToDB(storageKey, data);
      timerRef.current = null;
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [data, storageKey, delay]);

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (latestDataRef.current) {
        // Fire-and-forget — component is unmounting
        writeToDB(keyRef.current, latestDataRef.current);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Flush on tab close
  useEffect(() => {
    const handler = () => {
      if (latestDataRef.current) {
        writeToDB(keyRef.current, latestDataRef.current);
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  // Flush on visibility change (tab switch / minimize)
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "hidden" && latestDataRef.current) {
        writeToDB(keyRef.current, latestDataRef.current);
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  // Clear
  const clear = useCallback(() => {
    deleteFromDB(storageKey);
  }, [storageKey]);

  // Restore (async — returns a promise)
  const restore = useCallback((): Promise<AutoSaveData | null> => {
    return readFromDB(storageKey);
  }, [storageKey]);

  return { clear, restore };
}
