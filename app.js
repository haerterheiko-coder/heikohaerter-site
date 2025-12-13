// app.js
/* ============================================================
   GODMODE — CINEMATIC CUT (2026, FINAL)
   iOS/Android polish · Idle motion · Stable media · Data-driven
============================================================ */
(function () {
  "use strict";

  // --- ENV/BOOT -------------------------------------------------------------
  document.documentElement.classList.remove("no-js");
  const y = document.getElementById("yNow");
  if (y) y.textContent = String(new Date().getFullYear());

  // Respect Save-Data (reduziert Motion/CPU)
  try { if (navigator.connection?.saveData) document.documentElement.style.setProperty("--motion", "0"); } catch {}

  const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // --- DATA LAYER FAILSAFE --------------------------------------------------
  // Lädt /data.json und stellt GODDATA.onReady(cb) bereit.
  if (!window.GODDATA) {
    const Q = [];
    window.GODDATA = { onReady(cb){ if (typeof cb === "function") Q.push(cb); } };
    fetch("./data.json")
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { while (Q.length) { try { Q.shift()(d); } catch {} } })
      .catch(() => {
        const d = { brand:{year:String(new Date().getFullYear())}, checks:{ } };
        while (Q.length) { try { Q.shift()(d); } catch {} }
      });
  }

  // --- HELPERS: CINEMATIC CUT/SCROLL ---------------------------------------
  const cut = document.querySelector(".cut-overlay");
  function cinematicScroll(target){
    if(!target) return;
    cut?.classList.add("on");
    setTimeout(()=> target.scrollIntoView({behavior: prefersReduced?"auto":"smooth", block:"start"}), 110);
    setTimeout(()=> cut?.classList.remove("on"), 360);
  }

  // Anchor → cinematic scroll
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener("click",(e)=>{
      const id=a.getAttribute("href");
      if(!id || id.length<=1) return;
      const t=document.querySelector(id);
      if(t){ e.preventDefault(); cinematicScroll(t); }
    }, {passive:false});
  });

  // --- SLIDES / BULLETS / PROGRESS -----------------------------------------
  const slides = [...document.querySelectorAll("main.slides > .slide")];
  const bullets = document.getElementById("bullets");
  const progressBar = document.querySelector("#progress span");

  if (bullets && slides.length) {
    slides.forEach((s,i)=>{
      const b=document.createElement("button");
      b.setAttribute("aria-label",`Zu Abschnitt ${i+1}`);
      b.addEventListener("click",()=>cinematicScroll(s));
      bullets.appendChild(b);
    });
  }

  if ("IntersectionObserver" in window && slides.length) {
    const io=new IntersectionObserver((entries)=>{
      entries.forEach(e=>{ if(e.isIntersecting) e.target.classList.add("visible"); });
      const active=entries.filter(e=>e.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top)[0];
      if(active){
        const idx=slides.indexOf(active.target);
        bullets?.querySelectorAll("button").forEach((b,i)=> b.setAttribute("aria-current", i===idx ? "true" : "false"));
        if(progressBar) progressBar.style.width = (((idx+1)/slides.length)*100).toFixed(2)+"%";
      }
    },{threshold:.66});
    slides.forEach(s=>io.observe(s));
  } else {
    document.querySelectorAll(".fade-up").forEach(el=>el.classList.add("visible"));
  }

  // --- KINETIC WORDS --------------------------------------------------------
  (function(){
    const el=document.querySelector(".swap");
    if(!el || prefersReduced) return;
    let words=[]; try{ words=JSON.parse(el.getAttribute("data-words")||"[]"); }catch{}
    if(!words.length) return;
    let i=0;
    setInterval(()=>{ i=(i+1)%words.length; el.classList.remove("enter"); void el.offsetWidth; el.textContent=words[i]; el.classList.add("enter"); }, 2800);
  })();

  // --- iOS VIDEO AUTOPLAY NUDGE --------------------------------------------
  function tryPlay(){ const v=document.querySelector(".hero-video"); v?.play?.().catch(()=>{}); }
  document.addEventListener("touchstart", tryPlay, {once:true, passive:true});
  document.addEventListener("click", tryPlay, {once:true, passive:true});

  // --- PARALLAX (idle) ------------------------------------------------------
  function initParallax(){
    if(prefersReduced) return;
    const glowA=document.querySelector(".glow-a");
    const glowB=document.querySelector(".glow-b");
    const cards=document.querySelectorAll(".parallax");
    let raf;
    const onScroll=()=>{
      cancelAnimationFrame(raf);
      raf=requestAnimationFrame(()=>{
        const t=scrollY||0;
        if(glowA) glowA.style.transform=`translate3d(0,${t*-0.02}px,0)`;
        if(glowB) glowB.style.transform=`translate3d(0,${t*-0.04}px,0)`;
        cards.forEach(c=>{
          const r=c.getBoundingClientRect(); const p=(r.top/innerHeight - .5);
          c.style.transform=`translate3d(0,${p*-14}px,0)`;
        });
      });
    };
    addEventListener("scroll", onScroll, {passive:true}); onScroll();
  }

  // --- PARTICLES (idle) -----------------------------------------------------
  function initParticles(){
    const canvas=document.getElementById("particles");
    if(!canvas || prefersReduced) return;
    const ctx=canvas.getContext("2d"); const DPR=Math.min(devicePixelRatio||1,2);
    let W=1,H=1,pts=[];
    function resize(){
      const b=canvas.getBoundingClientRect();
      canvas.width=Math.max(1, Math.floor(b.width*DPR));
      canvas.height=Math.max(1, Math.floor(b.height*DPR));
      ctx.setTransform(DPR,0,0,DPR,0,0);
      W=b.width; H=b.height;
      pts=Array.from({length:70},()=>({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.8+.4,s:.2+Math.random()}));
    }
    function draw(){
      ctx.clearRect(0,0,W,H);
      ctx.fillStyle="rgba(233,211,148,.28)";
      pts.forEach(p=>{ p.y+=p.s*.25; if(p.y>H) p.y=-10; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill(); });
      requestAnimationFrame(draw);
    }
    resize(); addEventListener("resize", resize, {passive:true}); draw();
  }

  // Idle start (Performance)
  (('requestIdleCallback'in window)?requestIdleCallback:setTimeout)(()=>{ initParallax(); initParticles(); }, 320);

  // --- GATE REVEAL (CLS-frei + cinematic) ----------------------------------
  const gateBtn=document.querySelector('[data-earn-ampel]');
  const gate=document.getElementById('b4');
  gateBtn?.addEventListener('click',()=>{
    gateBtn.setAttribute('aria-expanded','true');
    cut?.classList.add('on');
    setTimeout(()=>{ gate?.removeAttribute('aria-hidden'); gate?.classList.add('show'); cinematicScroll(gate); }, 240);
    setTimeout(()=> cut?.classList.remove('on'), 520);
  });

  // --- DATA UTILITIES (shared) ---------------------------------------------
  function normalizeCheck(raw){
    const defaults = {
      questions: [],
      scoring: { values: { green: 0, yellow: 1, red: 2 }, thresholds: { green: 0, yellow: 2, red: 4 } },
      results: {
        green: { title:"🟢 Passt", text:"", micro:"" },
        yellow:{ title:"🟡 Bald wichtig", text:"", micro:"" },
        red:   { title:"🔴 Heute wichtig", text:"", micro:"" }
      }
    };
    if (!raw) return defaults; // leer, aber strukturell korrekt
    const c = {
      ...defaults,
      questions: Array.isArray(raw.questions) ? raw.questions : defaults.questions,
      scoring: {
        values: { ...defaults.scoring.values, ...(raw.scoring?.values||{}) },
        thresholds: { ...defaults.scoring.thresholds, ...(raw.scoring?.thresholds||{}) }
      },
      results: { ...defaults.results, ...(raw.results||{}) }
    };
    // Sanity: options + Zahlen
    c.questions = c.questions.map(q=>({
      id: q.id || "",
      text: q.text || "",
      options: {
        green: q.options?.green ?? "Grün",
        yellow: q.options?.yellow ?? "Gelb",
        red: q.options?.red ?? "Rot"
      }
    }));
    ["green","yellow","red"].forEach(k=>{
      c.scoring.values[k] = Number(c.scoring.values[k]);
      c.scoring.thresholds[k] = Number(c.scoring.thresholds[k]);
    });
    return c;
  }
  function getCheckFromData(data, key){
    return normalizeCheck(data?.checks?.[key]);
  }
  function applyMicroHooks(data){
    const emo = data?.micro_hooks?.emotional || [];
    const rat = data?.micro_hooks?.rational || [];
    const pick = arr => arr && arr.length ? arr[Math.floor(Math.random()*arr.length)] : "";
    const emoEl = document.querySelector('[data-hook="emotional"]');
    const ratEl = document.querySelector('[data-hook="rational"]');
    if (emoEl) emoEl.textContent = pick(emo);
    if (ratEl) ratEl.textContent = pick(rat);
  }

  // --- CHECK RENDERER (shared) ---------------------------------------------
  function pulseProgress(){
    const p=document.querySelector('#progress span'); if(!p || prefersReduced) return;
    p.animate(
      [{transform:'scaleY(1)'},{transform:'scaleY(1.7)'},{transform:'scaleY(1)'}],
      {duration:280,easing:'ease-out'}
    );
  }
  function resolveColor(score, thresholds){
    if(score >= thresholds.red) return "red";
    if(score >= thresholds.yellow) return "yellow";
    return "green";
  }
  function showResultCard(color, results, mount){
    const r = results[color];
    const wa="https://wa.me/?text=";
    const msg=encodeURIComponent(`Hi Heiko — ich hab die 2-Minuten-Ampel gemacht (${color.toUpperCase()}). Kannst du mir kurz helfen, den nächsten Schritt ruhig zu sortieren?`);
    const share=encodeURIComponent("Kurz & ruhig: In 2 Minuten siehst du, ob heute etwas Wichtiges fehlt. Anonym. Kein Verkauf. https://heikohaerter.com/");

    mount.innerHTML = `
      <div class="result-card result-${color}">
        <h3>${r.title}</h3>
        <p>${r.text}</p>
        <p class="micro">${r.micro || ""}</p>
        <div class="cta" style="margin-top:1rem">
          <a class="btn btn-primary" href="${wa}${msg}">💬 10 Minuten Ruhe schaffen</a>
          <a class="btn btn-ghost" href="./weitergeben.html">🔗 Ruhig weitergeben</a>
          <button class="btn" type="button" id="copyShare">📋 Text kopieren</button>
          <span class="micro" id="copyToast" style="opacity:.82"></span>
        </div>
      </div>`;
    document.getElementById("copyShare")?.addEventListener("click", async ()=>{
      const t=document.getElementById("copyToast");
      try{
        await navigator.clipboard.writeText(decodeURIComponent(share));
        if(t) t.textContent="Kopiert. Du kannst es jetzt überall einfügen.";
      } catch {
        if(t) t.textContent="Automatisches Kopieren nicht möglich. Markieren & kopieren klappt immer.";
      }
    });
    cinematicScroll(mount);
  }
  function renderStepCheck(check, stepsRoot, resultRoot, opts = {}){
    const { afterglow = true } = opts;
    let score = 0, step = 0;
    stepsRoot.innerHTML = "";
    resultRoot.innerHTML = "";

    check.questions.forEach((q,i)=>{
      const el=document.createElement("div");
      el.className="check-step";
      if(i>0) el.hidden=true;
      el.innerHTML=`
        <h3>${q.text}</h3>
        <div class="cta">
          <button class="btn btn-primary" data-a="green">${q.options.green}</button>
          <button class="btn" data-a="yellow">${q.options.yellow}</button>
          <button class="btn" data-a="red">${q.options.red}</button>
        </div>`;
      stepsRoot.appendChild(el);
    });

    const stepEls=[...stepsRoot.children];
    stepsRoot.querySelectorAll("[data-a]").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const a = btn.getAttribute("data-a");
        score += (check.scoring.values[a] || 0);
        step++;
        pulseProgress();

        if(step >= check.questions.length){
          stepEls.at(-1).hidden = true;
          const color = resolveColor(score, check.scoring.thresholds);
          showResultCard(color, check.results, resultRoot);
        } else {
          stepEls[step-1].hidden = true;
          stepEls[step].hidden = false;
          cinematicScroll(stepEls[step]);
        }
      }, {passive:true});
    });
  }

  // --- AMPel CHECK (Startseite) --------------------------------------------
  GODDATA.onReady(data=>{
    applyMicroHooks(data);
    const stepsRoot=document.getElementById("check-steps");
    const resultRoot=document.getElementById("check-result");
    if(!stepsRoot || !resultRoot) return; // nicht auf dieser Seite

    const check = getCheckFromData(data, "ampel");
    if (!check.questions.length) return;
    renderStepCheck(check, stepsRoot, resultRoot, { afterglow: true });
  });

  // --- ARBEITGEBER CHECK (arbeitgeber.html) --------------------------------
  (function employerCheckInit(){
    const startBtn  = document.getElementById("startEmployerBtn");
    const stepsRoot = document.getElementById("employer-check-steps");
    const resultRoot= document.getElementById("employer-check-result");
    if (!startBtn || !stepsRoot || !resultRoot) return; // nicht auf dieser Seite

    let readyCheck = null;
    GODDATA.onReady(data=>{
      applyMicroHooks(data);
      const c = getCheckFromData(data, "arbeitgeber");
      if (c?.questions?.length) readyCheck = c;
    });

    startBtn.addEventListener("click", ()=>{
      const c = readyCheck || normalizeCheck(null);
      if (!c.questions.length) return;
      renderStepCheck(c, stepsRoot, resultRoot, { afterglow: true });

      const target = stepsRoot.closest(".section") || stepsRoot;
      if (target) target.scrollIntoView({behavior: prefersReduced ? "auto" : "smooth", block:"start"});
    });
  })();

  // --- OPTIONAL: PROOF TABS (falls vorhanden) ------------------------------
  document.querySelectorAll(".proof-tabs .tab").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const g = btn.getAttribute("data-group");
      document.querySelectorAll(".proof-tabs .tab").forEach(t=>{
        const on = (t === btn);
        t.classList.toggle("is-on", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
      });
      document.querySelectorAll(".proof-card").forEach(card=>{
        const ok = card.getAttribute("data-group") === g;
        card.hidden = !ok;
      });
      const track = document.querySelector(".proof-track");
      if(track) track.scrollTo({left:0, behavior: prefersReduced ? "auto" : "smooth"});
    });
  });

})();
