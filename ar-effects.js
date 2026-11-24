(function () {
  const W = (window.AREffects = window.AREffects || { particles: true, cursor: true });
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const LINK = 130, REACT = 150;

  if (!customElements.get('particle-bg')) {
    class ParticleBg extends HTMLElement {
      connectedCallback() {
        this.style.cssText = 'display:block;position:absolute;inset:0;pointer-events:none;overflow:hidden';
        const c = (this.canvas = document.createElement('canvas'));
        c.setAttribute('aria-hidden', 'true');
        c.style.cssText = 'display:block;width:100%;height:100%';
        this.appendChild(c);
        const ctx = c.getContext('2d');
        let w = 0, h = 0, dots = [], t = 0, frame, inView = true;
        const mouse = { x: -9999, y: -9999 };
        const build = () => {
          const n = Math.min(70, Math.max(28, Math.round((w * h) / 16000)));
          dots = Array.from({ length: n }, () => {
            const x = Math.random() * w, y = Math.random() * h;
            return { x, y, bx: x, by: y, r: Math.random() * 1.4 + 0.6, ph: Math.random() * 6.28, sp: Math.random() * 0.25 + 0.08 };
          });
        };
        const resize = () => {
          const r = c.getBoundingClientRect();
          if (!r.width || !r.height) return;
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          w = r.width; h = r.height;
          c.width = w * dpr; c.height = h * dpr;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          build();
        };
        const draw = () => {
          ctx.clearRect(0, 0, w, h);
          c.style.opacity = W.particles ? '1' : '0';
          if (!reduce) t++;
          for (const d of dots) {
            d.x = d.bx + (reduce ? 0 : Math.sin(t * 0.004 * d.sp + d.ph) * 10);
            d.y = d.by + (reduce ? 0 : Math.cos(t * 0.003 * d.sp + d.ph) * 10);
            const dx = d.x - mouse.x, dy = d.y - mouse.y, dist = Math.hypot(dx, dy);
            if (dist < REACT) { const p = (1 - dist / REACT) * 18, a = Math.atan2(dy, dx); d.x += Math.cos(a) * p; d.y += Math.sin(a) * p; }
          }
          ctx.lineWidth = 1;
          for (let i = 0; i < dots.length; i++) for (let j = i + 1; j < dots.length; j++) {
            const a = dots[i], b = dots[j], dist = Math.hypot(a.x - b.x, a.y - b.y);
            if (dist < LINK) { ctx.strokeStyle = `rgba(200,169,110,${(1 - dist / LINK) * 0.12})`; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
          }
          for (const d of dots) {
            const dist = Math.hypot(d.x - mouse.x, d.y - mouse.y), near = dist < REACT ? 1 - dist / REACT : 0;
            ctx.beginPath(); ctx.arc(d.x, d.y, d.r + near * 1.2, 0, 6.283);
            ctx.fillStyle = `rgba(200,169,110,${0.22 + near * 0.5})`; ctx.fill();
          }
        };
        const loop = () => { if (inView && !document.hidden && !window.__arPaused) draw(); frame = requestAnimationFrame(loop); };
        const setPt = (x0, y0) => {
          const r = c.getBoundingClientRect(), x = x0 - r.left, y = y0 - r.top;
          if (x < 0 || y < 0 || x > r.width || y > r.height) { mouse.x = mouse.y = -9999; } else { mouse.x = x; mouse.y = y; }
          if (reduce) draw();
        };
        this._mv = (e) => setPt(e.clientX, e.clientY);
        this._tc = (e) => e.touches[0] && setPt(e.touches[0].clientX, e.touches[0].clientY);
        this._te = () => { mouse.x = mouse.y = -9999; if (reduce) draw(); };
        this._rs = () => { resize(); if (reduce) draw(); };
        window.addEventListener('mousemove', this._mv);
        window.addEventListener('touchstart', this._tc, { passive: true });
        window.addEventListener('touchmove', this._tc, { passive: true });
        window.addEventListener('touchend', this._te);
        window.addEventListener('resize', this._rs);
        this._io = new IntersectionObserver(([e]) => (inView = e.isIntersecting));
        this._io.observe(c);
        this._ro = new ResizeObserver(() => this._rs());
        this._ro.observe(c);
        resize();
        if (reduce) draw(); else frame = requestAnimationFrame(loop);
        this._stop = () => cancelAnimationFrame(frame);
      }
      disconnectedCallback() {
        this._stop && this._stop();
        this._io && this._io.disconnect();
        this._ro && this._ro.disconnect();
        window.removeEventListener('mousemove', this._mv);
        window.removeEventListener('touchstart', this._tc);
        window.removeEventListener('touchmove', this._tc);
        window.removeEventListener('touchend', this._te);
        window.removeEventListener('resize', this._rs);
        this.innerHTML = '';
      }
    }
    customElements.define('particle-bg', ParticleBg);
  }

  if (!W._cursorInit) {
    W._cursorInit = true;
    const mq = window.matchMedia('(min-width: 1024px) and (hover: hover)');
    const dot = document.createElement('div');
    const base = 'position:fixed;top:0;left:0;border-radius:50%;pointer-events:none;z-index:99999;transform:translate(-50%,-50%);transition:width .45s cubic-bezier(.22,1,.36,1),height .45s cubic-bezier(.22,1,.36,1),background .3s ease,border-color .3s ease,opacity .2s ease;mix-blend-mode:difference;';
    const st = document.createElement('style');
    st.textContent = '@media (min-width:1024px) and (hover:hover){*{cursor:none !important}[data-cursor-text],[data-cursor-text] *{cursor:pointer !important}}';
    let hov = false, txt = false;
    const paint = () => {
      dot.style.cssText = base + (hov
        ? 'width:56px;height:56px;background:transparent;border:1px solid #fff;'
        : 'width:10px;height:10px;background:#fff;border:0;') + 'opacity:' + (txt ? 0 : 1) + ';left:' + (dot._x || -100) + 'px;top:' + (dot._y || -100) + 'px;';
    };
    W.setCursor = (on) => {
      W.cursor = on;
      const active = on && mq.matches;
      if (active) { document.head.appendChild(st); document.body.appendChild(dot); paint(); }
      else { st.remove(); dot.remove(); }
    };
    window.addEventListener('mousemove', (e) => { dot._x = e.clientX; dot._y = e.clientY; dot.style.left = e.clientX + 'px'; dot.style.top = e.clientY + 'px'; });
    document.addEventListener('mouseover', (e) => {
      const el = e.target instanceof Element ? e.target : null;
      const t = !!(el && el.closest('[data-cursor-text]'));
      const h = !t && !!(el && el.closest('[data-cursor-hover],button,a,input,select,textarea'));
      if (t !== txt || h !== hov) { txt = t; hov = h; paint(); }
    });
    mq.addEventListener && mq.addEventListener('change', () => W.setCursor(W.cursor));
  }
  W.setParticles = (on) => (W.particles = on);
})();
