/* ============================================================
   GODMODE — HOLLYWOOD CUT (2026)
   Narrative Engine · Mobile polish · Idle animations
============================================================ */
(function () {
  "use strict";

  document.documentElement.classList.remove("no-js");
  const y = document.getElementById('yNow'); if (y) y.textContent = String(new Date().getFullYear());

  /* Failsafe Data */
  if (!window.GODDATA) {
    const Q=[]; window.GODDATA={ onReady(cb){ if(typeof cb==="function") Q.push(cb);} };
    fetch("./data.json")
      .then(r=>r.ok?r.json():Promise.reject())
      .then(d=>{ while(Q.length){ try{Q.shift()(d);}catch{}} })
      .catch(()=>{ const d={brand:{year:String(new Date().getFullYear())},checks:{}}; while(Q.length){ try{Q.shift()(d);}catch{}} });
  }

  const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Slides / Bullets / Progress */
  const slidesRoot = document.querySelector("main.slides");
  const slides = slidesRoot ? [...slidesRoot.querySelectorAll(":scope > .slide")] : [];
  const bullets = document.getElementById("bullets");
  const progressBar = document.querySelector("#progress span");
  const cut = document.querySelector('.cut-overlay');

  if (bullets && slides.length) {
    slides.forEach((s,i)=>{
      const b=document.createElement("button");
      b.setAttribute("aria-label",`Zu Abschnitt ${i+1}`);
      b.addEventListener("click",()=>cinematicScroll(s),{passive:true});
      bullets.appendChild(b);
    });
  }

  if ("IntersectionObserver" in window && slides.length) {
    const io=new IntersectionObserver(entries=>{
      entries.forEach(e=>{
        if(e.isIntersecting){
          e.target.classList.add("visible");
          e.target.querySelectorAll(".parallax").forEach(el=> el.style.willChange="transform");
        }
      });
      const active=entries.filter(e=>e.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top)[0];
      if(active){
        const idx = slides.indexOf(active.target);
        bullets?.querySelectorAll("button").forEach((b,i)=> b.setAttribute("aria-current", String(i===idx)));
        if(progressBar){ progressBar.style.width = (((idx+1)/slides.length)*100).toFixed(2)+"%"; }
      }
    },{threshold:0.68});
    slides.forEach(s=>io.observe(s));
  } else {
    document.querySelectorAll(".fade-up").forEach(el=>el.classList.add("visible"));
  }

  /* Keyboard & Touch */
  if (slidesRoot && slides.length) {
    slidesRoot.tabIndex=0;
    slidesRoot.addEventListener("keydown", (e)=>{
      const idx=slides.findIndex(s=>{const r=s.getBoundingClientRect();return r.top>=0 && r.top<innerHeight*0.6;});
      if(e.key==="ArrowDown"||e.key==="PageDown"){ e.preventDefault(); cinematicScroll(slides[Math.min(idx+1,slides.length-1)]); }
      if(e.key==="ArrowUp"||e.key==="PageUp"){ e.preventDefault(); cinematicScroll(slides[Math.max(idx-1,0)]); }
    });

    let y0=null,t0=0;
    slidesRoot.addEventListener("touchstart",(e)=>{ y0=e.touches[0].clientY; t0=Date.now(); },{passive:true});
    slidesRoot.addEventListener("touchend",(e)=>{
      if(y0==null) return;
      const dy=e.changedTouches[0].clientY - y0; const dt=Date.now()-t0;
      if(Math.abs(dy)>50 && dt<600){
        const idx=slides.findIndex(s=>{const r=s.getBoundingClientRect();return r.top>=-10 && r.top<innerHeight*0.6;});
        cinematicScroll(dy<0 ? slides[Math.min(idx+1,slides.length-1)] : slides[Math.max(idx-1,0)]);
      }
      y0=null;
    },{passive:true});
  }

  /* Anchor links -> cinematic cut */
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click',e=>{
      const id=a.getAttribute('href');
      if(id && id.length>1){
        const t=document.querySelector(id);
        if(t){ e.preventDefault(); cinematicScroll(t); }
      }
    },{passive:false});
  });

  function cinematicScroll(target){
    if(!target) return;
    cut?.classList.add('on');
    setTimeout(()=>{ target.scrollIntoView({behavior: prefersReduced?"auto":"smooth", block:'start'}); },120);
    setTimeout(()=>{ cut?.classList.remove('on'); },360);
  }

  /* Kinetic Type */
  (function(){
    const el=document.querySelector(".swap");
    if(!el || prefersReduced) return;
    let words=[]; try{ words=JSON.parse(el.dataset.words||"[]"); }catch{}
    if(!words.length) return;
    let i=0; setInterval(()=>{ i=(i+1)%words.length; el.classList.remove("enter"); void el.offsetWidth; el.textContent=words[i]; el.classList.add("enter"); }, 2800);
  })();

  /* Parallax (idle) */
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
        glowA && (glowA.style.transform=`translate3d(0,${t*-0.02}px,0)`);
        glowB && (glowB.style.transform=`translate3d(0,${t*-0.04}px,0)`);
        cards.forEach(c=>{
          const r=c.getBoundingClientRect(); const p=(r.top/innerHeight - .5);
          c.style.transform=`translate3d(0,${p*-14}px,0)`;
        });
      });
    };
    addEventListener("scroll", onScroll, {passive:true});
    onScroll();
  }

  /* Particles (idle) */
  function initParticles(){
    const canvas=document.getElementById("particles");
    if(!canvas || prefersReduced) return;
    const ctx=canvas.getContext("2d"); const DPR=Math.min(devicePixelRatio||1,2);
    let W,H,pts=[];
    function resize(){
      const b=canvas.getBoundingClientRect();
      canvas.width=Math.max(1,b.width*DPR); canvas.height=Math.max(1,b.height*DPR);
      ctx.setTransform(DPR,0,0,DPR,0,0); W=b.width; H=b.height;
      pts=Array.from({length:70},()=>({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.8+.4,s:.2+Math.random()}));
    }
    function draw(){
      ctx.clearRect(0,0,W,H); ctx.fillStyle="rgba(233,211,148,.28)";
      pts.forEach(p=>{ p.y+=p.s*.25; if(p.y>H) p.y=-10; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill(); });
      requestAnimationFrame(draw);
    }
    resize(); addEventListener("resize", resize, {passive:true}); draw();
  }

  /* Idle start fancy stuff */
  (('requestIdleCallback'in window)?requestIdleCallback:setTimeout)(()=>{ initParallax(); initParticles(); }, 300);

  /* Gate Reveal (cinematic) */
  const gateBtn=document.querySelector('[data-earn-ampel]');
  const gateSlide=document.getElementById('b4');
  gateBtn?.addEventListener('click',()=>{
    gateBtn.setAttribute('aria-expanded','true');
    cut?.classList.add('on');

    setTimeout(()=>{
      if(gateSlide){
        gateSlide.removeAttribute('aria-hidden');
        gateSlide.classList.add('show');
        cinematicScroll(gateSlide);
      }
    },260);

    setTimeout(()=>{ cut?.classList.remove('on'); },520);
  });

  /* Check */
  GODDATA.onReady(data=>{
    const stepsRoot=document.getElementById("check-steps");
    const resultRoot=document.getElementById("check-result");
    if(!stepsRoot || !resultRoot) return;

    renderCheck(data.checks?.ampel || defaultCheck());
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
        green:{ title:"🟢 Für heute ruhig", text:"Dein System wirkt stabil.", micro:"Behalten, nicht zerdenken."},
        yellow:{ title:"🟡 Bald wichtig", text:"Ein paar Dinge verdienen Aufmerksamkeit.", micro:"Ohne Druck, Schritt für Schritt."},
        red:{ title:"🔴 Heute wichtig", text:"Mindestens ein Bereich braucht Fokus.", micro:"Kurz ordnen – dann wird es ruhiger."}
      }
    };
  }

  function pulseProgress(){
    const p=document.querySelector('#progress span'); if(!p) return;
    p.animate([{transform:'scaleY(1)'},{transform:'scaleY(1.6)'},{transform:'scaleY(1)'}],
              {duration:280,easing:'ease-out'});
  }

  function renderCheck(check){
    let score=0, step=0;
    const stepsRoot=document.getElementById("check-steps");
    const resultRoot=document.getElementById("check-result");
    stepsRoot.innerHTML=""; resultRoot.innerHTML="";

    check.questions.forEach((q,i)=>{
      const el=document.createElement("div");
      el.className="check-step"; if(i>0) el.hidden=true;
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
      btn.addEventListener("click", ()=>{
        score += check.scoring.values[btn.dataset.a] || 0;
        step++; pulseProgress();

        if(step >= check.questions.length){
          stepEls.at(-1).hidden=true; showResult(resolve(score));
        }else{
          stepEls[step-1].hidden=true; stepEls[step].hidden=false;
          cinematicScroll(stepEls[step]);
        }
      },{passive:true});
    });

    function resolve(s){ if(s>=check.scoring.thresholds.red) return "red"; if(s>=check.scoring.thresholds.yellow) return "yellow"; return "green"; }
    function showResult(color){
      const r=check.results[color];
      resultRoot.innerHTML=`<div class="result-card result-${color}">
        <h3>${r.title}</h3><p>${r.text}</p><p class="micro">${r.micro}</p>
      </div>`;
      cinematicScroll(resultRoot);
    }
  }

})();
