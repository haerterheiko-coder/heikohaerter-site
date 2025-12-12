/* ============================================================
   referral.js — GODMODE 2026 (FINAL)
   Ruhiges Teilen · anonym · robust (DE/EU safe)
============================================================ */

(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const ui = {
    text: $("refText"),
    copy: $("copyBtn"),
    wa: $("waShare"),
    native: $("nativeShare")
  };

  // Wenn Seite kein Share-UI hat: still raus
  if (!ui.text) return;

  const RID_KEY = "hh_rid_v1";

  const generateRID = () =>
    crypto.getRandomValues(new Uint32Array(1))[0].toString(36);

  const getRID = () => {
    try {
      const existing = localStorage.getItem(RID_KEY);
      if (existing) return existing;
      const rid = generateRID();
      localStorage.setItem(RID_KEY, rid);
      return rid;
    } catch {
      return generateRID();
    }
  };

  function buildURL() {
    const isEmployer = /arbeitgeber-architektur/i.test(location.pathname);
    const base = isEmployer
      ? "https://heikohaerter.com/arbeitgeber-architektur"
      : "https://heikohaerter.com/";

    const url = new URL(base);
    url.searchParams.set("utm_source", "weitergeben");
    url.searchParams.set("utm_medium", "share");
    url.searchParams.set("utm_campaign", isEmployer ? "arbeitgeber" : "ampel");
    url.searchParams.set("rid", getRID());
    return url.toString();
  }

  const REF_URL = buildURL();

  function materializeText() {
    const raw = ui.text.value || "";
    if (raw.includes("{{URL}}")) {
      ui.text.value = raw.replaceAll("{{URL}}", REF_URL);
    } else {
      // falls jemand den Platzhalter gelöscht hat: Link ruhig ans Ende
      ui.text.value = raw.trim() + "\n\n" + REF_URL;
    }
    updateLinks();
  }

  function updateLinks() {
    const val = (ui.text.value || "").trim();
    if (ui.wa) {
      ui.wa.href = "https://wa.me/?text=" + encodeURIComponent(val);
    }
  }

  async function copyText() {
    const val
