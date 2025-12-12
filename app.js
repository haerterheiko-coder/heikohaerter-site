// /app.js
(function () {
  "use strict";

  // Entfernt No-JS, damit CSS-Fallback greift, falls JS früh stoppt
  document.documentElement.classList.remove("no-js");

  // --- GODDATA Loader (verhindert ReferenceError + lädt ./data.json) ---
  if (!window.GODDATA) {
    const queue = [];
    window.GODDATA = {
      onReady(cb) { if (typeof cb === "function") queue.push(cb); }
    };
    fetch("./data.json")
      .then(r => r.ok ? r.json() : Promise.reject(new Error("data.json")))
      .then(d => { while (queue.length) { try { queue.shift()(d); } catch { /* ignore */ } } })
      .catch(() => {
        // Minimaldaten, damit UI sichtbar wird
        const d = { brand: { year: String(new Date().getFullYear()) }, checks: {} };
        while (queue.length) { try { queue.shift()(d); } catch {} }
        // Sichtbar machen, falls IntersectionObserver fehlt
        document.querySelectorAll(".fade-up").forEach(el => el.classList.add("visible"));
      });
  }

  const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // --- Slides / Scrollytelling Controller (optional, existiert nur auf Slides-Seiten) ---
  const slidesRoot = document.querySelector("main.slides");
  const slides = slidesRoot ? slidesRoot.querySelectorAll(":scope > .slide") : [];
  const bullets = document.getElementById("bullets");
  const progressBar = document.querySelector("#progress span");

  // Bullets nur bauen, wenn Container existiert
  if (bullets && slides.length) {
    slides.forEach((s, i) => {
      const b = document.createElement("button");
      b.setAttribute("aria-label", "Zu Slide " + (i + 1));
      b.addEventListener("click", () =>
        s.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" })
      );
      bullets.appendChild(b);
    });
  }

  // Fade-Up + Bullets-Active + Progress
  if (slides.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        // Sichtbarkeitsklassen
        entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); });

        // Aktive Section bestimmen (oberste intersecting)
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];

        if (visible) {
          const idx = [...slides].indexOf(visible.target);
          // Bullets synchronisieren
          if (bullets) {
            bullets.querySelectorAll("button").forEach((b, i) =>
              b.setAttribute("aria-current", i === idx ? "true" : "false")
            );
          }
          // Progress-Leiste
          if (progressBar) progressBar.style.width = (((idx + 1) / slides.length) * 100).toFixed(2) + "%";
        }
      },
      { threshold: 0.6 }
    );
    slides.forEach((s) => io.observe(s));
  } else {
    // Fallback: alles zeigen
    document.querySelectorAll(".fade-up").forEach((el) => el.classList.add("visible"));
  }

  // Tastatur-Navigation (↑/↓ bzw. PageUp/PageDown)
  if (slidesRoot && slides.length) {
    slidesRoot.setAttribute("tabindex", "0");
    slidesRoot.addEventListener("keydown", (e) => {
      const idx = [...slides].findIndex((s) => {
        const r = s.getBoundingClientRect();
        return r.top >= 0 && r.top < innerHeight * 0.6;
      });
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        slides[Math.min(idx + 1, slides.length - 1)].scrollIntoView({ behavior: "smooth" });
      }
      if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        slides[Math.max(idx - 1, 0)].scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  // „Offenbarung“ (Beat 4) erst nach bewusstem Klick in Beat 3
  const revealGateBtn = document.querySelector("[data-earn-ampel]");
  const revealSlide = document.querySelector('#b4');
  revealGateBtn?.addEventListener("click", () => {
    if (revealSlide?.hasAttribute("hidden")) {
      revealSlide.removeAttribute("hidden");
      revealSlide.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth" });
    }
  });

  // --- Checks Renderer (privat & arbeitgeber), getrieben von data.json ---
  GODDATA.onReady((data) => {
    // Optionaler Hook-Rotator (falls .hook-rotate + Texte existieren)
    const hookEl = document.querySelector(".hook-rotate");
    const hooks = [...(data.micro_hooks?.emotional || []), ...(data.micro_hooks?.rational || [])].filter(Boolean);
    if (hookEl && hooks.length) {
      if (prefersReduced) hookEl.textContent = hooks[0];
      else {
        let i = 0;
        setInterval(() => {
          hookEl.style.opacity = 0;
          setTimeout(() => {
            hookEl.textContent = hooks[i++ % hooks.length];
            hookEl.style.opacity = 1;
          }, 220);
        }, 3600);
      }
    }

    // Privat (Index): #check-steps + #check-result
    if (document.getElementById("check-steps") && document.getElementById("check-result")) {
      renderCheck({
        stepsId: "check-steps",
        resultId: "check-result",
        check: data.checks?.ampel
      });
    }

    // Arbeitgeber: #employer-check-steps + #employer-check-result
    if (document.getElementById("employer-check-steps") && document.getElementById("employer-check-result")) {
      renderCheck({
        stepsId: "employer-check-steps",
        resultId: "employer-check-result",
        check: data.checks?.arbeitgeber
      });
    }
  });

  // --- Renderer: minimaler Zustandsautomat für 3-Fragen-Checks ---
  function renderCheck({ stepsId, resultId, check }) {
    if (!check) return;
    const stepsRoot = document.getElementById(stepsId);
    const resultRoot = document.getElementById(resultId);
    if (!stepsRoot || !resultRoot) return;

    stepsRoot.innerHTML = "";
    resultRoot.innerHTML = "";

    let score = 0;
    let step = 0;

    // Fragen aufbauen
    check.questions.forEach((q, idx) => {
      const stepEl = document.createElement("div");
      stepEl.className = "check-step stack";
      if (idx > 0) stepEl.hidden = true;
      stepEl.innerHTML = `
        <h3 class="m-0">${q.text}</h3>
        <div class="cta-row">
          <button class="btn btn-primary" data-answer="green">${q.options.green}</button>
          <button class="btn" data-answer="yellow">${q.options.yellow}</button>
          <button class="btn" data-answer="red">${q.options.red}</button>
        </div>`;
      stepsRoot.appendChild(stepEl);
    });

    const stepEls = Array.from(stepsRoot.querySelectorAll(".check-step"));

    stepsRoot.querySelectorAll("[data-answer]").forEach((btn) => {
      btn.addEventListener("click", () => {
        score += check.scoring.values[btn.dataset.answer] || 0;
        step += 1;
        if (step >= check.questions.length) {
          stepEls.at(-1).hidden = true;
          showResult(resolve(score, check.scoring.thresholds), check.results);
        } else {
          stepEls[step - 1].hidden = true;
          stepEls[step].hidden = false;
          stepEls[step].scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
        }
      });
    });

    function resolve(s, t) {
      if (s >= t.red) return "red";
      if (s >= t.yellow) return "yellow";
      return "green";
    }

    function showResult(color, results) {
      const r = results[color];
      resultRoot.innerHTML = `
        <div class="result-card result-${color}">
          <h3>${r.title}</h3>
          <p>${r.text}</p>
          <p class="micro">${r.micro || ""}</p>
          ${postActions(color)}
        </div>`;
      resultRoot.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
    }

    // Warum: Handlungsoptionen emotional passend zum Ergebnis anbieten (senkt Abbruchrate)
    function postActions(color) {
      const wa = "https://wa.me/?text=";
      if (color === "red") {
        return `<div class="cta">
          <a class="btn btn-primary" href="${wa}Kurz%2010%20Minuten%20sprechen">💬 Kurz sprechen</a>
          <a class="btn btn-ghost" href="./weitergeben.html">🔗 Weitergeben</a>
        </div>`;
      }
      if (color === "yellow") {
        return `<div class="cta">
          <a class="btn btn-primary" href="${wa}Als%20N%C3%A4chstes%20angehen">🧭 Als Nächstes angehen</a>
          <a class="btn btn-ghost" href="./weitergeben.html">🔗 Weitergeben</a>
        </div>`;
      }
      return `<div class="cta">
        <a class="btn btn-primary" href="${wa}Smarter%20machen%3F">✨ Smarter machen?</a>
        <a class="btn btn-ghost" href="./weitergeben.html">🔗 Weitergeben</a>
      </div>`;
    }
  }
})();
