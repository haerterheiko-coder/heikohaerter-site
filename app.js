// /app.js
/* ============================================================
   GODMODE 2026 — app.js (FINAL)
   Regisseur: lädt Daten, steuert Fade-Up, rendert Checks
============================================================ */
(function () {
  "use strict";

  // a) Safety: no-js entfernen
  document.documentElement.classList.remove("no-js");

  // b) Data-Loader (GODDATA-Shim)
  if (!window.GODDATA) {
    const q = [];
    window.GODDATA = { onReady(cb){ if(typeof cb==="function") q.push(cb); } };
    fetch("./data.json")
      .then(r => r.ok ? r.json() : Promise.reject(new Error("data.json")))
      .then(d => { while(q.length){ try{ q.shift()(d); }catch(e){} } })
      .catch(() => { while(q.length){ try{ q.shift()({brand:{year:String(new Date().getFullYear())}}); }catch(e){} } });
  }

  const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // c) On data ready
  GODDATA.onReady((data) => {
    // Fade-Up
    const els = document.querySelectorAll(".fade-up");
    if (!prefersReduced && "IntersectionObserver" in window) {
      const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting){ e.target.classList.add("visible"); io.unobserve(e.target);} }), {threshold:.12});
      els.forEach(el => io.observe(el));
    } else { els.forEach(el => el.classList.add("visible")); }

    // Hook-Rotator (optional: .hook-rotate)
    const hookEl = document.querySelector(".hook-rotate");
    const hooks = [...(data.micro_hooks?.emotional||[]), ...(data.micro_hooks?.rational||[])].filter(Boolean);
    if (hookEl && hooks.length) {
      if (prefersReduced) hookEl.textContent = hooks[0];
      else { let i=0; setInterval(()=>{ hookEl.style.opacity=0; setTimeout(()=>{ hookEl.textContent=hooks[i++%hooks.length]; hookEl.style.opacity=1; },220); },3600); }
    }

    // ===== Check Renderer (personal + employer) =====
    function renderCheck({containerStepsId, containerResultId, startBtnId, checkKey}) {
      const check = data.checks?.[checkKey];
      if (!check) return;

      const stepsRoot  = document.getElementById(containerStepsId);
      const resultRoot = document.getElementById(containerResultId);
      const startBtn   = startBtnId ? document.getElementById(startBtnId) : null;

      if (!stepsRoot || !resultRoot) return;

      let score = 0, step = 0;

      function resolve(scoreVal){
        const t = check.scoring.thresholds;
        if (scoreVal >= t.red) return "red";
        if (scoreVal >= t.yellow) return "yellow";
        return "green";
      }

      function showResult(color){
        const r = check.results[color];
        resultRoot.innerHTML = `<div class="result-card result-${color}">
          <h3>${r.title}</h3><p>${r.text}</p><p class="hero-micro">${r.micro||""}</p></div>`;
        if (!prefersReduced) resultRoot.scrollIntoView({behavior:"smooth",block:"start"});
      }

      function renderSteps(){
        stepsRoot.innerHTML = "";
        score = 0; step = 0;

        check.questions.forEach((q, idx) => {
          const stepEl = document.createElement("div");
          stepEl.className = "check-step stack";
          if (idx>0) stepEl.hidden = true;
          stepEl.innerHTML = `<h3 class="m-0">${q.text}</h3>
            <div class="inline">
              <button class="btn btn-primary" data-answer="green">${q.options.green}</button>
              <button class="btn btn-ghost"   data-answer="yellow">${q.options.yellow}</button>
              <button class="btn btn-ghost"   data-answer="red">${q.options.red}</button>
            </div>`;
          stepsRoot.appendChild(stepEl);
        });

        const steps = Array.from(stepsRoot.querySelectorAll(".check-step"));
        stepsRoot.querySelectorAll("[data-answer]").forEach(btn=>{
          btn.addEventListener("click",()=>{
            score += check.scoring.values[btn.dataset.answer] || 0;
            step += 1;
            if (step >= check.questions.length) { steps[steps.length-1].hidden = true; showResult(resolve(score)); }
            else { steps[step-1].hidden = true; steps[step].hidden = false; }
          });
        });
      }

      const startHandler = () => {
        const startBox = startBtn?.id==="startEmployerBtn" ? document.getElementById("employer-start") : document.getElementById("check-start");
        if (startBox) startBox.hidden = true;
        renderSteps();
        stepsRoot.scrollIntoView({behavior: prefersReduced ? "auto" : "smooth", block:"start"});
      };

      if (startBtn) startBtn.addEventListener("click", startHandler);
      // Autostart wenn kein Start-Button existiert (Index „Host“-Variante)
      if (!startBtn && (stepsRoot.childElementCount===0)) { /* nur hosten, kein Autostart */ }
    }

    // Personal (Index)
    if (document.getElementById("check-steps") && document.getElementById("check-result")) {
      // optionaler Start-Button in index nicht vorhanden -> nur Host
      renderCheck({containerStepsId:"check-steps", containerResultId:"check-result", startBtnId:null, checkKey:"ampel"});
    }

    // Arbeitgeber
    if (document.getElementById("employer-check-steps") && document.getElementById("employer-check-result")) {
      renderCheck({containerStepsId:"employer-check-steps", containerResultId:"employer-check-result", startBtnId:"startEmployerBtn", checkKey:"arbeitgeber"});
    }
  });
})();
