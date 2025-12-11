// ==========================================================================
// app.js — GODMODE Edition 2026
// Ultra-lite Neuro-UX Engine · Zero-Pressure by Design
// Modules: motion, ampel, persona, referral, quiz, proof, live feed, CTA
// ==========================================================================

(() => {
  'use strict';

  /* ---------------------------- Helpers ---------------------------- */
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const on = (el, evt, fn, opt) => el?.addEventListener(evt, fn, opt);

  const store = {
    get:(k,d)=>{ try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch{return d;} },
    set:(k,v)=>{ try{localStorage.setItem(k,JSON.stringify(v));}catch{} },
    getRaw:(k,d)=>{ try{const v=localStorage.getItem(k);return v??d;}catch{return d;} },
    setRaw:(k,v)=>{ try{localStorage.setItem(k,String(v));}catch{} }
  };

  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const observeOnce = (sel, opt, cb) => {
    const els = Array.isArray(sel) ? sel : $$(sel);
    if (!('IntersectionObserver' in window) || prefersReduced) {
      els.forEach(el => cb?.(el,true));
      return;
    }
    const io = new IntersectionObserver((ents)=>{
      ents.forEach(e=>{
        if(e.isIntersecting){ cb?.(e.target,true); io.unobserve(e.target); }
      });
    }, opt || {threshold:.12});
    els.forEach(el=>io.observe(el));
  };

  /* ---------------------------- Motion ---------------------------- */
  function initMotion(){
    if(prefersReduced){
      $$('.fade-up,.fade-slide,.pop-in').forEach(el=>el.classList.add('visible'));
      return;
    }
    observeOnce('.fade-up,.fade-slide,.pop-in', {}, el=>{
      el.classList.add('visible');
    });
  }

  /* ---------------------------- Decision Anchor ---------------------------- */
  function initDecisionAnchor(){
    const el = $('#decision-anchor');
    if(!el) return;
    const onScroll = ()=>{
      const show = window.scrollY > 180;
      el.classList.toggle('show', show);
    };
    on(window,'scroll',onScroll,{passive:true});
    onScroll();
  }

  /* ---------------------------- Sticky CTA ---------------------------- */
  function initStickyCTA(){
    const sticky = $('#sticky-cta') || $('#stickyCTA');
    if(!sticky) return;

    const btn = $('.btn', sticky);
    let heroVisible = false;

    if('IntersectionObserver' in window){
      const heroCTA = $('#hero-cta') || $('#startCheckHero');
      if(heroCTA){
        new IntersectionObserver(([e])=>{
          heroVisible = e.isIntersecting;
          if(heroVisible) sticky.classList.remove('show');
        },{threshold:.4}).observe(heroCTA);
      }
    }

    const check = ()=>{
      const doc = document.documentElement;
      const sc = doc.scrollTop || 0;
      const max = doc.scrollHeight - doc.clientHeight;
      const ratio = sc / (max || 1);
      const should = ratio > 0.30 && !heroVisible;
      sticky.classList.toggle('show', should);
      sticky.setAttribute('aria-hidden', String(!should));
    };

    on(window,'scroll',check,{passive:true});
    on(window,'resize',check);
    check();

    on(btn,'click',()=>{
      const tSel = btn.getAttribute('data-target');
      const t = tSel ? $(tSel) : $('#quiz');
      t?.scrollIntoView({behavior:'smooth'});
    });
  }

  /* ---------------------------- Auto Highlight (Keywords) ---------------------------- */
  function initCriticalHighlight(){
    const words = ['2 Minuten','anonym','Klarheit','Vorteil','kein Verkauf','ruhig','25 €'];
    const skip = new Set(['SCRIPT','STYLE','NOSCRIPT','CODE','PRE','TEXTAREA']);

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(n){
        const p = n.parentElement;
        if(!p || skip.has(p.tagName)) return NodeFilter.FILTER_REJECT;
        if(p.closest('.critical-highlight')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    const re = new RegExp(`\\b(${words.map(w=>w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')})\\b`,'gi');
    const nodes = [];
    while(walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach(n=>{
      const t = n.nodeValue; if(!re.test(t)) return;
      const span = document.createElement('span');
      span.innerHTML = t.replace(re, m=>`<span class="critical-highlight">${m}</span>`);
      n.parentNode.replaceChild(span,n);
    });
  }

  /* ---------------------------- Ampel Animation ---------------------------- */
  function initAmpel(){
    const ampel = $('.ampel');
    if(!ampel) return;
    const lights = $$('.ampel-light', ampel);
    if(!lights.length) return;

    lights.forEach(l=>{
      l.style.opacity = '0.25';
      l.style.transition = 'opacity .5s cubic-bezier(.22,.61,.36,1)';
    });

    observeOnce([ampel], {threshold:.6}, ()=>{
      const [r,y,g] = lights;
      setTimeout(()=>r.style.opacity='1',50);
      setTimeout(()=>y.style.opacity='1',700);
      setTimeout(()=>g.style.opacity='1',1400);
      setTimeout(()=>lights.forEach(l=>l.style.opacity=''),2400);
    });
  }

  /* ---------------------------- Persona System ---------------------------- */
  function initPersona(){
    const cards = $$('.persona-card'); if(!cards.length) return;

    const set = (el)=>{
      cards.forEach(c=>c.classList.toggle('is-active', c===el));
      const t = (el.querySelector('.persona-title')?.textContent || '').toLowerCase();

      let seg='neutral';
      if(t.includes('famil')) seg='eltern';
      else if(t.includes('selbst')) seg='selbst';
      else if(t.includes('angestellt')) seg='freunde';

      store.setRaw('hh.share.seg',seg);
      store.setRaw('hh.persona.active',seg);

      const feed = $('#live-messages');
      if(feed && feed.firstElementChild){
        feed.firstElementChild.textContent = '„Gerade empfohlen – 2 Minuten Orientierung.“';
      }
    };

    const saved = store.getRaw('hh.persona.active');
    if(saved){
      const match = cards.find(c=>{
        const t=c.textContent.toLowerCase();
        return (saved==='eltern' && t.includes('famil')) ||
               (saved==='selbst' && t.includes('selbst')) ||
               (saved==='freunde' && t.includes('angestellt'));
      });
      if(match) set(match);
    }

    cards.forEach(c=>{
      on(c,'click',()=>set(c));
      on(c,'keydown',e=>{
        if(e.key==='Enter' || e.key===' '){ e.preventDefault(); set(c); }
      });
    });
  }

  /* ---------------------------- Live Feed ---------------------------- */
  function initLiveFeed(){
    const ul = $('#live-messages'); if(!ul) return;
    const get = ()=>$$('#live-messages li');

    if(get().length < 2) return;

    setInterval(()=>{
      const first = get()[0];
      if(!first) return;
      first.style.opacity='0';
      first.style.transition='opacity .35s cubic-bezier(.22,.61,.36,1)';
      setTimeout(()=>{ ul.appendChild(first); first.style.opacity=''; },380);
    }, 5000);
  }

  /* ---------------------------- Proof Bars ---------------------------- */
  function initProofBars(){
    $$('.proof-bar').forEach(bar=>{
      const fill = $('span', bar) || document.createElement('span');
      if(!fill.parentNode) bar.appendChild(fill);
      const v = Number(bar.getAttribute('data-value')||0);
      observeOnce([bar], {threshold:.3}, ()=>{ fill.style.width = Math.min(100,Math.max(0,v))+'%'; });
    });
  }

  /* ---------------------------- Quiz Wizard ---------------------------- */
  function initQuiz(){
    const quiz = $('#quiz'); if(!quiz) return;

    const steps = $$('.quiz-step',quiz);
    const bar = $('[data-progress]',quiz);
    const stepText = $('[data-step]',quiz);
    const result = $('#quiz-result',quiz);
    const slotsWrap = $('#slot-generator',quiz);

    let i = 0;
    const answers = [];

    const go = (n)=>{
      steps.forEach((s,idx)=> s.hidden = idx !== n);
      i = n;
      bar.style.width = ((n)/steps.length)*100 + '%';
      if(stepText) stepText.textContent = String(n+1);
    };

    const interpret = ()=>{
      const score = answers.reduce((a,v)=> a + (v==='rot'?0:v==='gelb'?1:2), 0);
      const pct = Math.round((score / (answers.length*2)) * 100);
      const containsRed = answers.includes('rot');
      const containsYellow = answers.includes('gelb');
      const state = containsRed ? 'rot' : containsYellow ? 'gelb' : 'gruen';
      return {state,pct};
    };

    const summary = (answers,pct,state)=>{
      const head = state==='rot'
        ? 'Heute wichtig – ruhig anschauen.'
        : state==='gelb'
        ? 'Bald wichtig – einplanen.'
        : 'Passt – ruhig bleiben.';
      return `${head} Gefühl: ${pct}% Orientierung.`;
    };

    const generateSlots = ()=>{
      const out=[]; const now=new Date();
      const today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
      const tomorrow=new Date(today); tomorrow.setDate(today.getDate()+1);

      const make=(d,h,m,type)=>{
        const dt=new Date(d.getFullYear(),d.getMonth(),d.getDate(),h,m);
        const fmt=new Intl.DateTimeFormat('de-DE',{weekday:'short',hour:'2-digit',minute:'2-digit'}).format(dt);
        out.push({label:fmt,type});
      };

      const add=(day,type)=>{
        for(let h=9;h<=18;h++){
          make(day,h,0,type);
          if(out.length>=5) break;
        }
      };

      add(today,'today');
      add(tomorrow,'tomorrow');
      return out.filter(s=>s.type==='tomorrow' || new Date() < new Date(today.getFullYear(), today.getMonth(), today.getDate(), parseInt(s.label.slice(4,6)))).slice(0,5);
    };

    const renderResult = ()=>{
      const {state,pct} = interpret();
      result.hidden = false;
      $('.result-title',result).textContent =
        state==='rot' ? '🔴 Heute wichtig'
      : state==='gelb'? '🟡 Bald wichtig'
      : '🟢 Passt – gelassen bleiben';

      $('.result-note',result).textContent = summary(answers,pct,state);

      const slots = generateSlots();
      if(slotsWrap){
        slotsWrap.innerHTML='';
        slots.forEach(s=>{
          const div=document.createElement('div');
          div.className = 'slot '+(s.type==='today'?'slot-today':'slot-tomorrow');
          div.textContent = s.label;
          slotsWrap.appendChild(div);
        });
      }

      result.scrollIntoView({behavior:'smooth'});
    };

    steps.forEach((s,idx)=>{
      $$('.pill',s).forEach(btn=>{
        on(btn,'click',()=>{
          const val = btn.getAttribute('data-value');
          answers[idx] = val || 'gruen';
          if(idx < steps.length-1) go(idx+1);
          else { steps.forEach(x=>x.hidden=true); renderResult(); }
        });
      });
    });

    result.hidden = true;
    go(0);
  }

  /* ---------------------------- Referral Engine ---------------------------- */
  function initReferral(){
    const tpl = $('#ref2-templates');
    const msg = $('#ref2-message');
    const name = $('#ref2-name');
    const copy = $('#ref2-copy');
    const share = $('#ref2-share');
    const toneBtns = $$('.ref2-tone');
    const segBtns = $$('.ref2-seg');

    if(!tpl || !msg) return;

    let templates={};
    try{ templates=JSON.parse(tpl.textContent); }catch{}

    const KEY='hh.ref2.id';
    const rand=(n=10)=>{
      const A='abcdefghijklmnopqrstuvwxyz0123456789';
      try{
        const u=new Uint8Array(n); crypto.getRandomValues(u);
        return [...u].map(x=>A[x%A.length]).join('');
      }catch{ return Array(n).fill().map(()=>A[(Math.random()*A.length)|0]).join(''); }
    };
    const getId = ()=> store.getRaw(KEY) || (store.setRaw(KEY,rand()), store.getRaw(KEY));

    const sanitize = v => v ? v.replace(/[^a-z0-9]/gi,'').toLowerCase() : '';

    const buildURL = ()=>{
      const u = new URL('https://heikohaerter.com');
      u.searchParams.set('utm_source','weitergeben');
      u.searchParams.set('utm_medium','share');
      u.searchParams.set('utm_campaign','check');
      const rid = getId(); u.searchParams.set('rid',rid);
      const alias = sanitize((name?.value||'').trim());
      if(alias) u.searchParams.set('ref',alias+'.'+rid.slice(0,5));
      return u.toString();
    };

    const toneMap = {
      locker:'Locker',
      kurz:'Kurz',
      ergebnisorientiert:'Ergebnisorientiert',
      familie:'Familie',
      'selbstständig':'Selbstständig'
    };

    let tone = store.getRaw('hh.ref2.tone') || 'locker';
    let seg  = store.getRaw('hh.ref2.seg') || 'freund';

    const render = ()=>{
      const key = toneMap[tone] || 'Locker';
      const raw = templates[key] || Object.values(templates)[0] || '';
      msg.textContent = raw.replace(/\{\{URL\}\}/g,buildURL()).replace(/[„”"]/g,'');
      const t = $('.wa-time'); if(t) t.textContent='jetzt';
    };

    const setTone = k=>{
      toneBtns.forEach(b=>b.setAttribute('aria-pressed', String(b.getAttribute('data-tone')===k)));
      tone=k;
      store.setRaw('hh.ref2.tone',k);
      render();
    };

    const setSeg = k=>{
      segBtns.forEach(b=>b.setAttribute('aria-pressed', String(b.getAttribute('data-seg')===k)));
      seg=k;
      const m={freund:'freunde',familie:'eltern',kollege:'kollegen',selbststaendig:'selbst'};
      store.setRaw('hh.share.seg',m[k]||'neutral');
      store.setRaw('hh.ref2.seg',k);
      render();
    };

    const ensureURL = t => /\bhttps?:\/\//.test(t) ? t : t+' '+buildURL();

    on(copy,'click',async()=>{
      try{
        const t = ensureURL(msg.textContent||'');
        if(navigator.clipboard) await navigator.clipboard.writeText(t);
        else{
          const ta=document.createElement('textarea');
          ta.value=t; document.body.appendChild(ta); ta.select();
          document.execCommand('copy'); ta.remove();
        }
      }catch{}
    });

    on(share,'click',()=>{
      const t = ensureURL(msg.textContent||'');
      window.open('https://wa.me/?text='+encodeURIComponent(t),'_blank','noopener');
    });

    toneBtns.forEach(b=>on(b,'click',()=>setTone(b.getAttribute('data-tone'))));
    segBtns.forEach(b=>on(b,'click',()=>setSeg(b.getAttribute('data-seg'))));
    on(name,'input',render,{passive:true});

    setTone(tone);
    setSeg(seg);
    render();
  }

  /* ---------------------------- Bottom Nav ---------------------------- */
  function initBottomNav(){
    const nav = $('.bottom-nav'); if(!nav) return;
    const items = $$('a.nav-item',nav);
    if(!items.length) return;

    const map = items.map(a=>{
      const href=a.getAttribute('href')||'';
      if(!href.startsWith('#')) return null;
      const sec=document.getElementById(href.slice(1));
      return sec?{a,sec}:null;
    }).filter(Boolean);

    const update=()=>{
      let best=-1, idx=-1;
      map.forEach((m,i)=>{
        const r=m.sec.getBoundingClientRect();
        const score=Math.min(innerHeight, Math.max(0,innerHeight - Math.abs(r.top-innerHeight*.35)));
        if(score>best){best=score; idx=i;}
      });
      map.forEach((m,i)=>m.a.classList.toggle('is-active',i===idx));
    };

    on(window,'scroll',update,{passive:true});
    on(window,'resize',update);
    update();
  }

  /* ---------------------------- Boot ---------------------------- */
  function init(){
    document.documentElement.classList.remove('no-js');
    $$('#yearNow,[data-year]').forEach(el=>el.textContent=String(new Date().getFullYear()));

    initMotion();
    initDecisionAnchor();
    initCriticalHighlight();
    initAmpel();
    initPersona();
    initLiveFeed();
    initProofBars();
    initQuiz();
    initReferral();
    initBottomNav();
    initStickyCTA();
  }

  (document.readyState==='loading')
    ? on(document,'DOMContentLoaded',init,{once:true})
    : init();

})();
