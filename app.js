/* ==========================================================================
app.js — Production-grade Calm-UX engine (2026)
Vanilla JS • defer-loaded • modular • single namespace window.app
Implements: decision anchor, auto-highlight, motion, ampel, personas,
live feed, proof bars, quiz wizard (summary + slots), referral engine,
bottom nav, sticky CTA.
========================================================================== */

(() => {
'use strict';

/* ---------------------------- Core helpers ---------------------------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const on = (el, t, fn, o) => el?.addEventListener?.(t, fn, o);
const off = (el, t, fn, o) => el?.removeEventListener?.(t, fn, o);

const MM = (q) => {
try { return matchMedia(q); } catch { return { matches:false, addEventListener(){} }; }
};
const prefersReduced = MM('(prefers-reduced-motion: reduce)').matches;

const store = (() => {
try {
const k='__probe'; localStorage.setItem(k,'1'); localStorage.removeItem(k);
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

const inViewport = (el, ratio = 0.01) => {
if (!el) return false;
const r = el.getBoundingClientRect();
const vh = window.innerHeight || document.documentElement.clientHeight;
const vw = window.innerWidth || document.documentElement.clientWidth;
const visibleX = Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0));
const visibleY = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
const visibleArea = visibleX * visibleY;
const totalArea = r.width * r.height || 1;
return (visibleArea / totalArea) >= ratio;
};

const observeOnce = (targets, options, onEnter) => {
const els = Array.isArray(targets) ? targets : $$(targets);
if (!('IntersectionObserver' in window) || !els.length) {
els.forEach((el) => onEnter?.(el, true));
return null;
}
const io = new IntersectionObserver((entries) => {
entries.forEach((e) => {
if (e.isIntersecting) { onEnter?.(e.target, true, e); io.unobserve(e.target); }
});
}, options || { threshold:.12, rootMargin:'0px 0px -10% 0px' });
els.forEach((el) => io.observe(el));
return io;
};

const toast = (msg) => {
const base = $('#whisper');
const t = document.createElement('div');
t.className='whisper';
t.role='status';
t.setAttribute('aria-live','polite');
t.textContent=msg;
t.style.cssText = base?.style.cssText || 'position:fixed;left:18px;bottom:18px;z-index:70;background:rgba(11,15,22,.92);border:1px solid rgba(255,255,255,.14);color:#F6F7FB;border-radius:14px;padding:.6rem .8rem;box-shadow:0 12px 28px rgba(0,0,0,.38);opacity:0;transform:translateY(10px);transition:opacity .25s cubic-bezier(.22,.61,.36,1), transform .25s cubic-bezier(.22,.61,.36,1)';
document.body.appendChild(t);
requestAnimationFrame(()=>{ t.style.opacity='1'; t.style.transform='translateY(0)'; });
setTimeout(()=> t.remove(), 2000);
};

/* ------------------------------- Modules ------------------------------- */

// Decision Anchor — appears after 180px scroll
function initDecisionAnchor() {
const bar = $('#decision-anchor');
if (!bar) return;
const onScroll = () => {
const show = window.scrollY > 180;
bar.classList.toggle('show', show);
};
on(window, 'scroll', onScroll, { passive:true });
onScroll();
}

// Auto Highlighting — wrap target keywords in <span class="critical-highlight">
function initAutoHighlightCriticalText() {
const KEYWORDS = [
'2 Minuten',
'anonym',
'Klarheit',
'Vorteil',
'kein Verkauf',
'Ruhe',
'25 €'
];

const skip = new Set(['SCRIPT','STYLE','NOSCRIPT','CODE','PRE','TEXTAREA']);
const root = document.body;
if (!root) return;

const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
  acceptNode(node) {
    const p = node.parentElement;
    if (!p) return NodeFilter.FILTER_REJECT;
    if (skip.has(p.tagName)) return NodeFilter.FILTER_REJECT;
    if (p.closest('.critical-highlight')) return NodeFilter.FILTER_REJECT;
    const t = node.nodeValue;
    return (t && /[A-Za-zÄÖÜäöü0-9]/.test(t)) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
  }
});

const re = new RegExp(`\\b(${KEYWORDS.map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')})\\b`, 'gi');

const nodes = [];
while (walker.nextNode()) nodes.push(walker.currentNode);

nodes.forEach(node => {
  const txt = node.nodeValue;
  if (!re.test(txt)) return;
  const span = document.createElement('span');
  span.innerHTML = txt.replace(re, (m) => `<span class="critical-highlight">${m}</span>`);
  node.parentNode.replaceChild(span, node);
});


}

