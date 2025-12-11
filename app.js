/* ============================================================
   GODMODE APP.JS — 2K26 Conversion Engine
   Funktionen:
   - TikTok Rotator
   - Fade-Up Scroll Engine
   - Sticky CTA
   - Whisper CTA (Trust Activity)
   - Live Metrics
   - Slot Availability
   - Preview Toggle
   - Social Proof Loader
   - Kurzmodus
   - Kapitel-Marker Engine
   - Ampel-Check (3 Fragen)
   - Referral Composer
============================================================ */


/* ============================================================
   1 — UTILS
============================================================ */

const qs = (s) => document.querySelector(s);
const qsa = (s) => [...document.querySelectorAll(s)];

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;


/* ============================================================
   2 — ROTIERENDER TIKTOK-HOOK
============================================================ */

(function rotatingHook() {
  const el = qs("#rotatingHook");
  if (!el) return;

  const hooks = [
    "2 Minuten. 3 Fragen. Deine Ampel.",
    "Sofort sehen, was heute wichtig ist.",
    "Ein kurzer Blick bringt Ruhe.",
    "Ganz ohne Unterlagen. Ohne Druck.",
    "Heute: ein ruhiger Überblick."
  ];

  let idx = 0;

  const rotate = () => {
    idx = (idx + 1) % hooks.length;
    el.style.opacity = 0;
    setTimeout(() => {
      el.textContent = hooks[idx];
      el.style.opacity = 1;
    }, 250);
  };

  el.textContent = hooks[0];
  setInterval(rotate, 2600);
})();


/* ============================================================
   3 — FADE-UP SCROLL ENGINE
============================================================ */

(function fadeUpEngine() {
  const els = qsa(".fade-up");
  if (!("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("visible"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  els.forEach((el) => io.observe(el));
})();


/* ============================================================
   4 — STICKY CTA (Mobile)
============================================================ */

(function stickyCTA() {
  const el = qs("#stickyCTA");
  if (!el) return;

  if (window.innerWidth >= 900) return; // nur Mobile

  const show = () => {
    el.style.opacity = 1;
    el.style.transform = "translateY(0)";
  };

  const hide = () => {
    el.style.opacity = 0;
    el.style.transform = "translateY(20px)";
  };

  let lastY = 0;
  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    if (y > 320) show();
    else hide();
    lastY = y;
  });
})();


/* ============================================================
   5 — WHISPER CTA (Live Activity)
============================================================ */

(function whisperCTA() {
  const el = qs("#whisper");
  if (!el) return;

  const messages = [
    "🟢 Vor 3 Minuten: Jemand hat den 2-Minuten-Check gemacht.",
    "🟡 Heute nutzen bereits 12 Menschen die Ampel.",
    "🟢 Jemand hat gerade seine Ampel gesehen.",
    "🟡 Heute: schon 8 Checks gestartet.",
    "🟢 Vor kurzem: Ruhe gefunden in 2 Minuten."
  ];

  const show = () => {
    el.textContent = messages[rand(0, messages.length - 1)];
    el.style.opacity = 1;
    el.style.transform = "translateY(0)";
    setTimeout(() => {
      el.style.opacity = 0;
      el.style.transform = "translateY(12px)";
    }, 6500);
  };

  setTimeout(show, 3500);
  setInterval(show, rand(15000, 24000));
})();


/* ============================================================
   6 — LIVE METRICS (Today, Last Used, Week)
============================================================ */

(function liveMetrics() {
  const todayEl = qs("#metricToday");
  const lastUsedEl = qs("#metricLastUsed");
  const weekEl = qs("#metricWeek");

  if (!todayEl || !lastUsedEl || !weekEl) return;

  const today = rand(8, 25);
  const lastMinutes = rand(2, 17);
  const week = rand(42, 110);

  todayEl.textContent = `Heute: ${today} Checks`;
  lastUsedEl.textContent = `Zuletzt genutzt: vor ${lastMinutes} Minuten`;
  weekEl.textContent = `Diese Woche: ${week} Menschen`;
})();


/* ============================================================
   7 — SLOT AVAILABILITY
============================================================ */

