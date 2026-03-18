import type { PenSkin } from '../types/lotto';

export interface CellRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export function renderInkStroke(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  pen: PenSkin,
): void {
  if (points.length === 0) return;
  ctx.save();
  ctx.globalAlpha = pen.opacity;
  ctx.strokeStyle = pen.color;
  ctx.lineWidth = pen.strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.filter = pen.blurRadius > 0 ? `blur(${pen.blurRadius}px)` : 'none';

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
  ctx.restore();
}

export function renderInkFill(
  ctx: CanvasRenderingContext2D,
  rect: CellRect,
  pen: PenSkin,
  progress: number,
): void {
  ctx.save();
  ctx.globalAlpha = pen.opacity;
  ctx.fillStyle = pen.color;
  ctx.filter = pen.blurRadius > 0 ? `blur(${pen.blurRadius}px)` : 'none';

  // 꺽쇠 안쪽 영역만 위→아래로 채움 (좌우 25% 패딩, 상하 약간 패딩)
  const padX = rect.width * 0.2;
  const padY = rect.height * 0.1;
  const innerX = rect.x + padX;
  const innerY = rect.y + padY;
  const innerW = rect.width - padX * 2;
  const innerH = rect.height - padY * 2;

  const fillHeight = innerH * Math.min(progress, 1);
  ctx.fillRect(innerX, innerY, innerW, fillHeight);
  ctx.restore();
}

export function renderInkFillComplete(
  ctx: CanvasRenderingContext2D,
  rect: CellRect,
  pen: PenSkin,
): void {
  renderInkFill(ctx, rect, pen, 1.0);
}
