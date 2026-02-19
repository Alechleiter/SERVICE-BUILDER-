// ══════════════════════════════════════════════════════════
// Cost of Inaction — Export HTML Generator
// Produces self-contained HTML for clipboard, PDF, Word
// ══════════════════════════════════════════════════════════

import type { CalculationData } from "./types";

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

export function buildCOIExportHTML(
  data: CalculationData,
  accentColor: string,
  forWord = false,
): string {
  const allEntries = [...data.entries, ...data.customEntries].filter((e) => e.enabled && e.amount > 0);
  const monthlyTotal = allEntries.reduce((sum, e) => sum + e.amount, 0);
  const projectedTotal = monthlyTotal * data.timeframeMonths;
  const sorted = [...allEntries].sort((a, b) => b.amount - a.amount);

  // Common styles
  const bodyFont = "font-family: 'DM Sans', 'Segoe UI', Arial, sans-serif;";
  const monoFont = "font-family: 'DM Mono', 'Courier New', monospace;";

  if (forWord) {
    // ── Word-compatible (table-based, no flexbox/gradients) ──
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  body { ${bodyFont} color: #222; margin: 0; padding: 20px; }
  table { border-collapse: collapse; width: 100%; }
  td, th { padding: 8px 12px; text-align: left; }
</style>
</head><body>

<table width="100%" style="margin-bottom: 24px;">
  <tr>
    <td style="text-align: center; background: #DC2626; color: #fff; padding: 24px; border-radius: 4px;">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px; opacity: 0.85;">
        Cost of Inaction Analysis
      </div>
      <div style="font-size: 42px; font-weight: 800; letter-spacing: -1px;">
        ${formatDollars(projectedTotal)}
      </div>
      <div style="font-size: 14px; margin-top: 6px; opacity: 0.9;">
        Estimated cost over ${formatTimeframe(data.timeframeMonths)} — ${data.industryName}
      </div>
      <div style="font-size: 12px; margin-top: 4px; opacity: 0.7; ${monoFont}">
        ${formatDollars(monthlyTotal)}/month
      </div>
    </td>
  </tr>
</table>

${data.propertyName ? `<p style="font-size: 14px; color: #666; margin-bottom: 16px;">Property: <strong>${data.propertyName}</strong></p>` : ""}

<table width="100%" style="border: 1px solid #ddd; margin-bottom: 24px;">
  <tr style="background: #f5f5f5;">
    <th style="border-bottom: 2px solid #ddd; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #666;">Cost Category</th>
    <th style="border-bottom: 2px solid #ddd; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #666; text-align: right; width: 140px;">Monthly</th>
    <th style="border-bottom: 2px solid #ddd; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #666; text-align: right; width: 160px;">${formatTimeframe(data.timeframeMonths)} Total</th>
  </tr>
  ${sorted.map((e) => `
  <tr>
    <td style="border-bottom: 1px solid #eee; font-size: 13px;">${e.label}</td>
    <td style="border-bottom: 1px solid #eee; font-size: 13px; text-align: right; ${monoFont}">${formatDollars(e.amount)}</td>
    <td style="border-bottom: 1px solid #eee; font-size: 13px; text-align: right; font-weight: 700; color: ${accentColor}; ${monoFont}">${formatDollars(e.amount * data.timeframeMonths)}</td>
  </tr>`).join("")}
  <tr style="background: #f5f5f5;">
    <td style="font-weight: 700; font-size: 14px; border-top: 2px solid #ddd;">TOTAL</td>
    <td style="font-weight: 700; font-size: 14px; text-align: right; border-top: 2px solid #ddd; ${monoFont}">${formatDollars(monthlyTotal)}</td>
    <td style="font-weight: 800; font-size: 16px; text-align: right; border-top: 2px solid #ddd; color: #DC2626; ${monoFont}">${formatDollars(projectedTotal)}</td>
  </tr>
</table>

${data.notes ? `<div style="padding: 12px 16px; background: #f9f9f9; border-left: 3px solid ${accentColor}; border-radius: 4px; margin-bottom: 16px; font-size: 13px; color: #555;">
  <strong>Notes:</strong> ${data.notes}
</div>` : ""}

<p style="font-size: 11px; color: #999; margin-top: 24px; text-align: center;">
  Cost of Inaction Analysis — Generated ${new Date().toLocaleDateString()}
</p>

</body></html>`;
  }

  // ── PDF/Clipboard version (flexbox, gradients) ──
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { ${bodyFont} color: #222; padding: 32px; max-width: 800px; margin: 0 auto; background: #fff; }
  .banner { background: linear-gradient(135deg, #DC2626, #F59E0B); border-radius: 16px; padding: 36px 32px; text-align: center; color: #fff; margin-bottom: 28px; }
  .banner .label { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.85; margin-bottom: 8px; }
  .banner .total { font-size: 52px; font-weight: 800; letter-spacing: -2px; }
  .banner .sub { font-size: 14px; opacity: 0.9; margin-top: 6px; }
  .banner .monthly { font-size: 12px; opacity: 0.7; margin-top: 4px; ${monoFont} }
  .section-title { font-size: 12px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
  .row { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border: 1px solid #eee; border-radius: 8px; margin-bottom: 6px; }
  .row .label { font-size: 13px; color: #333; }
  .row .amount { font-size: 14px; font-weight: 700; color: ${accentColor}; ${monoFont} }
  .total-row { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; background: #f5f5f5; border-radius: 8px; margin-top: 8px; border: 2px solid #ddd; }
  .total-row .label { font-size: 14px; font-weight: 700; }
  .total-row .amount { font-size: 18px; font-weight: 800; color: #DC2626; ${monoFont} }
  .notes { padding: 12px 16px; background: #f9fafb; border-left: 3px solid ${accentColor}; border-radius: 4px; margin-top: 20px; font-size: 13px; color: #555; }
  .footer { font-size: 11px; color: #999; text-align: center; margin-top: 28px; }
</style>
</head><body>

<div class="banner">
  <div class="label">Cost of Inaction Analysis</div>
  <div class="total">${formatDollars(projectedTotal)}</div>
  <div class="sub">Estimated cost over ${formatTimeframe(data.timeframeMonths)} — ${data.industryName}</div>
  <div class="monthly">${formatDollars(monthlyTotal)}/month</div>
</div>

${data.propertyName ? `<p style="font-size: 14px; color: #666; margin-bottom: 20px;">Property: <strong>${data.propertyName}</strong></p>` : ""}

<div class="section-title">Cost Breakdown (${formatTimeframe(data.timeframeMonths)})</div>

${sorted.map((e) => `<div class="row">
  <span class="label">${e.label}</span>
  <span class="amount">${formatDollars(e.amount * data.timeframeMonths)}</span>
</div>`).join("\n")}

<div class="total-row">
  <span class="label">TOTAL COST OF INACTION</span>
  <span class="amount">${formatDollars(projectedTotal)}</span>
</div>

${data.notes ? `<div class="notes"><strong>Notes:</strong> ${data.notes}</div>` : ""}

<div class="footer">Cost of Inaction Analysis — Generated ${new Date().toLocaleDateString()}</div>

</body></html>`;
}

/** Plain text version for clipboard fallback */
export function buildCOIPlainText(data: CalculationData): string {
  const allEntries = [...data.entries, ...data.customEntries].filter((e) => e.enabled && e.amount > 0);
  const monthlyTotal = allEntries.reduce((sum, e) => sum + e.amount, 0);
  const projectedTotal = monthlyTotal * data.timeframeMonths;
  const sorted = [...allEntries].sort((a, b) => b.amount - a.amount);

  const lines = [
    "COST OF INACTION ANALYSIS",
    `Industry: ${data.industryName}`,
    data.propertyName ? `Property: ${data.propertyName}` : "",
    `Timeframe: ${formatTimeframe(data.timeframeMonths)}`,
    "",
    `TOTAL: ${formatDollars(projectedTotal)} (${formatDollars(monthlyTotal)}/month)`,
    "",
    "BREAKDOWN:",
    ...sorted.map((e) => `  ${e.label}: ${formatDollars(e.amount * data.timeframeMonths)}`),
  ];

  if (data.notes) {
    lines.push("", `Notes: ${data.notes}`);
  }

  lines.push("", `Generated ${new Date().toLocaleDateString()}`);

  return lines.filter(Boolean).join("\n");
}
