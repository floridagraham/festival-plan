import {spring,SPRING,sheet,reducedMotion} from "./motion.js";
import {qrSvg} from "./qr.js";
// Data lives in /data as JSON so set times and lineup changes don't need a code change.
const getJSON=p=>fetch(p).then(r=>{if(!r.ok)throw new Error(p+" "+r.status);return r.json();});
let LINEUP,TIMES,PARTY_DATA,MAP_DATA;
try{[LINEUP,TIMES,PARTY_DATA,MAP_DATA]=await Promise.all(["data/lineup.json","data/set-times-estimated.json","data/afterparties.json","data/stages-and-map.json"].map(getJSON));}
catch(e){track("edc_data_load_failed",{error:String(e).slice(0,120)});document.getElementById("grid").innerHTML=`<div class="empty">Couldn't load the lineup. Check your signal and reload.</div>`;throw e;}
const G=LINEUP.genreGroups;
// [name, groupKey, genre text, vibe, links(search terms), flags]
const toRow=a=>[a.name,a.genreGroup,a.genre,a.vibe,a.searchTerms,a.flags.join(" ")];
const [FRI,SAT,SUN]=["fri","sat","sun"].map(d=>LINEUP.days[d].acts.map(toRow));
const DAYS={fri:{name:"Friday",date:"Fri Nov 6, 2026",list:FRI},sat:{name:"Saturday",date:"Sat Nov 7, 2026",list:SAT},sun:{name:"Sunday",date:"Sun Nov 8, 2026",list:SUN}};
// Official set times: fill "official" in set-times-estimated.json, e.g. "sat:alan-walker": {start:"17:15",end:"18:30",stage:"kinetic"}. 24h clock.
const SET=TIMES.official||{};
const CUTOFF="17:00";
let day="sat", A=SAT, tod="all";

document.documentElement.lang="en";
const ytIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#fff"/><path d="M10 8l6 4-6 4z" fill="#ff2d55"/></svg>';
const spIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#06140b"/><path d="M7 9.5c3.5-1 7-.6 10 1M7.5 12.5c3-.8 5.8-.4 8.3.9M8 15.3c2.4-.6 4.6-.3 6.6.7" stroke="#1ed760" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>';
// small custom line icons used in place of emoji throughout the app (all inherit color via currentColor)
const ico_=(p)=>`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const CHECK_ICO=ico_('<path d="M5 13l4 4L19 7"/>');
const MAYBE_ICO=ico_('<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 4.9.8c0 1.7-2.4 1.9-2.4 3.5"/><circle cx="12" cy="17" r=".6" fill="currentColor" stroke="none"/>');
const X_ICO=ico_('<path d="M6 6l12 12M18 6L6 18"/>');
const SUN_ICO=ico_('<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>');
const MOON_ICO=ico_('<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"/>');
const PIN_ICO=ico_('<path d="M12 22s7-7.5 7-12a7 7 0 1 0-14 0c0 4.5 7 12 7 12Z"/><circle cx="12" cy="10" r="2.5"/>');
const GEM_ICO=ico_('<path d="M6 3h12l3 6-9 12L3 9Z"/><path d="M3 9h18M9 3l3 6 3-6M12 9v12"/>');
const SUNSET_ICO=ico_('<path d="M3 18h18M5 18a7 7 0 0 1 14 0"/><path d="M12 7v4M8 6l1.5 2M16 6l-1.5 2"/>');
const TICKET_ICO=ico_('<path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 1 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 1 0 0-4Z"/>');
const CLOCK_ICO=ico_('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>');
const SYNC_ICO=ico_('<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/>');
const BUS_ICO=ico_('<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M3 11h18M7 17v2M17 17v2"/><circle cx="7.5" cy="14" r=".8" fill="currentColor" stroke="none"/><circle cx="16.5" cy="14" r=".8" fill="currentColor" stroke="none"/>');
const CAR_ICO=ico_('<path d="M4 16V11l2-5h12l2 5v5"/><path d="M4 16h16M7 16v2M17 16v2"/><circle cx="7.5" cy="14" r=".8" fill="currentColor" stroke="none"/><circle cx="16.5" cy="14" r=".8" fill="currentColor" stroke="none"/>');
const PLAY_ICO=ico_('<path d="M8 5v14l11-7Z" fill="currentColor"/>');
const CLASH_ICO=ico_('<path d="M12 3 2 20h20L12 3Z"/><path d="M12 10v4"/><circle cx="12" cy="17" r=".6" fill="currentColor" stroke="none"/>');
// Graham's public contact address and the app's link, from config.js (never his personal Gmail)
const CFG0=window.EDC_CONFIG||{};
const contactEmail=String(CFG0.contactEmail||"").trim(), hasEmail=/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(contactEmail);
const mailTo=(subj,body)=>`mailto:${contactEmail}?subject=${encodeURIComponent(subj)}${body?"&body="+encodeURIComponent(body):""}`;
const APP_URL=CFG0.appUrl||"https://festplan.glowbop.com/";
const BUILD_SUBJ="I want an app like Your Festival Plan";
// "Built by" line at the foot of My Plan, Getting there and the afterparties (Oct 28)
const builtBy=where=>hasEmail?`<p class="builtby">Built by <b>Graham Lucht</b>, app builder. I make things that people love. <a class="builtby-go" data-where="${where}" href="${mailTo(BUILD_SUBJ)}">Got an idea? Let's talk <span aria-hidden="true">&rarr;</span></a></p>`:"";
// directions open the phone's own map app (Graham, Oct 28): Apple Maps on an iPhone, the standard geo: link on
// Android (it opens whatever map app the phone uses), Google Maps on a computer. The page's own Google Maps
// direction links are switched over the same way when the app starts.
const MAP_OS=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1)?"ios":/Android/.test(navigator.userAgent)?"android":"web";
function mapsHref(addr){
  const q=encodeURIComponent(addr);
  return MAP_OS==="ios"?"https://maps.apple.com/?daddr="+q:MAP_OS==="android"?"geo:0,0?q="+q:"https://www.google.com/maps/dir/?api=1&destination="+q;
}
document.querySelectorAll('a[href^="https://www.google.com/maps/dir/"]').forEach(a=>{
  const d=new URL(a.href).searchParams.get("destination"); if(!d) return;
  a.href=mapsHref(d); if(MAP_OS==="android") a.removeAttribute("target");
});
const escH=s=>String(s).replace(/[&<>"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[ch]);
const SPARKLE_ICO=ico_('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>');
const spUrl = t => "https://open.spotify.com/search/" + encodeURIComponent(t);
const url = t => "https://music.youtube.com/search?q=" + encodeURIComponent(t);

// genre mix bar
const order = ["house","bass","melodic","dnb","techno","tbc"];
const bar = document.getElementById("bar"), legend = document.getElementById("legend");
let counts={};
const MIX_SHORT={house:"House",bass:"Bass",melodic:"Melodic",dnb:"Drum & Bass",techno:"Techno",tbc:"TBC"};
const mixSeg={}; let mixDrawn=false;
function drawMix(){
  counts={}; A.forEach(a => counts[a[1]] = (counts[a[1]]||0)+1);
  order.forEach(k => {
    if(!mixSeg[k]){
      const d=document.createElement("div"); d.style.background=G[k].color; d.style.width="0%"; bar.appendChild(d);
      mixSeg[k]={el:d,sp:spring(0,v=>{d.style.width=Math.max(0,v)+"%";},{preset:SPRING.snappy,precision:.05})};
    }
    mixSeg[k].el.title=G[k].label+": "+(counts[k]||0);
    // first draw lands instantly so the bar is complete at rest; later day changes spring
    const w=(counts[k]||0)/A.length*100; if(mixDrawn) mixSeg[k].sp.to(w); else mixSeg[k].sp.set(w);
  });
  mixDrawn=true;
  legend.innerHTML=order.filter(k=>counts[k]).map(k=>`<span title="${G[k].label}"><i style="background:${G[k].color}"></i>${MIX_SHORT[k]} <b>${counts[k]}</b></span>`).join("");
}

// filters
let genre="all", gemsOnly=false, q="", pickF="all";
const picks={};
const slug=n=>n.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const filters=document.getElementById("filters"), qEl=document.getElementById("q");
const mk=(id,label)=>{const b=document.createElement("button");b.className="chip";b.id="f-"+id;b.textContent=label;b.setAttribute("aria-pressed","false");filters.appendChild(b);return b;};
const genreSel=document.getElementById("genreSel");
genreSel.innerHTML=`<option value="all">All genres</option>`+order.filter(k=>k!=="tbc").map(k=>`<option value="${k}" style="color:${G[k].hex}">${G[k].label}</option>`).join("");
const gemB=mk("gems","Discovery only");
const pf={yes:mk("p-yes","Going"),maybe:mk("p-maybe","Maybe"),no:mk("p-no","Skip"),none:mk("p-none","Not rated yet")};
Object.entries(pf).forEach(([k,b])=>b.onclick=()=>{pickF=pickF===k?"all":k;Object.entries(pf).forEach(([kk,bb])=>bb.setAttribute("aria-pressed",kk===pickF));render();track("edc_filter",{type:"pick",value:pickF});});
function setGenre(k){genre=k;genreSel.value=k;render();track("edc_filter",{type:"genre",value:k});}
genreSel.onchange=()=>setGenre(genreSel.value);
gemB.onclick=()=>{gemsOnly=!gemsOnly;gemB.setAttribute("aria-pressed",gemsOnly);render();track("edc_filter",{type:"discovery_only",value:gemsOnly});};
let searchTracked=false;
let searchTimer=null;
qEl.oninput=e=>{q=e.target.value.toLowerCase().trim();render();if(q&&!searchTracked){searchTracked=true;track("edc_search_used");}
  clearTimeout(searchTimer);if(q) searchTimer=setTimeout(()=>{const n=grid.querySelectorAll(".card").length;track("edc_search",{length:q.length,results:n,no_results:!n,day});},1200);};

// what a tap was about: the act (billing rank, genre, estimated or official slot) or the afterparty.
// Item ids are artist slugs or p-<day>-<venue>, same as picks.
function actProps(id){const i=A.findIndex(a=>slug(a[0])===id);if(i<0) return {item:id,day};const a=A[i],w=when(a);
  return {act:a[0],item:id,day,rank:i+1,genre:a[1],stage:w.st.stage||"",start:w.st.start||"",slot:w.k,official_time:w.real,sunset:a[5].includes("sun"),discovery:a[5].includes("gem")};}
function partyProps(id){const p=[...(PARTIES[day]||[]),...PARTIES.thu].find(x=>x.id===id);
  return p?{party:p.name,item:id,venue:p.venue.split(" · ")[0],party_day:id.split("-")[1],official:p.official,day}:{item:id,day};}
const itemProps=id=>id.startsWith("p-")?partyProps(id):actProps(id);
const session={start:Date.now(),votes:0,listens:0,expands:0,maxScroll:0};

// afternoon / evening: real set time if known, else a billing-based estimate
// Estimate: 5 stages x ~3 slots before 5 PM, so the 15 lowest-billed non-sunset acts are "afternoon"; sunset sets land around sunset (~5:35 PM).
function hasReal(){return A.some(a=>SET[day+":"+slug(a[0])]);}
// Best-guess stage and slot for each act until real set times exist (precomputed in set-times-estimated.json:
// each stage runs 1 PM to midnight in even slots, lowest-billed first, sunset sets nearest ~5:35 PM).
const EST=TIMES.estimatedSlots;
function when(a){
  const key=day+":"+slug(a[0]);
  const st=SET[key];
  if(st) return {k:st.start<CUTOFF?"aft":"eve",real:true,st};
  const e=EST[key]||{start:"18:00",stage:""};
  return {k:e.start<CUTOFF?"aft":"eve",real:false,st:e};
}
let stageF="all";
const tMin=t=>{const [h,m]=t.split(":").map(Number);return h*60+m;};
const slotEnd=w=>w.st.end?tMin(w.st.end):tMin(w.st.start)+60;
function goingClashes(){
  const g=A.filter(a=>picks[slug(a[0])]==="yes").map(a=>({id:slug(a[0]),name:a[0],w:when(a)})), out={};
  g.forEach(x=>{out[x.id]=g.filter(y=>y!==x&&tMin(y.w.st.start)<slotEnd(x.w)&&tMin(x.w.st.start)<slotEnd(y.w)).map(y=>y.name);});
  return out;
}
const fmt=t=>{let [h,m]=t.split(":").map(Number);const ap=h>=12&&h<24?"PM":"AM";h=h%12||12;return h+":"+String(m).padStart(2,"0")+" "+ap;};
const STAGE_NAMES={kinetic:"kineticFIELD",circuit:"circuitGROUNDS",neon:"neonGARDEN",stereo:"stereoBLOOM",bacardi:"CASA BACARDÍ"};
const STAGE_COL={kinetic:"#ff4fb4",circuit:"#a874ff",neon:"#6677ff",stereo:"#3fe0ff",bacardi:"#ffcc66"};
const stageRow=document.getElementById("stagerow");
stageRow.innerHTML=`<button data-s="all" aria-pressed="true" style="--sc:#f6f1ff"><i></i>All stages</button>`+Object.keys(STAGE_NAMES).map(k=>`<button data-s="${k}" aria-pressed="false" style="--sc:${STAGE_COL[k]}"><i></i>${STAGE_NAMES[k]}</button>`).join("");
// picks tally under the map: each count is a button that filters the lineup to those picks
const tallyHTML=t=>[["yes","y",CHECK_ICO,"Going",t.yes],["maybe","m",MAYBE_ICO,"Maybe",t.maybe],["no","n",X_ICO,"Skip",t.no],["none","u","","Not rated",A.length-t.yes-t.maybe-t.no]]
  .map(([k,c,ic,l,n])=>`<button type="button" class="${c}" data-pf="${k}" aria-pressed="${pickF===k}" aria-label="${l}: ${n}"><span class="tn">${n}</span><span class="tl">${ic} ${l}</span></button>`).join("");
document.getElementById("tally").addEventListener("click",e=>{const b=e.target.closest("[data-pf]"); if(b) pf[b.dataset.pf].click();});
function setStage(k){stageF=k;stageRow.querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.s===k));render();syncTopMap();track("edc_filter",{type:"stage",value:k});}
stageRow.querySelectorAll("button").forEach(b=>b.onclick=()=>setStage(stageF===b.dataset.s?"all":b.dataset.s));

