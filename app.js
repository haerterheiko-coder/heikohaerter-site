/* =========================================================
   HEIKO HAERTER – 2026 MASTER APP.JS
   Ultra-Stable Scripts · Wix Safe · Neuro-Optimized Patterns
   ========================================================= */

/* -----------------------------------------
   UTILITIES
----------------------------------------- */

const QS = (sel, p = document) => p.querySelector(sel);
const QSA = (sel, p = document) => [...p.querySelectorAll(sel)];

const safeLS = {
  get(key) {
    try { return localStorage.getItem(key); }
    catch (_) { return null; }
  },
  set(key, val) {
    try { localStorage.setItem(key, val); }
    catch (_) { }
  }
};

function randomId(len = 12) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  arr.forEach(x => out += chars[x % chars.length]);
  return out;
}

/* -----------------------------------------
   1) FADE-IN OBSERVER
----------------------------------------- */

(function setupFadeIn() {
  const els = QSA(".fade-up");
  if (!("IntersectionObserver" in window)) {
    els.forEach(e => e.classList.add("visible"));
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(ent => {
      if (ent.isIntersecting) {
        ent.target.classList.add("visible");
        io.unobserve(ent.target);
      }
    });
  }, { threshold: 0.12 });

  els.forEach(el => io.observe(el));
})();

/* -----------------------------------------
   2) STICKY CTA (mobile)
----------------------------------------- */

(function stickyCTA() {
  const cta = QS("#stickyCTA");
  const hero = QS("#hero");

  if (!cta || !hero) return;
  if (window.innerWidth >= 1024) return; // Desktop: off

  const show = (v) => {
    cta.style.transform = v ? "translateY(0)" : "translateY(120%)";
    cta.style.opacity = v ? "1" : "0";
  };

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([e]) => {
      show(!e.isIntersecting);
    }, { threshold: 0.05 }).observe(hero);
  } else {
    window.addEventListener("scroll", () => {
      show(window.scrollY > 450);
    }, { passive: true });
  }
})();

/* -----------------------------------------
   3) KURZMODUS (ADHS-SAFE MODE)
----------------------------------------- */

(function shortMode() {
  const btn = QS("#dfBtn");
  if (!btn) return;

  const keepIDs = ["hero", "final-cta", "stickyCTA", "share", "ampel-check"];
  const sections = QSA("main > section").filter(s => !keepIDs.includes(s.id));

  function set(on) {
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.textContent = on ? "✅ Kurzmodus aktiv" : "🔍 Kurzmodus";

    sections.forEach(sec => sec.style.display = on ? "none" : "");

    if (on) window.scrollTo({ top: 0, behavior: "smooth" });
  }

  btn.addEventListener("click", () => {
    const active = btn.getAttribute("aria-pressed") === "true";
    set(!active);
  });

  window.setKurzmodus = set; // global access
})();

/* -----------------------------------------
   4) 5-BEREICHE ICONS – MICRO-REWARD
----------------------------------------- */

(function areaGlow() {
  const wrap = QS("#areasIcons");
  if (!wrap) return;
  const items = QSA(".icon", wrap);

  if (!("IntersectionObserver" in window)) return;

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.boxShadow = "0 0 22px rgba(233,211,148,.28)";
        setTimeout(() => e.target.style.boxShadow = "none", 900);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.7 });

  items.forEach(i => io.observe(i));
})();

/* -----------------------------------------
   5) REFERRAL SHARE SYSTEM
   (Whatsapp • Copy • Email • Magic-Line)
----------------------------------------- */

