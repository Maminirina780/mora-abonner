/* ==========================================================
   MORA ABONNER — page detail d'une formation (formation.html)
   ========================================================== */

const params = new URLSearchParams(location.search);
const F = DATA.find(f => f.id === params.get("f")) || DATA[0];
let query = "";

/* ---------- squelette de page ---------- */
function build(){
  document.title = F.titre + " — Mora Abonner";
  const prix = F.prix ? ar(F.prix) : "Sur demande";
  const others = DATA.filter(f => f.id !== F.id).slice(0, 3);

  document.getElementById("page").innerHTML = `
  <section class="fhero" style="--fa:${F.acc}">
    <div class="wrap">
      <a href="index.html#formations" class="back">← Miverina amin'ny katalaogy</a>
      <div class="fhero-grid">
        <div>
          <div class="fh-badges">
            <span class="bdg lang">🗣️ ${esc(F.langue)}</span>
            <span class="bdg">${esc(F.niv)}</span>
            <span class="bdg">${F.theme==="secu"?"Cybersécurité":F.theme==="dev"?"Développement":"Business"}</span>
          </div>
          <h1><span class="fh-ico">${F.ico}</span> ${esc(F.titre)}</h1>
          <p class="fh-sous">${esc(F.sous)}</p>
          <p class="fh-resume">${esc(F.resume)}</p>
          <div class="fh-cta cbtns" id="heroBtns"></div>
        </div>

        <aside class="fh-card">
          <div class="fhc-price">${prix}${F.prix?'<small>indray mandeha</small>':''}</div>
          <div class="fhc-metrics">
            <div><b>${hm(F.dur)}</b><span>Faharetana</span></div>
            <div><b>${F.nv}</b><span>Video</span></div>
            <div><b>${go(F.size)}</b><span>Habe</span></div>
            <div><b>${F.nf}</b><span>Rakitra</span></div>
          </div>
          <div class="fhc-langue">
            <span class="fhc-l-ico">🗣️</span>
            <div><b>Teny ampiasaina : ${esc(F.langue)}</b><span>${esc(F.langue_note)}</span></div>
          </div>
          <div class="fhc-info"><span>Moyenne / video</span><b>${hm(F.moy)}</b></div>
          <div class="fhc-info"><span>Prérequis</span></div>
          <p class="fhc-prereq">${esc(F.prerequis)}</p>
        </aside>
      </div>
    </div>
  </section>

  <section class="fsec">
    <div class="wrap fcols">
      <div class="fcol">
        <h2 class="fh2">🎯 Izay ho hainao</h2>
        <ul class="learn">${F.apprendre.map(a=>`<li>${esc(a)}</li>`).join("")}</ul>
      </div>
      <div class="fcol">
        <h2 class="fh2">👤 Ho an'iza ?</h2>
        <ul class="forwho">${F.pourqui.map(a=>`<li>${esc(a)}</li>`).join("")}</ul>
        <div class="bonus"><span class="bonus-ico">🎁</span><div><b>Bonus</b><p>${esc(F.bonus)}</p></div></div>
      </div>
    </div>
  </section>

  <section class="fsec fsec-alt">
    <div class="wrap">
      <div class="fsec-head">
        <div>
          <span class="kicker">// Fangaraharana tanteraka</span>
          <h2 class="fh2">Ny atiny rehetra, rakitra tsirairay</h2>
          <p class="fsec-sub">Isaky ny rakitra: anarana · faharetana · habe. Ny logiciel dia voaaro (voafono).</p>
        </div>
        <div class="fsec-tools">
          <div class="search sm">
            <span class="search-ico">⌕</span>
            <input type="search" id="q" placeholder="Karohy ato anaty…" aria-label="Karohy">
          </div>
          <button class="btn btn-ghost btn-sm" id="collapse">Akatona</button>
        </div>
      </div>
      <div class="tree" id="tree"></div>
      <p class="empty" id="empty" hidden>Tsy misy rakitra mifanaraka.</p>
    </div>
  </section>

  <section class="fsec">
    <div class="wrap center-buy">
      <h2 class="fh2">Vonona hanomboka amin'ity formation ity ?</h2>
      <p class="fsec-sub">${hm(F.dur)} · ${F.nv} video · ${go(F.size)} · ${prix}</p>
      <div class="cbtns center-cta" id="buyBtns"></div>
    </div>
  </section>

  <section class="fsec fsec-alt">
    <div class="wrap">
      <h2 class="fh2">Formations hafa</h2>
      <div class="others">
        ${others.map(o=>`
          <a class="oth" href="formation.html?f=${o.id}" style="--fa:${o.acc}">
            <span class="oth-ico">${o.ico}</span>
            <div class="oth-t"><b>${esc(o.titre)}</b><span>${hm(o.dur)} · ${go(o.size)} · ${o.prix?ar(o.prix):"sur demande"}</span></div>
            <span class="oth-arr">→</span>
          </a>`).join("")}
      </div>
    </div>
  </section>`;

  const msg = `Salama Mora Abonner ! Liana amin'ny formation « ${F.titre} » (${hm(F.dur)}, ${go(F.size)}, ${F.prix?ar(F.prix):"vidiny?"}) aho.`;
  document.getElementById("heroBtns").innerHTML = contactButtons(msg,"lg");
  document.getElementById("buyBtns").innerHTML  = contactButtons(msg,"lg");
}