const grid=document.getElementById("grid"), count=document.getElementById("count");
var planReady=false;
function render(){
  renderPlan();
  const pm=tod==="party";
  document.getElementById("ctrlrow").hidden=pm;document.getElementById("actfilters").hidden=pm;
  if(pm){document.getElementById("estnote").hidden=true;const t={yes:0,maybe:0,no:0}; A.forEach(a=>{const v=picks[slug(a[0])]; if(v) t[v]++;});document.getElementById("tally").innerHTML=tallyHTML(t);renderParties();return;}
  const real=hasReal();
  // the "best guess" note rides on the count line now, to keep acts on the first screen
  document.getElementById("estnote").hidden=true;
  updSum();
  const qHit=a=>(a[0]+" "+a[2]).toLowerCase().includes(q);
  let list=A.map((a,i)=>[a,i+1,when(a)]).filter(([a,,w])=>
    (tod==="all"||w.k===tod)&&(stageF==="all"||w.st.stage===stageF)&&(genre==="all"||a[1]===genre)&&(!gemsOnly||a[5].includes("gem"))&&(!q||qHit(a))
    &&(pickF==="all"||(pickF==="none"?!picks[slug(a[0])]:picks[slug(a[0])]===pickF)));
  if(tod!=="all"||stageF!=="all") list.sort((x,y)=>(x[2].st.start||"99").localeCompare(y[2].st.start||"99"));
  const t={yes:0,maybe:0,no:0}; A.forEach(a=>{const v=picks[slug(a[0])]; if(v) t[v]++;});
  document.getElementById("tally").innerHTML=tallyHTML(t);
  count.textContent=`${DAYS[day].name}${stageF!=="all"?" · "+STAGE_NAMES[stageF]:""}: showing ${list.length} of ${A.length} acts`+(tod!=="all"||stageF!=="all"?", in time order":"")+(real?"":" · ~ = best-guess time");
  const clash=goingClashes();
  // acts on the other two days whose name matches the search: "David Guetta plays Friday, tap to jump"
  const plain=t=>t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  const elsewhere=q?Object.keys(DAYS).filter(d=>d!==day).flatMap(d=>DAYS[d].list.filter(a=>plain(a[0]).includes(plain(q))).map(a=>[d,a])).slice(0,6):[];
  const jumps=elsewhere.length?`<div class="jumps">${elsewhere.map(([d,a])=>`<button type="button" class="jump" data-jd="${d}" data-ja="${slug(a[0])}"><span><b>${a[0]}</b> plays ${DAYS[d].name}</span><span class="jump-go">tap to jump</span></button>`).join("")}</div>`:"";
  grid.innerHTML=list.length?list.map(([a,n,w])=>{
    const g=G[a[1]], f=a[5];
    const sc=STAGE_COL[w.st.stage]||"#c9b8ff";
    const when2=`<div class="when2"><span>${w.k==="aft"?SUN_ICO:MOON_ICO} ${(w.real?"":"~")+fmt(w.st.start)+(w.real&&w.st.end?" to "+fmt(w.st.end):"")}</span>${w.st.stage?`<span class="sdot" style="--sc:${sc}"><i aria-hidden="true"></i>${STAGE_NAMES[w.st.stage]||w.st.stage}</span>`:""}${w.real?"":'<span class="sr">(estimated)</span>'}</div>`;
    const tags=`<span class="tag">${a[2]}</span>`+(f.includes("sun")?`<span class="tag sun">${SUNSET_ICO} Sunset set</span>`:"")+(f.includes("gem")?`<span class="tag gem">${GEM_ICO} Discovery</span>`:"")+(f.includes("guess")?'<span class="tag guess">Genre best guess</span>':"");
    const parts=a[0].split(" B2B ");
    const links=a[4].map((t,i)=>{const who=a[4].length>1?(parts[i]||t):a[0];return `<a class="yt" data-act="${slug(a[0])}" data-who="${who}" href="${url(t)}" target="_blank" rel="noopener" aria-label="${who} on YouTube Music (opens new tab)">${ytIcon}</a><a class="sp" data-act="${slug(a[0])}" data-who="${who}" href="${spUrl(t)}" target="_blank" rel="noopener" aria-label="${who} on Spotify (opens new tab)">${spIcon}</a>`;}).join("");
    const id=slug(a[0]), v=picks[id]||"";
    const vote=`<div class="vote" role="group" aria-label="Rate ${a[0]}">${[["yes",CHECK_ICO,"Going"],["maybe",MAYBE_ICO,"Maybe"],["no",X_ICO,"Skip"]].map(([k,e,l])=>`<button data-id="${id}" data-v="${k}" data-label="${a[0]}" aria-pressed="${v===k}"><span class="vk-i" aria-hidden="true">${e}</span><span class="vk-l">${l}</span></button>`).join("")}</div>`;
    const op=expanded.has(id), lo=listening.has(id), cl=clash[id];
    const clashChip=cl&&cl.length?`<p class="cclash">${CLASH_ICO} Clashes with ${cl.join(", ")}</p>`:"";
    return `<article class="card${v?" is-"+v:""}${op?" open":""}${lo?" listen":""}" style="--g:${g.hex}"><div class="top"><h3 class="name">${a[0]}</h3><span class="rank" aria-label="Billing rank ${n}">#${n}</span></div>${when2}<div class="gv"><div class="tags">${tags}</div><p class="vibe">${a[3]}</p></div>${clashChip}<div class="actions">${vote}<button class="lbtn" type="button" data-l="${id}" aria-expanded="${lo}" aria-label="Listen to ${a[0]}">${PLAY_ICO}</button><div class="links">${links}</div><button class="xbtn" data-x="${id}" aria-expanded="${op}" aria-label="More about ${a[0]}">▾</button></div></article>`;
  }).filter(Boolean).map((h,i)=>i===2&&quizCta()?h+quizCta():h).join("")+jumps
  :jumps?`<p class="empty jump-h">No "${escH(qEl.value.trim())}" on ${DAYS[day].name}.</p>`+jumps
  :`<div class="empty">No acts match${q?` "${escH(qEl.value.trim())}" on any day`:""}. <button type="button" class="linkish" data-clear="all">Clear filters</button></div>`;
}

// Afterparties (researched Oct 25, 2026). Official = Insomniac-run.
const PGM=mapsHref;
const VENUE_COL={hotel:"#ff4fb4",van:"#a874ff",ant:"#3fe0ff"};
const PARTIES={};
for(const d in PARTY_DATA.parties) PARTIES[d]=PARTY_DATA.parties[d].map(p=>({...p,col:VENUE_COL[p.id.split("-").pop()]||"#c9b8ff"}));
function partyCard(pt){
  const v=picks[pt.id]||"";
  const vote=`<div class="vote" role="group" aria-label="Rate ${pt.name}">${[["yes",CHECK_ICO,"Going"],["maybe",MAYBE_ICO,"Maybe"],["no",X_ICO,"Skip"]].map(([k,e,l])=>`<button data-id="${pt.id}" data-v="${k}" data-label="${pt.name}" aria-pressed="${v===k}">${e} ${l}</button>`).join("")}</div>`;
  const onMain=n=>A.some(a=>a[0].toLowerCase().includes(n.toLowerCase()));
  const acts=pt.acts.map(n=>`<a data-pk="artist" data-pid="${pt.id}" data-artist="${n}" class="${onMain(n)?"main":""}" href="${url(n)}" target="_blank" rel="noopener" aria-label="${n} on YouTube Music (opens new tab)">${n}</a>`).join("")+(pt.more?'<a data-pk="more" data-pid="'+pt.id+'" href="'+pt.tix+'" target="_blank" rel="noopener">+ more</a>':"");
  return `<article class="pcard${v?" is-"+v:""}" style="--pc:${pt.col}"><div class="pt"><div><h3>${pt.venue.split(" · ")[0]}</h3><div class="sub">${pt.name.replace(/ ft\..*$/,"").replace(pt.venue.split(" · ")[0]+" ","")}</div></div><span class="badge${pt.official?"":" unoff"}">${pt.official?"Official":"Not official"}</span></div>
  <div class="meta"><span>${CLOCK_ICO} <b>${pt.time}</b></span><span>${PIN_ICO} <b>${pt.venue}</b></span><span class="addr">${pt.addr}</span><span>${TICKET_ICO} ${pt.price} · ${pt.age}</span></div>
  <div class="lineup">${acts}</div>${vote}
  <div class="btns"><a class="btn" data-pk="tickets" data-pid="${pt.id}" href="${pt.tix}" target="_blank" rel="noopener" aria-label="Tickets for ${pt.name} (opens new tab)">${TICKET_ICO} Tickets</a><a class="btn alt" data-pk="directions" data-pid="${pt.id}" href="${PGM(pt.addr)}"${MAP_OS==="android"?"":' target="_blank" rel="noopener"'} aria-label="Directions to ${pt.venue.split(" · ")[0]} (opens new tab)">${PIN_ICO} Directions</a></div></article>`;
}
function renderParties(){
  const list=PARTIES[day]||[];
  count.textContent=`${DAYS[day].name} night: ${list.length} afterparties. Outlined artists also play the festival. Tap a name to listen.`;
  let html=list.map(partyCard).join("");
  if(day==="fri") html+='<div class="thu">Thursday Nov 5 · Pre-parties</div>'+PARTIES.thu.map(partyCard).join("");
  html+=builtBy("afterparties").replace('class="builtby"','class="builtby" style="grid-column:1/-1"');
  html+='<p class="pnote" style="grid-column:1/-1">Hotel EDC passes cover the Hotel EDC parties only; afterparty shuttles are sold separately on the <a href="https://orlando.edc.com/tickets/afterparties/" target="_blank" rel="noopener" style="color:var(--cyan)">official afterparties page</a>. Anthem is an independent party, not run by EDC.</p>';
  grid.innerHTML=html;
}

// quick-start intro, shown once
const introEl=document.getElementById("intro");
let introReturn=null;
const introSheet=sheet(introEl,{onDismiss:()=>closeIntro()});
function openIntro(source="first_open"){introReturn=document.activeElement;introSheet.open();introEl.querySelector(".intro-card").focus();track("edc_intro_shown",{source});}
function closeIntro(){introSheet.close();if(introReturn&&introReturn.focus) introReturn.focus();try{localStorage.setItem("edc-intro-seen","1")}catch(e){}track("edc_intro_dismissed");}
let introSeen=false; try{introSeen=localStorage.getItem("edc-intro-seen")==="1"}catch(e){}
if(!introSeen) openIntro();
document.getElementById("introGo").onclick=closeIntro;
introEl.addEventListener("keydown",e=>{if(e.key==="Escape") closeIntro();});
if(window.edcTrackMsg){ const t=document.createElement("p"); t.className="toast"; t.setAttribute("role","status"); t.textContent=window.edcTrackMsg; document.body.appendChild(t); setTimeout(()=>t.remove(),5000); }

// add to home screen: a step in Quick start and a small bar on every open in a phone browser (Oct 26).
// Never shown inside the home-screen app or on a computer. The X hides it until the next open.
const isStandalone=!!(window.matchMedia&&matchMedia("(display-mode: standalone)").matches)||navigator.standalone===true;
const isIOS=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
const isAndroid=/Android/.test(navigator.userAgent);
const a2hsBar=document.getElementById("a2hs"), a2hsDlg=document.getElementById("a2hsDlg");
let installPrompt=null;
const A2HS_STEPS=isIOS?[
  "Open this page in <b>Safari</b>.",
  "Tap <b>Share</b>, the square with an up arrow. On newer iPhones it sits inside the <b>&bull;&bull;&bull;</b> menu.",
  "Tap <b>Add to Home Screen</b>, then <b>Add</b>."
]:[
  "Open this page in <b>Chrome</b>.",
  "Tap the <b>three dots</b> menu at the top right.",
  "Tap <b>Add to Home screen</b> or <b>Install app</b>, then <b>Install</b>."
];
function a2hsShort(){ return isIOS?"Tap <b>Share</b>, then <b>Add to Home Screen</b>.":"Tap the <b>three dots</b>, then <b>Add to Home screen</b>."; }
function hideA2hsBar(){ a2hsBar.hidden=true; document.body.classList.remove("has-a2hs"); }
if(!isStandalone&&(isIOS||isAndroid)){
  document.getElementById("introA2hs").hidden=false;
  document.querySelectorAll(".a2hs-box").forEach(b=>b.hidden=false);
  document.getElementById("introA2hsSteps").innerHTML=a2hsShort();
  document.getElementById("a2hsSteps").innerHTML=A2HS_STEPS.map(s=>"<li>"+s+"</li>").join("");
  let hidden=false; try{hidden=sessionStorage.getItem("edc-a2hs-hidden")==="1"}catch(e){}
  if(!hidden){ a2hsBar.hidden=false; document.body.classList.add("has-a2hs"); track("edc_a2hs_bar_shown",{platform:isIOS?"ios":"android"}); }
}
// Android Chrome can show its own install box; when it offers one, How opens that instead of the steps
window.addEventListener("beforeinstallprompt",e=>{ e.preventDefault(); installPrompt=e; });
window.addEventListener("appinstalled",()=>{ installPrompt=null; hideA2hsBar(); });
let a2hsReturn=null;
const a2hsSheet=sheet(a2hsDlg,{onDismiss:()=>closeA2hs()});
function closeA2hs(){ a2hsSheet.close(); if(a2hsReturn&&a2hsReturn.focus) a2hsReturn.focus(); }
async function openA2hs(where){
  if(installPrompt){
    const p=installPrompt; installPrompt=null; p.prompt();
    try{ const r=await p.userChoice; track("edc_a2hs_prompt",{outcome:r.outcome}); if(r.outcome==="accepted") hideA2hsBar(); }catch(e){}
    return;
  }
  a2hsReturn=document.activeElement; a2hsSheet.open(); a2hsDlg.querySelector(".intro-card").focus();
  track("edc_a2hs_steps_opened",{platform:isIOS?"ios":"android",where});
}
document.getElementById("a2hsHow").onclick=()=>openA2hs("banner");
// other "How" buttons (My Plan footer, Made by Graham sheet) open the same steps
document.addEventListener("click",e=>{const b=e.target.closest("[data-a2hs]"); if(b) openA2hs(b.dataset.a2hs);});
document.getElementById("a2hsGo").onclick=closeA2hs;
a2hsDlg.addEventListener("keydown",e=>{if(e.key==="Escape") closeA2hs();});
document.getElementById("a2hsX").onclick=()=>{ hideA2hsBar(); try{sessionStorage.setItem("edc-a2hs-hidden","1")}catch(e){} track("edc_a2hs_bar_hidden"); };

// sticky bar: filter panel, filter summary, compact view
const ftog=document.getElementById("ftoggle"), panel=document.getElementById("actfilters"), vtog=document.getElementById("vtoggle");
const expanded=new Set(), listening=new Set();
let panelOpen=false;
const panelH=spring(0,h=>{panel.style.height=h+"px";},{preset:SPRING.snappy});
ftog.onclick=()=>{
  panelOpen=!panelOpen; ftog.setAttribute("aria-expanded",panelOpen);
  const from=panel.classList.contains("open")?panel.getBoundingClientRect().height:0;
  panel.classList.add("open"); panel.style.overflow="hidden";
  panel.style.height=""; const full=Math.min(panel.scrollHeight,innerHeight*.55);
  if(!panelH.moving) panelH.set(from);
  if(panelOpen) panelH.to(full,{preset:SPRING.snappy,done:()=>{panel.style.height="";panel.style.overflow="";}});
  else panelH.to(0,{preset:SPRING.smooth,done:()=>{panel.classList.remove("open");panel.style.height="";panel.style.overflow="";}});
  track("edc_filters_panel",{open:panelOpen});
};
// active filters as removable chips under the sticky bar; the Filters button shows how many
const fchips=document.getElementById("fchips");
function updSum(){
  const c=[];
  if(stageF!=="all") c.push(["stage",STAGE_NAMES[stageF]]);
  if(genre!=="all") c.push(["genre",G[genre].label]);
  if(gemsOnly) c.push(["gems","Discovery only"]);
  if(pickF!=="all") c.push(["pick",{yes:"Going",maybe:"Maybe",no:"Skip",none:"Not rated"}[pickF]]);
  if(q) c.push(["q",'"'+qEl.value.trim()+'"']);
  document.getElementById("fsum").textContent=c.length?String(c.length):"";
  ftog.setAttribute("aria-label",c.length?`Filters, ${c.length} active`:"Filters");
  fchips.hidden=!c.length;
  fchips.innerHTML=c.map(([k,l])=>`<button type="button" class="fchip" data-clear="${k}" aria-label="Remove filter ${escH(l)}">${escH(l)} ${X_ICO}</button>`).join("")+(c.length>1?'<button type="button" class="fchip all" data-clear="all">Clear all</button>':"");
}
function clearFilter(k){
  if((k==="stage"||k==="all")&&stageF!=="all") setStage("all");
  if((k==="genre"||k==="all")&&genre!=="all") setGenre("all");
  if((k==="gems"||k==="all")&&gemsOnly) gemB.click();
  if((k==="pick"||k==="all")&&pickF!=="all") pf[pickF].click();
  if(k==="q"||k==="all"){ qEl.value=""; q=""; }
  render(); track("edc_filter_chip_remove",{type:k});
}
document.addEventListener("click",e=>{const b=e.target.closest("[data-clear]"); if(b&&(fchips.contains(b)||grid.contains(b))) clearFilter(b.dataset.clear);});
let compact=window.matchMedia("(max-width:600px)").matches;
try{const c=localStorage.getItem("edc-compact");if(c!==null)compact=c==="1";}catch(e){}
function setCompact(c){compact=c;grid.classList.toggle("compact",c);vtog.setAttribute("aria-checked",String(!c));document.getElementById("vtState").textContent=c?"Off":"On";try{localStorage.setItem("edc-compact",c?"1":"0")}catch(e){}trackContext({compact:c});}
setCompact(compact);
vtog.onclick=()=>{setCompact(!compact);render();track("edc_view_toggle",{compact,details:!compact});};
// compact cards: the play button shows the YouTube Music / Spotify links; search jumps go to the other day
grid.addEventListener("click",e=>{
  const l=e.target.closest(".lbtn");
  if(l){const id=l.dataset.l, card=l.closest(".card"), on=!listening.has(id); on?listening.add(id):listening.delete(id);
    card.classList.toggle("listen",on); l.setAttribute("aria-expanded",String(on)); track("edc_listen_open",{...actProps(id),open:on}); return;}
  const j=e.target.closest(".jump");
  if(j){const from=day, act=j.dataset.ja; setDay(j.dataset.jd);
    const c=[...grid.querySelectorAll(".card")].find(c=>slug(c.querySelector(".name").textContent)===act);
    if(c){c.scrollIntoView({block:"center",behavior:reducedMotion()?"auto":"smooth"}); c.classList.add("flash"); setTimeout(()=>c.classList.remove("flash"),1600);}
    track("edc_search_jump",{from_day:from,to_day:j.dataset.jd,act:j.querySelector("b").textContent}); return;}
});
grid.addEventListener("click",e=>{const x=e.target.closest(".xbtn");if(!x)return;const id=x.dataset.x;if(expanded.has(id))expanded.delete(id);else expanded.add(id);const card=x.closest(".card");
  const from=card.getBoundingClientRect().height; card.style.height="";
  card.classList.toggle("open"); const open=card.classList.contains("open"); x.setAttribute("aria-expanded",open);
  const to=card.getBoundingClientRect().height;
  card._h=card._h||spring(from,h=>{card.style.height=h+"px";},{preset:SPRING.snappy});
  card._r=card._r||spring(open?0:180,a=>{x.style.transform="rotate("+a+"deg)";},{preset:SPRING.bouncy,precision:.5});
  card.style.overflow="hidden"; if(!card._h.moving) card._h.set(from);
  card._h.to(to,{done:()=>{card.style.height="";card.style.overflow="";}}); card._r.to(open?180:0);session.expands++;track("edc_card_expand",{...actProps(id),open:card.classList.contains("open")});});

