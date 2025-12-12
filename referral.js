/* ============================================================
   referral.js – GODMODE 2026 (FINAL)
   Premium Weitergabe-System · Heiko Haerter
   ruhig · anonym · skalierbar · DVAG-safe
============================================================ */

(() => {
  "use strict";

  /* ----------------------------------------------------------
     0) VARIANTEN (Content-Engine-ready)
  ---------------------------------------------------------- */
  const VARIANTS = {
    neutral: [
      "Ein kurzer Moment Ruhe für dich – anonym, 2 Minuten, ohne Verkauf: {{URL}}",
      "Falls du manchmal hoffst, nichts Wichtiges zu übersehen – das hilft: {{URL}}",
      "Ein ruhiger Reality-Check ohne Druck. Grün · Gelb · Rot: {{URL}}"
    ],
    eltern: [
      "Wenn die Kids schlafen und der Kopf voll ist: 2 Minuten Ruhe – anonym: {{URL}}",
      "Für einen kurzen Moment Orientierung im Alltag: {{URL}}"
    ],
    paare: [
      "Wenn ihr wissen wollt, ob alles stabil wirkt – neutral & anonym: {{URL}}"
    ],
    selbst: [
      "Kurzer Selbstständigen-Blick: Würde es halten, wenn du ausfällst? {{URL}}"
    ],
    freunde: [
      "Hat mir gerade Ruhe gegeben – dachte an dich: {{URL}}"
    ],
    skeptiker: [
      "Kein Verkauf, keine Daten – nur ein ruhiger 2-Minuten-Check: {{URL}}"
    ],
    handwerk: [
      "60-Sekunden-Arbeitgeber-Check – anonym. Zeigt, wo Stabilität fehlt: {{URL}}",
      "Kurz, klar, ohne Verkauf. Für Inhaber & HR im Handwerk: {{URL}}"
    ],
    direkt: [
      "Ein kurzer Check, der sofort Klarheit bringt: {{URL}}"
    ]
  };

  /* ----------------------------------------------------------
     1) DOM REFERENCES (defensiv)
  ---------------------------------------------------------- */
  const $ = id => document.getElementById(id);

  const ui = {
    select: $("categorySelect"),
    output: $("referralOutput"),
    copy: $("copyReferral"),
    linkInfo: $("personalLinkInfo"),
    qr: $("qrCanvas"),
    feedback: $("shareFeedback")
  };

  /* ----------------------------------------------------------
     2) REFERRAL ID (COOKIE-FREI)
  ---------------------------------------------------------- */
  const RID_KEY = "hh_rid_v1";

  const generateRID = () =>
    crypto.getRandomValues(new Uint32Array(1))[0].toString(36);

  const getRID = () => {
    try {
      return (
        localStorage.getItem(RID_KEY) ||
        (localStorage.setItem(RID_KEY, generateRID()),
        localStorage.getItem(RID_KEY))
      );
    } catch {
      return generateRID();
    }
  };

  /* ----------------------------------------------------------
     3) CONTEXT-AWARE URL
  ---------------------------------------------------------- */
  const isEmployer = /arbeitgeber-architektur/i.test(location.pathname);

  const BASE_URL = isEmployer
    ? "https://heikohaerter.com/arbeitgeber-architektur"
    : "https://heikohaerter.com";

  const buildURL = () => {
    const url = new URL(BASE_URL);
    url.searchParams.set("utm_source", "weitergeben");
    url.searchParams.set("utm_medium", "share");
    url.searchParams.set("utm_campaign", isEmployer ? "arbeitgeber" : "ampel");
    url.searchParams.set("rid", getRID());
    return url.toString();
  };

  const REF_URL = buildURL();

  /* ----------------------------------------------------------
     4) TEXT GENERATOR
  ---------------------------------------------------------- */
  function updateText() {
    if (!ui.output) return;

    const key = ui.select?.value || "neutral";
    const pool = VARIANTS[key] || VARIANTS.neutral;
    const text = pool[Math.floor(Math.random() * pool.length)]
      .replace("{{URL}}", REF_URL);

    ui.output.value = text;

    if (ui.linkInfo) {
      ui.linkInfo.textContent =
        "Dein persönlicher, anonymer Weitergabe-Link: " + REF_URL;
    }
  }

  /* ----------------------------------------------------------
     5) COPY (inkl. Safari Fallback)
  ---------------------------------------------------------- */
  async function copyText() {
    const val = ui.output?.value?.trim();
    if (!val) return;

    try {
      await navigator.clipboard.writeText(val);
      feedback("✔️ Text kopiert");
    } catch {
      try {
        ui.output.select();
        document.execCommand("copy");
        feedback("✔️ Kopiert");
      } catch {
        alert("Bitte Text manuell markieren.");
      }
    }
  }

  /* ----------------------------------------------------------
     6) SHARE CHANNELS
  ---------------------------------------------------------- */
  function shareWhatsApp() {
    const val = ui.output?.value?.trim();
    if (!val) return;
    location.href = "https://wa.me/?text=" + encodeURIComponent(val);
  }

  function copyLinkOnly() {
    navigator.clipboard.writeText(REF_URL).then(() =>
      feedback("🔗 Link kopiert")
    );
  }

  /* ----------------------------------------------------------
     7) FEEDBACK UI
  ---------------------------------------------------------- */
  function feedback(msg) {
    if (!ui.feedback) return;
    ui.feedback.textContent = msg;
    ui.feedback.classList.add("active");
    setTimeout(() => ui.feedback.classList.remove("active"), 2200);
  }

  /* ----------------------------------------------------------
     8) QR CODE (Graceful)
  ---------------------------------------------------------- */
  function renderQR() {
    if (!ui.qr) return;
    const ctx = ui.qr.getContext("2d");

    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0, ui.qr.width, ui.qr.height);
    img.onerror = () => {
      ctx.fillStyle = "#fff";
      ctx.fillText("QR nicht verfügbar", 20, 120);
    };

    img.src =
      "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=" +
      encodeURIComponent(REF_URL);
  }

  /* ----------------------------------------------------------
     9) INIT
  ---------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    ui.select?.addEventListener("change", updateText);
    ui.copy?.addEventListener("click", copyText);

    updateText();
    renderQR();
  });

  /* ----------------------------------------------------------
     10) PUBLIC API (optional)
  ---------------------------------------------------------- */
  window.Referral = {
    updateText,
    copyText,
    shareWhatsApp,
    copyLinkOnly
  };
})();