// Motion Engine — IntersectionObserver adds .visible
function initFadeUp() {
if (prefersReduced) { $$('.fade-up,.fade-slide,.pop-in').forEach(el=>el.classList.add('visible')); return; }
observeOnce('.fade-up,.fade-slide,.pop-in', { threshold:.12, rootMargin:'0px 0px -10% 0px' }, (el)=> el.classList.add('visible'));
}

// Hero Ampel Animation — fade red → yellow → green on first view
function initHeroAmpelAnimation() {
const ampel = $('.ampel');
if (!ampel) return;
const lights = $$('.ampel-light', ampel);
if (lights.length !== 3) return;

// prepare
lights.forEach(l => { l.style.opacity = '0.25'; l.style.transition = 'opacity .5s var(--ease-smooth, cubic-bezier(.22,.61,.36,1))'; });

observeOnce([ampel], { threshold:.6 }, () => {
  const [red, yellow, green] = lights;
  setTimeout(()=> red.style.opacity='1', 50);
  setTimeout(()=> yellow.style.opacity='1', 700);
  setTimeout(()=> green.style.opacity='1', 1400);
  // settle
  setTimeout(()=> lights.forEach(l=> l.style.opacity=''), 2400);
});


}

// Persona System — updates share logic + lightweight copy
function initPersonaSelection() {
const cards = $$('.persona-card');
if (!cards.length) return;

const KEY = 'hh.persona.active';
const setActive = (el) => {
  cards.forEach(c=> c.classList.toggle('is-active', c===el));
  const persona = el?.querySelector('h3')?.textContent?.trim().toLowerCase() || '';
  // map to share segments
  let seg = 'neutral';
  if (persona.includes('famil')) seg = 'eltern';
  else if (persona.includes('selbst')) seg = 'selbst';
  else if (persona.includes('angestellt')) seg = 'freunde';
  store.setRaw('hh.share.seg', seg);
  store.setRaw(KEY, seg);
  // optional: nudge live feed headline (subtle)
  const feed = $('#live-messages');
  if (feed && feed.firstElementChild) {
    feed.firstElementChild.textContent = '„Gerade empfohlen – in 2 Minuten mehr Klarheit.“';
  }
};

// restore
const saved = store.getRaw('hh.persona.active');
if (saved) {
  const match = cards.find(c => {
    const h = c.querySelector('h3')?.textContent?.toLowerCase() || '';
    return (saved==='eltern' && h.includes('famil')) ||
           (saved==='selbst' && h.includes('selbst')) ||
           (saved==='freunde' && h.includes('angestellt'));
  });
  if (match) setActive(match);
}

cards.forEach(c => on(c,'click', ()=> setActive(c)));
cards.forEach(c => on(c,'keydown', e=>{ if (e.key==='Enter' || e.key===' ') { e.preventDefault(); setActive(c); } }));


}

// Live Feed — rotate every 5s
function initLiveFeed() {
const ul = $('#live-messages'); if (!ul) return;
const items = () => $$('#live-messages li');
if (items().length < 2) return;

setInterval(()=>{
  const first = items()[0]; if (!first) return;
  first.style.opacity='0';
  first.style.transition='opacity .35s var(--ease-smooth, cubic-bezier(.22,.61,.36,1))';
  setTimeout(()=>{ ul.appendChild(first); first.style.opacity=''; }, 380);
}, 5000);


}

// Proof Bars — animate target widths
function initProofBars() {
$$('.proof-bar').forEach(bar => {
const span = $('span', bar) || document.createElement('span');
if (!span.parentNode) bar.appendChild(span);
const v = Math.max(0, Math.min(100, Number(bar.getAttribute('data-value')||'0')));
observeOnce([bar], { threshold:.35 }, ()=> { span.style.width = v + '%'; });
});
}

