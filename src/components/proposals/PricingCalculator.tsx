"use client";
import { useState } from "react";

const SANS = "'DM Sans',sans-serif";
const MONO = "'DM Mono',monospace";

interface PricingCalculatorProps {
  accentColor: string;
  /** Optional: auto-fill a pricing field with the result */
  onInsert?: (value: string) => void;
}

type Op = "+" | "-" | "×" | "÷";

export default function PricingCalculator({ accentColor, onInsert }: PricingCalculatorProps) {
  const [open, setOpen] = useState(false);
  const [display, setDisplay] = useState("0");
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<Op | null>(null);
  const [fresh, setFresh] = useState(true); // next digit replaces display

  const current = parseFloat(display.replace(/,/g, "")) || 0;

  const fmt = (n: number) => {
    if (Number.isInteger(n) && Math.abs(n) < 1e15) return n.toLocaleString("en-US");
    return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 6 });
  };

  const inputDigit = (d: string) => {
    if (fresh) {
      setDisplay(d === "." ? "0." : d);
      setFresh(false);
    } else {
      if (d === "." && display.includes(".")) return;
      setDisplay(display === "0" && d !== "." ? d : display.replace(/,/g, "") + d);
    }
  };

  const compute = (a: number, b: number, operator: Op): number => {
    switch (operator) {
      case "+": return a + b;
      case "-": return a - b;
      case "×": return a * b;
      case "÷": return b !== 0 ? a / b : 0;
    }
  };

  const handleOp = (nextOp: Op) => {
    if (op && prev !== null && !fresh) {
      const result = compute(prev, current, op);
      setDisplay(fmt(result));
      setPrev(result);
    } else {
      setPrev(current);
    }
    setOp(nextOp);
    setFresh(true);
  };

  const handleEquals = () => {
    if (op && prev !== null) {
      const result = compute(prev, current, op);
      setDisplay(fmt(result));
      setPrev(null);
      setOp(null);
      setFresh(true);
    }
  };

  const handleClear = () => {
    setDisplay("0");
    setPrev(null);
    setOp(null);
    setFresh(true);
  };

  const handlePercent = () => {
    const val = current / 100;
    setDisplay(fmt(val));
    setFresh(true);
  };

  const handleNegate = () => {
    if (display !== "0") {
      setDisplay(fmt(-current));
    }
  };

  const btnBase: React.CSSProperties = {
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 16,
    fontWeight: 600,
    fontFamily: SANS,
    padding: "12px 0",
    touchAction: "manipulation",
    transition: "background 0.1s",
  };

  const numBtn: React.CSSProperties = {
    ...btnBase,
    background: "var(--bg2)",
    color: "var(--text)",
  };

  const opBtn: React.CSSProperties = {
    ...btnBase,
    background: accentColor,
    color: "#fff",
  };

  const funcBtn: React.CSSProperties = {
    ...btnBase,
    background: "var(--bg3)",
    color: "var(--text3)",
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "var(--bg2)",
          border: "1px solid var(--border3)",
          borderRadius: 8,
          color: "var(--text3)",
          cursor: "pointer",
          padding: "6px 12px",
          fontSize: 11,
          fontWeight: 600,
          fontFamily: SANS,
          marginBottom: 14,
          touchAction: "manipulation",
        }}
      >
        🧮 Calculator
      </button>
    );
  }

  return (
    <div
      style={{
        background: "var(--bg2)",
        border: "1px solid var(--border3)",
        borderRadius: 12,
        padding: 12,
        marginBottom: 14,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text4)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          🧮 Calculator
        </span>
        <button
          onClick={() => setOpen(false)}
          style={{
            background: "none",
            border: "none",
            color: "var(--text4)",
            cursor: "pointer",
            fontSize: 16,
            padding: "0 4px",
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      </div>

      {/* Display */}
      <div
        style={{
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: "10px 14px",
          marginBottom: 8,
          textAlign: "right",
          minHeight: 44,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        {op && prev !== null && (
          <div style={{ fontSize: 10, color: "var(--text5)", fontFamily: MONO }}>
            {fmt(prev)} {op}
          </div>
        )}
        <div
          style={{
            fontSize: display.length > 12 ? 18 : 24,
            fontWeight: 700,
            fontFamily: MONO,
            color: "var(--text)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {display}
        </div>
      </div>

      {/* Button grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 6,
        }}
      >
        <button onClick={handleClear} style={funcBtn}>C</button>
        <button onClick={handleNegate} style={funcBtn}>±</button>
        <button onClick={handlePercent} style={funcBtn}>%</button>
        <button onClick={() => handleOp("÷")} style={{ ...opBtn, background: op === "÷" ? `${accentColor}cc` : accentColor }}>÷</button>

        <button onClick={() => inputDigit("7")} style={numBtn}>7</button>
        <button onClick={() => inputDigit("8")} style={numBtn}>8</button>
        <button onClick={() => inputDigit("9")} style={numBtn}>9</button>
        <button onClick={() => handleOp("×")} style={{ ...opBtn, background: op === "×" ? `${accentColor}cc` : accentColor }}>×</button>

        <button onClick={() => inputDigit("4")} style={numBtn}>4</button>
        <button onClick={() => inputDigit("5")} style={numBtn}>5</button>
        <button onClick={() => inputDigit("6")} style={numBtn}>6</button>
        <button onClick={() => handleOp("-")} style={{ ...opBtn, background: op === "-" ? `${accentColor}cc` : accentColor }}>−</button>

        <button onClick={() => inputDigit("1")} style={numBtn}>1</button>
        <button onClick={() => inputDigit("2")} style={numBtn}>2</button>
        <button onClick={() => inputDigit("3")} style={numBtn}>3</button>
        <button onClick={() => handleOp("+")} style={{ ...opBtn, background: op === "+" ? `${accentColor}cc` : accentColor }}>+</button>

        <button onClick={() => inputDigit("0")} style={{ ...numBtn, gridColumn: "span 2" }}>0</button>
        <button onClick={() => inputDigit(".")} style={numBtn}>.</button>
        <button onClick={handleEquals} style={{ ...opBtn, background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)` }}>=</button>
      </div>

      {/* Insert result button */}
      {onInsert && (
        <button
          onClick={() => {
            const val = current % 1 === 0 ? current.toString() : current.toFixed(2);
            onInsert(val);
          }}
          style={{
            width: "100%",
            marginTop: 8,
            padding: "8px 0",
            background: "var(--bg3)",
            border: "1px solid var(--border3)",
            borderRadius: 8,
            color: "var(--text)",
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 600,
            fontFamily: SANS,
            touchAction: "manipulation",
          }}
        >
          📋 Copy Result: {display}
        </button>
      )}
    </div>
  );
}
