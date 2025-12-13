/* ============================================================
   GODMODE — CINEMATIC CUT (2026, FINAL SHARED)
   Landing + Weitergeben · iOS/Android polish · Idle motion
============================================================ */
(function(){
  "use strict";

  document.documentElement.classList.remove('no-js');
  document.querySelectorAll('#yearNow').forEach(el=> el.textContent=new Date().getFullYear());

  // Fade-in observer
  (function(){
    const pref=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const els=[...document.querySelectorAll('.fade-up')];
    if(pref){els.forEach(el=>el.classList.add('visible'));return;}
    if('IntersectionObserver'in window){
      const io=new IntersectionObserver(ents=>{
        ents.forEach(e=>{
          if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target);}
        });
      },{threshold:.12,rootMargin:'0px 0px -10% 0px'});
      els.forEach(el=>io.observe(el));
    }else{els.forEach(el=>el.classList.add('visible'));}
  })();

  // Sticky CTA (hero leaves viewport) — mobile only
  (function(){
    const el=document.getElementById('stickyCTA');
    const hero=document.querySelector('.hero');
    if(!el||!hero) return;
    if(innerWidth>=980) return;
    const show=v=>{el.style.transform=v?'translateY(0)':'translateY(100%)';el.style.opacity=v?'1':'0'};
    if('IntersectionObserver'in window){
      new IntersectionObserver(ents=>ents.forEach(e=>show(!e.isIntersecting)),{threshold:.3}).observe(hero);
      addEventListener('scroll',()=>{ if(scrollY>180) show(true); },{passive:true});
    }else{
      addEventListener('scroll',()=>show(scrollY>180),{passive:true});
    }
  })();

  // Kurzmodus (nur auf index.html sichtbar)
  (function(){
    const btn=document.getElementById('dfBtn');
    if(!btn) return;
    const keep=new Set(['hero','ethos-social','stickyCTA','share','ampel-check']);
    const nodes=[...document.querySelectorAll('main > section')].filter(s=>!keep.has(s.id));
    const set=(on)=>{
      btn.setAttribute('aria-pressed',on?'true':'false');
      btn.textContent=on?'✅ Kurzmodus aktiv':'🔍 Kurzmodus';
      nodes.forEach(n=>n.style.display=on?'none':'');
      if(on) window.scrollTo({top:0,behavior:'smooth'});
    };
    btn.addEventListener('click',()=>set(btn.getAttribute('aria-pressed')!=='true'));
    window.setKurzmodus=set;
  })();

  // Ergebnis-Vorschau Toggle (Index)
  (function(){
    const btn=document.getElementById('previewToggle');
    const box=document.getElementById('heroPreview');
    if(btn && box){
      btn.addEventListener('click',()=>{ box.style.display=box.style.display==='none'?'grid':'none'; });
    }
  })();

  // Whisper once per session
  (function(){
    const KEY='hh_whisper_seen_v4';
    try{
      if(sessionStorage.getItem(KEY)) return;
      const w=document.getElementById('whisper'); if(!w) return;
      setTimeout(()=>{
        w.style.opacity='1'; w.style.transform='translateY(0)';
        setTimeout(()=>{ w.style.opacity='0'; w.style.transform='translateY(10px)'; }, 4200);
        sessionStorage.setItem(KEY,'1');
      }, 16000);
    }catch(_){}
  })();

  // CTA Rotator (weitergeben hero button)
  (function(){
    const pref=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const btn=document.getElementById('shareFast'); if(!btn || pref) return;
    let variants=[]; try{ variants=JSON.parse(btn.getAttribute('data-cta-variants')); }catch(_){}
    if(!variants?.length) return;
    let i=0; setInterval(()=>{ i=(i+1)%variants.length; btn.textContent=variants[i]; btn.classList.add('pulse'); setTimeout(()=>btn.classList.remove('pulse'),800); }, 4000);
  })();

  // VIP slider controls (weitergeben)
  (function(){
    const wrap=document.getElementById('vipSlider'); if(!wrap) return;
    document.getElementById('vipPrev')?.addEventListener('click',()=>wrap.scrollBy({left:-wrap.clientWidth*.9,behavior:'smooth'}));
    document.getElementById('vipNext')?.addEventListener('click',()=>wrap.scrollBy({left: wrap.clientWidth*.9,behavior:'smooth'}));
  })();

  // Motivation (weitergeben)
  (function(){
    const levelBar=document.getElementById('levelBar'); if(!levelBar) return;
    const KEY_REFCOUNT='hh_ref_count_v2';
    const KEY_PCT='hh_motivation_pct_v4';
    function refCount(){ try{ return Number(localStorage.getItem(KEY_REFCOUNT)||'0')||0; }catch(_){ return 0; } }
    function setRefCount(v){ try{ localStorage.setItem(KEY_REFCOUNT,String(v)); }catch(_){} }
    function setPct(v){
      v=Math.max(0,Math.min(100,Math.round(v)));
      levelBar.style.width=v+'%';
      try{ localStorage.setItem(KEY_PCT,String(v)); }catch(_){}
    }
    function updateTiers(){
      const c=refCount();
      document.querySelectorAll('#tierList i').forEach(i=>{
        const goal=Number(i.getAttribute('data-goal')||'1');
        const pct=Math.max(0, Math.min(100, Math.round((c/goal)*100)));
        i.style.width=pct+'%';
      });
    }
    try{ setPct(Number(localStorage.getItem(KEY_PCT)||'0')); }catch(_){ setPct(0); }
    updateTiers();
    // bump helpers called by share actions
    window._bumpRefHalf = function(){ const c=refCount()+0.5; setRefCount(c); updateTiers(); setPct(Math.min(100, c*10)); };
    window._bumpRefFull = function(){ const c=refCount()+1;   setRefCount(c); updateTiers(); setPct(Math.min(100, c*12)); };
  })();

  // Share composer (beide Seiten: index & weitergeben)
  (function(){
    const name = document.getElementById('refName');
    const area = document.getElementById('refText');
    const wa   = document.getElementById('waShare');
    const mail = document.getElementById('mailShare');
    const copy = document.getElementById('copyBtn');
    const preview = document.getElementById('waPreviewText');
    if(!area) return; // Seite hat keinen Composer

    const KEY_REFID='hh_ref_rid_v2';
    function randomId(len=10){ const a='abcdefghijklmnopqrstuvwxyz0123456789'; const u=new Uint8Array(len); if(crypto.getRandomValues) crypto.getRandomValues(u); else for(let i=0;i<len;i++) u[i]=Math.random()*256; return Array.from(u,x=>a[x%a.length]).join(''); }
    function getRefId(){ try{ return localStorage.getItem(KEY_REFID) || (localStorage.setItem(KEY_REFID,randomId()), localStorage.getItem(KEY_REFID)); }catch(_){ return randomId(); } }
    function sanitize(n){ return n ? n.replace(/[^a-z0-9]/gi,'').toLowerCase() : ''; }

    function buildURL(){
      const base=new URL('https://heikohaerter.com');
      base.searchParams.set('utm_source','weitergeben');
      base.searchParams.set('utm_medium','share');
      base.searchParams.set('utm_campaign','check');
      const rid=getRefId(); base.searchParams.set('rid', rid);
      const alias=sanitize((name?.value||'').trim());
      if(alias) base.searchParams.set('ref', alias+'.'+rid.slice(0,5));
      return base.toString();
    }

    function variants(){ try{ return JSON.parse(area.getAttribute('data-variants')); }catch(_){ return {neutral:[]}; } }
    function detectSeg(){
      const raw=(name?.value||'').toLowerCase();
      if(/(papa|mama|vater|mutter|eltern)/.test(raw)) return 'eltern';
      if(/(chef|manager|kolleg|team|büro)/.test(raw)) return 'kollegen';
      if(/(freund|kumpel|bff|buddy|schatz)/.test(raw)) return 'freunde';
      if(/(selbständig|selbstständig|freelance|freiberuf)/.test(raw)) return 'selbst';
      if(/(partner|ehefrau|ehemann|verlobt)/.test(raw)) return 'partner';
      return 'neutral';
    }
    function pick(seg){ const sets=variants(); const pool=(sets[seg]||sets.neutral||[]); if(!pool.length) return ''; const i=Math.floor(Math.random()*pool.length); return pool[i]; }
    function ensureURL(text){ return /\bhttps?:\/\/\S+/i.test(text) ? text : (text.trim()+' '+buildURL()); }
    function setTextFrom(seg){ const tmpl=pick(seg||detectSeg()); if(!tmpl) return; area.value=tmpl.replace(/\{\{URL\}\}/g, buildURL()); updateLinks(); }
    function plain(){ return (area.value||'').replace(/\n+/g,' ').trim(); }
    function updateLinks(){
      const t=ensureURL(plain());
      wa && (wa.href='https://wa.me/?text='+encodeURIComponent(t));
      mail && (mail.href='mailto:?subject='+encodeURIComponent('Kurzer Blick')+'&body='+encodeURIComponent(t));
      preview && (preview.textContent = t.length<=190 ? t : t.substring(0,t.lastIndexOf(' ',190))+'…');
    }

    if(area && !area.value){ setTextFrom('neutral'); } updateLinks();

    // events
    document.querySelectorAll('.seg-btn').forEach(b=>{
      b.addEventListener('click', ()=>{ setTextFrom(b.getAttribute('data-seg')); window._bumpRefHalf?.(); });
    });
    name?.addEventListener('input', ()=> setTextFrom(), {passive:true});
    area?.addEventListener('input', updateLinks, {passive:true});

    document.getElementById('readyMsg')?.addEventListener('click', ()=>{
      setTextFrom(); window._bumpRefHalf?.();
      const toast=document.createElement('div');
      toast.textContent='Fertiger Text eingefügt ✔️';
      toast.className='whisper';
      const base=document.getElementById('whisper');
      toast.style.cssText= base ? base.style.cssText : 'position:fixed;left:18px;bottom:18px;z-index:70;background:#0b0f16;border:1px solid #333;color:#fff;border-radius:14px;padding:.6rem .8rem;opacity:0;transform:translateY(10px);transition:opacity .25s ease, transform .25s ease';
      document.body.appendChild(toast);
      setTimeout(()=>{ toast.style.opacity='1'; toast.style.transform='translateY(0)'; },10);
      setTimeout(()=>toast.remove(),1800);
    });

    document.getElementById('magicLine')?.addEventListener('click', ()=>{
      const line='Hey, hab das gerade gesehen – dachte sofort an dich.';
      const cur=(area.value||'').trim();
      area.value = cur ? line+'\n\n'+cur : line+'\n\n'+buildURL();
      updateLinks(); window._bumpRefHalf?.();
    });

    document.getElementById('addPersonal')?.addEventListener('click', ()=>{
      const alias=(name?.value||'').trim()||'Hey';
      area.value = (area.value||'') + `\n\n${alias.split(' ')[0]}, dachte an dich, weil …`;
      updateLinks(); window._bumpRefHalf?.();
    });

    copy?.addEventListener('click', async ()=>{
      try{ await navigator.clipboard.writeText(ensureURL(area.value)); }
      catch(_){ area.select(); document.execCommand && document.execCommand('copy'); }
      window._bumpRefHalf?.();
    });

    document.getElementById('waShare')?.addEventListener('click', ()=> window._bumpRefFull?.());
    document.getElementById('mailShare')?.addEventListener('click', ()=> window._bumpRefFull?.());
    document.getElementById('nativeShare')?.addEventListener('click', async ()=>{
      const t=ensureURL(area.value); const url=buildURL();
      if(navigator.share){ try{ await navigator.share({title:'2-Minuten-Blick', text:t, url}); window._bumpRefFull?.(); }catch(_){} }
    });

    document.getElementById('shareFast')?.addEventListener('click', ()=>{ setTextFrom(); window._bumpRefHalf?.(); });
  })();

  // Ampel-Check (index)
  (function() {
    let step=1, score=0;
    const max=3;
    const startBtn=document.getElementById('startCheckBtn');
    const stepsWrap=document.getElementById('check-steps');
    const resultBox=document.getElementById('check-result');
    const stepLabel=document.getElementById('stepLabel');
    const progress=document.getElementById('progressBar');
    const stepHint=document.getElementById('stepHint');

    if(!stepsWrap || !resultBox) return;

    function updateHead(){
      stepLabel.textContent=`Schritt ${Math.min(step,max)} von ${max}`;
      const pct = ((Math.min(step-1,max-1))/(max-1))*100;
      progress.style.width = (max===1?100:pct)+'%';
      stepHint.textContent= step===1?'Kurzer Eindruck reicht.': step===2?'Fast geschafft.':'Letzter Klick.';
    }
    function showStep(n){
      document.querySelectorAll('#check-steps .step').forEach(s=>s.style.display='none');
      const t=document.querySelector(`#check-steps .step[data-step="${n}"]`);
      if(t){ t.style.display='block'; t.scrollIntoView({behavior:'smooth',block:'start'}); }
      updateHead();
    }
    function renderCTA(color){
      const wa='https://wa.me/4917660408380?text=';
      if(color==='red') return `<div class="stack" style="text-align:center">
        <a href="${wa}Kurz%2010%20Minuten%20sprechen" class="btn btn-primary">💬 Kurz sprechen – 10 Minuten</a>
        <a href="${wa}Kurze%20Frage%20senden" class="btn btn-ghost">🛟 Frage senden</a></div>`;
      if(color==='yellow') return `<div class="stack" style="text-align:center">
        <a href="${wa}Als%20N%C3%A4chstes%20angehen" class="btn btn-primary">🧭 Als Nächstes angehen</a>
        <a href="${wa}Kurze%20Frage%20senden" class="btn btn-ghost">💬 Frage senden</a></div>`;
      return `<div class="stack" style="text-align:center">
        <a href="${wa}Smarter%20machen%3F" class="btn btn-primary">✨ Smarter machen?</a>
        <a href="/weitergeben.html#share" class="btn btn-ghost">🔗 Weitergeben</a></div>`;
    }
    funct
