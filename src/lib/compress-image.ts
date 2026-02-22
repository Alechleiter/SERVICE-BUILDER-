/**
 * Compress an image data-URL so exported documents stay under ~15 MB.
 *
 * Strategy:
 *   1. Decode the data-URL into an Image element.
 *   2. Draw onto a <canvas> that is at most MAX_DIM px on its longest side
 *      (preserving aspect ratio).
 *   3. Export as JPEG at the given quality (0–1).
 *
 * The map image is left untouched (only photos go through this).
 */

const MAX_DIM = 1400;   // longest edge — plenty for print quality
const QUALITY = 0.72;   // JPEG quality — crisp but small

export function compressImage(
  dataUrl: string,
  maxDim = MAX_DIM,
  quality = QUALITY,
): Promise<string> {
  return new Promise((resolve) => {
    // If it's already tiny or not an image, return as-is
    if (!dataUrl.startsWith("data:image")) {
      resolve(dataUrl);
      return;
    }

    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // Down-scale if necessary
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      // Export as JPEG
      const compressed = canvas.toDataURL("image/jpeg", quality);

      // Use whichever is smaller (rare edge case: small PNGs may grow as JPEG)
      resolve(compressed.length < dataUrl.length ? compressed : dataUrl);
    };
    img.onerror = () => resolve(dataUrl); // fallback: return original
    img.src = dataUrl;
  });
}
