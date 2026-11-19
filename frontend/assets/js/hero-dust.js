// Landing intro: a one-off puff of chilli powder from the pack's bowl as it lands.
// Decorative only. Runs about 4 seconds, then stops and clears; skipped for reduced motion.

const COLOURS = ['#C8141C', '#E2391F', '#E8742A', '#F1C76A', '#F6A23A', '#9E0F15'];

export function playDust(canvas, pouch, { delay = 1100, count = 170, clouds = 26 } = {}) {
  if (!canvas || !pouch || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let raf = 0;
  let parts = [];
  let start = 0;
  let w = 0;
  let h = 0;
  let last = 0;

  function size() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = r.width; h = r.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function burst() {
    const c = canvas.getBoundingClientRect();
    const p = pouch.getBoundingClientRect();
    if (!p.width) return false;
    // The bowl of chilli powder sits in the lower-left part of the pack art.
    const ox = p.left - c.left + p.width * 0.42;
    const oy = p.top - c.top + p.height * 0.6;
    const unit = Math.max(0.6, Math.min(1.4, p.height / 700));
    const make = (cloud) => {
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * (cloud ? 0.8 : 1.05);
      const sp = (cloud ? 2 + Math.random() * 4 : 4 + Math.random() * 12) * unit;
      return {
        cloud,
        peak: cloud ? 0.16 + Math.random() * 0.1 : 1,
        x: ox + (Math.random() - 0.5) * p.width * 0.3,
        y: oy + (Math.random() - 0.5) * 20,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        r: (cloud ? 14 + Math.random() * 26 : 1.2 + Math.random() * 3.4) * unit,
        life: 1600 + Math.random() * 2000,
        born: performance.now() + Math.random() * 260,
        c: cloud ? COLOURS[(Math.random() * 3) | 0] : COLOURS[(Math.random() * COLOURS.length) | 0],
      };
    };
    parts = [
      ...Array.from({ length: clouds }, () => make(true)),
      ...Array.from({ length: count }, () => make(false)),
    ];
    return true;
  }

  function frame(now) {
    // Step by elapsed time (in 60fps frames) so speed is the same on 60Hz and 120Hz screens.
    const k = Math.min(4, (now - (last || now - 16.7)) / 16.7);
    last = now;
    ctx.clearRect(0, 0, w, h);
    let alive = 0;
    for (const q of parts) {
      const age = now - q.born;
      if (age < 0) { alive++; continue; }
      if (age > q.life) continue;
      alive++;
      const drag = 0.975 ** k;
      q.vx *= drag;
      q.vy = q.vy * drag + 0.02 * k; // drag, then a slow settle like fine powder
      q.x += q.vx * k;
      q.y += q.vy * k;
      const t = age / q.life;
      if (q.cloud) q.r *= 1.006 ** k; // the puff spreads as it fades
      ctx.globalAlpha = q.peak * (t < 0.1 ? t / 0.1 : (1 - t) ** 1.6);
      ctx.fillStyle = q.c;
      ctx.beginPath();
      ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (alive && now - start < 5000 && scrollY < innerHeight * 0.5) raf = requestAnimationFrame(frame);
    else stop();
  }

  function stop() {
    cancelAnimationFrame(raf);
    ctx.clearRect(0, 0, w, h);
    removeEventListener('resize', size);
  }

  setTimeout(() => {
    if (getComputedStyle(canvas).display === 'none' || scrollY > innerHeight * 0.5) return;
    size();
    if (!burst()) return;
    addEventListener('resize', size);
    start = performance.now();
    raf = requestAnimationFrame(frame);
  }, delay);
}