// sliding highlight behind the selected option of a switch: one pill springs to whichever option is
// pressed, and changes course if another is tapped mid-glide (like iOS segmented controls)
function segPill(seg){
  const pill=document.createElement("span"); pill.className="seg-pill"; pill.setAttribute("aria-hidden","true");
  seg.prepend(pill); seg.classList.add("has-pill");
  const r={x:0,y:0,w:0,h:0};
  const paint=()=>{pill.style.transform="translate3d("+r.x+"px,"+r.y+"px,0)";pill.style.width=r.w+"px";pill.style.height=r.h+"px";};
  const sp={}; for(const k in r) sp[k]=spring(0,v=>{r[k]=v;paint();},{preset:SPRING.snappy});
  let placed=false;
  const move=(instant)=>{const b=seg.querySelector('button[aria-pressed="true"]'); if(!b||!b.offsetWidth) return;
    const t={x:b.offsetLeft,y:b.offsetTop,w:b.offsetWidth,h:b.offsetHeight};
    for(const k in t){ if(instant||!placed) sp[k].set(t[k]); else sp[k].to(t[k]); } placed=true;};
  new ResizeObserver(()=>move(true)).observe(seg);
  document.fonts&&document.fonts.ready.then(()=>move(true));
  return move;
}
const dayPill=segPill(document.getElementById("days")), timePill=segPill(document.getElementById("times")), planPill=segPill(document.getElementById("planDays"));

// day + time-of-day tabs
function setDay(d){
  day=d; A=DAYS[d].list; document.body.dataset.day=d;
  document.querySelectorAll(".seg.days button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.d===d)); dayPill(); planPill();
  document.getElementById("nacts").textContent=A.length;
  document.getElementById("mixh").innerHTML=`<span>${DAYS[d].name}'s</span> <span>sound</span>`;
  syncTopMap();
  try{localStorage.setItem("edc-day",d)}catch(e){}
  drawMix(); render();
  trackContext({day:d}); track("edc_day_tab",{day:d});
}
document.querySelectorAll(".seg.days button").forEach(b=>b.onclick=()=>setDay(b.dataset.d));
document.querySelectorAll("#times button").forEach(b=>b.onclick=()=>{tod=b.dataset.t;document.querySelectorAll("#times button").forEach(x=>x.setAttribute("aria-pressed",x===b));timePill();render();track("edc_filter",{type:"time",value:tod});});
// open on today during the festival (dates from lineup.json), otherwise the last day this phone used
let saved="sat"; try{saved=localStorage.getItem("edc-day")||"sat"}catch(e){}
const todayKey=Object.keys(DAYS).find(d=>LINEUP.days[d].date===orlandoNow().ymd);
setDay(todayKey||(DAYS[saved]?saved:"sat"));


// grounds map (schematic of the official 2026 layout, redrawn Oct 28)
const STG=MAP_DATA.stages;
function mapSVG(uid){
  // each stage dot sends out a soft pulse ring so the stages are easy to spot (Graham asked, Oct 28; still under Reduce Motion)
  const st=STG.map((t,i)=>`<g class="stg" data-s="${t.id}" tabindex="0" role="button" aria-label="${t.name}, ${t.d.split(/[.,]/)[0]}"><circle cx="${t.x}" cy="${t.y}" r="36" fill="transparent" pointer-events="all"/><circle class="pulse" cx="${t.x}" cy="${t.y}" r="17" fill="none" stroke="${t.color}" stroke-width="3" style="animation-delay:${(i*.55).toFixed(2)}s" aria-hidden="true"/><circle class="ring" cx="${t.x}" cy="${t.y}" r="17" fill="${t.color}" fill-opacity=".25" stroke="${t.color}" stroke-width="2"/><circle cx="${t.x}" cy="${t.y}" r="9" fill="${t.color}"/><text x="${t.lx}" y="${t.ly}" text-anchor="${t.a||"middle"}" font-family="Unbounded, Arial Black, sans-serif" font-weight="700" font-size="13" fill="#f6f1ff" stroke="#120a2e" stroke-width="3" paint-order="stroke">${t.name}</text></g>`).join("");
  const lbl=(x,y,t,o="")=>`<text x="${x}" y="${y}" ${o} font-family="Figtree, sans-serif" font-weight="700" font-size="11" fill="#c9b8ff">${t}</text>`;
  const aid=(x,y)=>`<g aria-hidden="true"><circle cx="${x}" cy="${y}" r="11" fill="#ff3b5c" stroke="#fff" stroke-width="1.5"/><path d="M${x-5} ${y}h10M${x} ${y-5}v10" stroke="#fff" stroke-width="3" stroke-linecap="round"/></g>`;
  const ico=(x,y,p,t)=>`<g><circle cx="${x}" cy="${y}" r="11" fill="#120a2e" stroke="#c9b8ff" stroke-width="1.2"/><g transform="translate(${x-7},${y-7}) scale(.58)" fill="none" stroke="#f6f1ff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${p}</g>${t?`<text x="${x}" y="${y+24}" text-anchor="middle" font-family="Figtree, sans-serif" font-weight="700" font-size="10" fill="#f6f1ff">${t}</text>`:""}</g>`;
  const P_CAR='<path d="M4 16V11l2-5h12l2 5v5"/><path d="M4 16h16M7 16v2M17 16v2"/><circle cx="7.5" cy="14" r=".8" fill="#f6f1ff" stroke="none"/><circle cx="16.5" cy="14" r=".8" fill="#f6f1ff" stroke="none"/>';
  const P_BUS='<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M3 11h18M7 17v2M17 17v2"/><circle cx="7.5" cy="14" r=".8" fill="#f6f1ff" stroke="none"/><circle cx="16.5" cy="14" r=".8" fill="#f6f1ff" stroke="none"/>';
  const P_SPARKLE='<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>';
  const P_DROP='<path d="M12 3s7 7.5 7 12a7 7 0 1 1-14 0c0-4.5 7-12 7-12Z"/>';
  const P_REST='<circle cx="12" cy="6" r="3"/><path d="M7 21l2-9h6l2 9M9 12V9h6v3"/>';
  const P_FOOD='<path d="M7 3v7a2 2 0 0 0 4 0V3M9 10v11"/><path d="M16 21V3c-2 1.5-3 4-3 7h3"/>';
  // the drawing (Oct 28, Graham: "a little more graphic" without taking over from the music): tinted crowd
  // areas behind each stage, the lake with Daisy Lane crossing it, walkways, the Ferris wheel, food spots,
  // water stations with their tap counts, daisies in Daisy Fields and trees in Pixel Forest
  const GROUND="20,40 265,40 265,108 527,108 527,172 489,172 489,236 448,236 448,330 278,330 272,378 200,368 115,355 47,318 20,290";
  const zone=(id,shape)=>{const t=STG.find(x=>x.id===id); return shape.replace("/>",` fill="${t.color}" fill-opacity=".16" stroke="${t.color}" stroke-opacity=".45" stroke-width="1.5" stroke-dasharray="4 4"/>`);};
  const walk=(dd,col,w=10)=>`<path d="${dd}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" opacity=".5"/><path d="${dd}" fill="none" stroke="#f6f1ff" stroke-width="1.2" stroke-dasharray="3 5" stroke-linecap="round" opacity=".55"/>`;
  const tree=(x,y)=>`<circle cx="${x}" cy="${y}" r="6" fill="#3ec27a" opacity=".85"/><circle cx="${x-2}" cy="${y-2}" r="2.5" fill="#7dff9b" opacity=".7"/>`;
  const daisy=(x,y)=>`<g transform="translate(${x} ${y})">${[0,60,120,180,240,300].map(r=>`<ellipse rx="1.8" ry="4" cy="-3.6" fill="#f6f1ff" transform="rotate(${r})"/>`).join("")}<circle r="2" fill="#ffd166"/></g>`;
  const taps=(x,y,n)=>`<g>${ico(x,y,P_DROP,"")}<circle cx="${x+11}" cy="${y-10}" r="8.5" fill="#3fe0ff" stroke="#120a2e" stroke-width="1.2"/><text x="${x+11}" y="${y-6.8}" text-anchor="middle" font-family="Figtree, sans-serif" font-weight="800" font-size="9" fill="#120a2e">${n}</text></g>`;
  const food=(x,y)=>`<g><circle cx="${x}" cy="${y}" r="10" fill="#ff7a59" stroke="#120a2e" stroke-width="1.2"/><g transform="translate(${x-6.5},${y-6.5}) scale(.54)" fill="none" stroke="#120a2e" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${P_FOOD}</g></g>`;
  const wheel=(x,y)=>`<g aria-hidden="true"><path d="M${x-8} ${y+19}L${x} ${y}L${x+8} ${y+19}" fill="none" stroke="#c9b8ff" stroke-width="2" stroke-linecap="round"/><circle cx="${x}" cy="${y}" r="12" fill="none" stroke="#ffb627" stroke-width="2"/>${[0,45,90,135].map(r=>`<path d="M${x-12} ${y}H${x+12}" stroke="#ffb627" stroke-width="1" opacity=".8" transform="rotate(${r} ${x} ${y})"/>`).join("")}${[0,60,120,180,240,300].map(r=>`<circle cx="${x+12*Math.cos(r*Math.PI/180)}" cy="${y+12*Math.sin(r*Math.PI/180)}" r="2.2" fill="#ff4fb4"/>`).join("")}<circle cx="${x}" cy="${y}" r="2" fill="#ffb627"/></g>`;
  return `<svg viewBox="0 0 545 420" role="group" aria-label="Map of EDC Orlando grounds at Tinker Field, 2026 layout. Stages are buttons.">
  <defs><linearGradient id="gf${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a1d78"/><stop offset="1" stop-color="#1c3f73"/></linearGradient>
  <linearGradient id="rr${uid}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff4fb4"/><stop offset=".35" stop-color="#ffb627"/><stop offset=".7" stop-color="#7dff9b"/><stop offset="1" stop-color="#3fe0ff"/></linearGradient>
  <radialGradient id="lk${uid}" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#5fd0ff"/><stop offset="1" stop-color="#2a6fd6"/></radialGradient>
  <clipPath id="cp${uid}"><polygon points="${GROUND}"/></clipPath></defs>
  <polygon points="${GROUND}" fill="url(#gf${uid})" stroke="#ff4fb4" stroke-width="3" stroke-linejoin="round"/>
  <g clip-path="url(#cp${uid})">
  ${zone("circuit",'<ellipse cx="78" cy="92" rx="56" ry="48"/>')}
  ${zone("stereo",'<ellipse cx="84" cy="258" rx="42" ry="32"/>')}
  ${zone("kinetic",'<rect x="296" y="176" width="190" height="132" rx="26"/>')}
  ${zone("neon",'<ellipse cx="486" cy="140" rx="40" ry="30"/>')}
  ${zone("bacardi",'<circle cx="207" cy="354" r="24"/>')}
  <path d="M138 262 C150 244 182 240 206 250 C226 258 224 286 214 302 C202 318 168 322 150 312 C134 302 128 278 138 262 Z" fill="url(#lk${uid})" opacity=".85"/>
  <path d="M150 270 q8 -5 16 0 M176 290 q8 -5 16 0 M158 300 q7 -4 14 0" stroke="#bff0ff" stroke-width="1.2" fill="none" opacity=".7"/>
  </g>
  <rect x="185" y="46" width="58" height="92" rx="10" fill="#3a2a8a" stroke="#7d6cd9" stroke-width="1.5"/>
  ${lbl(214,64,"Grandstand",'text-anchor="middle" font-size="9.5"')}
  ${walk("M285 166 L452 166","#3fe0ff")}
  ${walk("M165 236 L276 211","url(#rr"+uid+")")}
  ${walk("M162 230 L222 312","#ff7a59",8)}
  ${walk("M214 318 L290 294 L318 280","#7dff9b")}
  ${walk("M60 312 L150 346","#a874ff")}
  ${tree(70,200)}${tree(84,210)}${tree(112,198)}${tree(126,208)}${tree(98,214)}${tree(124,232)}${tree(132,320)}
  ${daisy(224,268)}${daisy(238,276)}${daisy(252,268)}${daisy(266,276)}${daisy(232,286)}
  ${wheel(320,138)}
  ${lbl(395,184,"Power Path")}
  ${lbl(200,222,"Rainbow Road",'transform="rotate(-13 200 222)" text-anchor="middle"')}
  ${lbl(172,252,"Daisy Lane",'transform="rotate(54 172 252)" fill="#f6f1ff"')}
  ${lbl(254,302,"Kinetic Trail",'transform="rotate(-17 254 302)" text-anchor="middle"')}
  ${lbl(92,322,"Pixel Path",'transform="rotate(21 92 322)" text-anchor="middle"')}
  ${lbl(382,128,"Rainbow Bazaar",'text-anchor="middle"')}
  ${lbl(98,188,"Pixel Forest",'text-anchor="middle"')}
  ${lbl(214,156,"Kandi Casino",'text-anchor="middle"')}
  ${lbl(248,252,"Daisy Fields",'text-anchor="middle"')}
  ${lbl(140,30,"W Church St",'text-anchor="middle"')}
  ${lbl(10,170,"S Tampa Ave",'transform="rotate(-90 10 170)" text-anchor="middle"')}
  ${lbl(395,350,"W Anderson St")}
  ${lbl(470,285,"S Nashville Ave",'transform="rotate(-90 470 285)" text-anchor="middle"')}
  ${lbl(80,384,"State Road 408",'transform="rotate(25 80 384)" text-anchor="middle"')}
  <path d="M442 66 L442 100" stroke="#ffb627" stroke-width="10" stroke-linecap="round"/><path d="M429 88 L442 104 L455 88" stroke="#ffb627" stroke-width="5" fill="none" stroke-linecap="round"/>
  <text x="442" y="56" text-anchor="middle" font-family="Unbounded, Arial Black, sans-serif" font-weight="800" font-size="13" fill="#ffb627">ENTRANCE</text>
  ${ico(296,314,P_CAR,"Lyft")}${ico(334,314,P_BUS,"Shuttle")}${ico(378,314,P_SPARKLE,"SkyDeck")}
  ${taps(50,232,40)}${taps(252,356,64)}${ico(156,82,P_DROP,"")}
  ${food(156,109)}${food(298,120)}${food(302,196)}${food(452,198)}
  ${["156,56","418,206","510,160","430,290"].map(c=>{const [x,y]=c.split(",").map(Number);return ico(x,y,P_REST,"");}).join("")}${aid(40,165)}${aid(466,120)}
  <g transform="translate(515 395)"><circle r="14" fill="#120a2e" stroke="#ff4fb4" stroke-width="2"/><text y="5" text-anchor="middle" font-family="Unbounded, sans-serif" font-weight="800" font-size="13" fill="#f6f1ff">N</text></g>
  ${st}</svg>`;
}
document.querySelectorAll(".gmap:not(.gmap-top)").forEach((box,i)=>{
  box.querySelector(".svgwrap").innerHTML=mapSVG(i);
  const info=box.querySelector(".ginfo");
  const pick=id=>{const t=STG.find(x=>x.id===id);box.querySelectorAll(".stg").forEach(g=>g.classList.toggle("on",g.dataset.s===id));info.style.setProperty("--sc",t.color);const acts=A.map(a=>[a,when(a)]).filter(([,w])=>w.st.stage===id).sort((x,y)=>x[1].st.start.localeCompare(y[1].st.start));const real=acts.some(([,w])=>w.real);info.innerHTML=`<b>${t.name}</b><br>${t.d}<br><span style="color:var(--amber)">${DAYS[day].name}, ${real?"official":"best-guess"} lineup here:</span><br>`+acts.map(([a,w])=>`${w.k==="aft"?SUN_ICO:MOON_ICO} ${fmt(w.st.start)} · ${a[0]}${({yes:" "+CHECK_ICO,maybe:" "+MAYBE_ICO,no:" "+X_ICO})[picks[slug(a[0])]]||""}`).join("<br>");track("edc_map_stage_click",{stage:id,where:"map_tab",day,acts:acts.length,going:acts.filter(([a])=>picks[slug(a[0])]==="yes").length});};
  box.querySelectorAll(".stg").forEach(g=>{g.addEventListener("click",()=>pick(g.dataset.s));g.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();pick(g.dataset.s);}});});
});

