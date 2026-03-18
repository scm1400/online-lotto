import type { CellRect } from './inkRenderer';

export function renderEraserWipe(
  ctx: CanvasRenderingContext2D,
  rect: CellRect,
  progress: number,
): void {
  ctx.save();
  if (progress >= 1) {
    ctx.clearRect(rect.x, rect.y, rect.width, rect.height);
  } else {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.globalAlpha = progress;
    ctx.fillStyle = 'white';
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
  }
  ctx.restore();
}

export function clearAllInk(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  ctx.clearRect(0, 0, width, height);
}
