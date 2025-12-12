/* ============================================================
   GODMODE 2026 – APP.JS (FINAL)
============================================================ */

document.documentElement.classList.remove("no-js");

GODDATA.onReady(data => {
  /* ---------------- YEAR ---------------- */
  document.querySelectorAll("[data-year]").forEach(
    el => (el.textContent = data.brand.year)
  );

  /* ---------------- HERO HOOK ROTATOR ---------------- */
  const hookEl = document.querySelector(".hook-rotate");
  if (hookEl) {
    const hooks = [
      ...data.micro_hooks.emotional,
      ...data.micro_hooks.rational
    ];
    let i = 0;
    setInterval(() => {
      hookEl.style.opacity = 0;
      setTimeout(() => {
        hookEl.textContent = hooks[i++ % hooks.length];
        hookEl.style.opacity = 1;
      }, 280);
    }, 3800);
  }

  /* ---------------- FADE-UP ---------------- */
  const els = document.querySelectorAll(".fade-up");
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

  /* ---------------- AMPEL CHECK ---------------- */
  const check = data.checks.ampel;
  let score = 0;
  let step = 0;

  const steps = [...document.querySelectorAll(".check-step")];
  const result = document.getElementById("check-result");

  function resolve(score) {
    if (score >= check.scoring.thresholds.red) return "red";
    if (score >= check.scoring.thresholds.yellow) return "yellow";
    return "green";
  }

  document.querySelectorAll("[data-answer]").forEach(btn =>
    btn.addEventListener("click", () => {
      score += check.scoring.values[btn.dataset.answer];
      step++;

      if (step >= check.questions.length) {
        const color = resolve(score);
        result.innerHTML = `
          <div class="result-card result-${color}">
            <h3>${check.results[color]}</h3>
            <p class="hero-micro">Wenn dir das nichts bringt → 25 €.</p>
          </div>`;
        result.scrollIntoView({ behavior: "smooth" });
      } else {
        steps[step - 1].style.display = "none";
        steps[step].style.display = "block";
      }
    })
  );
});
