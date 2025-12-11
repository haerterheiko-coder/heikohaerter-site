// ======================================================================
// /app.js — HEIKO HAERTER • 2026 (Vanilla, Modular, A11y/Perf-safe)
// Load with: <script src="/app.js" defer></script>
// ======================================================================
(() => {
  'use strict';

  /* ========== Core helpers (why: consistency/defense) ========== */
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const on  = (el, t, fn, o) => el?.addEventListener?.(t, fn, o);
  const off = (el, t, fn, o) => el?.removeEventListener?.(t, fn, o);

  const media = { reduced: safeMatch('(prefers-reduced-motion: reduce)') };
  function safeMatch(q){ try { return window.matchMedia?.(q) ?? { matches:false, addEventListener(){} }; } catch { return { matches:false, addEventListener(){} }; }

  const storage = (() => {
    try { const k='__t'; localStorage.setItem(k,'1'); localStorage.removeItem(k);
      return {
        get:(k,d=null)=>{ try{ return JSON.parse(localStorage.getItem(k)) ?? d; }catch{ return d; } },
        set:(k,v)=>{ try{ localStorage.setItem(k, JSON.stringify(v)); }catch{} },
      };
    } catch {
      const mem=new Map();
      return { get:(k,d=null)=>mem.has(k)?mem.get(k):d, set:(k,v)=>void mem.set(k,v) };
    }
  })();

  /* ========== 0) Boot prep ========== */
  function initNoJsFixes(){
    document.documentElement.classList.remove('no-js');
    $$('#yearNow').forEach(el => el.textContent = String(new Date().getFullYear()));
  }

  /* ========== 1) Fade-ins (IO, motion-safe) ========== */
  function initFadeInAnimations(){
    const els = $$('.fade-up');
    if (!('IntersectionObserver' in window) || media.reduced.matches) { els.forEach(el=>el.classList.add('visible')); return; }
    const io = new IntersectionObserver((entries, obs)=>{
      entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('visible'); obs.unobserve(e.target);} });
    }, { threshold: .12, rootMargin: '0px 0px -10% 0px' });
    els.forEach(el => io.observe(el));
  }

  /* ========== 2) Ripple (only on [data-ripple] & .btn) ========== */
  function initRipple(){
    if (media.reduced.matches) return;
    function create(e){
      const target = e.currentTarget;
      const rect = target.getBoundingClientRect();
      const x = e.clientX - rect.left, y = e.clientY - rect.top;
      const dot = document.createElement('span');
      dot.className = 'hh-ripple';
      dot.style.left = `${x}px`; dot.style.top = `${y}px`;
      target.appendChild(dot);
      on(dot,'animationend',()=>dot.remove(),{ once:true });
    }
    $$('a.btn,button.btn,[data-ripple]').forEach(el => on(el,'click',create,{ passive:true }));
  }

  /* ========== 3) Sticky CTA (mobile-only, session-once, ESC dismiss) ========== */
  function initStickyCTA(){
    const el = $('#stickyCTA') || $('#stickyCta');
    const hero = $('.hero');
    if (!el || !hero) return;
    if (window.innerWidth >= 1024) return;

    const key = 'hh.sticky.shown';
    if (storage.get(key, false)) { /* respect prior dismissal/show */ return; }

    const show = (v) => { el.style.transform = v?'translateY(0)':'translateY(100%)'; el.style.opacity = v?'1':'0'; el.setAttribute('aria-hidden', String(!v)); };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(([e])=> show(!e.isIntersecting), { threshold:.35 });
      io.observe(hero);
      on(window,'scroll',()=>{ if (scrollY>200){ show(true); storage.set(key,true); } }, { passive:true });
    } else {
      on(window,'scroll',()=>{ const v = scrollY>200; show(v); v && storage.set(key,true); }, { passive:true });
    }
    on(document,'keydown', (ev)=>{ if(ev.key==='Escape') el.classList.remove('show'); });
  }

  /* ========== 4) Kurzmodus (dfBtn) ========== */
  function initShortMode(){
    const btn = $('#dfBtn');
    if (!btn) return;
    const keep = new Set(['hero','ethos-social','stickyCTA','share','ampel-check']);
    const nodes = $$('main > section').filter(s => !keep.has(s.id));
    const key = 'hh.short.enabled';
    const set = (onState) => {
      btn.setAttribute('aria-pressed', onState ? 'true' : 'false');
      btn.textContent = onState ? '✅ Kurzmodus aktiv' : '🔍 Kurzmodus';
      nodes.forEach(n => n.style.display = onState ? 'none' : '');
      if (onState) window.scrollTo({ top:0, behavior:'smooth' });
      storage.set(key, onState);
    };
    set(!!storage.get(key, false));
    on(btn,'click',()=> set(btn.getAttribute('aria-pressed')!=='true'));
  }

  /* ========== 5) Hero-Ergebnis-Vorschau Toggle ========== */
  function initHeroPreviewToggle(){
    const btn = $('#previewToggle');
    const box = $('#heroPreview');
    if (!btn || !box) return;
    const toggle = () => {
      const open = box.style.display === 'none' || box.style.display === '';
      box.style.display = open ? 'grid' : 'none';
      btn.setAttribute('aria-expanded', String(open));
    };
    on(btn,'click', toggle);
  }

  /* ========== 6) Ampel-Check (3 Schritte) ========== */
  function initGamificationProgress(){
    const startBtn = $('#startCheckBtn');
    const stepsWrap = $('#check-steps');
    const resultBox = $('#check-result');
    const stepLabel = $('#stepLabel');
    const progress = $('#progressBar');
    const stepHint = $('#stepHint');
    const startHero = $('#startCheckHero');
    const ctaFinal = $('#ctaFinal');
    const startShort = $('#startShort');
    const startScreen = $('#check-start');
    if (!stepsWrap || !resultBox || !stepLabel || !progress || !stepHint) return;

    let step=1, score=0;
    const max=3;

    const updateHead = () => {
      stepLabel.textContent = `Schritt ${Math.min(step,max)} von ${max}`;
      const pct = max===1 ? 100 : ((Math.min(step-1,max-1))/(max-1))*100;
      progress.style.width = pct + '%';
      stepHint.textContent = step===1 ? 'Kurzer Eindruck reicht.' : step===2 ? 'Fast geschafft.' : 'Letzter Klick.';
    };

    const showStep = (n) => {
      $$('#check-steps .step').forEach(s => s.style.display='none');
      const t = $(`#check-steps .step[data-step="${n}"]`);
      if (t) { t.style.display='block'; t.scrollIntoView({ behavior:'smooth', block:'start' }); }
      updateHead();
    };

    const renderCTA = (color) => {
      const wa='https://wa.me/4917660408380?text=';
      if(color==='red') return `<div class="stack" style="text-align:center">
        <a href="${wa}Kurz%2010%20Minuten%20sprechen" class="btn btn-primary">💬 Kurz sprechen – 10 Minuten</a>
        <a href="${wa}Kurze%20Frage%20senden" class="btn btn-ghost">🛟 Frage senden</a></div>`;
      if(color==='yellow') return `<div class="stack" style="text-align:center">
        <a href="${wa}Als%20N%C3%A4chstes%20angehen" class="btn btn-primary">🧭 Als Nächstes angehen</a>
        <a href="${wa}Kurze%20Frage%20senden" class="btn btn-ghost">💬 Frage senden</a></div>`;
      return `<div class="stack" style="text-align:center">
        <a href="${wa}Smarter%20machen%3F" class="btn btn-primary">✨ Smarter machen?</a>
        <a href="#share" class="btn btn-ghost">🔗 Weitergeben</a></div>`;
    };

    const finish = () => {
      stepsWrap.style.display='none';
      resultBox.style.display='block';
      let html='';
      if (score<=4) {
        html=`<div class="result-card result-red">
          <h3>🔴 Heute wichtig</h3><p>Mindestens ein Bereich braucht heute deine Aufmerksamkeit.</p>${renderCTA('red')}
        </div>`;
      } else if (score<=7) {
        html=`<div class="result-card result-yellow">
          <h3>🟡 Bald wichtig</h3><p>Ein paar Dinge stehen bald an.</p>${renderCTA('yellow')}
        </div>`;
      } else {
        html=`<div class="result-card result-green">
          <h3>🟢 Passt für heute</h3><p>Für heute wirkt alles entspannt.</p>${renderCTA('green')}
        </div>`;
      }
      html += `<p class="hero-micro" style="margin-top:.8rem;opacity:.85">Wenn dir die Ampel nichts bringt → <strong>25 €</strong>.</p>`;
      resultBox.innerHTML = html;
      resultBox.scrollIntoView({ behavior:'smooth', block:'start' });
    };

    const start = () => {
      if (startScreen) startScreen.style.display='none';
      stepsWrap.style.display='block';
      resultBox.style.display='none';
      step=1; score=0; showStep(step);
    };

    on(startBtn,'click',start);
    on(startHero,'click',e=>{ e.preventDefault(); start(); });
    on(ctaFinal,'click',e=>{ e.preventDefault(); start(); });
    on(startShort,'click',e=>{
      e.preventDefault(); start();
      setTimeout(()=>{ score+=2; step=2; showStep(step); },150);
      setTimeout(()=>{ score+=2; step=3; showStep(step); },350);
    });

    $$('#check-steps .step').forEach(s=>{
      $$('button', s).forEach(btn=>{
        on(btn,'click',()=>{
          score += Number(btn.getAttribute('data-value'))||0;
          step++;
          (step>3) ? finish() : showStep(step);
        });
      });
    });
  }

  /* ========== 7) Share Composer (Seg, Copy, WA, Web Share) ========== */
  function initShareComposer(){
    const name = $('#refName');
    const area = $('#refText');
    const wa = $('#waShare');
    const mail = $('#mailShare');
    const copy = $('#copyBtn');
    const preview = $('#waPreviewText');
    const readyBtn = $('#readyMsg');
    const magicBtn = $('#magicLine');
    const addPersonalBtn = $('#addPersonal');
    const nativeShare = $('#nativeShare');
    if (!area || !wa || !mail || !copy || !preview) return;

    const KEY_ID = 'hh.ref.id';
    function randomId(len=10){
      const A='abcdefghijklmnopqrstuvwxyz0123456789';
      try {
        const u=new Uint8Array(len); crypto.getRandomValues(u);
        return Array.from(u,x=>A[x%A.length]).join('');
      } catch {
        let s=''; for(let i=0;i<len;i++) s+=A[(Math.random()*A.length)|0]; return s;
      }
    }
    const getId = () => storage.get(KEY_ID) || (storage.set(KEY_ID, randomId()), storage.get(KEY_ID));

    const sanitize = (v) => (v ? v.replace(/[^a-z0-9]/gi,'').toLowerCase() : '');
    const buildURL = () => {
      const u = new URL('https://heikohaerter.com');
      u.searchParams.set('utm_source','weitergeben');
      u.searchParams.set('utm_medium','share');
      u.searchParams.set('utm_campaign','check');
      const rid = getId(); u.searchParams.set('rid', rid);
      const alias = sanitize((name?.value||'').trim());
      if (alias) u.searchParams.set('ref', `${alias}.${String(rid).slice(0,5)}`);
      return u.toString();
    };

    const loadVariants = () => { try { return JSON.parse(area.getAttribute('data-variants')||'{}'); } catch { return { neutral:[] }; } };
    const pick = (obj, key) => { const pool = obj[key] || obj.neutral || []; return pool[(Math.random()*pool.length)|0] || ''; };
    const detectSeg = () => {
      const raw=(name?.value||'').toLowerCase();
      if (/(papa|mama|vater|mutter|eltern)/.test(raw)) return 'eltern';
      if (/(chef|manager|kolleg|team|büro)/.test(raw)) return 'kollegen';
      if (/(freund|kumpel|bff|buddy|schatz)/.test(raw)) return 'freunde';
      if (/(selbständig|selbstständig|freelance|freiberuf)/.test(raw)) return 'selbst';
      if (/(partner|ehefrau|ehemann|verlobt)/.test(raw)) return 'partner';
      return 'neutral';
    };

    const variants = loadVariants();

    function ensureURL(text){
      const url = buildURL();
      return /\bhttps?:\/\/\S+/i.test(text) ? text.trim() : `${text.trim()} ${url}`;
    }
    function plain(){ return (area.value||'').replace(/\n+/g,' ').trim(); }
    function setSeg(seg){
      const tmpl = pick(variants, seg || detectSeg());
      if (!tmpl) return;
      area.value = tmpl.replace(/\{\{URL\}\}/g, buildURL());
      updateLinks();
      storage.set('hh.share.seg', seg || 'neutral');
    }
    function updateLinks(){
      const t = ensureURL(plain());
      wa.href   = 'https://wa.me/?text=' + encodeURIComponent(t);
      mail.href = 'mailto:?subject=' + encodeURIComponent('Kurzer Blick') + '&body=' + encodeURIComponent(t);
      preview.textContent = t.length<=190 ? t : t.substring(0, t.lastIndexOf(' ',190)) + '…';
    }

    // Init
    const defaultSeg = storage.get('hh.share.seg','neutral');
    if (!area.value) setSeg(defaultSeg); updateLinks();

    $$('[data-seg]').forEach(b => on(b,'click',()=> setSeg(b.getAttribute('data-seg')) ));
    on(name,'input',()=> setSeg());               // re-pick on name changes
    on(area,'input',updateLinks);

    on(readyBtn,'click',()=>{ setSeg(); toast('Fertiger Text eingefügt ✔️'); });
    on(magicBtn,'click',()=>{ const line='Hey, hab das gerade gesehen – dachte sofort an dich.'; const cur=(area.value||'').trim(); area.value = cur ? `${line}\n\n${cur}` : `${line}\n\n${buildURL()}`; updateLinks(); });
    on(addPersonalBtn,'click',()=>{ const alias=(name?.value||'').trim()||'Hey'; area.value = (area.value||'') + `\n\n${alias.split(' ')[0]}, dachte an dich, weil …`; updateLinks(); });

    on(copy,'click', async ()=>{
      const text = ensureURL(area.value);
      try{
        if (navigator.clipboard && window.isSecureContext){ await navigator.clipboard.writeText(text); }
        else { area.select(); document.execCommand?.('copy'); }
        toast('Kopiert ✔️');
      } catch { toast('Konnte nicht kopieren'); }
    });

    on(nativeShare,'click', async ()=>{
      const t = plain(); const url = buildURL();
      if (navigator.share && !media.reduced.matches) {
        try { await navigator.share({ title:'2-Minuten-Blick', text:t, url }); toast('Geteilt.'); }
        catch { /* user canceled */ }
      } else {
        try { await navigator.clipboard.writeText(ensureURL(t)); toast('Kein System-Share – Text kopiert.'); }
        catch { toast('Weder Share noch Kopieren möglich.'); }
      }
    });

    function toast(msg){
      const w = document.createElement('div');
      w.textContent = msg;
      w.setAttribute('role','status');
      Object.assign(w.style,{
        position:'fixed',left:'18px',bottom:'18px',zIndex:70,
        background:'rgba(11,15,22,.92)',border:'1px solid rgba(255,255,255,.14)',color:'#F6F7FB',
        borderRadius:'14px',padding:'.6rem .8rem',boxShadow:'0 12px 28px rgba(0,0,0,.38)',opacity:'0',
        transform:'translateY(10px)',transition:'opacity .25s var(--ease), transform .25s var(--ease)'
      });
      document.body.appendChild(w);
      requestAnimationFrame(()=>{ w.style.opacity='1'; w.style.transform='translateY(0)'; });
      setTimeout(()=> w.remove(), 2200);
    }
  }

  /* ========== 8) Anchor focus (A11y) ========== */
  function initAnchorFocus(){
    const focusHash = () => {
      if (!location.hash) return;
      const el = document.getElementById(location.hash.slice(1));
      if (el) { el.setAttribute('tabindex','-1'); el.focus({ preventScroll:true }); }
    };
    on(window,'hashchange',focusHash);
  }

  /* ========== App init ========== */
  function init(){
    initNoJsFixes();
    initFadeInAnimations();
    initRipple();
    initStickyCTA();
    initShortMode();
    initHeroPreviewToggle();
    initGamificationProgress();
    initShareComposer();
    initAnchorFocus();
  }
  (document.readyState==='loading') ? on(document,'DOMContentLoaded',init,{ once:true }) : init();
})();