// "Made by Graham" (Oct 28): one quiet door, in the header or the top menu, opens one sheet with Graham's note,
// the tip jar, "I build apps", the Insomniac note, sharing, the festival vote and the next-year list. It replaced
// the floating "Show your love" and "Are you Insomniac?" pills, which covered content.
// contactEmail is Graham's PUBLIC address (never his personal Gmail); partnerLink, when it is an https link,
// takes over the Insomniac contact from the email.
const HEART_ICO=ico_('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/>');
const tipLinks=(CFG0.donateLinks||[]).filter(t=>t&&t.url&&t.label);
const mbgDlg=document.getElementById("mbgDlg");
let mbgReturn=null;
const mbgSheet=sheet(mbgDlg,{onDismiss:()=>closeMbg()});
function closeMbg(){ mbgSheet.close(); if(mbgReturn&&mbgReturn.focus) mbgReturn.focus(); }
// tip jar: one button per link in config.js in every .donate-row (Quick start, end of the lineup, footer, this sheet)
if(tipLinks.length){
  document.querySelectorAll(".tipbox").forEach(b=>b.hidden=false);
  document.querySelectorAll(".donate-row").forEach(row=>{row.innerHTML=tipLinks.map(t=>`<a class="btn donate donate-link" data-where="${row.dataset.where}" data-service="${escH(t.label)}" href="${escH(t.url)}" target="_blank" rel="noopener" aria-label="Leave a tip with ${escH(t.label)} (opens new tab)">${HEART_ICO} ${escH(t.label)}</a>`).join("");row.hidden=false;});
  document.getElementById("optTip").hidden=false;
}
if(hasEmail){
  const buildGo=document.getElementById("buildGo");
  buildGo.href=mailTo(BUILD_SUBJ); buildGo.setAttribute("aria-label","Let's talk: email Graham about an app");
  buildGo.addEventListener("click",()=>track("edc_build_contact",{where:"made_by_sheet"}));
  document.getElementById("optBuild").hidden=false;
}
// "Send me a note" (Oct 28): a note box in the sheet that posts to Graham's Google Form (noteForm in config.js) in the
// background, so nobody needs a mail app and nothing looks like Google. Notes written with no signal wait in
// localStorage and send by themselves when it comes back. Only yes/no facts are tracked, never the words.
// Without a form it falls back to the Oct 27 email (contactEmail).
const NF=CFG0.noteForm||{};
const hasNoteForm=/^https:\/\/docs\.google\.com\/forms\/d\/e\/[\w-]+\/formResponse$/.test(NF.url||"")&&NF.note;
const NOTE_Q="edc-note-queue";
const noteQ={get(){try{return JSON.parse(localStorage.getItem(NOTE_Q)||"[]");}catch{return [];}},set(q){try{q.length?localStorage.setItem(NOTE_Q,JSON.stringify(q)):localStorage.removeItem(NOTE_Q);}catch{}}};
// Google answers without CORS headers, so the reply can't be read; a rejected fetch (no network, 15 s timeout) means not sent
const postNote=n=>{
  const body=new URLSearchParams({[NF.note]:n.note}); if(NF.name&&n.name) body.set(NF.name,n.name); if(NF.email&&n.email) body.set(NF.email,n.email);
  const ac=new AbortController(), t=setTimeout(()=>ac.abort(),15000);
  return fetch(NF.url,{method:"POST",mode:"no-cors",body,signal:ac.signal}).finally(()=>clearTimeout(t));
};
let noteFlushing=false;
async function flushNotes(){
  if(!hasNoteForm||noteFlushing||!navigator.onLine) return;
  const q=noteQ.get(); if(!q.length) return;
  noteFlushing=true;
  try{ while(q.length){ await postNote(q[0]); q.shift(); noteQ.set(q); track("edc_note_sent",{queued:true}); } }catch{} finally{ noteFlushing=false; }
}
{
  const noteBtn=document.getElementById("noteBtn"), form=document.getElementById("noteForm"), done=document.getElementById("noteDone");
  const text=document.getElementById("noteText"), nm=document.getElementById("noteName"), em=document.getElementById("noteEmail");
  const err=document.getElementById("noteErr"), send=document.getElementById("noteSend"), sendT=document.getElementById("noteSendT");
  if(hasNoteForm){
    noteBtn.hidden=false; document.getElementById("noteAsk").hidden=false;
    noteBtn.addEventListener("click",()=>{ noteBtn.hidden=true; noteBtn.setAttribute("aria-expanded","true"); form.hidden=false; text.focus(); track("edc_note_click"); });
    form.addEventListener("input",()=>{ if(err.textContent) err.textContent=""; });
    document.getElementById("noteAgain").addEventListener("click",()=>{ done.hidden=true; form.hidden=false; text.focus(); });
    form.addEventListener("submit",async e=>{
      e.preventDefault();
      const n={note:text.value.trim(),name:nm.value.trim(),email:em.value.trim(),at:Date.now()};
      if(!n.note){ err.textContent="Write a few words first."; text.focus(); return; }
      if(n.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(n.email)){ err.textContent="That email doesn't look right. You can leave it empty."; em.focus(); return; }
      err.textContent=""; send.disabled=true; sendT.textContent="Sending...";
      let sent=false;
      if(navigator.onLine){ try{ await postNote(n); sent=true; }catch{} }
      if(!sent){ const q=noteQ.get(); q.push(n); noteQ.set(q); }
      track("edc_note_sent",{queued:!sent,name:!!n.name,email:!!n.email});
      text.value=""; send.disabled=false; sendT.textContent="Send to Graham";
      document.getElementById("noteDoneH").textContent=sent?"Got it, thank you!":"Saved, thank you!";
      document.getElementById("noteDoneP").firstChild.textContent=sent?"I read every note. ":"No signal right now. It sends by itself when you're back online. ";
      form.hidden=true; done.hidden=false; done.focus?.();
    });
    window.addEventListener("online",flushNotes);
    document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="visible") flushNotes(); });
    flushNotes();
  }else if(hasEmail){
    noteBtn.hidden=false; document.getElementById("noteAsk").hidden=false; noteBtn.setAttribute("aria-label","Send Graham a note by email");
    noteBtn.addEventListener("click",()=>{ track("edc_note_click"); location.href=mailTo("Your Festival Plan feedback","What I like about this app:\n\n"); });
  }
}
// "More about me" on the Made by Graham card (Oct 28): Graham's personal page, from config.js
{
  const me=CFG0.personalLink, a=document.getElementById("meLink");
  if(me&&/^https:\/\//.test(me)){ a.href=me; a.setAttribute("aria-label","More about Graham (opens new tab)"); a.hidden=false; }
}
// Insomniac (Oct 27): the note in the sheet and the boxed line in the footer
const cfgPartner=CFG0.partnerLink;
const partnerLink=cfgPartner&&/^https:\/\//.test(cfgPartner)?cfgPartner:hasEmail?mailTo("Insomniac x Your Festival Plan"):"";
if(partnerLink){
  const byMail=partnerLink.startsWith("mailto:");
  document.querySelectorAll(".partner-link").forEach(a=>{
    a.href=partnerLink;
    if(byMail){ a.removeAttribute("target"); a.setAttribute("aria-label",a.textContent.trim()+": email Graham"); }
    else{ a.target="_blank"; a.rel="noopener"; a.setAttribute("aria-label",a.textContent.trim()+": Graham's contact links (opens new tab)"); }
    a.addEventListener("click",()=>track("edc_ins_contact",{where:a.id==="insGo"?"made_by_sheet":"footer",by:byMail?"email":"link"}));
  });
  document.querySelectorAll(".partner-note").forEach(p=>p.hidden=false);
  document.getElementById("optIns").hidden=false;
  mbgDlg.querySelector(".mbg-more").addEventListener("toggle",e=>{ if(e.target.open) track("edc_ins_note_open"); });
}
// the card's fun (Oct 27): the big heart pops in on a spring and throws a burst of little hearts; tapping it throws
// more, and tapping a tip button turns the card into a thank-you
const loveArt=document.getElementById("loveArt"), loveBurstBox=mbgDlg.querySelector(".love-burst");
const LOVE_COLS=["#ff4fb4","#a874ff","#3fe0ff","#7dff9b","#ffb627","#ff7a59"];
const LOVE_HEART='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/></svg>';
function loveBurst(n){
  if(reducedMotion()) return;
  const a=loveArt.getBoundingClientRect();
  for(let i=0;i<n;i++){
    const h=document.createElement("span"), ang=Math.PI*(1.1+.8*Math.random()), dist=90+Math.random()*150;
    h.className="love-fly"; h.innerHTML=LOVE_HEART;
    h.style.cssText=`left:${a.left+a.width/2}px;top:${a.top+a.height/2}px;color:${LOVE_COLS[i%LOVE_COLS.length]};--x:${Math.cos(ang)*dist}px;--y:${Math.sin(ang)*dist-40}px;--r:${Math.random()*70-35}deg;--s:${.6+Math.random()*.7};animation-delay:${Math.random()*120}ms`;
    h.addEventListener("animationend",()=>h.remove()); loveBurstBox.append(h);
  }
}
function lovePop(){
  if(reducedMotion()) return;
  const p=spring(.55,s=>{loveArt.style.transform="scale("+s+")";},{preset:SPRING.bouncy,precision:.002});
  p.to(1,{velocity:2,done:()=>{loveArt.style.transform="";}});
}
const loveH=document.getElementById("loveH"), loveP=document.getElementById("loveNote"), loveSmall=document.getElementById("loveSmall"), loveX=document.getElementById("loveX");
const LOVE_TEXT=[loveH.innerHTML,loveP.innerHTML,loveSmall.textContent,loveX.textContent];
// tip amounts (Oct 27): $5 / $10 / $20 fill in each service's amountUrl; "Any" uses the plain link.
// Every .tip-amts group (this sheet, the tip moment card) drives the tip buttons in its own box.
function setTipAmount(box,v){
  box.querySelectorAll(".tip-amts button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.amt===v)));
  box.querySelectorAll(".donate-link").forEach(a=>{
    const t=tipLinks.find(x=>x.label===a.dataset.service), fixed=v!=="any"&&t&&t.amountUrl;
    if(!t) return;
    a.href=fixed?t.amountUrl.replace("{amount}",v):t.url; a.dataset.amount=v;
    a.innerHTML=`${HEART_ICO} ${escH(t.label)}${fixed?` <span class="tip-amt">$${v}</span>`:""}`;
    a.setAttribute("aria-label",`Leave a ${fixed?"$"+v+" ":""}tip with ${t.label} (opens new tab)`);
  });
}
function wireTipAmounts(box){
  const amts=box.querySelector(".tip-amts"); if(!amts||!tipLinks.some(t=>t.amountUrl)) return;
  amts.hidden=false; setTipAmount(box,"10");
  amts.addEventListener("click",e=>{ const b=e.target.closest("button[data-amt]"); if(!b) return; setTipAmount(box,b.dataset.amt); track("edc_tip_amount",{amount:b.dataset.amt,where:box.dataset.where||"made_by_sheet"}); });
}
wireTipAmounts(document.getElementById("optTip"));
loveArt.onclick=()=>{ lovePop(); loveBurst(12); track("edc_love_hearts"); };
mbgDlg.addEventListener("click",e=>{
  if(!e.target.closest(".donate-link")) return;
  loveH.innerHTML="You're the <span>best</span>"; loveP.innerHTML="<p>Thank you. You just <b class=\"hl-smile\">made my day</b>, and you're part of why I built this.</p><p>Come find the good <b class=\"hl-vibe\">vibes</b> on the dance floor. See you there.</p><p class=\"love-sig\">With love, Graham</p>";
  loveSmall.textContent="Your tip opened in a new tab."; loveX.textContent="Back to the app";
  mbgDlg.firstElementChild.scrollTo({top:0,behavior:reducedMotion()?"auto":"smooth"});
  lovePop(); loveBurst(20);
});
function openMbg(from){
  [loveH.innerHTML,loveP.innerHTML,loveSmall.textContent,loveX.textContent]=LOVE_TEXT;
  mbgReturn=document.activeElement; mbgSheet.open(); mbgDlg.querySelector(".intro-card").focus(); track("edc_made_by_open",{from});
  setTimeout(()=>{ lovePop(); loveBurst(14); },300);
}
window.openMbg=openMbg;
// the door is Graham's avatar in the top menu (Graham picked it over a pill in the header). It took the (i)
// button's place, so "How the app works" (Quick start) opens from the sheet now.
document.getElementById("doorBtn").onclick=()=>openMbg("menu");
document.getElementById("mbgHelp").onclick=()=>{ closeMbg(); setTimeout(()=>openIntro("help_button"),250); };
loveX.onclick=closeMbg;
// a close button pinned to the top of the sheet, so nobody has to scroll to the end to get back (Graham, Oct 28)
document.getElementById("mbgClose").onclick=()=>{ closeMbg(); track("edc_made_by_close",{how:"top_x"}); };
mbgDlg.addEventListener("keydown",e=>{if(e.key==="Escape") closeMbg();});
document.querySelectorAll(".builtby-slot").forEach(el=>{el.innerHTML=builtBy(el.dataset.where);});
document.addEventListener("click",e=>{const a=e.target.closest(".builtby-go"); if(a) track("edc_build_contact",{where:a.dataset.where});});

// tip moment (Oct 28, ask after value). Oct 28 evening, Graham: the popup that opened on the 5th Going pick
// interrupted picking and felt pushy. Now it is a card inside My Plan, under your plan, and nothing pops up:
// it shows when you open My Plan with picks, stays until "Not now" or a tip tap, and never shows on the Lineup.
const tipMoment=document.getElementById("tipMoment"), tmCard=tipMoment;
const TM_KEY="edc-tip-moment";
const tmGet=()=>{try{return localStorage.getItem(TM_KEY)||""}catch(e){return "done"}};
const tmSet=v=>{try{localStorage.setItem(TM_KEY,v)}catch(e){}};
wireTipAmounts(tmCard);
function maybeTipMoment(trigger){
  const st=tmGet(), has=Object.values(picks).some(x=>x==="yes"||x==="maybe");
  tipMoment.hidden=!tipLinks.length||!has||(st&&st!=="shown");
  if(!tipMoment.hidden&&!st){ tmSet("shown"); track("edc_tip_moment_shown",{trigger,going:Object.entries(picks).filter(([k,v])=>v==="yes"&&!k.startsWith("p-")).length}); }
}
function closeTipMoment(how){ tmSet("dismissed"); tipMoment.hidden=true; track("edc_tip_moment_closed",{how}); }
document.getElementById("tmX").onclick=()=>closeTipMoment("not_now");
tipMoment.addEventListener("click",e=>{ if(!e.target.closest(".donate-link")) return; tmSet("tipped"); setTimeout(()=>{ tipMoment.hidden=true; },500); });

// map at the top of the lineup: tap a stage and its acts show right below, in time order.
// It drives the same stage filter as the Filters panel, so both always agree. Tap the stage again for all.
function syncTopMap(){
  const box=document.getElementById("topMap"); if(!box) return;
  box.querySelectorAll(".stg").forEach(g=>{const on=g.dataset.s===stageF; g.classList.toggle("on",on); g.setAttribute("aria-pressed",String(on));});
  const h=document.getElementById("topMapH"), clr=document.getElementById("topMapClear");
  if(stageF==="all"){h.textContent="Tap a stage"; clr.hidden=true;}
  else{const n=A.filter(a=>when(a).st.stage===stageF).length; h.textContent=STAGE_NAMES[stageF]+" · "+n+" acts"; clr.hidden=false;}
  const t=document.getElementById("stagesTxt"); if(t) t.textContent=stageF==="all"?"Stages":STAGE_NAMES[stageF];
}
// Oct 28: acts come first, so the map folds into a "Stages" button that opens it (Graham picked this over
// putting the map under the list). Tapping a stage folds it away again and the list shows that stage.
{
  const box=document.getElementById("topMap"), sBtn=document.getElementById("stagesBtn");
  box.querySelector(".svgwrap").innerHTML=mapSVG("top");
  let mapOpen=false;
  const mapH=spring(0,h=>{box.style.height=h+"px";},{preset:SPRING.snappy});
  const setMap=(open,how)=>{
    if(open===mapOpen) return; mapOpen=open; sBtn.setAttribute("aria-expanded",String(open));
    const from=box.hidden?0:box.getBoundingClientRect().height;
    box.hidden=false; box.style.overflow="hidden"; box.style.height=""; const full=box.scrollHeight;
    if(!mapH.moving) mapH.set(from);
    if(open) mapH.to(full,{done:()=>{box.style.height="";box.style.overflow="";}});
    else mapH.to(0,{preset:SPRING.smooth,done:()=>{box.hidden=true;box.style.height="";box.style.overflow="";}});
    if(how) track("edc_stages_map",{open,how});
  };
  box.hidden=true;
  sBtn.onclick=()=>setMap(!mapOpen,"button");
  const pickTop=id=>{const k=stageF===id?"all":id; setStage(k); track("edc_map_stage_click",{stage:id,where:"lineup",selected:k!=="all",day}); if(k!=="all") setMap(false);};
  box.querySelectorAll(".stg").forEach(g=>{g.addEventListener("click",()=>pickTop(g.dataset.s));g.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();pickTop(g.dataset.s);}});});
  document.getElementById("topMapClear").onclick=()=>setStage("all");
  syncTopMap();
}

