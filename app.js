/* ============================================================
   GODMODE 2026 — app.js (FINAL · COPY/PASTE)
   Rolle: ruhige Zustandsmaschine
   Keine Sales-Logik · Kein Druck · Skeptiker-first
============================================================ */

(function () {
  "use strict";

  const onReady = (fn) =>
    document.readyState === "loading"
      ? document.addEventListener("DOMContentLoaded", fn, { once: true })
      : fn();

  const prefersReducedMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- GODDATA ---------------- */
  const GODDATA = (function () {
    const q = [];
    let cache = null;
    const fallback = { brand:{year:"2026"}, micro_hooks:{emotional:[],rational:[]}, checks:{} };

    async function load(){
      if(cache) return cache;
      try{
        const r = await fetch("/data.json",{cache:"no-store"});
        cache = r.ok ? await r.json() : fallback;
      }catch{ cache = fallback; }
      return cache;
    }
    async function flush(){
      const d = await load();
      while(q.length) q.shift()(d);
    }
    return { onReady(fn){ q.push(fn); Promise.resolve().then(flush); } };
  })();

  window.GODDATA = GODDATA;

  /* ---------------- FADE-UP FIX ---------------- */
  function initFadeUp(){
    const els=[...document.querySelectorAll(".fade-up")];
    if(!els.length) return;

    const vh=innerHeight;
    els.forEach(el=>{
      const r=el.getBoundingClientRect();
      if(prefersReducedMotion()||r.top<vh*0.9) el.classList.add("visible");
    });

    if(prefersReducedMotion()||!("IntersectionObserver"in window)) return;
    const io=new IntersectionObserver(e=>{
      e.forEach(x=>{
        if(x.isIntersecting){
          x.target.classList.add("visible");
          io.unobserve(x.target);
        }
      });
    },{threshold:.12});
    els.filter(e=>!e.classList.contains("visible")).forEach(e=>io.observe(e));
  }

  /* ---------------- HOOK ROTATOR ---------------- */
  function initHooks(data){
    const el=document.querySelector(".hook-rotate");
    if(!el) return;
    const hooks=[...(data.micro_hooks.emotional||[]),...(data.micro_hooks.rational||[])];
    if(!hooks.length){ el.style.opacity=1; return; }

    let i=0;
    el.textContent=hooks[0];
    if(prefersReducedMotion()) return;

    setInterval(()=>{
      el.style.opacity=0;
      setTimeout(()=>{
        el.textContent=hooks[++i%hooks.length];
        el.style.opacity=1;
      },240);
    },3600);
  }

  /* ---------------- BOOT ---------------- */
  onReady(()=>{
    initFadeUp();
    document.documentElement.classList.remove("no-js");

    GODDATA.onReady(data=>{
      document.querySelectorAll("[data-year]").forEach(e=>e.textContent=data.brand.year);
      initHooks(data);
    });
  });
})();
