/* ============================================================
   app.js · Godmode 2026
   Multi-Page Intelligence für alle Seiten:
   – Startseite (2-Minuten-Ampel)
   – Weitergeben
   – Arbeitgeber-Architektur
   – Sticky CTA
   – Whisper CTA
   – Smooth Hooks
   – Check Mounts
============================================================ */


/* ------------------------------------------------------------
   0) PAGE HELPERS
------------------------------------------------------------ */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function exists(sel) {
  return document.querySelector(sel) !== null;
}

document.addEventListener("DOMContentLoaded", () => {
  if (exists("#rotatingHook")) initRotatingHook();
  initStickyCTA();
  initWhisperCTA();
  initScrollHeader();
  mountChecks();
});


/* ------------------------------------------------------------
   1) ROTIERENDER MICRO-HOOK (Startseite)
------------------------------------------------------------ */
function initRotatingHook() {
  const el = $("#rotatingHook");
  if (!el) return;

  const hooks = [
    "Wenn du manchmal hoffst, einfach nichts zu übersehen …",
    "Ein kurzer Blick – bevor der Alltag weiterläuft.",
    "2 Minuten. 3 Fragen. Deine Ampel.",
    "Ein Moment Ruhe für deinen Kopf.",
    "Die einfachste Entscheidung des Tages.",
    "Wenn dein Kopf voll ist – aber du trotzdem sicher sein willst."
  ];

  let i = 0;
  el.textContent = hooks[0];

  setInterval(() => {
    i = (i + 1) % hooks.length;
    el.style.opacity = 0;

    setTimeout(() => {
      el.textContent = hooks[i];
      el.style.opacity = 1;
    }, 350);
  }, 3600);
}


/* ------------------------------------------------------------
   2) STICKY CTA (nur Mobil)
------------------------------------------------------------ */
function initStickyCTA() {
  const cta = $("#stickyCTA");
  if (!cta) return;

  function toggle() {
    if (window.scrollY > 420) {
      cta.classList.add("visible");
    } else {
      cta.classList.remove("visible");
    }
  }

  toggle();
  window.addEventListener("scroll", toggle);
}


/* ------------------------------------------------------------
   3) WHISPER CTA (ultra subtle)
------------------------------------------------------------ */
function initWhisperCTA() {
  const el = $("#whisper");
  if (!el) return;

  const messages = [
    "Ein kurzer Moment Ruhe?",
    "Nur 2 Minuten – anonym.",
    "Ein Blick sagt mehr als ein Stapel Ordner.",
    "Klarheit beginnt mit einem Klick.",
  ];

  let shown = false;

  window.addEventListener("scroll", () => {
    if (window.scrollY > 600 && !shown) {
      shown = true;
      el.textContent = messages[Math.floor(Math.random() * messages.length)];
      el.style.opacity = 1;

      setTimeout(() => {
        el.style.opacity = 0;
      }, 3500);
    }
  });
}


/* ------------------------------------------------------------
   4) HEADER SCROLL STATE
------------------------------------------------------------ */
function initScrollHeader() {
  const header = $(".header");
  if (!header) return;

  function update() {
    header.classList.toggle("scrolled", window.scrollY > 40);
  }

  update();
  window.addEventListener("scroll", update);
}


/* ------------------------------------------------------------
   5) CHECK SYSTEM (Ampel + Arbeitgeber)
------------------------------------------------------------ */

