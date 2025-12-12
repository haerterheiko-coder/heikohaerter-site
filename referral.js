/* ============================================================
   referral.js – GODMODE 2026 (Premium Ultimate)
   Universelles Weitergabe-System – Heiko Haerter
============================================================ */

/* ------------------------------------------------------------
   0) Varianten (inkl. Handwerk & Direkt)
------------------------------------------------------------ */
const referralVariants = {
  neutral: [
    `Ein kurzer Moment Ruhe für dich – anonym, 2 Minuten, ohne Verkauf: {{URL}}`,
    `Falls du manchmal hoffst, nichts Wichtiges zu übersehen – das hilft: {{URL}}`,
    `Ein ruhiger Reality-Check ohne Druck. Grün · Gelb · Rot. Vielleicht gibt’s dir Ruhe: {{URL}}`,
    `Ein Mini-Check, der sofort beruhigt – anonym & freundlich: {{URL}}`,
    `Wenn du kurz Klarheit willst – das hier fühlt sich leicht an: {{URL}}`
  ],
  eltern: [
    `Wenn die Kids schlafen und der Kopf voll ist: 2 Minuten Ruhe – anonym & ohne Daten: {{URL}}`,
    `Für einen kurzen Moment Orientierung im Alltag: {{URL}}`,
    `Hat mir selbst Ruhe gegeben – vielleicht hilft’s dir auch: {{URL}}`,
    `Ein schneller Blick: „Alles gut für heute?“ – anonym & ohne Papierkram: {{URL}}`,
    `Für Eltern, die nichts Wichtiges übersehen wollen – 2 Minuten: {{URL}}`
  ],
  paare: [
    `Wenn ihr wissen wollt, ob alles stabil wirkt – neutral, anonym, 2 Minuten: {{URL}}`,
    `Ein kurzer Check, der sich erstaunlich leicht anfühlt: {{URL}}`,
    `Hilft, ohne eine Diskussion auszulösen – 2 Minuten Blick: {{URL}}`
  ],
  selbst: [
    `Kurze Selbstständigen-Frage: Würde es heute halten, wenn du ausfällst? 2 Minuten, anonym: {{URL}}`,
    `Für einen klaren Blick, bevor der Alltag weiterläuft: {{URL}}`,
    `Mini-Risiko-Check für heute – ohne Verkauf, neutral & anonym: {{URL}}`
  ],
  freunde: [
    `Hat mir gerade echt Ruhe gegeben – dachte direkt an dich: {{URL}}`,
    `Null Stress, einfach nur Orientierung. Vielleicht hilft‘s dir: {{URL}}`,
    `Ein leichter, kurzer Blick – fühlt sich gut an: {{URL}}`
  ],
  skeptiker: [
    `Nur damit klar ist: kein Verkauf, keine Daten – einfach ein ruhiger 2-Minuten-Check: {{URL}}`,
    `Ich weiß, du magst sowas normal nicht – aber das hier ist komplett neutral: {{URL}}`,
    `Keine Werbung, kein Druck – nur eine faire Einschätzung: {{URL}}`
  ],
  handwerk: [
    `60-Sekunden-Arbeitgeber-Check – anonym. Zeigt sofort, wo heute Stabilität fehlt: {{URL}}`,
    `Falls du Abläufe klären oder Mitarbeiter halten willst: Der Check zeigt die echten Stellschrauben – ohne Verkauf: {{URL}}`,
    `Kurz, klar, anonym. Für Inhaber & HR im Handwerk – echte Orientierung statt Papierkram: {{URL}}`,
    `Kostet 0 Minuten Gespräch – gibt aber sofort Klarheit: {{URL}}`,
    `Neutraler Lage-Check fürs Handwerk – sofort anwendbar: {{URL}}`
  ],
  direkt: [
    `Das könnte dir wirklich helfen – dauert 2 Minuten: {{URL}}`,
    `Ein kurzer Check, der sofort Klarheit bringt: {{URL}}`,
    `Wenn du heute kurz Orientierung willst – das hier ist leicht & anonym: {{URL}}`,
    `Zwei Minuten, die dir Stress sparen können: {{URL}}`,
    `Einfach ausprobieren – nichts zu verlieren: {{URL}}`
  ]
};

/* ------------------------------------------------------------
   1) DOM References
------------------------------------------------------------ */
let selectEl, outputEl, copyBtnEl, linkInfoEl, qrCanvas, shareFeedback;

