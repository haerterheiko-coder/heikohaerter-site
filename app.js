/* ============================================================
   GODMODE 2026 — app.js (FINAL · COPY/PASTE)
   Rolle: ruhige Zustandsmaschine
   Keine Sales-Logik · Kein Druck · Skeptiker-first
============================================================ */

(function () {
  "use strict";

  document.documentElement.classList.remove("no-js");

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ----------------------------------------------------------
     GODDATA: zuverlässiger Loader (kein Page-Sondercode)
     - fetch(/data.json) einmal
     - Queue via onReady
  ---------------------------------------------------------- */
  const GODDATA = (function () {
    const queue = [];
    let cached = null;
    let loading = false;

    async function load() {
      if (cached || loading) return cached;
      loading = true;

      // Optional: Inline-Daten (falls du später mal data.json inline renderst)
      if (window.__GODDATA__ && typeof window.__GODDATA__ === "object") {
        cached = window.__GODDATA__;
        loading = false;
        return cached;
      }

      try {
        const res = await fetch("/data.json", { cache: "no-store" });
        if (!res.ok) throw new Error("data.json not reachable");
        cached = await res.json();
      } catch (e) {
        console.warn("[GODMODE] data.json load failed:", e);
        cached = null;
      } finally {
        loading = false;
      }

      return cached;
    }

    async function flush() {
      const data = await load();
      if (!data) return;
      while (queue.length) {
        try { queue.shift()(data); } catch (e) { console.warn(e); }
      }
    }

    return {
      onReady(fn) {
        queue.push(fn);
        flush();
      }
    };
  })();

  // Expose (falls andere Scripts es brauchen)
  window.GODDATA = window.GODDATA || GODDATA;

  /* ----------------------------------------------------------
     SAFE GLOBAL STATE
  ---------------------------------------------------------- */
  const GODMODE = {
    ampelState: null,
    employerState: null
  };
  window.GODMODE = window.GODMODE || GODMODE;

  /* ----------------------------------------------------------
     HELPERS
  ---------------------------------------------------------- */
  const $ = (id) => document.getElementById(id);

  function safeScrollIntoView(el) {
    if (!el) return;
    if (prefersReducedMotion) return;
    try {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {}
  }

  function setStickyCTA() {
    const sticky = $("stickyCTA");
    if (!sticky) return;

    const on = () => sticky.classList.add("is-on");
    const off = () => sticky.classList.remove("is-on");

    const handler = () => {
      const y = window.scrollY || 0;
      const h = document.documentElement.scrollHeight || 1;
      const v = window.innerHeight || 1;
      const progress = y / Math.max(1, (h - v));
      if (progress > 0.18) on();
      else off();
    };

    window.addEventListener("scroll", handler, { passive: true });
    handler();
  }

  function whisperOnce() {
    const el = $("whisper");
    if (!el) return;

    const KEY = "hh_whisper_seen_v1";
    try {
      if (localStorage.getItem(KEY)) return;
      localStorage.setItem(KEY, "1");
    } catch {}

    setTimeout(() => el.classList.add("is-on"), 900);
    setTimeout(() => el.classList.remove("is-on"), 4600);
  }

  /* ----------------------------------------------------------
     CHECK RENDERER (ampel + arbeitgeber)
     - rendert Steps in Ziel-Container
     - Buttons nutzen data-answer (green/yellow/red)
  ---------------------------------------------------------- */
  function mountCheck({
    check,
    stepsHost,
    resultHost,
    startBtn,
    stateSetter
  }) {
    if (!check || !stepsHost || !resultHost) return;

    let score = 0;
    let step = 0;

    function resolve(scoreVal) {
      if (scoreVal >= check.scoring.thresholds.red) return "red";
      if (scoreVal >= check.scoring.thresholds.yellow) return "yellow";
      return "green";
    }

    function renderStep(i) {
      const q = check.questions[i];
      const wrapper = document.createElement("div");
      wrapper.className = "premium-card check-step";
      wrapper.hidden = i !== 0;

      const h = document.createElement("h3");
      h.textContent = q.text;
      wrapper.appendChild(h);

      const stack = document.createElement("div");
      stack.className = "stack";

      (["green", "yellow", "red"]).forEach((key) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn btn-ghost";
        btn.dataset.answer = key;
        btn.textContent = q.options[key];
        btn.addEventListener("click", () => onAnswer(key, i));
        stack.appendChild(btn);
      });

      wrapper.appendChild(stack);
      return wrapper;
    }

    function showResult(color) {
      stateSetter(color);

      resultHost.innerHTML = `
        <div class="result-card result-${color}">
          <h3>${check.results[color].title}</h3>
          <p class="hero-micro">${check.results[color].text}</p>
          <p class="hero-micro">${check.results[color].micro}</p>
        </div>
      `;
      safeScrollIntoView(resultHost);
    }

    function onAnswer(answerKey, currentIndex) {
      const value = check.scoring.values[answerKey] || 0;
      score += value;
      step = currentIndex + 1;

      const allSteps = stepsHost.querySelectorAll(".check-step");
      allSteps[currentIndex].hidden = true;

      if (step >= check.questions.length) {
        showResult(resolve(score));
      } else {
        allSteps[step].hidden = false;
        safeScrollIntoView(allSteps[step]);
      }
    }

    // Build
    stepsHost.innerHTML = "";
    resultHost.innerHTML = "";

    check.questions.forEach((_, i) => {
      stepsHost.appendChild(renderStep(i));
    });

    // Start button optional (falls du Intro/Startblock hast)
    if (startBtn) {
      startBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const first = stepsHost.querySelector(".check-step");
        if (first) {
          first.hidden = false;
          safeScrollIntoView(first);
        }
      });
    }
  }

  /* ----------------------------------------------------------
     BOOT
  ---------------------------------------------------------- */
  GODDATA.onReady((data) => {
    // Year
    document.querySelectorAll("[data-year]").forEach((el) => {
      el.textContent = data?.brand?.year || "2026";
    });

    // Hook rotator
    const hookEl = document.querySelector(".hook-rotate");
    if (hookEl && data?.micro_hooks) {
      const hooks = [
        ...(data.micro_hooks.emotional || []),
        ...(data.micro_hooks.rational || [])
      ].filter(Boolean);

      if (hooks.length > 0 && !prefersReducedMotion) {
        let i = 0;
        setInterval(() => {
          hookEl.style.opacity = "0";
          setTimeout(() => {
            hookEl.textContent = hooks[i++ % hooks.length];
            hookEl.style.opacity = "1";
          }, 240);
        }, 3600);
      } else if (hooks.length > 0) {
        hookEl.textContent = hooks[0];
      }
    }

    // Fade-up
    const fadeEls = document.querySelectorAll(".fade-up");
    if (!prefersReducedMotion && fadeEls.length > 0) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("visible");
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15 }
      );
      fadeEls.forEach((el) => io.observe(el));
    } else {
      fadeEls.forEach((el) => el.classList.add("visible"));
    }

    // Sticky + whisper
    setStickyCTA();
    whisperOnce();

    // Ampel (Index)
    mountCheck({
      check: data?.checks?.ampel,
      stepsHost: $("check-steps"),
      resultHost: $("check-result"),
      startBtn: $("startCheckBtn"),
      stateSetter: (state) => {
        GODMODE.ampelState = state;
        document.documentElement.dataset.ampel = state;
      }
    });

    // Arbeitgeber (Arbeitgeber-Seite)
    mountCheck({
      check: data?.checks?.arbeitgeber,
      stepsHost: $("employer-check-steps"),
      resultHost: $("employer-check-result"),
      startBtn: document.querySelector('#arbeitgeber-check .btn.btn-primary') || null,
      stateSetter: (state) => {
        GODMODE.employerState = state;
        document.documentElement.dataset.employer = state;
      }
    });
  });
})();
