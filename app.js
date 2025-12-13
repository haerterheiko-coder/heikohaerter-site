// app.js
/* ============================================================
   GODMODE — CINEMATIC CUT (2026 · FINAL)
   iOS/Android polish · Idle motion · Stable media
   Eine Datei für: Startseite, Arbeitgeber, Weitergeben
============================================================ */
(function () {
  "use strict";

  // Basic boot
  document.documentElement.classList.remove("no-js");
  const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  try {
    if (navigator.connection?.saveData) {
      document.documentElement.style.setProperty("--motion", "0");
    }
  } catch {}

  // Jahr
  const y = document.getElementById("yNow");
  if (y) y.textContent = String(new Date().getFullYear());

  // Minimal Data-Layer (falls keine data.json existiert)
  if (!window.GODDATA) {
    const Q = [];
    window.GODDATA = { onReady(cb) { if (typeof cb === "function") Q.push(cb); } };
    fetch("./data.json")
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { while (Q.length) { try { Q.shift()(d); } catch {} } })
      .catch(() => {
        const d = { brand: { year: String(new Date().getFullYear()) }, checks: {} };
        while (Q.length) { try { Q.shift()(d); } catch {} }
      });
  }

  /* ----------------------------------------------------------
     Helpers
  ---------------------------------------------------------- */
  const cut = document.querySelector(".cut-overlay");
  function cinematicScroll(target) {
    if (!target) return;
    cut?.classList.add("on");
    setTimeout(() => target.scrollIntoView({
      behavior: prefersReduced ? "auto" : "smooth",
      block: "start"
    }), 110);
    setTimeout(() => cut?.classList.remove("on"), 360);
  }
  const on = (el, ev, fn, opt) => el && el.addEventListener(ev, fn, opt);

  /* ----------------------------------------------------------
     1) Anker → Cinematic Cut (nur wenn Ziel existiert)
  ---------------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (!id || id.length <= 1) return;
      const t = document.querySelector(id);
      if (t) { e.preventDefault(); cinematicScroll(t); }
    }, { passive: false });
  });

  /* ----------------------------------------------------------
     2) Fade-Up Engine (jede Seite)
  ---------------------------------------------------------- */
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.4 });
    document.querySelectorAll(".fade-up").forEach(el => io.observe(el));
  } else {
    document.querySelectorAll(".fade-up").forEach(el => el.classList.add("visible"));
  }

  /* ----------------------------------------------------------
     3) Slides/Bullets/Progress (nur Startseite)
  ---------------------------------------------------------- */
  const slidesRoot = document.querySelector("main.slides");
  const slides = slidesRoot ? [...slidesRoot.querySelectorAll(":scope > .slide")] : [];
  const bullets = document.getElementById("bullets");
  const progressBar = document.querySelector("#progress span");

  if (slides.length) {
    // Bullets
    if (bullets) {
      slides.forEach((s, i) => {
        const b = document.createElement("button");
        b.setAttribute("aria-label", `Zu Abschnitt ${i + 1}`);
        b.addEventListener("click", () => cinematicScroll(s), { passive: true });
        bullets.appendChild(b);
      });
    }

    // Active bullet / progress
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        const active = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];

        // Sichtbar machen
        entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); });

        if (active) {
          const idx = slides.indexOf(active.target);
          bullets?.querySelectorAll("button").forEach((b, i) =>
            b.setAttribute("aria-current", i === idx ? "true" : "false"));
          if (progressBar) {
            progressBar.style.width = (((idx + 1) / slides.length) * 100).toFixed(2) + "%";
          }
        }
      }, { threshold: 0.66 });
      slides.forEach(s => io.observe(s));
    }

    // Tastatur-Navigation
    on(slidesRoot, "keydown", (e) => {
      const idx = slides.findIndex(s => {
        const r = s.getBoundingClientRect();
        return r.top >= -10 && r.top < innerHeight * 0.6;
      });
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        cinematicScroll(slides[Math.min(idx + 1, slides.length - 1)]);
      }
      if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        cinematicScroll(slides[Math.max(idx - 1, 0)]);
      }
    }, { passive: false });
  }

  /* ----------------------------------------------------------
     4) Kinetic Words (nur wenn .swap existiert)
  ---------------------------------------------------------- */
  (function () {
    const el = document.querySelector(".swap");
    if (!el || prefersReduced) return;
    let words = [];
    try { words = JSON.parse(el.getAttribute("data-words") || "[]"); } catch {}
    if (!words.length) return;
    let i = 0;
    setInterval(() => {
      i = (i + 1) % words.length;
      el.classList.remove("enter");
      void el.offsetWidth;
      el.textContent = words[i];
      el.classList.add("enter");
    }, 2800);
  })();

  /* ----------------------------------------------------------
     5) Hero-Video (iOS Autoplay Nudge)
  ---------------------------------------------------------- */
  function tryPlayVideo() {
    const v = document.querySelector(".hero-video");
    v?.play?.().catch(() => {});
  }
  document.addEventListener("touchstart", tryPlayVideo, { once: true, passive: true });
  document.addEventListener("click", tryPlayVideo, { once: true, passive: true });

  /* ----------------------------------------------------------
     6) Parallax + Particles (Idle, nur Startseite/Hero)
  ---------------------------------------------------------- */
  function initParallax() {
    if (prefersReduced) return;
    const glowA = document.querySelector(".glow-a");
    const glowB = document.querySelector(".glow-b");
    const cards = document.querySelectorAll(".parallax");
    if (!glowA && !glowB && !cards.length) return;

    let raf;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const t = scrollY || 0;
        if (glowA) glowA.style.transform = `translate3d(0,${t * -0.02}px,0)`;
        if (glowB) glowB.style.transform = `translate3d(0,${t * -0.04}px,0)`;
        cards.forEach(c => {
          const r = c.getBoundingClientRect();
          const p = (r.top / innerHeight - .5);
          c.style.transform = `translate3d(0,${p * -14}px,0)`;
        });
      });
    };
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  function initParticles() {
    const canvas = document.getElementById("particles");
    if (!canvas || prefersReduced) return;
    const ctx = canvas.getContext("2d");
    const DPR = Math.min(devicePixelRatio || 1, 2);
    let W = 1, H = 1, pts = [];

    function resize() {
      const b = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(b.width * DPR));
      canvas.height = Math.max(1, Math.floor(b.height * DPR));
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      W = b.width; H = b.height;
      pts = Array.from({ length: 70 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.8 + .4,
        s: .2 + Math.random()
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "rgba(233,211,148,.28)";
      pts.forEach(p => {
        p.y += p.s * .25;
        if (p.y > H) p.y = -10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(draw);
    }

    resize();
    addEventListener("resize", resize, { passive: true });
    draw();
  }

  (("requestIdleCallback" in window) ? requestIdleCallback : setTimeout)(() => {
    initParallax();
    initParticles();
  }, 320);

  /* ----------------------------------------------------------
     7) Gate-Reveal (Startseite – CLS-frei + Cut)
  ---------------------------------------------------------- */
  const gateBtn = document.querySelector("[data-earn-ampel]");
  const gateSlide = document.getElementById("b4");
  on(gateBtn, "click", () => {
    gateBtn.setAttribute("aria-expanded", "true");
    cut?.classList.add("on");
    setTimeout(() => {
      if (gateSlide) {
        gateSlide.removeAttribute("aria-hidden");
        gateSlide.classList.add("show");
        cinematicScroll(gateSlide);
      }
    }, 240);
    setTimeout(() => cut?.classList.remove("on"), 520);
  });

  /* ----------------------------------------------------------
     8) Ampel-Check (Startseite)
  ---------------------------------------------------------- */
  GODDATA.onReady(data => {
    const stepsRoot = document.getElementById("check-steps");
    const resultRoot = document.getElementById("check-result");
    if (!stepsRoot || !resultRoot) return;

    const check = data.checks?.ampel || defaultAmpel();
    renderStepCheck(check, stepsRoot, resultRoot, { afterglow: true });
  });

  function defaultAmpel() {
    return {
      questions: [
        { text: "Wenn du 6 Monate ausfällst – wie sicher wäre euer Einkommen?", options: { green: "Stabil", yellow: "Knapp", red: "Kritisch" } },
        { text: "Wie schnell findest du wichtige Unterlagen?", options: { green: "Sofort", yellow: "Meistens", red: "Schwierig" } },
        { text: "Wie fühlt sich Zukunft & Alter an?", options: { green: "Gut", yellow: "Unklar", red: "Belastend" } }
      ],
      scoring: { values: { green: 3, yellow: 2, red: 1 }, thresholds: { yellow: 6, red: 8 } },
      results: {
        green: { title: "🟢 Für heute ruhig", text: "Dein System wirkt stabil.", micro: "Behalten. Nicht zerdenken." },
        yellow: { title: "🟡 Bald wichtig", text: "Ein paar Dinge verdienen Aufmerksamkeit.", micro: "Ohne Druck. Schritt für Schritt." },
        red: { title: "🔴 Heute wichtig", text: "Mindestens ein Bereich braucht Fokus.", micro: "Kurz ordnen – dann wird’s ruhiger." }
      }
    };
  }

  function pulseProgress() {
    const p = document.querySelector("#progress span");
    if (!p || prefersReduced) return;
    p.animate(
      [{ transform: "scaleY(1)" }, { transform: "scaleY(1.7)" }, { transform: "scaleY(1)" }],
      { duration: 280, easing: "ease-out" }
    );
  }

  function resolveColor(score, thresholds) {
    if (score >= thresholds.red) return "red";
    if (score >= thresholds.yellow) return "yellow";
    return "green";
  }

  function showResultCard(color, results, root, opts = {}) {
    const r = results[color];
    const wa = "https://wa.me/?text=";
    const msg = encodeURIComponent(
      `Hi Heiko — ich hab die 2-Minuten-Ampel gemacht (${color.toUpperCase()}). Kannst du mir kurz helfen, den nächsten Schritt ruhig zu sortieren?`
    );
    const share = encodeURIComponent(
      "Kurz & ruhig: In 2 Minuten siehst du, ob heute etwas Wichtiges fehlt. Anonym. Kein Verkauf. https://heikohaerter.com/"
    );

    const afterglow = opts.afterglow;
    root.innerHTML = `
      <div class="result-card result-${color}">
        <h3>${r.title}</h3>
        <p>${r.text}</p>
        ${r.micro ? `<p class="micro">${r.micro}</p>` : ""}
        <div class="cta" style="margin-top:1rem">
          ${afterglow ? `<a class="btn btn-primary" href="${wa}${msg}">💬 10 Minuten Ruhe schaffen</a>` : ""}
          ${afterglow ? `<a class="btn btn-ghost" href="./weitergeben.html">🔗 Ruhig weitergeben</a>` : ""}
          ${afterglow ? `<button class="btn" type="button" id="copyShare">📋 Text kopieren</button>` : ""}
          ${afterglow ? `<span class="micro" id="copyToast" style="opacity:.82"></span>` : ""}
        </div>
      </div>`;

    if (afterglow) {
      const toast = document.getElementById("copyToast");
      on(document.getElementById("copyShare"), "click", async () => {
        try {
          await navigator.clipboard.writeText(decodeURIComponent(share));
          if (toast) toast.textContent = "Kopiert. Du kannst es jetzt überall einfügen.";
        } catch {
          if (toast) toast.textContent = "Automatisches Kopieren nicht möglich. Markieren & kopieren klappt immer.";
        }
      });
    }
    cinematicScroll(root);
  }

  function renderStepCheck(check, stepsRoot, resultRoot, opts = {}) {
    let score = 0, step = 0;
    stepsRoot.innerHTML = ""; resultRoot.innerHTML = "";

    check.questions.forEach((q, i) => {
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
          const color = resolveColor(score, check.scoring.thresholds);
          showResultCard(color, check.results, resultRoot, opts);
        } else {
          stepEls[step - 1].hidden = true;
          stepEls[step].hidden = false;
          cinematicScroll(stepEls[step]);
        }
      }, { passive: true });
    });
  }

  /* ----------------------------------------------------------
     9) Arbeitgeber-Architektur (eigener 60s-Check)
     Wir erkennen Seite an vorhandenen IDs und initialisieren nur dann.
  ---------------------------------------------------------- */
  (function employerCheckInit() {
    const startBtn = document.getElementById("startEmployerBtn");
    const stepsRoot = document.getElementById("employer-check-steps");
    const resultRoot = document.getElementById("employer-check-result");
    if (!startBtn || !stepsRoot || !resultRoot) return; // nicht auf dieser Seite

    const CHECK = {
      questions: [
        { text: "Fallen kurzfristige Ausfälle (Krankheit/Urlaub) aktuell geordnet auf?", options: { green: "Ja, strukturiert", yellow: "Meistens", red: "Eher chaotisch" } },
        { text: "Onboarding & Zuständigkeiten: weiß jede/r, was wann zu tun ist?", options: { green: "Klar geregelt", yellow: "Teils unklar", red: "Fehlt oft" } },
        { text: "bAV/Unfall/Haftung: fühlst du dich rechtlich & organisatorisch sicher?", options: { green: "Sicher", yellow: "Unsicher", red: "Kritisch" } }
      ],
      scoring: { values: { green: 3, yellow: 2, red: 1 }, thresholds: { yellow: 6, red: 8 } },
      results: {
        green: { title: "🟢 Trägt heute", text: "Strukturen wirken stabil. Feinjustierung genügt." },
        yellow: { title: "🟡 Bald wichtig", text: "Einige Punkte verdienen zeitnah Ordnung." },
        red:   { title: "🔴 Heute wichtig", text: "Mindestens ein Bereich braucht Fokus – kurz sortieren schafft Ruhe." }
      }
    };

    on(startBtn, "click", () => {
      // Ersten Schritt rendern
      renderStepCheck(CHECK, stepsRoot, resultRoot, {
        afterglow: true // gleicher Afterglow wie Startseite
      });
      cinematicScroll(stepsRoot);
    });
  })();

  /* ----------------------------------------------------------
     10) Kleinigkeiten
  ---------------------------------------------------------- */
  // kleine Progress-Pulse auch bei „Weiter“-Links (optional, safe)
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener("click", () => {
      const p = document.querySelector("#progress span");
      if (!p || prefersReduced) return;
      p.animate(
        [{ transform: "scaleY(1)" }, { transform: "scaleY(1.4)" }, { transform: "scaleY(1)" }],
        { duration: 240, easing: "ease-out" }
      );
    }, { passive: true });
  });

})();
