/* ============================================================
   referral.js – PREMIUM ULTIMATE VERSION (Godmode 2026)
   Universelles Weitergabe-System für alle Seiten
   Heiko Haerter – Ruhiger Finanz-Kompass
============================================================ */

/* ------------------------------------------------------------
   0) DOM Ready – verhindert Race Conditions
------------------------------------------------------------ */
document.addEventListener("DOMContentLoaded", () => {
  if (typeof updateReferralText === "function" && selectEl) {
    updateReferralText();
  }
});

/* ------------------------------------------------------------
   1) Varianten – inkl. Handwerk & Direkt (optimiert)
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

  /* PREMIUM: Schärfere Handwerks-Texte */
  handwerk: [
    `60-Sekunden-Arbeitgeber-Check – anonym. Zeigt sofort, wo heute Stabilität fehlt: {{URL}}`,
    `Falls du Abläufe klären oder Mitarbeiter halten willst: Der Check zeigt die echten Stellschrauben – ohne Verkauf: {{URL}}`,
    `Kurz, klar, anonym. Für Inhaber & HR im Handwerk – echte Orientierung statt Papierkram: {{URL}}`
  ],

  /* PREMIUM: Direkt-Tonalität optimiert */
  direkt: [
    `Das könnte dir wirklich helfen – dauert 2 Minuten: {{URL}}`,
    `Ein kurzer Check, der sofort Klarheit bringt: {{URL}}`,
    `Wenn du heute kurz Orientierung willst – das hier ist leicht & anonym: {{URL}}`
  ]
};


/* ------------------------------------------------------------
   2) DOM Elemente
------------------------------------------------------------ */
const selectEl      = document.getElementById("categorySelect");
const outputEl      = document.getElementById("referralOutput");
const copyBtnEl     = document.getElementById("copyReferral");
const linkInfoEl    = document.getElementById("personalLinkInfo");

const qrCanvas      = document.getElementById("qrCanvas");
const shareFeedback = document.getElementById("shareFeedback");


/* ------------------------------------------------------------
   3) Referral-URL – erkennt automatisch Handwerker-Seiten
------------------------------------------------------------ */
function getReferralParam() {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");

  // Automatische Basiserkennung
  let base =
    window.location.pathname.includes("arbeitgeber-architektur")
      ? "https://heikohaerter.com/arbeitgeber-architektur"
      : "https://heikohaerter.com";

  if (ref && ref.trim() !== "") {
    return `${base}?ref=${encodeURIComponent(ref)}`;
  }

  return base;
}

const personalURL = getReferralParam();
window.personalURL = personalURL; // universal verfügbar


/* ------------------------------------------------------------
   4) Textgenerator
------------------------------------------------------------ */
function updateReferralText() {
  if (!selectEl || !outputEl) return;

  const type = selectEl.value || "neutral";
  const variants = referralVariants[type];

  // Fallback wenn Kategorie fehlt
  if (!variants || variants.length === 0) {
    outputEl.value = personalURL;
    return;
  }

  const chosen = variants[Math.floor(Math.random() * variants.length)];
  const finalText = chosen.replace("{{URL}}", personalURL);

  outputEl.value = finalText;

  if (linkInfoEl) {
    linkInfoEl.textContent = `Dein persönlicher, anonymer Weitergabe-Link: ${personalURL}`;
  }
}

if (selectEl) {
  selectEl.addEventListener("change", updateReferralText);
  updateReferralText();
}


/* ------------------------------------------------------------
   5) Copy to Clipboard (Premium + iOS Fallback)
------------------------------------------------------------ */
if (copyBtnEl) {
  copyBtnEl.addEventListener("click", async () => {
    const val = outputEl?.value?.trim();
    if (!val) return;

    try {
      if (!navigator.clipboard) {
        /* iOS Fallback */
        outputEl.select();
        document.execCommand("copy");
      } else {
        await navigator.clipboard.writeText(val);
      }
      showFeedback("✔️ Text kopiert!");
    } catch {
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

  showFeedback("📨 WhatsApp gesendet!");
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
   8) Microreward (Dopamin-Boost)
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
   9) QR-Code Generator – DSGVO-freundlich + Anti-Cache
------------------------------------------------------------ */
function generateQR(url) {
  if (!qrCanvas) return;

  const ctx = qrCanvas.getContext("2d");
  ctx.clearRect(0, 0, qrCanvas.width, qrCanvas.height);

  const safeURL = encodeURIComponent(url);
  const noCache = Date.now(); // verhindert QR-Caching

  fetch(`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${safeURL}&_=${noCache}`)
    .then(r => r.blob())
    .then(blob => {
      const img = new Image();
      img.onload = () => {
        ctx.imageSmoothingEnabled = true; // PREMIUM
        ctx.drawImage(img, 0, 0, qrCanvas.width, qrCanvas.height);
      };
      img.src = URL.createObjectURL(blob);
    });
}

if (qrCanvas) {
  generateQR(personalURL);
}


/* ------------------------------------------------------------
   10) Export global
------------------------------------------------------------ */
window.shareWhatsApp     = shareWhatsApp;
window.shareLinkOnly     = shareLinkOnly;
window.updateReferralText = updateReferralText;
window.generateQR         = generateQR;
