/* ========================================================================
   File: /styles.css
   HEIKO HAERTER — 2026 UI SYSTEM (Refined)
   Mobile-first • Accessible • Performance-first
   ======================================================================== */
@layer tokens, base, components, utilities;

/* TOKENS */
@layer tokens {
  :root {
    /* Palette */
    --bg: #05070E;
    --bg-soft: #0A0F1E;
    --surface: rgba(255,255,255,0.045);
    --surface-soft: rgba(255,255,255,0.07);
    --text: #F7F8FC;
    --muted: #A9B2C6;
    --muted-soft: #8F97AA;
    --gold: #C8A44B;
    --gold-soft: #E9D394;
    --ok: #6BDB91;
    --warn: #FFBC2D;
    --danger: #FF5858;
    --focus: #90C2FF;

    /* Type scale */
    --fs-h1: clamp(2rem, 5.5vw, 3.25rem);
    --fs-h2: clamp(1.6rem, 3.5vw, 2.2rem);
    --fs-h3: clamp(1.12rem, 2.2vw, 1.35rem);
    --fs-body: clamp(1rem, 1.15vw, 1.08rem);
    --fs-micro: .92rem;

    /* Spacing (4/8/12/16/24/32) */
    --s-1: .25rem; /* 4 */
    --s-2: .5rem;  /* 8 */
    --s-3: .75rem; /* 12 */
    --s-4: 1rem;   /* 16 */
    --s-5: 1.5rem; /* 24 */
    --s-6: 2rem;   /* 32 */
    --section-y: clamp(40px, 8vw, 96px);

    /* Layout */
    --max-w: 1120px;
    --wrap-x: clamp(16px, 5vw, 32px);

    /* Radii */
    --r-xl: 34px;
    --r-lg: 24px;
    --r-md: 18px;
    --r-sm: 12px;

    /* Elevation */
    --elev-1: 0 18px 40px rgba(0,0,0,0.35);
    --elev-2: 0 30px 80px rgba(0,0,0,0.55);

    /* Motion */
    --ease: cubic-bezier(.22,.61,.36,1);

    /* Glows */
    --bg-glow-1: radial-gradient(circle at 12% -10%, rgba(200,164,75,0.22), transparent 55%);
    --bg-glow-2: radial-gradient(circle at 88% 12%, rgba(120,150,255,0.18), transparent 60%);

    color-scheme: dark;
  }
  @media (prefers-contrast: more) {
    :root { --surface: rgba(255,255,255,0.08); --surface-soft: rgba(255,255,255,0.12) }
  }
}

/* BASE */
@layer base {
  *,:before,:after { box-sizing: border-box }
  html, body {
    margin: 0; padding: 0; overflow-x: hidden;
    background: var(--bg); color: var(--text);
    font-family: -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",system-ui,sans-serif;
    line-height: 1.6; text-rendering: optimizeLegibility; -webkit-font-smoothing: antialiased;
  }
  img,picture,svg,video { display:block; max-width:100%; height:auto; content-visibility:auto; contain-intrinsic-size:1200px 800px }
  a { color: inherit; text-decoration: none }
  a:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible {
    outline: 3px solid var(--focus); outline-offset: 3px; border-radius: 8px;
  }
  ::selection { background: rgba(233,211,148,.25) }
  @media (prefers-reduced-motion: reduce) {
    * { animation: none !important; transition: none !important; scroll-behavior: auto !important }
  }
}

/* TYPOGRAPHY */
@layer components {
  .hh-h1 { font-size: var(--fs-h1); font-weight: 800; line-height: 1.12; margin: 0 0 1rem; letter-spacing: -.01em }
  .hh-h2 { font-size: var(--fs-h2); font-weight: 800; line-height: 1.2;  margin: 0 0 .9rem; letter-spacing: -.01em }
  h3     { font-size: var(--fs-h3); font-weight: 700; margin: 0 0 .6rem }
  p, li  { font-size: var(--fs-body); color: var(--muted) }
  .hh-micro,.hh-label { color: var(--muted-soft); font-size: var(--fs-micro); letter-spacing: .04em }
}

