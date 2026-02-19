"use client";
import React, { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  AreaChart, Area,
} from "recharts";
import type { CostEntry } from "@/lib/cost-of-inaction/types";

const SERIF = "'Playfair Display','Georgia',serif";
const SANS = "'Plus Jakarta Sans','DM Sans',sans-serif";

const PIE_COLORS = ["#DC2626", "#E76F51", "#F59E0B", "#2A9D8F", "#6366F1", "#EC4899", "#8B5CF6", "#059669"];

function formatDollars(n: number): string {
  return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function formatTimeframe(months: number): string {
  if (months === 1) return "1 month";
  if (months < 12) return `${months} months`;
  const years = months / 12;
  if (years === 1) return "1 year";
  if (Number.isInteger(years)) return `${years} years`;
  return `${months} months`;
}

interface ResultsDashboardProps {
  entries: CostEntry[];
  customEntries: CostEntry[];
  timeframeMonths: number;
  accentColor: string;
  industryName: string;
  isMobile: boolean;
}

export default function ResultsDashboard({
  entries, customEntries, timeframeMonths, accentColor, industryName, isMobile,
}: ResultsDashboardProps) {
  const activeEntries = useMemo(() => {
    return [...entries, ...customEntries].filter((e) => e.enabled && e.amount > 0);
  }, [entries, customEntries]);

  const monthlyTotal = useMemo(() => {
    return activeEntries.reduce((sum, e) => sum + e.amount, 0);
  }, [activeEntries]);

  const projectedTotal = monthlyTotal * timeframeMonths;

  const barData = useMemo(() => {
    return [...activeEntries]
      .sort((a, b) => b.amount - a.amount)
      .map((e) => ({
        name: e.label.length > 20 ? e.label.substring(0, 18) + "…" : e.label,
        amount: e.amount * timeframeMonths,
        fullName: e.label,
      }));
  }, [activeEntries, timeframeMonths]);

  const pieData = useMemo(() => {
    return activeEntries.map((e) => ({
      name: e.label,
      value: e.amount * timeframeMonths,
    }));
  }, [activeEntries, timeframeMonths]);

  const timelineData = useMemo(() => {
    const points = [];
    for (let m = 0; m <= timeframeMonths; m++) {
      points.push({ month: m, cost: monthlyTotal * m });
    }
    return points;
  }, [monthlyTotal, timeframeMonths]);

  if (activeEntries.length === 0) {
    return (
      <div style={{ padding: isMobile ? 32 : 60, textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 16, opacity: 0.3 }}>📊</div>
        <div style={{ fontFamily: SERIF, fontSize: 20, fontStyle: "italic", color: "var(--text4)", lineHeight: 1.6 }}>
          Enable cost categories and enter<br />amounts to see the analysis.
        </div>
      </div>
    );
  }

  const sorted = [...activeEntries].sort((a, b) => b.amount - a.amount);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 20 : 28, fontFamily: SANS }}>

      {/* ══ Two-Column Output Card (SalesGapPro Style) ══ */}
      <div style={{
        background: "var(--bg2)",
        borderRadius: isMobile ? 24 : 48,
        padding: isMobile ? 20 : 48,
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)",
        border: "1px solid var(--border)",
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
        gap: isMobile ? 20 : 40,
      }}>
        {/* Left: Analysis Brief */}
        <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 16 : 28 }}>
          <div>
            <span style={{
              color: "#DC2626", fontWeight: 700, fontSize: 10, textTransform: "uppercase",
              letterSpacing: "0.4em", fontFamily: SANS,
            }}>
              Risk Analysis Brief
            </span>
            <h3 style={{ fontFamily: SERIF, fontSize: isMobile ? 24 : 32, marginTop: 8, lineHeight: 1.2, color: "var(--text)" }}>
              {industryName}
            </h3>
            {monthlyTotal > 0 && (
              <p style={{ fontFamily: SERIF, fontStyle: "italic", color: "var(--text4)", fontSize: isMobile ? 15 : 18, lineHeight: 1.7, marginTop: 12 }}>
                &ldquo;Every month without action costs an estimated {formatDollars(monthlyTotal)}. Over {formatTimeframe(timeframeMonths)}, this exposure compounds to a significant financial burden that far exceeds the cost of proactive treatment.&rdquo;
              </p>
            )}
          </div>

          {/* Line Items */}
          <div style={{
            padding: isMobile ? 16 : 24,
            background: "var(--bg)",
            borderRadius: isMobile ? 16 : 20,
            border: "1px solid var(--border)",
          }}>
            <h4 style={{
              fontSize: 10, fontWeight: 700, color: "var(--text5)", textTransform: "uppercase",
              letterSpacing: "0.25em", marginBottom: 16, fontFamily: SANS,
            }}>
              Cost Breakdown
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {sorted.map((e, i) => (
                <div key={e.categoryId} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "12px 0",
                  borderBottom: i < sorted.length - 1 ? "1px solid var(--border)" : "none",
                }}>
                  <span style={{ fontSize: 13, color: "var(--text3)", fontWeight: 500 }}>{e.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", fontFamily: SANS }}>
                    {formatDollars(e.amount * timeframeMonths)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Big Red Total Card */}
        <div style={{
          background: "#DC2626",
          borderRadius: isMobile ? 24 : 40,
          padding: isMobile ? 28 : 48,
          color: "#fff",
          textAlign: "center",
          display: "flex", flexDirection: "column", justifyContent: "center",
          boxShadow: "0 25px 50px -12px rgba(220,38,38,0.25)",
          minHeight: isMobile ? 280 : 360,
        }}>
          <span style={{
            fontSize: 11, textTransform: "uppercase", fontWeight: 700,
            letterSpacing: "0.3em", opacity: 0.7, marginBottom: isMobile ? 12 : 20,
            fontFamily: SANS,
          }}>
            Calculated Exposure
          </span>
          <p style={{
            fontFamily: SERIF, fontSize: isMobile ? 48 : 72,
            lineHeight: 1, marginBottom: isMobile ? 24 : 40,
            letterSpacing: "-2px",
          }}>
            {formatDollars(projectedTotal)}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {sorted.slice(0, 6).map((e) => (
              <div key={e.categoryId} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                borderBottom: "1px solid rgba(255,255,255,0.2)", padding: "12px 0",
              }}>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", opacity: 0.6 }}>
                  {e.label}
                </span>
                <span style={{ fontSize: 16, fontWeight: 700 }}>
                  {formatDollars(e.amount * timeframeMonths)}
                </span>
              </div>
            ))}
            {/* Monthly rate */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "14px 0 0", marginTop: 4,
            }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", opacity: 0.6 }}>
                Monthly Rate
              </span>
              <span style={{ fontSize: 18, fontWeight: 700, fontFamily: SERIF }}>
                {formatDollars(monthlyTotal)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ══ Charts Section ══ */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 16 : 20 }}>
        {/* Bar Chart */}
        <div style={{
          background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: isMobile ? 20 : 28,
          padding: isMobile ? 16 : 24, gridColumn: isMobile ? "1" : "1 / -1",
        }}>
          <h4 style={{
            fontSize: 10, fontWeight: 700, color: "var(--text5)", textTransform: "uppercase",
            letterSpacing: "0.25em", margin: "0 0 16px", fontFamily: SANS,
          }}>
            Cost by Category
          </h4>
          <ResponsiveContainer width="100%" height={Math.max(200, activeEntries.length * 44)}>
            <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} fontSize={10} stroke="var(--text5)" />
              <YAxis type="category" dataKey="name" width={isMobile ? 100 : 140} fontSize={10} stroke="var(--text4)" />
              <Tooltip
                formatter={(value?: number | string) => [formatDollars(Number(value) || 0), "Cost"]}
                contentStyle={{ background: "var(--bgElevated)", border: "1px solid var(--border3)", borderRadius: 12, fontSize: 12, fontFamily: SANS }}
                labelStyle={{ color: "var(--text)" }}
              />
              <Bar dataKey="amount" fill="#DC2626" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div style={{
          background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: isMobile ? 20 : 28,
          padding: isMobile ? 16 : 24,
        }}>
          <h4 style={{
            fontSize: 10, fontWeight: 700, color: "var(--text5)", textTransform: "uppercase",
            letterSpacing: "0.25em", margin: "0 0 16px", fontFamily: SANS,
          }}>
            Cost Distribution
          </h4>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="value"
                label={({ name, percent }: { name?: string; percent?: number }) => {
                  const n = name ?? "";
                  const p = percent ?? 0;
                  return `${n.length > 15 ? n.substring(0, 13) + "…" : n} ${(p * 100).toFixed(0)}%`;
                }}
                labelLine={true}
                fontSize={9}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value?: number | string) => [formatDollars(Number(value) || 0), "Cost"]}
                contentStyle={{ background: "var(--bgElevated)", border: "1px solid var(--border3)", borderRadius: 12, fontSize: 12, fontFamily: SANS }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Timeline Area Chart */}
        <div style={{
          background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: isMobile ? 20 : 28,
          padding: isMobile ? 16 : 24,
        }}>
          <h4 style={{
            fontSize: 10, fontWeight: 700, color: "var(--text5)", textTransform: "uppercase",
            letterSpacing: "0.25em", margin: "0 0 16px", fontFamily: SANS,
          }}>
            Cumulative Cost Over Time
          </h4>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={timelineData} margin={{ left: 10, right: 10, top: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#DC2626" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#DC2626" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="month"
                fontSize={10}
                stroke="var(--text5)"
                tickFormatter={(m: number) => m >= 12 ? `${(m / 12).toFixed(m % 12 === 0 ? 0 : 1)}yr` : `${m}mo`}
              />
              <YAxis
                fontSize={10}
                stroke="var(--text5)"
                tickFormatter={(v: number) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`}
              />
              <Tooltip
                formatter={(value?: number | string) => [formatDollars(Number(value) || 0), "Total Cost"]}
                labelFormatter={(m: React.ReactNode) => `Month ${m}`}
                contentStyle={{ background: "var(--bgElevated)", border: "1px solid var(--border3)", borderRadius: 12, fontSize: 12, fontFamily: SANS }}
              />
              <Area type="monotone" dataKey="cost" stroke="#DC2626" fill="url(#costGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
