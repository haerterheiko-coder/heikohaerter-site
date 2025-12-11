// /public/app.js
/* =========================================================
   HEIKO HAERTER – 2026 ULTRA MASTER APP.JS (Hardened v3)
   Neuro-Optimized · Zero-Jank · Wix-/SSR-Safe · A11y-Aware
   ========================================================= */
(() => {
  'use strict';

  /* -----------------------------
     0) CORE UTILS (why: stability)
  ----------------------------- */
  /** @template {Element} T */ const $  = (s, p = document) => /** @type {T|null} */(p.querySelector(s));
  /** @template {Element} T */ const $$ = (s, p = document) => /** @type {T[]} */([...p.querySelectorAll(s)]);
  const on  = (el, t, fn, o) => el && el.addEventListener(t, fn, o);
  const off = (el, t, fn, o) => el && el.removeEventListener(t, fn, o);
  const raf = (cb) => (window.requestAnimationFrame || setTimeout)(cb);

  const safeStore = (() => {
    try { const k = '__t'; localStorage.setItem(k,'1'); localStorage.removeItem(k);
      return {
        get(k){ try { return localStorage.getItem(k); } catch { return null; } },
        set(k,v){ try { localStorage.setItem(k,v); } catch {} },
        del(k){ try { localStorage.removeItem(k); } catch {} },
      };
    } catch {
      const mem = new Map();
      return { get:k=>mem.get(k)??null, set:(k,v)=>void mem.set(k,v), del:k=>void mem.delete(k) };
    }
  })();

  const safeCrypto = (() => {
    const g = (typeof globalThis !== 'undefined' ? globalThis : window);
    return (g.crypto && g.crypto.getRandomValues) ? g.crypto : null;
  })();

  function randId(n = 12) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    if (safeCrypto) {
      const arr = new Uint8Array(n); safeCrypto.getRandomValues(arr);
      return [...arr].map(x => chars[x % chars.length]).join('');
    }
    let o=''; for (let i=0;i<n;i++) o += chars[(Math.random()*chars.length)|0]; return o;
  }

  const hasIO = 'IntersectionObserver' in window;
  const hasClipboard = !!navigator.clipboard;
  const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = () => innerWidth < 980;

  /* =========================================================
     1) FADE-IN ENGINE (why: smooth, motion-safe)
  ========================================================= */
  const FadeIn = (() => {
    let io;
    function init() {
      const els = $$('.fade-up');
      if (prefersReducedMotion || !hasIO) { els.forEach(e=>e.classList.add('visible')); return; }
      io = new IntersectionObserver((entries) => {
        entries.forEach(ent => {
          if (ent.isIntersecting) { ent.target.classList.add('visible'); io.unobserve(ent.target); }
        });
      }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
      els.forEach(el => io.observe(el));
    }
    function destroy(){ io && io.disconnect(); io = undefined; }
    return { init, destroy };
  })();

  /* =========================================================
     2) STICKY CTA (why: unobtrusive prompt, mobile-only)
  ========================================================= */
  const StickyCTA = (() => {
    let io, onScrollRef;
    function show(el, v){ raf(()=>{ el.style.transform = v?'translateY(0)':'translateY(120%)'; el.style.opacity = v?'1':'0'; el.setAttribute('aria-hidden', String(!v)); }); }
    function init() {
      // support both ID spellings found in markup
      const el = $('#stickyCTA') || $('#stickyCta');
      const hero = $('.hero');
      if (!el || !hero || !isMobile()) return;
      if (hasIO) {
        io = new IntersectionObserver(([ent]) => show(el, !ent.isIntersecting), { threshold: 0.12 });
        io.observe(hero);
      } else {
        onScrollRef = () => show(el, scrollY > 180);
        on(window,'scroll',onScrollRef,{ passive:true }); onScrollRef();
      }
    }
    function destroy(){ io && io.disconnect(); io = undefined; onScrollRef && off(window,'scroll',onScrollRef,{ passive:true }); onScrollRef = undefined; }
    return { init, destroy };
  })();

  /* =========================================================
     3) SHORT MODE (why: ADHS/cognitive-load friendly view)
  ========================================================= */
  const ShortMode = (() => {
    const KEY = 'hh_short_mode_v1';
    function init() {
      const btn = $('#dfBtn'); if (!btn) return;
      const keep = ['hero','final-cta','stickyCTA','stickyCta','share','ampel-check'];
      const sections = $$('main > section').filter(s => !keep.includes(s.id));
      const set = (onState) => {
        btn.setAttribute('aria-pressed', String(onState));
        btn.textContent = onState ? '✅ Kurzmodus aktiv' : '🔍 Kurzmodus';
        sections.forEach(sec => sec.style.display = onState ? 'none' : '');
        if (onState) scrollTo({ top:0, behavior:'smooth' });
        safeStore.set(KEY, onState ? '1' : '0');
      };
      set(safeStore.get(KEY) === '1');
      on(btn,'click',()=> set(!(btn.getAttribute('aria-pressed')==='true')));
      window.setKurzmodus = set; // optional hook
    }
    return { init };
  })();

  /* =========================================================
     4) SHARE ENGINE (why: frictionless referral, zero-pressure)
  ========================================================= */
  const ShareEngine = (() => {
    const KEY = 'hh_ref_rid_v3';
    let rid;
    const sanitize = (v) => (v ? v.replace(/[^a-z0-9]/gi,'').toLowerCase() : '');
    const getRid = () => { if (!rid) rid = safeStore.get(KEY) || (safeStore.set(KEY, randId()), safeStore.get(KEY)); return rid; };

    function buildURL(nameInput){
      const base = location.origin || 'https://heikohaerter.com'; // why: SSR/file:// guard
      const u = new URL(base); const id = getRid();
      u.searchParams.set('utm_source','weitergeben');
      u.searchParams.set('utm_medium','share');
      u.searchParams.set('utm_campaign','check');
      u.searchParams.set('rid', id);
      const alias = sanitize((nameInput?.value || '').trim());
      if (alias) u.searchParams.set('ref', `${alias}.${id.slice(0,5)}`);
      return u.toString();
    }
    const detectSeg = (nameInput) => {
      const raw = (nameInput?.value || '').toLowerCase();
      if (/papa|mama|eltern|vater|mutter/.test(raw)) return 'eltern';
      if (/chef|kolleg|team|büro/.test(raw)) return 'kollegen';
      if (/freund|kumpel|buddy/.test(raw)) return 'freunde';
      if (/selbstständig|selbständig|freelance/.test(raw)) return 'selbst';
      if (/partner|ehefrau|ehemann/.test(raw)) return 'partner';
      return 'neutral';
    };
    const loadVariants = (area) => { try { return JSON.parse(area.dataset.variants || '{}'); } catch { return { neutral: [] }; } };
    const pick = (variants, seg) => { const pool = variants[seg] || variants.neutral || []; return pool[(Math.random()*pool.length)|0] || ''; };
    const plain = (val) => (val || '').replace(/\n+/g,' ').trim();
    const ensureURL = (t, url) => /\bhttps?:\/\//.test(t) ? t : `${t} ${url}`;

    function init(){
      const nameInput = $('#refName');
      const area = $('#refText');
      const wa = $('#waShare');
      const mail = $('#mailShare');
      const copy = $('#copyBtn');
      const preview = $('#waPreviewText');
      const readyBtn = $('#readyMsg');
      const magicBtn = $('#magicLine');
      const addPersonalBtn = $('#addPersonal');
      if (!area || !wa || !mail || !copy || !preview) return;

      const variants = loadVariants(area);
      const update = () => {
        const url = buildURL(nameInput);
        if (!area.value) {
          const seg = detectSeg(nameInput);
          area.value = (pick(variants, seg) || '').replace(/{{URL}}/g, url);
        }
        const t = ensureURL(plain(area.value), url);
        wa.href = 'https://wa.me/?text=' + encodeURIComponent(t);
        mail.href = 'mailto:?subject=Kurzer%20Blick&body=' + encodeURIComponent(t);
        preview.textContent = t.length <= 180 ? t : t.slice(0, t.lastIndexOf(' ', 180)) + '…';
      };

      let tId; const debounced = () => { clearTimeout(tId); tId = setTimeout(update, 80); };
      update();
      $$('.seg-btn').forEach(b => on(b,'click',()=>{ const url=buildURL(nameInput); const txt=(pick(variants,b.dataset.seg)||'').replace(/{{URL}}/g,url); if (txt){ area.value=txt; debounced(); } }));
      on(nameInput,'input',debounced); on(area,'input',debounced);

      on(readyBtn,'click',()=>{ update(); toast('Fertiger Text eingefügt ✔️'); });
      on(magicBtn,'click',()=>{ const line='Hey, hab das gerade gesehen – dachte sofort an dich.'; const cur=(area.value||'').trim(); area.value = cur ? `${line}\n\n${cur}` : `${line}\n\n${buildURL(nameInput)}`; debounced(); });
      on(addPersonalBtn,'click',()=>{ const alias=(nameInput?.value||'').trim()||'Hey'; area.value += `\n\n${alias.split(' ')[0]}, dachte an dich, weil …`; debounced(); });

      on(copy,'click', async () => {
        const url = buildURL(nameInput);
        const text = ensureURL(area.value, url);
        try {
          if (hasClipboard) { await navigator.clipboard.writeText(text); }
          else { area.select(); document.execCommand('copy'); }
          toast('Kopiert ✔️');
        } catch { toast('Konnte nicht kopieren'); }
      });
    }

    function toast(msg){
      const w = document.createElement('div');
      w.className = 'whisper';
      w.textContent = msg;
      Object.assign(w.style, {
        position:'fixed', left:'18px', bottom:'18px',
        background:'rgba(11,15,22,.92)', border:'1px solid rgba(255,255,255,.14)',
        padding:'.6rem .8rem', borderRadius:'14px', opacity:'0', transform:'translateY(8px)',
        transition:'opacity .25s, transform .25s', zIndex: 99999
      });
      document.body.appendChild(w);
      raf(()=>{ w.style.opacity='1'; w.style.transform='translateY(0)'; });
      setTimeout(()=> w.remove(), 2200);
    }

    return { init };
  })();

  /* =========================================================
     5) AMPEL ENGINE (why: instant orientation)
  ========================================================= */
  const Ampel = (() => {
    let score = 0, step = 1; const max = 3;
    const els = {
      start: $('#startCheckBtn'),
      heroStart: $('#startCheckHero'),
      finalStart: $('#ctaFinal'),
      shortBtn: $('#startShort'),
      screen: $('#check-start'),
      wrap: $('#check-steps'),
      result: $('#check-result'),
      stepLabel: $('#stepLabel'),
      stepHint: $('#stepHint'),
      prog: $('#progressBar')
    };

    function updateHeader(){
      els.stepLabel && (els.stepLabel.textContent = `Schritt ${Math.min(step,max)} von ${max}`);
      const pct = ((Math.min(step-1, max-1)) / (max-1)) * 100;
      els.prog && (els.prog.style.width = pct + '%');
      if (els.stepHint) els.stepHint.textContent = step===1 ? 'Kurzer Eindruck reicht.' : step===2 ? 'Fast geschafft.' : 'Letzter Klick.';
    }

    function showStep(n){
      $$('#check-steps .step').forEach(s => (s.style.display = 'none'));
      const el = $(`#check-steps .step[data-step="${n}"]`);
      if (el) el.style.display = 'block';
      updateHeader();
      el?.scrollIntoView({ behavior:'smooth' });
    }

    function finish(){
      if (!els.wrap || !els.result) return;
      els.wrap.style.display = 'none';
      els.result.style.display = 'block';
      const wa = 'https://wa.me/4917660408380?text=';
      let html;
      if (score <= 4) {
        html = `
        <div class="result-card result-red">
          <h3>🔴 Deine Ampel: Jetzt</h3>
          <p>Ein Bereich ist heute wirklich wichtig.</p>
          <a class="hh-btn hh-btn-primary" href="${wa}Kurz%2010%20Minuten%20sprechen%20wegen%20meiner%20Ampel%20(Rot)">💬 10 Minuten sprechen</a>
        </div>`;
      } else if (score <= 7) {
        html = `
        <div class="result-card result-yellow">
          <h3>🟡 Deine Ampel: Als Nächstes</h3>
          <p>Einige Punkte brauchen Orientierung.</p>
          <a class="hh-btn hh-btn-primary" href="${wa}Was%20sollte%20ich%20als%20N%C3%A4chstes%20regeln%3F">🧭 Als Nächstes regeln</a>
        </div>`;
      } else {
        html = `
        <div class="result-card result-green">
          <h3>🟢 Deine Ampel: Später</h3>
          <p>Alles wirkt stabil – evtl. Feinschliff.</p>
          <a class="hh-btn hh-btn-primary" href="${wa}Gibt%20es%20noch%20Optimierungen%3F">✨ Noch smarter machen?</a>
        </div>`;
      }
      els.result.innerHTML = html;
      els.result.scrollIntoView({ behavior:'smooth' });
    }

    function startFlow(){
      if (els.screen) els.screen.style.display = 'none';
      if (els.wrap) els.wrap.style.display = 'block';
      if (els.result) els.result.style.display = 'none';
      score = 0; step = 1; showStep(step);
    }

    function init(){
      on(els.start,'click',startFlow);
      on(els.heroStart,'click',e=>{ e.preventDefault(); startFlow(); });
      on(els.finalStart,'click',e=>{ e.preventDefault(); startFlow(); });
      on(els.shortBtn,'click',e=>{ e.preventDefault(); startFlow(); setTimeout(()=>{ score+=2; step=2; showStep(step); },120); setTimeout(()=>{ score+=2; step=3; showStep(step); },260); });
      const container = $('#check-steps');
      on(container,'click',(ev)=>{ const btn = ev.target.closest('#check-steps .step button'); if (!btn) return;
        score += Number(btn.dataset.value) || 0; step++; (step>max) ? finish() : showStep(step);
      });
    }
    return { init };
  })();

  /* =========================================================
     6) DOPAMIN UI (why: gentle delight, no overwhelm)
  ========================================================= */
  const DopamineUI = (() => {
    let glowIO, intervalId;
    function rippleHandler(e){
      const btn = e.target.closest('button, .hh-btn, .btn'); if (!btn) return;
      const prev = btn.querySelector('.hh-ripple'); prev && prev.remove(); // why: avoid stacking
      const r = document.createElement('span'); r.className='hh-ripple';
      const rect = btn.getBoundingClientRect();
      r.style.left = (e.clientX - rect.left) + 'px';
      r.style.top  = (e.clientY - rect.top)  + 'px';
      btn.appendChild(r); setTimeout(()=>r.remove(), 450);
    }
    function initRipple(){ on(document,'click',rippleHandler); }
    function initGlow(){
      if (!hasIO) return;
      glowIO = new IntersectionObserver((entries)=>{
        entries.forEach(ent=>{
          if (ent.isIntersecting){
            ent.target.classList.add('hh-glow');
            setTimeout(()=> ent.target.classList.remove('hh-glow'), 900);
            glowIO.unobserve(ent.target);
          }
        });
      }, { threshold: .4 });
      $$('.hh-card, .premium-card, .result-card').forEach(el=> glowIO.observe(el));
    }
    function initWhisper(){
      const box = $('#whisper'); if (!box) return;
      const msgs = ['🟢 5 Sekunden – jemand fühlt sich sicherer.','🟡 Kleiner Klick, große Wirkung.','🔵 2 Minuten – mehr Überblick.','✨ Jemand sortiert gleich seinen Tag.'];
      const show = () => {
        const txt = msgs[(Math.random()*msgs.length)|0];
        box.textContent = txt; box.style.opacity='1'; box.style.transform='translateY(0)';
        setTimeout(()=>{ box.style.opacity='0'; box.style.transform='translateY(8px)'; }, 2800);
      };
      setTimeout(show, 2000);
      intervalId = setInterval(show, 15000);
    }
    function destroy(){
      off(document,'click',rippleHandler);
      glowIO && glowIO.disconnect(); glowIO = undefined;
      intervalId && clearInterval(intervalId); intervalId = undefined;
    }
    function init(){ initRipple(); initGlow(); initWhisper(); }
    return { init, destroy };
  })();

  /* =========================================================
     7) BOOT (why: DOM-ready, idempotent)
  ========================================================= */
  const boot = () => {
    try { FadeIn.init(); } catch {}
    try { StickyCTA.init(); } catch {}
    try { ShortMode.init(); } catch {}
    try { ShareEngine.init(); } catch {}
    try { Ampel.init(); } catch {}
    try { DopamineUI.init(); } catch {}
  };

  if (document.readyState === 'loading') {
    on(document, 'DOMContentLoaded', boot, { once:true }); // why: ensure DOM present
  } else {
    boot();
  }

  // optional cleanup on SPA navigations/pagehide
  on(window, 'pagehide', () => { try { FadeIn.destroy?.(); } catch {} try { StickyCTA.destroy?.(); } catch {} try { DopamineUI.destroy?.(); } catch {} }, { once:true });
})();