/* LAYOUT */
@layer components {
  .hh-container { width:100%; max-width: var(--max-w); margin-inline:auto; padding-inline: var(--wrap-x) }
  .hh-section   { padding-block: var(--section-y) }
  .hh-grid-auto { display:grid; gap: clamp(.8rem,2vw,1.4rem); grid-template-columns: repeat(auto-fit, minmax(min(100%,260px),1fr)) }
  .hh-grid-hero { display:grid; gap: clamp(1.2rem, 3vw, 2.4rem) }
  @media (min-width:1024px) { .hh-grid-hero { grid-template-columns: 1.1fr .9fr; align-items: center } }
  .hh-stack     { display:flex; flex-direction:column; gap: clamp(.6rem, 1.6vw, 1.2rem) }
  .hh-center    { text-align:center }
}

/* BUTTONS */
@layer components {
  .hh-btn {
    display:inline-flex; gap:.55rem; align-items:center; justify-content:center;
    min-height:48px; padding:.9rem 1.4rem; border-radius:999px; border:1px solid transparent;
    cursor:pointer; font-weight:800; background:rgba(255,255,255,0.06); color:var(--text);
    transition: transform .18s var(--ease), box-shadow .18s var(--ease), filter .18s var(--ease);
    position:relative; isolation:isolate; -webkit-tap-highlight-color: transparent;
  }
  .hh-btn:hover  { transform: translateY(-2px) }
  .hh-btn:active { transform: translateY(0) scale(.98) }
  .hh-btn-primary { background: linear-gradient(135deg, var(--gold), var(--gold-soft)); color:#111; box-shadow: 0 12px 28px rgba(200,164,75,0.35) }
  .hh-btn-primary:hover { box-shadow: 0 18px 40px rgba(200,164,75,0.45); filter: brightness(1.06) }
  .hh-btn-ghost { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.16) }
  @media (max-width:768px){ .hh-btn,.hh-btn-primary,.hh-btn-ghost { width:100% } }
}

/* CARDS */
@layer components {
  .hh-card { background: var(--surface); border: 1px solid rgba(255,255,255,0.12); border-radius: var(--r-md); padding: 1rem 1.2rem; box-shadow: var(--elev-1); transition: transform .18s var(--ease), box-shadow .18s var(--ease) }
  .hh-card:hover { transform: translateY(-4px); box-shadow: 0 22px 48px rgba(0,0,0,0.55) }
  .hh-benefit { background: rgba(255,255,255,0.08) }
  .hh-zero { border: 1px dashed rgba(233,211,148,0.45); background: rgba(233,211,148,0.08) }
}

/* MEDIA */
@layer components {
  .hh-hero-image img { width: 100%; border-radius: var(--r-lg); box-shadow: var(--elev-2); background: var(--bg-soft); aspect-ratio: 4/3; object-fit: cover }
}

/* FOOTER */
@layer components {
  .hh-footer { padding: 2rem 0; border-top: 1px solid rgba(255,255,255,0.1); text-align: center; background: rgba(5,8,22,0.95) }
  .hh-footer a { text-decoration: underline }
}

/* SHARE */
@layer components {
  .hh-share-box { display:grid; gap:.8rem; background: var(--surface); border:1px solid rgba(255,255,255,0.12); border-radius: var(--r-md); padding: 1rem 1.2rem }
  .hh-share-seg { display:flex; flex-wrap:wrap; gap:.5rem }
  .hh-share-seg-btn { padding:.5rem .9rem; border-radius:999px; border:1px solid rgba(255,255,255,0.16); background: rgba(255,255,255,0.04); color:var(--text); cursor:pointer; transition: transform .15s var(--ease), background .15s var(--ease) }
  .hh-share-seg-btn[aria-pressed="true"] { background: rgba(233,211,148,0.12); border-color: rgba(233,211,148,0.45) }
  #shareText { width:100%; min-height:110px; background: var(--surface-soft); color: var(--text); border:1px solid rgba(255,255,255,0.16); border-radius: var(--r-sm); padding:.8rem 1rem; resize:vertical }
  .hh-share-preview { padding:.9rem 1rem; border-radius: var(--r-sm); background: rgba(255,255,255,0.05); border:1px dashed rgba(255,255,255,0.16); min-height:56px }
}

/* PROOF */
@layer components {
  .trust { display:grid; gap:.8rem; grid-template-columns: repeat(auto-fit, minmax(220px,1fr)) }
  .trust .item { background: rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius: var(--r-md); padding:.9rem 1rem }
  .proof-quotes { display:grid; gap:.8rem; grid-template-columns: repeat(auto-fit, minmax(260px,1fr)) }
  .quote { background: rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.12); border-radius: var(--r-md); padding: 1rem 1.2rem }
}