// Quiz Wizard 2026 — 3 steps, pills, auto-summary, ampel output
function initQuizWizard() {
const quiz = $('#quiz'); if (!quiz) return;

const steps = $$('.quiz-step', quiz);
const progress = $('[data-progress]', quiz);
const stepText = $('[data-step]', quiz);
const result = $('#quiz-result', quiz);
const resultTitle = $('#quiz-result-title', quiz);
const resultText = $('#quiz-result-text', quiz);
const slotsWrap = $('#quiz-slots', quiz);

if (!steps.length || !progress || !result) return;

let current = 0;
const answers = [];

const goto = (i) => {
  steps.forEach((s, idx)=> s.hidden = idx !== i);
  current = i;
  const pct = Math.round(((i)/ (steps.length)) * 100);
  progress.style.width = pct + '%';
  if (stepText) stepText.textContent = String(Math.min(i+1, steps.length));
};

const interpret = () => {
  // rule: "Keine Ahnung" → Rot, "Unsicher" → Gelb, sonst → Grün
  const colors = answers.map(v => {
    if (v==='rot') return 'rot';
    if (v==='gelb') return 'gelb';
    return 'gruen';
  });
  const score = colors.reduce((acc,c)=> acc + (c==='rot'?0 : c==='gelb'?1 : 2), 0);
  const max = colors.length * 2;
  const pct = Math.round((score / max) * 100);

  let state = 'gruen';
  if (colors.includes('rot')) state = 'rot';
  else if (colors.includes('gelb')) state = 'gelb';

  return { state, pct, colors };
};

const showResult = () => {
  const { state, pct } = interpret();
  result.hidden = false;
  resultTitle.textContent = (state==='rot') ? '🔴 Heute wichtig'
                      : (state==='gelb') ? '🟡 Bald wichtig'
                      : '🟢 Passt – gelassen bleiben';
  resultText.textContent = generateSummary(answers, pct, state);
  const slots = generateTimeSlots(5);
  if (slotsWrap) {
    slotsWrap.innerHTML = '';
    slots.forEach(s => {
      const div = document.createElement('div');
      div.className = 'slot';
      if (s.type==='today') div.classList.add('slot-today');
      if (s.type==='tomorrow') div.classList.add('slot-tomorrow');
      div.textContent = s.label;
      slotsWrap.appendChild(div);
    });
  }
  result.scrollIntoView({ behavior:'smooth', block:'start' });
};

// attach answers
steps.forEach((s, idx) => {
  $$('.answer', s).forEach(btn => {
    on(btn, 'click', () => {
      const val = btn.getAttribute('data-value'); // rot/gelb/gruen
      answers[idx] = (val || 'gruen');
      if (idx < steps.length - 1) {
        goto(idx+1);
      } else {
        // final
        steps.forEach(x=> x.hidden = true);
        showResult();
      }
    });
  });
});

// init
result.hidden = true;
goto(0);


}

// Auto-summary for quiz result
function generateSummary(answers, pct, state) {
const mapWord = { rot:'Keine Ahnung', gelb:'Unsicher', gruen:'Passt' };
const readable = answers.map(a => mapWord[a] || '').filter(Boolean);
const head = (state==='rot') ? 'Heute wichtig – ruhig draufschauen.'
: (state==='gelb') ? 'Bald wichtig – einplanen.'
: 'Passt – Fokus auf Ruhe.';
return ${head} Einschätzung: ${readable.join(' · ')}. Gefühl: ${pct}% sicher.;
}

// Time slot generator (today + tomorrow, 5 slots, 30-min steps, daytime window)
function generateTimeSlots(n = 5) {
const out = [];
const now = new Date();
const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Berlin';

const make = (d, h, m, type) => {
  const dt = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m, 0);
  const label = new Intl.DateTimeFormat('de-DE', { weekday:'short', hour:'2-digit', minute:'2-digit', timeZone: tz }).format(dt);
  out.push({ date: dt, label, type });
};

// window: 09:00–18:00 every 60 min, prefer next feasible slots
const addDaySlots = (dayDate, type) => {
  for (let hour = 9; hour <= 18 && out.length < n; hour += 1) {
    make(dayDate, hour, 0, type);
  }
};

// today first, then tomorrow
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const tomorrow = new Date(today); tomorrow.setDate(today.getDate()+1);

addDaySlots(today, 'today');
addDaySlots(tomorrow, 'tomorrow');

// prune past times today
const filtered = out.filter(s => s.type==='tomorrow' || s.date.getTime() > now.getTime());
return filtered.slice(0, n);


}

