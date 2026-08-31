/* ==========================================================
   MORA ABONNER — logique du site vitrine
   DATA provient de data.js (extrait de la cle USB)
   ========================================================== */

const TEL   = "038 15 037 34";
const WA    = "033 72 479 42";
const WALINK = "https://wa.me/261337247942";

/* ---------- formatage ---------- */
const hm = s => { s = Math.round(s); const h = Math.floor(s/3600), m = Math.floor(s%3600/60);
  return h ? `${h}h${String(m).padStart(2,"0")}` : (m ? `${m}min` : `${s}s`); };
const go = b => b >= 1e9 ? `${(b/1e9).toFixed(2)} Go`
             : b >= 1e6 ? `${Math.round(b/1e6)} Mo`
             : b >= 1e3 ? `${Math.round(b/1e3)} Ko` : `${b} o`;
const ar = n => n.toLocaleString("fr-FR").replace(/ |\s/g," ") + " Ar";
const norm = s => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
const esc = s => s.replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const el = (t,c,h) => { const e=document.createElement(t); if(c)e.className=c; if(h!=null)e.innerHTML=h; return e; };

/* ---------- totaux ---------- */
const TOT = DATA.reduce((a,f)=>({s:a.s+f.size, d:a.d+f.dur, v:a.v+f.nv, n:a.n+f.nf}),{s:0,d:0,v:0,n:0});

/* ---------- icones fichier ---------- */
const ICO = { mp4:"🎬", avi:"🎬", mkv:"🎬", mov:"🎬", webm:"🎬",
              pdf:"📕", txt:"📄", docx:"📘", pptx:"📙", html:"🌐", js:"📜",
              py:"🐍", sh:"⚙️", zip:"🗜️", rar:"🗜️", jpg:"🖼️", ico:"🖼️" };
const icoFor = e => ICO[e] || "📄";

/* =========================================================
   1. TERMINAL
   ========================================================= */
function terminal(){
  const box = document.getElementById("term");
  const lines = [
    '<span class="c">$</span> mora-abonner --catalogue',
    '',
    '<span class="k">formations</span>   <span class="v">'+DATA.length+'</span>',
    '<span class="k">lesona</span>       <span class="v">'+TOT.v+'</span> <span class="c">video</span>',
    '<span class="k">faharetana</span>   <span class="v">'+hm(TOT.d)+'</span> <span class="c">(norefesina)</span>',
    '<span class="k">habe</span>         <span class="v">'+go(TOT.s)+'</span>',
    '<span class="k">rakitra</span>      <span class="v">'+TOT.n+'</span>',
    '',
    '<span class="c">$</span> ls --by-duration'
  ];
  [...DATA].sort((a,b)=>b.dur-a.dur).slice(0,5).forEach(f=>{
    const pad = f.titre.length > 26 ? f.titre.slice(0,25)+"…" : f.titre.padEnd(26,".");
    lines.push('  '+pad+' <span class="v">'+hm(f.dur)+'</span>');
  });
  lines.push('', '<span class="c">$</span> status', '  <span class="v">VONONA</span> — 📩 Alefaso MP');

  if (matchMedia("(prefers-reduced-motion: reduce)").matches){ box.innerHTML = lines.join("\n"); return; }
  let i = 0;
  const cur = '<span class="cursor"></span>';
  (function step(){
    if (i >= lines.length){ box.innerHTML = lines.join("\n")+"\n"+cur; return; }
    box.innerHTML = lines.slice(0,i+1).join("\n")+cur;
    i++; setTimeout(step, lines[i-1]==="" ? 100 : 165);
  })();
}

/* =========================================================
   2. COMPTEURS
   ========================================================= */
function counters(){
  const io = new IntersectionObserver(es=>es.forEach(e=>{
    if(!e.isIntersecting) return; io.unobserve(e.target);
    const n = e.target, target = +n.dataset.count, sfx = n.dataset.suffix || "";
    const t0 = performance.now();
    (function tick(now){
      const p = Math.min((now-t0)/1200,1), k = 1-Math.pow(1-p,3);
      n.textContent = Math.round(target*k) + (p===1 ? sfx : "");
      if(p<1) requestAnimationFrame(tick);
    })(t0);
  }),{threshold:.4});
  document.querySelectorAll("[data-count]").forEach(n=>io.observe(n));
}

/* =========================================================
   3. CARTES FORMATION + FILTRES
   ========================================================= */
