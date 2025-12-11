/* ============================================================
   referral.js – Weitergeben-Generator (Godmode 2026)
   Heiko Haerter – Ruhiger Finanz-Kompass
   ============================================================ */

/* ------------------------------------------------------------
   1) Variantendatenbank – Deine kompletten Godmode-Texte
------------------------------------------------------------ */
const referralVariants = {
  neutral: [
    `Hey… ich hatte eben so einen Moment, wo man kurz denkt: „Hoffentlich hab ich nichts Wichtiges übersehen.“ Hab dann diese 2-Minuten-Ampel probiert – anonym, kein Verkauf. Vielleicht gibt’s dir kurz Ruhe: {{URL}}`,

    `Kennst du diesen Stapel im Kopf, den man immer nur umschichtet? Die Ampel sortiert in 2 Minuten, ob heute irgendwas offen wäre, wenn Job/Gesundheit/Familie aus dem Takt kommen. Dachte an dich: {{URL}}`,

    `Ist nix Großes. Nur ein kurzer Realitätsmoment: grün / gelb / rot – wie es heute wirkt. Anonym, kein Kram. Falls’s dir Ruhe gibt: {{URL}}`,

    `Kein Verkauf, kein Vertrag. Nur ein ruhiger Blick: „Würde’s heute halten – oder nicht?“ Wenn’s nichts ist, einfach ignorieren: {{URL}}`
  ],

  eltern: [
    `Wenn die Kids schlafen und man einmal tief durchatmet… Die Ampel zeigt anonym, ob heute irgendwas offen wäre – falls mal was ist. War überraschend beruhigend: {{URL}}`,

    `Zwischen Kita-Zetteln, Job & Müdigkeit geht sowas ja unter. Die Ampel zeigt in 2 Min, ob alles trägt – oder ob irgendwo ’ne kleine Lücke ist. Ruhig & anonym: {{URL}}`,

    `Falls du manchmal denkst: „Hauptsache, die Kids wären okay – egal was kommt.“ Die Ampel zeigt grob, wie das heute wirken würde – anonym. Falls’s dir hilft: {{URL}}`
  ],

  paare: [
    `Wenn gerade viel gleichzeitig wichtig wirkt… Die Ampel sortiert in 2 Min in „Jetzt · Als Nächstes · Später“. War erstaunlich entlastend: {{URL}}`,

    `Falls ihr euch manchmal fragt, ob ihr irgendwas überseht: Die Ampel gibt ein neutrales Bild – ohne dass jemand recht haben muss. Ziemlich angenehm: {{URL}}`
  ],

  selbst: [
    `Kurze Selbstständigen-Frage: Würde dein Alltag 3 Monate tragen, wenn du ausfällst? Die Ampel zeigt’s anonym in 2 Min – ohne Verkauf: {{URL}}`,

    `Zwischen Kunden, Steuer & Fixkosten bleibt ja null Kopf frei. Die Ampel zeigt, wie stabil es heute wäre – oder ob was wackelt. Ruhig: {{URL}}`
  ],

  freunde: [
    `Hab das gemacht und musste an dich denken. 2 Minuten, anonym – zeigt nur, ob heute was offen wäre, falls was dazwischenkommt. Wenn nicht: perfekt → {{URL}}`,

    `Fühlt sich null nach „Finanzen“ an. Eher wie kurz hinter die Kulissen schauen: „Würde das grad halten – oder nicht?“ Farbig, anonym: {{URL}}`
  ],

  skeptiker: [
    `Nur damit klar ist: Ich hab nichts davon. Ich fand’s einfach angenehm neutral. 2 Min, anonym, kein Verkauf. Falls du kurz Überblick willst: {{URL}}`,

    `Ich weiß, du hasst sowas normal. Aber das hier ist null pushy – zeigt nur grün/gelb/rot. Hat mir kurz Ruhe gegeben: {{URL}}`
  ]
};


/* ------------------------------------------------------------
   2) DOM ELEMENTS
------------------------------------------------------------ */
const categorySelect = document.getElementById("categorySelect");
const output = document.getElementById("referralOutput");
const copyBtn = document.getElementById("copyReferral");
const personalLinkInfo = document.getElementById("personalLinkInfo");


/* ------------------------------------------------------------
   3) Persönlichen Link erkennen (Query Parameter: ?ref=XYZ)
------------------------------------------------------------ */
function getPersonalLink() {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");

  // Falls jemand über "Weitergeben" kommt → fallback = Hauptdomain
  return ref
    ? `https://heikohaerter.com/?ref=${encodeURIComponent(ref)}`
    : `https://heikohaerter.com`;
}

const personalURL = getPersonalLink();


/* ------------------------------------------------------------
   4) Generator: Kategorie → zufällige Nachricht → URL einsetzen
------------------------------------------------------------ */
function updateReferralText() {
  const type = categorySelect.value;
  const variants = referralVariants[type];

  if (!variants) return;

  // Zufällige Variante
  const text = variants[Math.floor(Math.random() * variants.length)];

  // URL einfügen
  const finalText = text.replace("{{URL}}", personalURL);

  output.value = finalText;

  // Hinweis anzeigen
  personalLinkInfo.textContent = `Dein persönlicher Link: ${personalURL}`;
}

categorySelect.addEventListener("change", updateReferralText);


/* ------------------------------------------------------------
   5) Copy-to-Clipboard mit hochwertigem UX-Feedback
------------------------------------------------------------ */
copyBtn.addEventListener("click", async () => {
  output.select();
  output.setSelectionRange(0, 99999);

  try {
    await navigator.clipboard.writeText(output.value);
    copyBtn.textContent = "✔️ Kopiert!";
    copyBtn.style.background = "var(--gold-soft)";
    setTimeout(() => {
      copyBtn.textContent = "📋 Text kopieren";
      copyBtn.style.background = "var(--gold)";
    }, 1600);
  } catch (err) {
    console.error("Copy failed:", err);
    alert("Kopieren nicht möglich – bitte manuell markieren.");
  }
});


/* ------------------------------------------------------------
   6) Initialer Startwert (Neutral)
------------------------------------------------------------ */
updateReferralText();
