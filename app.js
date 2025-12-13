(function(){
  document.documentElement.classList.remove("no-js");
  const y=document.getElementById("yNow"); if(y)y.textContent=new Date().getFullYear();

  const prefersReduced=matchMedia("(prefers-reduced-motion:reduce)").matches;

  // Fade-up
  const io=new IntersectionObserver(es=>{
    es.forEach(e=>{
      if(e.isIntersecting){
        e.target.classList.add("visible");
        io.unobserve(e.target);
      }
    });
  },{threshold:.4});
  document.querySelectorAll(".fade-up").forEach(el=>io.observe(el));

  // Kinetic words
  const swap=document.querySelector(".swap");
  if(swap&&!prefersReduced){
    let w=JSON.parse(swap.dataset.words||"[]"),i=0;
    setInterval(()=>{
      i=(i+1)%w.length;
      swap.textContent=w[i];
      swap.classList.remove("enter"); void swap.offsetWidth; swap.classList.add("enter");
    },2800);
  }

  // Gate reveal
  const btn=document.querySelector("[data-earn-ampel]");
  const gate=document.getElementById("b4");
  btn?.addEventListener("click",()=>{
    gate.removeAttribute("aria-hidden");
    gate.scrollIntoView({behavior:"smooth"});
  });

  // Simple check
  const steps=document.getElementById("check-steps");
  const result=document.getElementById("check-result");
  if(steps){
    const qs=[
      "Wie sicher fühlt sich euer Einkommen an?",
      "Wie schnell findest du Unterlagen?",
      "Wie fühlt sich Zukunft an?"
    ];
    let i=0;
    const render=()=>{
      steps.innerHTML=`<div class="card"><h3>${qs[i]}</h3>
        <div class="cta">
          <button class="btn btn-primary">Gut</button>
          <button class="btn">Unklar</button>
          <button class="btn">Belastend</button>
        </div></div>`;
      steps.querySelectorAll("button").forEach(b=>b.onclick=()=>{
        i++; i<qs.length?render():result.innerHTML="<div class='card'>Einordnung abgeschlossen.</div>";
      });
    };
    render();
  }
})();
