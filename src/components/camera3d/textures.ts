import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from "three";

/**
 * Procedural textures drawn on 2D canvases: no image file, no network.
 * All functions run client side only (the 3D view is loaded with ssr: false).
 */

function canvas(width: number, height: number) {
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  return [c, c.getContext("2d")!] as const;
}

/** Deterministic pseudo random generator, so textures look the same on every visit. */
function seeded(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

/** Converts a grey height field into a tangent space normal map. */
function heightToNormal(src: HTMLCanvasElement, strength: number): HTMLCanvasElement {
  const { width: w, height: h } = src;
  const data = src.getContext("2d")!.getImageData(0, 0, w, h).data;
  const [out, ctx] = canvas(w, h);
  const img = ctx.createImageData(w, h);
  const at = (x: number, y: number) => data[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * w + x) * 4;
      img.data[i] = ((-dx / len) * 0.5 + 0.5) * 255;
      img.data[i + 1] = ((dy / len) * 0.5 + 0.5) * 255;
      img.data[i + 2] = ((1 / len) * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return out;
}

/**
 * The body is mirrored at its root (see body-model): labels drawn on it must be
 * flipped back to read the right way round.
 */
export function flipX<T extends Texture>(t: T): T {
  t.wrapS = RepeatWrapping;
  t.repeat.x = -1;
  t.offset.x = 1;
  return t;
}

function tiled(source: HTMLCanvasElement, repeatX: number, repeatY: number, color = false): Texture {
  const t = new CanvasTexture(source);
  t.wrapS = t.wrapT = RepeatWrapping;
  t.repeat.set(repeatX, repeatY);
  t.anisotropy = 8;
  if (color) t.colorSpace = SRGBColorSpace;
  return t;
}

/** Pebbled leatherette, as on the grip and body covering. */
export function leatherNormal(repeat = 6): Texture {
  const [c, ctx] = canvas(256, 256);
  const rnd = seeded(7);
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2600; i++) {
    const x = rnd() * 256;
    const y = rnd() * 256;
    const r = 1.2 + rnd() * 3.2;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(255,255,255,0.55)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    for (const ox of [-256, 0, 256])
      for (const oy of [-256, 0, 256]) {
        ctx.beginPath();
        ctx.arc(x + ox, y + oy, r, 0, Math.PI * 2);
        ctx.fill();
      }
  }
  return tiled(heightToNormal(c, 2.2), repeat, repeat);
}

/** Fine sand blasted plastic. */
export function grainNormal(repeat = 10): Texture {
  const [c, ctx] = canvas(128, 128);
  const rnd = seeded(11);
  const img = ctx.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 110 + rnd() * 40;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return tiled(heightToNormal(c, 0.8), repeat, repeat);
}

/** Straight ribs around a ring (u wraps around the cylinder). */
export function ribNormal(ribs: number): Texture {
  const [c, ctx] = canvas(64, 8);
  const g = ctx.createLinearGradient(0, 0, 64, 0);
  g.addColorStop(0, "#202020");
  g.addColorStop(0.35, "#f0f0f0");
  g.addColorStop(0.65, "#f0f0f0");
  g.addColorStop(1, "#202020");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 8);
  return tiled(heightToNormal(c, 6), ribs, 1);
}

/** Brushed metal streaks for the lens mount. */
export function brushedRoughness(): Texture {
  const [c, ctx] = canvas(256, 16);
  const rnd = seeded(3);
  for (let x = 0; x < 256; x++) {
    const v = 90 + rnd() * 80;
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(x, 0, 1, 16);
  }
  return tiled(c, 4, 1);
}

