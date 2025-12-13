/* ============================================================
   GODMODE — HOLLYWOOD CUT (2026)
   Narrative Engine · Mobile-first · No-Side-Scroll
============================================================ */
(function () {
  "use strict";

  // remove no-js
  document.documentElement.classList.remove("no-js");
  document.querySelectorAll('#yearNow').forEach(el => el.textContent = new Date().getFullYear());

  /* FAILSAFE DATA LAYER */
  if (!window.GODDATA) {
    const Q=[]; window.GODDATA={ onReady(cb){ if(typeof cb==="function") Q.push(cb);} };
    fetch("./data.json").then(r=>r.ok?r.json():Promise.reject())
      .then(d=>{ while(Q.length){ try{ Q.shift()(d);}catch{} } })
      .catch(()=>{ const d={ brand:{year:String(new Date().getFullYear())}, checks:{} };
        while(Q.length){ try{ Q.shift()(d);}catch{} }});
  }

  const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* iOS/Android 100vh Fix */
  (function setVh(){
    const set = () => {
      const h = (window.visualViewport?.height || window.innerHeight);
      const vh = Math.max(320, h) * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };
    set();
    addEventListener("resize", set, { passive:true });
    window.visualViewport?.addEventListener("resize", set, { passive:true });
  })();

  /* SLIDES / NAV / PROGRESS */
  const slidesRoot = document.querySelector("main.slides");
  const slides = slidesRoot ? [...slidesRoot.querySelectorAll(":scope > .slide")] : [];
  const bullets = document.getElementById("bullets");
  const progressBar = document.querySelector("#progress span");

  if (bullets && slides.length) {
    slides.forEach((s, i) => {
      const b=document.createElement("button");
      b.setAttribute("aria-label", `Zu Abschnitt ${i+1}`);
      b.addEventListener("click", () => s.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth" }));
      bullets.appendChild(b);
    });
  }

  if ("IntersectionObserver" in window && slides.length) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          e.target.querySelectorAll(".parallax").forEach(el => el.style.willChange = "transform");
        }
      });
      const active = entries.filter(e=>e.isIntersecting).sort((a,b)=>a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (active) {
        const idx = slides.indexOf(active.target);
        bullets?.querySelectorAll("button").forEach((b,i)=> b.setAttribute("aria-current", i===idx));
        if (progressBar) progressBar.style.width = (((idx+1)/slides.length)*100).toFixed(2) + "%";
      }
    }, { threshold: 0.6 });
    slides.forEach(s => io.observe(s));
  } else {
    document.querySelectorAll(".fade-up").forEach(el => el.classList.add("visible"));
  }

  /* KEYBOARD NAV (accessibility) */
  if (slidesRoot && slides.length) {
    slidesRoot.tabIndex = 0;
    slidesRoot.addEventListener("keydown", e => {
      const idx = slides.findIndex(s => {
        const r = s.getBoundingClientRect();
        return r.top >= 0 && r.top < innerHeight * 0.6;
      });
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        slides[Math.min(idx+1, slides.length-1)].scrollIntoView({ behavior: "smooth" });
      }
      if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        slides[Math.max(idx-1, 0)].scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  /* KINETIC TYPE */
  (function(){
    const el = document.querySelector(".swap");
    if (!el || prefersReduced) return;
    let words = []; try { words = JSON.parse(el.dataset.words || "[]"); } catch {}
    if (!words.length) return;
    let i = 0;
    setInterval(() => {
      i = (i + 1) % words.length;
      el.classList.remove("enter"); void el.offsetWidth;
      el.textContent = words[i];
      el.classList.add("enter");
    }, 2800);
  })();

  /* PARALLAX — Y-only (kein X, kein seitliches Schieben) */
  (function(){
    if (prefersReduced) return;
    const glowA = document.querySelector(".glow-a");
    const glowB = document.querySelector(".glow-b");
    const cards = document.querySelectorAll(".parallax");
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(()=>{
        const t = scrollY || 0;
        if (glowA) glowA.style.transform = `translate3d(0,${t*-0.02}px,0)`;
        if (glowB) glowB.style.transform = `translate3d(0,${t*-0.04}px,0)`;
        cards.forEach(c=>{
          const r = c.getBoundingClientRect();
          const p = (r.top / innerHeight - .5);
          c.style.transform = `translate3d(0,${p*-12}px,0)`;
        });
      });
    };
    addEventListener("scroll", onScroll, { passive:true });
    onScroll();
  })();

  /* PARTICLES — Atmosphere (DPR <= 2) */
  (function(){
    const canvas = document.getElementById("particles");
    if (!canvas || prefersReduced) return;
    const ctx = canvas.getContext("2d");
    const DPR = Math.min(devicePixelRatio || 1, 2);
    let W,H,pts=[];

    function resize(){
      const b = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, b.width * DPR);
      canvas.height = Math.max(1, b.height * DPR);
      ctx.setTransform(DPR,0,0,DPR,0,0);
      W=b.width; H=b.height;
      const density = W < 380 ? 40 : 70;
      pts = Array.from({length:density},()=>({
        x:Math.random()*W, y:Math.random()*H,
        r:Math.random()*1.8+.4, s:.2+Math.random()
      }));
    }
    function draw(){
      ctx.clearRect(0,0,W,H);
      ctx.fillStyle="rgba(233,211,148,.28)";
      pts.forEach(p=>{
        p.y+=p.s*.25; if(p.y>H) p.y=-10;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
      });
      requestAnimationFrame(draw);
    }
    resize(); addEventListener("resize", resize, { passive:true }); draw();
  })();

  /* STORY GATE — Ampel earned */
  const gateBtn = document.querySelector("[data-earn-ampel]");
  const gateSlide = document.getElementById("b4");
  gateBtn?.addEventListener("click", ()=>{
    if (gateSlide?.hasAttribute("hidden")) {
      gateSlide.removeAttribute("hidden");
      gateSlide.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth" });
    }
  });

  /* AMPPEL CHECK — Calm payoff */
  GODDATA.onReady(data=>{
    const steps = document.getElementById("check-steps");
    const result = document.getElementById("check-result");
    if (!steps || !result) return;
    renderCheck(data.checks?.ampel || defaultCheck());
  });

  function defaultCheck(){
    return {
      questions:[
        { text:"Wenn du 6 Monate ausfällst – wie sicher wäre euer Einkommen?",
          options:{green:"Stabil", yellow:"Knapp", red:"Kritisch"} },
        { text:"Wie schnell findest du wichtige Unterlagen?",
          options:{green:"Sofort", yellow:"Meistens", red:"Schwierig"} },
        { text:"Wie fühlt sich Zukunft & Alter an?",
          options:{green:"Gut", yellow:"Unklar", red:"Belastend"} }
      ],
      scoring:{ values:{green:3,yellow:2,red:1}, thresholds:{yellow:6, red:8} },
      results:{
        green:{ title:"🟢 Für heute ruhig", text:"Dein System wirkt stabil.", micro:"Behalten, nicht zerdenken."},
        yellow:{ title:"🟡 Bald wichtig", text:"Ein paar Dinge verdienen Aufmerksamkeit.", micro:"Ohne Druck, Schritt für Schritt."},
        red:{ title:"🔴 Heute wichtig", text:"Mindestens ein Bereich braucht Fokus.", micro:"Kurz ordnen – dann wird es ruhiger."}
      }
    };
  }

  function renderCheck(check){
    let score=0, step=0;
    const stepsRoot=document.getElementById("check-steps");
    const resultRoot=document.getElementById("check-result");
    stepsRoot.innerHTML=""; resultRoot.innerHTML="";

    check.questions.forEach((q,i)=>{
      const el=document.createElement("div");
      el.className="check-step";
      if(i>0) el.hidden=true;
      el.innerHTML=`<h3>${q.text}</h3>
        <div class="cta-row">
          <button class="btn btn-primary" data-a="green">${q.options.green}</button>
          <button class="btn" data-a="yellow">${q.options.yellow}</button>
          <button class="btn" data-a="red">${q.options.red}</button>
        </div>`;
      stepsRoot.appendChild(el);
    });

    const stepEls=[...stepsRoot.children];
    stepsRoot.querySelectorAll("[data-a]").forEach(btn=>{
      btn.addEventListener("click",()=>{
        score += check.scoring.values[btn.dataset.a] || 0;
        step++;
        if(step >= check.questions.length){
          stepEls.at(-1).hidden=true;
          show(resolve(score));
        }else{
          stepEls[step-1].hidden=true;
          stepEls[step].hidden=false;
          stepEls[step].scrollIntoView({ behavior:"smooth", block:"start" });
        }
      });
    });

    function resolve(s){ if(s>=check.scoring.thresholds.red) return "red"; if(s>=check.scoring.thresholds.yellow) return "yellow"; return "green"; }
    function show(color){
      const r=check.results[color];
      resultRoot.innerHTML = `
        <div class="result-card result-${color}">
          <h3>${r.title}</h3>
          <p>${r.text}</p>
          <p class="micro">${r.micro||""}</p>
        </div>`;
      resultRoot.scrollIntoView({ behavior:"smooth", block:"start" });
    }
  }
})();
