/**
 * The playground look (ROADMAP task 135): bright scenery for kids' games. Drawing only.
 * Colours are never the only signal; every game also labels things and describes the
 * scene in text.
 */

export const PLAYGROUND_COLOURS = Object.freeze({
  skyTop: "#5ab4ff",
  skyBottom: "#d8f0ff",
  nightTop: "#141a46",
  nightBottom: "#3b2f74",
  grass: "#5cc461",
  grassDark: "#3a9a46",
  sand: "#f4d58d",
  seaTop: "#2f8fe0",
  seaBottom: "#0d4f9c",
  sun: "#ffd23f",
  player: "#2e6be6",
  enemy: "#e2463b",
  gold: "#f2b705",
  ink: "#1d2440",
  white: "#ffffff",
});

export function sky(context: CanvasRenderingContext2D, width: number, height: number, night = false): void {
  const gradient = context.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, night ? PLAYGROUND_COLOURS.nightTop : PLAYGROUND_COLOURS.skyTop);
  gradient.addColorStop(1, night ? PLAYGROUND_COLOURS.nightBottom : PLAYGROUND_COLOURS.skyBottom);
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
}

export function sun(context: CanvasRenderingContext2D, x: number, y: number, radius = 22): void {
  context.beginPath();
  context.arc(x, y, radius, 0, 2 * Math.PI);
  context.fillStyle = PLAYGROUND_COLOURS.sun;
  context.fill();
  context.strokeStyle = "rgb(255 210 63 / 45%)";
  context.lineWidth = 6;
  context.stroke();
}

export function cloud(context: CanvasRenderingContext2D, x: number, y: number, size = 1): void {
  context.fillStyle = "rgb(255 255 255 / 90%)";
  for (const [dx, dy, r] of [[0, 0, 16], [18, -8, 20], [38, 0, 16], [18, 6, 16]] as const) {
    context.beginPath();
    context.arc(x + dx * size, y + dy * size, r * size, 0, 2 * Math.PI);
    context.fill();
  }
}

export function stars(context: CanvasRenderingContext2D, width: number, height: number): void {
  context.fillStyle = "rgb(255 255 255 / 80%)";
  for (let i = 0; i < 40; i += 1) {
    // A fixed pattern, so the sky does not flicker between frames.
    const x = ((i * 97) % 100) / 100 * width;
    const y = ((i * 53) % 100) / 100 * height * 0.6;
    context.fillRect(x, y, 2, 2);
  }
}

/** A radial burst of rays, growing then fading over `age` seconds (0–1). */
export function burst(context: CanvasRenderingContext2D, x: number, y: number, age: number, colour = "#ff8a00"): void {
  if (age < 0 || age > 1) {
    return;
  }
  const radius = 10 + 40 * age;
  context.save();
  context.globalAlpha = 1 - age;
  for (let i = 0; i < 10; i += 1) {
    const angle = (i / 10) * 2 * Math.PI;
    context.beginPath();
    context.moveTo(x + Math.cos(angle) * radius * 0.3, y + Math.sin(angle) * radius * 0.3);
    context.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
    context.strokeStyle = i % 2 === 0 ? colour : PLAYGROUND_COLOURS.sun;
    context.lineWidth = 4;
    context.stroke();
  }
  context.restore();
}

export function sea(context: CanvasRenderingContext2D, top: number, width: number, height: number, phase = 0): void {
  const gradient = context.createLinearGradient(0, top, 0, height);
  gradient.addColorStop(0, PLAYGROUND_COLOURS.seaTop);
  gradient.addColorStop(1, PLAYGROUND_COLOURS.seaBottom);
  context.fillStyle = gradient;
  context.beginPath();
  context.moveTo(0, height);
  for (let x = 0; x <= width; x += 10) {
    context.lineTo(x, top + Math.sin(x / 30 + phase) * 4);
  }
  context.lineTo(width, height);
  context.fill();
}

export function badge(context: CanvasRenderingContext2D, text: string, x: number, y: number, background: string = PLAYGROUND_COLOURS.ink): void {
  context.font = "700 12px 'DM Sans', sans-serif";
  const width = context.measureText(text).width + 14;
  context.fillStyle = background;
  context.beginPath();
  context.roundRect(x, y - 14, width, 20, 10);
  context.fill();
  context.fillStyle = PLAYGROUND_COLOURS.white;
  context.fillText(text, x + 7, y);
}