(function slotAvailability() {
  const monthEl = qs("#slotMonth");
  const countEl = qs("#slotCount");
  if (!monthEl || !countEl) return;

  const months = [
    "Januar", "Februar", "März", "April", "Mai",
    "Juni", "Juli", "August", "September",
    "Oktober", "November", "Dezember"
  ];

  const now = new Date();
  monthEl.textContent = months[now.getMonth()];
  countEl.textContent = rand(4, 13);
})();


/* ============================================================
   8 — PREVIEW TOGGLE (Ampel Beispiele)
============================================================ */

(function previewToggle() {
  const btn = qs("#previewToggle");
  const box = qs("#heroPreview");
  if (!btn || !box) return;

  btn.addEventListener("click", () => {
    const isHidden = box.hasAttribute("hidden");
    if (isHidden) box.removeAttribute("hidden");
    else box.setAttribute("hidden", "");
  });
})();


/* ============================================================
   9 — SOCIAL PROOF LOADER (Dynamisch über data.json)
============================================================ */

(async function loadTestimonials() {
  const mount = qs("#testimonialMount");
  if (!mount) return;

  try {
    const res = await fetch("/data.json");
    const data = await res.json();

    mount.innerHTML = data.testimonials
      .map(
        (t) => `
        <div class="card">
          <p><strong>${t.avatar}</strong></p>
          <p>${t.text}</p>
        </div>
      `
      )
      .join("");
  } catch (e) {
    mount.innerHTML = "<p class='hero-micro'>Noch keine Erfahrungsberichte.</p>";
  }
})();


/* ============================================================
   10 — KURZMODUS
============================================================ */

(function kurzmodus() {
  const btn = qs("#modeToggle");
  if (!btn) return;

  // Alles außer hero + ampel-check + about + weitergeben entfernen
  const keep = ["hero", "ampel-check", "about", "weitergeben"];

  const allSections = qsa("main > section");

  const toggle = () => {
    const active = btn.dataset.active === "true";
    btn.dataset.active = String(!active);

    if (!active) {
      btn.textContent = "Vollmodus";
      allSections.forEach((s) => {
        if (!keep.includes(s.id)) s.style.display = "none";
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      btn.textContent = "Kurzmodus";
      allSections.forEach((s) => (s.style.display = ""));
    }
  };

  btn.addEventListener("click", toggle);
})();


/* ============================================================
   11 — KAPITELMARKER (Netflix Scrollytelling)
============================================================ */

(function chapterMarker() {
  const marker = qs(".chapter-marker");
  const sections = qsa("section[data-chapter]");

  if (!marker || sections.length === 0) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const num = e.target.dataset.chapter;
          const title = e.target.querySelector("h2")?.textContent || "";
          marker.textContent = `Kapitel ${num} · ${title}`;
        }
      });
    },
    { threshold: 0.3 }
  );

  sections.forEach((sec) => io.observe(sec));
})();


/* ============================================================
   12 — AMPEL-CHECK ENGINE
============================================================ */

