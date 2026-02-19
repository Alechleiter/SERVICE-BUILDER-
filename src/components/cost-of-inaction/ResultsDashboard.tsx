"use client";
import React, { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  AreaChart, Area,
} from "recharts";
import type { CostEntry } from "@/lib/cost-of-inaction/types";

const SANS = "'DM Sans',sans-serif";
const MONO = "'DM Mono',monospace";

const PIE_COLORS = ["#DC2626", "#F59E0B", "#E76F51", "#2A9D8F", "#6366F1", "#EC4899", "#8B5CF6", "#059669"];

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

  // Bar chart data — sorted by amount desc
  const barData = useMemo(() => {
    return [...activeEntries]
      .sort((a, b) => b.amount - a.amount)
      .map((e) => ({
        name: e.label.length > 20 ? e.label.substring(0, 18) + "…" : e.label,
        amount: e.amount * timeframeMonths,
        fullName: e.label,
      }));
  }, [activeEntries, timeframeMonths]);

  // Pie chart data
  const pieData = useMemo(() => {
    return activeEntries.map((e) => ({
      name: e.label,
      value: e.amount * timeframeMonths,
    }));
  }, [activeEntries, timeframeMonths]);

  // Timeline data — cumulative cost month by month
  const timelineData = useMemo(() => {
    const points = [];
    for (let m = 0; m <= timeframeMonths; m++) {
      points.push({ month: m, cost: monthlyTotal * m });
    }
    return points;
  }, [monthlyTotal, timeframeMonths]);

  if (activeEntries.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--text5)" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
        <div style={{ fontSize: 14, fontFamily: SANS }}>Enable cost categories and enter amounts to see the analysis</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, fontFamily: SANS }}>
      {/* ── Big Total Banner ── */}
      <div style={{
        background: "linear-gradient(135deg, #DC2626, #F59E0B)",
        borderRadius: 16, padding: isMobile ? "28px 20px" : "36px 32px",
        textAlign: "center", color: "#fff",
        boxShadow: "0 8px 32px rgba(220,38,38,0.3)",
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "2px", opacity: 0.85, marginBottom: 8 }}>
          Estimated Cost of Inaction
        </div>
        <div style={{
          fontSize: isMobile ? 40 : 56, fontWeight: 800, letterSpacing: "-2px",
          textShadow: "0 2px 12px rgba(0,0,0,0.2)",
          fontFamily: SANS,
          transition: "all 0.3s ease",
        }}>
          {formatDollars(projectedTotal)}
        </div>
        <div style={{ fontSize: 14, opacity: 0.9, marginTop: 6 }}>
          over {formatTimeframe(timeframeMonths)} — {industryName}
        </div>
        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4, fontFamily: MONO }}>
          {formatDollars(monthlyTotal)}/month
        </div>
      </div>

      {/* ── Cost Breakdown Cards ── */}
      <div>
        <h4 style={{ fontSize: 12, fontWeight: 700, color: "var(--text4)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 10 }}>
          Cost Breakdown
        </h4>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[...activeEntries].sort((a, b) => b.amount - a.amount).map((e) => (
            <div key={e.categoryId} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 14px", background: "var(--bg2)", border: "1px solid var(--border2)",
              borderRadius: 8,
            }}>
              <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>{e.label}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: accentColor, fontFamily: MONO }}>
                {formatDollars(e.amount * timeframeMonths)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Charts Grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20 }}>
        {/* Bar Chart */}
        <div style={{
          background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: 12,
          padding: 16, gridColumn: isMobile ? "1" : "1 / -1",
        }}>
          <h4 style={{ fontSize: 12, fontWeight: 700, color: "var(--text4)", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 12px" }}>
            Cost by Category
          </h4>
          <ResponsiveContainer width="100%" height={Math.max(200, activeEntries.length * 40)}>
            <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} fontSize={10} stroke="var(--text5)" />
              <YAxis type="category" dataKey="name" width={isMobile ? 100 : 140} fontSize={10} stroke="var(--text4)" />
              <Tooltip
                formatter={(value?: number | string) => [formatDollars(Number(value) || 0), "Cost"]}
                contentStyle={{ background: "var(--bgElevated)", border: "1px solid var(--border3)", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "var(--text)" }}
              />
              <Bar dataKey="amount" fill="#DC2626" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div style={{
          background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: 12,
          padding: 16,
        }}>
          <h4 style={{ fontSize: 12, fontWeight: 700, color: "var(--text4)", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 12px" }}>
            Cost Distribution
          </h4>
          <ResponsiveContainer width="100%" height={250}>
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
                contentStyle={{ background: "var(--bgElevated)", border: "1px solid var(--border3)", borderRadius: 8, fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Timeline Area Chart */}
        <div style={{
          background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: 12,
          padding: 16,
        }}>
          <h4 style={{ fontSize: 12, fontWeight: 700, color: "var(--text4)", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 12px" }}>
            Cumulative Cost Over Time
          </h4>
          <ResponsiveContainer width="100%" height={250}>
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
                contentStyle={{ background: "var(--bgElevated)", border: "1px solid var(--border3)", borderRadius: 8, fontSize: 12 }}
              />
              <Area type="monotone" dataKey="cost" stroke="#DC2626" fill="url(#costGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