const THEMES = [
  ["all","Rehetra"],
  ["secu","Cybersécurité"],
  ["dev","Développement"],
  ["biz","Business"],
];
const THEME_OF = { hacking:"secu", kali:"secu", maintenance:"secu",
                   fullstack:"dev", js:"dev", bonus:"dev",
                   trading:"biz", boost:"biz" };
let theme = "all";

function renderFilters(){
  const host = document.getElementById("filters");
  host.innerHTML = "";
  THEMES.forEach(([k,lab])=>{
    const n = k==="all" ? DATA.length : DATA.filter(f=>THEME_OF[f.id]===k).length;
    const b = el("button","chip"+(theme===k?" on":""), `${lab} <span style="opacity:.6">${n}</span>`);
    b.onclick = ()=>{ theme=k; renderFilters(); renderCards(); };
    host.appendChild(b);
  });
}

function renderCards(){
  const host = document.getElementById("fcards");
  host.innerHTML = "";
  DATA.filter(f => theme==="all" || THEME_OF[f.id]===theme).forEach(f=>{
    const c = el("article","fc");
    c.style.setProperty("--fa", f.acc);
    const prix = f.prix ? ar(f.prix) : "Sur demande";
    c.innerHTML = `
      <div class="fc-top">
        <span class="fc-ico">${f.ico}</span>
        <div class="fc-h"><h3>${esc(f.titre)}</h3><span>${esc(f.sous)}</span></div>
      </div>
      <div class="badges">
        <span class="bdg">${esc(f.niv)}</span>
        <span class="bdg">${esc(f.lang)}</span>
        <span class="bdg">${f.nf} rakitra</span>
      </div>
      <p class="fc-desc">${esc(f.desc)}</p>
      <div class="fc-metrics">
        <div class="fm"><b>${hm(f.dur)}</b><span>Faharetana</span></div>
        <div class="fm"><b>${f.nv}</b><span>Video</span></div>
        <div class="fm"><b>${go(f.size)}</b><span>Habe</span></div>
      </div>
      <ul class="fc-pts">${f.pts.map(p=>`<li>${esc(p)}</li>`).join("")}</ul>
      <div class="fc-foot">
        <div class="fc-price">${prix}${f.prix?'<small> · indray mandeha</small>':''}</div>
        <div class="fc-actions">
          <button class="btn btn-ghost btn-sm" data-see="${f.id}">Jereo ny atiny</button>
          <a class="btn btn-sm" href="${WALINK}?text=${encodeURIComponent("Salama Mora Abonner, liana amin'ny formation « "+f.titre+" » aho.")}" target="_blank" rel="noopener">Mangataka</a>
        </div>
      </div>`;
    host.appendChild(c);
  });
  host.querySelectorAll("[data-see]").forEach(b=>{
    b.onclick = ()=>{
      picked = new Set([b.dataset.see]);
      renderPicker(); renderTree();
      document.getElementById("explorer").scrollIntoView({behavior:"smooth"});
    };
  });
}

/* =========================================================
   4. EXPLORATEUR D'ARBORESCENCE
   ========================================================= */
let picked = new Set([DATA[0].id]);
let query = "";

function renderPicker(){
  const host = document.getElementById("picker");
  host.innerHTML = "";
  const all = el("button","pk"+(picked.size===DATA.length?" on":""),"📚 Rehetra");
  all.style.setProperty("--pa","#22d3ee");
  all.onclick = ()=>{ picked = picked.size===DATA.length ? new Set([DATA[0].id]) : new Set(DATA.map(f=>f.id)); renderPicker(); renderTree(); };
  host.appendChild(all);
  DATA.forEach(f=>{
    const b = el("button","pk"+(picked.has(f.id)?" on":""), `${f.ico} ${esc(f.titre)}`);
    b.style.setProperty("--pa", f.acc);
    b.onclick = ()=>{
      if(picked.has(f.id)) picked.delete(f.id); else picked.add(f.id);
      if(!picked.size) picked.add(f.id);
      renderPicker(); renderTree();
    };
    host.appendChild(b);
  });
}

function mark(name,q){
  if(!q) return esc(name);
  const i = norm(name).indexOf(q);
  if(i<0) return esc(name);
  return esc(name.slice(0,i))+'<span class="hl">'+esc(name.slice(i,i+q.length))+'</span>'+esc(name.slice(i+q.length));
}

function matches(node,q){
  if(!q) return true;
  if(norm(node.n).includes(q)) return true;
  return (node.c||[]).some(k=>matches(k,q));
}

