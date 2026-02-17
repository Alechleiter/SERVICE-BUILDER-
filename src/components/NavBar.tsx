"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const NAV_ITEMS = [
  { href: "/proposals", label: "Proposal Builder", icon: "\u{1F4CB}" },
];

export default function NavBar() {
  const pathname = usePathname();
  const { user, isLoading, isConfigured, signOut } = useAuth();

  /* ── Theme state ── */
  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("sb-dark");
      if (stored !== null) setIsDark(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    try { window.localStorage.setItem("sb-dark", JSON.stringify(isDark)); } catch { /* ignore */ }
  }, [isDark]);

  // Add Clients link only when user is authenticated
  const navItems = user
    ? [...NAV_ITEMS, { href: "/clients", label: "Clients", icon: "\u{1F465}" }]
    : NAV_ITEMS;

  return (
    <nav style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: "2px", padding: "6px 16px",
      background: "var(--glass)",
      backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      borderBottom: "1px solid var(--glassBorder)",
      position: "sticky", top: 0, zIndex: 150,
    }}>
      {/* Left: Nav links */}
      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "6px 16px", borderRadius: "8px", fontSize: "12px",
                fontWeight: isActive ? 600 : 500,
                letterSpacing: "-0.01em",
                textDecoration: "none", transition: "all 0.2s ease",
                background: isActive ? "var(--accentBg)" : "transparent",
                color: isActive ? "var(--accent)" : "var(--text4)",
                border: "none",
              }}>
              <span style={{ fontSize: "13px" }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Center-right: Theme toggle */}
      <button onClick={() => setIsDark(!isDark)} aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
        style={{
          background: "var(--bg3)", border: "1px solid var(--border3)",
          borderRadius: 14, padding: 2, cursor: "pointer",
          width: 40, height: 22,
          position: "relative", display: "flex", alignItems: "center",
          touchAction: "manipulation", transition: "background 0.2s",
          flexShrink: 0,
        }}>
        <div style={{
          width: 16, height: 16, borderRadius: "50%", background: "var(--accent)",
          transform: isDark ? "translateX(18px)" : "translateX(2px)",
          transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 9, boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
        }}>{isDark ? "\u{1F319}" : "\u2600\uFE0F"}</div>
      </button>

      {/* Right: Auth indicator */}
      {isConfigured && !isLoading && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {user ? (
            <>
              <span style={{
                fontSize: 11, color: "var(--text4)",
                maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {user.email}
              </span>
              <button
                onClick={() => signOut()}
                style={{
                  background: "var(--bg3, rgba(255,255,255,0.06))",
                  border: "1px solid var(--border3, rgba(255,255,255,0.08))",
                  borderRadius: 6,
                  color: "var(--text4)",
                  cursor: "pointer",
                  padding: "4px 10px",
                  fontSize: 11,
                  fontWeight: 500,
                  transition: "all 0.15s",
                }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link href="/auth" style={{
              background: "var(--accentBg, rgba(16,185,129,0.08))",
              border: "1px solid var(--accentBorder, rgba(16,185,129,0.25))",
              borderRadius: 6,
              color: "var(--accent, #10b981)",
              padding: "4px 12px",
              fontSize: 11,
              fontWeight: 600,
              textDecoration: "none",
              transition: "all 0.15s",
            }}>
              Sign In
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
