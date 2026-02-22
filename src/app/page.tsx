"use client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";

const SANS = "'DM Sans','Inter',sans-serif";

const ACTIONS = [
  {
    href: "/proposals",
    icon: "\u{1F4CB}",
    label: "New Proposal",
    desc: "Create an inspection report or service proposal",
    gradient: "linear-gradient(135deg,#10b981,#059669)",
  },
  {
    href: "/cost-of-inaction",
    icon: "\u{1F4B8}",
    label: "Cost of Inaction",
    desc: "Show clients what doing nothing really costs",
    gradient: "linear-gradient(135deg,#f97316,#dc2626)",
  },
  {
    href: "/clients",
    icon: "\u{1F465}",
    label: "Clients / CRM",
    desc: "Manage clients, notes, follow-ups, and documents",
    gradient: "linear-gradient(135deg,#6366f1,#8b5cf6)",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [show, setShow] = useState(false);

  // Redirect unauthenticated users (middleware also handles this, but just in case)
  useEffect(() => {
    if (!isLoading && !user) router.replace("/auth");
  }, [user, isLoading, router]);

  // Animate in after mount
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 60);
    return () => clearTimeout(t);
  }, []);

  if (isLoading || !user) {
    return (
      <div style={{
        minHeight: "calc(100vh - 48px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--bg)", fontFamily: SANS,
      }}>
        <div style={{ fontSize: 14, color: "var(--text4)" }}>Loading...</div>
      </div>
    );
  }

  const firstName = user.user_metadata?.full_name?.split(" ")[0] || user.email?.split("@")[0] || "there";

  return (
    <div style={{
      minHeight: "calc(100vh - 48px)",
      background: "var(--bg)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 20px",
      fontFamily: SANS,
      transition: "opacity 0.4s",
      opacity: show ? 1 : 0,
    }}>
      {/* Greeting */}
      <div style={{ textAlign: "center", marginBottom: 40, maxWidth: 480 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: "var(--gradientPrimary, linear-gradient(135deg,#10b981,#059669))",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, margin: "0 auto 16px",
          boxShadow: "0 4px 20px rgba(16,185,129,0.25)",
        }}>{"\u{1F6E1}"}</div>
        <h1 style={{
          fontSize: 26, fontWeight: 800, color: "var(--text)",
          margin: "0 0 6px", letterSpacing: "-0.02em",
        }}>
          Hey {firstName} {"\u{1F44B}"}
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: "var(--text4)", lineHeight: 1.5 }}>
          What would you like to work on?
        </p>
      </div>

      {/* Action Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 16,
        maxWidth: 720,
        width: "100%",
      }}>
        {ACTIONS.map((action, i) => (
          <button
            key={action.href}
            onClick={() => router.push(action.href)}
            style={{
              background: "var(--bg2)",
              border: "1px solid var(--border2)",
              borderRadius: 16,
              padding: "28px 24px",
              cursor: "pointer",
              textAlign: "left",
              fontFamily: SANS,
              transition: "all 0.2s ease",
              transform: show ? "translateY(0)" : "translateY(12px)",
              opacity: show ? 1 : 0,
              transitionDelay: `${i * 80}ms`,
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent)";
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.15)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border2)";
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
            }}
          >
            {/* Icon */}
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: action.gradient,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, marginBottom: 16,
              boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
            }}>{action.icon}</div>

            {/* Text */}
            <div style={{
              fontSize: 16, fontWeight: 700, color: "var(--text)",
              marginBottom: 6, letterSpacing: "-0.01em",
            }}>{action.label}</div>
            <div style={{
              fontSize: 12, color: "var(--text4)", lineHeight: 1.5,
            }}>{action.desc}</div>

            {/* Arrow */}
            <div style={{
              position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)",
              fontSize: 18, color: "var(--text5)", opacity: 0.4,
            }}>{"\u2192"}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
