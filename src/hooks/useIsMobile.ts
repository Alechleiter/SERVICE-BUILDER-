"use client";
import { useRef, useState, useEffect } from "react";

/**
 * Responsive hook: returns [isMobile, containerRef].
 * Attach containerRef to a wrapper div; isMobile becomes true when
 * that element's width drops below `breakpoint` px.
 *
 * SSR-safe: defaults to mobile if window width < breakpoint on first render,
 * preventing a flash of desktop layout on mobile devices.
 */
export function useIsMobile(breakpoint = 768) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < breakpoint;
    }
    return false;
  });

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const check = () => setIsMobile(node.getBoundingClientRect().width < breakpoint);
    check();
    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(check);
      ro.observe(node);
      return () => ro.disconnect();
    } else {
      window.addEventListener("resize", check);
      return () => window.removeEventListener("resize", check);
    }
  }, [breakpoint]);

  return [isMobile, containerRef] as const;
}
