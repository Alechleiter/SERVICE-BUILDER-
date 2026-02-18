/**
 * Export content as a real PDF download via html2canvas + jsPDF.
 * No print dialog — produces a direct .pdf file download.
 */
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export async function exportPDF(html: string, title = "Document"): Promise<void> {
  // Create an off-screen container to render the HTML
  const container = document.createElement("div");
  container.style.cssText =
    "position:fixed;left:-9999px;top:0;width:750px;" +
    "background:#fff;font-family:Arial,Helvetica,sans-serif;color:#1a1a2e;";
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    // Wait for images to load
    const images = container.querySelectorAll("img");
    await Promise.all(
      Array.from(images).map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) return resolve();
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }),
      ),
    );
    // Small extra delay for rendering
    await new Promise((r) => setTimeout(r, 200));

    // Letter size in points: 612 × 792
    const pageWidthPt = 612;
    const pageHeightPt = 792;
    const marginPt = 36; // 0.5 inch margins
    const contentWidthPt = pageWidthPt - marginPt * 2;
    const contentHeightPt = pageHeightPt - marginPt * 2;

    // Render at 2x for quality
    const scale = 2;
    const canvas = await html2canvas(container, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      width: 750,
      windowWidth: 750,
    });

    // Compute how many pages we need
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    // Ratio: content area pixels per PDF point
    const pxPerPt = imgWidth / contentWidthPt;
    const pageContentHeightPx = contentHeightPt * pxPerPt;

    const totalPages = Math.ceil(imgHeight / pageContentHeightPx);

    const pdf = new jsPDF({ unit: "pt", format: "letter" });

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) pdf.addPage();

      // Slice this page's portion from the full canvas
      const srcY = page * pageContentHeightPx;
      const srcH = Math.min(pageContentHeightPx, imgHeight - srcY);

      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = imgWidth;
      sliceCanvas.height = srcH;
      const ctx = sliceCanvas.getContext("2d")!;
      ctx.drawImage(canvas, 0, srcY, imgWidth, srcH, 0, 0, imgWidth, srcH);

      const sliceData = sliceCanvas.toDataURL("image/jpeg", 0.92);
      const destH = srcH / pxPerPt;

      pdf.addImage(sliceData, "JPEG", marginPt, marginPt, contentWidthPt, destH);
    }

    // Sanitize filename — only strip characters unsafe for filenames
    const safeName = title.replace(/[<>:"/\\|?*]/g, "").trim() || "proposal";
    pdf.save(`${safeName}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}