/* ------------------------------------------------------------
   2) Referral-Link (inkl. Handwerk-Erkennung)
------------------------------------------------------------ */
function getReferralLink() {
  const params = new URLSearchParams(location.search);
  const ref = params.get("ref");

  const isHandwerk = /arbeitgeber-architektur/i.test(location.pathname);

  const base = isHandwerk
    ? "https://heikohaerter.com/arbeitgeber-architektur"
    : "https://heikohaerter.com";

  return ref ? `${base}?ref=${encodeURIComponent(ref)}` : base;
}

const personalURL = getReferralLink();
window.personalURL = personalURL;

/* ------------------------------------------------------------
   3) Textgenerator
------------------------------------------------------------ */
function updateReferralText() {
  if (!selectEl || !outputEl) return;

  const key = selectEl.value || "neutral";
  const variants = referralVariants[key] || referralVariants.neutral;

  const chosen = variants[Math.floor(Math.random() * variants.length)];
  outputEl.value = chosen.replace("{{URL}}", personalURL);

  if (linkInfoEl) {
    linkInfoEl.textContent =
      `Dein persönlicher, anonymer Weitergabe-Link: ${personalURL}`;
  }
}

/* ------------------------------------------------------------
   4) Copy inkl. Safari-Fallback
------------------------------------------------------------ */
async function copyReferral() {
  const val = outputEl?.value?.trim();
  if (!val) return;

  try {
    await navigator.clipboard.writeText(val);
    showFeedback("✔️ Text kopiert!");
  } catch {
    try {
      outputEl.focus();
      outputEl.select();
      document.execCommand("copy");
      showFeedback("✔️ Kopiert (Fallback)");
    } catch {
      alert("Konnte nicht kopieren – bitte manuell markieren.");
    }
  }
}

/* ------------------------------------------------------------
   5) WhatsApp (iOS-sicher)
------------------------------------------------------------ */
function shareWhatsApp() {
  const val = outputEl?.value?.trim();
  if (!val) return;

  location.href = `https://wa.me/?text=${encodeURIComponent(val)}`;
  showFeedback("📨 WhatsApp geöffnet!");
}

/* ------------------------------------------------------------
   6) Nur Link kopieren
------------------------------------------------------------ */
function shareLinkOnly() {
  navigator.clipboard.writeText(personalURL).then(() => {
    showFeedback("🔗 Link kopiert!");
  });
}

/* ------------------------------------------------------------
   7) Microreward UI
------------------------------------------------------------ */
function showFeedback(msg = "Erledigt!") {
  if (!shareFeedback) return;
  shareFeedback.textContent = msg;
  shareFeedback.classList.add("active");

  setTimeout(() => shareFeedback.classList.remove("active"), 2300);
}

/* ------------------------------------------------------------
   8) QR-Code Generator
------------------------------------------------------------ */
function generateQR(url = personalURL) {
  if (!qrCanvas) return;

  const ctx = qrCanvas.getContext("2d");
  ctx.clearRect(0, 0, qrCanvas.width, qrCanvas.height);

  fetch(
    `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}&_=${Date.now()}`
  )
    .then(r => r.blob())
    .then(blob => {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, qrCanvas.width, qrCanvas.height);
      img.onerror = drawQRFallback;
      img.src = URL.createObjectURL(blob);
    })
    .catch(drawQRFallback);

  function drawQRFallback() {
    ctx.font = "14px system-ui, sans-serif";
    ctx.fillStyle = "#fff";
    ctx.fillText("QR konnte nicht geladen werden", 18, 110);
  }
}

/* ------------------------------------------------------------
   9) Init – DOM Ready
------------------------------------------------------------ */
document.addEventListener("DOMContentLoaded", () => {
  selectEl      = document.getElementById("categorySelect");
  outputEl      = document.getElementById("referralOutput");
  copyBtnEl     = document.getElementById("copyReferral");
  linkInfoEl    = document.getElementById("personalLinkInfo");
  qrCanvas      = document.getElementById("qrCanvas");
  shareFeedback = document.getElementById("shareFeedback");

  if (selectEl)  selectEl.addEventListener("change", updateReferralText);
  if (copyBtnEl) copyBtnEl.addEventListener("click", copyReferral);

  updateReferralText();
  generateQR();
});

/* ------------------------------------------------------------
   10) Export (optional global API)
------------------------------------------------------------ */
Object.assign(window, {
  updateReferralText,
  copyReferral,
  shareWhatsApp,
  shareLinkOnly,
  generateQR
});
