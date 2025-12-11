/* ==========================================================================
   heikohaerter-site / app.js (2026)
   Vanilla JS • defer-loaded • defensive • single namespace window.hhApp
   Features auto-initialize only when relevant DOM exists.
   ========================================================================== */

(() => {
  'use strict';

  /* ===== Core helpers ==================================================== */
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const on  = (el, t, fn, o) => el?.addEventListener?.(t, fn, o);
  const off = (el, t, fn, o) => el?.removeEventListener?.(t, fn, o);

  const mm = (q) => {
    try { return window.matchMedia?.(q) ?? { matches:false, addEventListener(){} }; }
    catch { return { matches:false, addEventListener(){} }; }
  };
  const prefersReduced = mm('(prefers-reduced-motion: reduce)').matches;

  const store = (() => {
    try {
      const k='__t'; localStorage.setItem(k,'1'); localStorage.removeItem(k);
      return {
        get:(k,d=null)=>{ try{ const v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch{ return d; } },
        set:(k,v)=>{ try{ localStorage.setItem(k, JSON.stringify(v)); }catch{} },
        getRaw:(k,d=null)=>{ try{ const v=localStorage.getItem(k); return v==null?d:v; }catch{ return d; } },
        setRaw:(k,v)=>{ try{ localStorage.setItem(k, String(v)); }catch{} },
      };
    } catch {
      const m=new Map();
      return {
        get:(k,d=null)=> m.has(k)?m.get(k):d,
        set:(k,v)=> void m.set(k,v),
        getRaw:(k,d=null)=> m.has(k)?m.get(k):d,
        setRaw:(k,v)=> void m.set(k,v),
      };
    }
  })();

  const showToast = (message) => {
    // Minimal, non-blocking toast for feedback; reused style for brand consistency.
    const base = $('#whisper');
    const t = document.createElement('div');
    t.className = 'whisper';
    t.role = 'status';
    t.setAttribute('aria-live','polite');
    t.textContent = message;
    t.style.cssText = base?.style.cssText || 'position:fixed;left:18px;bottom:18px;z-index:70;background:rgba(11,15,22,.92);border:1px solid rgba(255,255,255,.14);color:#F6F7FB;border-radius:14px;padding:.6rem .8rem;box-shadow:0 12px 28px rgba(0,0,0,.38);opacity:0;transform:translateY(10px);transition:opacity .25s cubic-bezier(.22,.61,.36,1), transform .25s cubic-bezier(.22,.61,.36,1)';
    document.body.appendChild(t);
    requestAnimationFrame(()=>{ t.style.opacity='1'; t.style.transform='translateY(0)'; });
    setTimeout(()=> t.remove(), 2200);
  };

  /* ===== Small utilities ================================================= */
  const createIntersectionObserver = (targets, options, onEnter) => {
    const els = Array.isArray(targets) ? targets : $$(targets);
    if (!('IntersectionObserver' in window) || !els.length) {
      els.forEach((el) => onEnter?.(el, true));
      return null;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { onEnter?.(e.target, true, e); io.unobserve(e.target); }
      });
    }, options || { threshold: 0.12, rootMargin: '0px 0px -10% 0px' });
    els.forEach((el) => io.observe(el));
    return io;
  };

  /* ===== Base/init ======================================================= */
  function initNoJsAndYear() {
    document.documentElement.classList.remove('no-js');
    $$('#yearNow').forEach((el) => (el.textContent = String(new Date().getFullYear())));
  }

  /* ===== Motion / Scroll FX ============================================= */
  function initFadeInAnimations() {
    const els = $$('.fade-up');
    if (!els.length) return;
    if (prefersReduced) { els.forEach((el) => el.classList.add('visible')); return; }
    createIntersectionObserver(els, { threshold:0.12, rootMargin:'0px 0px -10% 0px' }, (el) => el.classList.add('visible'));
  }

  function initRipple() {
    if (prefersReduced) return;
    const create = (e) => {
      const btn = e.currentTarget;
      const rect = btn.getBoundingClientRect();
      const dot = document.createElement('span');
      dot.className='hh-ripple';
      dot.style.left = (e.clientX-rect.left) + 'px';
      dot.style.top  = (e.clientY-rect.top)  + 'px';
      btn.appendChild(dot);
      on(dot,'animationend',()=>dot.remove(),{ once:true });
    };
    $$('a.btn,button.btn,[data-ripple]').forEach(el => on(el,'click',create,{ passive:true }));
  }

  /* ===== Sticky CTA ====================================================== */
  function initStickyCTA() {
    const wrap = $('#stickyCTA') || $('#stickyCta');
    const hero = $('.hero');
    if (!wrap || !hero) return;

    const isDesktop = () => window.innerWidth >= 1024;
    const show = (v) => {
      wrap.classList.toggle('show', v);
      wrap.setAttribute('aria-hidden', String(!v));
    };

    if (!isDesktop()) {
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver(([e]) => show(!e.isIntersecting), { threshold:0.35 });
        io.observe(hero);
        on(window,'scroll',()=>{ if (window.scrollY > 200) show(true); },{ passive:true });
      } else {
        on(window,'scroll',()=> show(window.scrollY > 200), { passive:true });
      }
    }
    on(window,'resize',()=> { if (isDesktop()) show(false); });
  }

  function initStickyPulse() {
    // Gentle attention only when visible & motion allowed
    if (prefersReduced) return;
    const wrap = $('#stickyCTA'); if (!wrap) return;
    const btn = $('.sticky-cta .btn'); if (!btn) return;
    setInterval(()=>{ if (wrap.classList.contains('show')) { btn.style.animation='hhPulse 1600ms ease-in-out 1'; setTimeout(()=>btn.style.animation='',1700); } }, 7000);
  }

  /* ===== Whisper (once per session) ===================================== */
  function initWhisperCTA() {
    const el = $('#whisper'); if (!el) return;
    const KEY = 'hh_whisper_seen_v5';
    try {
      if (sessionStorage.getItem(KEY)) return;
      setTimeout(() => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
        setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateY(10px)'; }, 4200);
        sessionStorage.setItem(KEY, '1');
      }, 16000);
    } catch {}
  }

  /* ===== CTA Rotator (Weitergeben) ====================================== */
  function initCTARotator() {
    const btn = $('#shareFast');
    if (!btn || prefersReduced) return;
    let variants=[];
    try { variants = JSON.parse(btn.getAttribute('data-cta-variants') || '[]'); } catch {}
    if (!variants.length) return;
    let i=0;
    setInterval(()=>{ i=(i+1)%variants.length; btn.textContent=variants[i]; btn.classList.add('pulse'); setTimeout(()=>btn.classList.remove('pulse'),800); }, 4000);
  }

  /* ===== Smooth scroll helpers ========================================== */
  function initSmoothScrollToShare() {
    // Enhances anchor scrolling with focus; CSS handles smooth behavior.
    const anchors = $$('a[href^="#"]');
    anchors.forEach(a=>{
      on(a,'click',(e)=>{
        const id = a.getAttribute('href') || '';
        if (!id.startsWith('#') || id === '#') return;
        const target = document.getElementById(id.slice(1));
        if (!target) return;
        // let browser do scroll; then focus for a11y
        setTimeout(()=>{ target.setAttribute('tabindex','-1'); target.focus({ preventScroll:true }); }, 250);
      });
    });
  }

  /* ===== VIP Slider (Weitergeben) ======================================= */
  function initVipSlider() {
    const wrap = $('#vipSlider'); if (!wrap) return;
    on($('#vipPrev'),'click',()=> wrap.scrollBy({ left:-wrap.clientWidth*.9, behavior:'smooth' }));
    on($('#vipNext'),'click',()=> wrap.scrollBy({ left: wrap.clientWidth*.9, behavior:'smooth' }));
  }

  /* ===== Reward Glow when Share visible ================================= */
  function initRewardGlowOnShare() {
    const target = $('#rewardGlow'); if (!target) return;
    const share = document.getElementById('share') || document.getElementById('share-h')?.closest('.share');
    if (!share) return;
    if (prefersReduced) return;
    createIntersectionObserver([share], { threshold:0.25 }, () => {
      target.style.boxShadow = '0 0 0 4px rgba(233,211,148,.18), 0 14px 40px rgba(0,0,0,.45)';
      setTimeout(()=>{ target.style.boxShadow=''; }, 1500);
    });
  }

  /* ===== Gamification / Motivation (Weitergeben) ======================== */
  function initGamificationProgress() {
    const levelBar = $('#levelBar'); const tierList = $('#tierList');
    if (!levelBar && !tierList) return;

    const KEY_COUNT='hh_ref_count_v2';
    const KEY_PCT='hh_motivation_pct_v4';

    const getC = () => Number(store.getRaw(KEY_COUNT,'0') || '0') || 0;
    const setC = (v) => store.setRaw(KEY_COUNT, String(v));
    const setPct = (v) => {
      const n = Math.max(0, Math.min(100, Math.round(v)));
      if (levelBar) levelBar.style.width = n + '%';
      store.setRaw(KEY_PCT, String(n));
    };
    const updateTiers = () => {
      const c = getC();
      $$('#tierList i').forEach(i=>{
        const goal = Number(i.getAttribute('data-goal')||'1');
        const pct = Math.max(0, Math.min(100, Math.round((c/goal)*100)));
        i.style.width = pct + '%';
      });
    };

    setPct(Number(store.getRaw(KEY_PCT,'0') || '0'));
    updateTiers();

    // expose bump hooks
    window._bumpRefHalf = function(){ const c=getC()+0.5; setC(c); updateTiers(); setPct(Math.min(100, c*10)); };
    window._bumpRefFull = function(){ const c=getC()+1;   setC(c); updateTiers(); setPct(Math.min(100, c*12)); };
  }

  /* ===== Share Engine (beide Seiten) ==================================== */
  function initShareEngine() {
    const name = $('#refName'), area = $('#refText'), wa = $('#waShare'), mail = $('#mailShare'), copy = $('#copyBtn'), preview = $('#waPreviewText');
    const readyBtn = $('#readyMsg'), magicBtn = $('#magicLine'), addPersonal = $('#addPersonal'), nativeShare = $('#nativeShare'), shareFast = $('#shareFast');
    if (!area || !preview) return;

    const KEY_ID = 'hh.ref.id';
    function randomId(len=10){
      const A='abcdefghijklmnopqrstuvwxyz0123456789';
      try { const u=new Uint8Array(len); crypto.getRandomValues(u); return Array.from(u,x=>A[x%A.length]).join(''); }
      catch { let s=''; for(let i=0;i<len;i++) s+=A[(Math.random()*A.length)|0]; return s; }
    }
    const getId = () => store.getRaw(KEY_ID) || (store.setRaw(KEY_ID, randomId()), store.getRaw(KEY_ID));
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
    const variants = loadVariants();
    const pick = (seg) => { const pool = variants[seg] || variants.neutral || []; return pool[(Math.random()*pool.length)|0] || ''; };
    const detectSeg = () => {
      const raw=(name?.value||'').toLowerCase();
      if (/(papa|mama|vater|mutter|eltern)/.test(raw)) return 'eltern';
      if (/(chef|manager|kolleg|team|büro)/.test(raw)) return 'kollegen';
      if (/(freund|kumpel|bff|buddy|schatz)/.test(raw)) return 'freunde';
      if (/(selbständig|selbstständig|freelance|freiberuf)/.test(raw)) return 'selbst';
      if (/(partner|ehefrau|ehemann|verlobt)/.test(raw)) return 'partner';
      return 'neutral';
    };

    const ensureURL = (text) => /\bhttps?:\/\/\S+/i.test(text) ? text.trim() : `${text.trim()} ${buildURL()}`;
    const plain = () => (area.value||'').replace(/\n+/g,' ').trim();

    function updateLinks(){
      const t = ensureURL(plain());
      if (wa)   wa.href   = 'https://wa.me/?text=' + encodeURIComponent(t);
      if (mail) mail.href = 'mailto:?subject=' + encodeURIComponent('Kurzer Blick') + '&body=' + encodeURIComponent(t);
      preview.textContent = t.length<=190 ? t : t.substring(0, t.lastIndexOf(' ',190)) + '…';
    }
    function setSeg(seg){
      const tmpl = pick(seg || detectSeg());
      if (!tmpl) return;
      area.value = tmpl.replace(/\{\{URL\}\}/g, buildURL());
      updateLinks();
      store.setRaw('hh.share.seg', seg || 'neutral');
    }

    // init
    const defaultSeg = store.getRaw('hh.share.seg') || 'neutral';
    if (!area.value) setSeg(defaultSeg);
    updateLinks();

    // events
    $$('.seg-btn,[data-seg]').forEach(b => on(b,'click',()=> setSeg(b.getAttribute('data-seg')) ));
    on(name,'input',()=> setSeg());
    on(area,'input',updateLinks);

    on(readyBtn,'click',()=>{ setSeg(); showToast('Fertiger Text eingefügt ✔️'); });
    on(magicBtn,'click',()=>{ const line='Hey, hab das gerade gesehen – dachte sofort an dich.'; const cur=(area.value||'').trim(); area.value = cur ? `${line}\n\n${cur}` : `${line}\n\n${buildURL()}`; updateLinks(); });
    on(addPersonal,'click',()=>{ const alias=(name?.value||'').trim()||'Hey'; area.value = (area.value||'') + `\n\n${alias.split(' ')[0]}, dachte an dich, weil …`; updateLinks(); });

    on(copy,'click', async ()=>{
      const text = ensureURL(area.value);
      try{
        if (navigator.clipboard && window.isSecureContext){ await navigator.clipboard.writeText(text); }
        else { area.select(); document.execCommand?.('copy'); }
        showToast('Kopiert ✔️');
      } catch { showToast('Konnte nicht kopieren'); }
    });

    on($('#waShare'),'click',()=> window._bumpRefFull?.());
    on($('#mailShare'),'click',()=> window._bumpRefFull?.());
    on(nativeShare,'click', async ()=>{
      const t = ensureURL(area.value); const url = buildURL();
      if (navigator.share && !prefersReduced) {
        try { await navigator.share({ title:'2-Minuten-Blick', text:t, url }); window._bumpRefFull?.(); }
        catch { /* user cancelled */ }
      } else {
        try { await navigator.clipboard.writeText(t); showToast('Kein System-Share – Text kopiert.'); }
        catch { showToast('Weder Share noch Kopieren möglich.'); }
      }
    });

    on(shareFast,'click',()=> setSeg());
  }

  /* ===== Ampel-Check (Startseite) ======================================= */
  function initAmpelCheck() {
    const stepsWrap = $('#check-steps'), resultBox = $('#check-result');
    const stepLabel = $('#stepLabel'), progress = $('#progressBar'), stepHint = $('#stepHint');
    if (!stepsWrap || !resultBox || !stepLabel || !progress || !stepHint) return;

    const startBtn = $('#startCheckBtn'), startHero = $('#startCheckHero'), ctaFinal = $('#ctaFinal'), startShort = $('#startShort'), startScreen = $('#check-start');
    let step=1, score=0; const max=3;

    const syncProgressA11y = () => {
      const pct = max===1 ? 100 : ((Math.min(step-1,max-1))/(max-1))*100;
      progress.style.width = pct + '%';
      progress.setAttribute('role','progressbar');
      progress.setAttribute('aria-valuemin','0');
      progress.setAttribute('aria-valuemax','100');
      progress.setAttribute('aria-valuenow', String(Math.round(pct)));
      stepLabel.textContent = `Schritt ${Math.min(step,max)} von ${max}`;
      stepHint.textContent = step===1 ? 'Kurzer Eindruck reicht.' : step===2 ? 'Fast geschafft.' : 'Letzter Klick.';
    };

    const showStep = (n) => {
      $$('#check-steps .step').forEach(s=> s.style.display='none');
      const t = $(`#check-steps .step[data-step="${n}"]`);
      if (t){ t.style.display='block'; t.scrollIntoView({ behavior:'smooth', block:'start' }); }
      syncProgressA11y();
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
      stepsWrap.style.display='none'; resultBox.style.display='block';
      let html='';
      if (score<=4) {
        html=`<div class="result-card result-red"><h3>🔴 Heute wichtig</h3><p>Mindestens ein Bereich braucht heute deine Aufmerksamkeit.</p>${renderCTA('red')}</div>`;
      } else if (score<=7) {
        html=`<div class="result-card result-yellow"><h3>🟡 Bald wichtig</h3><p>Ein paar Dinge stehen bald an.</p>${renderCTA('yellow')}</div>`;
      } else {
        html=`<div class="result-card result-green"><h3>🟢 Passt für heute</h3><p>Für heute wirkt alles entspannt.</p>${renderCTA('green')}</div>`;
      }
      html+=`<p class="hero-micro" style="margin-top:.8rem;opacity:.85">Wenn dir die Ampel nichts bringt → <strong>25 €</strong>.</p>`;
      resultBox.innerHTML=html;
      resultBox.scrollIntoView({ behavior:'smooth', block:'start' });
    };

    const start = () => {
      if (startScreen) startScreen.style.display='none';
      stepsWrap.style.display='block'; resultBox.style.display='none';
      step=1; score=0; showStep(step);
    };

    on(startBtn,'click',start);
    on(startHero,'click',e=>{ e.preventDefault(); start(); });
    on(ctaFinal,'click',e=>{ 
      // auf weitergeben.html gibt es ebenfalls #ctaFinal (final call-to-action) → nur blocken, wenn kein final-cta-Container vorhanden
      if (ctaFinal.closest('#final-cta')) return;
      e.preventDefault(); start();
    });
    on(startShort,'click',e=>{
      e.preventDefault(); start();
      setTimeout(()=>{ score+=2; step=2; showStep(step); },150);
      setTimeout(()=>{ score+=2; step=3; showStep(step); },350);
    });

    $$('#check-steps .step').forEach(s=>{
      $$('button', s).forEach(btn=>{
        on(btn,'click',()=>{
          score += Number(btn.getAttribute('data-value'))||0;
          step++; (step>3) ? finish() : showStep(step);
        });
      });
    });
  }

  /* ===== Short Mode (Startseite) ======================================== */
  function initReturnCTA() {
    // Reserved for future "Back" / secondary CTA behavior; noop if not present.
  }
  function initShortMode() {
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
      store.set(key, onState);
    };
    set(!!JSON.parse(store.getRaw(key,'false')||'false'));
    on(btn,'click',()=> set(btn.getAttribute('aria-pressed')!=='true'));
    window.setKurzmodus = set; // intentional small namespace
  }
  function initHeroPreview() {
    const btn = $('#previewToggle'), box = $('#heroPreview');
    if (!btn || !box) return;
    on(btn,'click',()=>{
      const open = box.style.display==='none' || box.style.display===''; 
      box.style.display = open ? 'grid' : 'none';
      btn.setAttribute('aria-expanded', String(open));
    });
  }

  /* ===== Anchor focus helper ============================================ */
  function initAnchorFocus() {
    const focusHash = () => {
      if (!location.hash) return;
      const el = document.getElementById(location.hash.slice(1));
      if (el) { el.setAttribute('tabindex','-1'); el.focus({ preventScroll:true }); }
    };
    on(window,'hashchange',focusHash);
  }

  /* ===== Public namespace (debug/hooks) ================================= */
  window.hhApp = {
    prefersReduced,
    store,
    showToast,
  };

  /* ===== Boot ============================================================ */
  function init() {
    initNoJsAndYear();

    // Motion & micro-interactions
    initFadeInAnimations();
    initRipple();

    // CTAs
    initStickyCTA();
    initStickyPulse();
    initWhisperCTA();
    initCTARotator();

    // Smooth scroll + focus repair
    initSmoothScrollToShare();
    initAnchorFocus();

    // Startseite specifics
    initShortMode();
    initHeroPreview();
    initAmpelCheck();

    // Weitergeben specifics
    initVipSlider();
    initRewardGlowOnShare();
    initGamificationProgress();

    // Share (both pages, no-op if box missing)
    initShareEngine();
  }

  (document.readyState === 'loading') ? on(document,'DOMContentLoaded',init,{ once:true }) : init();
})();
