// ==========================================================================
// app.js — GODMODE Edition 2026
// Ultra-lite Neuro-UX Engine · Zero-Pressure by Design
// Modules: loader, reveal, smooth-scroll, decision-anchor, sticky-cta,
//          live-feed, personas, quiz, bottom-nav, proof bars
// ==========================================================================
(() => {
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];

  document.documentElement.classList.remove("no-js");

  /* -----------------------------------------------------------------------
    MICRO LOADER (0.5s) — erzeugt Ruhe & Commitment ohne Druck
  ----------------------------------------------------------------------- */
  function setupLoader() {
    const el = $("#micro-loader");
    if (!el) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const hide = () => el.classList.add("hide");
    if (reduce) return hide();

    setTimeout(hide, 500);
  }

  /* -----------------------------------------------------------------------
    SMOOTH SCROLL
  ----------------------------------------------------------------------- */
  function setupSmoothScroll() {
    const handler = (e) => {
      const t = e.currentTarget;
      const href = t.getAttribute("data-target") || t.getAttribute("href");
      if (!href || !href.startsWith("#")) return;
      const dest = document.querySelector(href);
      if (!dest) return;

      e.preventDefault();
      dest.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    $$('a[href^="#"], [data-target^="#"]').forEach((a) =>
      a.addEventListener("click", handler)
    );
  }

  /* -----------------------------------------------------------------------
    REVEAL ON SCROLL
  ----------------------------------------------------------------------- */
  function setupReveal() {
    const els = $$(".fade-up");
    if (!els.length) return;

    const io = new IntersectionObserver(
      (ents) => {
        ents.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    els.forEach((el) => io.observe(el));
  }

  /* -----------------------------------------------------------------------
    DECISION ANCHOR — erscheint erst nach Scroll
  ----------------------------------------------------------------------- */
  function setupDecisionAnchor() {
    const el = $("#decision-anchor");
    if (!el) return;

    let shown = false;
    const onScroll = () => {
      if (!shown && window.scrollY > 180) {
        el.classList.add("show");
        shown = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    // Micro-Proof rotierende Messages
    const micro = $("#micro-proof");
    const msgs = [
      "keine Vorbereitung notwendig",
      "dauert nur 2 Minuten",
      "du entscheidest – nichts wird verkauft",
    ];
    if (micro) {
      let i = 0;
      setInterval(() => {
        i = (i + 1) % msgs.length;
        micro.textContent = msgs[i];
      }, 4000);
    }
  }

  /* -----------------------------------------------------------------------
    STICKY CTA — erscheint erst wenn Hero verlassen wird
  ----------------------------------------------------------------------- */
  function setupStickyCTA() {
    const cta = $("#sticky-cta");
    const hero = $("#hero");
    const quiz = $("#quiz");
    if (!cta || !hero) return;

    const set = (show) => {
      cta.classList.toggle("show", show);
      cta.setAttribute("aria-hidden", show ? "false" : "true");
    };

    // Hero beobachten
    new IntersectionObserver(
      ([e]) => {
        const show = !e.isIntersecting && window.scrollY > window.innerHeight * 0.25;
        set(show);
      },
      { threshold: 0.4 }
    ).observe(hero);

    // Am Quiz nicht stören
    if (quiz) {
      new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) set(false);
        },
        { threshold: 0.25 }
      ).observe(quiz);
    }

    cta.addEventListener("click", () =>
      $("#quiz")?.scrollIntoView({ behavior: "smooth" })
    );
  }

  /* -----------------------------------------------------------------------
    LIVE FEEDS — Social Proof in Echtzeit
  ----------------------------------------------------------------------- */
  function rotateFeed(selector, lines) {
    const box = $(selector);
    if (!box) return;

    let i = 0;
    box.textContent = lines[i];

    setInterval(() => {
      i = (i + 1) % lines.length;
      box.textContent = lines[i];
    }, 3500);
  }

  function setupLiveFeeds() {
    rotateFeed("#live-feed", [
      "„Sandra (31) hat gerade ihre Ampel gemacht.“",
      "„Leon (27) spart 420 € jedes Jahr.“",
      "„Heute schon 18 Menschen Ruhe gewonnen.“",
    ]);

    rotateFeed("#referral-live-feed", [
      "„Clara (34) hat den Link weitergegeben.“",
      "„Tom (42) startet – 2 Minuten.“",
      "„Ohne Verkauf. Einfach anfangen.“",
    ]);
  }

  /* -----------------------------------------------------------------------
    PERSONAS — aktivieren & Text ausgeben
  ----------------------------------------------------------------------- */
  let currentPersona = "";

  function setupPersonas() {
    const out = $("#persona-copy");
    const cards = $$(".persona-card");
    if (!cards.length) return;

    function activate(btn) {
      cards.forEach((c) => c.classList.remove("is-active"));
      btn.classList.add("is-active");

      currentPersona = btn.getAttribute("data-key") || "";

      const h = btn.getAttribute("data-headline") || "";
      const s = btn.getAttribute("data-subheadline") || "";
      if (out) out.textContent = `${h} ${s}`.trim();
    }

    cards.forEach((c) => {
      c.addEventListener("click", () => activate(c));
      c.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          activate(c);
        }
      });
    });
  }

  /* -----------------------------------------------------------------------
    PROOF BARS
  ----------------------------------------------------------------------- */
  function setupProofBars() {
    const bars = $$(".proof-bar");
    if (!bars.length) return;

    const io = new IntersectionObserver(
      (ents) => {
        ents.forEach(({ isIntersecting, target }) => {
          if (!isIntersecting) return;
          const span = target.querySelector("span");
          const v = parseInt(target.getAttribute("data-value"), 10) || 0;
          if (span) span.style.width = Math.min(100, Math.max(0, v)) + "%";
        });
      },
      { threshold: 0.3 }
    );

    bars.forEach((b) => io.observe(b));
  }

  /* -----------------------------------------------------------------------
    QUIZ — 3 Schritte, predictive text, persona auto-switch
  ----------------------------------------------------------------------- */
  function setupQuiz() {
    const steps = $$("#quiz-steps .quiz-step");
    if (!steps.length) return;

    const bar = $("#quiz-progress-bar");
    const stepText = $("#quiz-step-text");
    const tick = $("#progress-tick");
    const soft = $("#soft-permission");

    const resultCard = $("#quiz-result");
    const resultNote = $("#quiz-summary-text");
    const personaBadge = $("#persona-badge");

    const answers = [];
    let current = 0;

    const setProgress = () => {
      const pct = Math.round((current / steps.length) * 100);
      bar.style.width = pct + "%";
      bar.setAttribute("aria-valuenow", pct);
      stepText.textContent = String(Math.min(current + 1, steps.length));

      const texts = [
        "Los geht’s",
        "✓ 1 von 3 – gut dabei",
        "✓ 2 von 3 – fast geschafft",
        "✓ 3 von 3",
      ];
      tick.textContent = texts[Math.min(current, texts.length - 1)];
    };

    const computeAmpel = () => {
      // unsicher / keine Ahnung = rot
      // stabil = grün
      // gemischt = gelb
      let rot = 0,
        gruen = 0;

      answers.forEach((v) => {
        if (v === "stabil") gruen++;
        else rot++;
      });

      if (gruen >= 2) return "gruen";
      if (rot >= 2) return "rot";
      return "gelb";
    };

    const predictiveText = (color) => {
      const base = {
        rot: [
          "Erstmal Ordnung schaffen – wir gehen das ruhig & strukturiert an.",
          "Kein Druck: Schritt für Schritt, heute starten reicht.",
          "Wir sortieren das Wichtigste zuerst – weniger Chaos sofort spürbar.",
        ],
        gelb: [
          "Schon gut – mit ein paar Schritten wird es deutlich entspannter.",
          "Fast da: Wir drehen an 2–3 kleinen Stellschrauben.",
          "Gut im Griff – kleine Optimierungen für mehr Ruhe.",
        ],
        gruen: [
          "Sehr stabil – nur Kleinigkeiten im Blick behalten.",
          "Top Basis – wir sichern ab, was wirklich wirkt.",
          "Weiter so: Mini-Checks für langfristige Ruhe.",
        ],
      };

      const personaAdd = {
        familie: {
          rot: " Fokus: Familienalltag einfacher machen.",
          gelb: " Mehr Ruhe im Alltag ohne Papierkram.",
          gruen: " Familien-Themen bleiben entspannt.",
        },
        angestellt: {
          rot: " Schnell Ordnung für den Arbeitsalltag.",
          gelb: " Klarheit, damit sich der Monat besser anfühlt.",
          gruen: " Stabil weiter – Check zur Bestätigung.",
        },
        selbststaendig: {
          rot: " Schwankungen abfedern, Risiken sortieren.",
          gelb: " Liquidität & Absicherung sauber justieren.",
          gruen: " Stabil – Reserve & Absicherung kurz prüfen.",
        },
      };

      const pick = base[color][Math.floor(Math.random() * base[color].length)];
      return pick + (personaAdd[currentPersona]?.[color] || "");
    };

    const genSlots = () => {
      const box = $("#slot-container");
      if (!box) return;
      box.innerHTML = "";

      const times = ["09:30", "11:00", "13:30", "15:30", "18:00"];

      for (let i = 0; i < 5; i++) {
        const el = document.createElement("div");
        const d = new Date();
        d.setDate(d.getDate() + i);

        el.className = "slot " + (i === 0 ? "slot-today" : i === 1 ? "slot-tomorrow" : "");
        el.textContent =
          d.toLocaleDateString("de-DE", {
            weekday: "short",
            day: "2-digit",
            month: "2-digit",
          }) +
          " · " +
          times[i] +
          " Uhr";

        box.appendChild(el);
      }
    };

    const updatePersonaBadge = () => {
      if (!currentPersona) {
        personaBadge.hidden = true;
        return;
      }
      const map = {
        familie: "Familie",
        angestellt: "Angestellt",
        selbststaendig: "Selbstständig",
      };
      personaBadge.hidden = false;
      personaBadge.textContent = map[currentPersona] || currentPersona;
    };

    const showResult = () => {
      steps.forEach((s) => (s.hidden = true));
      const color = computeAmpel();

      // Ampel einfärben
      $$("[data-lamp]").forEach((l) => l.classList.remove("ampel--active"));
      $(`[data-lamp="${color}"]`).classList.add("ampel--active");

      resultNote.textContent = predictiveText(color);
      genSlots();
      updatePersonaBadge();

      resultCard.hidden = false;
      $("#quiz-result-title")?.focus();

      bar.style.width = "100%";
      bar.setAttribute("aria-valuenow", "100");
    };

    // STEP CLICK
    steps.forEach((stepEl, i) => {
      stepEl.addEventListener("click", (e) => {
        const btn = e.target.closest(".answer");
        if (!btn) return;

        const val = btn.getAttribute("data-value");
        answers[i] = val;

        soft && (soft.style.display = "none");

        // Letzter Schritt → Ergebnis
        if (i + 1 === steps.length) return showResult();

        // Weiter
        steps[i].hidden = true;
        steps[i + 1].hidden = false;
        current = i + 1;
        setProgress();
      });
    });

    // Nochmal starten
    $("#quiz-again")?.addEventListener("click", () => {
      steps.forEach((s, idx) => (s.hidden = idx !== 0));
      answers.length = 0;
      current = 0;
      setProgress();
      resultCard.hidden = true;
      soft && (soft.style.display = "");
      currentPersona = "";
      $("#persona-copy").textContent = "";
      $$(".persona-card").forEach((c) => c.classList.remove("is-active"));
      personaBadge.hidden = true;
    });

    setProgress();
  }

  /* -----------------------------------------------------------------------
    BOTTOM NAV HIGHLIGHT
  ----------------------------------------------------------------------- */
  function setupBottomNav() {
    const nav = $("#bottom-nav");
    if (!nav) return;

    const items = [
      ["#hero", nav.querySelector('a[href="#hero"]')],
      ["#quiz", nav.querySelector('a[href="#quiz"]')],
      ["#referral", nav.querySelector('a[href="#referral"]')],
      ["#termin", nav.querySelector('a[href="#termin"]')],
    ].filter(([id, link]) => document.querySelector(id) && link);

    const io = new IntersectionObserver(
      (ents) => {
        ents.forEach((e) => {
          if (!e.isIntersecting) return;
          items.forEach(([, link]) => link.classList.remove("is-active"));
          const target = items.find(([id]) => "#" + e.target.id === id);
          target && target[1].classList.add("is-active");
        });
      },
      { threshold: 0.5 }
    );

    items.forEach(([id]) => io.observe(document.querySelector(id)));
  }

  /* -----------------------------------------------------------------------
    YEAR AUTO
  ----------------------------------------------------------------------- */
  function setupYear() {
    $$("[data-year]").forEach((e) => (e.textContent = new Date().getFullYear()));
  }

  /* -----------------------------------------------------------------------
    BOOTSTRAP
  ----------------------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    setupLoader();
    setupSmoothScroll();
    setupReveal();
    setupDecisionAnchor();
    setupStickyCTA();
    setupLiveFeeds();
    setupProofBars();
    setupPersonas();
    setupQuiz();
    setupBottomNav();
    setupYear();
  });
})();
