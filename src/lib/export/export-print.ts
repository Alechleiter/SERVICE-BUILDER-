/**
 * Send content directly to the printer via a new window.
 */
export function printContent(html: string, title = "Print"): void {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to print.");
    return;
  }
  printWindow.document.write(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>` +
    `<style>@media print{@page{margin:0.5in;size:letter;}body{margin:0;}} ` +
    `@media screen{body{padding:20px;}}</style>` +
    `</head><body>${html}</body></html>`
  );
  printWindow.document.close();
  setTimeout(() => {
    printWindow.print();
    // Close after print dialog (some browsers fire afterprint)
    printWindow.onafterprint = () => printWindow.close();
  }, 400);
}
