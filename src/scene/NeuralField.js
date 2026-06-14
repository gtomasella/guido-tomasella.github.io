import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { dispersedCloud, fibonacciSphere, sampleText } from './shapes.js';

const VERT = /* glsl */ `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aSeed;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uMotion;
  varying vec3 vColor;
  varying float vFade;
  void main() {
    vColor = aColor;
    vec3 p = position;
    float ph = aSeed * 6.2831853;
    p.x += sin(uTime * 0.45 + ph) * 0.045 * uMotion;
    p.y += cos(uTime * 0.40 + ph * 1.3) * 0.045 * uMotion;
    p.z += sin(uTime * 0.35 + ph * 0.7) * 0.045 * uMotion;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float depth = -mv.z;
    vFade = smoothstep(15.0, 4.0, depth);
    gl_PointSize = aSize * uPixelRatio * (9.0 / depth);
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAG = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float alpha = smoothstep(0.5, 0.0, d);
    float core = smoothstep(0.5, 0.12, d);
    vec3 col = vColor * (0.5 + core);
    gl_FragColor = vec4(col, alpha * mix(0.25, 1.0, vFade) * uOpacity);
  }
`;

/**
 * The persistent point field for the whole journey.
 * Morph targets (this.shapes), in order:
 *   0 DISPERSED  — scattered opening cloud (no labels)
 *   1 NEURAL     — organised network sphere (labels are the protagonist here)
 *   2 GT         — the hero image, "GT"
 *   3 BUILD      — "LET'S BUILD" payoff
 * The first NH points are labelled concept hubs (your disciplines), connected by edges.
 * `labelStrength` (0..1) drives how prominent labels + edges are, and whether hover works.
 */
export class NeuralField {
  constructor(graphData, { count = 1900, reducedMotion = false } = {}) {
    this.object3d = new THREE.Group();
    this.count = count;
    this.nodes = graphData.nodes;
    this.NH = this.nodes.length;
    this.hovered = -1;
    this.labelStrength = 0;
    this.introFactor = 1;
    this._proj = new THREE.Vector3();
    this._build(graphData, reducedMotion);
  }

  _build(data, reducedMotion) {
    const palette = data.categories;
    const cats = ['manager', 'techlead', 'ai'];
    const N = this.count;

    this.shapes = [
      dispersedCloud(N, 7),
      fibonacciSphere(N, 3),
      sampleText('GT', N, { fontSize: 280 }),
      sampleText("LET'S BUILD", N, { fontSize: 150 }),
    ];

    const positions = new Float32Array(this.shapes[0]); // start dispersed
    const colors = new Float32Array(N * 3);
    const sizes = new Float32Array(N);
    const seeds = new Float32Array(N);
    const c = new THREE.Color();
    for (let i = 0; i < N; i++) {
      const isHub = i < this.NH;
      const cat = isHub ? this.nodes[i].cat : cats[i % 3];
      c.set(palette[cat] || '#9fb4ff');
      if (!isHub) c.multiplyScalar(0.85);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
      sizes[i] = isHub ? 22 : 6.5;
      seeds[i] = Math.random();
    }
    this.sizesBase = sizes.slice();

    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pg.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    pg.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    pg.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    this.pointGeo = pg;
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uMotion: { value: reducedMotion ? 0 : 1 },
        uOpacity: { value: 1 },
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(pg, this.material);
    this.object3d.add(this.points);

    // Edges among hubs (kNN on the NEURAL layout — that's where they're showcased).
    const neural = this.shapes[1];
    const hubPos = [];
    for (let i = 0; i < this.NH; i++) hubPos.push(new THREE.Vector3(neural[i * 3], neural[i * 3 + 1], neural[i * 3 + 2]));
    const seen = new Set();
    this.edges = [];
    for (let i = 0; i < this.NH; i++) {
      const d = [];
      for (let j = 0; j < this.NH; j++) if (j !== i) d.push([hubPos[i].distanceToSquared(hubPos[j]), j]);
      d.sort((a, b) => a[0] - b[0]);
      const k = this.nodes[i].hub ? 3 : 2;
      for (let m = 0; m < k; m++) {
        const j = d[m][1];
        const key = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (!seen.has(key)) { seen.add(key); this.edges.push([i, j]); }
      }
    }
    const E = this.edges.length;
    this.edgePos = new Float32Array(E * 2 * 3);
    const eCol = new Float32Array(E * 2 * 3);
    const ca = new THREE.Color();
    const cb = new THREE.Color();
    for (let e = 0; e < E; e++) {
      const [a, b] = this.edges[e];
      ca.set(palette[this.nodes[a].cat] || '#9fb4ff').multiplyScalar(0.5);
      cb.set(palette[this.nodes[b].cat] || '#9fb4ff').multiplyScalar(0.5);
      eCol.set([ca.r, ca.g, ca.b, cb.r, cb.g, cb.b], e * 6);
    }
    this.edgeBaseColors = eCol.slice();
    this.edgeColors = eCol;
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.BufferAttribute(this.edgePos, 3));
    lg.setAttribute('color', new THREE.BufferAttribute(eCol, 3));
    this.lineGeo = lg;
    this.lines = new THREE.LineSegments(
      lg,
      new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    this.object3d.add(this.lines);

    // CSS2D labels for the hubs.
    this.labels = [];
    for (let i = 0; i < this.NH; i++) {
      const el = document.createElement('div');
      el.className = 'kg-label' + (this.nodes[i].hub ? ' kg-label--hub' : '');
      el.textContent = this.nodes[i].label;
      const obj = new CSS2DObject(el);
      this.object3d.add(obj);
      this.labels.push({ el, obj });
    }
  }

