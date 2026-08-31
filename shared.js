/* ==========================================================
   MORA ABONNER — code partage : navbar, recherche globale,
   contact, formatage. Charge sur toutes les pages.
   ========================================================== */

const TEL_HREF = "tel:+261381503734";
const WA_HREF  = "https://wa.me/261337247942";
const waMsg = t => WA_HREF + "?text=" + encodeURIComponent(t);

/* ---------- formatage ---------- */
const hm = s => { s = Math.round(s); const h = Math.floor(s/3600), m = Math.floor(s%3600/60);
  return h ? `${h}h${String(m).padStart(2,"0")}` : (m ? `${m}min` : `${s}s`); };
const hmLong = s => { s = Math.round(s); const h = Math.floor(s/3600), m = Math.floor(s%3600/60);
  return h ? `${h} ora ${m} min` : `${m} minitra`; };
const go = b => b >= 1e9 ? `${(b/1e9).toFixed(2)} Go`
             : b >= 1e6 ? `${Math.round(b/1e6)} Mo`
             : b >= 1e3 ? `${Math.round(b/1e3)} Ko` : `${b} o`;
const ar = n => n.toLocaleString("fr-FR").replace(/ |\s/g, " ") + " Ar";
const norm = s => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const el = (t,c,h) => { const e=document.createElement(t); if(c)e.className=c; if(h!=null)e.innerHTML=h; return e; };

const TOT = DATA.reduce((a,f)=>({s:a.s+f.size,d:a.d+f.dur,v:a.v+f.nv,n:a.n+f.nf}),{s:0,d:0,v:0,n:0});

const ICO = { mp4:"🎬",avi:"🎬",mkv:"🎬",mov:"🎬",webm:"🎬",pdf:"📕",txt:"📄",
              docx:"📘",pptx:"📙",html:"🌐",js:"📜",py:"🐍",sh:"⚙️",
              zip:"🗜️",rar:"🗜️",jpg:"🖼️",ico:"🖼️",pkt:"🔗",md5:"🔑",h:"📜",cpp:"📜" };
const icoFor = e => ICO[e] || "📄";

/* Logiciel masque : on n'affiche que la 1re lettre. Le vrai nom
   n'est jamais ecrit dans le HTML et n'est pas indexe pour la recherche. */
const isMasked = n => n && n.m === 1;
const maskLabel = n => `${n.fl} ${"•".repeat(9)}`;
const nodeLabel = n => isMasked(n) ? maskLabel(n) : n.n;

/* ==========================================================
   NAVBAR — injectee dans <header id="nav">
   ========================================================== */
function buildNav(active){
  const links = [
    ["index.html#formations", "Formations"],
    ["index.html#calculateur","Espace disque"],
    ["index.html#livraison",  "Livraison"],
    ["index.html#faq",        "FAQ"],
  ];
  const host = document.getElementById("nav");
  host.className = "nav";
  host.innerHTML = `
    <div class="wrap nav-in">
      <a href="index.html" class="brand">
        <span class="brand-logo">MA</span>
        <span class="brand-txt">Mora <span class="accent">Abonner</span></span>
      </a>

      <button class="nav-burger" id="burger" aria-label="Menu" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>

      <nav class="nav-links" id="navLinks">
        ${links.map(([h,l])=>`<a href="${h}"${active===l?' class="on"':''}>${l}</a>`).join("")}
      </nav>

      <button class="nav-search" id="openSearch" aria-label="Karohy">
        <span class="ns-ico">⌕</span><span class="ns-txt">Karohy…</span><kbd>/</kbd>
      </button>

      <a href="${waMsg("Salama Mora Abonner ! Liana amin'ny formation aho.")}" target="_blank" rel="noopener" class="btn btn-sm nav-cta">📩 Alefaso MP</a>
    </div>`;

  document.getElementById("burger").onclick = e => {
    const open = host.classList.toggle("menu-open");
    e.currentTarget.setAttribute("aria-expanded", String(open));
  };
  document.querySelectorAll("#navLinks a").forEach(a=>a.onclick=()=>host.classList.remove("menu-open"));
  document.getElementById("openSearch").onclick = openSearch;
}

