/* ==========================================================
   MORA ABONNER — page d'accueil (index.html)
   ========================================================== */

/* ---------- terminal ---------- */
function terminal(){
  const box = document.getElementById("term");
  const lines = [
    '<span class="c">$</span> mora-abonner --catalogue',
    '',
    '<span class="k">formations</span>   <span class="v">'+DATA.length+'</span>',
    '<span class="k">lesona</span>       <span class="v">'+TOT.v+'</span> <span class="c">video</span>',
    '<span class="k">faharetana</span>   <span class="v">'+hm(TOT.d)+'</span> <span class="c">(norefesina)</span>',
    '<span class="k">habe</span>         <span class="v">'+go(TOT.s)+'</span>',
    '',
    '<span class="c">$</span> ls --by-duration'
  ];
  [...DATA].sort((a,b)=>b.dur-a.dur).slice(0,5).forEach(f=>{
    const pad = f.titre.length>26 ? f.titre.slice(0,25)+"…" : f.titre.padEnd(26,".");
    lines.push('  '+pad+' <span class="v">'+hm(f.dur)+'</span>');
  });
  lines.push('','<span class="c">$</span> status','  <span class="v">VONONA</span> — 📩 Alefaso MP');
  if(matchMedia("(prefers-reduced-motion: reduce)").matches){ box.innerHTML=lines.join("\n"); return; }
  let i=0; const cur='<span class="cursor"></span>';
  (function step(){
    if(i>=lines.length){ box.innerHTML=lines.join("\n")+"\n"+cur; return; }
    box.innerHTML=lines.slice(0,i+1).join("\n")+cur;
    i++; setTimeout(step, lines[i-1]===""?100:150);
  })();
}

/* ---------- filtres + tri ---------- */
const THEMES=[["all","Rehetra"],["secu","Cybersécurité"],["dev","Développement"],["biz","Business"]];
let theme="all", sortMode="def";
const ORDER=DATA.map(f=>f.id);

function renderFilters(){
  const host=document.getElementById("filters"); host.innerHTML="";
  THEMES.forEach(([k,lab])=>{
    const n = k==="all" ? DATA.length : DATA.filter(f=>f.theme===k).length;
    const b=el("button","chip"+(theme===k?" on":""),`${lab} <span class="chip-n">${n}</span>`);
    b.onclick=()=>{ theme=k; renderFilters(); renderCards(); };
    host.appendChild(b);
  });
}

function renderCards(){
  const host=document.getElementById("fcards"); host.innerHTML="";
  let list=DATA.filter(f=>theme==="all"||f.theme===theme);
  if(sortMode==="dur") list=[...list].sort((a,b)=>b.dur-a.dur);
  else if(sortMode==="prix") list=[...list].sort((a,b)=>(a.prix||1e9)-(b.prix||1e9));
  else list=[...list].sort((a,b)=>ORDER.indexOf(a.id)-ORDER.indexOf(b.id));

  list.forEach(f=>{
    const c=el("article","fc rv");
    c.style.setProperty("--fa",f.acc);
    const prix=f.prix?ar(f.prix):"Sur demande";
    c.innerHTML=`
      <div class="fc-top">
        <span class="fc-ico">${f.ico}</span>
        <div class="fc-h"><h3>${esc(f.titre)}</h3><span>${esc(f.sous)}</span></div>
      </div>
      <div class="badges">
        <span class="bdg lang">🗣️ ${esc(f.langue)}</span>
        <span class="bdg">${esc(f.niv)}</span>
        <span class="bdg">${f.nf} rakitra</span>
      </div>
      <p class="fc-desc">${esc(f.resume.slice(0,150))}…</p>
      <div class="fc-metrics">
        <div class="fm"><b>${hm(f.dur)}</b><span>Faharetana</span></div>
        <div class="fm"><b>${f.nv}</b><span>Video</span></div>
        <div class="fm"><b>${go(f.size)}</b><span>Habe</span></div>
      </div>
      <div class="fc-foot">
        <div class="fc-price">${prix}${f.prix?'<small> · indray mandeha</small>':''}</div>
        <a class="btn btn-sm fc-more" href="formation.html?f=${f.id}">Hijery bebe kokoa →</a>
      </div>`;
    c.querySelector(".fc-top").style.cursor="pointer";
    c.querySelector(".fc-top").onclick=()=>location.href="formation.html?f="+f.id;
    host.appendChild(c);
  });
  reveal();
}

/* ---------- calculateur ---------- */
const SUPPORTS=[4,8,16,32,64,128];
let support=32, sel=new Set();

function renderCalc(){
  const host=document.getElementById("calcList"); host.innerHTML="";
  DATA.forEach(f=>{
    const d=el("div","cl"+(sel.has(f.id)?" on":""));
    d.style.setProperty("--ca",f.acc);
    d.innerHTML=`
      <span class="cl-box">${sel.has(f.id)?"✓":""}</span>
      <span class="cl-ico">${f.ico}</span>
      <span class="cl-t"><b>${esc(f.titre)}</b><span>${hm(f.dur)} · ${go(f.size)} · ${f.nv} vid</span></span>
      <span class="cl-p">${f.prix?ar(f.prix):"—"}</span>`;
    d.onclick=()=>{ sel.has(f.id)?sel.delete(f.id):sel.add(f.id); renderCalc(); updateCalc(); };
    host.appendChild(d);
  });
  const g=document.getElementById("gaugeOpts"); g.innerHTML="";
  SUPPORTS.forEach(s=>{
    const b=el("button","gopt"+(support===s?" on":""),s+" Go");
    b.onclick=()=>{ support=s; renderCalc(); updateCalc(); };
    g.appendChild(b);
  });
}