(function ampelCheck() {
  const mount = qs("#checkMount");
  if (!mount) return;

  // Step Templates
  const steps = [
    {
      q: "Wenn du 6 Monate ausfallen würdest – wie sicher wäre euer Einkommen?",
      a: [
        { v: 1, t: "Wir hätten ein echtes Problem" },
        { v: 2, t: "Wir würden klarkommen, aber es wäre eng" },
        { v: 3, t: "Wir wären stabil abgesichert" }
      ]
    },
    {
      q: "Wie gut findest du wichtige Unterlagen, wenn du sie brauchst?",
      a: [
        { v: 1, t: "Ich suche lange / finde nichts" },
        { v: 2, t: "Finde das Meiste direkt" },
        { v: 3, t: "Finde alles sofort" }
      ]
    },
    {
      q: "Wie wohl fühlst du dich beim Thema Zukunft & Alter?",
      a: [
        { v: 1, t: "Gar nicht / unsicher" },
        { v: 2, t: "Teilweise – nicht sicher" },
        { v: 3, t: "Fühlt sich gut an" }
      ]
    }
  ];

  let step = 0;
  let score = 0;

  const renderStep = () => {
    const s = steps[step];
    mount.innerHTML = `
      <div class="card">
        <h3>${s.q}</h3>
        <div class="stack">
          ${s.a
            .map(
              (a) =>
                `<button class="btn small" data-value="${a.v}">${a.t}</button>`
            )
            .join("")}
        </div>
      </div>
    `;

    mount.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        score += Number(btn.dataset.value);
        step++;
        if (step < steps.length) renderStep();
        else renderResult();
      });
    });
  };

  const renderResult = () => {
    let color = "green";
    let title = "🟢 Passt für heute";
    let text = "Für heute wirkt alles entspannt.";

    if (score <= 4) {
      color = "red";
      title = "🔴 Heute wichtig";
      text = "Mindestens ein Bereich braucht heute deine Aufmerksamkeit.";
    } else if (score <= 7) {
      color = "yellow";
      title = "🟡 Bald wichtig";
      text = "Ein paar Dinge stehen bald an.";
    }

    mount.innerHTML = `
      <div class="card result-${color}">
        <h3>${title}</h3>
        <p>${text}</p>

        <div class="stack" style="text-align:center">
          ${
            color === "red"
              ? `<a class="btn btn-primary" href="https://wa.me/4917660408380?text=Kurze%20Frage">💬 Kurz sprechen – 10 Minuten</a>`
              : color === "yellow"
              ? `<a class="btn btn-primary" href="https://wa.me/4917660408380?text=Als%20Nächstes">🧭 Als Nächstes angehen</a>`
              : `<a class="btn btn-primary" href="#weitergeben">✨ Weitergeben</a>`
          }
        </div>

        <p class="hero-micro" style="margin-top:12px;">
          Wenn dir die Ampel nichts bringt → 25 €.
        </p>
      </div>
    `;
  };

  renderStep();
})();


/* ============================================================
   13 — REFERRAL COMPOSER
============================================================ */

(function referralComposer() {
  const nameEl = qs("#refName");
  const textArea = qs("#refText");
  const waBtn = qs("#waShare");
  const mailBtn = qs("#mailShare");
  const preview = qs("#waPreviewText");

  if (!nameEl || !textArea || !waBtn) return;

  const baseURL = "https://heikohaerter.com";

  const buildURL = () => {
    const url = new URL(baseURL);
    url.searchParams.set("utm_source", "share");
    url.searchParams.set("utm_medium", "ref");
    url.searchParams.set("utm_campaign", "ampel");
    return url.toString();
  };

  const loadVariant = (seg) => {
    const variants = JSON.parse(textArea.dataset.variants);
    const pool = variants[seg] || variants["neutral"];
    const tmpl = pool[rand(0, pool.length - 1)];
    textArea.value = tmpl.replace(/{{URL}}/g, buildURL());
    updatePreview();
  };

  const updatePreview = () => {
    const txt = textArea.value.trim();
    preview.textContent = txt;
    waBtn.href = `https://wa.me/?text=${encodeURIComponent(txt)}`;
    mailBtn.href = `mailto:?subject=Kurzer%20Blick&body=${encodeURIComponent(txt)}`;
  };

  // Default variant
  loadVariant("neutral");

  qsa(".seg-btn").forEach((btn) => {
    btn.addEventListener("click", () => loadVariant(btn.dataset.seg));
  });

  textArea.addEventListener("input", updatePreview);
  nameEl.addEventListener("input", updatePreview);

  qs("#copyBtn")?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(textArea.value.trim());
    } catch (e) {}
  });

  qs("#magicLine")?.addEventListener("click", () => {
    textArea.value =
      "Hey, hab das gerade gesehen – dachte sofort an dich.\n\n" +
      textArea.value;
    updatePreview();
  });

  qs("#addPersonal")?.addEventListener("click", () => {
    const name = nameEl.value.trim() || "Ich";
    textArea.value += `\n\n${name.split(" ")[0]}, dachte an dich, weil …`;
    updatePreview();
  });

  qs("#readyMsg")?.addEventListener("click", () => {
    updatePreview();
  });
})();
