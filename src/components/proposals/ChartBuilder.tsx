"use client";
import { useState, useCallback, useRef } from "react";
import type { ChartEntry, ChartType, ChartDataRow } from "@/lib/proposals/types";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const SANS = "'DM Sans',sans-serif";

const CHART_COLORS = [
  "#E63946", "#457B9D", "#2A9D8F", "#E9C46A", "#7B68EE",
  "#6366F1", "#10B981", "#F97316", "#DC2626", "#0EA5E9",
  "#8B5CF6", "#EC4899",
];

const CHART_TYPES: { value: ChartType; label: string; icon: string }[] = [
  { value: "bar", label: "Bar", icon: "\u{1F4CA}" },
  { value: "pie", label: "Pie", icon: "\u{1F967}" },
  { value: "doughnut", label: "Doughnut", icon: "\u{1F369}" },
];

const DEFAULT_ROWS: ChartDataRow[] = [
  { label: "Zone A", value: 5, color: CHART_COLORS[0] },
  { label: "Zone B", value: 3, color: CHART_COLORS[1] },
  { label: "Zone C", value: 1, color: CHART_COLORS[2] },
];

const iS: React.CSSProperties = {
  background: "var(--bg)", border: "1px solid var(--border3)", borderRadius: 6,
  color: "var(--text)", padding: "6px 8px", fontSize: 12, fontFamily: SANS,
  outline: "none", boxSizing: "border-box" as const,
};

interface ChartBuilderProps {
  charts: ChartEntry[];
  onChartsChange: (charts: ChartEntry[]) => void;
  accentColor: string;
}