  // Blend point positions between two named shape indices (t in 0..1).
  setSegment(a, b, t) {
    t = Math.min(Math.max(t, 0), 1);
    const A = this.shapes[a];
    const B = this.shapes[b];
    const pos = this.pointGeo.attributes.position.array;
    for (let k = 0; k < pos.length; k++) pos[k] = A[k] + (B[k] - A[k]) * t;
    this.pointGeo.attributes.position.needsUpdate = true;
  }

  onResize(mgr) {
    this.material.uniforms.uPixelRatio.value = mgr.renderer.getPixelRatio();
  }

  _applyHover() {
    const c = this.edgeColors;
    const base = this.edgeBaseColors;
    for (let e = 0; e < this.edges.length; e++) {
      const [a, b] = this.edges[e];
      const on = a === this.hovered || b === this.hovered;
      for (let k = 0; k < 2; k++) {
        const idx = (e * 2 + k) * 3;
        if (on) { c[idx] = 0.13; c[idx + 1] = 0.83; c[idx + 2] = 1.0; }
        else { c[idx] = base[idx]; c[idx + 1] = base[idx + 1]; c[idx + 2] = base[idx + 2]; }
      }
    }
    this.lineGeo.attributes.color.needsUpdate = true;
    const s = this.pointGeo.attributes.aSize.array;
    for (let i = 0; i < this.NH; i++) s[i] = i === this.hovered ? this.sizesBase[i] * 1.8 : this.sizesBase[i];
    this.pointGeo.attributes.aSize.needsUpdate = true;
    for (let i = 0; i < this.NH; i++) this.labels[i].el.classList.toggle('kg-label--hover', i === this.hovered);
  }

  update(t, dt, mgr) {
    this.material.uniforms.uTime.value = t;
    this.material.uniforms.uOpacity.value = this.introFactor;

    const pos = this.pointGeo.attributes.position.array;
    const cam = mgr.camera;
    const vis = this.labelStrength * this.introFactor;
    const canHover = this.labelStrength > 0.4;

    let best = 0.06;
    let hi = -1;
    for (let i = 0; i < this.NH; i++) {
      const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
      const lab = this.labels[i];
      lab.obj.position.set(x, y, z);
      const v = this._proj.set(x, y, z).project(cam);
      const front = THREE.MathUtils.clamp(1 - (v.z * 0.5 + 0.5), 0, 1);
      lab.el.style.opacity = (vis * (0.3 + 0.6 * front)).toFixed(3);
      if (canHover && v.z <= 1) {
        const d = Math.hypot(v.x - mgr.pointer.x, v.y - mgr.pointer.y);
        if (d < best) { best = d; hi = i; }
      }
    }
    if (!canHover) hi = -1;
    if (hi !== this.hovered) { this.hovered = hi; this._applyHover(); }

    const ep = this.edgePos;
    for (let e = 0; e < this.edges.length; e++) {
      const [a, b] = this.edges[e];
      ep.set([pos[a * 3], pos[a * 3 + 1], pos[a * 3 + 2], pos[b * 3], pos[b * 3 + 1], pos[b * 3 + 2]], e * 6);
    }
    this.lineGeo.attributes.position.needsUpdate = true;
    this.lines.material.opacity = 0.6 * vis;
    this.lines.visible = vis > 0.01;
  }
}