/* ----------- Ampel-Check (Startseite) ----------- */
function mountAmpelCheck() {
  const mount = $("#checkMount");
  if (!mount) return;

  mount.innerHTML = `
    <div class="stack">
      <p><strong>Frage 1:</strong> Wie sicher fühlst du dich heute, falls etwas passieren würde?</p>
      <select id="ampel_q1">
        <option value="">Bitte wählen…</option>
        <option value="green">Ich wäre stabil aufgestellt</option>
        <option value="yellow">Unsicher / kommt drauf an</option>
        <option value="red">Wahrscheinlich gar nicht</option>
      </select>

      <p><strong>Frage 2:</strong> Wie klar ist dir, was im Ernstfall wirklich zählt?</p>
      <select id="ampel_q2">
        <option value="">Bitte wählen…</option>
        <option value="green">Sehr klar</option>
        <option value="yellow">Mittel</option>
        <option value="red">Eher unklar</option>
      </select>

      <p><strong>Frage 3:</strong> Wie geordnet fühlst du deinen aktuellen Stand?</p>
      <select id="ampel_q3">
        <option value="">Bitte wählen…</option>
        <option value="green">Gut strukturiert</option>
        <option value="yellow">Teilweise chaotisch</option>
        <option value="red">Gar nicht strukturiert</option>
      </select>

      <button class="btn btn-primary" id="ampel_submit">Ergebnis anzeigen</button>

      <div id="ampel_result" class="stack" style="margin-top:20px;"></div>
    </div>
  `;

  $("#ampel_submit").addEventListener("click", () => {
    const values = [
      $("#ampel_q1").value,
      $("#ampel_q2").value,
      $("#ampel_q3").value,
    ];

    if (values.includes("")) {
      $("#ampel_result").innerHTML = `<p class="microtrust">Bitte alle Fragen beantworten.</p>`;
      return;
    }

    const score = values.filter((v) => v === "red").length
      ? "red"
      : values.filter((v) => v === "yellow").length
      ? "yellow"
      : "green";

    const resultMap = {
      green: "Dein Alltag wirkt heute stabil. 🟢",
      yellow: "Einige Bereiche wirken unsicher – ein kurzer Blick könnte beruhigen. 🟡",
      red: "Dein Alltag wirkt heute fragil – hier entsteht echter Handlungsdruck. 🔴",
    };

    $("#ampel_result").innerHTML = `
      <p><strong>${resultMap[score]}</strong></p>
      <p class="microtrust">Wenn du willst, klären wir später, was die Ampel sichtbar macht – ohne Druck.</p>
    `;
  });
}


/* ----------- Arbeitgeber-Check (Handwerkerseite) ----------- */
function mountArbeitgeberCheck() {
  const mount = $("#checkMount");
  if (!mount) return;

  mount.innerHTML = `
    <div class="stack">
      <p><strong>Frage 1:</strong> Wie stabil empfindest du deine aktuelle Team-Struktur?</p>
      <select id="ag_q1">
        <option value="">Bitte wählen…</option>
        <option value="green">Stabil</option>
        <option value="yellow">Teilweise stabil</option>
        <option value="red">Instabil / wechselhaft</option>
      </select>

      <p><strong>Frage 2:</strong> Wie klar und dokumentiert sind eure Prozesse?</p>
      <select id="ag_q2">
        <option value="">Bitte wählen…</option>
        <option value="green">Klar & dokumentiert</option>
        <option value="yellow">Teilweise dokumentiert</option>
        <option value="red">Kaum dokumentiert</option>
      </select>

      <p><strong>Frage 3:</strong> Wie sicher fühlst du dich hinsichtlich Arbeitgeber-Pflichten (bAV, Haftung)?</p>
      <select id="ag_q3">
        <option value="">Bitte wählen…</option>
        <option value="green">Sehr sicher</option>
        <option value="yellow">Unsicher</option>
        <option value="red">Gefährlich unsicher</option>
      </select>

      <button class="btn btn-primary" id="ag_submit">Ergebnis anzeigen</button>

      <div id="ag_result" class="stack" style="margin-top:20px;"></div>
    </div>
  `;

  $("#ag_submit").addEventListener("click", () => {
    const values = [
      $("#ag_q1").value,
      $("#ag_q2").value,
      $("#ag_q3").value,
    ];

    if (values.includes("")) {
      $("#ag_result").innerHTML = `<p class="microtrust">Bitte alle Fragen beantworten.</p>`;
      return;
    }

    const score =
      values.filter((v) => v === "red").length
        ? "red"
        : values.filter((v) => v === "yellow").length
        ? "yellow"
        : "green";

    const resultMap = {
      green: "Ihr Betrieb wirkt stabil organisiert. 🟢",
      yellow: "Einige Bereiche bremsen Stabilität & Sicherheit. 🟡",
      red: "Stabile Arbeitgeber-Strukturen fehlen – hier entsteht echter Handlungsdruck. 🔴",
    };

    $("#ag_result").innerHTML = `
      <p><strong>${resultMap[score]}</strong></p>
      <p class="microtrust">Die 3 Fragen stammen aus über 250 Arbeitgeber-Projekten im Handwerk.</p>
    `;
  });
}


/* ------------------------------------------------------------
   6) AUTO-MOUNT CHECKS (intelligent)
------------------------------------------------------------ */
function mountChecks() {
  const mount = $("#checkMount");
  if (!mount) return;

  if (window.location.pathname.includes("arbeitgeber-architektur")) {
    mountArbeitgeberCheck();
  } else {
    mountAmpelCheck();
  }
}
