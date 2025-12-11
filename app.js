/* ============================================================
   GODMODE APP.JS – 2-Minuten-Ampel (wissenschaftlich optimiert)
   Heiko Haerter – Ruhiger Finanz-Kompass
============================================================ */

/* ------------------------------------------------------------
   1) Rotierende TikTok Hooks
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
  hookEl.style.opacity = 0;
  setTimeout(() => {
    hookEl.textContent = hooks[hookIndex];
    hookEl.style.opacity = 1;
    hookIndex = (hookIndex + 1) % hooks.length;
  }, 300);
}

if (hookEl) {
  rotateHook();
  setInterval(rotateHook, 4200);
}

/* ------------------------------------------------------------
   2) Scroll Reveal – fade-up sections sichtbar machen
------------------------------------------------------------ */
const fadeUps = document.querySelectorAll(".fade-up");

function onScrollReveal() {
  const trigger = window.innerHeight * 0.88;
  fadeUps.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.top < trigger) el.classList.add("visible");
  });
}

window.addEventListener("scroll", onScrollReveal);
onScrollReveal();

/* ------------------------------------------------------------
   3) Sticky CTA auf Mobil sichtbar machen
------------------------------------------------------------ */
const stickyCTA = document.getElementById("stickyCTA");

function handleStickyCTA() {
  if (window.scrollY > 400) {
    stickyCTA.classList.add("visible");
  } else {
    stickyCTA.classList.remove("visible");
  }
}

window.addEventListener("scroll", handleStickyCTA);

/* ------------------------------------------------------------
   4) Whisper CTA – flüstert einmalig beim Scrollen
------------------------------------------------------------ */
const whisper = document.getElementById("whisper");
let whisperShown = false;

function showWhisper() {
  if (!whisperShown && window.scrollY > 550) {
    whisper.textContent = "Die Ampel dauert nur 2 Minuten.";
    whisper.classList.add("visible");

    whisperShown = true;

    setTimeout(() => whisper.classList.remove("visible"), 4200);
  }
}
window.addEventListener("scroll", showWhisper);

/* ------------------------------------------------------------
   5) AMPSEL – Wissenschaftliche 3-Fragen-Logik
------------------------------------------------------------ */
const checkMount = document.getElementById("checkMount");

if (checkMount) renderStep1();

/* -----------------------------
   Frage 1 – Loss Aversion
----------------------------- */
function renderStep1() {
  checkMount.innerHTML = `
    <h3>1/3</h3>
    <p><strong>Wenn du heute ausfallen würdest – wie sicher wäre euer Alltag wirklich?</strong></p>

    <button class="btn btn-primary" onclick="next(3)">Sehr sicher</button>
    <button class="btn btn-primary" onclick="next(2)">Eher sicher</button>
    <button class="btn btn-primary" onclick="next(1)">Unsicher</button>
  `;
}

/* -----------------------------
   Frage 2 – Orientierung / Ordnung
----------------------------- */
function renderStep2(score) {
  checkMount.innerHTML = `
    <h3>2/3</h3>
    <p><strong>Wie schnell findest du wichtige Unterlagen, wenn du sie brauchst?</strong></p>

    <button class="btn btn-primary" onclick="next(${score + 3})">Sofort</button>
    <button class="btn btn-primary" onclick="next(${score + 2})">Geht so</button>
    <button class="btn btn-primary" onclick="next(${score + 1})">Dauert lange</button>
  `;
}

/* -----------------------------
   Frage 3 – Zukunftssicherheit
----------------------------- */
function renderStep3(score) {
  checkMount.innerHTML = `
    <h3>3/3</h3>
    <p><strong>Wie sicher fühlst du dich, wenn du an später denkst?</strong></p>

    <button class="btn btn-primary" onclick="showResult(${score + 3})">Sehr sicher</button>
    <button class="btn btn-primary" onclick="showResult(${score + 2})">Teilweise sicher</button>
    <button class="btn btn-primary" onclick="showResult(${score + 1})">Unsicher</button>
  `;
}

/* ------------------------------------------------------------
   Step Navigation
------------------------------------------------------------ */
function next(val) {
  if (typeof next.score === "undefined") next.score = 0;

  next.score += val;

  if (!next.step) next.step = 1;

  next.step++;

  if (next.step === 2) renderStep2(next.score);
  if (next.step === 3) renderStep3(next.score);
}

/* ------------------------------------------------------------
   Ergebnis berechnen + anzeigen (Ampel + Cinematic Reveal)
------------------------------------------------------------ */
function showResult(score) {
  let color = "green";
  let title = "Für heute wirkt alles stabil.";
  let text = "Du kannst entspannt weitermachen – ohne etwas im Hinterkopf zu haben.";

  if (score <= 6) {
    color = "red";
    title = "Heute wichtig.";
    text = "Ein Bereich braucht Aufmerksamkeit – ruhig, klar und ohne Druck.";
  } else if (score <= 9) {
    color = "yellow";
    title = "Bald wichtig.";
    text = "Ein paar Dinge stehen an – aber du musst heute nichts entscheiden.";
  }

  checkMount.innerHTML = `
    <div class="ampel-reveal ${color}">
      <div class="ampel-dot"></div>
      <h3>${title}</h3>
      <p>${text}</p>
    </div>
  `;

  setTimeout(() => {
    document.querySelector(".ampel-reveal").classList.add("visible");
  }, 30);
}