function buildNode(node,q,depth){
  const isDir = node.t === "d";
  const wrap = el("div","node");
  const row  = el("div","nrow"+(isDir?" dir":""));
  const meta = [];
  if(node.d) meta.push(`<span class="nt d">${hm(node.d)}</span>`);
  meta.push(`<span class="nt s">${go(node.s)}</span>`);
  if(isDir) meta.push(`<span class="nt">${node.nv?node.nv+" vid":node.nf+" fich"}</span>`);
  row.innerHTML = `
    <span class="nchev">${isDir?"▶":""}</span>
    <span class="nico">${isDir?"📁":icoFor(node.e)}</span>
    <span class="nname" title="${esc(node.n)}">${mark(node.n,q)}</span>
    <span class="nmeta">${meta.join("")}</span>`;
  wrap.appendChild(row);

  if(isDir){
    const kids = el("div","nkids");
    const vis = node.c.filter(k=>matches(k,q));
    vis.forEach(k=>kids.appendChild(buildNode(k,q,depth+1)));
    wrap.appendChild(kids);
    if(q || depth < 0) wrap.classList.add("open");
    row.onclick = ()=>wrap.classList.toggle("open");
  }
  return wrap;
}

function renderTree(){
  const host = document.getElementById("tree");
  const empty = document.getElementById("empty");
  const q = norm(query.trim());
  host.innerHTML = "";
  let shown = 0;
  DATA.filter(f=>picked.has(f.id)).forEach(f=>{
    const root = { n:f.titre, t:"d", s:f.size, d:f.dur, nv:f.nv, nf:f.nf, c:f.tree };
    if(!matches(root,q)) return;
    shown++;
    const n = buildNode(root,q,-1);
    n.querySelector(".nico").textContent = f.ico;
    host.appendChild(n);
  });
  empty.hidden = shown > 0;
  host.hidden = shown === 0;
}

/* =========================================================
   5. CALCULATEUR D'ESPACE
   ========================================================= */
const SUPPORTS = [4,8,16,32,64,128];
let support = 32;
let sel = new Set();

function renderCalc(){
  const host = document.getElementById("calcList");
  host.innerHTML = "";
  DATA.forEach(f=>{
    const d = el("div","cl"+(sel.has(f.id)?" on":""));
    d.style.setProperty("--ca", f.acc);
    d.innerHTML = `
      <span class="cl-box">${sel.has(f.id)?"✓":""}</span>
      <span class="cl-ico">${f.ico}</span>
      <span class="cl-t"><b>${esc(f.titre)}</b><span>${hm(f.dur)} · ${go(f.size)} · ${f.nv} vid</span></span>
      <span class="cl-p">${f.prix?ar(f.prix):"—"}</span>`;
    d.onclick = ()=>{ sel.has(f.id) ? sel.delete(f.id) : sel.add(f.id); renderCalc(); updateCalc(); };
    host.appendChild(d);
  });

  const g = document.getElementById("gaugeOpts");
  g.innerHTML = "";
  SUPPORTS.forEach(s=>{
    const b = el("button","gopt"+(support===s?" on":""), s+" Go");
    b.onclick = ()=>{ support=s; renderCalc(); updateCalc(); };
    g.appendChild(b);
  });
}

function updateCalc(){
  const list = DATA.filter(f=>sel.has(f.id));
  const s = list.reduce((a,f)=>a+f.size,0);
  const d = list.reduce((a,f)=>a+f.dur,0);
  const v = list.reduce((a,f)=>a+f.nv,0);
  const p = list.reduce((a,f)=>a+(f.prix||0),0);
  const sansPrix = list.some(f=>!f.prix);

  document.getElementById("crSize").textContent = (s/1e9).toFixed(2);
  document.getElementById("crN").textContent    = list.length;
  document.getElementById("crDur").textContent  = list.length ? hm(d) : "0h00";
  document.getElementById("crVid").textContent  = v;
  document.getElementById("crPrice").textContent = list.length
    ? (ar(p) + (sansPrix ? " +" : "")) : "0 Ar";

  const usable = support * 0.93;                    // formatage + marge
  const need = s/1e9;
  const vd = document.getElementById("verdict");
  vd.className = "gauge-verdict";
  if(!list.length){
    vd.textContent = "Fidio formation iray na maromaro.";
  } else if(need <= usable){
    vd.classList.add("ok");
    vd.innerHTML = `✅ Ampy ny <b>${support} Go</b> — mbola misy <b>${(usable-need).toFixed(1)} Go</b> malalaka.`;
  } else {
    vd.classList.add("no");
    const next = SUPPORTS.find(x=>x*0.93 >= need);
    vd.innerHTML = `❌ Tsy ampy ny <b>${support} Go</b> (mila <b>${need.toFixed(2)} Go</b>).`
      + (next ? ` Ilaina farafahakeliny <b>${next} Go</b>.` : "");
  }

  const noms = list.map(f=>f.titre).join(", ") || "…";
  document.getElementById("calcCta").href = WALINK + "?text=" +
    encodeURIComponent(`Salama Mora Abonner ! Liana amin'ireto aho : ${noms}. Habe: ${(s/1e9).toFixed(2)} Go, faharetana: ${hm(d)}.`);
}

