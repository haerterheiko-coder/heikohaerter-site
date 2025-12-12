/* ============================================================
   GODMODE 2026 — app.js (FINAL · COPY/PASTE)
   Rolle: ruhige Zustandsmaschine
   Keine Sales-Logik · Kein Druck · Skeptiker-first
   Fix: verhindert “blitzt kurz auf → verschwindet” bei .fade-up
============================================================ */

(function () {
  "use strict";

  /* ----------------------------------------------------------
     SAFE READY
  ---------------------------------------------------------- */
  const onReady = (fn) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  };

  /* ----------------------------------------------------------
     REDUCED MOTION
  ---------------------------------------------------------- */
  const prefersReducedMotion = () =>
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ----------------------------------------------------------
     GODDATA: zuverlässiger Loader (systemweit)
     - fetch(/data.json) einmal
     - Queue via onReady
     - ruft Callbacks auch bei Fehlern (mit Fallback-Objekt) auf,
       damit UI nicht “unsichtbar” bleibt
  ---------------------------------------------------------- */
  const GODDATA = (function () {
    const queue = [];
    let cached = null;
    let loading = false;
    let flushed = false;

    const fallback = Object.freeze({
      brand: { year: "2026" },
      micro_hooks: { emotional: [], rational: [] },
      checks: {}
    });

    async function load() {
      if (cached) return cached;
      if (loading) return null;
      loading = true;

      // Optional: Inline-Daten (falls später serverseitig injected)
      if (window.__GODDATA__ && typeof window.__GODDATA__ === "object") {
        cached = window.__GODDATA__;
        loading = false;
        return cached;
      }

      try {
        const res = await fetch("/data.json", {
          cache: "no-store",
          credentials: "same-origin"
        });
        if (!res.ok) throw new Error("data.json not reachable");
        cached = await res.json();
      } catch (e) {
        console.warn("[GODMODE] data.json load failed:", e);
        cached = fallback; // wichtig: niemals “nichts”, sonst bleibt UI evtl. im Hidden-State
      } finally {
        loading = false;
      }
      return cached || fallback;
    }

    async function flush() {
      if (flushed) return;
      flushed = true;

      const data = (await load()) || fallback;
      while (queue.length) {
        const fn = queue.shift();
        try {
          fn(data);
        } catch (e) {
          console.warn("[GODMODE] onReady callback failed:", e);
        }
      }
    }

    return {
      onReady(fn) {
        queue.push(fn);
        // flush bewusst async, aber zuverlässig (auch bei race conditions)
        Promise.resolve().then(flush);
      }
    };
  })();

  window.GODDATA = window.GODDATA || GODDATA;

  /* ----------------------------------------------------------
     SAFE GLOBAL STATE (minimal)
  ---------------------------------------------------------- */
  const GODMODE = (window.GODMODE = window.GODMODE || {
    ampelState: null,
    employerState: null
  });

  /* ----------------------------------------------------------
     HELPERS
 ---------------------------------------------------------- */
  const $ = (id) => document.getElementById(id);

  const safeScrollIntoView = (el) => {
    if (!el || prefersReducedMotion()) return;
    try {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {}
  };

  /* ----------------------------------------------------------
     CRITICAL FIX: FADE-UP darf nie “alles ausblenden” wenn JS/Data hakt
     Strategie:
     1) Above-the-fold .fade-up sofort sichtbar machen (sync)
     2) Observer nur für restliche Elemente
     3) no-js erst NACH dem ersten Visibility-Pass entfernen
  ---------------------------------------------------------- */
  function initFadeUpSystem() {
    const els = Array.from(document.querySelectorAll(".fade-up"));
    if (!els.length) return;

    const rm = prefersReducedMotion();

    // 1) Sofort sichtbare Elemente (LCP/First View) direkt sichtbar machen
    const vh = window.innerHeight || 0;
    const revealNow = (el) => {
      el.classList.add("visible");
      el.style.removeProperty("opacity");
      el.style.removeProperty("transform");
    };

    // Make sure at least initial viewport content cannot disappear
    for (const el of els) {
      const r = el.getBoundingClientRect();
      const inView = r.top < vh * 0.92 && r.bottom > 0;
      if (rm || inView) revealNow(el);
    }

    // 2) Observer nur für Remaining (wenn Motion erlaubt)
    if (!rm && "IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add("visible");
              io.unobserve(entry.target);
            }
          }
        },
        { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
      );

      for (const el of els) {
        if (!el.classList.contains("visible")) io.observe(el);
      }
    } else {
      // Fallback: alles sichtbar
      els.forEach(revealNow);
    }
  }

  /* ----------------------------------------------------------
     STICKY CTA (passive, low-cost)
  ---------------------------------------------------------- */
  function initStickyCTA() {
    const sticky = $("stickyCTA");
    if (!sticky) return;

    const on = () => sticky.classList.add("is-on");
    const off = () => sticky.classList.remove("is-on");

    let ticking = false;
    const handler = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const y = window.scrollY || 0;
        const h = document.documentElement.scrollHeight || 1;
        const v = window.innerHeight || 1;
        const progress = y / Math.max(1, h - v);
        if (progress > 0.18) on();
        else off();
      });
    };

    window.addEventListener("scroll", handler, { passive: true });
    handler();
  }

  /* ----------------------------------------------------------
     WHISPER (once, storage-safe)
 ---------------------------------------------------------- */
  function whisperOnce() {
    const el = $("whisper");
    if (!el) return;

    const KEY = "hh_whisper_seen_v2";
    try {
      if (localStorage.getItem(KEY)) return;
      localStorage.setItem(KEY, "1");
    } catch {}

    setTimeout(() => el.classList.add("is-on"), 900);
    setTimeout(() => el.classList.remove("is-on"), 4600);
  }

  /* ----------------------------------------------------------
     HOOK ROTATOR (safe, low motion)
 ---------------------------------------------------------- */
  function initHookRotator(data) {
    const hookEl = document.querySelector(".hook-rotate");
    if (!hookEl) return;

    const hooks = [
      ...(data?.micro_hooks?.emotional || []),
      ...(data?.micro_hooks?.rational || [])
    ].filter(Boolean);

    if (!hooks.length) return;

    if (prefersReducedMotion()) {
      hookEl.textContent = hooks[0];
      hookEl.style.removeProperty("opacity");
      return;
    }

    let i = 0;
    const tick = () => {
      hookEl.style.opacity = "0";
      window.setTimeout(() => {
        hookEl.textContent = hooks[i++ % hooks.length];
        hookEl.style.opacity = "1";
      }, 240);
    };

    // Start: ensure visible immediately (no blank)
    hookEl.textContent = hooks[0];
    hookEl.style.opacity = "1";

    window.setInterval(tick, 3600);
  }

  /* ----------------------------------------------------------
     CHECK RENDERER (ampel + arbeitgeber)
     - funktioniert mit:
       A) bereits vorhandenen .check-step in HTML
       B) oder optionalem Host (wenn du später dynamisch mountest)
 ---------------------------------------------------------- */
  function mountCheckStatic({ check, steps, resultHost, stateSetter }) {
    if (!check || !steps?.length || !resultHost) return;

    let score = 0;
    let step = 0;

    const resolve = (scoreVal) => {
      const t = check?.scoring?.thresholds || { yellow: 2, red: 4 };
      if (scoreVal >= (t.red ?? 4)) return "red";
      if (scoreVal >= (t.yellow ?? 2)) return "yellow";
      return "green";
    };

    // results can be STRING (legacy) or OBJECT (new)
    const getResultPayload = (color) => {
      const r = check?.results?.[color];
      if (!r) {
        return { title: "", text: "", micro: "" };
      }
      if (typeof r === "string") {
        return { title: r, text: "", micro: "" };
      }
      return {
        title: r.title || "",
        text: r.text || "",
        micro: r.micro || ""
      };
    };

    const onAnswer = (btn, idx) => {
      const key = btn?.dataset?.answer;
      const values = check?.scoring?.values || { green: 0, yellow: 1, red: 2 };
      score += values[key] ?? 0;

      steps[idx].hidden = true;
      step = idx + 1;

      if (step >= steps.length) {
        const color = resolve(score);
        stateSetter(color);

        const payload = getResultPayload(color);

        resultHost.innerHTML = `
          <div class="result-card result-${color}">
            ${payload.title ? `<h3>${payload.title}</h3>` : ""}
            ${payload.text ? `<p class="hero-micro">${payload.text}</p>` : ""}
            ${payload.micro ? `<p class="hero-micro">${payload.micro}</p>` : ""}
          </div>
        `;
        resultHost.hidden = false;
        safeScrollIntoView(resultHost);
      } else {
        steps[step].hidden = false;
        safeScrollIntoView(steps[step]);
      }
    };

    steps.forEach((stepEl, idx) => {
      // start: only first visible
      stepEl.hidden = idx !== 0;

      stepEl.querySelectorAll("[data-answer]").forEach((btn) => {
        btn.addEventListener("click", () => onAnswer(btn, idx), {
          passive: true
        });
      });
    });

    resultHost.hidden = true;
  }

  /* ----------------------------------------------------------
     BOOT
 ---------------------------------------------------------- */
  onReady(() => {
    // 1) Fade-up first (verhindert “verschwindet”-Bug)
    initFadeUpSystem();

    // 2) Mark JS-ready AFTER we ensured content cannot vanish
    // (wenn CSS .fade-up standardmäßig versteckt, ist das der Fix)
    try {
      document.documentElement.classList.remove("no-js");
      document.documentElement.classList.add("js");
    } catch {}

    // 3) Non-blocking UI helpers
    initStickyCTA();
    whisperOnce();

    // 4) Data-bound systems
    GODDATA.onReady((data) => {
      // Year (supports [data-year] + legacy #yearNow)
      const year = data?.brand?.year || "2026";
      document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = year));
      const yNow = $("yearNow");
      if (yNow) yNow.textContent = year;

      initHookRotator(data);

      // AMP (Index): expects .check-step + #check-result if present
      const ampelSteps = Array.from(document.querySelectorAll(".check-step"));
      const ampelResult = $("check-result");

      if (ampelSteps.length && ampelResult && data?.checks?.ampel) {
        mountCheckStatic({
          check: data.checks.ampel,
          steps: ampelSteps,
          resultHost: ampelResult,
          stateSetter: (state) => {
            GODMODE.ampelState = state;
            document.documentElement.dataset.ampel = state;
          }
        });
      }

      // EMPLOYER: expects #employer-check-steps .check-step + #employer-check-result (if present)
      const empHost = $("employer-check-steps");
      const empResult = $("employer-check-result");
      const empSteps = empHost
        ? Array.from(empHost.querySelectorAll(".check-step"))
        : [];

      if (empSteps.length && empResult && data?.checks?.arbeitgeber) {
        mountCheckStatic({
          check: data.checks.arbeitgeber,
          steps: empSteps,
          resultHost: empResult,
          stateSetter: (state) => {
            GODMODE.employerState = state;
            document.documentElement.dataset.employer = state;
          }
        });
      }
    });
  });

  /* ----------------------------------------------------------
     PUBLIC (minimal, stable)
 ---------------------------------------------------------- */
  window.setAmpel = function (state) {
    if (!state) return;
    GODMODE.ampelState = state;
    document.documentElement.dataset.ampel = state;
  };

  window.getAmpel = function () {
    return GODMODE.ampelState;
  };
})();