(function shareEngine() {

  const refInput = QS("#refName");
  const textArea = QS("#refText");
  const waBtn = QS("#waShare");
  const mailBtn = QS("#mailShare");
  const copyBtn = QS("#copyBtn");
  const preview = QS("#waPreviewText");
  const readyBtn = QS("#readyMsg");
  const magicBtn = QS("#magicLine");
  const addPersonalBtn = QS("#addPersonal");

  const KEY = "hh_ref_rid_v1";

  function getRefId() {
    return safeLS.get(KEY) || (safeLS.set(KEY, randomId()), safeLS.get(KEY));
  }

  function sanitize(val) {
    return val ? val.replace(/[^a-z0-9]/gi, "").toLowerCase() : "";
  }

  function buildURL() {
    const url = new URL("https://heikohaerter.com");
    url.searchParams.set("utm_source", "weitergeben");
    url.searchParams.set("utm_medium", "share");
    url.searchParams.set("utm_campaign", "check");

    const rid = getRefId();
    url.searchParams.set("rid", rid);

    const alias = sanitize((refInput?.value || "").trim());
    if (alias) {
      url.searchParams.set("ref", `${alias}.${rid.slice(0, 5)}`);
    }

    return url.toString();
  }

  function detectSegment() {
    const raw = (refInput?.value || "").toLowerCase();
    if (/papa|mama|eltern|vater|mutter/.test(raw)) return "eltern";
    if (/chef|kolleg|team|büro/.test(raw)) return "kollegen";
    if (/freund|kumpel|buddy/.test(raw)) return "freunde";
    if (/selbständig|selbstständig|freelance/.test(raw)) return "selbst";
    if (/partner|ehefrau|ehemann/.test(raw)) return "partner";
    return "neutral";
  }

  function loadVariants() {
    try { return JSON.parse(textArea.dataset.variants); }
    catch (_) { return { neutral: [] }; }
  }

  function pick(seg) {
    const all = loadVariants();
    const pool = all[seg] || all.neutral || [];
    const i = Math.floor(Math.random() * pool.length);
    return pool[i] || "";
  }

  function fillTemplate(seg) {
    const tmpl = pick(seg || detectSegment());
    if (!tmpl) return;

    textArea.value = tmpl.replace(/{{URL}}/g, buildURL());
    updatePreview();
  }

  function plain() {
    return (textArea.value || "").replace(/\n+/g, " ").trim();
  }

  function ensureURL(t) {
    return /\bhttps?:\/\//.test(t) ? t : t + " " + buildURL();
  }

  function updatePreview() {
    const txt = ensureURL(plain());
    waBtn.href = "https://wa.me/?text=" + encodeURIComponent(txt);
    mailBtn.href =
      "mailto:?subject=" +
      encodeURIComponent("Kurzer Blick") +
      "&body=" +
      encodeURIComponent(txt);

    preview.textContent =
      txt.length <= 180 ? txt : txt.slice(0, txt.lastIndexOf(" ", 180)) + "…";
  }

  /* INIT */
  if (textArea && !textArea.value) fillTemplate("neutral");
  updatePreview();

  /* EVENTS */
  QSA("[data-seg]").forEach(b =>
    b.addEventListener("click", () => fillTemplate(b.dataset.seg))
  );

  refInput?.addEventListener("input", () => fillTemplate());

  textArea?.addEventListener("input", updatePreview);

  readyBtn?.addEventListener("click", () => {
    fillTemplate();
    const toast = document.createElement("div");
    toast.className = "whisper";
    toast.textContent = "Fertiger Text eingefügt ✔️";
    Object.assign(toast.style, {
      position: "fixed",
      left: "18px",
      bottom: "18px",
      background: "rgba(11,15,22,.92)",
      border: "1px solid rgba(255,255,255,.14)",
      padding: ".6rem .8rem",
      borderRadius: "14px",
      opacity: "0",
      transition: "opacity .25s, transform .25s",
      transform: "translateY(10px)",
      zIndex: "9999"
    });
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
    }, 10);
    setTimeout(() => toast.remove(), 2000);
  });

  magicBtn?.addEventListener("click", () => {
    const line = "Hey, hab das gerade gesehen – dachte sofort an dich.";
    const cur = (textArea.value || "").trim();
    textArea.value = cur ? line + "\n\n" + cur : line + "\n\n" + buildURL();
    updatePreview();
  });

  addPersonalBtn?.addEventListener("click", () => {
    const alias = (refInput?.value || "").trim() || "Hey";
    textArea.value += `\n\n${alias.split(" ")[0]}, dachte an dich, weil …`;
    updatePreview();
  });

  copyBtn?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(ensureURL(textArea.value));
    } catch (_) {
      textArea.select();
      document.execCommand("copy");
    }
  });
})();

/* -----------------------------------------
   6) AMPEL-CHECK ENGINE
----------------------------------------- */

