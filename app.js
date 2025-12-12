// ============================================================
// GODMODE 2026 – APP.JS (FINAL / ENGINE VERSION)
// ============================================================

document.documentElement.classList.remove("no-js");
document.querySelectorAll("#yearNow").forEach(
  el => (el.textContent = new Date().getFullYear())
);

// ------------------------------------------------------------
// 1) LOAD DATA.JSON (SINGLE SOURCE OF TRUTH)
// ------------------------------------------------------------
let DATA = null;

async function loadData() {
  if (DATA) return DATA;
  const res = await fetch("/data.json", { cache: "no-store" });
  DATA = await res.json();
  return DATA;
}

// ------------------------------------------------------------
// 2) HERO MICRO HOOK ROTATOR (FROM DATA)
// ------------------------------------------------------------
(async () => {
  const el = document.querySelector(".hook-rotate");
  if (!el) return;

  const d = await loadData();
  const hooks = [
    ...d.micro_hooks.emotional,
    ...d.micro_hooks.rational
  ];

  let i = 0;
  el.style.transition = "opacity .45s ease";

  setInterval(() => {
    el.style.opacity = 0;
    setTimeout(() => {
      i = (i + 1) % hooks.length;
      el.textContent = hooks[i];
      el.style.opacity = 1;
    }, 360);
  }, 3800);
})();

// ------------------------------------------------------------
// 3) FADE-UP OBSERVER
// ------------------------------------------------------------
(() => {
  const els = [...document.querySelectorAll(".fade-up")];
  if (matchMedia("(prefers-reduced-motion: reduce)").matches)
    return els.forEach(el => el.classList.add("visible"));

  const io = new IntersectionObserver(
    entries =>
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          io.unobserve(e.target);
        }
      }),
    { threshold: 0.15 }
  );

  els.forEach(el => io.observe(el));
})();

// ------------------------------------------------------------
// 4) CHECK ENGINE (PERSONAL + ARBEITGEBER)
// ------------------------------------------------------------
async function initCheck(mode = "ampel") {
  const d = await loadData();
  const cfg = d.checks[mode];
  if (!cfg) return;

  let step = 0;
  let score = 0;

  const start = document.getElementById("check-start");
  const steps = document.getElementById("check-steps");
  const result = document.getElementById("check-result");

  const bar = document.getElementById("progressBar");
  const label = document.getElementById("stepLabel");

  const questions = cfg.questions;
  const max = questions.length;

  function showStep(n) {
    const q = questions[n];
    steps.innerHTML = `
      <div class="step">
        <h3>${q.text}</h3>
        <div class="answers">
          ${Object.entries(q.options)
            .map(
              ([k, v]) =>
                `<button class="answer" data-value="${cfg.scoring.values[k]}">${v}</button>`
            )
            .join("")}
        </div>
      </div>`;
    label.textContent = `Schritt ${n + 1} von ${max}`;
    bar.style.width = `${(n / (max - 1)) * 100}%`;

    steps.querySelectorAll(".answer").forEach(btn =>
      btn.addEventListener("click", () => {
        score += Number(btn.dataset.value);
        step++;
        step < max ? showStep(step) : finish();
      })
    );
  }

  function finish() {
    steps.style.display = "none";
    result.style.display = "block";

    const t = cfg.scoring.thresholds;
    let color =
      score >= t.red ? "red" :
      score >= t.yellow ? "yellow" : "green";

    result.innerHTML = `
      <div class="result-card result-${color}">
        <h3>${cfg.results[color]}</h3>
        ${cta(color, mode)}
      </div>
      <p class="hero-micro" style="opacity:.85">
        Wenn dir das nichts bringt → <strong>25 €</strong>.
      </p>
    `;

    result.scrollIntoView({ behavior: "smooth" });
  }

  function cta(color, mode) {
    const wa = "https://wa.me/4917660408380?text=";
    if (mode === "arbeitgeber") {
      return `
        <a class="btn btn-primary" href="${wa}Arbeitgeber-Architektur%20besprechen">
          Arbeitgeber-Struktur klären
        </a>`;
    }

    return {
      red: `<a class="btn btn-primary" href="${wa}Kurz%20sprechen">Kurz sprechen</a>`,
      yellow: `<a class="btn btn-primary" href="${wa}Nächster%20Schritt">Nächster Schritt</a>`,
      green: `<a class="btn btn-ghost" href="#share">Weitergeben</a>`
    }[color];
  }

  document.querySelectorAll("[data-start-check]").forEach(btn =>
    btn.addEventListener("click", e => {
      e.preventDefault();
      score = 0;
      step = 0;
      start.style.display = "none";
      steps.style.display = "block";
      result.style.display = "none";
      showStep(0);
    })
  );
}

// ------------------------------------------------------------
// 5) AUTO INIT (PAGE-AWARE)
// ------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.check === "arbeitgeber") {
    initCheck("arbeitgeber");
  } else {
    initCheck("ampel");
  }
});
