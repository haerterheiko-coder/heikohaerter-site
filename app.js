/* ============================================================
   GODMODE APP.JS – 2-Minuten-Ampel (wissenschaftlich optimiert)
   Heiko Haerter – Ruhiger Finanz-Kompass
============================================================ */

/* ------------------------------------------------------------
   1) Rotierende Hooks (TikTok-Style, mit „Breathing“-Fade)
------------------------------------------------------------ */
const hooks = [
  "Wenn du manchmal denkst: Hoffentlich übersehe ich nichts Wichtiges …",
  "Ein kurzer Blick – bevor der Alltag dich wieder einholt.",
  "2 Minuten Ruhe – bevor alles wieder weiterläuft.",
  "Die meisten übersehen Wichtiges, ohne es zu merken.",
  "Ein Moment für dich – bevor du wieder funktionierst."
];

let hookIndex = 0;
const hookEl = document.getElementById("rotatingHook");

function rotateHook() {
  if (!hookEl) return;

  // Sanfter Fade-out
  if (hookEl.animate) {
    hookEl.animate(
      [{ opacity: 1 }, { opacity: 0 }],
      { duration: 260, easing: "cubic-bezier(0.22,1,0.36,1)" }
    );
  }
  setTimeout(() => {
    hookEl.textContent = hooks[hookIndex];
    hookIndex = (hookIndex + 1) % hooks.length;

    // Sanfter Fade-in
    if (hookEl.animate) {
      hookEl.animate(
        [{ opacity: 0 }, { opacity: 1 }],
        { duration: 260, easing: "cubic-bezier(0.22,1,0.36,1)" }
      );
    } else {
      hookEl.style.opacity = 1;
    }
  }, 260);
}

if (hookEl) {
  rotateHook();
  setInterval(rotateHook, 4200);
}

/* ------------------------------------------------------------
   2) Scroll Reveal – fade-up Sections
------------------------------------------------------------ */
const fadeUps = document.querySelectorAll(".fade-up");

function onScrollReveal() {
  const trigger = window.innerHeight * 0.88;
  fadeUps.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.top < trigger && !el.classList.contains("visible")) {
      el.classList.add("visible");
    }
  });
}

window.addEventListener("scroll", onScrollReveal);
onScrollReveal();

/* ------------------------------------------------------------
   3) Sticky CTA (Mobile / Scroll > 400px)
------------------------------------------------------------ */
const stickyCTA = document.getElementById("stickyCTA");

function handleStickyCTA() {
  if (!stickyCTA) return;
  if (window.scrollY > 400) {
    stickyCTA.classList.add("visible");
  } else {
    stickyCTA.classList.remove("visible");
  }
}

window.addEventListener("scroll", handleStickyCTA);

/* ------------------------------------------------------------
   4) Whisper CTA – flüstert einmalig
------------------------------------------------------------ */
const whisper = document.getElementById("whisper");
let whisperShown = false;

function showWhisper() {
  if (!whisper || whisperShown) return;
  if (window.scrollY <= 550) return;

  whisper.textContent = "Die Ampel dauert nur 2 Minuten.";
  whisper.classList.add("visible");
  whisperShown = true;

  // Sanfte Einblendung
  if (whisper.animate) {
    whisper.animate(
      [
        { opacity: 0, transform: "translateY(12px)" },
        { opacity: 0.85, offset: 0.7 },
        { opacity: 1, transform: "translateY(0)" }
      ],
      { duration: 650, easing: "cubic-bezier(0.22,1,0.36,1)" }
    );
  }

  setTimeout(() => {
    whisper.classList.remove("visible");
  }, 4200);
}
window.addEventListener("scroll", showWhisper);

/* ------------------------------------------------------------
   5) AMPSEL – 2-Minuten-Check (3 Fragen, Score, Ergebnis)
------------------------------------------------------------ */
const checkMount = document.getElementById("checkMount");

const ampelState = {
  step: 0,
  score: 0
};

if (checkMount) {
  renderStep1();
}

/* -----------------------------
   Helper: State Reset
----------------------------- */
function resetAmpelState() {
  ampelState.step = 0;
  ampelState.score = 0;
}

/* -----------------------------
   Frage 1 – Loss Aversion
----------------------------- */
function renderStep1() {
  if (!checkMount) return;
  resetAmpelState();
  ampelState.step = 1;

  checkMount.innerHTML = `
    <h3>1/3</h3>
    <p><strong>Wenn du heute ausfallen würdest – wie sicher wäre euer Alltag wirklich?</strong></p>

    <div class="ampel-options">
      <button class="btn btn-primary" type="button" onclick="nextStep(3)">Sehr sicher</button>
      <button class="btn btn-primary" type="button" onclick="nextStep(2)">Eher sicher</button>
      <button class="btn btn-primary" type="button" onclick="nextStep(1)">Unsicher</button>
    </div>
  `;
}

