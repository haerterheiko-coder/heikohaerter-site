// ======================================================================
// HEIKO HAERTER • 2026 — app.js
// One file for BOTH pages (Check + Weitergeben)
// Defensive · Motion-safe · A11y-first · No globals leaked
// ======================================================================
(() => {
  'use strict';

  /* ---------- Core helpers ---------- */
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const on  = (el, t, fn, o) => el?.addEventListener?.(t, fn, o);
  const off = (el, t, fn, o) => el?.removeEventListener?.(t, fn, o);

  const media = {
    reduced: match('(prefers-reduced-motion: reduce)')
  };
  function match(q){ try { return window.matchMedia?.(q) ?? { matches:false, addEventListener(){} }; } catch { return { matches:false, addEventListener(){} }; } }

  const store = (() => {
    try { const k='__t'; localStorage.setItem(k,'1'); localStorage.removeItem(k);
      return {
        get:(k,d=null)=>{ try{ return JSON.parse(localStorage.getItem(k)) ?? d; }catch{ return d; } },
        set:(k,v)=>{ try{ localStorage.setItem(k, JSON.stringify(v)); }catch{} },
      };
    } catch { const m=new Map(); return { get:(k,d=null)=>m.has(k)?m.get(k):d, set:(k,v)=>void m.set(k,v) }; }
  })();

  /* ---------- Boot prep ---------- */
  function initNoJs(){
    document.documentElement.classList.remove('no-js');
    $$('#yearNow').forEach(el=> el.textContent = String(new Date().getFullYear()));
  }

  /* ---------- Fade-in ---------- */
  function initFadeUps(){
    const els = $$('.fade-up');
    if (!('IntersectionObserver' in window) || media.reduced.matches) { els.forEach(el=>el.classList.add('visible')); return; }
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold:.12, rootMargin:'0px 0px -10% 0px' });
    els.forEach(el => io.observe(el));
  }

  /* ---------- Ripple (only buttons/btns) ---------- */
  function initRipple(){
    if (media.reduced.matches) return;
    function create(e){
      const btn = e.currentTarget;
      const rect = btn.getBoundingClientRect();
      const dot = document.createElement('span');
      dot.className='hh-ripple'; dot.style.left = (e.clientX-rect.left) + 'px'; dot.style.top = (e.clientY-rect.top) + 'px';
      btn.appendChild(dot);
      on(dot,'animationend',()=>dot.remove(),{ once:true });
    }
    $$('a.btn,button.btn,[data-ripple]').forEach(el => on(el,'click',create,{ passive:true }));
  }

  /* ---------- Sticky CTA (both pages) ---------- */
  function initStickyCTA(){
    const el = $('#stickyCTA') || $('#stickyCta'); // handle both spellings
    const hero = $('.hero');
    if (!el || !hero) return;
    if (innerWidth >= 1024) return;

    const shownKey = 'hh.sticky.once';
    if (store.get(shownKey,false)) { /* already shown once this session */ }

    const show = (v) => {
      el.style.transform = v?'translateY(0)':'translateY(100%)';
      el.style.opacity = v?'1':'0';
      el.setAttribute('aria-hidden', String(!v));
    };
    if ('IntersectionObserver' in window){
      const io = new IntersectionObserver(([e]) => show(!e.isIntersecting), { threshold:.3 });
      io.observe(hero);
      on(window,'scroll',()=>{ if(scrollY>180){ show(true); store.set(shownKey,true); } }, { passive:true });
    } else {
      on(window,'scroll',()=>{ const v = scrollY>180; show(v); v && store.set(shownKey,true); }, { passive:true });
    }
    // dismiss via ESC
    on(document,'keydown',ev=>{ if(ev.key==='Escape') show(false); });
  }

  /* ---------- Kurzmodus (nur Seite 1, wenn #dfBtn existiert) ---------- */
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
      store.set(key, onState);
    };
    set(!!store.get(key,false));
    on(btn,'click',()=> set(btn.getAttribute('aria-pressed')!=='true'));
    // optional global hook (falls du ihn irgendwo nutzt)
    window.setKurzmodus = set;
  }

  /* ---------- Hero Ergebnis-Vorschau (Seite 1) ---------- */
  function initHeroPreview(){
    const btn = $('#previewToggle'), box = $('#heroPreview');
    if (!btn || !box) return;
    on(btn,'click',()=>{
      const open = box.style.display==='none' || box.style.display==='';
      box.style.display = open ? 'grid' : 'none';
      btn.setAttribute('aria-expanded', String(open));
    });
  }

  /* ---------- Ampel-Check (Seite 1) ---------- */
  function initAmpel(){
    const stepsWrap = $('#check-steps'), resultBox = $('#check-result');
    const stepLabel = $('#stepLabel'), progress = $('#progressBar'), stepHint = $('#stepHint');
    if (!stepsWrap || !resultBox || !stepLabel || !progress || !stepHint) return;

    const startBtn = $('#startCheckBtn'), startHero = $('#startCheckHero'), ctaFinal = $('#ctaFinal'), startShort = $('#startShort'), startScreen = $('#check-start');
    let step=1, score=0; const max=3;

    const updateHead = () => {
      stepLabel.textContent = `Schritt ${Math.min(step,max)} von ${max}`;
      const pct = max===1 ? 100 : ((Math.min(step-1,max-1))/(max-1))*100;
      progress.style.width = pct + '%';
      stepHint.textContent = step===1 ? 'Kurzer Eindruck reicht.' : step===2 ? 'Fast geschafft.' : 'Letzter Klick.';
    };
    const showStep = (n) => {
      $$('#check-steps .step').forEach(s=> s.style.display='none');
      const t = $(`#check-steps .step[data-step="${n}"]`);
      if (t){ t.style.display='block'; t.scrollIntoView({ behavior:'smooth', block:'start' }); }
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
    on(ctaFinal,'click',e=>{ if (ctaFinal.closest('#final-cta')) return; e.preventDefault(); start(); }); // Seite1-only blockt Seite2
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

  /* ---------- Share Composer (beide Seiten) ---------- */
  function initShare(){
    const name = $('#refName'), area = $('#refText'), wa = $('#waShare'), mail = $('#mailShare'), copy = $('#copyBtn'), preview = $('#waPreviewText');
    const readyBtn = $('#readyMsg'), magicBtn = $('#magicLine'), addPersonal = $('#addPersonal'), nativeShare = $('#nativeShare'), shareFast = $('#shareFast');
    if (!area || !preview) return; // Box existiert nur auf den Share-Abschnitten

    const KEY_ID = 'hh.ref.id';
    function randomId(len=10){
      const A='abcdefghijklmnopqrstuvwxyz0123456789';
      try { const u=new Uint8Array(len); crypto.getRandomValues(u); return Array.from(u,x=>A[x%A.length]).join(''); }
      catch { let s=''; for(let i=0;i<len;i++) s+=A[(Math.random()*A.length)|0]; return s; }
    }
    const getId = () => store.get(KEY_ID) || (store.set(KEY_ID, randomId()), store.get(KEY_ID));
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

    function ensureURL(text){
      const url = buildURL();
      return /\bhttps?:\/\/\S+/i.test(text) ? text.trim() : `${text.trim()} ${url}`;
    }
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
      store.set('hh.share.seg', seg || 'neutral');
    }

    // init
    const defaultSeg = store.get('hh.share.seg','neutral');
    if (!area.value) setSeg(defaultSeg); updateLinks();

    // events
    $$('.seg-btn,[data-seg]').forEach(b => on(b,'click',()=> setSeg(b.getAttribute('data-seg')) ));
    on(name,'input',()=> setSeg());
    on(area,'input',updateLinks);

    on(readyBtn,'click',()=>{ setSeg(); toast('Fertiger Text eingefügt ✔️'); });
    on(magicBtn,'click',()=>{ const line='Hey, hab das gerade gesehen – dachte sofort an dich.'; const cur=(area.value||'').trim(); area.value = cur ? `${line}\n\n${cur}` : `${line}\n\n${buildURL()}`; updateLinks(); });
    on(addPersonal,'click',()=>{ const alias=(name?.value||'').trim()||'Hey'; area.value = (area.value||'') + `\n\n${alias.split(' ')[0]}, dachte an dich, weil …`; updateLinks(); });

    on(copy,'click', async ()=>{
      const text = ensureURL(area.value);
      try{
        if (navigator.clipboard && window.isSecureContext){ await navigator.clipboard.writeText(text); }
        else { area.select(); document.execCommand?.('copy'); }
        toast('Kopiert ✔️');
      } catch { toast('Konnte nicht kopieren'); }
    });

    on($('#waShare'),'click',()=> window._bumpRefFull?.());
    on($('#mailShare'),'click',()=> window._bumpRefFull?.());
    on($('#nativeShare'),'click', async ()=>{
      const t = ensureURL(area.value); const url = buildURL();
      if (navigator.share && !media.reduced.matches) {
        try { await navigator.share({ title:'2-Minuten-Blick', text:t, url }); window._bumpRefFull?.(); }
        catch { /* cancel */ }
      } else {
        try { await navigator.clipboard.writeText(t); toast('Kein System-Share – Text kopiert.'); }
        catch { toast('Weder Share noch Kopieren möglich.'); }
      }
    });

    on(shareFast,'click',()=> setSeg());
  }

  /* ---------- Motivation/Rewards (nur Weitergeben-Seite) ---------- */
  function initMotivation(){
    const levelBar = $('#levelBar'); const tierList = $('#tierList');
    if (!levelBar && !tierList) return;

    const KEY_REFCOUNT='hh_ref_count_v2';
    const KEY_PCT='hh_motivation_pct_v4';

    const getC = () => { try{ return Number(localStorage.getItem(KEY_REFCOUNT)||'0')||0; }catch{ return 0; } };
    const setC = (v) => { try{ localStorage.setItem(KEY_REFCOUNT,String(v)); }catch{} };
    const setPct = (v) => {
      v=Math.max(0,Math.min(100,Math.round(v)));
      if (levelBar) levelBar.style.width=v+'%';
      try{ localStorage.setItem(KEY_PCT,String(v)); }catch{}
    };
    const updateTiers = () => {
      const c = getC();
      $$('#tierList i').forEach(i=>{
        const goal = Number(i.getAttribute('data-goal')||'1');
        const pct = Math.max(0, Math.min(100, Math.round((c/goal)*100)));
        i.style.width = pct+'%';
      });
    };

    try{ setPct(Number(localStorage.getItem(KEY_PCT)||'0')); }catch{ setPct(0); }
    updateTiers();

    // hooks (werden von share-ctas benutzt)
    window._bumpRefHalf = function(){ const c=getC()+0.5; setC(c); updateTiers(); setPct(Math.min(100, c*10)); };
    window._bumpRefFull = function(){ const c=getC()+1;   setC(c); updateTiers(); setPct(Math.min(100, c*12)); };
  }

  /* ---------- VIP Slider (Weitergeben) ---------- */
  function initVipSlider(){
    const wrap = $('#vipSlider'); if (!wrap) return;
    on($('#vipPrev'),'click',()=> wrap.scrollBy({ left:-wrap.clientWidth*.9, behavior:'smooth' }));
    on($('#vipNext'),'click',()=> wrap.scrollBy({ left: wrap.clientWidth*.9, behavior:'smooth' }));
  }

  /* ---------- Whisper einmalig ---------- */
  function initWhisperOnce(){
    const w = $('#whisper'); if (!w) return;
    const KEY='hh_whisper_seen_v4';
    try{
      if(sessionStorage.getItem(KEY)) return;
      setTimeout(()=>{ w.style.opacity='1'; w.style.transform='translateY(0)';
        setTimeout(()=>{ w.style.opacity='0'; w.style.transform='translateY(10px)'; }, 4200);
        sessionStorage.setItem(KEY,'1');
      }, 16000);
    }catch{}
  }

  /* ---------- CTA-Rotator (Weitergeben) ---------- */
  function initCtaRotator(){
    const btn = $('#shareFast'); if (!btn || media.reduced.matches) return;
    let variants=[]; try{ variants=JSON.parse(btn.getAttribute('data-cta-variants')||'[]'); }catch{}
    if(!variants.length) return;
    let i=0; setInterval(()=>{ i=(i+1)%variants.length; btn.textContent=variants[i]; btn.classList.add('pulse'); setTimeout(()=>btn.classList.remove('pulse'),800); }, 4000);
  }

  /* ---------- Anchor focus (a11y) ---------- */
  function initAnchorFocus(){
    const focusHash = () => {
      if (!location.hash) return;
      const el = document.getElementById(location.hash.slice(1));
      if (el) { el.setAttribute('tabindex','-1'); el.focus({ preventScroll:true }); }
    };
    on(window,'hashchange',focusHash);
  }

  /* ---------- Tiny toast ---------- */
  function toast(msg){
    const t = document.createElement('div');
    t.textContent = msg; t.setAttribute('role','status');
    Object.assign(t.style,{
      position:'fixed',left:'18px',bottom:'18px',zIndex:70,
      background:'rgba(11,15,22,.92)',border:'1px solid rgba(255,255,255,.14)',color:'#F6F7FB',
      borderRadius:'14px',padding:'.6rem .8rem',boxShadow:'0 12px 28px rgba(0,0,0,.38)',opacity:'0',
      transform:'translateY(10px)',transition:'opacity .25s var(--ease), transform .25s var(--ease)'
    });
    document.body.appendChild(t);
    requestAnimationFrame(()=>{ t.style.opacity='1'; t.style.transform='translateY(0)'; });
    setTimeout(()=> t.remove(), 2200);
  }

  /* ---------- INIT ---------- */
  function init(){
    initNoJs();
    initFadeUps();
    initRipple();
    initStickyCTA();
    initShortMode();      // (nur falls vorhanden)
    initHeroPreview();    // (nur falls vorhanden)
    initAmpel();          // (nur Seite 1)
    initShare();          // (beide Seiten, wenn share-box existiert)
    initMotivation();     // (Seite Weitergeben)
    initVipSlider();      // (Seite Weitergeben)
    initWhisperOnce();
    initCtaRotator();     // (Seite Weitergeben)
    initAnchorFocus();
  }
  (document.readyState==='loading') ? on(document,'DOMContentLoaded',init,{ once:true }) : init();
})();
