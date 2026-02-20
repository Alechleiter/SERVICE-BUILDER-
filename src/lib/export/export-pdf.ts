/**
 * Export content as a high-resolution PDF download via html2canvas + jsPDF.
 *
 * Strategy:
 *   1. Flatten the export HTML into atomic "blocks" — elements that should
 *      never be split across pages (photo rows, section headings, paragraphs).
 *   2. Pack blocks into pages respecting forced page-break markers and
 *      available height.
 *   3. Render each page independently at 3× scale as PNG for crisp output.
 */
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

// ── PDF page geometry (Letter, 0.5-inch margins) ──────────────────────
const PAGE_W_PT = 612;
const PAGE_H_PT = 792;
const MARGIN_PT = 36;
const CONTENT_W_PT = PAGE_W_PT - MARGIN_PT * 2; // 540
const CONTENT_H_PT = PAGE_H_PT - MARGIN_PT * 2; // 720

// ── Render settings ───────────────────────────────────────────────────
const RENDER_WIDTH = 750;
const SCALE = 3;

/** Detect if an element carries a forced page-break-before */
function hasPageBreakBefore(el: HTMLElement): boolean {
  const cs = getComputedStyle(el);
  return (
    cs.pageBreakBefore === "always" ||
    cs.breakBefore === "page" ||
    el.classList.contains("pb-before") ||
    el.style.pageBreakBefore === "always"
  );
}

/** Detect if an element should be kept together (not split) */
function isAtomic(el: HTMLElement): boolean {
  const cs = getComputedStyle(el);
  return (
    el.classList.contains("pb-avoid") ||
    cs.pageBreakInside === "avoid" ||
    cs.breakInside === "avoid" ||
    el.tagName === "IMG" ||
    el.tagName === "TABLE"
  );
}

interface Block {
  element: HTMLElement;
  forceBreakBefore: boolean;
  height: number; // CSS-px height
}

/**
 * Recursively flatten the wrapper's DOM into atomic blocks.
 * - If an element is atomic (pb-avoid, table, img) → emit it as one block.
 * - If an element has a forced page-break-before → mark the block.
 * - Otherwise recurse into its children to find smaller atomic blocks.
 * - Leaf nodes (no children or short text nodes) are emitted as-is.
 */
function flattenToBlocks(parent: HTMLElement): Block[] {
  const blocks: Block[] = [];
  const children = Array.from(parent.children) as HTMLElement[];

  for (const el of children) {
    const forcePB = hasPageBreakBefore(el);
    const rect = el.getBoundingClientRect();
    const h = rect.height;

    if (h <= 0) continue; // skip invisible

    if (isAtomic(el)) {
      // This element should not be split — emit as one block
      blocks.push({ element: el, forceBreakBefore: forcePB, height: h });
    } else {
      // Check if this element has child elements we can recurse into
      const innerChildren = Array.from(el.children) as HTMLElement[];
      if (innerChildren.length === 0) {
        // Leaf-level node
        blocks.push({ element: el, forceBreakBefore: forcePB, height: h });
      } else {
        // Recurse — but propagate the page-break to the first child
        const sub = flattenToBlocks(el);
        if (sub.length > 0 && forcePB) {
          sub[0].forceBreakBefore = true;
        }
        blocks.push(...sub);
      }
    }
  }

  return blocks;
}

/** Wait for all <img> in a container to finish loading */
async function waitForImages(root: HTMLElement): Promise<void> {
  const imgs = root.querySelectorAll("img");
  await Promise.all(
    Array.from(imgs).map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) return resolve();
          img.onload = () => resolve();
          img.onerror = () => resolve();
        }),
    ),
  );
}