// Referral Engine (weitergeben.html — HTML-only structure)
function initReferralEngine() {
const tplEl = $('#ref2-templates');
const msgEl = $('#ref2-message');
const nameEl = $('#ref2-name');
const copyBtn = $('#ref2-copy');
const shareBtn = $('#ref2-share');
const toneBtns = 
(
′
.
𝑟
𝑒
𝑓
2
−
𝑡
𝑜
𝑛
𝑒
′
)
;
𝑐
𝑜
𝑛
𝑠
𝑡
𝑠
𝑒
𝑔
𝐵
𝑡
𝑛
𝑠
=
(
′
.ref2−tone
′
);constsegBtns=('.ref2-seg');

if (!tplEl || !msgEl) return;

// Parse templates (keys: Locker, Kurz, Ergebnisorientiert, Familie, Selbstständig)
let templates = {};
try { templates = JSON.parse(tplEl.textContent); } catch { templates = {}; }

const KEY_REFID='hh.ref2.id';
const randomId = (len=10) => {
  const A='abcdefghijklmnopqrstuvwxyz0123456789';
  try { const u=new Uint8Array(len); crypto.getRandomValues(u); return Array.from(u,x=>A[x%A.length]).join(''); }
  catch { let s=''; for(let i=0;i<len;i++) s+=A[(Math.random()*A.length)|0]; return s; }
};
const getId = () => store.getRaw(KEY_REFID) || (store.setRaw(KEY_REFID, randomId()), store.getRaw(KEY_REFID));

const sanitize = (v) => (v ? v.replace(/[^a-z0-9]/gi,'').toLowerCase() : '');

const buildURL = () => {
  const u = new URL('https://heikohaerter.com');
  u.searchParams.set('utm_source','weitergeben');
  u.searchParams.set('utm_medium','share');
  u.searchParams.set('utm_campaign','check');
  const rid = getId(); u.searchParams.set('rid', rid);
  const alias = sanitize((nameEl?.value||'').trim());
  if (alias) u.searchParams.set('ref', `${alias}.${String(rid).slice(0,5)}`);
  return u.toString();
};

let tone = store.getRaw('hh.ref2.tone') || 'Locker';
let seg  = store.getRaw('hh.ref2.seg')  || 'freund';

const toneMap = {
  locker:'Locker',
  kurz:'Kurz',
  ergebnisorientiert:'Ergebnisorientiert',
  familie:'Familie',
  'selbstständig':'Selbstständig'
};

const setTone = (key) => {
  toneBtns.forEach(b => b.setAttribute('aria-pressed', String(b.getAttribute('data-tone')===key)));
  tone = toneMap[key] || 'Locker';
  store.setRaw('hh.ref2.tone', key);
  render();
};
const setSeg = (key) => {
  segBtns.forEach(b => b.setAttribute('aria-pressed', String(b.getAttribute('data-seg')===key)));
  seg = key;
  // also hint to general share engine for other pages
  const map = { freund:'freunde', familie:'eltern', kollege:'kollegen', selbststaendig:'selbst' };
  store.setRaw('hh.share.seg', map[key] || 'neutral');
  store.setRaw('hh.ref2.seg', key);
  // subtle feedback
  toast('Zielgruppe gesetzt ✔️');
  render();
};

function ensureURL(text){ return /\bhttps?:\/\/\S+/i.test(text) ? text : `${text.trim()} ${buildURL()}`; }

function render(){
  const raw = templates[tone] || Object.values(templates)[0] || '';
  msgEl.textContent = raw.replace(/\{\{URL\}\}/g, buildURL()).replace(/^„|”|“|„|”$/g,'').replace(/^"+|"+$/g,'');
  // typing dots already present; preview updates time
  const time = $('.wa-time'); if (time) time.textContent = 'jetzt';
}

// events
toneBtns.forEach(b => on(b,'click', ()=> setTone(b.getAttribute('data-tone'))));
segBtns.forEach(b  => on(b,'click',  ()=> setSeg(b.getAttribute('data-seg'))));
on(nameEl,'input', render, { passive:true });

on(copyBtn,'click', async ()=>{
  try{
    const t = ensureURL(msgEl.textContent || '');
    if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(t);
    else {
      const ta=document.createElement('textarea'); ta.value=t; document.body.appendChild(ta); ta.select(); document.execCommand?.('copy'); ta.remove();
    }
    toast('Kopiert ✔️');
  }catch{ toast('Konnte nicht kopieren'); }
});

on(shareBtn,'click', ()=>{
  const t = ensureURL(msgEl.textContent || '');
  const href = 'https://wa.me/?text=' + encodeURIComponent(t);
  window.open(href, '_blank', 'noopener');
});

// init defaults
setTone(store.getRaw('hh.ref2.tone') || 'locker');
setSeg(store.getRaw('hh.ref2.seg') || 'freund');
render();


}

