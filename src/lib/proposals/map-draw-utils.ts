/**
 * Shared geometry helpers for architectural drawing tools.
 * Used by both MapAnnotator (live canvas) and map-rasterize (export).
 */

/** Clockwise perpendicular unit vector to segment (x1,y1)→(x2,y2). */
export function perpCW(
  x1: number, y1: number, x2: number, y2: number,
): [number, number] {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  return [dy / len, -dx / len];
}

/** Length of segment from (x1,y1) to (x2,y2). */
export function segLen(
  x1: number, y1: number, x2: number, y2: number,
): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/** Check if a tool is an architectural symbol tool. */
export function isArchTool(tool: string): boolean {
  return (
    tool === "door" ||
    tool === "double-door" ||
    tool === "sliding-door" ||
    tool === "rollup-door" ||
    tool === "window"
  );
}

/**
 * Draw an architectural symbol on a canvas context.
 * Coordinates are already in pixel space.
 */
export function drawArchSymbol(
  ctx: CanvasRenderingContext2D,
  tool: string,
  x1: number, y1: number, x2: number, y2: number,
): void {
  const len = segLen(x1, y1, x2, y2);
  if (len < 1) return;

  switch (tool) {
    case "door": {
      // Wall opening line
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Door leaf: perpendicular from p1, same length as opening
      const [nx, ny] = perpCW(x1, y1, x2, y2);
      const leafX = x1 + nx * len;
      const leafY = y1 + ny * len;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(leafX, leafY);
      ctx.stroke();

      // 90° swing arc from leaf-end to p2
      const angleToP2 = Math.atan2(y2 - y1, x2 - x1);
      const angleToLeaf = Math.atan2(leafY - y1, leafX - x1);
      ctx.beginPath();
      ctx.arc(x1, y1, len, angleToLeaf, angleToP2, false);
      ctx.stroke();
      break;
    }

    case "double-door": {
      const half = len / 2;

      // Wall opening line
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      const [nx, ny] = perpCW(x1, y1, x2, y2);
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;

      // Left leaf from p1
      const leaf1X = x1 + nx * half;
      const leaf1Y = y1 + ny * half;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(leaf1X, leaf1Y);
      ctx.stroke();
      const a1ToMid = Math.atan2(my - y1, mx - x1);
      const a1ToLeaf = Math.atan2(leaf1Y - y1, leaf1X - x1);
      ctx.beginPath();
      ctx.arc(x1, y1, half, a1ToLeaf, a1ToMid, false);
      ctx.stroke();

      // Right leaf from p2 (opposite perp direction)
      const leaf2X = x2 - nx * half;
      const leaf2Y = y2 - ny * half;
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(leaf2X, leaf2Y);
      ctx.stroke();
      const a2ToMid = Math.atan2(my - y2, mx - x2);
      const a2ToLeaf = Math.atan2(leaf2Y - y2, leaf2X - x2);
      ctx.beginPath();
      ctx.arc(x2, y2, half, a2ToLeaf, a2ToMid, true);
      ctx.stroke();
      break;
    }

    case "sliding-door": {
      const [nx, ny] = perpCW(x1, y1, x2, y2);
      const offset = Math.min(len * 0.15, 8);

      // Wall opening line
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Sliding panel (offset parallel line)
      const p1ox = x1 + nx * offset, p1oy = y1 + ny * offset;
      const p2ox = x2 + nx * offset, p2oy = y2 + ny * offset;
      ctx.beginPath();
      ctx.moveTo(p1ox, p1oy);
      ctx.lineTo(p2ox, p2oy);
      ctx.stroke();

      // Direction arrow along the offset line
      const dx = (x2 - x1) / len, dy = (y2 - y1) / len;
      const arrowLen = Math.min(len * 0.3, 20);
      const midX = (p1ox + p2ox) / 2, midY = (p1oy + p2oy) / 2;
      const arrowEndX = midX + dx * arrowLen / 2;
      const arrowEndY = midY + dy * arrowLen / 2;
      const arrowStartX = midX - dx * arrowLen / 2;
      const arrowStartY = midY - dy * arrowLen / 2;
      const headLen = arrowLen * 0.3;
      ctx.beginPath();
      ctx.moveTo(arrowStartX, arrowStartY);
      ctx.lineTo(arrowEndX, arrowEndY);
      ctx.lineTo(
        arrowEndX - dx * headLen + ny * headLen * 0.5,
        arrowEndY - dy * headLen - nx * headLen * 0.5,
      );
      ctx.moveTo(arrowEndX, arrowEndY);
      ctx.lineTo(
        arrowEndX - dx * headLen - ny * headLen * 0.5,
        arrowEndY - dy * headLen + nx * headLen * 0.5,
      );
      ctx.stroke();
      break;
    }

    case "rollup-door": {
      // Wall opening line
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Zigzag corrugation pattern
      const [nx, ny] = perpCW(x1, y1, x2, y2);
      const segH = Math.min(len * 0.12, 8);
      const numSegs = Math.max(3, Math.round(len / 10));
      const ddx = (x2 - x1) / numSegs;
      const ddy = (y2 - y1) / numSegs;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      for (let i = 1; i <= numSegs; i++) {
        const bx = x1 + ddx * i;
        const by = y1 + ddy * i;
        const sign = i % 2 === 1 ? 1 : 0;
        ctx.lineTo(bx + nx * segH * sign, by + ny * segH * sign);
      }
      ctx.stroke();
      break;
    }

    case "window": {
      const [nx, ny] = perpCW(x1, y1, x2, y2);
      const wallThick = Math.min(len * 0.1, 6);

      // Outer wall line
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Inner wall line (offset)
      ctx.beginPath();
      ctx.moveTo(x1 + nx * wallThick, y1 + ny * wallThick);
      ctx.lineTo(x2 + nx * wallThick, y2 + ny * wallThick);
      ctx.stroke();

      // Glazing ticks connecting the two wall lines
      const numTicks = Math.max(2, Math.round(len / 12));
      const ddx = (x2 - x1) / (numTicks + 1);
      const ddy = (y2 - y1) / (numTicks + 1);
      for (let i = 1; i <= numTicks; i++) {
        const bx = x1 + ddx * i;
        const by = y1 + ddy * i;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + nx * wallThick, by + ny * wallThick);
        ctx.stroke();
      }
      break;
    }
  }
}