/** Concentric spun finish of the command dial top. */
export function spunRoughness(): Texture {
  const size = 256;
  const [c, ctx] = canvas(size, size);
  const rnd = seeded(11);
  for (let r = size / 2; r > 0; r -= 1.5) {
    const v = 70 + rnd() * 90;
    ctx.strokeStyle = `rgb(${v},${v},${v})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  return tiled(c, 1, 1);
}

/** One position printed on the mode dial: a label or a pictogram, at an angle (0 at the top, clockwise). */
export interface DialStop {
  at: number;
  label?: string;
  icon?: "auto" | "flash-off" | "child" | "sports" | "close-up" | "night-portrait";
  /** Text set along the radius instead of around the rim. */
  radial?: boolean;
  size?: number;
}

/**
 * Top of the D3500 mode dial, after Nikon's illustration: P S A M grouped by a
 * bracket, GUIDE, the green AUTO, the scene pictograms and EFFECTS, printed in
 * white on black with a spun, sunburst sheen and a notch in the rim.
 */
export function modeDialTop(stops: readonly DialStop[], bracket: [number, number], size = 1024): Texture {
  const [c, ctx] = canvas(size, size);
  const mid = size / 2;
  const R = mid * 0.98;
  ctx.fillStyle = "#0e0f11";
  ctx.beginPath();
  ctx.arc(mid, mid, R, 0, Math.PI * 2);
  ctx.fill();
  // Sunburst: light catching the spun finish along two opposite sectors.
  const sheen = ctx.createConicGradient(-Math.PI / 4, mid, mid);
  for (const [o, a] of [
    [0, 0.0],
    [0.12, 0.16],
    [0.25, 0.0],
    [0.5, 0.0],
    [0.62, 0.12],
    [0.75, 0.0],
    [1, 0.0],
  ] as const)
    sheen.addColorStop(o, `rgba(255,255,255,${a})`);
  ctx.fillStyle = sheen;
  ctx.fill();
  const rnd = seeded(5);
  ctx.lineWidth = 1;
  for (let k = 0; k < 360; k++) {
    const a = (k / 360) * Math.PI * 2;
    ctx.strokeStyle = `rgba(255,255,255,${0.015 + rnd() * 0.03})`;
    ctx.beginPath();
    ctx.moveTo(mid, mid);
    ctx.lineTo(mid + Math.cos(a) * R, mid + Math.sin(a) * R);
    ctx.stroke();
  }

  const polar = (a: number, r: number): [number, number] => [mid + Math.sin(a) * r, mid - Math.cos(a) * r];
  const white = "#f1f0ec";
  const green = "#1fae4b";

  // Bracket around P S A M: an inner arc with its ends turned outwards.
  ctx.strokeStyle = white;
  ctx.lineWidth = size * 0.009;
  ctx.beginPath();
  ctx.moveTo(...polar(bracket[0], R * 0.86));
  ctx.lineTo(...polar(bracket[0], R * 0.6));
  ctx.arc(mid, mid, R * 0.6, bracket[0] - Math.PI / 2, bracket[1] - Math.PI / 2);
  ctx.lineTo(...polar(bracket[1], R * 0.86));
  ctx.stroke();

  for (const stop of stops) {
    const color = stop.icon === "auto" ? green : white;
    ctx.save();
    ctx.translate(...polar(stop.at, stop.radial ? R * 0.6 : R * 0.76));
    ctx.rotate(stop.at + (stop.radial ? Math.PI / 2 : 0));
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (stop.label) {
      ctx.font = `800 ${(stop.size ?? 0.11) * size}px "Arial Narrow", "Roboto Condensed", system-ui, sans-serif`;
      ctx.save();
      ctx.scale(0.8, 1);
      ctx.fillText(stop.label, 0, 0);
      ctx.restore();
    }
    if (stop.icon) drawDialIcon(ctx, stop.icon, size * 0.09);
    ctx.restore();
  }

  // Notch in the rim, under the green AUTO.
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(...polar((190 * Math.PI) / 180, R), size * 0.02, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = size * 0.012;
  ctx.beginPath();
  ctx.arc(mid, mid, R - size * 0.006, 0, Math.PI * 2);
  ctx.stroke();

  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Pictograms of the mode dial, simplified, centred on the origin, `s` across. */
function drawDialIcon(ctx: CanvasRenderingContext2D, icon: NonNullable<DialStop["icon"]>, s: number) {
  const h = s / 2;
  ctx.lineWidth = s * 0.1;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const dot = (x: number, y: number, r: number) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };
  switch (icon) {
    case "auto": {
      // "AUTO" above a small camera.
      ctx.save();
      ctx.font = `800 ${s * 0.62}px "Arial Narrow", system-ui, sans-serif`;
      ctx.scale(0.85, 1);
      ctx.fillText("AUTO", 0, -s * 0.55);
      ctx.restore();
      ctx.beginPath();
      ctx.roundRect(-h * 0.85, s * 0.05, s * 0.85, s * 0.6, s * 0.08);
      ctx.fill();
      ctx.fillRect(-h * 0.3, -s * 0.05, s * 0.3, s * 0.12);
      ctx.fillStyle = "#0e0f11";
      dot(0, s * 0.35, s * 0.16);
      break;
    }
    case "flash-off": {
      ctx.beginPath();
      ctx.arc(0, 0, h, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-h * 0.5, -h * 0.55);
      ctx.lineTo(h * 0.05, -h * 0.05);
      ctx.lineTo(-h * 0.2, h * 0.1);
      ctx.lineTo(h * 0.45, h * 0.6);
      ctx.stroke();
      break;
    }
    case "child": {
      dot(-h * 0.3, -h * 0.35, h * 0.32);
      ctx.beginPath();
      ctx.moveTo(-h * 0.9, h * 0.75);
      ctx.quadraticCurveTo(-h * 0.3, -h * 0.1, h * 0.3, h * 0.75);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(h * 0.3, h * 0.2);
      ctx.quadraticCurveTo(h * 0.9, -h * 0.2, h * 0.8, -h * 0.9);
      ctx.quadraticCurveTo(h * 0.3, -h * 0.5, h * 0.3, h * 0.2);
      ctx.fill();
      break;
    }
    case "sports": {
      dot(h * 0.15, -h * 0.75, h * 0.22);
      ctx.beginPath();
      ctx.moveTo(-h * 0.1, -h * 0.4);
      ctx.lineTo(-h * 0.2, h * 0.15);
      ctx.lineTo(h * 0.45, h * 0.85);
      ctx.moveTo(-h * 0.2, h * 0.15);
      ctx.lineTo(-h * 0.8, h * 0.55);
      ctx.moveTo(-h * 0.7, -h * 0.25);
      ctx.lineTo(-h * 0.1, -h * 0.4);
      ctx.lineTo(h * 0.6, -h * 0.05);
      ctx.stroke();
      break;
    }
    case "close-up": {
      // Tulip: three petals on a stem.
      for (const dx of [-0.42, 0, 0.42]) {
        ctx.beginPath();
        ctx.ellipse(dx * h, -h * 0.35, h * 0.28, h * 0.5, dx * 0.9, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, h * 0.95);
      ctx.moveTo(0, h * 0.6);
      ctx.quadraticCurveTo(h * 0.5, h * 0.2, h * 0.75, h * 0.35);
      ctx.stroke();
      break;
    }
    case "night-portrait": {
      ctx.lineWidth = s * 0.08;
      ctx.strokeRect(-h, -h, s, s);
      dot(-h * 0.2, -h * 0.35, h * 0.28);
      ctx.beginPath();
      ctx.moveTo(-h * 0.8, h * 0.85);
      ctx.quadraticCurveTo(-h * 0.2, -h * 0.1, h * 0.4, h * 0.85);
      ctx.fill();
      // Star.
      ctx.beginPath();
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * Math.PI * 2 - Math.PI / 2;
        const r = k % 2 === 0 ? h * 0.32 : h * 0.13;
        ctx.lineTo(h * 0.55 + Math.cos(a) * r, -h * 0.55 + Math.sin(a) * r);
      }
      ctx.fill();
      break;
    }
  }
}

/**
 * Inscriptions running around the front ring of the lens, each centred on an
 * angle (0 at the top, clockwise), letters standing outwards as on the real lens.
 */
export function ringText(segments: readonly { text: string; at: number }[], size = 1024): Texture {
  const [c, ctx] = canvas(size, size);
  const mid = size / 2;
  ctx.fillStyle = "#0b0c0e";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#e4e2dc";
  ctx.font = `500 ${size * 0.036}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const radius = mid * 0.86;
  for (const { text, at } of segments) {
    // Advance by each glyph's own width, so the spacing reads naturally.
    const widths = [...text].map((ch) => ctx.measureText(ch).width / radius);
    const total = widths.reduce((a, b) => a + b, 0);
    let a = at - total / 2;
    [...text].forEach((ch, i) => {
      const angle = a + widths[i] / 2;
      ctx.save();
      ctx.translate(mid + Math.sin(angle) * radius, mid - Math.cos(angle) * radius);
      ctx.rotate(angle);
      ctx.fillText(ch, 0, 0);
      ctx.restore();
      a += widths[i];
    });
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Focal length scale printed on the zoom ring, wrapped around a cylinder. */
export function focalScale(focals: readonly number[]): Texture {
  const [c, ctx] = canvas(2048, 128);
  ctx.fillStyle = "#16171a";
  ctx.fillRect(0, 0, 2048, 128);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "700 54px system-ui, sans-serif";
  focals.forEach((f, i) => {
    ctx.fillStyle = i === 0 ? "#ffffff" : "#e8e6df";
    ctx.fillText(String(f), 1024 + (i - (focals.length - 1) / 2) * 130, 64);
  });
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/**
 * The D3500 information display (shooting info in P, A, S or M), after the
 * reference manual: shutter speed dial, aperture diaphragm and ISO dial, then
 * the two rows of settings. Drawn at 1280 x 960 (the 4:3 monitor).
 */
export function infoScreen({ shutter, aperture, iso, mode }: { shutter: string; aperture: string; iso: string; mode: string }): Texture {
  const W = 1280;
  const H = 960;
  const [c, ctx] = canvas(W, H);
  const font = (weight: number, size: number) => `${weight} ${size}px "Arial Narrow", "Roboto Condensed", system-ui, sans-serif`;
  /** Condensed text, like the camera's own typeface. */
  const text = (s: string, x: number, y: number, size: number, color: string, { weight = 600, align = "center" as CanvasTextAlign, squeeze = 0.82 } = {}) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(squeeze, 1);
    ctx.font = font(weight, size);
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.fillText(s, 0, 0);
    ctx.restore();
  };
  const radial = (x: number, y: number, r0: number, r1: number, stops: [number, string][]) => {
    const g = ctx.createRadialGradient(x, y, r0, x, y, r1);
    for (const [o, col] of stops) g.addColorStop(o, col);
    return g;
  };
  /** Numbers set around a dial; angles in radians, 0 at the top, clockwise. */
  const ringLabels = (cx: number, cy: number, r: number, labels: readonly string[], from: number, to: number, color: string, size: number) => {
    labels.forEach((label, i) => {
      const a = from + ((to - from) * i) / Math.max(labels.length - 1, 1);
      ctx.save();
      ctx.translate(cx + Math.sin(a) * r, cy - Math.cos(a) * r);
      // Keep the lower half readable: flip the letters there.
      const lower = Math.cos(a) < 0;
      ctx.rotate(lower ? a + Math.PI : a);
      ctx.font = font(700, size);
      ctx.fillStyle = color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, 0, 0);
      ctx.restore();
    });
  };
  const triangle = (x: number, y: number, s: number, color: string, down = true) => {
    ctx.beginPath();
    ctx.moveTo(x - s, y - (down ? s * 0.6 : -s * 0.6));
    ctx.lineTo(x + s, y - (down ? s * 0.6 : -s * 0.6));
    ctx.lineTo(x, y + (down ? s * 0.8 : -s * 0.8));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  };

  // Background: charcoal, with a darker status bar.
  ctx.fillStyle = "#1e1f20";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#151617";
  ctx.fillRect(0, 0, W, 88);
  ctx.fillStyle = "#5a5a5a";
  ctx.fillRect(400, 86, 880, 3);

  // Status bar: mode, release mode, VR, single servo, beep, battery.
  ctx.font = font(800, 120);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(mode, 28, 60);
  ctx.strokeStyle = "#e6e6e6";
  ctx.lineWidth = 5;
  ctx.strokeRect(432, 24, 58, 44);
  text("N", 518, 46, 56, "#e6e6e6", { weight: 800 });
  // Vibration reduction: a hand between brackets.
  ctx.beginPath();
  ctx.arc(728, 46, 34, Math.PI * 0.62, Math.PI * 1.38);
  ctx.moveTo(728 + 34 * Math.cos(-Math.PI * 0.38), 46 + 34 * Math.sin(-Math.PI * 0.38));
  ctx.arc(728, 46, 34, -Math.PI * 0.38, Math.PI * 0.38);
  ctx.stroke();
  ctx.fillStyle = "#e6e6e6";
  ctx.beginPath();
  ctx.roundRect(712, 40, 32, 30, 8);
  ctx.fill();
  [714, 722, 730, 738].forEach((fx) => ctx.fillRect(fx, 20, 6, 24));
  ctx.strokeRect(926, 16, 62, 54);
  text("S", 957, 44, 50, "#e6e6e6", { weight: 800, squeeze: 1 });
  text("♪", 1076, 44, 70, "#e6e6e6", { weight: 700, squeeze: 1 });
  ctx.strokeRect(1144, 20, 108, 50);
  ctx.fillRect(1132, 34, 12, 22);
  [1154, 1186, 1218].forEach((bx) => ctx.fillRect(bx, 28, 26, 34));

  // Shutter speed dial: scalloped edge, scale on the rim, light face.
  const sx = 225;
  const sy = 295;
  ctx.beginPath();
  for (let k = 0; k <= 96; k++) {
    const a = (k / 96) * Math.PI * 2;
    const r = k % 2 === 0 ? 174 : 168;
    ctx.lineTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r);
  }
  ctx.fillStyle = "#d9d9d9";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(sx, sy, 164, 0, Math.PI * 2);
  ctx.fillStyle = "#a9a9a9";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(sx, sy, 164, -Math.PI * 0.04, Math.PI * 0.98);
  ctx.arc(sx, sy, 0, 0, 0);
  ctx.closePath();
  ctx.fillStyle = "#151515";
  ctx.fill();
  // Faster speeds fade out over the top; the usable ones run along the black band, from left to right.
  ringLabels(sx, sy, 146, ["4000", "2000"], -Math.PI * 0.42, -Math.PI * 0.3, "#5c5c5c", 26);
  ringLabels(sx, sy, 146, ["T", "B", "30", "8", "15", "4", "2"], -Math.PI * 0.14, Math.PI * 0.38, "#7a7a7a", 26);
  ringLabels(sx, sy, 146, ["1000", "500", "250", "125", "60", "30", "15", "8", "4", "2"], Math.PI * 1.46, Math.PI * 0.52, "#f2f2f2", 30);
  ctx.beginPath();
  ctx.arc(sx, sy, 128, 0, Math.PI * 2);
  ctx.fillStyle = radial(sx, sy - 40, 10, 140, [
    [0, "#ffffff"],
    [0.7, "#e9e9e9"],
    [1, "#bdbdbd"],
  ]);
  ctx.fill();
  ctx.fillStyle = "rgba(0,0,0,0.08)";
  ctx.fillRect(sx - 128, sy + 40, 256, 90);
  const [num, den] = shutter.includes("/") ? shutter.split("/") : ["", shutter];
  if (num) text(`${num}/`, sx - 70, sy - 8, 54, "#1a1a1a", { weight: 600, squeeze: 0.9 });
  text(den, sx + 18, sy + 2, 104, "#111111", { weight: 600, squeeze: 0.86 });
  triangle(sx, sy + 82, 16, "#8c8c8c");
  triangle(sx + 82, sy + 90, 12, "#8c8c8c");

  // Aperture: a metal ring around a diaphragm, wide open with light through it.
  const ax = 640;
  const ay = 292;
  ctx.beginPath();
  ctx.arc(ax, ay, 170, 0, Math.PI * 2);
  ctx.fillStyle = radial(ax, ay - 60, 40, 200, [
    [0, "#9a9a9a"],
    [1, "#3e3e3e"],
  ]);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(ax, ay, 150, 0, Math.PI * 2);
  ctx.fillStyle = radial(ax, ay, 60, 150, [
    [0, "#8a8a8a"],
    [1, "#5b5b5b"],
  ]);
  ctx.fill();
  ctx.strokeStyle = "rgba(230,230,230,0.55)";
  ctx.lineWidth = 3;
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(ax + Math.cos(a) * 148, ay + Math.sin(a) * 148);
    ctx.quadraticCurveTo(ax + Math.cos(a + 0.9) * 120, ay + Math.sin(a + 0.9) * 120, ax + Math.cos(a + 1.6) * 74, ay + Math.sin(a + 1.6) * 74);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(ax, ay, 112, 0, Math.PI * 2);
  ctx.fillStyle = radial(ax, ay, 40, 112, [
    [0, "rgba(255,255,255,1)"],
    [0.6, "rgba(255,255,255,0.95)"],
    [1, "rgba(255,255,255,0)"],
  ]);
  ctx.fill();
  text("F", ax - 68, ay + 12, 50, "#1a1a1a", { weight: 600, squeeze: 1 });
  text(aperture, ax + 22, ay + 4, 104, "#111111", { weight: 600, squeeze: 0.86 });

  // ISO dial: silver rim with the scale, dark face.
  const ix = 1058;
  const iy = 292;
  ctx.beginPath();
  ctx.arc(ix, iy, 172, 0, Math.PI * 2);
  ctx.fillStyle = radial(ix - 40, iy - 60, 30, 200, [
    [0, "#f4f4f4"],
    [1, "#a8a8a8"],
  ]);
  ctx.fill();
  ringLabels(ix, iy, 150, ["100", "200", "400", "800", "1600", "3200", "6400", "12800", "25600"], Math.PI * 1.05, Math.PI * 2.32, "#2b2b2b", 30);
  ctx.beginPath();
  ctx.arc(ix, iy, 128, 0, Math.PI * 2);
  ctx.fillStyle = radial(ix, iy - 50, 10, 140, [
    [0, "#4a4a4a"],
    [1, "#0d0d0d"],
  ]);
  ctx.fill();
  text("ISO-A", ix, iy - 70, 50, "#f2f2f2", { weight: 600 });
  text(iso, ix, iy + 8, 104, "#ffffff", { weight: 600, squeeze: 0.86 });
  triangle(ix, iy + 82, 16, "#ffffff");
  triangle(ix + 108, iy - 62, 12, "#8c8c8c", false);

  // Autofocus area mode and remaining shots.
  text("AUTO", 130, 506, 44, "#ffffff", { weight: 800 });
  ctx.fillStyle = "#3a3b3d";
  ctx.beginPath();
  ctx.roundRect(26, 526, 212, 104, 12);
  ctx.fill();
  ctx.fillStyle = "#bdbdbd";
  const afRows: [number, number][] = [
    [547, 3],
    [578, 5],
    [609, 3],
  ];
  for (const [y, n] of afRows)
    for (let k = 0; k < n; k++) ctx.fillRect(132 + (k - (n - 1) / 2) * 32 - 10, y - 10, 20, 20);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(1000, 524);
  ctx.lineTo(980, 524);
  ctx.lineTo(980, 604);
  ctx.lineTo(1000, 604);
  ctx.moveTo(1196, 524);
  ctx.lineTo(1216, 524);
  ctx.lineTo(1216, 604);
  ctx.lineTo(1196, 604);
  ctx.stroke();
  text("1.8", 1130, 566, 104, "#ffffff", { weight: 500, squeeze: 0.9 });
  text("k", 1242, 584, 46, "#ffffff", { weight: 500, squeeze: 1 });

  // Settings rows: header, then two rows of values.
  ctx.fillStyle = "#3c3d3f";
  ctx.fillRect(6, 646, W - 12, 36);
  ctx.fillStyle = "#2a2b2d";
  ctx.fillRect(6, 682, W - 12, 76);
  ctx.fillRect(6, 772, W - 12, 78);
  const header: [string, number][] = [
    ["QUAL", 218],
    ["WB", 533],
    ["ADL", 745],
    ["FLASH", 958],
    ["ISO", 1167],
  ];
  for (const [label, x] of header) text(label, x, 664, 30, "#a3a3a3", { weight: 700, squeeze: 0.95 });
  const light = "#d2d2d2";
  text("NORM", 112, 718, 70, light);
  text("AUTO", 533, 718, 70, light);
  text("ON", 772, 718, 70, light);
  text("100", 1172, 718, 70, light);
  text("AF-A", 112, 812, 70, light);
  text("SD", 772, 812, 70, light);
  text("0.0", 1002, 812, 70, light);
  text("0.0", 1210, 812, 70, light);
  // Small pictograms, drawn as outlined boxes like the camera's icons.
  ctx.strokeStyle = light;
  ctx.lineWidth = 5;
  const box = (x: number, y: number, w: number, h: number) => ctx.strokeRect(x - w / 2, y - h / 2, w, h);
  box(320, 718, 60, 44);
  text("L", 322, 718, 34, light, { weight: 800, squeeze: 1 });
  box(700, 718, 44, 40);
  box(320, 812, 74, 44);
  box(533, 812, 80, 46);
  ctx.beginPath();
  ctx.arc(533, 812, 12, 0, Math.PI * 2);
  ctx.stroke();
  box(708, 812, 56, 44);
  box(906, 812, 44, 36);
  box(1110, 812, 44, 36);
  // Flash bolt.
  ctx.fillStyle = "#8f8f8f";
  ctx.beginPath();
  ctx.moveTo(966, 690);
  ctx.lineTo(946, 724);
  ctx.lineTo(962, 724);
  ctx.lineTo(950, 752);
  ctx.lineTo(978, 712);
  ctx.lineTo(962, 712);
  ctx.closePath();
  ctx.fill();

  // Help and i buttons hints.
  ctx.beginPath();
  ctx.arc(56, 910, 38, 0, Math.PI * 2);
  ctx.fillStyle = "#b9b9b9";
  ctx.fill();
  text("?", 56, 912, 56, "#1a1a1a", { weight: 800, squeeze: 1 });
  ctx.beginPath();
  ctx.roundRect(1126, 876, 80, 68, 10);
  ctx.fillStyle = "#d4d4d4";
  ctx.fill();
  ctx.save();
  ctx.font = `italic 800 56px Georgia, serif`;
  ctx.fillStyle = "#1a1a1a";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("i", 1166, 912);
  ctx.restore();

  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Raised rectangular blocks, as on the rubber zoom ring of the kit lens. */
export function blockGridNormal(columns: number, rows: number): Texture {
  const [c, ctx] = canvas(64, 64);
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(0, 0, 64, 64);
  const g = ctx.createLinearGradient(0, 8, 0, 56);
  g.addColorStop(0, "#c8c8c8");
  g.addColorStop(0.5, "#ffffff");
  g.addColorStop(1, "#c8c8c8");
  ctx.fillStyle = g;
  ctx.fillRect(10, 8, 44, 48);
  return tiled(heightToNormal(c, 5), columns, rows);
}

/** Band printed around the lens barrel: gold format marks and white lettering. */
export function lensBand(white: string, gold: string): Texture {
  const [c, ctx] = canvas(2048, 96);
  ctx.fillStyle = "#121315";
  ctx.fillRect(0, 0, 2048, 96);
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.font = "800 46px system-ui, sans-serif";
  ctx.fillStyle = "#c9a24a";
  ctx.fillText(gold, 120, 50);
  ctx.font = "600 38px system-ui, sans-serif";
  ctx.fillStyle = "#e9e7e1";
  ctx.fillText(white, 120 + ctx.measureText(gold).width * 1.3 + 40, 50);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Engraved label for a button top or the body front: light text on a transparent background. */
export function engraving(text: string, { width = 256, height = 128, size = 64, color = "#e6e4de", weight = 700, style = "normal", boxed = false } = {}): Texture {
  const [c, ctx] = canvas(width, height);
  ctx.clearRect(0, 0, width, height);
  if (boxed) {
    // Printed frame around the text, as on the Lv switch.
    ctx.strokeStyle = color;
    ctx.lineWidth = height * 0.06;
    ctx.beginPath();
    ctx.roundRect(width * 0.16, height * 0.12, width * 0.68, height * 0.76, height * 0.1);
    ctx.stroke();
  }
  ctx.fillStyle = color;
  ctx.font = `${style} ${weight} ${size}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, width / 2, height / 2 + 2);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