export async function exportPDF(html: string, title = "Document"): Promise<void> {
  // ── 1. Create off-screen render container ──────────────────────────
  const container = document.createElement("div");
  container.style.cssText =
    "position:fixed;left:-9999px;top:0;width:750px;" +
    "background:#fff;font-family:Arial,Helvetica,sans-serif;color:#1a1a2e;";
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    await waitForImages(container);
    await new Promise((r) => setTimeout(r, 300));

    // ── 2. Flatten into atomic blocks ────────────────────────────────
    // The first child of container is the <style> tag (or the wrapper).
    // Find the wrapper div (the one with max-width:750px).
    let wrapper: HTMLElement | null = null;
    for (const child of Array.from(container.children) as HTMLElement[]) {
      if (child.tagName !== "STYLE") { wrapper = child; break; }
    }
    if (!wrapper) throw new Error("Empty content");

    const allBlocks = flattenToBlocks(wrapper);
    if (allBlocks.length === 0) throw new Error("No content blocks");

    // ── 3. Pack blocks into page groups ──────────────────────────────
    const pageMaxH = (CONTENT_H_PT / CONTENT_W_PT) * RENDER_WIDTH; // CSS-px

    interface PageGroup { blocks: Block[]; }
    const pages: PageGroup[] = [];
    let currentPage: PageGroup = { blocks: [] };
    let usedHeight = 0;

    for (const block of allBlocks) {
      // Forced page break → start new page (if current has content)
      if (block.forceBreakBefore && currentPage.blocks.length > 0) {
        pages.push(currentPage);
        currentPage = { blocks: [] };
        usedHeight = 0;
      }

      // Would this block overflow? Push to next page.
      // Give 8px tolerance for margins/rounding.
      if (usedHeight + block.height > pageMaxH + 8 && currentPage.blocks.length > 0) {
        pages.push(currentPage);
        currentPage = { blocks: [] };
        usedHeight = 0;
      }

      currentPage.blocks.push(block);
      usedHeight += block.height;
    }
    if (currentPage.blocks.length > 0) pages.push(currentPage);

    // ── 4. Render each page at high resolution ───────────────────────
    const pdf = new jsPDF({ unit: "pt", format: "letter" });
    // Grab the wrapper's inline styles so cloned pages look the same
    const wrapperStyles = wrapper.style.cssText;

    for (let i = 0; i < pages.length; i++) {
      if (i > 0) pdf.addPage();

      // Build a temporary container with only this page's elements (cloned)
      const pageContainer = document.createElement("div");
      pageContainer.style.cssText =
        "position:fixed;left:-9999px;top:0;width:750px;" +
        "background:#fff;font-family:Arial,Helvetica,sans-serif;color:#1a1a2e;padding:0;";

      const pageWrapper = document.createElement("div");
      pageWrapper.style.cssText = wrapperStyles;
      pageWrapper.style.margin = "0";
      pageWrapper.style.padding = "40px";

      for (const block of pages[i].blocks) {
        const clone = block.element.cloneNode(true) as HTMLElement;
        // Strip any page-break styles off the clone
        clone.style.pageBreakBefore = "auto";
        clone.style.breakBefore = "auto";
        clone.style.marginTop = clone.style.marginTop || "0";
        clone.classList.remove("pb-before");
        pageWrapper.appendChild(clone);
      }

      pageContainer.appendChild(pageWrapper);
      document.body.appendChild(pageContainer);

      await waitForImages(pageContainer);
      await new Promise((r) => setTimeout(r, 80));

      const canvas = await html2canvas(pageContainer, {
        scale: SCALE,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        width: RENDER_WIDTH,
        windowWidth: RENDER_WIDTH,
      });

      document.body.removeChild(pageContainer);

      // Add rendered canvas to PDF as a single page image (PNG for crisp quality)
      const imgData = canvas.toDataURL("image/png");
      const destH = (canvas.height / canvas.width) * CONTENT_W_PT;

      // If the rendered content somehow exceeds one page height (a single
      // atomic block like a very tall photo), we still need to handle it,
      // but this should be rare with proper block sizing.
      if (destH <= CONTENT_H_PT + 2) {
        pdf.addImage(imgData, "PNG", MARGIN_PT, MARGIN_PT, CONTENT_W_PT, destH);
      } else {
        // Fallback: slice the oversized canvas
        const pxPerPt = canvas.width / CONTENT_W_PT;
        const pageContentHeightPx = CONTENT_H_PT * pxPerPt;
        const subPages = Math.ceil(canvas.height / pageContentHeightPx);

        for (let sp = 0; sp < subPages; sp++) {
          if (sp > 0) pdf.addPage();
          const srcY = sp * pageContentHeightPx;
          const srcH = Math.min(pageContentHeightPx, canvas.height - srcY);

          const sliceCanvas = document.createElement("canvas");
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = Math.round(srcH);
          const ctx = sliceCanvas.getContext("2d")!;
          ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, Math.round(srcH));

          const sliceData = sliceCanvas.toDataURL("image/png");
          const sliceDestH = srcH / pxPerPt;
          pdf.addImage(sliceData, "PNG", MARGIN_PT, MARGIN_PT, CONTENT_W_PT, sliceDestH);
        }
      }
    }

    // ── 5. Save ──────────────────────────────────────────────────────
    const safeName = title.replace(/[<>:"/\\|?*]/g, "").trim() || "proposal";
    pdf.save(`${safeName}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}
