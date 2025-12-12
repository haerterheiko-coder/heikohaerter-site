// /app.js
(function () {
  "use strict";

  document.documentElement.classList.remove("no-js");

  // GODDATA shim (falls keine data.json benötigt, bleibt leer – nichts bricht)
  if (!window.GODDATA) {
    const Q=[]; window.GODDATA={ onReady(cb){ if(typeof cb==="function") Q.push(cb);} };
    fetch("./data.json").then(r=>r.ok?r.json():Promise.reject()).then(d=>{ while(Q.length){ try{Q.shift()(d);}catch{}} })
    .catch(()=>{ const d={brand:{year:String(new Date().getFullYear())},checks:{}}; while(Q.length){ try{Q.shift()(d);}catch{}}});
  }

  const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Slides + UI
  const slidesRoot = document.querySelector("main.slides");
  const slides = slidesRoot ? slidesRoot.querySelectorAll(":scope > .slide") : [];
  const bullets = document.getElementById("bullets");
  const progressBar = document.querySelector("#progress span");

  // Bullets
  if (bullets && slides.length) {
    slides.forEach((s, i) => {
      const b = document.createElement("button");
      b.setAttribute("aria-label", "Zu Slide " + (i + 1));
      b.addEventListener("click", () => s.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" }));
      bullets.appendChild(b);
    });
  }

  // Fade-up + bullets + progress + parallax
  if (slides.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          // leichte parallax-aktivierung
          e.target.querySelectorAll(".parallax").forEach(el => el.style.willChange = "transform");
        }
      });
      const vis = entries.filter(e=>e.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top)[0];
      if (vis) {
        const idx = [...slides].indexOf(vis.target);
        bullets?.querySelectorAll("button").forEach((b,i)=> b.setAttribute("aria-current", i===idx ? "true" : "false"));
        progressBar && (progressBar.style.width = (((idx+1)/slides.length)*100).toFixed(2)+"%");
      }
    }, { threshold: .6 });
    slides.forEach(s => io.observe(s));
  } else {
    document.querySelectorAll(".fade-up").forEach(el=>el.classList.add("visible"));
  }

  // Keyboard
  if (slidesRoot && slides.length) {
    slidesRoot.setAttribute("tabindex","0");
    slidesRoot.addEventListener("keydown", (e)=>{
      const idx = [...slides].findIndex(s => {
        const r = s.getBoundingClientRect();
        return r.top >= 0 && r.top < innerHeight*0.6;
      });
      if (e.key==="ArrowDown"||e.key==="PageDown") { e.preventDefault(); slides[Math.min(idx+1,slides.length-1)].scrollIntoView({behavior:"smooth"}); }
      if (e.key==="ArrowUp"||e.key==="PageUp") { e.preventDefault(); slides[Math.max(idx-1,0)].scrollIntoView({behavior:"smooth"}); }
    });
  }

  // Touch swipe
  if (slidesRoot && "ontouchstart" in window) {
    let y0=null, t0=0;
    slidesRoot.addEventListener("touchstart",(e)=>{ y0=e.touches[0].clientY; t0=Date.now(); },{passive:true});
    slidesRoot.addEventListener("touchend",(e)=>{
      if(y0==null) return;
      const dy = e.changedTouches[0].clientY - y0;
      const dt = Date.now()-t0;
      if (Math.abs(dy) > 50 && dt < 600) {
        const idx=[...slides].findIndex(s=> s.getBoundingClientRect().top >= -10 && s.getBoundingClientRect().top < innerHeight*0.6);
        if (dy<0) slides[Math.min(idx+1,slides.length-1)].scrollIntoView({behavior:"smooth"});
        else      slides[Math.max(idx-1,0)].scrollIntoView({behavior:"smooth"});
      }
      y0=null;
    },{passive:true});
  }

  // Kinetic type rotator
  (function(){
    const el = document.querySelector(".swap");
    if(!el) return;
    let words=[];
    try{ words = JSON.parse(el.getAttribute("data-words")||"[]"); }catch{}
    if(!words.length) return;
    let i=0;
    const tick=()=>{
      i=(i+1)%words.length;
      el.classList.remove("enter");
      // repaint trick
      void el.offsetWidth;
      el.textContent=words[i];
      el.classList.add("enter");
    };
    if (!prefersReduced) setInterval(tick, 2800);
  })();

  // Parallax (headlines/cards/stage)
  (function(){
    if (prefersReduced) return;
    const stageA = document.querySelector(".glow-a");
    const stageB = document.querySelector(".glow-b");
    const cards = document.querySelectorAll(".parallax");
    let raf;
    const onScroll = ()=>{
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(()=>{
        const t = window.scrollY || 0;
        const f = (v)=>`translate3d(0,${v}px,0)`;
        stageA && (stageA.style.transform = f(t*-0.02));
        stageB && (stageB.style.transform = f(t*-0.04));
        cards.forEach((c,idx)=>{
          const r=c.getBoundingClientRect();
          const p=(r.top/innerHeight - .5);
          c.style.transform = `translate3d(0, ${p* -12}px, 0)`;
        });
      });
    };
    addEventListener("scroll", onScroll, {passive:true}); onScroll();
  })();

  // Particles (ambient, cheap)
  (function(){
    const canvas = document.getElementById("particles");
    if(!canvas || prefersReduced) return;
    const ctx = canvas.getContext("2d");
    const DPR = Math.min(devicePixelRatio||1, 2);
    let W,H,pts=[];
    function resize(){
      const b=canvas.getBoundingClientRect();
      W=b.width; H=b.height; canvas.width=W*DPR; canvas.height=H*DPR; ctx.scale(DPR,DPR);
      pts = Array.from({length:60},()=>({x:Math.random()*W,y:Math.random()*H, r:Math.random()*1.6+0.4, s:0.2+Math.random()*0.8 }));
    }
    function draw(){
      ctx.clearRect(0,0,W,H);
      ctx.fillStyle="rgba(233,211,148,.28)";
      pts.forEach(p=>{ p.y+=p.s*0.25; if(p.y>H) p.y=-10; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill(); });
      requestAnimationFrame(draw);
    }
    resize(); addEventListener("resize", resize); draw();
  })();

  // Reveal gate (Beat 4)
  const revealGateBtn = document.querySelector("[data-earn-ampel]");
  const revealSlide = document.querySelector("#b4");
  revealGateBtn?.addEventListener("click", ()=>{
    if (revealSlide?.hasAttribute("hidden")) {
      revealSlide.removeAttribute("hidden");
      revealSlide.scrollIntoView({behavior: prefersReduced ? "auto" : "smooth"});
    }
  });

  // Ampel Check (data-driven optional)
  GODDATA.onReady((data)=>{
    if (document.getElementById("check-steps") && document.getElementById("check-result")) {
      renderCheck({ stepsId:"check-steps", resultId:"check-result", check:data.checks?.ampel || defaultCheck() });
    }
  });

  function defaultCheck(){
    return {
      questions:[
        { text:"Wenn du 6 Monate ausfällst – wie sicher wäre euer Einkommen?",
          options:{green:"Wir wären stabil", yellow:"Wir kämen klar – knapp", red:"Das wäre kritisch"} },
        { text:"Wie gut findest du wichtige Unterlagen, wenn du sie brauchst?",
          options:{green:"Finde alles", yellow:"Finde das Meiste", red:"Suche lange / finde nichts"} },
        { text:"Wie wohl fühlst du dich bei Zukunft & Alter?",
          options:{green:"Fühlt sich gut an", yellow:"Teilweise – unsicher", red:"Gar nicht / unsicher"} }
      ],
      scoring:{ values:{green:3, yellow:2, red:1}, thresholds:{yellow:6, red:8} },
      results:{
        green:{ title:"🟢 Passt für heute", text:"Für heute wirkt alles entspannt.", micro:"Als Nächstes: ruhig planen."},
        yellow:{ title:"🟡 Bald wichtig", text:"Ein paar Dinge stehen bald an.", micro:"Als Nächstes angehen."},
        red:{ title:"🔴 Heute wichtig", text:"Mindestens ein Bereich braucht heute deine Aufmerksamkeit.", micro:"Kurz priorisieren."}
      }
    };
  }

  function renderCheck({stepsId, resultId, check}){
    const stepsRoot=document.getElementById(stepsId);
    const resultRoot=document.getElementById(resultId);
    stepsRoot.innerHTML=""; resultRoot.innerHTML="";
    let score=0, step=0;

    // Steps
    check.questions.forEach((q, idx)=>{
      const el=document.createElement("div");
      el.className="check-step";
      if(idx>0) el.hidden=true;
      el.innerHTML=`<h3>${q.text}</h3>
        <div class="cta-row">
          <button class="btn btn-primary" data-answer="green">${q.options.green}</button>
          <button class="btn" data-answer="yellow">${q.options.yellow}</button>
          <button class="btn" data-answer="red">${q.options.red}</button>
        </div>`;
      stepsRoot.appendChild(el);
    });

    const stepEls=[...stepsRoot.querySelectorAll(".check-step")];
    stepsRoot.querySelectorAll("[data-answer]").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        score += check.scoring.values[btn.dataset.answer] || 0;
        step++;
        progressTick();
        if(step >= check.questions.length){
          stepEls.at(-1).hidden = true;
          showResult(resolve(score, check.scoring.thresholds), check.results);
        } else {
          stepEls[step-1].hidden = true;
          stepEls[step].hidden = false;
          stepEls[step].scrollIntoView({behavior: prefersReduced ? "auto" : "smooth", block:"start"});
        }
      });
    });

    function resolve(s,t){ if(s>=t.red) return "red"; if(s>=t.yellow) return "yellow"; return "green"; }

    function showResult(color, results){
      const r=results[color];
      resultRoot.innerHTML = `<div class="result-card result-${color}">
        <h3>${r.title}</h3><p>${r.text}</p><p class="micro">${r.micro||""}</p>
        ${actions(color)}
      </div>`;
      resultRoot.scrollIntoView({behavior: prefersReduced ? "auto" : "smooth", block:"start"});
      if(color==="green" && !prefersReduced) confetti(resultRoot.querySelector(".result-card"));
    }

    // Micro-dopamine
    function progressTick(){
      const span = document.querySelector("#progress span");
      const total = check.questions.length;
      const idx = Math.min(step, total);
      const base = (((idx)/ (slides.length||6)) * 100);
      span && (span.style.width = Math.max(parseFloat(span.style.width)||0, base)+"%");
    }

    function actions(color){
      const wa="https://wa.me/?text=";
      if(color==="red")   return `<div class="cta"><a class="btn btn-primary" href="${wa}Kurz%2010%20Minuten%20sprechen">💬 Kurz sprechen</a><a class="btn btn-ghost" href="./weitergeben.html">🔗 Weitergeben</a></div>`;
      if(color==="yellow")return `<div class="cta"><a class="btn btn-primary" href="${wa}Als%20N%C3%A4chstes%20angehen">🧭 Als Nächstes angehen</a><a class="btn btn-ghost" href="./weitergeben.html">🔗 Weitergeben</a></div>`;
      return `<div class="cta"><a class="btn btn-primary" href="${wa}Smarter%20machen%3F">✨ Smarter machen?</a><a class="btn btn-ghost" href="./weitergeben.html">🔗 Weitergeben</a></div>`;
    }
  }

  // Tiny confetti (no lib)
  function confetti(target){
    const box = target.getBoundingClientRect();
    const canvas = document.createElement("canvas");
    canvas.width = box.width; canvas.height = 160;
    canvas.style.cssText = `position:absolute;left:${box.left + scrollX}px;top:${box.top + scrollY - 10}px;pointer-events:none;z-index:99`;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    const bits = Array.from({length:80},()=>({
      x: Math.random()*canvas.width, y: Math.random()*-60,
      s: 2+Math.random()*3, a: 0.6+Math.random()*0.4, c: ["#7EDFA5","#F7E39A","#F3A6A6","#EADCA8"][Math.floor(Math.random()*4)]
    }));
    let t=0; function draw(){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      bits.forEach(b=>{ b.y+=b.s; b.x+=Math.sin((t+b.y)*0.02); ctx.globalAlpha=b.a; ctx.fillStyle=b.c; ctx.fillRect(b.x,b.y,3,6); });
      t++; if(t<240) requestAnimationFrame(draw); else canvas.remove();
    } draw();
  }

})();
