    document.documentElement.classList.remove('no-js');
    document.querySelectorAll('#yearNow').forEach(el=> el.textContent=new Date().getFullYear());

    /* Fade-in */
    (function(){
      const pref=matchMedia('(prefers-reduced-motion: reduce)').matches;
      const els=[...document.querySelectorAll('.fade-up')];
      if(pref){els.forEach(el=>el.classList.add('visible'));return;}
      if('IntersectionObserver'in window){
        const io=new IntersectionObserver(ents=>ents.forEach(e=>{ if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target);} }),{threshold:.12,rootMargin:'0px 0px -10% 0px'});
        els.forEach(el=>io.observe(el));
      }else{els.forEach(el=>el.classList.add('visible'));}
    })();

    /* Sticky CTA – früher triggern (scrollY > 200) + Fallback, nur Mobile/Tablet */
    (function(){
      const el=document.getElementById('stickyCTA');
      const hero=document.querySelector('.hero');
      if(!el||!hero) return;
      if(innerWidth>=1024) return;
      const show=v=>{el.style.transform=v?'translateY(0)':'translateY(100%)';el.style.opacity=v?'1':'0'};
      if('IntersectionObserver'in window){
        const io=new IntersectionObserver(ents=>ents.forEach(e=>show(!e.isIntersecting)),{threshold:.35});
        io.observe(hero);
        addEventListener('scroll',()=>{ if(scrollY>200) show(true); },{passive:true}); // earlier trigger
      }else{
        addEventListener('scroll',()=>show(scrollY>200),{passive:true});
      }
    })();

    /* Kurzmodus (hide non-core slides) */
    (function(){
      const btn=document.getElementById('dfBtn');
      const keep=new Set(['hero','ethos-social','stickyCTA','share','ampel-check']);
      const nodes=[...document.querySelectorAll('main > section')].filter(s=>!keep.has(s.id));
      const set=(on)=>{
        btn.setAttribute('aria-pressed',on?'true':'false');
        btn.textContent=on?'✅ Kurzmodus aktiv':'🔍 Kurzmodus';
        nodes.forEach(n=>n.style.display=on?'none':'');
        if(on) window.scrollTo({top:0,behavior:'smooth'});
      };
      btn.addEventListener('click',()=>set(btn.getAttribute('aria-pressed')!=='true'));
      window.setKurzmodus=set;
    })();

    /* Ergebnis-Vorschau Toggle (Sekundär-CTA) */
    (function(){
      const btn=document.getElementById('previewToggle');
      const box=document.getElementById('heroPreview');
      if(btn && box){
        btn.addEventListener('click',()=>{ box.style.display=box.style.display==='none'?'grid':'none'; });
      }
    })();

    /* Share composer (bestehend) */
    (function(){
      const name = document.getElementById('refName');
      const area = document.getElementById('refText');
      const wa   = document.getElementById('waShare');
      const mail = document.getElementById('mailShare');
      const copy = document.getElementById('copyBtn');
      const preview = document.getElementById('waPreviewText');

      const KEY_REFID='hh_ref_rid_v1';
      function randomId(len=10){ const a='abcdefghijklmnopqrstuvwxyz0123456789'; const u=new Uint8Array(len); if(crypto.getRandomValues) crypto.getRandomValues(u); else for(let i=0;i<len;i++) u[i]=Math.random()*256; return Array.from(u,x=>a[x%a.length]).join(''); }
      function getRefId(){ try{ return localStorage.getItem(KEY_REFID) || (localStorage.setItem(KEY_REFID,randomId()), localStorage.getItem(KEY_REFID)); }catch(_){ return randomId(); } }
      function sanitize(n){ return n ? n.replace(/[^a-z0-9]/gi,'').toLowerCase() : ''; }

      function buildURL(){
        const base=new URL('https://heikohaerter.com');
        base.searchParams.set('utm_source','weitergeben');
        base.searchParams.set('utm_medium','share');
        base.searchParams.set('utm_campaign','check');
        const rid=getRefId(); base.searchParams.set('rid', rid);
        const alias=sanitize((name?.value||'').trim());
        if(alias) base.searchParams.set('ref', alias+'.'+rid.slice(0,5));
        return base.toString();
      }
      function variants(){ try{ return JSON.parse(area.getAttribute('data-variants')); }catch(_){ return {neutral:[]}; } }
      function detectSeg(){
        const raw=(name?.value||'').toLowerCase();
        if(/(papa|mama|vater|mutter|eltern)/.test(raw)) return 'eltern';
        if(/(chef|manager|kolleg|team|büro)/.test(raw)) return 'kollegen';
        if(/(freund|kumpel|bff|buddy|schatz)/.test(raw)) return 'freunde';
        if(/(selbständig|selbstständig|freelance|freiberuf)/.test(raw)) return 'selbst';
        if(/(partner|ehefrau|ehemann|verlobt)/.test(raw)) return 'partner';
        return 'neutral';
      }
      function pick(seg){ const sets=variants(); const pool=(sets[seg]||sets.neutral||[]); if(!pool.length) return ''; const i=Math.floor(Math.random()*pool.length); return pool[i]; }
      function ensureURL(text){ return /\bhttps?:\/\/\S+/i.test(text) ? text : (text.trim()+' '+buildURL()); }
      function setTextFrom(seg){ const tmpl=pick(seg||detectSeg()); if(!tmpl) return; area.value=tmpl.replace(/\{\{URL\}\}/g, buildURL()); updateLinks(); }
      function plain(){ return (area.value||'').replace(/\n+/g,' ').trim(); }
      function updateLinks(){
        const t=ensureURL(plain());
        wa.href='https://wa.me/?text='+encodeURIComponent(t);
        mail.href='mailto:?subject='+encodeURIComponent('Kurzer Blick')+'&body='+encodeURIComponent(t);
        preview.textContent = t.length<=190 ? t : t.substring(0,t.lastIndexOf(' ',190))+'…';
      }

      if(area && !area.value){ setTextFrom('neutral'); } updateLinks();

      document.querySelectorAll('[data-seg]').forEach(b=> b.addEventListener('click', ()=> setTextFrom(b.getAttribute('data-seg')) ));
      name?.addEventListener('input', ()=> setTextFrom() );
      area?.addEventListener('input', updateLinks );

      document.getElementById('readyMsg')?.addEventListener('click', ()=>{
        setTextFrom();
        const toast=document.createElement('div');
        toast.textContent='Fertiger Text eingefügt ✔️';
        toast.className='whisper';
        toast.style.cssText=document.getElementById('whisper').style.cssText;
        document.body.appendChild(toast);
        setTimeout(()=>{ toast.style.opacity='1'; toast.style.transform='translateY(0)'; },10);
        setTimeout(()=>toast.remove(),2000);
      });
      document.getElementById('magicLine')?.addEventListener('click', ()=>{
        const line='Hey, hab das gerade gesehen – dachte sofort an dich.';
        const cur=(area.value||'').trim();
        area.value = cur ? line+'\n\n'+cur : line+'\n\n'+buildURL();
        updateLinks();
      });
      document.getElementById('addPersonal')?.addEventListener('click', ()=>{
        const alias=(name?.value||'').trim()||'Hey';
        area.value = (area.value||'') + `\n\n${alias.split(' ')[0]}, dachte an dich, weil …`;
        updateLinks();
      });
      document.getElementById('copyBtn')?.addEventListener('click', async ()=>{
        try{ await navigator.clipboard.writeText(ensureURL(area.value)); }catch(_){ area.select(); document.execCommand && document.execCommand('copy'); }
      });
      document.getElementById('nativeShare')?.addEventListener('click', async ()=>{
        const t=plain(); const url=buildURL();
        if(navigator.share){ try{ await navigator.share({title:'2-Minuten-Blick', text:t, url}); }catch(_){} }
      });
    })();

    /* Ampel-Check – Ergebnisse */
    (function() {
      let step=1, score=0;
      const max=3;
      const startBtn=document.getElementById('startCheckBtn');
      const stepsWrap=document.getElementById('check-steps');
      const resultBox=document.getElementById('check-result');
      const stepLabel=document.getElementById('stepLabel');
      const progress=document.getElementById('progressBar');
      const stepHint=document.getElementById('stepHint');

      function updateHead(){
        stepLabel.textContent=`Schritt ${Math.min(step,max)} von ${max}`;
        const pct = ((Math.min(step-1,max-1))/(max-1))*100;
        progress.style.width = (max===1?100:pct)+'%';
        stepHint.textContent= step===1?'Kurzer Eindruck reicht.': step===2?'Fast geschafft.':'Letzter Klick.';
      }
      function showStep(n){
        document.querySelectorAll('#check-steps .step').forEach(s=>s.style.display='none');
        const t=document.querySelector(`#check-steps .step[data-step="${n}"]`);
        if(t){ t.style.display='block'; t.scrollIntoView({behavior:'smooth',block:'start'}); }
        updateHead();
      }

      function renderCTA(color){
        const wa='https://wa.me/4917660408380?text=';
        if(color==='red') return `<div class="stack" style="text-align:center">
          <a href="${wa}Kurz%2010%20Minuten%20sprechen" class="btn btn-primary">💬 Kurz sprechen – 10 Minuten</a>
          <a href="${wa}Kurze%20Frage%20senden" class="btn btn-ghost">🛟 Frage senden</a></div>`;
        if(color==='yellow') return `<div class="stack" style="text-align:center">
          <a href="${wa}Als%20N%C3%A4chstes%20angehen" class="btn btn-primary">🧭 Als Nächstes angehen</a>
          <a href="${wa}Kurze%20Frage%20senden" class="btn btn-ghost">💬 Frage senden</a></div>`;
        return `<div class="stack" style="text-align:center">
          <a href="${wa}Smarter%20machen%3F" class="btn btn-primary">✨ Smarter machen?</a>
          <a href="#share" class="btn btn-ghost">🔗 Weitergeben</a></div>`;
      }
      function finish(){
        stepsWrap.style.display='none';
        resultBox.style.display='block';
        let html='';
        if(score<=4){
          html=`<div class="result-card result-red">
            <h3>🔴 Heute wichtig</h3>
            <p>Mindestens ein Bereich braucht heute deine Aufmerksamkeit.</p>
            ${renderCTA('red')}
          </div>`;
        } else if(score<=7){
          html=`<div class="result-card result-yellow">
            <h3>🟡 Bald wichtig</h3>
            <p>Ein paar Dinge stehen bald an.</p>
            ${renderCTA('yellow')}
          </div>`;
        } else {
          html=`<div class="result-card result-green">
            <h3>🟢 Passt für heute</h3>
            <p>Für heute wirkt alles entspannt.</p>
            ${renderCTA('green')}
          </div>`;
        }
        html+=`<p class="hero-micro" style="margin-top:.8rem;opacity:.85">Wenn dir die Ampel nichts bringt → <strong>25 €</strong>.</p>`;
        resultBox.innerHTML=html;
        resultBox.scrollIntoView({behavior:'smooth',block:'start'});
      }
      function start(){
        document.getElementById('check-start').style.display='none';
        stepsWrap.style.display='block';
        resultBox.style.display='none';
        step=1; score=0; showStep(step);
      }

      document.getElementById('startCheckHero')?.addEventListener('click',e=>{ e.preventDefault(); start(); });
      document.getElementById('ctaFinal')?.addEventListener('click',e=>{ e.preventDefault(); start(); });
      startBtn?.addEventListener('click',start);

      document.getElementById('startShort')?.addEventListener('click',e=>{
        e.preventDefault(); start();
        setTimeout(()=>{ score+=2; step=2; showStep(step); },150);
        setTimeout(()=>{ score+=2; step=3; showStep(step); },350);
      });

      document.querySelectorAll('#check-steps .step').forEach(s=>{
        s.querySelectorAll('button').forEach(btn=>{
          btn.addEventListener('click', ()=>{
            score += Number(btn.getAttribute('data-value'))||0;
            step++;
            if(step>3) finish(); else showStep(step);
          });
        });
      });
    })();
