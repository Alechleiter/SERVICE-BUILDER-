// ══════════════════════════════════════════════════════════
// Cost of Inaction — Export HTML Generator
// SalesGapPro-inspired elegant layout
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

  const serifFont = "font-family: 'Playfair Display', Georgia, serif;";
  const sansFont = "font-family: 'Plus Jakarta Sans', 'Segoe UI', Arial, sans-serif;";

  if (forWord) {
    // ── Word-compatible (table-based, no flexbox/gradients) ──
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;600;700&display=swap" rel="stylesheet">
<style>
  body { ${sansFont} color: #1a1a1a; margin: 0; padding: 24px; background: #fff; }
  table { border-collapse: collapse; width: 100%; }
  td, th { padding: 10px 14px; text-align: left; }
</style>
</head><body>

<!-- Risk Analysis Header -->
<table width="100%" style="margin-bottom: 8px;">
  <tr><td>
    <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 4px; color: #DC2626; margin-bottom: 6px;">Risk Analysis Brief</div>
    <div style="${serifFont} font-size: 28px; font-weight: 700; color: #1a1a1a; margin-bottom: 4px;">${data.industryName}</div>
    ${data.propertyName ? `<div style="font-size: 13px; color: #888; font-weight: 300;">${data.propertyName}</div>` : ""}
  </td></tr>
</table>

<!-- Exposure Card -->
<table width="100%" style="margin-bottom: 24px;">
  <tr>
    <td style="text-align: center; background: #DC2626; color: #fff; padding: 36px 24px; border-radius: 4px;">
      <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 12px; opacity: 0.7; font-weight: 700;">
        Calculated Exposure
      </div>
      <div style="${serifFont} font-size: 52px; margin-bottom: 16px;">
        ${formatDollars(projectedTotal)}
      </div>
      <div style="font-size: 12px; opacity: 0.7;">
        over ${formatTimeframe(data.timeframeMonths)} &bull; ${formatDollars(monthlyTotal)}/month
      </div>
    </td>
  </tr>
</table>

<!-- Diagnostic Text -->
<table width="100%" style="margin-bottom: 20px;">
  <tr><td style="padding: 16px 20px; background: #f9f8f4; border-left: 3px solid #DC2626;">
    <div style="${serifFont} font-style: italic; font-size: 14px; color: #666; line-height: 1.8;">
      "Every month without action costs an estimated ${formatDollars(monthlyTotal)}. Over ${formatTimeframe(data.timeframeMonths)}, this exposure compounds to a significant financial burden that far exceeds the cost of proactive treatment."
    </div>
  </td></tr>
</table>

<!-- Breakdown Table -->
<table width="100%" style="margin-bottom: 24px;">
  <tr>
    <td colspan="3" style="padding: 0 0 8px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 3px; color: #999;">
      Cost Breakdown
    </td>
  </tr>
  ${sorted.map((e) => `
  <tr>
    <td style="border-bottom: 1px solid #eee; font-size: 13px; color: #444; font-weight: 500;">${e.label}</td>
    <td style="border-bottom: 1px solid #eee; font-size: 12px; text-align: right; color: #999; width: 100px;">${formatDollars(e.amount)}/mo</td>
    <td style="border-bottom: 1px solid #eee; font-size: 14px; text-align: right; font-weight: 700; color: #1a1a1a; width: 140px;">${formatDollars(e.amount * data.timeframeMonths)}</td>
  </tr>`).join("")}
  <tr style="background: #f9f8f4;">
    <td style="font-weight: 700; font-size: 13px; border-top: 2px solid #ddd; text-transform: uppercase; letter-spacing: 1px; color: #666;">Total</td>
    <td style="font-weight: 700; font-size: 12px; text-align: right; border-top: 2px solid #ddd; color: #999;">${formatDollars(monthlyTotal)}/mo</td>
    <td style="font-weight: 700; font-size: 18px; text-align: right; border-top: 2px solid #ddd; color: #DC2626; ${serifFont}">${formatDollars(projectedTotal)}</td>
  </tr>
</table>

${data.notes ? `<table width="100%" style="margin-bottom: 16px;">
  <tr><td style="padding: 14px 18px; background: #f9f8f4; border-left: 3px solid ${accentColor}; font-size: 12px; color: #666; line-height: 1.7;">
    <strong style="font-size: 9px; text-transform: uppercase; letter-spacing: 2px; color: #999; display: block; margin-bottom: 4px;">Notes</strong>
    ${data.notes}
  </td></tr>
</table>` : ""}

<p style="font-size: 9px; color: #bbb; margin-top: 28px; text-align: center; text-transform: uppercase; letter-spacing: 2px;">
  Cost of Inaction Analysis &bull; ${new Date().toLocaleDateString()}
</p>

</body></html>`;
  }

  // ── PDF/Clipboard version (SalesGapPro inspired) ──
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;600;700&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { ${sansFont} color: #1a1a1a; padding: 40px; max-width: 800px; margin: 0 auto; background: #fff; }

  .header-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4em; color: #DC2626; margin-bottom: 8px; }
  .header-title { ${serifFont} font-size: 32px; font-weight: 700; line-height: 1.2; margin-bottom: 4px; }
  .header-sub { font-size: 13px; color: #888; font-weight: 300; }

  .output-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin: 28px 0; }

  .diagnostic { ${serifFont} font-style: italic; font-size: 16px; color: #666; line-height: 1.8; margin: 16px 0; }

  .breakdown-card { padding: 24px; background: #f9f8f4; border-radius: 16px; border: 1px solid #eee; }
  .breakdown-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.25em; color: #999; margin-bottom: 16px; }
  .breakdown-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #eee; }
  .breakdown-row:last-child { border-bottom: none; }
  .breakdown-name { font-size: 13px; color: #444; font-weight: 500; }
  .breakdown-value { font-size: 14px; font-weight: 700; color: #1a1a1a; }

  .exposure-card { background: #DC2626; border-radius: 32px; padding: 40px; color: #fff; text-align: center; display: flex; flex-direction: column; justify-content: center; }
  .exposure-label { font-size: 10px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.3em; opacity: 0.7; margin-bottom: 16px; }
  .exposure-total { ${serifFont} font-size: 64px; line-height: 1; margin-bottom: 32px; letter-spacing: -2px; }
  .exposure-line { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.2); padding: 10px 0; }
  .exposure-line-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; opacity: 0.6; }
  .exposure-line-value { font-size: 15px; font-weight: 700; }

  .notes { padding: 16px 20px; background: #f9f8f4; border-left: 3px solid ${accentColor}; border-radius: 4px; margin-top: 24px; font-size: 12px; color: #666; line-height: 1.7; }
  .notes-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; color: #999; margin-bottom: 6px; }

  .footer { font-size: 9px; color: #bbb; text-align: center; margin-top: 32px; text-transform: uppercase; letter-spacing: 2px; }
</style>
</head><body>

<div class="header-label">Risk Analysis Brief</div>
<div class="header-title">${data.industryName}</div>
${data.propertyName ? `<div class="header-sub">${data.propertyName}</div>` : ""}

<div class="output-grid">
  <div>
    <div class="diagnostic">
      &ldquo;Every month without action costs an estimated ${formatDollars(monthlyTotal)}. Over ${formatTimeframe(data.timeframeMonths)}, this exposure compounds to a significant financial burden that far exceeds the cost of proactive treatment.&rdquo;
    </div>
    <div class="breakdown-card">
      <div class="breakdown-label">Cost Breakdown</div>
      ${sorted.map((e) => `<div class="breakdown-row">
        <span class="breakdown-name">${e.label}</span>
        <span class="breakdown-value">${formatDollars(e.amount * data.timeframeMonths)}</span>
      </div>`).join("\n")}
    </div>
  </div>

  <div class="exposure-card">
    <div class="exposure-label">Calculated Exposure</div>
    <div class="exposure-total">${formatDollars(projectedTotal)}</div>
    ${sorted.slice(0, 6).map((e) => `<div class="exposure-line">
      <span class="exposure-line-label">${e.label}</span>
      <span class="exposure-line-value">${formatDollars(e.amount * data.timeframeMonths)}</span>
    </div>`).join("\n")}
    <div class="exposure-line" style="border-bottom: none; padding-top: 12px; margin-top: 4px;">
      <span class="exposure-line-label">Monthly Rate</span>
      <span class="exposure-line-value" style="font-size: 18px; ${serifFont}">${formatDollars(monthlyTotal)}</span>
    </div>
  </div>
</div>

${data.notes ? `<div class="notes"><div class="notes-label">Notes</div>${data.notes}</div>` : ""}

<div class="footer">Cost of Inaction Analysis &bull; ${new Date().toLocaleDateString()}</div>

</body></html>`;
}

/** Plain text version for clipboard fallback */
export function buildCOIPlainText(data: CalculationData): string {
  const allEntries = [...data.entries, ...data.customEntries].filter((e) => e.enabled && e.amount > 0);
  const monthlyTotal = allEntries.reduce((sum, e) => sum + e.amount, 0);
  const projectedTotal = monthlyTotal * data.timeframeMonths;
  const sorted = [...allEntries].sort((a, b) => b.amount - a.amount);

  const lines = [
    "═══ COST OF INACTION ═══",
    "",
    `Risk Analysis: ${data.industryName}`,
    data.propertyName ? `Property: ${data.propertyName}` : "",
    `Timeframe: ${formatTimeframe(data.timeframeMonths)}`,
    "",
    `CALCULATED EXPOSURE: ${formatDollars(projectedTotal)}`,
    `Monthly Rate: ${formatDollars(monthlyTotal)}`,
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
