import './style.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import content from '../content/content.en.json';
import { SceneManager } from './scene/SceneManager.js';
import { NeuralField } from './scene/NeuralField.js';
import { buildSections } from './sections.js';

gsap.registerPlugin(ScrollTrigger);

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const small = window.matchMedia('(max-width: 700px)').matches;

// --- Content -> DOM (decoupled; edit content.en.json, not the code) ---
buildSections(content, document.getElementById('content'));

// --- WebGL stage + persistent point field ---
const stage = new SceneManager(document.getElementById('webgl'), { reducedMotion: reduced });
const field = new NeuralField(content.graph, { count: small ? 1000 : 1900, reducedMotion: reduced });
stage.add(field);

const SHAPE = { DISPERSED: 0, NEURAL: 1, GT: 2, BUILD: 3 };
const smooth = (e0, e1, x) => {
  const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1);
  return t * t * (3 - 2 * t);
};

if (reduced) {
  // Accessible static path: skip the scroll journey, show the GT hero directly.
  field.introFactor = 1;
  field.labelStrength = 0.3;
  field.setSegment(SHAPE.GT, SHAPE.GT, 0);
  const intro = document.getElementById('intro');
  if (intro) intro.style.display = 'none';
  gsap.set(['.topbar', '#hero [data-hero]', '.scrollcue'], { opacity: 1, y: 0 });
} else {
  // Field fades in from black while it sits dispersed.
  field.introFactor = 0;
  gsap.to(field, { introFactor: 1, duration: 1.6, ease: 'power2.out' });

  // Chrome stays hidden over the textless dispersed opening.
  gsap.set(['.topbar', '#hero [data-hero]'], { opacity: 0, y: 16 });

  // INTRO journey: dispersed -> neural network (labels explored) -> GT.
  ScrollTrigger.create({
    trigger: '#intro',
    start: 'top top',
    end: 'bottom bottom',
    scrub: 1,
    onUpdate: (self) => {
      const p = self.progress;
      // Continuous morph, no static hold: scatter -> network -> GT.
      if (p < 0.5) field.setSegment(SHAPE.DISPERSED, SHAPE.NEURAL, p / 0.5);
      else field.setSegment(SHAPE.NEURAL, SHAPE.GT, (p - 0.5) / 0.5);
      const formed = smooth(0.22, 0.46, p); // labels strongest as the network finishes forming
      const toGT = smooth(0.6, 0.92, p); // and recede as GT takes over
      field.labelStrength = formed * (1 - 0.7 * toGT);
    },
    onLeave: () => gsap.to(field, { labelStrength: 0.3, duration: 0.6 }), // secondary from the hero on
    onEnterBack: () => gsap.killTweensOf(field, 'labelStrength'),
  });

  // Hero chrome resolves in as GT forms.
  gsap.to('.topbar', { opacity: 1, y: 0, duration: 1, scrollTrigger: { trigger: '#hero', start: 'top 80%' } });
  gsap.to('#hero [data-hero]', { opacity: 1, y: 0, duration: 1, stagger: 0.12, ease: 'power3.out', scrollTrigger: { trigger: '#hero', start: 'top 78%' } });

  // Contact payoff: GT -> "LET'S BUILD".
  ScrollTrigger.create({
    trigger: '#contact',
    start: 'top 70%',
    end: 'bottom bottom',
    scrub: 1,
    onUpdate: (self) => field.setSegment(SHAPE.GT, SHAPE.BUILD, self.progress),
  });

  // Section reveals (hero + intro handled separately).
  gsap.utils.toArray('.panel:not(.panel--hero):not(.panel--intro) [data-reveal]').forEach((el) => {
    gsap.from(el, { y: 32, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 86%' } });
  });

  // Pinned "Selected work": exactly ONE gesture (a scroll notch or an arrow key) = one card.
  // The section pins; while active we intercept wheel/keys and step discretely, releasing at the ends.
  if (!small) {
    const stageEl = document.querySelector('.proj-stage');
    const cards = gsap.utils.toArray('.proj-stage .proj');
    if (stageEl && cards.length > 1) {
      stageEl.classList.add('proj-stage--pinned');
      const n = cards.length;
      let idx = 0;
      let active = false;
      let lock = false;

      function syncCards() {
        cards.forEach((c, i) => gsap.set(c, { autoAlpha: i === idx ? 1 : 0, y: 0 }));
      }
      function go(next) {
        if (next < 0 || next > n - 1 || next === idx) return;
        const dir = next > idx ? 1 : -1;
        gsap.to(cards[idx], { autoAlpha: 0, y: -30 * dir, duration: 0.3, ease: 'power2.out' });
        gsap.fromTo(cards[next], { autoAlpha: 0, y: 30 * dir }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power2.out' });
        idx = next;
      }
      syncCards();

      const st = ScrollTrigger.create({
        trigger: '#projects',
        start: 'top top',
        end: () => `+=${window.innerHeight}`,
        pin: true,
        anticipatePin: 1,
        onToggle: (self) => {
          active = self.isActive;
          if (active) {
            idx = self.direction === 1 ? 0 : n - 1;
            syncCards();
          }
        },
      });

      const exit = (down) => {
        active = false;
        window.scrollTo({ top: down ? st.end + 2 : Math.max(0, st.start - 2), behavior: 'auto' });
      };
      const tryStep = (down) => {
        if (down && idx < n - 1) { go(idx + 1); return true; }
        if (!down && idx > 0) { go(idx - 1); return true; }
        return false; // at a boundary -> release the pin
      };

      window.addEventListener(
        'wheel',
        (e) => {
          if (!active) return;
          e.preventDefault();
          if (lock) return;
          lock = true;
          setTimeout(() => (lock = false), 650);
          if (!tryStep(e.deltaY > 0)) exit(e.deltaY > 0);
        },
        { passive: false }
      );

      window.addEventListener('keydown', (e) => {
        if (!active) return;
        const down = e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ';
        const up = e.key === 'ArrowUp' || e.key === 'PageUp';
        if (!down && !up) return;
        e.preventDefault();
        if (lock) return;
        lock = true;
        setTimeout(() => (lock = false), 300);
        if (!tryStep(down)) exit(down);
      });
    }
  }

  // Hide the scroll cue once the journey begins.
  ScrollTrigger.create({
    start: 'top -8%',
    end: 'max',
    onToggle: (self) => gsap.to('.scrollcue', { opacity: self.isActive ? 0 : 1, duration: 0.4 }),
  });
}

// --- Loop: back to the start ---
document.querySelector('.contact__top')?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
});

// --- Custom cursor (dot tracks, ring trails) ---
const dot = document.getElementById('cursor');
const ring = document.getElementById('cursor-ring');
if (window.matchMedia('(hover: hover)').matches && dot && ring) {
  let rx = 0, ry = 0, mx = 0, my = 0;
  window.addEventListener('pointermove', (e) => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.transform = `translate(${mx - 3.5}px, ${my - 3.5}px)`;
  });
  const loop = () => {
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    ring.style.transform = `translate(${rx - 17}px, ${ry - 17}px)`;
    requestAnimationFrame(loop);
  };
  loop();
  document.addEventListener('pointerover', (e) => {
    if (e.target.closest('a, button')) ring.classList.add('is-hover');
  });
  document.addEventListener('pointerout', (e) => {
    if (e.target.closest('a, button')) ring.classList.remove('is-hover');
  });
}
