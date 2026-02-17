/**
 * Copy rich HTML content to clipboard with plain-text fallback.
 * Uses modern Clipboard API when available, falls back to execCommand.
 */
export async function copyToClipboard(html: string, plainText?: string): Promise<boolean> {
  const text = plainText || htmlToPlainText(html);

  // Try modern Clipboard API first (works in secure contexts)
  if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
    try {
      const htmlBlob = new Blob([html], { type: "text/html" });
      const textBlob = new Blob([text], { type: "text/plain" });
      await navigator.clipboard.write([
        new ClipboardItem({ "text/html": htmlBlob, "text/plain": textBlob }),
      ]);
      return true;
    } catch {
      // Fall through to legacy method
    }
  }

  // Legacy fallback: execCommand with a temporary element
  try {
    const container = document.createElement("div");
    container.innerHTML = html;
    container.style.position = "fixed";
    container.style.left = "-9999px";
    document.body.appendChild(container);

    const range = document.createRange();
    range.selectNodeContents(container);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    document.execCommand("copy");
    sel?.removeAllRanges();
    document.body.removeChild(container);
    return true;
  } catch {
    // Last resort: plain text only
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }
}

/** Simple HTML to plain text conversion */
function htmlToPlainText(html: string): string {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}
