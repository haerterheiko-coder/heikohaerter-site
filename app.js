(()=>{

/* ---------- Shortcuts ---------- */
const $ = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));

document.documentElement.classList.remove("no-js");

/* ---------------- Loader ---------------- */
function setupLoader(){
  const el = $("#micro-loader");
  if(!el) return;
  const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
  const hide = ()=> el.classList.add("hide");
  reduce ? hide() : setTimeout(hide,500);
}

/* ---------------- Smooth Scroll ---------------- */
function setupSmoothScroll(){
  const go = e =>{
    const t = e.currentTarget;
    const href = t.dataset.target || t.getAttribute("href");
    if(!href || !href.startsWith("#")) return;
    const trg = $(href);
    if(!trg) return;
    e.preventDefault();
    trg.scrollIntoView({behavior:"smooth"});
  };
  $$('a[href^="#"],[data-target^="#"]').forEach(a=>{
    a.addEventListener("click",go);
  });
}

/* ---------------- Reveal Animations ---------------- */
function setupReveal(){
  const io = new IntersectionObserver(ents=>{
    ents.forEach(e=>{
      if(e.isIntersecting) e.target.classList.add("visible");
    });
  },{threshold:.12});
  $$(".fade-up").forEach(el=>io.observe(el));
}

/* ---------------- Decision Anchor ---------------- */
function setupDecisionAnchor(){
  const anchor = $("#decision-anchor");
  if(!anchor) return;

  let shown = false;
  const onScroll = ()=>{
    if(!shown && scrollY > 180){
      anchor.classList.add("show");
      shown = true;
      window.removeEventListener("scroll",onScroll);
    }
  };
  window.addEventListener("scroll",onScroll,{passive:true});

  const span = $("#micro-proof");
  if(!span) return;

  const msgs = [
    "keine Vorbereitung notwendig",
    "dauert nur 2 Minuten",
    "du entscheidest – nichts wird verkauft"
  ];
  let i = 0;
  const id = setInterval(()=>{
    i = (i+1) % msgs.length;
    span.textContent = msgs[i];
  },4000);
  window.addEventListener("pagehide",()=>clearInterval(id));
}

/* ---------------- Sticky CTA ---------------- */
function setupStickyCTA(){
  const cta = $("#sticky-cta");
  const hero = $("#hero");
  const quiz = $("#quiz");
  if(!cta || !hero) return;

  const show = v=>{
    cta.classList.toggle("show",v);
    cta.setAttribute("aria-hidden", v ? "false":"true");
  };

  const ioHero = new IntersectionObserver(([e])=>{
    const s = !e.isIntersecting && scrollY > (document.body.scrollHeight * 0.3);
    show(s);
  },{rootMargin:"-64px 0 0 0"});
  ioHero.observe(hero);

  if(quiz){
    const ioQuiz = new IntersectionObserver(([e])=>{
      if(e.isIntersecting) show(false);
    },{threshold:.25});
    ioQuiz.observe(quiz);
  }

  cta.addEventListener("click",()=>{
    $("#quiz")?.scrollIntoView({behavior:"smooth"});
  });
}

/* ---------------- Live Feeds ---------------- */
function rotateFeed(id,items){
  const box = $(id);
  if(!box || !items.length) return;
  box.textContent = items[0];
  let i=0, paused=false;

  const rot = setInterval(()=>{
    if(!paused){
      i=(i+1)%items.length;
      box.textContent = items[i];
    }
  },3500);

  ["mouseenter","focusin"].forEach(ev=> box.addEventListener(ev,()=>paused=true));
  ["mouseleave","focusout"].forEach(ev=> box.addEventListener(ev,()=>paused=false));

  window.addEventListener("pagehide",()=>clearInterval(rot));
}

function setupLiveFeeds(){
  rotateFeed("#live-feed",[
    "„Sandra (31) hat gerade ihre Ampel gemacht.“",
    "„Leon (27) spart 420 € im Jahr.“",
    "„Heute schon 18 Menschen Ruhe gewonnen.“"
  ]);

  rotateFeed("#referral-live-feed",[
    "„Clara (34) hat den Link weitergegeben.“",
    "„Tom (42) hat gerade gestartet – 2 Minuten.“",
    "„Ohne Druck, ohne Verkauf – einfach anfangen.“"
  ]);
}

