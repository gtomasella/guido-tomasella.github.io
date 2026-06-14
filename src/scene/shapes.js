import * as THREE from 'three';

/**
 * Target-shape generators. Every generator returns a Float32Array of length count*3
 * so the point field can morph between any two shapes by linear interpolation.
 * Shapes are centred on the origin and scaled to roughly fit a ~6 unit width.
 */

// Wide, sparse cloud — the "scattered data" opening state (no structure).
export function dispersedCloud(count, radius = 7) {
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = radius * Math.cbrt(Math.random());
    const t = Math.random() * Math.PI * 2;
    const p = Math.acos(2 * Math.random() - 1);
    out[i * 3] = r * Math.sin(p) * Math.cos(t);
    out[i * 3 + 1] = r * Math.sin(p) * Math.sin(t);
    out[i * 3 + 2] = r * Math.cos(p);
  }
  return out;
}

// Even-ish sphere — the organised "neural network" state (edges + labels read here).
export function fibonacciSphere(count, radius = 3) {
  const out = new Float32Array(count * 3);
  const GA = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const rr = Math.sqrt(Math.max(0, 1 - y * y));
    const th = i * GA;
    const r = radius * (0.82 + Math.random() * 0.18);
    out[i * 3] = Math.cos(th) * rr * r;
    out[i * 3 + 1] = y * r;
    out[i * 3 + 2] = Math.sin(th) * rr * r;
  }
  return out;
}

// Sample `count` positions from the opaque pixels of rendered text (forms an image).
export function sampleText(text, count, opts = {}) {
  const fontSize = opts.fontSize || 240;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const font = `900 ${fontSize}px Arial, sans-serif`;
  ctx.font = font;
  const w = Math.ceil(ctx.measureText(text).width) + 60;
  const h = Math.ceil(fontSize * 1.3);
  canvas.width = w;
  canvas.height = h;
  ctx.fillStyle = '#fff';
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, h / 2);

  const data = ctx.getImageData(0, 0, w, h).data;
  const filled = [];
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      if (data[(y * w + x) * 4 + 3] > 128) filled.push([x, y]);
    }
  }
  const out = new Float32Array(count * 3);
  const scale = 6.4 / w;
  for (let i = 0; i < count; i++) {
    const pick = filled.length ? filled[Math.floor(Math.random() * filled.length)] : [w / 2, h / 2];
    out[i * 3] = (pick[0] - w / 2) * scale;
    out[i * 3 + 1] = -(pick[1] - h / 2) * scale;
    out[i * 3 + 2] = (Math.random() - 0.5) * 0.6;
  }
  return out;
}
