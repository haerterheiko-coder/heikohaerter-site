/* ============================================================
   GODMODE APP.JS – AMPPEL-SCREEN + UX ENGINE
   Heiko Haerter – 2026
============================================================ */

/* ------------------------------------------------------------
   0) Helper: Safe Element Query
------------------------------------------------------------ */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);


/* ------------------------------------------------------------
   1) Fade-up Scroll Animation
------------------------------------------------------------ */
function setupFadeUp() {
  const elements = $$(".fade-up");

  if (!("IntersectionObserver" in window)) {
    elements.forEach((el) => el.classList.add("visible"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  elements.forEach((el) => io.observe(el));
}

setupFadeUp();


/* ------------------------------------------------------------
   2) Hero Preview Toggle
------------------------------------------------------------ */
function setupHeroPreview() {
  const toggleBtn = $("#previewToggle");
  const preview = $("#heroPreview");
  if (!toggleBtn || !preview) return;

  toggleBtn.addEventListener("click", () => {
    const isHidden = preview.hasAttribute("hidden");
    if (isHidden) preview.removeAttribute("hidden");
    else preview.setAttribute("hidden", "");
  });
}

setupHeroPreview();


/* ------------------------------------------------------------
   3) Smooth Scroll für interne Links
------------------------------------------------------------ */
function setupSmoothScroll() {
  $$("a[href^='#']").forEach((link) => {
    link.addEventListener("click", (e) => {
      const target = $(link.getAttribute("href"));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth" });
    });
  });
}

setupSmoothScroll();


/* ------------------------------------------------------------
   4) Ampel-Check System
   - 3 Fragen → Score
   - Score → Farbe + Text + CTA
------------------------------------------------------------ */

const questions = [
  {
    id: 1,
    text: "Wenn du 6 Monate ausfallen würdest – wie sicher wäre euer Einkommen?",
    answers: [
      { text: "Wir hätten ein echtes Problem", value: 1 },
      { text: "Wir würden klarkommen, aber es wäre eng", value: 2 },
      { text: "Wir wären stabil abgesichert", value: 3 }
    ]
  },
  {
    id: 2,
    text: "Wie gut findest du wichtige Unterlagen, wenn du sie brauchst?",
    answers: [
      { text: "Ich suche lange / finde nichts", value: 1 },
      { text: "Finde das Meiste direkt", value: 2 },
      { text: "Finde alles, was ich brauche", value: 3 }
    ]
  },
  {
    id: 3,
    text: "Wie wohl fühlst du dich beim Thema Zukunft & Alter?",
    answers: [
      { text: "Gar nicht / unsicher", value: 1 },
      { text: "Teilweise – nicht sicher", value: 2 },
      { text: "Fühlt sich gut an", value: 3 }
    ]
  }
];

let step = 0;
let score = 0;


/* Build UI dynamically */
function renderCheckUI() {
  const container = $("#ampel-check");
  if (!container) return;

  const wrapper = document.createElement("div");
  wrapper.className = "check-wrapper stack fade-up";

  const title = document.createElement("h3");
  title.textContent = "2-Minuten-Check";
  wrapper.appendChild(title);

  const progress = document.createElement("div");
  progress.className = "check-progress";
  progress.innerHTML = `
    <div class="check-bar" id="checkBar"></div>
  `;
  wrapper.appendChild(progress);

  const questionBox = document.createElement("div");
  questionBox.className = "check-question";
  questionBox.id = "checkQuestion";
  wrapper.appendChild(questionBox);

  const answersBox = document.createElement("div");
  answersBox.className = "check-answers stack";
  answersBox.id = "checkAnswers";
  wrapper.appendChild(answersBox);

  container.appendChild(wrapper);

  renderNextQuestion();
}


/* Render the next question */
function renderNextQuestion() {
  step++;

  const q = questions[step - 1];
  if (!q) {
    return finishCheck();
  }

  $("#checkBar").style.width = `${(step - 1) / questions.length * 100}%`;

  $("#checkQuestion").textContent = q.text;

  const answersBox = $("#checkAnswers");
  answersBox.innerHTML = "";

  q.answers.forEach((ans) => {
    const btn = document.createElement("button");
    btn.className = "btn btn-ghost";
    btn.textContent = ans.text;

    btn.addEventListener("click", () => {
      score += ans.value;
      renderNextQuestion();
    });

    answersBox.appendChild(btn);
  });
}


/* Finish and show result */
function finishCheck() {
  const container = $("#ampel-check");
  container.innerHTML = ""; // reset

  const resultBox = document.createElement("div");
  resultBox.className = "result-box fade-up";

  let color = "green";
  let title = "🟢 Passt für heute";
  let text = "Dein Alltag wirkt stabil.";

  if (score <= 4) {
    color = "red";
    title = "🔴 Heute wichtig";
    text = "Mindestens ein Bereich braucht heute deine Aufmerksamkeit.";
  } else if (score <= 7) {
    color = "yellow";
    title = "🟡 Bald wichtig";
    text = "Ein paar Dinge stehen bald an.";
  }

  resultBox.innerHTML = `
    <div class="result-card preview-${color}">
      <h3>${title}</h3>
      <p>${text}</p>

      <div class="stack result-cta">
        ${renderCTA(color)}
      </div>

      <p class="cta-note">Wenn dir die Ampel nichts bringt → 25 €.</p>
    </div>
  `;

  container.appendChild(resultBox);
}


/* CTA Logic */
function renderCTA(color) {
  const wa = "https://wa.me/4917660408380?text=";

  if (color === "red") {
    return `
      <a class="btn btn-primary" href="${wa}Kurz%2010%20Minuten%20sprechen">💬 Kurz sprechen – 10 Minuten</a>
      <a class="btn btn-ghost" href="${wa}Frage%20senden">🛟 Frage senden</a>
    `;
  }

  if (color === "yellow") {
    return `
      <a class="btn btn-primary" href="${wa}Als%20N%C3%A4chstes%20angehen">🧭 Als Nächstes angehen</a>
      <a class="btn btn-ghost" href="${wa}Kurze%20Frage%20senden">💬 Frage senden</a>
    `;
  }

  return `
    <a class="btn btn-primary" href="${wa}Smarter%20machen%3F">✨ Smarter machen?</a>
    <a class="btn btn-ghost" href="#share">🔗 Weitergeben</a>
  `;
}


/* Init on load */
document.addEventListener("DOMContentLoaded", () => {
  renderCheckUI();
});
