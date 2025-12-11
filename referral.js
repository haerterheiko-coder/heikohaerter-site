/* ============================================================
   referral.js – Godmode 2026
   Universelles Weitergabe-System für alle Seiten
   Heiko Haerter – Ruhiger Finanz-Kompass
============================================================ */

/* ------------------------------------------------------------
   1) Variants: Weitergabe-Texte (NEU: Handwerks- & Direkt-Tonalität)
------------------------------------------------------------ */
const referralVariants = {
  neutral: [
    `Ein kurzer Moment Ruhe für dich – anonym, 2 Minuten, ohne Verkauf: {{URL}}`,
    `Falls du manchmal hoffst, nichts Wichtiges zu übersehen – das hilft: {{URL}}`,
    `Ein kurzer Reality-Check ohne Druck. Grün · Gelb · Rot. Vielleicht gibt’s dir Ruhe: {{URL}}`
  ],

  eltern: [
    `Wenn die Kids schlafen und der Kopf voll ist: 2 Minuten Ruhe – anonym & ohne Daten: {{URL}}`,
    `Für einen kurzen Moment Orientierung im Alltag: {{URL}}`,
    `Hat mir selbst Ruhe gegeben – vielleicht hilft’s dir auch: {{URL}}`
  ],

  paare: [
    `Wenn ihr wissen wollt, ob alles stabil wirkt – neutral, anonym, 2 Minuten: {{URL}}`,
    `Ein kurzer Check, der sich erstaunlich leicht anfühlt: {{URL}}`
  ],

  selbst: [
    `Kurze Selbstständigen-Frage: Würde es heute halten, wenn du ausfällst? 2 Minuten, anonym: {{URL}}`,
    `Für einen klaren Blick, bevor der Alltag weiterläuft: {{URL}}`
  ],

  freunde: [
    `Hat mir gerade echt Ruhe gegeben – dachte direkt an dich: {{URL}}`,
    `Null Stress, einfach nur Orientierung. Vielleicht hilft‘s dir: {{URL}}`
  ],

  skeptiker: [
    `Nur damit klar ist: kein Verkauf, keine Daten – einfach ein ruhiger 2-Minuten-Check: {{URL}}`,
    `Ich weiß, du magst sowas normal nicht – aber das hier ist komplett neutral: {{URL}}`
  ],

  handwerk: [
    `60 Sekunden Arbeitgeber-Check – anonym. Zeigt, wo im Betrieb heute Stabilität fehlt: {{URL}}`,
    `Falls du gerade Mitarbeiter suchst oder Abläufe klären willst: Das hier zeigt die echten Stellschrauben: {{URL}}`,
    `Kurzer Check für Inhaber/HR im Handwerk – extrem hilfreich & ohne Verpflichtung: {{URL}}`
  ],

  direkt: [
    `Das könnte dir wirklich helfen – dauert 2 Minuten: {{URL}}`,
    `Ein kurzer Check, der sofort Klarheit bringt: {{URL}}`,
    `Wenn du heute nur eine Sache machst – dann das hier: {{URL}}`
  ]
};


/* ------------------------------------------------------------
   2) DOM ELEMENTS (werden automatisch nur verwendet, wenn vorhanden)
------------------------------------------------------------ */
const selectEl = document.getElementById("categorySelect");
const outputEl = document.getElementById("referralOutput");
const copyBtnEl = document.getElementById("copyReferral");
const linkInfoEl = document.getElementById("personalLinkInfo");

const qrCanvas = document.getElementById("qrCanvas");
const shareFeedback = document.getElementById("shareFeedback");


/* ------------------------------------------------------------
   3) Referral-Parameter erkennen (?ref=XYZ)
------------------------------------------------------------ */
function getReferralParam() {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");

  if (ref && ref.trim() !== "") {
    return `https://heikohaerter.com/?ref=${encodeURIComponent(ref)}`;
  }
  return `https://heikohaerter.com`;
}

const personalURL = getReferralParam();
window.personalURL = personalURL; // zentral wichtig für QR & Sharing


/* ------------------------------------------------------------
   4) Update Text bei Auswahl
------------------------------------------------------------ */
function updateReferralText() {
  if (!selectEl || !outputEl) return;

  const type = selectEl.value || "neutral";
  const variants = referralVariants[type];

  if (!variants || variants.length === 0) return;

  const chosen = variants[Math.floor(Math.random() * variants.length)];
  const finalText = chosen.replace("{{URL}}", personalURL);

  outputEl.value = finalText;

  if (linkInfoEl) {
    linkInfoEl.textContent = `Dein persönlicher Link: ${personalURL}`;
  }
}


// Sofort initialisieren, wenn möglich
if (selectEl) {
  selectEl.addEventListener("change", updateReferralText);
  updateReferralText();
}


/* ------------------------------------------------------------
   5) Copy-to-Clipboard
------------------------------------------------------------ */
if (copyBtnEl) {
  copyBtnEl.addEventListener("click", async () => {
    try {
      const val = outputEl?.value?.trim();
      if (!val) return;

      await navigator.clipboard.writeText(val);

      showFeedback("✔️ Kopiert!");
    } catch (e) {
      alert("Konnte nicht kopieren – bitte manuell markieren.");
    }
  });
}


/* ------------------------------------------------------------
   6) WhatsApp Sharing
------------------------------------------------------------ */
function shareWhatsApp() {
  const val = outputEl?.value?.trim();
  if (!val) return;

  const encoded = encodeURIComponent(val);
  window.open(`https://wa.me/?text=${encoded}`, "_blank");

  showFeedback("📨 Geteilt!");
}


/* ------------------------------------------------------------
   7) Link-only Sharing
------------------------------------------------------------ */
function shareLinkOnly() {
  navigator.clipboard.writeText(personalURL).then(() => {
    showFeedback("🔗 Link kopiert!");
  });
}


/* ------------------------------------------------------------
   8) Micro-Reward Feedback
------------------------------------------------------------ */
function showFeedback(text = "Erledigt!") {
  if (!shareFeedback) return;

  shareFeedback.textContent = text;
  shareFeedback.style.opacity = 1;

  setTimeout(() => {
    shareFeedback.style.opacity = 0;
  }, 2600);
}


/* ------------------------------------------------------------
   9) QR-Code Generator (lokal in <canvas>)
------------------------------------------------------------ */
function generateQR(url) {
  if (!qrCanvas) return;

  const ctx = qrCanvas.getContext("2d");
  ctx.clearRect(0, 0, qrCanvas.width, qrCanvas.height);

  // DSGVO-freundlicher: API empfängt NUR anonymisierten Link
  const safeURL = encodeURIComponent(url);

  fetch(`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${safeURL}`)
    .then(r => r.blob())
    .then(blob => {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, qrCanvas.width, qrCanvas.height);
      img.src = URL.createObjectURL(blob);
    });
}

// Erzeuge QR nur, wenn Canvas existiert (z. B. auf Weitergeben-Seite)
if (qrCanvas) {
  generateQR(personalURL);
}


/* ------------------------------------------------------------
   10) Export functions globally (falls andere Seiten sie brauchen)
------------------------------------------------------------ */
window.shareWhatsApp = shareWhatsApp;
window.shareLinkOnly = shareLinkOnly;
window.updateReferralText = updateReferralText;
window.generateQR = generateQR;

