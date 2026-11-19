/** Small canvas helpers shared by the live games. Drawing only; no physics here. */

export interface View {
  /** World rectangle shown, in metres (or the game's own unit). */
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
  readonly width: number;
  readonly height: number;
  readonly padding?: number;
}

export function toScreen(view: View, x: number, y: number): { x: number; y: number } {
  const pad = view.padding ?? 24;
  const scale = Math.min((view.width - 2 * pad) / (view.maxX - view.minX), (view.height - 2 * pad) / (view.maxY - view.minY));
  return { x: pad + (x - view.minX) * scale, y: view.height - pad - (y - view.minY) * scale };
}

export function scaleOf(view: View): number {
  const pad = view.padding ?? 24;
  return Math.min((view.width - 2 * pad) / (view.maxX - view.minX), (view.height - 2 * pad) / (view.maxY - view.minY));
}

export function circle(context: CanvasRenderingContext2D, x: number, y: number, radius: number, fill: string, stroke?: string): void {
  context.beginPath();
  context.arc(x, y, radius, 0, 2 * Math.PI);
  context.fillStyle = fill;
  context.fill();
  if (stroke) {
    context.strokeStyle = stroke;
    context.lineWidth = 2;
    context.stroke();
  }
}

export function line(context: CanvasRenderingContext2D, points: readonly { x: number; y: number }[], color: string, width = 2, dashed = false): void {
  if (points.length < 2) {
    return;
  }
  context.beginPath();
  context.setLineDash(dashed ? [6, 5] : []);
  points.forEach((point, index) => (index === 0 ? context.moveTo(point.x, point.y) : context.lineTo(point.x, point.y)));
  context.strokeStyle = color;
  context.lineWidth = width;
  context.stroke();
  context.setLineDash([]);
}

export function label(context: CanvasRenderingContext2D, text: string, x: number, y: number, color = "#3d4760", size = 11): void {
  context.fillStyle = color;
  context.font = `600 ${size}px 'DM Sans', sans-serif`;
  context.fillText(text, x, y);
}

export function arrow(context: CanvasRenderingContext2D, from: { x: number; y: number }, to: { x: number; y: number }, color: string): void {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  line(context, [from, to], color, 2);
  line(context, [{ x: to.x - 8 * Math.cos(angle - 0.5), y: to.y - 8 * Math.sin(angle - 0.5) }, to, { x: to.x - 8 * Math.cos(angle + 0.5), y: to.y - 8 * Math.sin(angle + 0.5) }], color, 2);
}

export function ground(context: CanvasRenderingContext2D, view: View, y = 0, color = "#cfd6e6"): void {
  const left = toScreen(view, view.minX, y);
  const right = toScreen(view, view.maxX, y);
  context.fillStyle = color;
  context.fillRect(0, left.y, view.width, view.height - left.y);
  line(context, [left, right], "#9aa4bb", 2);
}