(function ampelCheck() {
  let step = 1;
  let score = 0;
  const max = 3;

  const startScreen = QS("#check-start");
  const stepsWrap = QS("#check-steps");
  const resultBox = QS("#check-result");

  const stepLabel = QS("#stepLabel");
  const stepHint = QS("#stepHint");
  const progress = QS("#progressBar");

  const startBtn = QS("#startCheckBtn");
  const heroStart = QS("#startCheckHero");
  const finalStart = QS("#ctaFinal");
  const shortBtn = QS("#startShort");

  function updateHeader() {
    stepLabel.textContent = `Schritt ${Math.min(step, max)} von ${max}`;
    const pct = ((Math.min(step - 1, max - 1)) / (max - 1)) * 100;
    progress.style.width = (max === 1 ? 100 : pct) + "%";

    stepHint.textContent =
      step === 1 ? "Kurzer Eindruck reicht."
      : step === 2 ? "Fast geschafft."
      : "Letzter Klick.";
  }

  function showStep(n) {
    QSA("#check-steps .step").forEach(s => s.style.display = "none");
    const el = QS(`#check-steps .step[data-step="${n}"]`);
    if (el) {
      el.style.display = "block";
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    updateHeader();
  }

  function renderCTA(color) {
    const wa = "https://wa.me/4917660408380?text=";

    if (color === "red")
      return `
        <div class="hh-stack hh-center">
          <a href="${wa}Kurz%2010%20Minuten%20sprechen%20wegen%20meiner%20Ampel%20(Rot)"
             class="hh-btn hh-btn-primary">💬 10 Minuten sprechen – sofort Ruhe</a>
          <a href="${wa}Ich%20brauche%20einen%20kurzen%20Check%20(Rot)"
             class="hh-btn hh-btn-ghost">🛟 Kurzen Check anfragen</a>
        </div>`;

    if (color === "yellow")
      return `
        <div class="hh-stack hh-center">
          <a href="${wa}Was%20sollte%20ich%20als%20Nächstes%20regeln%3F%20(Gelb)"
             class="hh-btn hh-btn-primary">🧭 Als Nächstes entspannt regeln</a>
          <a href="${wa}Kurze%20Frage%20zu%20meinem%20Gelb-Ergebnis"
             class="hh-btn hh-btn-ghost">💬 Rückfrage senden</a>
        </div>`;

    return `
      <div class="hh-stack hh-center">
        <a href="${wa}Gibt%20es%20noch%20smarte%20Optimierungen%3F%20(Grün)"
           class="hh-btn hh-btn-primary">✨ Noch smarter machen?</a>
        <a href="#share" class="hh-btn hh-btn-ghost">🔗 Weitergeben</a>
      </div>`;
  }

  function finish() {
    stepsWrap.style.display = "none";
    resultBox.style.display = "block";

    let color = "green";
    let html = "";

    if (score <= 4) {
      color = "red";
      html = `
        <div class="result-card result-red">
          <h3>🔴 Deine Ampel: Jetzt</h3>
          <p>Mindestens ein Bereich ist heute wichtig – gut, dass du es siehst.</p>
          ${renderCTA("red")}
        </div>`;
    } else if (score <= 7) {
      color = "yellow";
      html = `
        <div class="result-card result-yellow">
          <h3>🟡 Deine Ampel: Als Nächstes</h3>
          <p>Ein paar Punkte brauchen Orientierung.</p>
          ${renderCTA("yellow")}
        </div>`;
    } else {
      html = `
        <div class="result-card result-green">
          <h3>🟢 Deine Ampel: Später</h3>
          <p>Die wichtigsten Punkte wirken stabil – ggf. Feinschliff.</p>
          ${renderCTA("green")}
        </div>`;
    }

    html += `<p class="hh-micro" style="margin-top:.8rem;opacity:.85">Wenn dir die Ampel nichts bringt → <strong>25 €</strong>.</p>`;

    resultBox.innerHTML = html;
    resultBox.scrollIntoView({ behavior: "smooth" });
  }

  function start() {
    startScreen.style.display = "none";
    stepsWrap.style.display = "block";
    resultBox.style.display = "none";

    score = 0;
    step = 1;

    showStep(step);
  }

  /* MAIN BUTTON EVENTS */
  startBtn?.addEventListener("click", start);
  heroStart?.addEventListener("click", (e) => { e.preventDefault(); start(); });
  finalStart?.addEventListener("click", (e) => { e.preventDefault(); start(); });

  /* SHORT MODE */
  shortBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    start();

    setTimeout(() => { score += 2; step = 2; showStep(step); }, 120);
    setTimeout(() => { score += 2; step = 3; showStep(step); }, 260);
  });

  /* STEP BUTTONS */
  QSA("#check-steps .step").forEach(stepEl => {
    QSA("button", stepEl).forEach(btn => {
      btn.addEventListener("click", () => {
        score += Number(btn.dataset.value) || 0;
        step++;
        if (step > max) finish();
        else showStep(step);
      });
    });
  });

})();