/* ==========================================================
   RECHERCHE GLOBALE — overlay sur toutes les pages
   ========================================================== */
let SEARCH_INDEX = null;
function buildIndex(){
  if (SEARCH_INDEX) return SEARCH_INDEX;
  const idx = [];
  DATA.forEach(f=>{
    idx.push({t:"formation", f, label:f.titre, sub:f.sous, k:norm(f.titre+" "+f.sous+" "+f.resume+" "+f.langue)});
    const walk = (node, path) => {
      const shown = nodeLabel(node);
      const p = path ? path+" › "+shown : shown;
      // Un logiciel masque est indexe sur une cle vide : introuvable par son vrai nom.
      idx.push({ t: node.t==="d" ? "dossier" : "fichier", f, node, label:shown, sub:p,
                 k: isMasked(node) ? "" : norm(node.n) });
      (node.c||[]).forEach(c=>walk(c,p));
    };
    f.tree.forEach(n=>walk(n,""));
  });
  SEARCH_INDEX = idx;
  return idx;
}

function openSearch(){
  let ov = document.getElementById("searchOv");
  if(!ov){
    ov = el("div","search-ov"); ov.id="searchOv";
    ov.innerHTML = `
      <div class="so-box" role="dialog" aria-label="Karohy">
        <div class="so-head">
          <span class="so-ico">⌕</span>
          <input id="soInput" type="search" placeholder="Karohy formation, dossier na rakitra…" autocomplete="off">
          <button class="so-close" aria-label="Akatona">✕</button>
        </div>
        <div class="so-res" id="soRes"></div>
        <div class="so-foot"><kbd>↑</kbd><kbd>↓</kbd> mifindra · <kbd>↵</kbd> misokatra · <kbd>esc</kbd> mihidy</div>
      </div>`;
    document.body.appendChild(ov);
    ov.onclick = e => { if(e.target===ov) closeSearch(); };
    ov.querySelector(".so-close").onclick = closeSearch;
    ov.querySelector("#soInput").addEventListener("input", e=>runSearch(e.target.value));
    ov.addEventListener("keydown", navSearch);
  }
  ov.classList.add("on");
  document.body.style.overflow = "hidden";
  const i = document.getElementById("soInput");
  i.value = ""; runSearch(""); setTimeout(()=>i.focus(),40);
}
function closeSearch(){
  const ov = document.getElementById("searchOv");
  if(ov) ov.classList.remove("on");
  document.body.style.overflow = "";
}

let soSel = 0, soRows = [];
function runSearch(q){
  const host = document.getElementById("soRes");
  const nq = norm(q.trim());
  buildIndex();
  let res;
  if(!nq){
    res = DATA.map(f=>({t:"formation",f,label:f.titre,sub:f.sous}));
  }else{
    res = SEARCH_INDEX.filter(r=>r.k.includes(nq))
      .sort((a,b)=>{
        const w = {formation:0,dossier:1,fichier:2};
        if(w[a.t]!==w[b.t]) return w[a.t]-w[b.t];
        return a.k.indexOf(nq)-b.k.indexOf(nq);
      }).slice(0,60);
  }
  soRows = res; soSel = 0;
  if(!res.length){ host.innerHTML = `<div class="so-empty">Tsy nisy hita ho an'ny « ${esc(q)} »</div>`; return; }
  host.innerHTML = res.map((r,i)=>{
    const ico = r.t==="formation" ? r.f.ico : (r.t==="dossier" ? "📁" : icoFor(r.node.e));
    const meta = r.t==="formation"
      ? `${hm(r.f.dur)} · ${go(r.f.size)}`
      : (r.node.d ? `${hm(r.node.d)} · ` : "") + go(r.node.s);
    return `<a class="so-row${i===0?" sel":""}" data-i="${i}" href="formation.html?f=${r.f.id}">
        <span class="so-r-ico">${ico}</span>
        <span class="so-r-t"><b>${esc(r.label)}</b><span>${esc(r.sub)}</span></span>
        <span class="so-r-m">${meta}</span>
        <span class="so-r-tag">${r.t}</span>
      </a>`;
  }).join("");
  host.querySelectorAll(".so-row").forEach(a=>{
    a.onmouseenter = ()=>{ soSel=+a.dataset.i; paintSel(); };
  });
}
function paintSel(){
  const rows = document.querySelectorAll("#soRes .so-row");
  rows.forEach((r,i)=>r.classList.toggle("sel", i===soSel));
  const cur = rows[soSel];
  if(cur) cur.scrollIntoView({block:"nearest"});
}
function navSearch(e){
  const rows = document.querySelectorAll("#soRes .so-row");
  if(e.key==="Escape"){ closeSearch(); return; }
  if(e.key==="ArrowDown"){ e.preventDefault(); soSel=Math.min(soSel+1,rows.length-1); paintSel(); }
  if(e.key==="ArrowUp"){ e.preventDefault(); soSel=Math.max(soSel-1,0); paintSel(); }
  if(e.key==="Enter" && rows[soSel]){ e.preventDefault(); rows[soSel].click(); }
}
document.addEventListener("keydown", e=>{
  const ov = document.getElementById("searchOv");
  const typing = /^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName);
  if(e.key==="/" && !typing){ e.preventDefault(); openSearch(); }
  if((e.key==="k"||e.key==="K") && (e.ctrlKey||e.metaKey)){ e.preventDefault(); openSearch(); }
  if(e.key==="Escape" && ov && ov.classList.contains("on")) closeSearch();
});