/* -----------------------------
   Frage 2 – Orientierung / Ordnung
----------------------------- */
function renderStep2() {
  if (!checkMount) return;
  checkMount.innerHTML = `
    <h3>2/3</h3>
    <p><strong>Wie schnell findest du wichtige Unterlagen, wenn du sie brauchst?</strong></p>

    <div class="ampel-options">
      <button class="btn btn-primary" type="button" onclick="nextStep(3)">Sofort</button>
      <button class="btn btn-primary" type="button" onclick="nextStep(2)">Geht so</button>
      <button class="btn btn-primary" type="button" onclick="nextStep(1)">Dauert lange</button>
    </div>
  `;
}

/* -----------------------------
   Frage 3 – Zukunftssicherheit
----------------------------- */
function renderStep3() {
  if (!checkMount) return;
  checkMount.innerHTML = `
    <h3>3/3</h3>
    <p><strong>Wie sicher fühlst du dich, wenn du an später denkst?</strong></p>

    <div class="ampel-options">
      <button class="btn btn-primary" type="button" onclick="finishStep(3)">Sehr sicher</button>
      <button class="btn btn-primary" type="button" onclick="finishStep(2)">Teilweise sicher</button>
      <button class="btn btn-primary" type="button" onclick="finishStep(1)">Unsicher</button>
    </div>
  `;
}

/* ------------------------------------------------------------
   Step Navigation
------------------------------------------------------------ */
function nextStep(val) {
  ampelState.score += val;

  if (ampelState.step === 1) {
    ampelState.step = 2;
    renderStep2();
  } else if (ampelState.step === 2) {
    ampelState.step = 3;
    renderStep3();
  }
}

function finishStep(val) {
  ampelState.score += val;
  showResult(ampelState.score);
}

/* ------------------------------------------------------------
   Ergebnis berechnen + anzeigen (Ampel + CTA + Restart)
------------------------------------------------------------ */
function showResult(score) {
  if (!checkMount) return;

  let color = "green";
  let title = "Für heute wirkt alles stabil.";
  let text =
    "Du kannst entspannt weitermachen – ohne etwas im Hinterkopf zu haben.";
  let ctaHtml = `
    <a href="/weitergeben" class="btn btn-primary ampel-cta">
      Weitergeben – vielleicht hilft’s jemandem.
    </a>
    <p class="ampel-microcopy">
      Viele nutzen die Ampel, um jemandem im Alltag kurz Ruhe zu geben.
    </p>
  `;

  if (score <= 6) {
    color = "red";
    title = "Heute wichtig.";
    text =
      "Ein Bereich braucht Aufmerksamkeit – ruhig, klar und ohne Druck.";
    ctaHtml = `
      <a href="mailto:heiko.haerter@dvag.de?subject=2-Minuten-Ampel%20–%20Rot"
         class="btn btn-primary ampel-cta">
        Kurz 10 Minuten sprechen
      </a>
      <p class="ampel-microcopy">
        Ruhig, ohne Druck. Nur ein sanfter Blick auf das, was heute wichtig ist.
      </p>
    `;
  } else if (score <= 9) {
    color = "yellow";
    title = "Bald wichtig.";
    text =
      "Ein paar Dinge stehen an – aber du musst heute nichts entscheiden.";
    ctaHtml = `
      <a href="mailto:heiko.haerter@dvag.de?subject=2-Minuten-Ampel%20–%20Gelb"
         class="btn btn-primary ampel-cta">
        Als Nächstes sortieren
      </a>
      <p class="ampel-microcopy">
        Ein paar Dinge stehen an – ohne Stress. Ich helfe dir gern beim Sortieren.
      </p>
    `;
  }

  checkMount.innerHTML = `
    <div class="ampel-reveal ${color}">
      <div class="ampel-dot"></div>
      <h3>${title}</h3>
      <p>${text}</p>
      ${ctaHtml}
      <button class="btn btn-primary ampel-restart" type="button" onclick="resetAmpel()">
        Nochmal testen
      </button>
    </div>
  `;

  // Cinematic Reveal (mit kleinem Delay)
  const revealEl = document.querySelector(".ampel-reveal");
  if (revealEl) {
    setTimeout(() => {
      revealEl.classList.add("visible");

      // Optionaler „Breath“-Pulse
      if (revealEl.animate) {
        revealEl.animate(
          [
            { transform: "scale(.96)", opacity: 0 },
            { transform: "scale(1.02)", opacity: 1 },
            { transform: "scale(1)", opacity: 1 }
          ],
          { duration: 620, easing: "cubic-bezier(0.22,1,0.36,1)" }
        );
      }
    }, 60);
  }
}

/* ------------------------------------------------------------
   Restart-Funktion für die Ampel
------------------------------------------------------------ */
function resetAmpel() {
  resetAmpelState();
  renderStep1();
}