export default function ChartBuilder({ charts, onChartsChange, accentColor }: ChartBuilderProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const chartRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const addChart = useCallback(() => {
    const newChart: ChartEntry = {
      id: Date.now() + Math.random(),
      type: "bar",
      title: "",
      caption: "",
      data: [...DEFAULT_ROWS],
    };
    const updated = [...charts, newChart];
    onChartsChange(updated);
    setExpandedId(newChart.id);
  }, [charts, onChartsChange]);

  const removeChart = useCallback((id: number) => {
    onChartsChange(charts.filter((c) => c.id !== id));
    if (expandedId === id) setExpandedId(null);
  }, [charts, onChartsChange, expandedId]);

  const updateChart = useCallback((id: number, updates: Partial<ChartEntry>) => {
    onChartsChange(charts.map((c) => c.id === id ? { ...c, ...updates } : c));
  }, [charts, onChartsChange]);

  const addRow = useCallback((chartId: number) => {
    const chart = charts.find((c) => c.id === chartId);
    if (!chart) return;
    const nextColor = CHART_COLORS[chart.data.length % CHART_COLORS.length];
    const newRow: ChartDataRow = {
      label: `Zone ${String.fromCharCode(65 + chart.data.length)}`,
      value: 0,
      color: nextColor,
    };
    updateChart(chartId, { data: [...chart.data, newRow] });
  }, [charts, updateChart]);

  const removeRow = useCallback((chartId: number, rowIdx: number) => {
    const chart = charts.find((c) => c.id === chartId);
    if (!chart) return;
    updateChart(chartId, { data: chart.data.filter((_, i) => i !== rowIdx) });
  }, [charts, updateChart]);

  const updateRow = useCallback((chartId: number, rowIdx: number, updates: Partial<ChartDataRow>) => {
    const chart = charts.find((c) => c.id === chartId);
    if (!chart) return;
    const newData = chart.data.map((r, i) => i === rowIdx ? { ...r, ...updates } : r);
    updateChart(chartId, { data: newData });
  }, [charts, updateChart]);

  const renderChartPreview = (chart: ChartEntry) => {
    if (chart.data.length === 0) {
      return <div style={{ padding: 20, textAlign: "center", color: "var(--text5)", fontSize: 12 }}>Add data rows to see preview</div>;
    }

    if (chart.type === "bar") {
      return (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chart.data} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--text4)" }} />
            <YAxis tick={{ fontSize: 10, fill: "var(--text4)" }} />
            <Tooltip contentStyle={{ background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: 8, fontSize: 11 }} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chart.data.map((row, i) => (
                <Cell key={i} fill={row.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    }

    // Pie or Doughnut
    const innerRadius = chart.type === "doughnut" ? 50 : 0;
    return (
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chart.data}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            outerRadius={80}
            innerRadius={innerRadius}
            paddingAngle={2}
            label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`}
            labelLine={false}
            style={{ fontSize: 10 }}
          >
            {chart.data.map((row, i) => (
              <Cell key={i} fill={row.color} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: 8, fontSize: 11 }} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div style={{ fontFamily: SANS }}>
      {/* Header + Add */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 16,
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
          {charts.length === 0 ? "No charts yet" : `${charts.length} chart${charts.length !== 1 ? "s" : ""}`}
        </div>
        <button
          onClick={addChart}
          style={{
            background: accentColor || "var(--accent, #10b981)",
            color: "#fff", border: "none", borderRadius: 8,
            padding: "6px 14px", fontSize: 11, fontWeight: 700,
            cursor: "pointer", fontFamily: SANS,
          }}
        >
          + Add Chart
        </button>
      </div>

      {/* Chart Cards */}
      {charts.map((chart) => {
        const isExpanded = expandedId === chart.id;
        return (
          <div
            key={chart.id}
            ref={(el) => { chartRefs.current[chart.id] = el; }}
            style={{
              background: "var(--bg2)", border: "1px solid var(--border2)",
              borderRadius: 12, marginBottom: 12, overflow: "hidden",
              transition: "all 0.2s",
            }}
          >
            {/* Card Header — always visible */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : chart.id)}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 16px", background: "none", border: "none",
                cursor: "pointer", fontFamily: SANS, color: "var(--text)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16 }}>
                  {CHART_TYPES.find((t) => t.value === chart.type)?.icon || "\u{1F4CA}"}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  {chart.title || "Untitled Chart"}
                </span>
                <span style={{ fontSize: 11, color: "var(--text5)" }}>
                  {chart.data.length} row{chart.data.length !== 1 ? "s" : ""}
                </span>
              </div>
              <span style={{ fontSize: 12, color: "var(--text5)", transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                {"\u25BC"}
              </span>
            </button>

            {isExpanded && (
              <div style={{ padding: "0 16px 16px" }}>
                {/* Title & Caption */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 600, color: "var(--text4)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 4 }}>Title</label>
                    <input
                      value={chart.title}
                      onChange={(e) => updateChart(chart.id, { title: e.target.value })}
                      placeholder="e.g., Findings by Zone"
                      style={{ ...iS, width: "100%" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 600, color: "var(--text4)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 4 }}>Caption</label>
                    <input
                      value={chart.caption}
                      onChange={(e) => updateChart(chart.id, { caption: e.target.value })}
                      placeholder="e.g., Distribution of pest activity"
                      style={{ ...iS, width: "100%" }}
                    />
                  </div>
                </div>

                {/* Chart Type Toggle */}
                <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                  {CHART_TYPES.map((ct) => (
                    <button
                      key={ct.value}
                      onClick={() => updateChart(chart.id, { type: ct.value })}
                      style={{
                        padding: "5px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                        fontFamily: SANS, cursor: "pointer", transition: "all 0.15s",
                        border: `1px solid ${chart.type === ct.value ? (accentColor || "var(--accent)") : "var(--border3)"}`,
                        background: chart.type === ct.value ? `${accentColor || "var(--accent)"}15` : "var(--bg)",
                        color: chart.type === ct.value ? (accentColor || "var(--accent)") : "var(--text4)",
                      }}
                    >
                      {ct.icon} {ct.label}
                    </button>
                  ))}
                </div>

                {/* Data Rows */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "12px 1fr 80px 30px 24px", gap: 6, alignItems: "center", marginBottom: 6 }}>
                    <span />
                    <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text5)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Label</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text5)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Value</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text5)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Color</span>
                    <span />
                  </div>
                  {chart.data.map((row, ri) => (
                    <div key={ri} style={{ display: "grid", gridTemplateColumns: "12px 1fr 80px 30px 24px", gap: 6, alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 9, color: "var(--text5)", textAlign: "center" }}>{ri + 1}</span>
                      <input
                        value={row.label}
                        onChange={(e) => updateRow(chart.id, ri, { label: e.target.value })}
                        style={{ ...iS, padding: "4px 6px", fontSize: 11 }}
                        placeholder="Zone name..."
                      />
                      <input
                        type="number"
                        value={row.value}
                        onChange={(e) => updateRow(chart.id, ri, { value: Number(e.target.value) || 0 })}
                        style={{ ...iS, padding: "4px 6px", fontSize: 11, textAlign: "right" }}
                        min={0}
                      />
                      <input
                        type="color"
                        value={row.color}
                        onChange={(e) => updateRow(chart.id, ri, { color: e.target.value })}
                        style={{ width: 26, height: 26, padding: 0, border: "1px solid var(--border3)", borderRadius: 4, cursor: "pointer", background: "none" }}
                      />
                      <button
                        onClick={() => removeRow(chart.id, ri)}
                        style={{
                          background: "none", border: "none", color: "var(--text5)",
                          cursor: "pointer", fontSize: 13, padding: 0, lineHeight: 1,
                        }}
                        title="Remove row"
                      >
                        {"\u2715"}
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addRow(chart.id)}
                    style={{
                      background: "none", border: "1px dashed var(--border3)",
                      borderRadius: 6, color: "var(--text4)", cursor: "pointer",
                      padding: "5px 12px", fontSize: 11, fontFamily: SANS,
                      width: "100%", marginTop: 4,
                    }}
                  >
                    + Add Row
                  </button>
                </div>

                {/* Live Preview */}
                <div style={{
                  background: "var(--bg)", border: "1px solid var(--border3)",
                  borderRadius: 10, padding: 12, marginBottom: 12,
                }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text5)", textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.5px" }}>Preview</div>
                  {renderChartPreview(chart)}
                </div>

                {/* Delete */}
                <button
                  onClick={() => removeChart(chart.id)}
                  style={{
                    background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                    borderRadius: 6, color: "#ef4444", cursor: "pointer",
                    padding: "5px 12px", fontSize: 11, fontWeight: 600, fontFamily: SANS,
                  }}
                >
                  Delete Chart
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
