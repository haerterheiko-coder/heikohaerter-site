// ============================================================
// GODMODE 2026 – APP.JS (FINAL VERSION)
// HeikoHaerter.com · Calm Motion · Premium UX · Max Conversion
// ============================================================


// 0) BOOTSTRAP
document.documentElement.classList.remove("no-js");
document.querySelectorAll("#yearNow").forEach(
  el => (el.textContent = new Date().getFullYear())
);


// 1) ROTIERENDE HERO MICRO-HOOKS
(() => {
  const el = document.querySelector(".hook-rotate");
  if (!el) return;

  const hooks = [
    "Ein Moment Ruhe – bevor der Alltag weiterläuft.",
    "Wenn du manchmal hoffst, nichts Wichtiges zu übersehen …",
    "2 Minuten. 3 Fragen. Deine Ampel.",
    "Ein kurzer Blick – bevor der Tag weitergeht.",
    "Mehr Ruhe. Weniger Druck. In 2 Minuten."
  ];

  let i = 0;
  el.style.transition = "opacity .45s ease";

  setInterval(() => {
    el.style.opacity = 0;
    setTimeout(() => {
      i = (i + 1) % hooks.length;
      el.textContent = hooks[i];
      el.style.opacity = 1;
    }, 360);
  }, 3800);
})();


// 2) FADE-UP OBSERVER
(() => {
  const els = [...document.querySelectorAll(".fade-up")];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduce || !("IntersectionObserver" in window)) {
    return els.forEach(el => el.classList.add("visible"));
  }

  const io = new IntersectionObserver(
    entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
  );

  els.forEach(el => io.observe(el));
})();


// 3) SMOOTH SCROLLING
document.querySelectorAll("a[href^='#']").forEach(link => {
  link.addEventListener("click", e => {
    const t = document.querySelector(link.getAttribute("href"));
    if (!t) return;
    e.preventDefault();
    t.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});


// 4) STICKY CTA (Mobile)
(() => {
  const el = document.getElementById("stickyCTA");
  const hero = document.querySelector(".hero");
  if (!el || !hero || innerWidth >= 1024) return;

  const toggle = v => {
    el.style.transform = v ? "translateY(0)" : "translateY(100%)";
    el.style.opacity = v ? "1" : "0";
  };

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      ents => ents.forEach(e => toggle(!e.isIntersecting)),
      { threshold: 0.35 }
    );
    io.observe(hero);
  }

  addEventListener(
    "scroll",
    () => {
      if (scrollY > 260) toggle(true);
    },
    { passive: true }
  );
})();


