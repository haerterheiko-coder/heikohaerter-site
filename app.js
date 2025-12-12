/* ============================================================
   GODMODE 2026 — app.js (FINAL · COPY/PASTE)
   Rolle: ruhige Zustandsmaschine
   Keine Sales-Logik · Kein Druck · Skeptiker-first
============================================================ */

(function () {
  "use strict";

  /* ----------------------------------------------------------
     BASE BOOT
  ---------------------------------------------------------- */
  document.documentElement.classList.remove("no-js");

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ----------------------------------------------------------
     GODDATA — robuster Loader (hart gegen Race Conditions)
     - kein Hard-Fail
     - Queue-basiert
     - data.json genau einmal
  ---------------------------------------------------------- */
  const GODDATA = (function () {
    const queue = [];
    let cached = null;
    let loading = false;
    let failed = false;

    async function load() {
      if (cached || loading || failed) return cached;
      loading = true;

      if (window.__GODDATA__ && typeof window.__GODDATA__ === "object") {
        cached = window.__GODDATA__;
        loading = false;
        return cached;
      }

      try {
        const res = await fetch("/data.json", { cache: "no-store" });
        if (!res.ok) throw new Error("data.json unreachable");
        cached = await res.json();
      } catch (e) {
        console.warn("[GODMODE] data.json load failed:", e);
        failed = true;
        cached = null;
      } finally {
        loading = false;
      }

      return cached;
    }

    async function flush() {
      const data = await load();
      if (!data) {
        // Fallback: niemals Seite leer lassen
        document
          .querySelectorAll(".fade-up")
          .forEach((el) => el.classList.add("visible"));
        return;
      }

      while (queue.length) {
        try {
          queue.shift()(data);
        } catch (e) {
          console.warn("[GODMODE] onReady error:", e);
        }
      }
    }

    return {
      onReady(fn) {
        if (typeof fn !== "function") return;
        queue.push(fn);
        flush();
      }
    };
  })();

  window.GODDATA = window.GODDATA || GODDATA;

  /* ----------------------------------------------------------
     GLOBAL STATE (READ-ONLY NACH AUSSEN)
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
    if (!el || prefersReducedMotion) return;
    try {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {}
  }

  function setStickyCTA() {
    const sticky = $("stickyCTA");
    if (!sticky) return;

    const handler = () => {
      const y = window.scrollY || 0;
      const h = document.documentElement.scrollHeight || 1;
      const v = window.innerHeight || 1;
      const progress = y / Math.max(1, h - v);
      sticky.classList.toggle("is-on", progress > 0.18);
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
     CHECK ENGINE (ampel + arbeitgeber)
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

    function resolve(val) {
      if (val >= check.scoring.thresholds.red) return "red";
      if (val >= check.scoring.thresholds.yellow) return "yellow";
      return "green";
    }

    function renderStep(q, index) {
      const wrap = document.createElement("div");
      wrap.className = "premium-card check-step";
      wrap.hidden = index !== 0;

      const h = document.createElement("h3");
      h.textContent = q.text;
      wrap.appendChild(h);

      const stack = document.createElement("div");
      stack.className = "stack";

      ["green", "yellow", "red"].forEach((key) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn btn-ghost";
        btn.dataset.answer = key;
        btn.textContent = q.options[key];
        btn.addEventListener("click", () => onAnswer(key, index));
        stack.appendChild(btn);
      });

      wrap.appendChild(stack);
      return wrap;
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

    function onAnswer(key, idx) {
      score += check.scoring.values[key] || 0;
      const steps = stepsHost.querySelectorAll(".check-step");
      steps[idx].hidden = true;

      if (idx + 1 >= steps.length) {
        showResult(resolve(score));
      } else {
        steps[idx + 1].hidden = false;
        safeScrollIntoView(steps[idx + 1]);
      }
    }

    stepsHost.innerHTML = "";
    resultHost.innerHTML = "";

    check.questions.forEach((q, i) =>
      stepsHost.appendChild(renderStep(q, i))
    );

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
     BOOTSTRAP
  ---------------------------------------------------------- */
  GODDATA.onReady((data) => {
    /* YEAR */
    document.querySelectorAll("[data-year]").forEach((el) => {
      el.textContent = data?.brand?.year || "2026";
    });

    /* HERO HOOK */
    const hookEl = document.querySelector(".hook-rotate");
    if (hookEl && data?.micro_hooks) {
      const hooks = [
        ...(data.micro_hooks.emotional || []),
        ...(data.micro_hooks.rational || [])
      ].filter(Boolean);

      if (hooks.length && !prefersReducedMotion) {
        let i = 0;
        setInterval(() => {
          hookEl.style.opacity = "0";
          setTimeout(() => {
            hookEl.textContent = hooks[i++ % hooks.length];
            hookEl.style.opacity = "1";
          }, 240);
        }, 3600);
      } else if (hooks.length) {
        hookEl.textContent = hooks[0];
      }
    }

    /* FADE-UP */
    const fadeEls = document.querySelectorAll(".fade-up");
    if (!prefersReducedMotion && fadeEls.length) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add("visible");
              io.unobserve(e.target);
            }
          });
        },
        { threshold: 0.15 }
      );
      fadeEls.forEach((el) => io.observe(el));
    } else {
      fadeEls.forEach((el) => el.classList.add("visible"));
    }

    /* UI EXTRAS */
    setStickyCTA();
    whisperOnce();

    /* CHECKS */
    mountCheck({
      check: data?.checks?.ampel,
      stepsHost: $("check-steps"),
      resultHost: $("check-result"),
      startBtn: $("startCheckBtn"),
      stateSetter: (s) => {
        GODMODE.ampelState = s;
        document.documentElement.dataset.ampel = s;
      }
    });

    mountCheck({
      check: data?.checks?.arbeitgeber,
      stepsHost: $("employer-check-steps"),
      resultHost: $("employer-check-result"),
      startBtn:
        document.querySelector("#arbeitgeber-check .btn.btn-primary") || null,
      stateSetter: (s) => {
        GODMODE.employerState = s;
        document.documentElement.dataset.employer = s;
      }
    });
  });
})();