/* ---------------- Proof Bars ---------------- */
function setupProofBars(){
  const bars = $$(".proof-bar");
  if(!bars.length) return;

  const io = new IntersectionObserver(ents=>{
    ents.forEach(({isIntersecting,target})=>{
      if(!isIntersecting) return;
      const v = parseInt(target.dataset.value || "0",10);
      const span = $("span",target);
      if(span) span.style.width = Math.min(100,Math.max(0,v)) + "%";
    });
  },{threshold:.35});

  bars.forEach(b=>io.observe(b));
}

/* ---------------- Personas ---------------- */
let currentPersona = "";

function setupPersonas(){
  const cards = $$(".persona-card");
  const out = $("#persona-copy");
  if(!cards.length) return;

  const setActive = c=>{
    cards.forEach(x=>x.classList.remove("is-active"));
    c.classList.add("is-active");
    currentPersona = c.dataset.key || "";
    out.textContent = (c.dataset.headline || "") + " " + (c.dataset.subheadline || "");
  };

  cards.forEach(c=>{
    c.addEventListener("click",()=>setActive(c));
    c.addEventListener("keydown",e=>{
      if(e.key===" "||e.key==="Enter"){
        e.preventDefault();
        setActive(c);
      }
    });
  });
}

/* ---------------- Quiz Logic ---------------- */
function setupQuiz(){
  const steps = $$("#quiz-steps .quiz-step");
  if(!steps.length) return;

  const bar = $("#quiz-progress-bar");
  const stepTxt = $("#quiz-step-text");
  const tick = $("#progress-tick");
  const soft = $("#soft-permission");

  const result = $("#quiz-result");
  const note = $("#quiz-summary-text");
  const badge = $("#persona-badge");

  const answers = [];
  let stepIndex = 0;

  const labels = [
    "Los geht’s",
    "✓ 1 von 3 – gut dabei",
    "✓ 2 von 3 – fast geschafft",
    "✓ 3 von 3"
  ];

  function updateProgress(){
    const pct = Math.round((stepIndex/steps.length)*100);
    bar.style.width = pct + "%";
    bar.setAttribute("aria-valuenow", pct);
    stepTxt.textContent = Math.min(stepIndex+1, steps.length);
    tick.textContent = labels[Math.min(stepIndex, labels.length-1)];
  }

  function computeColor(){
    let r=0,y=0,g=0;
    answers.forEach(v=>{
      if(v==="stabil") g++;
      else if(v==="unsicher"||v==="keineahnung") r++;
      else y++;
    });
    if(g>=2) return "gruen";
    if(r>=2) return "rot";
    return "gelb";
  }

  function autoPersona(idx,val){
    if(idx !== 2) return;
    const s1 = answers[0], s2 = answers[1];
    let key = "";

    if(val!=="stabil") key = (s1==="stabil") ? "angestellt" : "familie";
    else if(s2==="stabil") key = "selbststaendig";

    if(!key) return;
    const el = $(`.persona-card[data-key="${key}"]`);
    if(!el) return;

    $$(".persona-card").forEach(c=>c.classList.remove("is-active"));
    el.classList.add("is-active");

    currentPersona = key;
    $("#persona-copy").textContent = el.dataset.headline + " " + el.dataset.subheadline;
  }

  function predictiveText(color){
    const base = {
      rot: [
        "Erstmal Ordnung schaffen – ruhig & klar.",
        "Kein Druck – Schritt für Schritt.",
        "Wir sortieren Wichtiges zuerst.",
        "Kleine Schritte – klare Reihenfolge."
      ],
      gelb: [
        "Schon gut – ein paar Schritte noch.",
        "Fast da – 2–3 Stellschrauben.",
        "Gut im Griff – clever priorisieren.",
        "Einmal sauber durchgehen."
      ],
      gruen: [
        "Sehr stabil – nur Kleinigkeiten.",
        "Top Basis – wir sichern ab.",
        "Weiter so – Mini-Checks.",
        "Feinschliff möglich."
      ]
    };

    const add = {
      familie:{rot:" Fokus: Familienalltag erleichtern.",gelb:" Mehr Ruhe ohne Papierkram.",gruen:" Familien-Themen bleiben entspannt."},
      angestellt:{rot:" Schnelle Ordnung im Alltag.",gelb:" Mehr Klarheit im Monat.",gruen:" Stabil – nur Feinschliff."},
      selbststaendig:{rot:" Schwankungen abfedern.",gelb:" Liquidität & Risiko justieren.",gruen:" Reserve & Absicherung prüfen."},
      "":{rot:"",gelb:"",gruen:""}
    };

    const list = base[color] || base.gelb;
    const pick = list[(Math.random()*list.length)|0];
    return pick + (add[currentPersona]?.[color] || "");
  }

  function setAmpel(color){
    $$("[data-lamp]").forEach(l=>l.classList.remove("ampel--active"));
    const el = $(`[data-lamp="${color}"]`);
    if(el) el.classList.add("ampel--active");
  }

  function generateSlots(){
    const box = $("#slot-container");
    if(!box) return;
    box.innerHTML = "";

    const times = ["09:30","11:00","13:00","15:30","18:00"];

    for(let d=0; d<5; d++){
      const dt = new Date();
      dt.setDate(dt.getDate()+d);

      const slot = document.createElement("div");
      slot.className = "slot " + (d===0?"slot-today": d===1?"slot-tomorrow":"");

      slot.textContent = dt.toLocaleDateString("de-DE",{weekday:"short",day:"2-digit",month:"2-digit"}) +
                         " · " + times[d%times.length] + " Uhr";

      box.appendChild(slot);
    }
  }

  function showResult(){
    steps.forEach(s=>s.hidden=true);

    const color = computeColor();
    setAmpel(color);
    note.textContent = predictiveText(color);
    generateSlots();

    if(currentPersona){
      badge.hidden = false;
      badge.textContent = {
        familie:"Familie",
        angestellt:"Angestellt",
        selbststaendig:"Selbstständig"
      }[currentPersona];
    } else {
      badge.hidden = true;
    }

    result.hidden = false;

    bar.style.width = "100%";
    bar.setAttribute("aria-valuenow",100);
    tick.textContent = "✓ 3 von 3";
  }

  steps.forEach((step,idx)=>{
    step.addEventListener("click",e=>{
      const b = e.target.closest(".answer");
      if(!b) return;

      const val = b.dataset.value;
      answers[idx] = val;

      if(soft) soft.style.display = "none";

      autoPersona(idx,val);

      if(idx < steps.length-1){
        step.hidden = true;
        steps[idx+1].hidden = false;
        stepIndex = idx+1;
        updateProgress();
      } else {
        showResult();
      }
    });
  });

  $("#quiz-again")?.addEventListener("click",()=>{
    answers.length = 0;
    currentPersona = "";

    steps.forEach((s,i)=> s.hidden = (i!==0));
    $("#persona-copy") && ($("#persona-copy").textContent = "");
    $$(".persona-card").forEach(c=>c.classList.remove("is-active"));

    result.hidden = true;
    if(soft) soft.style.display = "";

    stepIndex = 0;
    updateProgress();
  });

  updateProgress();
}