function updateCalc(){
  const list=DATA.filter(f=>sel.has(f.id));
  const s=list.reduce((a,f)=>a+f.size,0), d=list.reduce((a,f)=>a+f.dur,0);
  const v=list.reduce((a,f)=>a+f.nv,0), p=list.reduce((a,f)=>a+(f.prix||0),0);
  const sansPrix=list.some(f=>!f.prix);
  document.getElementById("crSize").textContent=(s/1e9).toFixed(2);
  document.getElementById("crN").textContent=list.length;
  document.getElementById("crDur").textContent=list.length?hm(d):"0h00";
  document.getElementById("crVid").textContent=v;
  document.getElementById("crPrice").textContent=list.length?(ar(p)+(sansPrix?" +":"")):"0 Ar";

  const usable=support*0.93, need=s/1e9;
  const vd=document.getElementById("verdict"); vd.className="gauge-verdict";
  if(!list.length){ vd.textContent="Fidio formation iray na maromaro."; }
  else if(need<=usable){ vd.classList.add("ok");
    vd.innerHTML=`✅ Ampy ny <b>${support} Go</b> — mbola misy <b>${(usable-need).toFixed(1)} Go</b> malalaka.`; }
  else{ vd.classList.add("no");
    const next=SUPPORTS.find(x=>x*0.93>=need);
    vd.innerHTML=`❌ Tsy ampy ny <b>${support} Go</b> (mila <b>${need.toFixed(2)} Go</b>).`+(next?` Ilaina farafahakeliny <b>${next} Go</b>.`:""); }

  const noms=list.map(f=>f.titre).join(", ")||"…";
  const msg=`Salama Mora Abonner ! Liana amin'ireto aho : ${noms}. Habe: ${(s/1e9).toFixed(2)} Go, faharetana: ${hm(d)}.`;
  document.getElementById("calcCta").innerHTML=contactButtons(msg);
}

/* ---------- FAQ ---------- */
const FAQ=[
  ["Ahoana no ahazoako ny formation ?",
   "Tsindrio ny bokotra <b>Antso mivantana</b> na <b>WhatsApp</b>. Lazao ny formation tianao, dia omenay ny fomba fandoavana. Rehefa vita ny fandoavana dia alefa aminao ny rakitra amin'ny clé USB, disque na transfert."],
  ["Amin'ny teny inona ny lesona ?",
   "Formation 6 amin'ny 8 dia <b>amin'ny teny malagasy</b> (fanazavana). Roa no amin'ny teny frantsay: Hacking Éthique sy ny ampahany amin'ny Pack Bonus. Voamarika mazava eo amin'ny karatra sy ny pejy tsirairay ny teny ampiasaina."],
  ["Mila internet ve rehefa mianatra ?",
   "Tsia. Rakitra video (.mp4) sy PDF izy — mianatra hors-ligne tanteraka. Tsy misy compte, tsy misy abonnement. Anao mandrakizay."],
  ["Marina ve ny ora aseho eto ?",
   `Eny. Ny <b>${hm(TOT.d)}</b> dia norefesina rakitra tsirairay tao anatin'ny métadonnées video, fa tsy vinavina.`],
  ["Ampy ve ny fitehirizako ?",
   `Ampiasao ny <a href="#calculateur" style="color:var(--acc)">calculateur</a>: fidio ny formation dia lazainy raha ampy ny clé 8, 16, 32, 64 na 128 Go. Ny disque manontolo dia ${go(TOT.s)}.`],
  ["Vao manomboka tanteraka aho, mety ve ?",
   "Mety tsara. Ny ankamaroany manomboka amin'ny « niveau 0 ». Ny JavaScript de A à Z sy Boost Page no mora indrindra hanombohana."],
  ["Misy fanohanana ve rehefa avy nividy ?",
   "Eny — misy fanohanana mandritra ny fianarana amin'ny Messenger na WhatsApp."],
];
function renderFaq(){
  const host=document.getElementById("faqBox");
  FAQ.forEach(([q,a])=>{
    const it=el("div","qa");
    const h=el("button","qa-h",`<span>${q}</span><span class="qa-s">+</span>`); h.type="button";
    const b=el("div","qa-b",`<p>${a}</p>`);
    h.onclick=()=>{ const o=it.classList.toggle("open"); h.setAttribute("aria-expanded",String(o)); };
    it.append(h,b); host.appendChild(it);
  });
}

/* ---------- init ---------- */
document.addEventListener("DOMContentLoaded",()=>{
  buildNav("Formations"); buildFoot(); fab();
  terminal(); counters();
  document.getElementById("hN").textContent=DATA.length;
  document.getElementById("hD").textContent=hmLong(TOT.d).replace(" min","min");
  document.getElementById("hV").textContent=TOT.v;
  document.getElementById("hS").textContent=go(TOT.s);
  renderFilters(); renderCards();
  renderCalc(); updateCalc();
  renderFaq();
  document.getElementById("ctaBtns").innerHTML=contactButtons("Salama Mora Abonner ! Vonona hividy formation aho.","lg");
  document.querySelectorAll("#sortSeg .seg-b").forEach(b=>b.onclick=()=>{
    document.querySelectorAll("#sortSeg .seg-b").forEach(x=>x.classList.remove("on"));
    b.classList.add("on"); sortMode=b.dataset.sort; renderCards();
  });
  reveal();
});