// Bottom Navigation — highlight active section
function initBottomNav() {
const nav = $('.bottom-nav'); if (!nav) return;
const items = $$('a.nav-item', nav);
if (!items.length) return;

const map = items.map(a => {
  const href = a.getAttribute('href') || '';
  if (!href.startsWith('#')) return null;
  const id = href.slice(1);
  const sec = document.getElementById(id);
  return sec ? { a, sec } : null;
}).filter(Boolean);

if (!map.length) return;

const update = () => {
  let activeIdx = -1, best = -Infinity;
  map.forEach((m, idx) => {
    const r = m.sec.getBoundingClientRect();
    const score = Math.min(window.innerHeight, Math.max(0, window.innerHeight - Math.abs(r.top - window.innerHeight*0.35)));
    if (score > best) { best = score; activeIdx = idx; }
  });
  map.forEach((m, idx)=> m.a.classList.toggle('is-active', idx===activeIdx));
};

on(window,'scroll', update, { passive:true });
on(window,'resize', update);
update();


}

// Sticky CTA — appears after 30% scroll; hides if hero CTA visible
function initStickyCTA() {
const sticky = $('#sticky-cta') || $('#stickyCTA'); // support both ids
const heroCTA = $('#hero-cta') || $('#startCheckHero');
if (!sticky) return;

const show = (v) => {
  sticky.classList.toggle('show', v);
  sticky.setAttribute('aria-hidden', String(!v));
};

const ratioTrigger = () => {
  const doc = document.documentElement;
  const scrolled = (doc.scrollTop || document.body.scrollTop);
  const max = (doc.scrollHeight - doc.clientHeight) || 1;
  return (scrolled / max) >= 0.30;
};

let heroVisible = false;
if ('IntersectionObserver' in window && heroCTA) {
  new IntersectionObserver(([e])=>{ heroVisible = e.isIntersecting; if (heroVisible) show(false); }, { threshold:.4 }).observe(heroCTA);
}

const onScroll = () => {
  const should = ratioTrigger() && !heroVisible;
  show(should);
};

on(window,'scroll', onScroll, { passive:true });
on(window,'resize', onScroll);
onScroll();

// Attach scroll-to target
const btn = $('.sticky-cta .btn', sticky);
on(btn,'click', ()=>{
  const targetSel = btn?.getAttribute('data-target');
  const target = targetSel ? $(targetSel) : ($('#quiz') || $('#referral-engine') || $('#ampel-check'));
  target?.scrollIntoView({ behavior:'smooth', block:'start' });
});


}

/* ------------------------------- Bootstrp ------------------------------- */
function initMisc() {
// remove no-js, set dynamic year
document.documentElement.classList.remove('no-js');
$$('#yearNow,[data-year]').forEach(el => el.textContent = String(new Date().getFullYear()));
}

function boot() {
initMisc();

// Core UX
initDecisionAnchor();
initAutoHighlightCriticalText();
initFadeUp();
initHeroAmpelAnimation();

// Systems
initPersonaSelection();
initLiveFeed();
initProofBars();
initQuizWizard();
initReferralEngine();

// Shell
initBottomNav();
initStickyCTA();


}

(document.readyState === 'loading') ? on(document,'DOMContentLoaded', boot, { once:true }) : boot();

// Export API (optional debug)
window.app = {
initDecisionAnchor,
initAutoHighlightCriticalText,
initFadeUp,
initHeroAmpelAnimation,
initPersonaSelection,
initLiveFeed,
initProofBars,
initQuizWizard,
generateSummary,
generateTimeSlots,
initReferralEngine,
initBottomNav,
initStickyCTA
};
})();
