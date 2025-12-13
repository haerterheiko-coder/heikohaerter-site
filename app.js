/* ============================================================
   HOLLYWOOD CUT (2026)
   Narrative Engine · Mobile polish · CLS-frei · No libs
============================================================ */
(function () {
  "use strict";

  /* ---------- Housekeeping ---------- */
  document.documentElement.classList.remove("no-js");
  const yearEl = document.getElementById("yNow");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- GODDATA failsafe (seite lebt ohne data.json) ---------- */
  if (!window.GODDATA) {
    const Q = [];
    window.GODDATA = { onReady(cb){ if (typeof cb === "function") Q.push(cb); } };
    fetch("./data.json")
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { while (Q.length) { try { Q.shift()(d); } catch {} } })
      .catch(() => {
        const d = { brand:{year:String(new Date().getFullYear())}, checks:{} };
        while (Q.length) { try { Q.shift()(d); } catch {} }
      });
  }

  /* ---------- Small utilities ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const cut = $(".cut-overlay");

  const idle = (fn, delay = 300) =>
    ("requestIdleCallback" in window ? requestIdleCallback : (cb)=>setTimeout(cb, delay))(fn);

  const smooth = prefersReduced ? "auto" : "smooth";

  function cinematicScroll(target){
    if(!target) return;
    cut && cut.classList.add("on");
    setTimeout(()=> target.scrollIntoView({behavior:smooth, block:"start"}), 120);
    setTimeout(()=> cut && cut.classList.remove("on"), 360);
  }

  function pulseProgress(){
    const p = $("#progress span");
    if(!p) return;
    p.animate(
      [{transform:"scaleY(1)"},{transform:"scaleY(1.6)"},{transform:"scaleY(1)"}],
      {duration:280, easing:"ease-out"}
    );
  }

  /* ============================================================
     Slides / Bullets / Progress / Visibility
  ============================================================ */
  const slidesRoot = $("main.slides");
  const slides = slidesRoot ? $$(":scope > .slide", slidesRoot) : [];
  const bullets = $("#bullets");
  const progressBar = $("#progress span");

  // Build bullets (thumb-friendly; aria)
  if (bullets && slides.length) {
    slides.forEach((s, i) => {
      const b = document.createElement("button");
      b.setAttribute("aria-label", `Zu Abschnitt ${i+1}`);
      b.addEventListener("click", () => cinematicScroll(s));
      bullets.appendChild(b);
    });
  }

  // Intersection engine: fade-up, bullets active, progress width
  if ("IntersectionObserver" in window && slides.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          // Parallax elements erst aktivieren, wenn in Sicht
          $$(".parallax", e.target).forEach(el => el.style.willChange = "transform");
        }
      });

      const active = entries
        .filter(e => e.isIntersecting)
        .sort((a,b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];

      if (active) {
        const idx = slides.indexOf(active.target);
        bullets?.querySelectorAll("button")
          .forEach((b,i) => b.setAttribute("aria-current", String(i===idx)));
        if (progressBar) {
          progressBar.style.width = (((idx + 1) / slides.length) * 100).toFixed(2) + "%";
        }
      }
    }, { threshold: 0.68, root: slidesRoot || null });

    slides.forEach(s => io.observe(s));
  } else {
    $$(".fade-up").forEach(el => el.classList.add("visible"));
  }

  /* ============================================================
     Keyboard & Touch (Container scroll)
  ============================================================ */
  if (slidesRoot && slides.length) {
    slidesRoot.tabIndex = 0;

    slidesRoot.addEventListener("keydown", (e) => {
      const idx = slides.findIndex(s => {
        const r = s.getBoundingClientRect();
        return r.top >= 0 && r.top < innerHeight * 0.6;
      });
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        cinematicScroll(slides[Math.min(idx + 1, slides.length - 1)]);
      }
      if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        cinematicScroll(slides[Math.max(idx - 1, 0)]);
      }
    });

    // Swipe (iOS/Android)
    let y0 = null, t0 = 0;
    slidesRoot.addEventListener("touchstart", (e) => {
      y0 = e.touches[0].clientY; t0 = Date.now();
    }, { passive:true });
    slidesRoot.addEventListener("touchend", (e) => {
      if (y0 == null) return;
      const dy = e.changedTouches[0].clientY - y0;
      const dt = Date.now() - t0;
      if (Math.abs(dy) > 50 && dt < 600) {
        const idx = slides.findIndex(s => {
          const r = s.getBoundingClientRect();
          return r.top >= -10 && r.top < innerHeight * 0.6;
        });
        cinematicScroll(dy < 0
          ? slides[Math.min(idx + 1, slides.length - 1)]
          : slides[Math.max(idx - 1, 0)]
        );
      }
      y0 = null;
    }, { passive:true });
  }

  /* ============================================================
     Anchor links → cinematic cut (nur interne #)
  ============================================================ */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (!id || id.length <= 1) return;
      const t = document.querySelector(id);
      if (t) { e.preventDefault(); cinematicScroll(t); }
    });
  });

  /* ============================================================
     Kinetic type (Hook)
  ============================================================ */
  (function(){
    const el = $(".swap");
    if (!el || prefersReduced) return;
    let words = [];
    try { words = JSON.parse(el.dataset.words || "[]"); } catch {}
    if (!words.length) return;
    let i = 0;
    setInterval(() => {
      i = (i + 1) % words.length;
      el.classList.remove("enter");
      void el.offsetWidth; // repaint trick
      el.textContent = words[i];
      el.classList.add("enter");
    }, 2800);
  })();

  /* ============================================================
     Parallax & Particles (Idle)
  ============================================================ */
  function initParallax(){
    if (prefersReduced) return;
    const glowA = $(".glow-a");
    const glowB = $(".glow-b");
    const cards = $$(".parallax");
    let raf;

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const t = scrollY || 0;
        if (glowA) glowA.style.transform = `translate3d(0,${t * -0.02}px,0)`;
        if (glowB) glowB.style.transform = `translate3d(0,${t * -0.04}px,0)`;
        cards.forEach(c => {
          const r = c.getBoundingClientRect();
          const p = (r.top / innerHeight - 0.5);
          c.style.transform = `translate3d(0,${p * -14}px,0)`;
        });
      });
    };

    addEventListener("scroll", onScroll, { passive:true });
    onScroll();
  }

  function initParticles(){
    const canvas = $("#particles");
    if (!canvas || prefersReduced) return;
    const ctx = canvas.getContext("2d");
    const DPR = Math.min(devicePixelRatio || 1, 2);
    let W, H, pts = [];

    function resize(){
      const b = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, b.width * DPR);
      canvas.height = Math.max(1, b.height * DPR);
      ctx.setTransform(DPR,0,0,DPR,0,0);
      W = b.width; H = b.height;
      pts = Array.from({length:70}, () => ({
        x: Math.random()*W, y: Math.random()*H,
        r: Math.random()*1.8 + .4, s: .2 + Math.random()
      }));
    }

    function draw(){
      ctx.clearRect(0,0,W,H);
      ctx.fillStyle = "rgba(233,211,148,.28)";
      pts.forEach(p => {
        p.y += p.s * .25;
        if (p.y > H) p.y = -10;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
      });
      requestAnimationFrame(draw);
    }

    resize();
    addEventListener("resize", resize, { passive:true });
    draw();
  }

  idle(() => { initParallax(); initParticles(); }, 300);

  /* ============================================================
     Gate reveal (CLS-frei + cinematic)
  ============================================================ */
  const gateBtn = $('[data-earn-ampel]');
  const gateSlide = $("#b4");

  gateBtn?.addEventListener("click", () => {
    gateBtn.setAttribute("aria-expanded","true");
    cut && cut.classList.add("on");

    setTimeout(() => {
      if (gateSlide) {
        gateSlide.removeAttribute("aria-hidden");   // CSS reserviert Platz
        gateSlide.classList.add("show");            // opacity-Transition
        cinematicScroll(gateSlide);
      }
    }, 260);

    setTimeout(() => cut && cut.classList.remove("on"), 520);
  });

  /* ============================================================
     Ampel-Check (data-driven mit Default)
  ============================================================ */
  GODDATA.onReady((data) => {
    const stepsRoot = $("#check-steps");
    const resultRoot = $("#check-result");
    if (!stepsRoot || !resultRoot) return;
    renderCheck(data.checks?.ampel || defaultCheck());
  });

  function defaultCheck(){
    return {
      questions: [
        { text: "Wenn du 6 Monate ausfällst – wie sicher wäre euer Einkommen?",
          options: { green: "Stabil", yellow: "Knapp", red: "Kritisch" } },
        { text: "Wie schnell findest du wichtige Unterlagen?",
          options: { green: "Sofort", yellow: "Meistens", red: "Schwierig" } },
        { text: "Wie fühlt sich Zukunft & Alter an?",
          options: { green: "Gut", yellow: "Unklar", red: "Belastend" } }
      ],
      scoring: { values: { green:3, yellow:2, red:1 }, thresholds: { yellow:6, red:8 } },
      results: {
        green:  { title:"🟢 Für heute ruhig", text:"Dein System wirkt stabil.", micro:"Behalten, nicht zerdenken." },
        yellow: { title:"🟡 Bald wichtig",    text:"Ein paar Dinge verdienen Aufmerksamkeit.", micro:"Ohne Druck, Schritt für Schritt." },
        red:    { title:"🔴 Heute wichtig",   text:"Mindestens ein Bereich braucht Fokus.", micro:"Kurz ordnen – dann wird es ruhiger." }
      }
    };
  }

  function renderCheck(check){
    let score = 0, step = 0;
    const stepsRoot = $("#check-steps");
    const resultRoot = $("#check-result");
    stepsRoot.innerHTML = ""; resultRoot.innerHTML = "";

    // Steps aufbauen
    check.questions.forEach((q,i) => {
      const el = document.createElement("div");
      el.className = "check-step";
      if (i > 0) el.hidden = true;
      el.innerHTML = `
        <h3>${q.text}</h3>
        <div class="cta">
          <button class="btn btn-primary" data-a="green">${q.options.green}</button>
          <button class="btn" data-a="yellow">${q.options.yellow}</button>
          <button class="btn" data-a="red">${q.options.red}</button>
        </div>`;
      stepsRoot.appendChild(el);
    });

    const stepEls = [...stepsRoot.children];

    stepsRoot.querySelectorAll("[data-a]").forEach(btn => {
      btn.addEventListener("click", () => {
        score += check.scoring.values[btn.dataset.a] || 0;
        step++; pulseProgress();

        if (step >= check.questions.length) {
          stepEls.at(-1).hidden = true;
          showResult(resolve(score));
        } else {
          stepEls[step-1].hidden = true;
          stepEls[step].hidden = false;
          cinematicScroll(stepEls[step]);
        }
      }, { passive:true });
    });

    function resolve(s){
      if (s >= check.scoring.thresholds.red) return "red";
      if (s >= check.scoring.thresholds.yellow) return "yellow";
      return "green";
    }

    function showResult(color){
      const r = check.results[color];
      resultRoot.innerHTML = `
        <div class="result-card result-${color}">
          <h3>${r.title}</h3>
          <p>${r.text}</p>
          <p class="micro">${r.micro || ""}</p>
        </div>`;
      resultRoot.setAttribute("aria-live","polite");
      cinematicScroll(resultRoot);
    }
  }

})();