/* PROGRESS & STEPS */
@layer components {
  .hh-progress { width:100%; background: rgba(255,255,255,0.08); border-radius:99px; height:10px; overflow:hidden; border:1px solid rgba(255,255,255,0.12) }
  .hh-progress-fill { background: linear-gradient(90deg, var(--gold), var(--gold-soft)); height:100%; width:0%; border-radius:99px; transition: width .35s var(--ease) }
  .hh-step { display:none; background: var(--surface); padding: 1.1rem 1.2rem; border-radius: var(--r-md); border:1px solid rgba(255,255,255,0.12) }
  .hh-step.active { display:block }
  .hh-ampel { display:flex; flex-direction:column; gap:1rem }
  .hh-ampel-item { padding:1rem 1.2rem; border-radius: var(--r-md); border:1px solid rgba(255,255,255,0.15); display:flex; align-items:flex-start; gap:.8rem; font-size:1.05rem; background: var(--surface) }
  .hh-ampel-item.now   { background: rgba(255,88,88,0.12);  border-color: rgba(255,88,88,0.35) }
  .hh-ampel-item.next  { background: rgba(255,188,45,0.12); border-color: rgba(255,188,45,0.35) }
  .hh-ampel-item.later { background: rgba(108,255,108,0.12); border-color: rgba(108,255,108,0.28) }
}

/* FAQ */
@layer components {
  .faq { display:grid; gap:.8rem }
  .faq details { background: var(--surface); border:1px solid rgba(255,255,255,0.12); border-radius: var(--r-md); padding:.6rem .9rem }
  .faq summary { cursor:pointer; font-weight:700; outline:none }
  .faq p { margin:.4rem 0 0 }
}

/* ANIMATIONS */
@layer components {
  .fade-up { opacity:0; transform: translateY(18px) }
  .fade-up.visible { opacity:1; transform:none; transition: opacity .55s var(--ease), transform .55s var(--ease) }
  @supports (animation-timeline: view()) {
    @media (prefers-reduced-motion: no-preference) {
      .fade-up { view-timeline-name: --fade; view-timeline-axis: block; animation-timeline: --fade; animation-name: fadeUp; animation-range: entry 10% cover 40%; animation-fill-mode: both }
      @keyframes fadeUp { from { opacity:0; transform: translateY(28px) } to { opacity:1; transform: translateY(0) } }
    }
  }
}

/* STICKY CTA */
@layer components {
  .sticky-cta { position:fixed; left:0; right:0; bottom:14px; display:none; justify-content:center; padding-bottom: calc(env(safe-area-inset-bottom) + 6px); z-index:90; transform: translateY(100%); opacity:0; transition: opacity .25s var(--ease), transform .25s var(--ease) }
  @media (max-width:979px){ .sticky-cta { display:flex } }
  .sticky-cta .inner { background: rgba(5,8,22,.88); border:1px solid rgba(255,255,255,.08); padding:.55rem; border-radius:999px; box-shadow: var(--elev-1) }
  .sticky-cta.show { transform: translateY(0); opacity:1 }
}

/* UTILITIES */
@layer utilities {
  html { scroll-behavior:smooth }
  .hh-accelerate,.fade-up,.hh-btn,.hh-card,.hh-hero-image img { will-change: transform, opacity; transform: translateZ(0) }
  a,button { touch-action: manipulation; -webkit-tap-highlight-color: transparent }
  .hh-bg { position:relative }
  .hh-bg::before,.hh-bg::after { content:""; position:absolute; inset:0; pointer-events:none; z-index:-1 }
  .hh-bg::before { background: var(--bg-glow-1) }
  .hh-bg::after  { background: var(--bg-glow-2) }
}

/* MICRO (subtle) */
@layer utilities {
  .hh-btn:hover { transform: translateY(-3px) scale(1.02) }
  .hh-btn-primary:hover { filter: brightness(1.08) }
  .hh-ripple { position:absolute; width:18px; height:18px; background: rgba(255,255,255,0.28); border-radius:50%; transform: translate(-50%,-50%); animation: hhRipple .45s ease-out forwards; pointer-events:none; inset:0 }
  @keyframes hhRipple { to { opacity:0; transform: translate(-50%,-50%) scale(8) } }
}

/* SAFE AREAS */
@layer components { @supports(padding:max(0px)) { body { padding-bottom: max(env(safe-area-inset-bottom), 0px) } } }

/* WIX FIX */
@layer utilities { [data-mesh-id],[data-mesh-id] * { transform:none!important } [data-mesh-id] { max-width:none!important; width:100%!important } }