/* ==========================================================
   BOUTONS DE CONTACT — le numero n'est jamais affiche,
   mais le clic redirige normalement.
   ========================================================== */
function contactButtons(msg, size){
  const s = size==="lg" ? " btn-lg" : "";
  return `
    <a href="${TEL_HREF}" class="btn btn-ghost${s} cbtn">
      <span class="cbtn-ico">📞</span> Antso mivantana
    </a>
    <a href="${waMsg(msg)}" target="_blank" rel="noopener" class="btn${s} cbtn wa">
      <span class="cbtn-ico">💬</span> WhatsApp
    </a>`;
}

/* ---------- pied de page ---------- */
function buildFoot(){
  const f = document.getElementById("foot");
  if(!f) return;
  f.className = "foot";
  f.innerHTML = `
    <div class="wrap foot-in">
      <div class="foot-brand">
        <span class="brand-logo">MA</span>
        <div><b>Mora Abonner</b><span>Fampiofanana Informatika 100% an-tserasera</span></div>
      </div>
      <div class="foot-links">
        <a href="index.html#formations">Formations</a>
        <a href="index.html#calculateur">Espace disque</a>
        <a href="index.html#faq">FAQ</a>
      </div>
      <div class="foot-cta">${contactButtons("Salama Mora Abonner ! Liana amin'ny formation aho.")}</div>
    </div>
    <div class="wrap foot-bot">
      ${DATA.length} formations · ${hm(TOT.d)} · ${TOT.v} lesona · ${go(TOT.s)}
    </div>`;
}

/* ---------- compteurs animes ---------- */
function counters(){
  const io = new IntersectionObserver(es=>es.forEach(e=>{
    if(!e.isIntersecting) return; io.unobserve(e.target);
    const n=e.target, target=+n.dataset.count, sfx=n.dataset.suffix||"", t0=performance.now();
    (function tick(now){
      const p=Math.min((now-t0)/1100,1), k=1-Math.pow(1-p,3);
      n.textContent = Math.round(target*k)+(p===1?sfx:"");
      if(p<1) requestAnimationFrame(tick);
    })(t0);
  }),{threshold:.4});
  document.querySelectorAll("[data-count]").forEach(n=>io.observe(n));
}

/* ---------- revelation au scroll ---------- */
function reveal(){
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const io = new IntersectionObserver(es=>es.forEach(e=>{
    if(e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target); }
  }),{threshold:.12});
  document.querySelectorAll(".rv").forEach(n=>io.observe(n));
}

/* ---------- bouton flottant ---------- */
function fab(){
  const a = el("a","fab");
  a.href = waMsg("Salama Mora Abonner !");
  a.target="_blank"; a.rel="noopener";
  a.setAttribute("aria-label","WhatsApp");
  a.textContent = "💬";
  document.body.appendChild(a);
}
