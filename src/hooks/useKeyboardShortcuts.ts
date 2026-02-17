"use client";
import { useEffect, useCallback } from "react";

export interface ShortcutAction {
  /** Ctrl+S / Cmd+S */
  onSave?: () => void;
  /** Ctrl+P / Cmd+P  — toggle preview */
  onTogglePreview?: () => void;
  /** Ctrl+E / Cmd+E  — toggle edit */
  onToggleEdit?: () => void;
  /** Ctrl+Shift+F / Cmd+Shift+F — finalize */
  onFinalize?: () => void;
  /** Escape — close panel / go back */
  onEscape?: () => void;
  /** Ctrl+ArrowDown / Cmd+ArrowDown — next section */
  onNextSection?: () => void;
  /** Ctrl+ArrowUp / Cmd+ArrowUp — prev section */
  onPrevSection?: () => void;
  /** Ctrl+/ — show/hide shortcut help */
  onToggleHelp?: () => void;
}

/**
 * Registers global keyboard shortcuts.
 * Uses Cmd on Mac, Ctrl on Windows/Linux.
 * Only fires on desktop (non-touch) — harmlessly no-ops on mobile/tablet.
 */
export function useKeyboardShortcuts(actions: ShortcutAction, enabled = true) {
  const handler = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Don't intercept inside text inputs unless it's a modifier combo
      const tag = (e.target as HTMLElement)?.tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      const mod = e.metaKey || e.ctrlKey;

      // Ctrl/Cmd + S — Save
      if (mod && e.key === "s") {
        e.preventDefault();
        actions.onSave?.();
        return;
      }

      // Ctrl/Cmd + P — Preview
      if (mod && e.key === "p") {
        e.preventDefault();
        actions.onTogglePreview?.();
        return;
      }

      // Ctrl/Cmd + E — Edit
      if (mod && e.key === "e") {
        e.preventDefault();
        actions.onToggleEdit?.();
        return;
      }

      // Ctrl/Cmd + Shift + F — Finalize
      if (mod && e.shiftKey && (e.key === "f" || e.key === "F")) {
        e.preventDefault();
        actions.onFinalize?.();
        return;
      }

      // Ctrl/Cmd + ArrowDown — Next section
      if (mod && e.key === "ArrowDown") {
        e.preventDefault();
        actions.onNextSection?.();
        return;
      }

      // Ctrl/Cmd + ArrowUp — Prev section
      if (mod && e.key === "ArrowUp") {
        e.preventDefault();
        actions.onPrevSection?.();
        return;
      }

      // Ctrl/Cmd + / — Toggle help
      if (mod && e.key === "/") {
        e.preventDefault();
        actions.onToggleHelp?.();
        return;
      }

      // Escape — Close (only when not typing in inputs)
      if (e.key === "Escape" && !isInput) {
        e.preventDefault();
        actions.onEscape?.();
        return;
      }
    },
    [enabled, actions],
  );

  useEffect(() => {
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handler]);
}

/** Shortcut definitions for help display */
export const SHORTCUT_LIST = [
  { keys: "Ctrl+S", mac: "⌘S", label: "Save" },
  { keys: "Ctrl+P", mac: "⌘P", label: "Preview" },
  { keys: "Ctrl+E", mac: "⌘E", label: "Edit" },
  { keys: "Ctrl+Shift+F", mac: "⌘⇧F", label: "Finalize" },
  { keys: "Ctrl+↓", mac: "⌘↓", label: "Next section" },
  { keys: "Ctrl+↑", mac: "⌘↑", label: "Previous section" },
  { keys: "Esc", mac: "Esc", label: "Close / Back" },
  { keys: "Ctrl+/", mac: "⌘/", label: "Toggle shortcuts" },
];