// My Plan: your Going picks (and Maybes) for the day in time order, with the stage to head to, clashes,
// and on festival days what's on now and next. Picks are shared, so both phones see the same plan.
const DAY_YMD={fri:"2026-11-06",sat:"2026-11-07",sun:"2026-11-08"};
const toMin=t=>{const [h,m]=t.split(":").map(Number);return h*60+m;};
function orlandoNow(){
  const p=Object.fromEntries(new Intl.DateTimeFormat("en-US",{timeZone:"America/New_York",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date()).map(x=>[x.type,x.value]));
  return {ymd:p.year+"-"+p.month+"-"+p.day,min:+p.hour*60+ +p.minute};
}
function renderPlan(){
  // render() runs once during load, before this section has been set up
  if(!planReady) return;
  if(document.body.dataset.view==="plan") maybeTipMoment("my_plan"); // picks can arrive after My Plan opens
  document.getElementById("planQr").hidden=!Object.values(picks).some(v=>v==="yes"||v==="maybe"||v==="no"); // QR button only once there are picks
  const listEl=document.getElementById("planList"); if(!listEl) return;
  const showMaybe=document.getElementById("planMaybe").checked;
  const items=A.map(a=>({a,id:slug(a[0]),v:picks[slug(a[0])],w:when(a)}))
    .filter(x=>x.v==="yes"||(showMaybe&&x.v==="maybe"))
    .sort((x,y)=>x.w.st.start.localeCompare(y.w.st.start));
  const end=x=>x.w.st.end?toMin(x.w.st.end):toMin(x.w.st.start)+60;
  const going=items.filter(x=>x.v==="yes");
  const cm=goingClashes(); going.forEach(x=>{x.clash=cm[x.id]||[];});
  const now=orlandoNow(), today=now.ymd===DAY_YMD[day];
  let nextFound=false;
  items.forEach(x=>{if(!today) return; const s=toMin(x.w.st.start);
    if(s<=now.min&&now.min<end(x)) x.now=true; else if(s>now.min&&!nextFound&&x.v==="yes"){x.next=true;nextFound=true;}});
  const parties=[...(PARTIES[day]||[]),...(day==="fri"?PARTIES.thu:[])].filter(p=>picks[p.id]==="yes"||(showMaybe&&picks[p.id]==="maybe"));
  const clashes=going.filter(x=>x.clash.length).length/2;
  const est=!items.some(x=>x.w.real);
  const nGo=going.length, nMaybe=items.length-nGo;
  document.getElementById("planSum").textContent=items.length
    ?DAYS[day].name+": "+nGo+" Going"+(showMaybe?", "+nMaybe+" Maybe":"")+(clashes?" · "+Math.ceil(clashes)+" clash"+(clashes>1?"es":""):"")+(est&&items.length?" · times are estimates":"")
    :"";
  if(!items.length&&!parties.length){
    renderPlanChips(items,parties,end); renderPlanTimeline(items,end); document.getElementById("planList").hidden=false; document.getElementById("planChips").hidden=!activeFriend();
    listEl.innerHTML='<li class="plan-empty"><b>Nothing planned for '+DAYS[day].name+' yet.</b> Tap <b>Going</b> or <b>Maybe</b> on acts in the Lineup and they line up here in time order.</li>';
    return;
  }
  // "Head to" only between sets you can actually walk between, not between two that clash
  let prevStage=null, prevEnd=0;
  const rows=items.map(x=>{
    const st=x.w.st, sc=STAGE_COL[st.stage]||"#c9b8ff", move=prevStage&&st.stage&&st.stage!==prevStage&&toMin(st.start)>=prevEnd;
    prevStage=st.stage||prevStage; prevEnd=Math.max(prevEnd,end(x));
    const time=(x.w.real?"":"~")+fmt(st.start)+(st.end?" to "+fmt(st.end):"");
    const flags=(x.now?'<span class="pf now">Playing now</span>':"")+(x.next?'<span class="pf next">Up next</span>':"")+(x.clash&&x.clash.length?'<span class="pf clash">Clashes with '+x.clash.join(", ")+'</span>':"");
    return (move?'<li class="plan-move" aria-hidden="true">Head to '+STAGE_NAMES[st.stage]+'</li>':"")+
      '<li class="plan-item is-'+x.v+(x.now?" is-now":"")+'" id="pi-'+x.id+'" style="--sc:'+sc+'"><div class="pt-time">'+time+(x.w.real?"":'<span class="sr"> (estimated)</span>')+'</div>'+
      '<div class="pt-body"><h2 class="pt-name">'+x.a[0]+'</h2><div class="pt-stage"><i aria-hidden="true"></i>'+(STAGE_NAMES[st.stage]||"Stage to be announced")+'<span class="pt-pick">'+(x.v==="yes"?"Going":"Maybe")+'</span></div>'+(flags?'<div class="pt-flags">'+flags+'</div>':"")+'</div></li>';
  }).join("");
  const after=parties.length?'<li class="plan-after">After the festival</li>'+parties.map(p=>'<li class="plan-item party is-'+picks[p.id]+'" style="--sc:'+p.col+'"><div class="pt-time">'+p.time+'</div><div class="pt-body"><h2 class="pt-name">'+p.venue.split(" · ")[0]+'</h2><div class="pt-stage"><i aria-hidden="true"></i>'+p.name.replace(/ ft\..*$/,"")+'<span class="pt-pick">'+(picks[p.id]==="yes"?"Going":"Maybe")+'</span></div></div></li>').join(""):"";
  listEl.innerHTML=rows+after;
  renderPlanChips(items,parties,end); renderPlanTimeline(items,end); showPlanMode();
}
// My Plan chips (Oct 28, Graham: the plan map "takes up too much room", keep "those small ones that are
// color-coded"): the day as rows of small chips in the stage colors, Going on the left and, next to each, the
// Maybes playing during that time on the right. Going acts that overlap share a row marked Clash; Maybes that
// overlap no Going act get a row of their own with "Free" on the left. The Details switch shows the big cards
// instead (remembered per phone, edc-plan-details). Tapping a chip opens the cards at that act.
// short forms to save room (Graham asked): "20:51" -> "8:51p", "22:00" -> "10p"; a B2B shows its first act + "+1"
const pmTime=t=>{const [h,m]=t.split(":").map(Number);return (h%12||12)+(m?":"+String(m).padStart(2,"0"):"")+(h<12?"a":"p");};
const pmName=n=>n.replace(/\s+(b2b|B2B|x|&)\s+.*$/,m=>" +"+(m.split(/\s+(?:b2b|B2B|x|&)\s+/).length-1));
const pcChip=x=>{
  // comparing with a friend (Oct 28): their initial rides on the chip when they picked the same act
  const F=activeFriend(), fv=F&&F.picks[x.id], fin=fv==="yes"||fv==="maybe"?`<i class="pc-f is-${fv}" aria-hidden="true">${escH(F.name.charAt(0).toUpperCase())}</i>`:"";
  return `<button type="button" class="pc-chip is-${x.v}${x.now?" is-now":""}${x.next?" is-next":""}" data-go="${x.id}" style="--sc:${STAGE_COL[x.w.st.stage]||"#c9b8ff"}" aria-label="${escH(x.a[0])}, ${fmt(x.w.st.start)}, ${STAGE_NAMES[x.w.st.stage]||"stage to be announced"}, ${x.v==="yes"?"Going":"Maybe"}${x.now?", playing now":""}${fin?", "+escH(F.name)+(fv==="yes"?" is going too":" might go too"):""}"><b>${pmTime(x.w.st.start)}</b><span>${escH(pmName(x.a[0]))}</span>${fin}</button>`;
};
function renderPlanChips(items,parties,end){
  const box=document.getElementById("planChips"); if(!box) return;
  if(!items.length&&!parties.length&&!activeFriend()){ box.innerHTML=""; return; }
  const s=x=>toMin(x.w.st.start), over=(a,b)=>s(a)<end(b)&&s(b)<end(a);
  // rows of Going acts that overlap each other (a clash shares a row)
  const rows=[];
  items.filter(x=>x.v==="yes").forEach(x=>{const r=rows.find(r=>r.go.some(g=>over(g,x))); if(r) r.go.push(x); else rows.push({go:[x],alt:[]});});
  items.filter(x=>x.v!=="yes").forEach(x=>{
    const r=rows.find(r=>r.go.some(g=>over(g,x)))||rows.find(r=>!r.go.length&&r.alt.some(a=>over(a,x)));
    if(r) r.alt.push(x); else rows.push({go:[],alt:[x]});
  });
  const first=r=>Math.min(...[...r.go,...r.alt].map(s));
  rows.sort((a,b)=>first(a)-first(b));
  const html=rows.map(r=>`<div class="pc-row${r.go.length>1?" is-clash":""}"><div class="pc-go">${r.go.length?r.go.map(x=>pcChip(x)).join(""):'<span class="pc-free">Free</span>'}${r.go.length>1?'<span class="pc-clash">Clash</span>':""}</div><div class="pc-alt">${r.alt.map(x=>pcChip(x)).join("")}</div></div>`).join("");
  const pchip=p=>`<span class="pc-chip party is-${picks[p.id]}" style="--sc:${p.col}"><span>${escH(p.venue.split(" · ")[0])}</span></span>`;
  const goP=parties.filter(p=>picks[p.id]==="yes"), mayP=parties.filter(p=>picks[p.id]!=="yes");
  // the friend's Going and Maybe acts that are not in your plan (tap one to see it in the Lineup)
  const F=activeFriend();
  const only=F?A.map(a=>({a,id:slug(a[0]),w:when(a)})).filter(x=>(F.picks[x.id]==="yes"||F.picks[x.id]==="maybe")&&picks[x.id]!=="yes"&&picks[x.id]!=="maybe").sort((x,y)=>x.w.st.start.localeCompare(y.w.st.start)):[];
  const onlyHtml=only.length?`<div class="pc-after">Only in ${escH(F.name)}'s plan</div><div class="pc-only">${only.map(x=>`<button type="button" class="pc-chip is-friend${F.picks[x.id]==="maybe"?" is-fmaybe":""}" data-lineup="${x.id}" style="--sc:${STAGE_COL[x.w.st.stage]||"#c9b8ff"}" aria-label="${escH(x.a[0])}, ${fmt(x.w.st.start)}, ${STAGE_NAMES[x.w.st.stage]||"stage to be announced"}, ${escH(F.name)} ${F.picks[x.id]==="yes"?"is going":"might go"}. Open in the Lineup"><b>${pmTime(x.w.st.start)}</b><span>${escH(pmName(x.a[0]))}</span></button>`).join("")}</div>`:"";
  box.innerHTML=(items.length?`<div class="pc-head"><span>Going</span><span>Maybe instead</span></div>`+html:"")+onlyHtml+
    (parties.length?`<div class="pc-after">After the festival</div><div class="pc-row"><div class="pc-go">${goP.map(pchip).join("")||'<span class="pc-free">None yet</span>'}</div><div class="pc-alt">${mayP.map(pchip).join("")}</div></div>`:"");
}
// My Plan day ribbon (Oct 28, Graham: "time along the horizontal and these dots fill up the amount of time that
// they're on the stage", then "you don't have to put the names there, just the stage, so your day is laid out in
// the colors of the stage, with the maybes as well"): the whole day from 1 PM to midnight across the screen, a
// Going row and a Maybe row, each pick a bar from its start to its end in its stage color (Maybe dashed). Going
// sets that overlap stack into a second row with a red edge. Hour marks, the 5 PM line, and a "Now" line on
// festival days. Sits under the chips (Graham: chips on top "so you know right away", the timeline at the
// bottom). A picture of the day only: the chips or cards below say the same thing, so it is aria-hidden.
const TL_ORDER=["kinetic","circuit","neon","stereo","bacardi"];
const tlMin=t=>{const m=toMin(t); return m<360?m+1440:m;};
function renderPlanTimeline(items,end){
  const box=document.getElementById("planTL"); if(!box) return;
  const list=items.filter(x=>x.w.st.stage);
  const h=document.getElementById("planTLh");
  if(!list.length){ box.innerHTML=""; box.hidden=h.hidden=true; return; }
  box.hidden=h.hidden=false;
  const s=x=>tlMin(x.w.st.start), e=x=>x.w.st.end?tlMin(x.w.st.end):s(x)+60;
  const t0=Math.floor(Math.min(13*60,...list.map(s))/60)*60, t1=Math.ceil(Math.max(24*60,...list.map(e))/60)*60;
  const P=m=>((m-t0)/(t1-t0)*100).toFixed(2)+"%";
  // greedy packing: a bar goes in the first row of its group where it overlaps nothing
  const pack=xs=>{const rows=[]; xs.forEach(x=>{let r=rows.find(r=>r.every(y=>e(y)<=s(x)||s(y)>=e(x))); if(!r) rows.push(r=[]); r.push(x);}); return rows;};
  const bar=x=>`<i class="rb-bar is-${x.v}${x.clash&&x.clash.length?" is-clash":""}${x.now?" is-now":""}" style="left:${P(s(x))};width:calc(${P(e(x))} - ${P(s(x))} - 2px);--sc:${STAGE_COL[x.w.st.stage]}"></i>`;
  const group=(label,xs)=>pack(xs).map((r,n)=>`<div class="rb-row"><span class="rb-lbl">${n?"":label}</span><div class="rb-track">${r.map(bar).join("")}</div></div>`).join("");
  const going=list.filter(x=>x.v==="yes"), maybe=list.filter(x=>x.v!=="yes");
  const F=activeFriend(), fGo=F?A.map(a=>({a,id:slug(a[0]),v:"friend",w:when(a)})).filter(x=>F.picks[x.id]==="yes"&&x.w.st.stage):[];
  const marks=[]; for(let m=t0;m<=t1;m+=120) marks.push(`<span class="rb-hr${m===17*60?" is-five":""}" style="left:${P(m)}">${pmTime(String(Math.floor(m/60)%24).padStart(2,"0")+":00")}</span>`);
  if(!marks.some(x=>x.includes("is-five"))) marks.push(`<span class="rb-hr is-five" style="left:${P(17*60)}">5p</span>`);
  const now=orlandoNow(), nowM=now.min<360?now.min+1440:now.min, today=now.ymd===DAY_YMD[day]&&nowM>=t0&&nowM<=t1;
  const used=new Set([...list,...fGo].map(x=>x.w.st.stage));
  box.innerHTML=`<div class="rb-row rb-head"><span class="rb-lbl"></span><div class="rb-track">${marks.join("")}</div></div>`+
    `<div class="rb-rows"><div class="rb-guides"><i style="left:${P(17*60)}"></i>${today?`<b style="left:${P(nowM)}">Now</b>`:""}</div>`+
    (going.length?group("Going",going):"")+(maybe.length?group("Maybe",maybe):"")+(fGo.length?group(`<span class="pc-f is-yes" title="${escH(F.name)}">${escH(F.name.charAt(0).toUpperCase())}</span><span class="sr">${escH(F.name)}</span>`,fGo):"")+`</div>`+
    `<div class="rb-key">${TL_ORDER.filter(k=>used.has(k)).map(k=>`<span style="--sc:${STAGE_COL[k]}"><i></i>${STAGE_NAMES[k]}</span>`).join("")}</div>`;
}
let planDetails=false; try{planDetails=localStorage.getItem("edc-plan-details")==="1";}catch(e){}
const planDetBtn=document.getElementById("planDet");
function showPlanMode(){
  const on=planDetails; planDetBtn.setAttribute("aria-checked",String(on)); document.getElementById("planDetS").textContent=on?"On":"Off";
  document.getElementById("planChips").hidden=on; document.getElementById("planList").hidden=!on;
}
function setPlanDetails(on,why){
  planDetails=on; showPlanMode();
  try{localStorage.setItem("edc-plan-details",on?"1":"0")}catch(e){}
  if(why) track("edc_plan_details",{on,why});
}
showPlanMode();
planDetBtn.addEventListener("click",()=>setPlanDetails(!planDetails,"switch"));
document.getElementById("planChips").addEventListener("click",e=>{
  const c=e.target.closest("[data-go]"); if(!c) return;
  setPlanDetails(true,"chip");
  const li=document.getElementById("pi-"+c.dataset.go); if(li){ li.scrollIntoView({behavior:reducedMotion()?"auto":"smooth",block:"center"}); li.classList.add("pi-flash"); setTimeout(()=>li.classList.remove("pi-flash"),1200); }
});
document.getElementById("planMaybe").onchange=e=>{renderPlan();track("edc_plan_maybes",{shown:e.target.checked});};
// keep "Playing now" and "Up next" current while the plan is open on a festival day
setInterval(()=>{if(!document.getElementById("v-plan").hidden) renderPlan();},60000);
planReady=true; renderPlan();

// "Used by N festival-goers" (Oct 28): Graham types the real count from PostHog into config.js (usedByCount).
// It shows rounded down ("2,400+"), and stays hidden while empty.
{
  const n=parseInt(String(CFG0.usedByCount||"").replace(/[^0-9]/g,""),10);
  if(n>0){
    const r=n<100?n:n<1000?Math.floor(n/10)*10:Math.floor(n/100)*100;
    document.querySelectorAll(".usedby").forEach(p=>{p.textContent=`Used by ${r.toLocaleString("en-US")}${r<n?"+":""} festival-goers`;p.hidden=false;});
  }
}

// next-year list (Oct 28): a Google Form link from config.js (nextYearForm), or an email to contactEmail
const NY_FORM=/^https:\/\//.test(CFG0.nextYearForm||"")?CFG0.nextYearForm:"";
const nyHref=()=>NY_FORM||(hasEmail?mailTo("Next year list","Add me to the list for next year's app."):"");
const NY_ICO=ico_('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="m9 15 2 2 4-4"/>');
const nyButton=where=>nyHref()?`<a class="btn ny-go" data-ny="${where}" href="${escH(nyHref())}"${NY_FORM?' target="_blank" rel="noopener"':""}>${NY_ICO} Get it first${NY_FORM?' <span class="sr">(opens new tab)</span>':""}</a>`:"";
document.querySelectorAll(".next-year").forEach(el=>{
  if(!nyHref()) return;
  el.innerHTML=`<p class="ny-h">Want this for next year's festival? Get it first.</p>`+nyButton(el.dataset.where);
});
document.addEventListener("click",e=>{const a=e.target.closest("[data-ny]"); if(a) track("edc_next_year_click",{where:a.dataset.ny,via:NY_FORM?"form":"email"});});

// "What's your next festival?" (Oct 28): tap to vote; each vote is one tracked event Graham can rank in PostHog.
// One vote per festival per phone (localStorage). No live counts on screen, since that would need a database.
const FESTS=(CFG0.nextFestivals||[]).filter(f=>f&&f.key&&f.name);
const VOTES_KEY="edc-next-votes";
const myVotes=()=>{try{return JSON.parse(localStorage.getItem(VOTES_KEY)||"[]")}catch(e){return []}};
let voteThanks=null;
function drawVotes(){
  const mine=myVotes();
  document.querySelectorAll(".fest-vote").forEach(el=>{
    if(!FESTS.length){ el.hidden=true; return; }
    el.innerHTML=`<h3 class="fv-h">${SPARKLE_ICO} What's your next festival?</h3><p class="fv-p">Vote and I'll build the app for it.</p>`+
      `<div class="fv-list" role="group" aria-label="Vote for the next festival">`+FESTS.map(f=>{const on=mine.includes(f.key);
        return `<button type="button" class="fv-b" data-fest="${escH(f.key)}" aria-pressed="${on}">${on?CHECK_ICO+" ":""}${escH(f.name)}</button>`;}).join("")+
      (hasEmail?`<a class="fv-b fv-other" data-fest-other="${el.dataset.where}" href="${mailTo("Build next: ")}">Other</a>`:"")+`</div>`+
      (voteThanks===el.dataset.where?`<p class="fv-thanks" role="status">Thanks! Want to know when it's ready?</p>`+nyButton(el.dataset.where+"_after_vote"):"");
    // the thank-you carries its own "Get it first", so the next-year box right under it steps aside
    const ny=el.nextElementSibling; if(ny&&ny.classList.contains("next-year")) ny.hidden=voteThanks===el.dataset.where;
  });
}
drawVotes();
document.addEventListener("click",e=>{
  const o=e.target.closest("[data-fest-other]"); if(o){ track("edc_vote_next_festival",{festival:"other",where:o.dataset.festOther}); return; }
  const b=e.target.closest("[data-fest]"); if(!b) return;
  const key=b.dataset.fest, mine=myVotes(), where=b.closest(".fest-vote").dataset.where;
  if(mine.includes(key)) return; // one vote per festival per phone
  mine.push(key); try{localStorage.setItem(VOTES_KEY,JSON.stringify(mine))}catch(_){}
  track("edc_vote_next_festival",{festival:key,where});
  voteThanks=where; drawVotes();
});

// "Not sure who to see? 3 quick taps" (Oct 28): vibe, energy and arrival time, then 5 to 8 acts for the day,
// avoiding clashes where it can. Nothing is picked until they tap Going.
const QUIZ_ICO=ico_('<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 4.9.8c0 1.7-2.4 1.9-2.4 3.5"/><circle cx="12" cy="17" r=".6" fill="currentColor" stroke="none"/>');
function quizCta(){
  if(tod==="party"||q||stageF!=="all"||genre!=="all"||gemsOnly||pickF!=="all") return "";
  return `<div class="quizcta"><button type="button" class="quiz-open" id="quizOpen">${SPARKLE_ICO}<span><b>Not sure who to see?</b> 3 quick taps</span></button></div>`;
}
const quizDlg=document.getElementById("quizDlg"), quizSheet=sheet(quizDlg,{onDismiss:()=>closeQuiz("swipe")});
const qStep=document.getElementById("quizStep"), qH=document.getElementById("quizH"), qBody=document.getElementById("quizBody"), qBack=document.getElementById("quizBack"), qNext=document.getElementById("quizNext");
const ARRIVE=[["13:00","Gates open","1 PM"],["15:00","Mid-afternoon","3 PM"],["17:00","Around sunset","5 PM"],["19:00","After dark","7 PM"]];
let quiz={step:0,vibes:[],energy:"",arrive:"",picksMade:0,done:false,list:null};
function quizChips(items,sel,multi){
  return `<div class="quiz-opts" role="group">`+items.map(([k,l,sub])=>`<button type="button" class="quiz-opt" data-k="${k}" aria-pressed="${multi?sel.includes(k):sel===k}"><b>${l}</b>${sub?`<small>${sub}</small>`:""}</button>`).join("")+`</div>`;
}
function suggest(){
  const going=A.filter(a=>picks[slug(a[0])]==="yes").map(a=>when(a));
  const HYPE=/energy|bass|heavy|hard|rave|big room|party|banger|drop|riddim|dubstep|festival/i, CHILL=/melod|deep|chill|groove|soul|emotional|sunset|dreamy|warm|uplift|vocal/i;
  const scored=A.map((a,i)=>{const w=when(a), g=a[1], v=a[3]+" "+a[2]; let sc=0;
    if(quiz.vibes.length?quiz.vibes.includes(g):true) sc+=3;
    if(quiz.energy==="hype"){ if(["bass","dnb","techno"].includes(g)) sc+=2; if(HYPE.test(v)) sc+=1.5; if(w.k==="eve") sc+=.5; }
    if(quiz.energy==="chill"){ if(["melodic","house"].includes(g)) sc+=2; if(CHILL.test(v)) sc+=1.5; if(a[5].includes("sun")) sc+=1; }
    sc+=2*(1-i/A.length); if(a[5].includes("gem")) sc+=.4;
    return {a,w,sc};}).filter(x=>x.w.st.start>=quiz.arrive).sort((x,y)=>y.sc-x.sc);
  const out=[], overlaps=(w,list)=>list.some(o=>tMin(o.st.start)<slotEnd(w)&&tMin(w.st.start)<slotEnd(o));
  for(const x of scored){ if(out.length>=8) break; if(!overlaps(x.w,[...going,...out.map(o=>o.w)])) out.push(x); }
  // too few without clashes: fill up to 5 with the best of the rest
  for(const x of scored){ if(out.length>=5) break; if(!out.includes(x)) out.push({...x,clash:true}); }
  return out.sort((x,y)=>x.w.st.start.localeCompare(y.w.st.start));
}
function drawQuiz(){
  const st=quiz.step; qBack.hidden=st===0; qNext.hidden=false;
  if(st<3) qStep.textContent=`${st+1} of 3`;
  if(st===0){ qH.textContent="What's your vibe?"; qBody.innerHTML=`<p class="quiz-hint">Pick one or more.</p>`+quizChips(order.filter(k=>k!=="tbc").map(k=>[k,G[k].label]),quiz.vibes,true); qNext.textContent="Next"; qNext.disabled=false; }
  if(st===1){ qH.textContent="How much energy?"; qBody.innerHTML=quizChips([["chill","Chill","melodic, groovy, sunset"],["hype","Hype","bass, big drops, all night"]],quiz.energy,false); qNext.textContent="Next"; qNext.disabled=!quiz.energy; }
  if(st===2){ qH.textContent="When are you arriving?"; qBody.innerHTML=quizChips(ARRIVE.map(([k,l,sub])=>[k,l,sub]),quiz.arrive,false); qNext.textContent="Show my picks"; qNext.disabled=!quiz.arrive; }
  if(st===3){
    // worked out once per run, so a Going tap here doesn't turn the list into "overlaps"
    const list=quiz.list||(quiz.list=suggest()); qStep.textContent=DAYS[day].name+" · "+list.length+" suggestions";
    qH.textContent="Try these"; qNext.textContent="Done";
    if(!quiz.done){ quiz.done=true; track("edc_quiz_finish",{vibes:quiz.vibes.join(",")||"any",energy:quiz.energy,arrive:quiz.arrive,suggested:list.length,day}); }
    qBody.innerHTML=`<p class="quiz-hint">Nothing is picked until you tap Going.</p><ol class="quiz-list">`+list.map(x=>{const id=slug(x.a[0]), on=picks[id]==="yes";
      return `<li class="quiz-item" style="--sc:${STAGE_COL[x.w.st.stage]||"#c9b8ff"}"><div><b class="qi-name">${x.a[0]}</b><span class="qi-meta">${(x.w.real?"":"~")+fmt(x.w.st.start)} · ${STAGE_NAMES[x.w.st.stage]||"Stage TBA"}</span><span class="qi-vibe">${x.a[2]}</span>${x.clash?'<span class="qi-clash">Overlaps another pick</span>':""}</div><button type="button" class="qi-go" data-qgo="${id}" aria-pressed="${on}" aria-label="Going to ${escH(x.a[0])}">${CHECK_ICO} Going</button></li>`;}).join("")+`</ol>`;
  }
}
function openQuiz(){ quiz={step:0,vibes:[],energy:"",arrive:"",picksMade:0,done:false,list:null}; drawQuiz(); quizSheet.open(); quizDlg.querySelector(".intro-card").focus(); track("edc_quiz_start",{day}); }
function closeQuiz(how){ quizSheet.close(); track("edc_quiz_closed",{how,step:quiz.step,picks:quiz.picksMade}); }
grid.addEventListener("click",e=>{ if(e.target.closest("#quizOpen")) openQuiz(); });
qBody.addEventListener("click",e=>{
  const o=e.target.closest(".quiz-opt");
  if(o){ const k=o.dataset.k;
    if(quiz.step===0){ quiz.vibes=quiz.vibes.includes(k)?quiz.vibes.filter(x=>x!==k):[...quiz.vibes,k]; }
    if(quiz.step===1) quiz.energy=k;
    if(quiz.step===2) quiz.arrive=k;
    drawQuiz(); return; }
  const g=e.target.closest("[data-qgo]");
  if(g){ const v=setPick(g.dataset.qgo,"yes",{source:"quiz"}); if(v==="yes"){quiz.picksMade++; track("edc_quiz_pick",{...actProps(g.dataset.qgo)});} drawQuiz(); }
});
qNext.onclick=()=>{ if(quiz.step<3){ quiz.step++; drawQuiz(); quizDlg.firstElementChild.scrollTo({top:0}); } else closeQuiz("done"); };
qBack.onclick=()=>{ if(quiz.step>0){ quiz.step--; quiz.list=null; quiz.done=false; drawQuiz(); } };
quizDlg.addEventListener("keydown",e=>{if(e.key==="Escape") closeQuiz("escape");});

// sharing (Oct 28, no database): "Share this app" opens the phone's share sheet with a short message and the
// link, or copies the link. "Share my plan" draws the day's Going acts as a tall neon picture on the phone
// (nothing is uploaded) and shares or saves it.
function toast(msg){
  const t=document.createElement("p"); t.className="toast"; t.setAttribute("role","status"); t.innerHTML=msg;
  document.body.appendChild(t); setTimeout(()=>t.remove(),2600);
}
const SHARE_TEXT="Planning EDC Orlando 2026? This free, fan-made app has every act, set-time clashes, shuttles and afterparties, and works offline.";
async function shareApp(where){
  track("edc_share_tap",{what:"app",where});
  const data={title:"Your Festival Plan",text:SHARE_TEXT,url:APP_URL};
  if(navigator.share){
    try{ await navigator.share(data); track("edc_share_done",{what:"app",where,method:"share_sheet"}); }
    catch(e){ if(e&&e.name==="AbortError") track("edc_share_cancel",{what:"app",where}); else copyLink(where); }
    return;
  }
  copyLink(where);
}
async function copyLink(where){
  try{ await navigator.clipboard.writeText(APP_URL); toast(CHECK_ICO+" Link copied"); track("edc_share_done",{what:"app",where,method:"copy"}); }
  catch(e){ toast("Copy this link: "+escH(APP_URL)); track("edc_share_done",{what:"app",where,method:"shown"}); }
}
document.addEventListener("click",e=>{const b=e.target.closest("[data-share]"); if(b) shareApp(b.dataset.share);});

const DAY_GRAD={fri:["#ff4fb4","#ff7a59","#ffb627"],sat:["#ff4fb4","#a874ff","#3fe0ff"],sun:["#3fe0ff","#7dff9b","#ffcc66"]};
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
function fit(c,text,max){ if(c.measureText(text).width<=max) return text; let t=text; while(t.length>1&&c.measureText(t+"…").width>max) t=t.slice(0,-1); return t+"…"; }
async function drawPlanImage(){
  const cm=goingClashes();
  const acts=A.map(a=>({a,id:slug(a[0]),w:when(a)})).filter(x=>picks[x.id]==="yes").sort((x,y)=>x.w.st.start.localeCompare(y.w.st.start));
  const parties=[...(PARTIES[day]||[]),...(day==="fri"?PARTIES.thu:[])].filter(p=>picks[p.id]==="yes");
  if(!acts.length&&!parties.length) return null;
  try{ await Promise.all(["800 80px Unbounded","700 48px Unbounded","700 40px Figtree","600 32px Figtree"].map(f=>document.fonts.load(f))); }catch(e){}
  const W=1080, ROW=168, top=430, rowsH=acts.length*ROW+(parties.length?90+parties.length*120:0), H=Math.max(1350,top+rowsH+230);
  const cv=document.createElement("canvas"); cv.width=W; cv.height=H; const c=cv.getContext("2d");
  const g3=DAY_GRAD[day];
  // night sky with soft glows
  c.fillStyle="#120a2e"; c.fillRect(0,0,W,H);
  [[160,-60,700,"rgba(168,116,255,.38)"],[1000,120,560,"rgba(255,79,180,.30)"],[540,H+80,820,"rgba(63,224,255,.20)"]].forEach(([x,y,r,col])=>{const gr=c.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,col);gr.addColorStop(1,"rgba(18,10,46,0)");c.fillStyle=gr;c.fillRect(0,0,W,H);});
  const lg=c.createLinearGradient(80,0,W-80,0); lg.addColorStop(0,g3[0]); lg.addColorStop(.55,g3[1]); lg.addColorStop(1,g3[2]);
  // title
  c.textBaseline="alphabetic"; c.font="800 84px Unbounded, Arial Black, sans-serif"; c.fillStyle="#f6f1ff"; c.fillText("Your",80,170);
  const wY=c.measureText("Your ").width; c.fillStyle=lg; c.fillText("Festival",80+wY,170);
  c.fillStyle="#f6f1ff"; c.fillText("Plan",80,268);
  c.font="700 40px Figtree, sans-serif"; c.fillStyle=g3[2];
  c.fillText((DAYS[day].name+" · "+DAYS[day].date.split(", ")[0].replace(/^\w+ /,"")).toUpperCase()+" · EDC ORLANDO 2026",80,345);
  c.fillStyle=lg; rr(c,80,372,W-160,6,3); c.fill();
  // rows
  let y=top; const est=acts.some(x=>!x.w.real);
  acts.forEach(x=>{
    const st=x.w.st, sc=STAGE_COL[st.stage]||"#c9b8ff", cl=cm[x.id]||[];
    c.fillStyle="rgba(36,22,90,.78)"; rr(c,80,y,W-160,ROW-22,30); c.fill();
    c.strokeStyle=cl.length?"#ff7088":"rgba(138,120,230,.55)"; c.lineWidth=3; rr(c,80,y,W-160,ROW-22,30); c.stroke();
    c.fillStyle=sc; rr(c,80,y,14,ROW-22,7); c.fill();
    c.font="700 36px Figtree, sans-serif"; c.fillStyle="#ffb627"; c.fillText((x.w.real?"":"~")+fmt(st.start),120,y+56);
    c.font="700 46px Unbounded, Arial Black, sans-serif"; c.fillStyle="#f6f1ff"; c.fillText(fit(c,x.a[0],W-160-330),120,y+116);
    c.textAlign="right"; c.font="700 32px Figtree, sans-serif";
    if(cl.length){ c.fillStyle="#ff7088"; c.fillText("Clashes with "+fit(c,cl[0],260),W-112,y+56); }
    c.fillStyle="#f6f1ff"; const sn=STAGE_NAMES[st.stage]||"Stage TBA"; c.fillText(sn,W-112,y+114);
    const sw=c.measureText(sn).width; c.textAlign="left"; c.fillStyle=sc; c.beginPath(); c.arc(W-112-sw-22,y+103,11,0,Math.PI*2); c.fill();
    y+=ROW;
  });
  if(parties.length){
    c.font="700 34px Figtree, sans-serif"; c.fillStyle="#c9b8ff"; c.fillText("AFTER THE FESTIVAL",80,y+50); y+=90;
    parties.forEach(p=>{
      c.fillStyle="rgba(36,22,90,.78)"; rr(c,80,y,W-160,98,26); c.fill(); c.fillStyle=p.col; rr(c,80,y,14,98,7); c.fill();
      c.font="700 40px Unbounded, Arial Black, sans-serif"; c.fillStyle="#f6f1ff"; c.fillText(fit(c,p.venue.split(" · ")[0],560),120,y+64);
      c.textAlign="right"; c.font="700 32px Figtree, sans-serif"; c.fillStyle="#ffb627"; c.fillText(p.time,W-112,y+62); c.textAlign="left";
      y+=120;
    });
  }
  // footer
  c.font="600 30px Figtree, sans-serif"; c.fillStyle="#c9b8ff";
  if(est) c.fillText("~ = estimated time until official set times drop",80,H-150);
  c.font="700 30px Figtree, sans-serif"; c.fillStyle="#f6f1ff"; c.fillText("made with Your Festival Plan · festplan.glowbop.com",80,H-90,W-160);
  c.font="600 26px Figtree, sans-serif"; c.fillStyle="#c9b8ff"; c.fillText("Fan-made. Not affiliated with Insomniac or EDC.",80,H-50);
  return cv;
}
window.drawPlanImage=drawPlanImage;
document.getElementById("sharePlan").onclick=async()=>{
  track("edc_share_tap",{what:"plan_image",where:"my_plan",day});
  const cv=await drawPlanImage();
  if(!cv){ toast("Tap <b>Going</b> on some acts first, then share your plan."); return; }
  const blob=await new Promise(r=>cv.toBlob(r,"image/png"));
  const file=new File([blob],"my-festival-plan-"+DAYS[day].name.toLowerCase()+".png",{type:"image/png"});
  if(navigator.canShare&&navigator.canShare({files:[file]})){
    try{ await navigator.share({files:[file],title:"My "+DAYS[day].name+" plan",text:"My "+DAYS[day].name+" plan, made with Your Festival Plan: "+APP_URL}); track("edc_share_done",{what:"plan_image",where:"my_plan",method:"share_sheet",day}); }
    catch(e){ if(e&&e.name==="AbortError") track("edc_share_cancel",{what:"plan_image",where:"my_plan"}); }
    return;
  }
  const u=URL.createObjectURL(blob), a=document.createElement("a"); a.href=u; a.download=file.name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(u),4000); toast(CHECK_ICO+" Plan picture saved");
  track("edc_share_done",{what:"plan_image",where:"my_plan",method:"download",day});
};

