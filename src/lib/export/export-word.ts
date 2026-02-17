/**
 * Export content as a Word .doc file via HTML blob download.
 * Uses Word XML namespaces for proper formatting in MS Word.
 */
export function exportWord(html: string, filename = "document"): void {
  const fullHTML =
    `<html xmlns:o="urn:schemas-microsoft-com:office:office" ` +
    `xmlns:w="urn:schemas-microsoft-com:office:word" ` +
    `xmlns="http://www.w3.org/TR/REC-html40">` +
    `<head><meta charset="utf-8"><title>${filename}</title>` +
    `<!--[if gte mso 9]><xml><w:WordDocument>` +
    `<w:View>Print</w:View>` +
    `<w:Zoom>100</w:Zoom>` +
    `<w:DoNotOptimizeForBrowser/>` +
    `</w:WordDocument></xml><![endif]-->` +
    `<style>` +
    `@page { size: 8.5in 11in; margin: 0.75in 0.75in 0.75in 0.75in; }` +
    `body { font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.4; margin: 0; padding: 0; word-wrap: break-word; }` +
    `table { border-collapse: collapse; }` +
    `img { max-width: 100%; height: auto; }` +
    `p { margin: 0 0 6px 0; }` +
    `h1 { font-size: 18pt; }` +
    `h2 { font-size: 12pt; }` +
    `h3 { font-size: 11pt; }` +
    `</style>` +
    `</head><body>${html}</body></html>`;

  const blob = new Blob(["\ufeff", fullHTML], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
