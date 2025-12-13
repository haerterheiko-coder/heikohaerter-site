// app.js
/* ============================================================
   GODMODE — CINEMATIC CUT (2026)
   iOS/Android polish · Idle motion · Stable media
============================================================ */
(function () {
  "use strict";

  document.documentElement.classList.remove("no-js");
  const y = document.getElementById("yNow"); if (y) y.textContent = String(new Date().getFullYear());

  // Respect Save-Data
  try{ if(navigator.connection?.saveData){ document.documentElement.style.setProperty("--motion","0"); } }catch{}

  // Minimal data layer failsafe
  if (!window.GODDATA) {
    const Q=[]; window.GODDATA={ onReady(cb){ if(typeof cb==="function") Q.push(cb);} };
    fetch("./data.json")
      .then(r=>r.ok?r.json():Promise.reject())
      .then(d=>{ while(Q.length){ try{Q.shift()(d);}catch{} } })
      .catch(()=>{ const d={brand:{year:String(new Date().getFullYear())},checks:{}}; while(Q.length){ try{Q.shift()(d);}catch{} } });
  }

  const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Cinematic cut helper
  const cut = document.querySelector(".cut-overlay");
  function cinematicScroll(target){
    if(!target) return;
    cut?.classList.add("on");
    setTimeout(()=> target.scrollIntoView({behavior: prefersReduced?"auto":"smooth", block:"start"}), 110);
    setTimeout(()=> cut?.classList.remove("on"), 360);
  }

  // Anchor → cinematic
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener("click",(e)=>{
      const id=a.getAttribute("href");
      if(id && id.length>1){
        const t=document.querySelector(id);
        if(t){ e.preventDefault(); cinematicScroll(t); }
      }
    }, {passive:false});
  });

  // Slides / bullets / progress
  const slides=[...document.querySelectorAll("main.slides > .slide")];
  const bullets=document.getElementById("bullets");
  const progressBar=document.querySelector("#progress span");

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
        bullets?.querySelectorAll("button").forEach((b,i)=>b.setAttribute("aria-current", i===idx?"true":"false"));
        if(progressBar) progressBar.style.width = (((idx+1)/slides.length)*100).toFixed(2)+"%";
      }
    },{threshold:.66});
    slides.forEach(s=>io.observe(s));
  } else {
    document.querySelectorAll(".fade-up").forEach(el=>el.classList.add("visible"));
  }

  // Kinetic words
  (function(){
    const el=document.querySelector(".swap");
    if(!el || prefersReduced) return;
    let words=[]; try{ words=JSON.parse(el.getAttribute("data-words")||"[]"); }catch{}
    if(!words.length) return;
    let i=0;
    setInterval(()=>{ i=(i+1)%words.length; el.classList.remove("enter"); void el.offsetWidth; el.textContent=words[i]; el.classList.add("enter"); },2800);
  })();

  // iOS video autoplay nudge
  function tryPlay(){ const v=document.querySelector(".hero-video"); v?.play?.().catch(()=>{}); }
  document.addEventListener("touchstart", tryPlay, {once:true, passive:true});
  document.addEventListener("click", tryPlay, {once:true, passive:true});

  // Parallax (idle)
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

  // Particles (idle)
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

  // Idle start
  (('requestIdleCallback'in window)?requestIdleCallback:setTimeout)(()=>{ initParallax(); initParticles(); }, 320);

  // Gate reveal (CLS-frei)
  const gateBtn=document.querySelector('[data-earn-ampel]');
  const gate=document.getElementById('b4');
  gateBtn?.addEventListener('click',()=>{
    gateBtn.setAttribute('aria-expanded','true');
    cut?.classList.add('on');
    setTimeout(()=>{ gate?.removeAttribute('aria-hidden'); gate?.classList.add('show'); cinematicScroll(gate); }, 240);
    setTimeout(()=> cut?.classList.remove('on'), 520);
  });

  // Check (with afterglow)
  GODDATA.onReady(data=>{
    const stepsRoot=document.getElementById("check-steps");
    const resultRoot=document.getElementById("check-result");
    if(!stepsRoot || !resultRoot) return;
    renderCheck(data.checks?.ampel || defaultCheck(), stepsRoot, resultRoot);
  });

  function defaultCheck(){
    return {
      questions:[
        { text:"Wenn du 6 Monate ausfällst – wie sicher wäre euer Einkommen?", options:{green:"Stabil", yellow:"Knapp", red:"Kritisch"} },
        { text:"Wie schnell findest du wichtige Unterlagen?", options:{green:"Sofort", yellow:"Meistens", red:"Schwierig"} },
        { text:"Wie fühlt sich Zukunft & Alter an?", options:{green:"Gut", yellow:"Unklar", red:"Belastend"} }
      ],
      scoring:{ values:{green:3,yellow:2,red:1}, thresholds:{yellow:6, red:8} },
      results:{
        green:{ title:"🟢 Für heute ruhig", text:"Dein System wirkt stabil.", micro:"Behalten. Nicht zerdenken."},
        yellow:{ title:"🟡 Bald wichtig", text:"Ein paar Dinge verdienen Aufmerksamkeit.", micro:"Ohne Druck. Schritt für Schritt."},
        red:{ title:"🔴 Heute wichtig", text:"Mindestens ein Bereich braucht Fokus.", micro:"Kurz ordnen – dann wird’s ruhiger."}
      }
    };
  }

  function pulseProgress(){
    const p=document.querySelector('#progress span'); if(!p || prefersReduced) return;
    p.animate([{transform:'scaleY(1)'},{transform:'scaleY(1.7)'},{transform:'scaleY(1)'}],{duration:280,easing:'ease-out'});
  }

  function resolve(score, t){ if(score>=t.red) return "red"; if(score>=t.yellow) return "yellow"; return "green"; }

  function renderCheck(check, stepsRoot, resultRoot){
    let score=0, step=0;
    stepsRoot.innerHTML=""; resultRoot.innerHTML="";

    check.questions.forEach((q,i)=>{
      const el=document.createElement("div");
      el.className="check-step"; if(i>0) el.hidden=true;
      el.innerHTML=`<h3>${q.text}</h3>
        <div class="cta">
          <button class="btn btn-primary" data-a="green">${q.options.green}</button>
          <button class="btn" data-a="yellow">${q.options.yellow}</button>
          <button class="btn" data-a="red">${q.options.red}</button>
        </div>`;
      stepsRoot.appendChild(el);
    });

    const steps=[...stepsRoot.children];
    stepsRoot.querySelectorAll("[data-a]").forEach(btn=>{
      btn.addEventListener("click",()=>{
        score += check.scoring.values[btn.dataset.a]||0; step++; pulseProgress();
        if(step>=check.questions.length){
          steps.at(-1).hidden=true;
          showResult(resolve(score, check.scoring.thresholds), check.results, resultRoot);
        }else{
          steps[step-1].hidden=true; steps[step].hidden=false; cinematicScroll(steps[step]);
        }
      },{passive:true});
    });
  }

  function showResult(color, results, root){
    const r=results[color];
    const wa="https://wa.me/?text=";
    const msg=encodeURIComponent(`Hi Heiko — ich hab die 2-Minuten-Ampel gemacht (${color.toUpperCase()}). Kannst du mir kurz helfen, den nächsten Schritt ruhig zu sortieren?`);
    const share=encodeURIComponent("Kurz & ruhig: In 2 Minuten siehst du, ob heute etwas Wichtiges fehlt. Anonym. Kein Verkauf. https://heikohaerter.com/");

    root.innerHTML=`
      <div class="result-card result-${color}">
        <h3>${r.title}</h3>
        <p>${r.text}</p>
        <p class="micro">${r.micro||""}</p>
        <div class="cta" style="margin-top:1rem">
          <a class="btn btn-primary" href="${wa}${msg}">💬 10 Minuten Ruhe schaffen</a>
          <a class="btn btn-ghost" href="./weitergeben.html">🔗 Ruhig weitergeben</a>
          <button class="btn" type="button" id="copyShare">📋 Text kopieren</button>
          <span class="micro" id="copyToast" style="opacity:.82"></span>
        </div>
      </div>`;
    document.getElementById("copyShare")?.addEventListener("click", async ()=>{
      const t=document.getElementById("copyToast");
      try{ await navigator.clipboard.writeText(decodeURIComponent(share)); if(t) t.textContent="Kopiert. Du kannst es jetzt überall einfügen."; }
      catch{ if(t) t.textContent="Automatisches Kopieren nicht möglich. Markieren & kopieren klappt immer."; }
    });
    cinematicScroll(root);
  }

})();