// stage logo in the header: the sunrise intro plays once per open, then the lasers keep sweeping
// (all CSS, see .rp-* in styles.css). Tapping it replays the intro.
document.getElementById("brandmark").addEventListener("click",e=>{
  const b=e.currentTarget; b.classList.remove("rp-run"); void b.getBoundingClientRect(); b.classList.add("rp-run");
  track("edc_logo_replay");
});

// tabs
const views=["lineup","plan","travel","map"];
function show(v){if(!views.includes(v))v="lineup";
  if(v==="plan") maybeTipMoment("my_plan");views.forEach(x=>{document.getElementById("v-"+x).hidden=x!==v;});document.querySelectorAll(".tabs a").forEach(a=>{if(a.dataset.v===v)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current");});window.scrollTo(0,0);document.body.dataset.view=v;trackContext({view:v});track("edc_section_tab",{section:v});}
document.querySelectorAll(".planbtn").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();show("plan");try{history.replaceState(null,"","#plan")}catch(_){} track("edc_plan_open",{from:"picks_row"});}));
document.querySelectorAll(".tabs a").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();show(a.dataset.v);try{history.replaceState(null,"","#"+a.dataset.v)}catch(_){}}));
window.show=show;
show((location.hash||"").slice(1));

// shared picks via Supabase: each phone signs in anonymously and joins the group with the shared code.
// localStorage keeps a copy of the picks plus a queue of changes not yet on the server, so picking
// still works with no signal and nothing is lost when the server copy comes back.
const CFG=window.EDC_CONFIG||{};
const sb=CFG.supabaseUrl&&CFG.supabaseAnonKey&&window.supabase?window.supabase.createClient(CFG.supabaseUrl,CFG.supabaseAnonKey):null;
const lsGet=(k,d)=>{try{const v=localStorage.getItem(k);return v===null?d:JSON.parse(v)}catch(e){return d}};
const lsSet=(k,v)=>{try{v==null?localStorage.removeItem(k):localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const VALID=["yes","maybe","no"];
let code=lsGet("edc-group-code",null), group=null, channel=null, live=false;
let pending=lsGet("edc-pending",{}); // item id -> "yes"|"maybe"|"no"|"" (cleared), not yet saved on the server
Object.assign(picks,lsGet("edc-picks",{}));
const saveLocal=()=>lsSet("edc-picks",picks);
const savePending=()=>lsSet("edc-pending",pending);
const syncEl=document.getElementById("sync"), linkBtn=document.getElementById("linkBtn");
function syncStatus(){
  const n=Object.keys(pending).length;
  syncEl.hidden=!(sb&&code&&(n||!live));
  syncEl.textContent=!sb||!code?"Picks are saved on this device only."
    :n?`${n} pick change${n===1?"":"s"} saved here, will sync when you have signal.`
    :live?"Shared picks: changes show up live on both your phones."
    :"Offline: showing your last synced picks.";
  // Link phones is just for Graham and Rebecca: everyone else keeps picks on their own phone, so the button only
  // shows once this phone is linked. A new phone of theirs links through festplan.glowbop.com/#link.
  linkBtn.hidden=!(sb&&code); document.getElementById("linkTxt").textContent="Linked phones";
  trackContext({linked:!!code,pending_picks:n});
}
function applyRow(r){if(VALID.includes(r.v)) picks[r.item_id]=r.v; else delete picks[r.item_id];}
async function ensureSession(){
  const {data}=await sb.auth.getSession();
  if(data.session) return;
  const {error}=await sb.auth.signInAnonymously();
  if(error) throw error;
}
async function serverPicks(){
  const {data,error}=await sb.from("picks").select("item_id,v").eq("group_id",group);
  if(error) throw error;
  return data;
}
async function pull(){
  const rows=await serverPicks();
  for(const k in picks) delete picks[k];
  rows.forEach(applyRow);
  // unsent changes from this phone win over the server copy
  for(const [k,v] of Object.entries(pending)) applyRow({item_id:k,v});
  saveLocal(); render();
}
let flushing=false;
async function flush(){
  if(!group||flushing) return;
  flushing=true;
  try{
    while(Object.keys(pending).length){
      const batch=Object.entries(pending);
      const {error}=await sb.from("picks").upsert(batch.map(([item_id,v])=>({group_id:group,item_id,v:v||null})));
      if(error) throw error;
      // keep anything that changed again while this batch was in flight
      batch.forEach(([k,v])=>{if(pending[k]===v) delete pending[k];});
      savePending();
    }
  }catch(e){/* stays queued; retried on reconnect */track("edc_sync_error",{where:"save",code:String(e&&(e.code||e.message)||"error").slice(0,60),queued:Object.keys(pending).length});}
  finally{flushing=false;syncStatus();}
}
function subscribe(){
  if(channel) sb.removeChannel(channel);
  channel=sb.channel("picks-"+group)
    .on("postgres_changes",{event:"*",schema:"public",table:"picks",filter:"group_id=eq."+group},p=>{
      const r=p.new; if(!r||!r.item_id||r.item_id in pending) return;
      applyRow(r); saveLocal(); render();
    })
    .subscribe(status=>{
      live=status==="SUBSCRIBED";
      if(status==="CHANNEL_ERROR"||status==="TIMED_OUT") track("edc_sync_error",{where:"live",code:status});
      // (re)connected: catch up on anything missed while asleep, then send what's queued
      if(live) pull().then(flush).catch(()=>{});
      syncStatus();
    });
}
let connecting=null;
function connect(){
  if(!sb||!code) return Promise.resolve();
  if(group&&channel) return pull().then(flush).catch(()=>{});
  return connecting||=(async()=>{
    try{
      await ensureSession();
      const {data,error}=await sb.rpc("join_group",{code});
      if(error) throw error;
      group=data; subscribe();
    }finally{connecting=null;}
  })();
}
grid.addEventListener("click",e=>{
  const link=e.target.closest(".yt,.sp"); if(link){session.listens++;track("edc_listen_click",{...actProps(link.dataset.act),artist:link.dataset.who,platform:link.classList.contains("yt")?"youtube":"spotify"});}
  const pl=e.target.closest("[data-pk]"); if(pl){const pa=pl.dataset.artist;track("edc_party_click",{...partyProps(pl.dataset.pid),action:pl.dataset.pk,...(pa?{artist:pa,plays_festival:pl.classList.contains("main")}:{})});}
  const b=e.target.closest(".vote button"); if(!b) return;
  setPick(b.dataset.id,b.dataset.v);
  const nb=grid.querySelector('.vote button[data-id="'+CSS.escape(b.dataset.id)+'"][data-v="'+b.dataset.v+'"]');
  if(nb){const pop=spring(.86,s=>{nb.style.transform="scale("+s+")";},{preset:SPRING.bouncy,precision:.002});pop.to(1,{velocity:1.5,done:()=>{nb.style.transform="";}});}
});
// one place a pick is made (cards and the "Who should I see?" quiz): tapping the same pick again clears it
function setPick(id,want,extra={}){
  const prev=picks[id]||"", v=prev===want?"":want;
  if(v) picks[id]=v; else delete picks[id];
  render(); saveLocal();
  session.votes++;
  const filtered=tod!=="all"||stageF!=="all"||genre!=="all"||gemsOnly||pickF!=="all"||!!q;
  track("edc_vote",{...itemProps(id),kind:id.startsWith("p-")?"party":"act",vote:v||"cleared",from:prev||"none",time_filter:tod,filtered,...extra});
  if(sb&&code){pending[id]=v;savePending();syncStatus();flush();}
  return v;
}
window.addEventListener("online",()=>connect().catch(()=>{}));
addEventListener("scroll",()=>{const h=document.documentElement.scrollHeight-innerHeight;if(h>0) session.maxScroll=Math.max(session.maxScroll,Math.round(scrollY/h*100));},{passive:true});
document.addEventListener("visibilitychange",()=>{if(document.visibilityState!=="hidden") return;
  track("edc_session_summary",{seconds:Math.round((Date.now()-session.start)/1000),votes:session.votes,listens:session.listens,expands:session.expands,max_scroll_pct:session.maxScroll},true);
  Object.assign(session,{start:Date.now(),votes:0,listens:0,expands:0,maxScroll:0});});
document.addEventListener("click",e=>{const a=e.target.closest("a[href^='http'],a[href^='geo:']"); if(!a||a.matches(".yt,.sp,[data-pk]")) return;
  let u; try{u=new URL(a.href);}catch(_){return;}
  const ctx=a.closest(".line")?.querySelector(".ln")?.firstChild?.textContent?.trim();
  track(a.matches(".donate-link")?"edc_donate_click":"edc_outbound_click",{...(a.dataset.where?{where:a.dataset.where,service:a.dataset.service,...(a.dataset.amount?{amount:a.dataset.amount}:{})}:{}),host:u.host,path:u.pathname.slice(0,80),label:(a.getAttribute("aria-label")||a.textContent).trim().replace(/\s+/g," ").slice(0,80),...(ctx?{context:ctx}:{})});});
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible") connect().catch(()=>{});});
syncStatus(); render();
connect().catch(()=>syncStatus());

// link phones dialog: enter the shared code once per phone (the home-screen app has its own storage)
const linkDlg=document.getElementById("linkDlg"), linkForm=document.getElementById("linkForm"), linkCode=document.getElementById("linkCode");
const linkErr=document.getElementById("linkErr"), linkGo=document.getElementById("linkGo"), linkOff=document.getElementById("linkOff");
function openLink(){
  linkCode.value=code||""; linkErr.textContent="";
  document.getElementById("linkP").textContent=code?"This phone is linked. Share this code with the other phone, or unlink it.":"Enter the shared code on each phone, and once more in the home-screen app.";
  linkGo.textContent=code?"Save code":"Link this phone"; linkOff.hidden=!code;
  linkSheet.open(); linkCode.focus();
  track("edc_link_dialog_open",{linked:!!code});
}
function closeLink(){linkSheet.close();linkBtn.focus();}
const linkSheet=sheet(linkDlg,{onDismiss:()=>closeLink()});
linkBtn.onclick=openLink;
// private way in for a new phone: open the app at #link
function linkFromHash(){ if(location.hash!=="#link"||!sb) return; try{history.replaceState(null,"",location.pathname+location.search)}catch(_){} openLink(); track("edc_link_via_hash"); }
window.addEventListener("hashchange",linkFromHash); linkFromHash();
document.getElementById("linkX").onclick=closeLink;
linkDlg.addEventListener("keydown",e=>{if(e.key==="Escape") closeLink();});
linkForm.onsubmit=async e=>{
  e.preventDefault();
  const c=linkCode.value.trim(); if(!c) return;
  linkGo.disabled=true; linkErr.textContent="";
  const prevCode=code, prevGroup=group;
  try{
    await ensureSession();
    const {data,error}=await sb.rpc("join_group",{code:c});
    if(error) throw error;
    code=c; group=data; lsSet("edc-group-code",code);
    // picks made on this phone before linking get added, without overwriting the shared ones
    if(data!==prevGroup){
      const have=new Set((await serverPicks()).filter(r=>VALID.includes(r.v)).map(r=>r.item_id));
      for(const [k,v] of Object.entries(picks)) if(!have.has(k)) pending[k]=v;
      savePending();
    }
    subscribe(); closeLink();
    track("edc_link_phones",{relinked:!!prevCode});
  }catch(err){
    code=prevCode; group=prevGroup;
    track("edc_link_failed",{reason:err&&err.code==="P0002"?"wrong_code":navigator.onLine===false?"offline":"other"});
    linkErr.textContent=err&&err.code==="P0002"?"That code didn't match. Check it and try again."
      :navigator.onLine===false||/fetch|network/i.test(err&&err.message||"")?"Couldn't reach the server. Try again when you have signal."
      :"Couldn't link right now ("+(err&&(err.code||err.message)||"error")+").";
  }finally{linkGo.disabled=false;syncStatus();}
};
let unlinkArmed=null;
linkOff.onclick=()=>{
  if(!unlinkArmed){linkOff.textContent="Tap again to unlink";unlinkArmed=setTimeout(()=>{unlinkArmed=null;linkOff.textContent="Unlink this phone";},4000);return;}
  clearTimeout(unlinkArmed); unlinkArmed=null; linkOff.textContent="Unlink this phone";
  if(channel) sb.removeChannel(channel);
  channel=null; group=null; code=null; live=false; pending={};
  lsSet("edc-group-code",null); savePending(); syncStatus(); closeLink();
  track("edc_unlink_phones");
};

// picks links (Oct 28, Graham: "build" the plan link; no database, nothing uploaded): "Send my picks" puts every
// Going / Maybe / Skip pick, all three days and the afterparties, into a link after "#picks=" (the part of a
// link that never leaves the phone): "1~going.slugs~maybe.slugs~skip.slugs". Opening one asks what to do:
// compare it with your plan (saved on this phone as a friend's plan, edc-friends) or make it your picks (the
// way to move picks from Safari into the home-screen app, which has its own storage on iPhone). The home-screen
// app can't open links itself, so "Bring my picks here" (Quick start, in the app only) and "Open a picks link"
// (My Plan) take a pasted link. Unknown slugs (a lineup change) are skipped and counted. Tracking sends counts only.
const PK_RE=/(?:#|^|\s)picks=([a-z0-9~.\-%]+)/i;
function pkAllIds(){ const ids=new Set(); Object.values(DAYS).forEach(d=>d.list.forEach(a=>ids.add(slug(a[0])))); Object.values(PARTIES).forEach(l=>(l||[]).forEach(p=>ids.add(p.id))); return ids; }
function pkEncode(p){ const g={yes:[],maybe:[],no:[]}; Object.entries(p).forEach(([k,v])=>{ if(g[v]) g[v].push(k); }); return "1~"+g.yes.join(".")+"~"+g.maybe.join(".")+"~"+g.no.join("."); }
function pkDecode(str){
  const m=PK_RE.exec(String(str||"").trim()); if(!m) return null;
  let raw=m[1]; try{ raw=decodeURIComponent(raw); }catch(e){}
  const parts=raw.split("~"); if(parts[0]!=="1"||parts.length<2) return null;
  const ok=pkAllIds(), out={}; let unknown=0;
  ["yes","maybe","no"].forEach((v,i)=>(parts[i+1]||"").split(".").filter(Boolean).forEach(id=>{ id=id.toLowerCase(); if(ok.has(id)) out[id]=v; else unknown++; }));
  return {picks:out,unknown};
}
const pkCount=p=>{ const c={yes:0,maybe:0,no:0}; Object.values(p).forEach(v=>{ if(c[v]!==undefined) c[v]++; }); return c; };
const pkLink=()=>APP_URL+"#picks="+pkEncode(picks);
const myPickCount=()=>Object.values(picks).filter(v=>VALID.includes(v)).length;
// friends' plans, kept on this phone only
function friendsGet(){ try{ const l=JSON.parse(localStorage.getItem("edc-friends")||"[]"); return Array.isArray(l)?l:[]; }catch(e){ return []; } }
function friendsSet(l){ try{ localStorage.setItem("edc-friends",JSON.stringify(l)); }catch(e){} }
function activeFriend(){ let id=null; try{ id=localStorage.getItem("edc-compare"); }catch(e){} return id?friendsGet().find(f=>f.id===id)||null:null; }
function setCompare(id){ try{ id?localStorage.setItem("edc-compare",id):localStorage.removeItem("edc-compare"); }catch(e){} drawCmpBar(); renderPlan(); }
// make a link's picks your own: replaces every pick (and queues the change on a linked phone)
function usePicks(np){
  new Set([...Object.keys(picks),...Object.keys(np)]).forEach(id=>{
    const v=np[id]||""; if((picks[id]||"")===v) return;
    if(v) picks[id]=v; else delete picks[id];
    if(sb&&code) pending[id]=v;
  });
  saveLocal(); if(sb&&code){ savePending(); syncStatus(); flush(); }
  render();
}
async function sendPicks(where){
  const n=myPickCount();
  if(!n){ toast("Tap <b>Going</b>, <b>Maybe</b> or <b>Skip</b> on some acts first."); return; }
  const url=pkLink();
  track("edc_picks_link_send",{where,picks:n,length:url.length});
  if(where!=="a2hs"&&navigator.share){
    try{ await navigator.share({title:"My festival picks",text:"My EDC Orlando picks. Open the link to compare them with yours:",url}); track("edc_picks_link_sent",{where,method:"share_sheet"}); }
    catch(e){ if(e&&e.name==="AbortError") track("edc_picks_link_cancel",{where}); else copyPicks(url,where); }
    return;
  }
  copyPicks(url,where);
}
async function copyPicks(url,where){
  const msg=where==="a2hs"?CHECK_ICO+" Picks copied. Open the app from your home screen and tap <b>Bring my picks here</b>.":CHECK_ICO+" Picks link copied";
  try{ await navigator.clipboard.writeText(url); toast(msg); track("edc_picks_link_sent",{where,method:"copy"}); }
  catch(e){ pkOpen("show",url); track("edc_picks_link_sent",{where,method:"shown"}); }
}
// the sheet: "paste" (type or paste a link), "open" (what to do with a link's picks), "show" (a link to copy by hand)
const pkDlg=document.getElementById("pkDlg"), pkForm=document.getElementById("pkForm");
const pkH=document.getElementById("pkH"), pkP=document.getElementById("pkP"), pkPaste=document.getElementById("pkPaste"), pkIn=document.getElementById("pkIn");
const pkWho=document.getElementById("pkWho"), pkName=document.getElementById("pkName"), pkErr=document.getElementById("pkErr");
const pkGo=document.getElementById("pkGo"), pkAlt=document.getElementById("pkAlt");
let pkMode="paste", pkData=null, pkSource="link", pkReturn=null, pkArmed=null;
const pkSheet=sheet(pkDlg,{onDismiss:()=>pkClose("dismiss")});
const pkMinePrimary=()=>!myPickCount();
function pkDraw(){
  pkErr.textContent=""; clearTimeout(pkArmed); pkArmed=null;
  pkPaste.hidden=pkMode!=="paste"&&pkMode!=="show"; pkWho.hidden=pkMode!=="open"; pkAlt.hidden=pkMode!=="open";
  document.getElementById("pkPasteBtn").hidden=pkMode==="show";
  if(pkMode==="paste"){
    pkH.textContent="Open a picks link"; pkP.textContent="Paste a picks link a friend sent you, or the one you copied in your browser."; pkGo.textContent="Open";
  }else if(pkMode==="show"){
    pkH.textContent="Your picks link"; pkP.textContent="Copying didn't work here. Press and hold the link to copy it."; pkGo.textContent="Done";
  }else{
    pkH.textContent="Picks from a link";
    pkP.textContent=pkSummary(pkData.picks)+(pkData.unknown?" "+pkData.unknown+" act"+(pkData.unknown>1?"s are":" is")+" no longer on the lineup and "+(pkData.unknown>1?"were":"was")+" skipped.":"");
    const mine=myPickCount();
    // a phone with no picks yet is most likely moving picks over, so "Make these my picks" comes first there
    pkGo.textContent=pkMinePrimary()?"Make these my picks":"Compare with my plan";
    pkAlt.textContent=pkMinePrimary()?"Compare with my plan":"Make these my picks";
    pkWho.hidden=pkMinePrimary();
    pkName.value="";
    if(!mine) pkAlt.dataset.n="0"; else pkAlt.dataset.n=String(mine);
  }
}
// "5 Going, 2 Maybe and 1 Skip across Friday to Sunday."
function pkSummary(p){ const c=pkCount(p), parts=[c.yes+" Going",c.maybe+" Maybe",c.no+" Skip"].filter(x=>!/^0 /.test(x)); return (parts.length?parts.join(", ").replace(/, ([^,]*)$/," and $1"):"No picks")+" across Friday to Sunday."; }
const pkDone=()=>{ try{ sessionStorage.removeItem("edc-pk-pending"); }catch(_){} };
function pkOpen(mode,arg){
  pkMode=mode; pkData=mode==="open"?arg:null; if(mode==="show") pkIn.value=arg; else if(mode==="paste") pkIn.value="";
  pkDraw(); pkReturn=document.activeElement; pkSheet.open(); pkForm.focus();
  if(mode==="show") setTimeout(()=>{ pkIn.focus(); pkIn.select(); },350);
}
function pkClose(why){ pkDone(); pkSheet.close(); if(pkReturn&&pkReturn.focus) pkReturn.focus(); if(pkMode==="open"&&why) track("edc_picks_link_use",{action:"cancel",source:pkSource}); }
function pkCompare(){
  const name=(pkName.value.trim()||"Friend").slice(0,20), l=friendsGet().filter(f=>f.name.toLowerCase()!==name.toLowerCase());
  const f={id:Date.now().toString(36),name,picks:pkData.picks,at:Date.now()};
  l.push(f); while(l.length>6) l.shift(); friendsSet(l);
  pkDone();
  track("edc_picks_link_use",{action:"compare",source:pkSource,picks:Object.keys(pkData.picks).length,friends:l.length});
  pkMode=""; pkSheet.close();
  setCompare(f.id); show("plan"); try{history.replaceState(null,"","#plan")}catch(_){}
  toast(CHECK_ICO+" Comparing with "+escH(name)+"'s plan");
}
function pkMine(btn){
  const n=myPickCount();
  if(n&&!pkArmed){ btn.textContent="Tap again to replace your "+n+" pick"+(n>1?"s":""); pkArmed=setTimeout(()=>{ pkArmed=null; pkDraw(); },4000); return; }
  clearTimeout(pkArmed); pkArmed=null;
  usePicks(pkData.picks);
  pkDone();
  track("edc_picks_link_use",{action:"mine",source:pkSource,picks:Object.keys(pkData.picks).length,replaced:n});
  pkMode=""; pkSheet.close();
  show("plan"); try{history.replaceState(null,"","#plan")}catch(_){}
  toast(CHECK_ICO+" Your picks are here");
}
pkForm.addEventListener("submit",e=>{
  e.preventDefault();
  if(pkMode==="show"){ pkMode=""; pkClose(); return; }
  if(pkMode==="paste"){
    const d=pkDecode(pkIn.value);
    if(!d){ pkErr.textContent="That doesn't look like a picks link. It has #picks= in it."; pkIn.focus(); return; }
    pkSource="paste"; track("edc_picks_link_open",{source:"paste",picks:Object.keys(d.picks).length,unknown:d.unknown});
    pkMode="open"; pkData=d; pkDraw(); pkForm.focus(); return;
  }
  pkMinePrimary()?pkMine(pkGo):pkCompare();
});
pkAlt.onclick=()=>pkMinePrimary()?pkCompare():pkMine(pkAlt);
document.getElementById("pkX").onclick=()=>pkClose("cancel");
pkDlg.addEventListener("keydown",e=>{ if(e.key==="Escape") pkClose("escape"); });
pkIn.addEventListener("input",()=>{ if(pkErr.textContent) pkErr.textContent=""; });
document.getElementById("pkPasteBtn").onclick=async()=>{
  try{ const txt=await navigator.clipboard.readText(); pkIn.value=txt||""; if(txt) pkForm.requestSubmit(); }
  catch(e){ pkIn.focus(); pkErr.textContent="Press and hold in the box, then tap Paste."; }
};
document.getElementById("sendPicks").onclick=()=>sendPicks("my_plan");
// "Show my picks as a QR code" (Oct 28, Graham: friends scan it instead of texting a link): the same picks link,
// drawn as a QR code on this phone (qr.js, works offline). The friend's camera opens it like any picks link.
const qrDlg=document.getElementById("qrDlg"), qrSheet=sheet(qrDlg,{onDismiss:()=>closeQr()});
let qrReturn=null;
function openQr(){
  const n=myPickCount();
  if(!n){ toast("Tap <b>Going</b>, <b>Maybe</b> or <b>Skip</b> on some acts first."); return; }
  const url=pkLink(), q=qrSvg(url,"QR code with your picks link");
  if(!q){ toast("Too many picks for a QR code. Send them as a link instead."); return; }
  document.getElementById("qrBox").innerHTML=q.svg;
  document.getElementById("qrP").textContent=pkSummary(picks);
  document.getElementById("qrTip").textContent=q.version>18?"Lots of picks make a busy code. Turn your brightness up and hold the phones a little closer.":"Not scanning? Turn your screen brightness up.";
  qrReturn=document.activeElement; qrSheet.open(); qrDlg.querySelector(".intro-card").focus();
  track("edc_picks_qr_show",{picks:n,length:url.length,version:q.version});
}
function closeQr(){ qrSheet.close(); if(qrReturn&&qrReturn.focus) qrReturn.focus(); }
document.getElementById("qrPicks").onclick=openQr;
document.getElementById("qrX").onclick=closeQr;
document.getElementById("qrSend").onclick=()=>{ closeQr(); sendPicks("qr_sheet"); }; // no delay: the share sheet needs the tap
qrDlg.addEventListener("keydown",e=>{ if(e.key==="Escape") closeQr(); });
document.getElementById("openPicks").onclick=()=>{ pkSource="paste"; pkOpen("paste"); track("edc_picks_paste_open",{where:"my_plan"}); };
// Quick start in the home-screen app: bring picks over from the browser
if(isStandalone){
  document.getElementById("introBring").hidden=false;
  document.getElementById("introBringBtn").onclick=()=>{ closeIntro(); setTimeout(()=>{ pkSource="paste"; pkOpen("paste"); },380); track("edc_picks_paste_open",{where:"quick_start"}); };
}
// the home-screen steps (browser only): copy picks first when there are any
document.getElementById("a2hsCopy").onclick=()=>sendPicks("a2hs");
new MutationObserver(()=>{ if(!a2hsDlg.hidden) document.getElementById("a2hsCopyBox").hidden=!myPickCount(); }).observe(a2hsDlg,{attributes:true,attributeFilter:["hidden"]});
// compare bar on My Plan: one chip per saved friend's plan; tap to compare, tap again to stop
let cmpArmed=null;
function drawCmpBar(){
  const bar=document.getElementById("cmpBar"), l=friendsGet(), F=activeFriend();
  if(!l.length){ bar.hidden=true; bar.innerHTML=""; return; }
  bar.hidden=false;
  let both="";
  if(F){ const n=A.filter(a=>picks[slug(a[0])]==="yes"&&F.picks[slug(a[0])]==="yes").length; both=`<p class="cmp-sum">${n?`You and ${escH(F.name)} are both going to <b>${n}</b> act${n>1?"s":""} on ${DAYS[day].name}.`:`No shared Going acts on ${DAYS[day].name} yet.`} <span class="pc-f is-yes" aria-hidden="true">${escH(F.name.charAt(0).toUpperCase())}</span> marks ${escH(F.name)}'s picks.</p>`; }
  bar.innerHTML=`<div class="cmp-row"><span class="cmp-l">Compare with</span>${l.map(f=>`<button type="button" class="chip cmp-chip" data-cmp="${f.id}" aria-pressed="${F&&F.id===f.id}">${escH(f.name)}</button>`).join("")}${F?`<button type="button" class="cmp-rm" data-cmp-rm="${F.id}">Remove</button>`:""}</div>`+both;
}
document.getElementById("cmpBar").addEventListener("click",e=>{
  const c=e.target.closest("[data-cmp]");
  if(c){ const F=activeFriend(), on=!(F&&F.id===c.dataset.cmp); setCompare(on?c.dataset.cmp:null); track("edc_compare_toggle",{on}); return; }
  const r=e.target.closest("[data-cmp-rm]");
  if(r){
    if(!cmpArmed){ r.textContent="Tap again to remove"; cmpArmed=setTimeout(()=>{ cmpArmed=null; drawCmpBar(); },4000); return; }
    clearTimeout(cmpArmed); cmpArmed=null;
    friendsSet(friendsGet().filter(f=>f.id!==r.dataset.cmpRm)); setCompare(null); track("edc_compare_remove");
  }
});
// a friend's act you haven't picked: open it in the Lineup
document.getElementById("planChips").addEventListener("click",e=>{
  const c=e.target.closest("[data-lineup]"); if(!c) return;
  show("lineup"); try{history.replaceState(null,"","#lineup")}catch(_){}
  const card=[...grid.querySelectorAll(".card")].find(x=>slug(x.querySelector(".name").textContent)===c.dataset.lineup);
  if(card){ card.scrollIntoView({block:"center",behavior:reducedMotion()?"auto":"smooth"}); card.classList.add("flash"); setTimeout(()=>card.classList.remove("flash"),1600); }
  track("edc_compare_open_act");
});
// the day switch on My Plan redraws the bar's count
document.getElementById("planDays").addEventListener("click",()=>setTimeout(drawCmpBar,0));
drawCmpBar(); renderPlan();
// opening a picks link: clear it from the address bar first (so it never rides along on anything), then ask
// The link is kept in sessionStorage until the sheet is answered, so the one-time reload after an update
// (index.html) can't lose it.
function pkFromHash(){
  let src=/^#picks=/i.test(location.hash)?location.hash:"";
  if(src){ try{ sessionStorage.setItem("edc-pk-pending",src); }catch(_){} }
  else{ if(!pkDlg.hidden) return; try{ src=sessionStorage.getItem("edc-pk-pending")||""; }catch(_){} if(!src) return; }
  const d=pkDecode(src);
  try{ history.replaceState(null,"",location.pathname+location.search); }catch(_){}
  if(!d){ try{ sessionStorage.removeItem("edc-pk-pending"); }catch(_){} }
  if(!d){ toast("That picks link didn't work. Ask for a fresh one."); return; }
  pkSource="link"; track("edc_picks_link_open",{source:"link",picks:Object.keys(d.picks).length,unknown:d.unknown,first_visit:!introSeen});
  // on a first visit Quick start is up: show the picks after it closes
  if(!introEl.hidden){ const mo=new MutationObserver(()=>{ if(introEl.hidden){ mo.disconnect(); setTimeout(()=>pkOpen("open",d),380); } }); mo.observe(introEl,{attributes:true,attributeFilter:["hidden"]}); return; }
  pkOpen("open",d);
}
window.addEventListener("hashchange",pkFromHash); pkFromHash();
