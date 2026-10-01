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

/** Labels drawn radially on a disc, readable from above. */
export function radialLabels({
  labels,
  size = 512,
  radius = 0.78,
  font = 46,
  background = "#24262b",
  color = "#e9e7e1",
  highlight,
}: {
  labels: readonly string[];
  size?: number;
  radius?: number;
  font?: number;
  background?: string;
  color?: string;
  highlight?: string;
}): Texture {
  const [c, ctx] = canvas(size, size);
  const mid = size / 2;
  ctx.fillStyle = background;
  ctx.beginPath();
  ctx.arc(mid, mid, mid, 0, Math.PI * 2);
  ctx.fill();
  const g = ctx.createRadialGradient(mid, mid * 0.8, 0, mid, mid, mid);
  g.addColorStop(0, "rgba(255,255,255,0.08)");
  g.addColorStop(1, "rgba(0,0,0,0.25)");
  ctx.fillStyle = g;
  ctx.fill();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  labels.forEach((label, i) => {
    const a = (i / labels.length) * Math.PI * 2;
    ctx.save();
    ctx.translate(mid + Math.sin(a) * mid * radius, mid - Math.cos(a) * mid * radius);
    ctx.rotate(a);
    ctx.fillStyle = label === highlight ? "#3ddc84" : color;
    ctx.font = `700 ${label.length > 3 ? font * 0.62 : font}px system-ui, sans-serif`;
    ctx.fillText(label, 0, 0);
    ctx.restore();
  });
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Text running around a ring, for the front of the lens. */
export function ringText(text: string, size = 1024): Texture {
  const [c, ctx] = canvas(size, size);
  const mid = size / 2;
  ctx.fillStyle = "#0e0f12";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#d9d7d0";
  ctx.font = `600 ${size * 0.034}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const chars = [...text];
  const step = (Math.PI * 1.25) / chars.length;
  chars.forEach((ch, i) => {
    const a = -Math.PI * 0.62 + i * step;
    ctx.save();
    ctx.translate(mid + Math.sin(a) * mid * 0.86, mid - Math.cos(a) * mid * 0.86);
    ctx.rotate(a);
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  });
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

/** Rear screen showing the shooting information display, with the three setting circles. */
export function infoScreen({ shutter, aperture, iso, mode }: { shutter: string; aperture: string; iso: string; mode: string }): Texture {
  const [c, ctx] = canvas(1024, 728);
  const bg = ctx.createLinearGradient(0, 0, 0, 728);
  bg.addColorStop(0, "#14233f");
  bg.addColorStop(1, "#0b1426");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1024, 728);
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 84px system-ui, sans-serif";
  ctx.fillText(mode, 48, 80);
  ctx.font = "600 34px system-ui, sans-serif";
  ctx.fillStyle = "#9fb3d9";
  ctx.fillText("AF-A   [ 1.2k ]", 640, 80);
  ctx.strokeStyle = "#e9e7e1";
  ctx.lineWidth = 4;
  ctx.strokeRect(910, 60, 70, 36);
  ctx.fillStyle = "#3ddc84";
  ctx.fillRect(916, 66, 50, 24);

  const circles = [
    { x: 220, label: "Vitesse", value: shutter },
    { x: 512, label: "Ouverture", value: aperture },
    { x: 804, label: "ISO", value: iso },
  ];
  for (const circle of circles) {
    ctx.beginPath();
    ctx.arc(circle.x, 380, 130, 0, Math.PI * 2);
    ctx.lineWidth = 10;
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(circle.x, 380, 130, -Math.PI * 0.5, Math.PI * 0.85);
    ctx.strokeStyle = "#ffb020";
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 60px system-ui, sans-serif";
    ctx.fillText(circle.value, circle.x, 380);
    ctx.fillStyle = "#9fb3d9";
    ctx.font = "600 30px system-ui, sans-serif";
    ctx.fillText(circle.label, circle.x, 560);
  }
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fillRect(48, 630, 928, 4);
  ctx.fillStyle = "#e9e7e1";
  ctx.font = "600 32px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("-2 ..1..0..1.. +2", 48, 680);
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
export function engraving(text: string, { width = 256, height = 128, size = 64, color = "#e6e4de", weight = 700 } = {}): Texture {
  const [c, ctx] = canvas(width, height);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, width / 2, height / 2 + 2);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
