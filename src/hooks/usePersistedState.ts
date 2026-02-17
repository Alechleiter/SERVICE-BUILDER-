"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./useAuth";
import { createClient } from "@/lib/supabase/client";

/**
 * Hybrid localStorage + Supabase persistence hook.
 *
 * - Always reads/writes localStorage (same as original useLocalStorage).
 * - When authenticated AND a `supabaseTable` + `supabaseColumn` are provided,
 *   it also syncs with Supabase on mount and debounces writes.
 * - When not authenticated or Supabase is not configured, behaves exactly
 *   like a plain localStorage hook.
 */
export function usePersistedState<T>(
  key: string,
  initialValue: T,
  options?: {
    validate?: (v: T) => T;
    supabaseTable?: string;
    supabaseColumn?: string;
    sessionId?: string;
  },
): [T, (v: T | ((prev: T) => T)) => void] {
  const { user } = useAuth();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  // -- localStorage read --
  const [value, setValueRaw] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const stored = localStorage.getItem(key);
      if (stored === null) return initialValue;
      const parsed = JSON.parse(stored) as T;
      return options?.validate ? options.validate(parsed) : parsed;
    } catch {
      return initialValue;
    }
  });

  // -- Write to localStorage on every change --
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch { /* quota exceeded — ignore */ }
  }, [key, value]);

  // -- Debounced write to Supabase --
  useEffect(() => {
    if (
      !user ||
      !options?.supabaseTable ||
      !options?.supabaseColumn ||
      !options?.sessionId
    )
      return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        const supabase = createClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from as any)(options.supabaseTable!)
          .update({ [options.supabaseColumn!]: JSON.parse(JSON.stringify(value)) })
          .eq("id", options.sessionId!);
      } catch { /* network error — silent fail, localStorage is the source of truth */ }
    }, 1500); // 1.5s debounce

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, user, options?.supabaseTable, options?.supabaseColumn, options?.sessionId]);

  // -- Setter --
  const setValue = useCallback(
    (v: T | ((prev: T) => T)) => {
      setValueRaw((prev) => {
        const next = typeof v === "function" ? (v as (prev: T) => T)(prev) : v;
        return options?.validate ? options.validate(next) : next;
      });
    },
    [options],
  );

  return [value, setValue];
}
