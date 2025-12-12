/* ============================================================
   GODMODE 2026 — app.js (FINAL · COPY/PASTE)
   Rolle: ruhige Zustandsmaschine
   Keine Sales-Logik · Kein Druck · Skeptiker-first
============================================================ */

(function () {
  "use strict";

  /* ----------------------------------------------------------
     SAFE READY
  ---------------------------------------------------------- */
  const onReady = (fn) =>
    document.readyState === "loading"
      ? document.addEventListener("DOMContentLoaded", fn, { once: true })
      : fn();

  const prefersReducedMotion = () =>
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ----------------------------------------------------------
     GODDATA — robuster Single-Loader
  ---------------------------------------------------------- */
  const GODDATA = (function () {
    const queue = [];
    let cache = null;
    let loading = false;

    const fallback = Object.freeze({
      brand: { year: "2026" },
      micro_hooks: { emotional: [], rational: [] },
      checks: {}
    });

    async function load() {
      if (cache) return cache;
      if (loading) return fallback;
      loading = true;

      try {
        const r = await fetch("/data.json", {
          cache: "no-store",
          credentials: "same-origin"
        });
        cache = r.ok ? await r.json() : fallback;
      } catch {
        cache = fallback;
      } finally {
        loading = false;
      }
      return cache || fallback;
    }

    async function flush() {
      const data = await load();
      while (queue.length) {
        try {
          queue.shift()(data);
        } catch (e) {
          console.warn("[GODMODE] callback failed", e);
        }
      }
    }

    return {
      onReady(fn) {
        queue.push(fn);
        Promise.resolve().then(flush);
      }
    };
  })();

  window.GODDATA = window.GODDATA || GODDATA;

  /* ----------------------------------------------------------
     SOFT HAPTIC (mobile only, calm)
  ---------------------------------------------------------- */
  function softHaptic() {
    if (navigator.vibrate) {
      navigator.vibrate(8); // bewusst extrem subtil
    }
  }

  /* ----------------------------------------------------------
     FADE-UP SYSTEM (bulletproof)
     - nichts darf verschwinden
     - Above-the-fold sofort sichtbar
  ---------------------------------------------------------- */
  function initFadeUp() {
    const els = Array.from(document.querySelectorAll(".fade-up"));
    if (!els.length) return;

    const vh = window.innerHeight || 0;
    const rm = prefersReducedMotion();

    const reveal = (el) => {
      el.classList.add("visible");
      el.style.removeProperty("opacity");
      el.style.removeProperty("transform");
    };

    els.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (rm || (r.top < vh * 0.9 && r.bottom > 0)) {
        reveal(el);
      }
    });

    if (rm || !("IntersectionObserver" in window)) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            reveal(e.target);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );

    els.filter((el) => !el.classList.contains("visible"))
       .forEach((el) => io.observe(el));
  }

  /* ----------------------------------------------------------
     HOOK ROTATOR (ruhig, kein Leerlauf)
  ---------------------------------------------------------- */
  function initHooks(data) {
    const el = document.querySelector(".hook-rotate");
    if (!el) return;

    const hooks = [
      ...(data?.micro_hooks?.emotional || []),
      ...(data?.micro_hooks?.rational || [])
    ].filter(Boolean);

    if (!hooks.length) {
      el.style.opacity = "1";
      return;
    }

    let i = 0;
    el.textContent = hooks[0];
    el.style.opacity = "1";

    if (prefersReducedMotion()) return;

    setInterval(() => {
      el.style.opacity = "0";
      setTimeout(() => {
        el.textContent = hooks[++i % hooks.length];
        el.style.opacity = "1";
      }, 240);
    }, 3600);
  }

  /* ----------------------------------------------------------
     SCROLL PROGRESS (subtil, nicht sichtbar-dominant)
  ---------------------------------------------------------- */
  function initScrollProgress() {
    const root = document.querySelector("[data-scroll-root]");
    if (!root) return;

    const update = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const p = max > 0 ? (h.scrollTop / max) * 100 : 0;
      root.style.setProperty("--scroll-progress", p.toFixed(2) + "%");
    };

    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  /* ----------------------------------------------------------
     BUTTON HAPTICS (global, safe)
  ---------------------------------------------------------- */
  function initButtonHaptics() {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn");
      if (!btn) return;
      softHaptic();
    });
  }

  /* ----------------------------------------------------------
     AMPEL REVEAL — „Ahhh“-Moment
     Wird exakt 1× am Ende des Checks aufgerufen
  ---------------------------------------------------------- */
  window.revealAmpelMoment = function () {
    const el = document.querySelector("[data-ampel-reveal]");
    if (!el) return;

    el.classList.add("visible");
    softHaptic();

    try {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch {}
  };

  /* ----------------------------------------------------------
     BOOTSTRAP
  ---------------------------------------------------------- */
  onReady(() => {
    // 1) Fade-Up zuerst → nichts darf verschwinden
    initFadeUp();

    // 2) JS ready markieren
    document.documentElement.classList.remove("no-js");
    document.documentElement.classList.add("js");

    // 3) Passive Systeme
    initScrollProgress();
    initButtonHaptics();

    // 4) Data-bound Systeme
    GODDATA.onReady((data) => {
      const year = data?.brand?.year || "2026";
      document.querySelectorAll("[data-year]").forEach(
        (el) => (el.textContent = year)
      );
      initHooks(data);
    });
  });
})();