/* ---------------- Bottom Nav Highlight ---------------- */
function setupBottomNav(){
  const nav = $("#bottom-nav");
  if(!nav) return;

  const sections = [
    ["#hero", nav.querySelector('a[href="#hero"]')],
    ["#quiz", nav.querySelector('a[href="#quiz"]')],
    ["#referral", nav.querySelector('a[href="#referral"]')],
    ["#termin", nav.querySelector('a[href="#termin"]')]
  ].filter(s=>document.querySelector(s[0]) && s[1]);

  const io = new IntersectionObserver(ents=>{
    ents.forEach(e=>{
      if(e.isIntersecting){
        sections.forEach(s=>s[1].classList.remove("is-active"));
        const active = sections.find(s=>"#"+e.target.id === s[0]);
        active && active[1].classList.add("is-active");
      }
    });
  },{threshold:.5});

  sections.forEach(s=>{
    const sec = $(s[0]);
    if(sec) io.observe(sec);
  });
}

/* ---------------- Year ---------------- */
function setupYear(){
  $$("[data-year]").forEach(n=>n.textContent = new Date().getFullYear());
}

/* ---------------- Init ---------------- */
document.addEventListener("DOMContentLoaded",()=>{
  setupLoader();
  setupSmoothScroll();
  setupReveal();
  setupDecisionAnchor();
  setupStickyCTA();
  setupLiveFeeds();
  setupProofBars();
  setupPersonas();
  setupQuiz();
  setupBottomNav();
  setupYear();
});

})();
