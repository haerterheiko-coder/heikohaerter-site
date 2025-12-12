/* ============================================================
   GODMODE 2026 — app.js (FINAL · COPY/PASTE)
   Rolle: ruhige Zustandsmaschine
   Keine Sales-Logik · Kein Druck · Skeptiker-first
============================================================ */

(function () {
  "use strict";

  /* ---------------- BASICS ---------------- */
  document.documentElement.classList.remove("no-js");

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ---------------- SAFE GLOBAL STATE ---------------- */
  const GODMODE = {
    ampelState: null,
    score: 0,
    step: 0
  };

  /* ---------------- DATA READY ---------------- */
  GODDATA.onReady(data => {

    /* ---------------- YEAR ---------------- */
    document.querySelectorAll("[data-year]").forEach(el => {
      el.textContent = data.brand.year;
    });

    /* ---------------- HERO HOOK ROTATOR ---------------- */
    const hookEl = document.querySelector(".hook-rotate");
    if (hookEl && data.micro_hooks) {
      const hooks = [
        ...(data.micro_hooks.emotional || []),
        ...(data.micro_hooks.rational || [])
      ].filter(Boolean);

      if (hooks.length > 0 && !prefersReducedMotion) {
        let i = 0;
        setInterval(() => {
          hookEl.style.opacity = 0;
          setTimeout(() => {
            hookEl.textContent = hooks[i++ % hooks.length];
            hookEl.style.opacity = 1;
          }, 240);
        }, 3600);
      } else if (hooks.length > 0) {
        hookEl.textContent = hooks[0];
      }
    }

    /* ---------------- FADE-UP SYSTEM ---------------- */
    const fadeEls = document.querySelectorAll(".fade-up");

    if (!prefersReducedMotion && fadeEls.length > 0) {
      const io = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add("visible");
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15 }
      );

      fadeEls.forEach(el => io.observe(el));
    } else {
      fadeEls.forEach(el => el.classList.add("visible"));
    }

    /* ---------------- AMPEL CHECK ---------------- */
    const check = data.checks?.ampel;
    if (!check) return;

    const steps = Array.from(document.querySelectorAll(".check-step"));
    const resultEl = document.getElementById("check-result");

    function resolveAmpel(score) {
      if (score >= check.scoring.thresholds.red) return "red";
      if (score >= check.scoring.thresholds.yellow) return "yellow";
      return "green";
    }

    function showResult(color) {
      GODMODE.ampelState = color;

      if (!resultEl) return;

      resultEl.dataset.state = color;
      resultEl.innerHTML = `
        <div class="result-card result-${color}">
          <h3>${check.results[color].title}</h3>
          <p>${check.results[color].text}</p>
          <p class="hero-micro">${check.results[color].micro}</p>
        </div>
      `;

      if (!prefersReducedMotion) {
        resultEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }

    /* ---------------- ANSWER HANDLING ---------------- */
    document.querySelectorAll("[data-answer]").forEach(btn => {
      btn.addEventListener("click", () => {
        const value = check.scoring.values[btn.dataset.answer] || 0;
        GODMODE.score += value;
        GODMODE.step += 1;

        if (GODMODE.step >= check.questions.length) {
          const state = resolveAmpel(GODMODE.score);
          showResult(state);
        } else {
          steps[GODMODE.step - 1].hidden = true;
          steps[GODMODE.step].hidden = false;
        }
      });
    });

    /* ---------------- PUBLIC AMP API ---------------- */
    window.setAmpel = function (state) {
      if (!state) return;
      GODMODE.ampelState = state;
      document.documentElement.dataset.ampel = state;
    };

    window.getAmpel = function () {
      return GODMODE.ampelState;
    };
  });
})();