/* =========================================================
   6. FAQ
   ========================================================= */
const FAQ = [
  ["Ahoana no ahazoako ny formation ?",
   `Antsoy ny <b>${TEL}</b> na alefaso hafatra amin'ny WhatsApp <b>${WA}</b>. Lazao ny formation tianao, dia omenay ny fomba fandoavana. Rehefa vita ny fandoavana dia alefa aminao ny rakitra amin'ny clé USB, disque externe na transfert mivantana.`],
  ["Mila internet ve rehefa mianatra ?",
   "Tsia. Rakitra video (.mp4) sy PDF izy ireo — mianatra hors-ligne tanteraka ianao. Tsy misy compte, tsy misy abonnement, tsy misy plateforme. Anao mandrakizay."],
  ["Marina ve ny ora aseho eto ?",
   `Eny. Ny <b>${hm(TOT.d)}</b> dia norefesina rakitra tsirairay tao anatin'ny métadonnées video, fa tsy vinavina avy amin'ny habe. Isaky ny lesona ao amin'ny « Contenu détaillé » dia hitanao ny faharetany marina.`],
  ["Ampy ve ny fitehirizako ?",
   `Ampiasao ny <a href="#calculateur" style="color:var(--acc)">calculateur eto ambony</a>: fidio ny formation tianao dia hilaza avy hatrany izy raha ampy ny clé 8, 16, 32, 64 na 128 Go. Ny disque manontolo dia ${go(TOT.s)}.`],
  ["Vao manomboka tanteraka aho, mety ve ?",
   "Mety tsara. Ny ankamaroan'ny formation dia manomboka amin'ny « niveau 0 » — tsy mila fahalalana mialoha. Ny JavaScript de A à Z sy Boost Page no tena mora indrindra hanombohana."],
  ["Misy fanohanana ve rehefa avy nividy ?",
   "Eny — misy fanohanana mandritra ny fianarana. Raha misy lesona tsy azonao, alefaso hafatra amin'ny Messenger na WhatsApp dia hazavainay."],
  ["Azoko atao ve ny mividy formation maromaro ?",
   "Azo tsara. Ampiasao ny calculateur handinihana ny vidiny totaly sy ny habe ilaina. Lazao anay ny safidinao dia ho resahantsika ny vidiny."],
  ["Ara-dalàna ve ny formation cybersécurité ?",
   "Ny atiny dia natao ho fiarovana sy hacking éthique. Ny teknika ampianarina dia ampiharina ao amin'ny laboratoire manokana na amin'ny rafitra anao. Ny fitsapana rafitra an'olon-kafa tsy misy alalana an-tsoratra dia heloka — voalaza mazava ao anatin'ny lesona izany."],
];

function renderFaq(){
  const host = document.getElementById("faqBox");
  FAQ.forEach(([q,a])=>{
    const it = el("div","qa");
    const h  = el("button","qa-h",`<span>${q}</span><span class="qa-s">+</span>`);
    h.type = "button";
    const b  = el("div","qa-b",`<p>${a}</p>`);
    h.onclick = ()=>{ const o = it.classList.toggle("open"); h.setAttribute("aria-expanded",String(o)); };
    it.append(h,b); host.appendChild(it);
  });
}

/* =========================================================
   INIT
   ========================================================= */
document.addEventListener("DOMContentLoaded",()=>{
  terminal(); counters();
  renderFilters(); renderCards();
  renderPicker(); renderTree();
  renderCalc(); updateCalc();
  renderFaq();

  document.getElementById("q").addEventListener("input",e=>{ query = e.target.value; renderTree(); });
  document.getElementById("collapse").onclick = ()=>{
    document.querySelectorAll("#tree .node.open").forEach(n=>n.classList.remove("open"));
  };
});