/* ---------- arbre ---------- */
function matches(node,q){
  if(!q) return true;
  if(!isMasked(node) && norm(node.n).includes(q)) return true;   // masque = jamais trouvable
  return (node.c||[]).some(k=>matches(k,q));
}
function mark(node,q){
  if(isMasked(node)) return `<span class="masked">${esc(node.fl)} ${"•".repeat(9)}<span class="lock">🔒</span></span>`;
  const name=node.n;
  if(!q) return esc(name);
  const i=norm(name).indexOf(q);
  if(i<0) return esc(name);
  return esc(name.slice(0,i))+'<span class="hl">'+esc(name.slice(i,i+q.length))+'</span>'+esc(name.slice(i+q.length));
}
function buildNode(node,q,depth){
  const isDir=node.t==="d";
  const wrap=el("div","node");
  const row=el("div","nrow"+(isDir?" dir":"")+(isMasked(node)?" mrow":""));
  const meta=[];
  if(node.d) meta.push(`<span class="nt d">${hm(node.d)}</span>`);
  meta.push(`<span class="nt s">${go(node.s)}</span>`);
  if(isDir) meta.push(`<span class="nt">${node.nv?node.nv+" vid":node.nf+" fich"}</span>`);
  else if(isMasked(node)) meta.push(`<span class="nt lockt">logiciel</span>`);
  row.innerHTML=`
    <span class="nchev">${isDir?"▶":""}</span>
    <span class="nico">${isDir?"📁":(isMasked(node)?"🔒":icoFor(node.e))}</span>
    <span class="nname">${mark(node,q)}</span>
    <span class="nmeta">${meta.join("")}</span>`;
  wrap.appendChild(row);
  if(isDir){
    const kids=el("div","nkids");
    node.c.filter(k=>matches(k,q)).forEach(k=>kids.appendChild(buildNode(k,q,depth+1)));
    wrap.appendChild(kids);
    if(q||depth<1) wrap.classList.add("open");
    row.onclick=()=>wrap.classList.toggle("open");
  }
  return wrap;
}
function renderTree(){
  const host=document.getElementById("tree"), empty=document.getElementById("empty");
  const q=norm(query.trim()); host.innerHTML="";
  const vis=F.tree.filter(n=>matches(n,q));
  vis.forEach(n=>host.appendChild(buildNode(n,q,0)));
  empty.hidden=vis.length>0; host.hidden=vis.length===0;
}

/* ---------- init ---------- */
document.addEventListener("DOMContentLoaded",()=>{
  buildNav(""); build(); buildFoot(); fab();
  renderTree();
  document.getElementById("q").addEventListener("input",e=>{ query=e.target.value; renderTree(); });
  document.getElementById("collapse").onclick=()=>
    document.querySelectorAll("#tree .node.open").forEach(n=>n.classList.remove("open"));
  reveal();
  window.scrollTo(0,0);
});
