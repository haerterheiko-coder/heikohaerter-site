/* ============================================================
   referral.js — GODMODE 2026 (FINAL)
   Ruhiges Teilen · anonym · robust (DE/EU safe)
   Kompatibel mit: weitergeben.html (IDs siehe unten)
============================================================ */

(() => {
  "use strict";

  // --- Helpers ------------------------------------------------
  const $ = (id) => document.getElementById(id);
  const on = (el, ev, fn, opt) => el && el.addEventListener(ev, fn, opt);

  // UI-Hooks (passen zu weitergeben.html)
  const ui = {
    select: $("categorySelect"),
    text: $("referralOutput"),
    copy: $("copyReferral"),
    native: $("nativeShare"),
    qr: $("qrCanvas"),
    info: $("personalLinkInfo"),
    feedback: $("shareFeedback"),
  };

  // Falls die Seite kein Share-UI hat: still raus
  if (!ui.text) return;

  // --- Stable pseudo-RID (keine personenbezogenen Daten) -----
  const RID_KEY = "hh_rid_v1";
  const generateRID = () => crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
  const getRID = () => {
    try {
      const ex = localStorage.getItem(RID_KEY);
      if (ex) return ex;
      const rid = generateRID();
      localStorage.setItem(RID_KEY, rid);
      return rid;
    } catch { return generateRID(); }
  };

  // --- Routing / Ziel-URLs -----------------------------------
  const PATH_EMPLOYER = "/arbeitgeber-architektur";
  const ORIGIN = "https://heikohaerter.com";

  // Kategorie → Zielpfad (Handwerk schickt auf Arbeitgeber)
  function pathForCategory(cat) {
    return cat === "handwerk" ? PATH_EMPLOYER : "/";
  }

  function buildURL(category) {
    const base = ORIGIN + pathForCategory(category);
    const url = new URL(base);
    url.searchParams.set("utm_source", "weitergeben");
    url.searchParams.set("utm_medium", "share");
    url.searchParams.set("utm_campaign", category || "neutral");
    url.searchParams.set("rid", getRID());
    return url.toString();
  }

  // --- Templates (ruhig, neutral) -----------------------------
  const TPL = {
    neutral:
`Ich wollte dir etwas Ruhiges schicken. 2 Minuten – anonym, ohne Unterlagen, ohne Verkauf.
Es zeigt nur: stabil · wackelig · heute wichtig. Wenn es nichts bringt, einfach ignorieren.

{{URL}}`,

    eltern:
`Kurz gedacht: Das könnte für euch passen.
2 Minuten – anonym, ohne Gespräch. Zeigt nur, ob gerade etwas Wichtiges fehlt.

{{URL}}`,

    paare:
`Kein großes Thema – eher ein ruhiger Blick.
2 Minuten, anonym. Einfach sehen: stabil · wackelig · heute wichtig.

{{URL}}`,

    selbst:
`Für Selbstständige ganz hilfreich: 2 Minuten, anonym – zeigt, ob das System heute trägt.
Kein Verkauf, kein Gespräch.

{{URL}}`,

    freunde:
`Ohne Erwartung – einfach falls es hilft.
2 Minuten, anonym. Klarheit: stabil · wackelig · heute wichtig.

{{URL}}`,

    skeptiker:
`Kein Funnel, kein Verkauf. 2 Minuten – anonym, ohne Unterlagen.
Nur: stabil · wackelig · heute wichtig.

{{URL}}`,

    handwerk:
`Für Bau/Handwerk: 60-Sekunden-Arbeitgeber-Check – anonym.
Zeigt ruhig, ob Strukturen heute tragen.

{{URL}}`,

    direkt:
`2 Minuten. Anonym. Kein Verkauf. Zeigt heute: stabil · wackelig · wichtig.

{{URL}}`,
  };

  // --- State (persistente Auswahl) ----------------------------
  const STORE_KEY = "hh_referral_state_v1";
  function loadState() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
  function saveState(state) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch {}
  }

  // --- Materialisierung: Text + Links + QR -------------------
  function materialize(category) {
    const cat = category || ui.select?.value || "neutral";
    const url = buildURL(cat);

    // Text mit Link „materialisieren“
    const raw = (ui.text.value || "").trim();
    const defaultTpl = TPL[cat] || TPL.neutral;
    const source = raw.length ? raw : defaultTpl;

    ui.text.value = source.includes("{{URL}}")
      ? source.replaceAll("{{URL}}", url)
      : (source + "\n\n" + url);

    // Infozeile
    if (ui.info) {
      ui.info.textContent = "Persönlicher Link: " + url;
    }

    // QR neu zeichnen (externer, leichter Service; nur Darstellung)
    drawQR(url);

    // Zustand speichern
    saveState({ category: cat, text: ui.text.value });
  }

  // --- QR: pragmatischer, datensparsamer Ansatz ---------------
  // Ohne Bibliothek erzeugen wir den Code via QR-Service und malen ihn in die Canvas.
  // Später kannst du das durch einen selbstgehosteten Endpunkt ersetzen.
  function drawQR(data) {
    if (!ui.qr) return;

    const size = Math.min(ui.qr.width || 220, ui.qr.height || 220);
    const ctx = ui.qr.getContext("2d");
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, ui.qr.width, ui.qr.height);

    const img = new Image();
    // Hinweis: Dieser Endpunkt speichert laut Anbieter keine personenbezogenen Daten;
    // er bekommt nur die URL (die ohnehin öffentlich ist).
    img.crossOrigin = "anonymous";
    img.referrerPolicy = "no-referrer";
    img.src = "https://api.qrserver.com/v1/create-qr-code/?size=" + size + "x" + size + "&data=" + encodeURIComponent(data);

    img.onload = () => {
      // Mittelpunkt zeichnen (leichtes Polishing)
      ctx.fillStyle = "rgba(255,255,255,.04)";
      ctx.fillRect(0, 0, ui.qr.width, ui.qr.height);

      // QR mittig einsetzen
      const pad = Math.round((ui.qr.width - size) / 2);
      ctx.drawImage(img, pad, pad, size, size);

      // Rahmen
      ctx.strokeStyle = "rgba(255,255,255,.12)";
      ctx.lineWidth = 1;
      ctx.strokeRect(pad + 0.5, pad + 0.5, size - 1, size - 1);
      toast("QR aktualisiert.");
    };

    img.onerror = () => {
      // Fallback: ruhige Textdarstellung
      ctx.fillStyle = "rgba(255,255,255,.06)";
      ctx.fillRect(0, 0, ui.qr.width, ui.qr.height);
      ctx.fillStyle = "#F1F3FA";
      ctx.font = "14px -apple-system,BlinkMacSystemFont,Segoe UI,system-ui,sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      wrapText(ctx, "QR konnte nicht geladen werden.\nLink siehe unten.", ui.qr.width/2, ui.qr.height/2, ui.qr.width - 24, 18);
      toast("QR nicht verfügbar. Link ist im Text enthalten.");
    };
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight){
    const lines = text.split("\n");
    let offsetY = 0;
    for (const line of lines){
      const words = line.split(" ");
      let l = "";
      for (const w of words){
        const test = l + w + " ";
        if (ctx.measureText(test).width > maxWidth && l){
          ctx.fillText(l, x, y + offsetY);
          l = w + " ";
          offsetY += lineHeight;
        } else {
          l = test;
        }
      }
      ctx.fillText(l.trim(), x, y + offsetY);
      offsetY += lineHeight;
    }
  }

  // --- Copy / Share ------------------------------------------
  async function copyText() {
    const val = (ui.text.value || "").trim();
    if (!val) return;
    try {
      await navigator.clipboard.writeText(val);
      toast("Kopiert. Du kannst es jetzt überall einfügen.");
    } catch {
      // Fallback: Auswahl markieren
      ui.text.select?.();
      toast("Markiert. Manuell kopieren (⌘/Ctrl+C) funktioniert immer.");
    }
  }

  async function nativeShare() {
    const val = (ui.text.value || "").trim();
    if (!val) return;

    // Versuche die URL separat zu extrahieren (letzte Zeile)
    const lines = val.split("\n").map(s => s.trim()).filter(Boolean);
    const maybeUrl = lines[lines.length - 1];
    const shareData = {
      title: "Ein ruhiger 2-Minuten-Blick",
      text: val,
      url: /https?:\/\//i.test(maybeUrl) ? maybeUrl : undefined
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast("Geteilt.");
      } catch {
        // Abgebrochen – kein Fehler-Toast nötig
      }
    } else {
      // Fallback: Kopieren
      await copyText();
    }
  }

  // --- Feedback (Screenreader freundlich) ---------------------
  let toastTimer;
  function toast(msg) {
    if (!ui.feedback) return;
    ui.feedback.textContent = msg;
    ui.feedback.style.opacity = "1";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { ui.feedback.style.opacity = "0.82"; }, 2200);
  }

  // --- Init ---------------------------------------------------
  function init() {
    // Vorbelegen (State oder Defaults)
    const state = loadState();
    if (ui.select && state?.category) ui.select.value = state.category;

    // Wenn kein Text in State: Template füllen
    if (!state?.text) {
      ui.text.value = ""; // leer, damit materialize Template nimmt
      materialize(ui.select?.value || "neutral");
    } else {
      ui.text.value = state.text;
      // Link/QR aus aktuellem Text rekonstruieren
      const cat = ui.select?.value || "neutral";
      const url = buildURL(cat);
      drawQR(url);
      ui.info && (ui.info.textContent = "Persönlicher Link: " + url);
    }

    on(ui.select, "change", () => materialize(ui.select.value));
    on(ui.copy, "click", copyText);
    on(ui.native, "click", nativeShare);

    // Wenn Nutzer den Text editiert, Links/QR erneuern (z. B. {{URL}} wieder einfügen)
    on(ui.text, "blur", () => {
      // Bei manueller Bearbeitung prüfen, ob ein URL fehlt
      const cat = ui.select?.value || "neutral";
      const url = buildURL(cat);
      const hasUrl = ui.text.value.includes("http://") || ui.text.value.includes("https://");
      if (!hasUrl) {
        ui.text.value = (ui.text.value.trim() + "\n\n" + url).trim();
      }
      drawQR(url);
      ui.info && (ui.info.textContent = "Persönlicher Link: " + url);
      saveState({ category: cat, text: ui.text.value });
      toast("Aktualisiert.");
    });
  }

  // DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