// 5) AMP-CHECK ENGINE (3 Schritte + Ergebnis)
(() => {
  let step = 1;
  let score = 0;
  const max = 3;

  const startBtns = [
    document.getElementById("startCheckBtn"),
    document.getElementById("startCheckHero"),
    document.getElementById("ctaFinal")
  ].filter(Boolean);

  const startBlock = document.getElementById("check-start");
  const wrap = document.getElementById("check-steps");
  const result = document.getElementById("check-result");

  const bar = document.getElementById("progressBar");
  const label = document.getElementById("stepLabel");
  const hint = document.getElementById("stepHint");

  const answers = [...document.querySelectorAll("#check-steps .answer")];

  function update() {
    label.textContent = `Schritt ${Math.min(step, max)} von ${max}`;
    bar.style.width = `${((step - 1) / (max - 1)) * 100}%`;

    hint.textContent =
      step === 1
        ? "Kurzer Eindruck reicht."
        : step === 2
        ? "Fast geschafft."
        : "Letzter Klick.";
  }

  function show(n) {
    document
      .querySelectorAll("#check-steps .step")
      .forEach(s => (s.style.display = "none"));

    const el = document.querySelector(`.step[data-step="${n}"]`);
    if (el) el.style.display = "block";

    update();
  }

  function CTA(color) {
    const wa = "https://wa.me/4917660408380?text=";

    return {
      red: `
        <div class="stack" style="text-align:center">
          <a href="${wa}Kurz%2010%20Minuten%20sprechen" class="btn btn-primary">💬 Kurz sprechen – 10 Minuten</a>
          <a href="${wa}Kurze%20Frage%20senden" class="btn btn-ghost">🛟 Frage senden</a>
        </div>`,
      yellow: `
        <div class="stack" style="text-align:center">
          <a href="${wa}Als%20N%C3%A4chstes%20angehen" class="btn btn-primary">🧭 Als Nächstes angehen</a>
          <a href="${wa}Kurze%20Frage%20senden" class="btn btn-ghost">💬 Frage senden</a>
        </div>`,
      green: `
        <div class="stack" style="text-align:center">
          <a href="${wa}Smarter%20machen%3F" class="btn btn-primary">✨ Smarter machen?</a>
          <a href="#share" class="btn btn-ghost">🔗 Weitergeben</a>
        </div>`
    }[color];
  }

  function finish() {
    wrap.style.display = "none";
    result.style.display = "block";

    let card = "";

    if (score <= 4) {
      card = `
        <div class="result-card result-red">
          <h3>🔴 Heute wichtig</h3>
          <p>Mindestens ein Bereich braucht heute deine Aufmerksamkeit.</p>
          ${CTA("red")}
        </div>`;
    } else if (score <= 7) {
      card = `
        <div class="result-card result-yellow">
          <h3>🟡 Bald wichtig</h3>
          <p>Ein paar Dinge stehen bald an.</p>
          ${CTA("yellow")}
        </div>`;
    } else {
      card = `
        <div class="result-card result-green">
          <h3>🟢 Passt für heute</h3>
          <p>Für heute wirkt alles entspannt.</p>
          ${CTA("green")}
        </div>`;
    }

    result.innerHTML =
      card +
      `<p class="hero-micro" style="opacity:.85;margin-top:.8rem">
        Wenn dir die Ampel nichts bringt → <strong>25 €</strong>.
      </p>`;

    result.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function start() {
    step = 1;
    score = 0;

    startBlock.style.display = "none";
    wrap.style.display = "block";
    result.style.display = "none";

    show(step);
  }

  startBtns.forEach(b =>
    b.addEventListener("click", e => {
      e.preventDefault();
      start();
    })
  );

  answers.forEach(btn =>
    btn.addEventListener("click", () => {
      score += Number(btn.dataset.value);
      step++;
      step > max ? finish() : show(step);
    })
  );

  document.getElementById("startShort")?.addEventListener("click", e => {
    e.preventDefault();
    start();
    setTimeout(() => {
      score += 2;
      step = 2;
      show(step);
    }, 140);
    setTimeout(() => {
      score += 2;
      step = 3;
      show(step);
    }, 330);
  });
})();


// 6) KURZMODUS – Hide non-core sections
(() => {
  const btn = document.getElementById("dfBtn");
  if (!btn) return;

  const keep = new Set([
    "hero",
    "ethos-social",
    "ampel-check",
    "share",
    "stickyCTA"
  ]);

  const sections = [...document.querySelectorAll("main > section")].filter(
    s => !keep.has(s.id)
  );

  const toggle = on => {
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.textContent = on ? "✅ Kurzmodus aktiv" : "🔍 Kurzmodus";
    sections.forEach(s => (s.style.display = on ? "none" : ""));
    if (on) scrollTo({ top: 0, behavior: "smooth" });
  };

  btn.addEventListener("click", () =>
    toggle(btn.getAttribute("aria-pressed") !== "true")
  );

  window.setKurzmodus = toggle;
})();


// 7) WHISPER – Micro Nudge
(() => {
  const w = document.getElementById("whisper");
  if (!w) return;
  setTimeout(() => w.classList.add("visible"), 4200);
  setTimeout(() => w.classList.remove("visible"), 11200);
})();


// 8) SHARE COMPOSER – Ref-ID + UTM + Segmente + Copy
(() => {
  const area = document.getElementById("refText");
  if (!area) return;

  const name = document.getElementById("refName");
  const preview = document.getElementById("waPreviewText");
  const wa = document.getElementById("waShare");
  const mail = document.getElementById("mailShare");
  const copyBtn = document.getElementById("copyBtn");
  const nativeShare = document.getElementById("nativeShare");

  const KEY = "hh_ref_rid_v1";

  const rand = len => {
    const a = "abcdefghijklmnopqrstuvwxyz0123456789";
    const buf = crypto.getRandomValues(new Uint8Array(len));
    return [...buf].map(x => a[x % a.length]).join("");
  };

  const getRefId = () => {
    try {
      return (
        localStorage.getItem(KEY) ||
        (localStorage.setItem(KEY, rand(10)), localStorage.getItem(KEY))
      );
    } catch (_) {
      return rand(10);
    }
  };

  const sanitize = v => v.replace(/[^a-z0-9]/gi, "").toLowerCase();

  const buildURL = () => {
    const u = new URL("https://heikohaerter.com");
    u.searchParams.set("utm_source", "weitergeben");
    u.searchParams.set("utm_medium", "share");
    u.searchParams.set("utm_campaign", "check");

    const rid = getRefId();
    u.searchParams.set("rid", rid);

    const alias = sanitize((name?.value || "").trim());
    if (alias) u.searchParams.set("ref", alias + "." + rid.slice(0, 5));

    return u.toString();
  };

  const ensureURL = txt =>
    /\bhttps?:\/\//i.test(txt) ? txt : txt + " " + buildURL();

  const update = () => {
    const raw = area.value.trim();
    const final = ensureURL(raw);

    const short =
      final.length < 190
        ? final
        : final.slice(0, final.lastIndexOf(" ", 190)) + "…";
