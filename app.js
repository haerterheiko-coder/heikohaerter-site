(()=>{

const $=(s,r=document)=>r.querySelector(s),
      $$=(s,r=document)=>[...r.querySelectorAll(s)];

document.documentElement.classList.remove("no-js");

/* ---------------- Loader ---------------- */
function loader(){
 const el=$("#micro-loader"); if(!el) return;
 const reduce=matchMedia("(prefers-reduced-motion:reduce)").matches;
 const hide=()=>el.classList.add("hide");
 reduce ? hide() : setTimeout(hide,500);
}

/* ---------------- Smooth Scroll ---------------- */
function smooth(){
 const go=e=>{
   const t=e.currentTarget,
         href=t.dataset.target||t.getAttribute("href");
   if(!href || !href.startsWith("#")) return;
   const trg=$(href); if(!trg) return;
   e.preventDefault();
   trg.scrollIntoView({ behavior:"smooth", block:"start" });
 };
 $$('a[href^="#"],[data-target^="#"],#hero-cta')
   .forEach(a=>a.addEventListener("click",go));
}

/* ---------------- Reveal ---------------- */
function reveal(){
 const io=new IntersectionObserver(entries=>{
   entries.forEach(e=>{
     if(e.isIntersecting) e.target.classList.add("visible");
   });
 },{ threshold:.15 });
 $$(".fade-up").forEach(el=>io.observe(el));
}

/* ---------------- Decision Anchor ---------------- */
function decision(){
 const el=$("#decision-anchor"); if(!el)return;

 let shown=false;
 const onScroll=()=>{
   if(!shown && scrollY>180){
     el.classList.add("show");
     shown=true;
     removeEventListener("scroll",onScroll);
   }
 };
 addEventListener("scroll",onScroll,{passive:true});

 const span=$("#micro-proof");
 const msgs=[
   "keine Vorbereitung notwendig",
   "dauert nur 2 Minuten",
   "du entscheidest – nichts wird verkauft"
 ];
 if(span){
   let i=0;
   const rot=setInterval(()=>{
     i=(i+1)%msgs.length;
     span.textContent=msgs[i];
   },4000);
   addEventListener("pagehide",()=>clearInterval(rot));
 }
}

/* ---------------- Sticky CTA ---------------- */
function sticky(){
 const cta=$("#sticky-cta"),
       hero=$("#hero"),
       quiz=$("#quiz");
 if(!cta || !hero) return;

 const show=s=>{
   cta.classList.toggle("show",s);
   cta.setAttribute("aria-hidden",s?"false":"true");
 };

 const heroObs=new IntersectionObserver(([e])=>{
   const s=!e.isIntersecting && scrollY>(document.body.scrollHeight*.3);
   show(s);
 },{ rootMargin:"-64px 0 0 0" });

 heroObs.observe(hero);

 if(quiz){
   const quizObs=new IntersectionObserver(([e])=>{
     if(e.isIntersecting) show(false);
   },{ threshold:.25 });
   quizObs.observe(quiz);
 }

 cta.addEventListener("click",()=>$("#quiz")?.scrollIntoView({behavior:"smooth"}));
}

/* ---------------- Live Feeds ---------------- */
function feed(id,items){
 const box=$(id); if(!box)return;

 let i=0, paused=false;
 box.textContent=items[0];

 const rot=setInterval(()=>{
   if(!paused){
     i=(i+1)%items.length;
     box.textContent=items[i];
   }
 },3500);

 ["mouseenter","focusin"].forEach(ev=>box.addEventListener(ev,()=>paused=true));
 ["mouseleave","focusout"].forEach(ev=>box.addEventListener(ev,()=>paused=false));

 addEventListener("pagehide",()=>clearInterval(rot));
}

function feeds(){
 feed("#live-feed",[
  "„Sandra (31) hat gerade ihre Ampel gemacht.“",
  "„Leon (27) spart 420 € im Jahr.“",
  "„Heute schon 18 Menschen Ruhe gewonnen.“"
 ]);
 feed("#referral-live-feed",[
  "„Clara (34) hat den Link weitergegeben.“",
  "„Tom (42) hat gerade gestartet – 2 Minuten.“",
  "„Ohne Druck, ohne Verkauf – einfach anfangen.“"
 ]);
}

/* ---------------- Proof Bars ---------------- */
function bars(){
 const io=new IntersectionObserver(entries=>{
   entries.forEach(e=>{
     if(!e.isIntersecting) return;
     const target=e.target,
           v=parseInt(target.dataset.value||"0",10),
           span=$("span",target);
     if(span) span.style.width=Math.min(100,Math.max(0,v))+"%";
   });
 },{ threshold:.35 });

 $$(".proof-bar").forEach(b=>io.observe(b));
}

/* ---------------- Personas ---------------- */
let persona="";

function personas(){
 const out=$("#persona-copy"),
       cards=$$(".persona-card");

 const set=btn=>{
   cards.forEach(c=>c.classList.remove("is-active"));
   btn.classList.add("is-active");
   persona=btn.dataset.key||"";
   out.textContent=(btn.dataset.headline||"")+" "+(btn.dataset.subheadline||"");
 };

 cards.forEach(c=>{
   c.addEventListener("click",()=>set(c));
   c.addEventListener("keydown",e=>{
     if(e.key===" "||e.key==="Enter"){
       e.preventDefault();
       set(c);
     }
   });
 });
}

/* ---------------- Quiz ---------------- */
function quiz(){
 const steps=$$("#quiz-steps .quiz-step");
 if(!steps.length) return;

 const bar=$("#quiz-progress-bar"),
       stepTxt=$("#quiz-step-text"),
       tick=$("#progress-tick"),
       soft=$("#soft-permission"),
       res=$("#quiz-result"),
       note=$("#quiz-summary-text"),
       badge=$("#persona-badge");

 const ans=[], labels=[
   "Los geht’s",
   "✓ 1 von 3 – gut dabei",
   "✓ 2 von 3 – fast geschafft",
   "✓ 3 von 3"
 ];
 let i=0;

 const upd=()=>{
   const pct=Math.round((i/steps.length)*100);
   bar.style.width=pct+"%";
   bar.ariaValueNow=pct;
   stepTxt.textContent=Math.min(i+1,steps.length);
   tick.textContent=labels[i] || labels[labels.length-1];
 };

 const ampel=()=>{
   const c={r:0,y:0,g:0};
   ans.forEach(v=>{
     if(v==="stabil") c.g++;
     else if(v==="unsicher"||v==="keineahnung") c.r++;
     else c.y++;
   });
   if(c.g>=2)return"gruen";
   if(c.r>=2)return"rot";
   return"gelb";
 };

 const auto=(idx,val)=>{
   if(idx!==2) return;
   const s1=ans[0], s2=ans[1];

   let key="";
   if(val!=="stabil") key=(s1==="stabil")?"angestellt":"familie";
   else if(s2==="stabil") key="selbststaendig";

   if(!key) return;

   const el=$(`.persona-card[data-key="${key}"]`);
   if(!el) return;

   $$(".persona-card").forEach(c=>c.classList.remove("is-active"));
   el.classList.add("is-active");
   persona=key;
   $("#persona-copy").textContent=el.dataset.headline+" "+el.dataset.subheadline;
 };

 const txt=color=>{
   const base={
    rot:["Erstmal Ordnung schaffen – ruhig & klar.","Kein Druck – Schritt für Schritt.","Wir sortieren Wichtiges zuerst.","Kleine Schritte – klare Reihenfolge."],
    gelb:["Schon gut – ein paar Schritte noch.","Fast da – 2–3 Stellschrauben.","Gut im Griff – clever priorisieren.","Einmal sauber durchgehen."],
    gruen:["Sehr stabil – nur Kleinigkeiten.","Top Basis – wir sichern ab.","Weiter so – Mini-Checks.","Feinschliff möglich."]
   };
   const per={
     familie:{rot:" Fokus: Familienalltag erleichtern.",gelb:" Mehr Ruhe ohne Papierkram.",gruen:" Familien-Themen bleiben entspannt."},
     angestellt:{rot:" Schnell Ordnung für den Arbeitsalltag.",gelb:" Klarheit für den Monat.",gruen:" Stabil weiter – Bestätigung."},
     selbststaendig:{rot:" Schwankungen abfedern.",gelb:" Liquidität & Risiko justieren.",gruen:" Reserve & Absicherung prüfen."},
     "":{rot:"",gelb:"",gruen:""}
   };
   const arr=base[color];
   const pick=arr[Math.random()*arr.length|0];
   return pick+(per[persona]?.[color]||"");
 };

 const paint=color=>{
  $$("[data-lamp]").forEach(l=>l.classList.remove("ampel--active"));
  const t=$(`[data-lamp="${color}"]`);
  if(t) t.classList.add("ampel--active");
 };

 const slots=()=>{
  const box=$("#slot-container");
  box.innerHTML="";
  const ts=["09:30","11:00","13:00","15:30","18:00"];
  for(let d=0;d<5;d++){
    const dt=new Date();
    dt.setDate(dt.getDate()+d);
    const el=document.createElement("div");
    el.className="slot "+(d===0?"slot-today":d===1?"slot-tomorrow":"");
    el.textContent=dt.toLocaleDateString("de-DE",{weekday:"short",day:"2-digit",month:"2-digit"})+" · "+ts[d%ts.length]+" Uhr";
    box.appendChild(el);
  }
 };

 const show=()=>{
  steps.forEach(s=>s.hidden=true);
  const col=ampel();
  paint(col);
  note.textContent=txt(col);
  slots();
  badge.hidden=!persona;
  if(!badge.hidden){
    badge.textContent={familie:"Familie",angestellt:"Angestellt",selbststaendig:"Selbstständig"}[persona];
  }
  res.hidden=false;

  bar.style.width="100%";
  bar.ariaValueNow="100";
  tick.textContent="✓ 3 von 3";
 };

 steps.forEach((st,idx)=>{
  st.addEventListener("click",e=>{
    const b=e.target.closest(".answer");
    if(!b) return;
    const v=b.dataset.value;
    ans[idx]=v;

    if(soft) soft.style.display="none";
    auto(idx,v);

    if(idx<steps.length-1){
      steps[idx].hidden=true;
      steps[idx+1].hidden=false;
      i=idx+1;
      upd();
    }else{
      show();
    }
  });
 });

 $("#quiz-again")?.addEventListener("click",()=>{
  ans.length=0;
  persona="";
  badge.hidden=true;
  $("#persona-copy").textContent="";
  $$(".persona-card").forEach(c=>c.classList.remove("is-active"));
  if(soft) soft.style.display="";
  steps.forEach((s,x)=>s.hidden=x!==0);
  i=0;
  upd();
  res.hidden=true;
 });

 upd();
}

/* ---------------- Bottom Nav ---------------- */
function bottom(){
 const sections=[
  ["#hero",$('#bottom-nav a[href="#hero"]')],
  ["#quiz",$('#bottom-nav a[href="#quiz"]')],
  ["#referral",$('#bottom-nav a[href="#referral"]')],
  ["#termin",$('#bottom-nav a[href="#termin"]')]
 ].filter(s=>document.querySelector(s[0]) && s[1]);

 const io=new IntersectionObserver(entries=>{
   entries.forEach(e=>{
     if(e.isIntersecting){
       sections.forEach(s=>s[1].classList.remove("is-active"));
       const m=sections.find(s=>("#"+e.target.id)===s[0]);
       if(m) m[1].classList.add("is-active");
     }
   });
 },{threshold:.5});

 sections.forEach(s=>io.observe($(s[0])));
}

/* ---------------- Year ---------------- */
function year(){
 $$("[data-year]").forEach(n=>n.textContent=new Date().getFullYear());
}

/* ---------------- INIT ---------------- */
document.addEventListener("DOMContentLoaded",()=>{
 loader();
 smooth();
 reveal();
 decision();
 sticky();
 feeds();
 bars();
 personas();
 quiz();
 bottom();
 year();
});

})();
