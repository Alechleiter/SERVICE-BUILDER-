"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const SANS = "'Inter','DM Sans',sans-serif";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const supabase = createClient();

      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (signUpError) throw signUpError;
        setSuccess("Account created! Check your email to confirm, then sign in.");
        setMode("login");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        router.push("/");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    background: "var(--iBg, var(--bg2))",
    border: "1px solid var(--iBd, var(--border2))",
    borderRadius: 10,
    color: "var(--text)",
    fontSize: 14,
    fontFamily: SANS,
    outline: "none",
    boxSizing: "border-box" as const,
  };

  const labelStyle = {
    display: "block",
    fontSize: 11,
    fontWeight: 600 as const,
    color: "var(--text4)",
    marginBottom: 6,
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  };

  return (
    <div style={{
      minHeight: "calc(100vh - 48px)",
      background: "var(--bg)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      fontFamily: SANS,
    }}>
      <div style={{
        width: "100%",
        maxWidth: 400,
        background: "var(--glass, var(--bg2))",
        backdropFilter: "blur(20px)",
        border: "1px solid var(--glassBorder, var(--border2))",
        borderRadius: 16,
        padding: "36px 28px",
        boxShadow: "var(--shElevated, 0 8px 32px rgba(0,0,0,0.2))",
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, margin: "0 auto 14px",
            background: "var(--gradientPrimary, linear-gradient(135deg,#10b981,#059669))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24,
          }}>{"\u{1F6E1}"}</div>
          <h1 style={{
            margin: "0 0 4px",
            fontSize: 22,
            fontWeight: 800,
            color: "var(--text)",
          }}>
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: "var(--text4)" }}>
            {mode === "login"
              ? "Sign in to access your proposals and sessions"
              : "Get started with your pest control service builder"}
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 18,
            fontSize: 12,
            color: "#ef4444",
          }}>{error}</div>
        )}
        {success && (
          <div style={{
            background: "var(--accentBg, rgba(16,185,129,0.08))",
            border: "1px solid var(--accentBorder, rgba(16,185,129,0.25))",
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 18,
            fontSize: 12,
            color: "var(--accent, #10b981)",
          }}>{success}</div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {mode === "signup" && (
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Smith"
                style={inputStyle}
              />
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "signup" ? "Min 6 characters" : "Enter password"}
              required
              minLength={6}
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px 16px",
              background: loading
                ? "var(--bg3)"
                : "var(--gradientPrimary, linear-gradient(135deg,#10b981,#059669))",
              border: "none",
              borderRadius: 10,
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              fontFamily: SANS,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading
              ? "..."
              : mode === "login"
                ? "Sign In"
                : "Create Account"}
          </button>
        </form>

        {/* Toggle */}
        <div style={{
          textAlign: "center",
          marginTop: 20,
          fontSize: 13,
          color: "var(--text4)",
        }}>
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError("");
              setSuccess("");
            }}
            style={{
              background: "none",
              border: "none",
              color: "var(--accent, #10b981)",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 13,
              fontFamily: SANS,
              textDecoration: "underline",
              textDecorationColor: "transparent",
              transition: "text-decoration-color 0.2s",
            }}
          >
            {mode === "login" ? "Sign Up" : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}
