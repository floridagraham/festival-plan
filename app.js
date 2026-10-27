import {spring,SPRING,sheet,reducedMotion} from "./motion.js";
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
const mk=(id,label)=>{const b=document.createElement("button");b.className="chip";b.id="f-"+id;b.textContent=label;b.setAttribute("aria-pressed","false");filters.insertBefore(b,qEl);return b;};
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
  document.getElementById("estnote").hidden=real;
  updSum();
  let list=A.map((a,i)=>[a,i+1,when(a)]).filter(([a,,w])=>
    (tod==="all"||w.k===tod)&&(stageF==="all"||w.st.stage===stageF)&&(genre==="all"||a[1]===genre)&&(!gemsOnly||a[5].includes("gem"))&&(!q||(a[0]+" "+a[2]).toLowerCase().includes(q))
    &&(pickF==="all"||(pickF==="none"?!picks[slug(a[0])]:picks[slug(a[0])]===pickF)));
  if(tod!=="all"||stageF!=="all") list.sort((x,y)=>(x[2].st.start||"99").localeCompare(y[2].st.start||"99"));
  const t={yes:0,maybe:0,no:0}; A.forEach(a=>{const v=picks[slug(a[0])]; if(v) t[v]++;});
  document.getElementById("tally").innerHTML=tallyHTML(t);
  count.textContent=`${DAYS[day].name}${stageF!=="all"?" · "+STAGE_NAMES[stageF]:""}: showing ${list.length} of ${A.length} acts`+(tod!=="all"||stageF!=="all"?", in time order":"");
  grid.innerHTML=list.length?list.map(([a,n,w])=>{
    const g=G[a[1]], f=a[5];
    const sc=STAGE_COL[w.st.stage]||"#c9b8ff";
    const when2=`<div class="when2"><span>${w.k==="aft"?SUN_ICO:MOON_ICO} ${(w.real?"":"~")+fmt(w.st.start)+(w.real&&w.st.end?" to "+fmt(w.st.end):"")}</span>${w.st.stage?`<span class="sdot" style="--sc:${sc}"><i aria-hidden="true"></i>${STAGE_NAMES[w.st.stage]||w.st.stage}</span>`:""}${w.real?"":'<span class="sr">(estimated)</span>'}</div>`;
    const tags=`<span class="tag">${a[2]}</span>`+(f.includes("sun")?`<span class="tag sun">${SUNSET_ICO} Sunset set</span>`:"")+(f.includes("gem")?`<span class="tag gem">${GEM_ICO} Discovery</span>`:"")+(f.includes("guess")?'<span class="tag guess">Genre best guess</span>':"");
    const parts=a[0].split(" B2B ");
    const links=a[4].map((t,i)=>{const who=a[4].length>1?(parts[i]||t):a[0];return `<a class="yt" data-act="${slug(a[0])}" data-who="${who}" href="${url(t)}" target="_blank" rel="noopener" aria-label="${who} on YouTube Music (opens new tab)">${ytIcon}</a><a class="sp" data-act="${slug(a[0])}" data-who="${who}" href="${spUrl(t)}" target="_blank" rel="noopener" aria-label="${who} on Spotify (opens new tab)">${spIcon}</a>`;}).join("");
    const id=slug(a[0]), v=picks[id]||"";
    const vote=`<div class="vote" role="group" aria-label="Rate ${a[0]}">${[["yes",CHECK_ICO,"Going"],["maybe",MAYBE_ICO,"Maybe"],["no",X_ICO,"Skip"]].map(([k,e,l])=>`<button data-id="${id}" data-v="${k}" data-label="${a[0]}" aria-pressed="${v===k}"><span class="vk-i" aria-hidden="true">${e}</span><span class="vk-l">${l}</span></button>`).join("")}</div>`;
    const op=expanded.has(id);
    return `<article class="card${v?" is-"+v:""}${op?" open":""}" style="--g:${g.hex}"><div class="top"><h3 class="name">${a[0]}</h3><span class="rank" aria-label="Billing rank ${n}">#${n}</span><button class="xbtn" data-x="${id}" aria-expanded="${op}" aria-label="More about ${a[0]}">▾</button></div>${when2}<div class="tags">${tags}</div><p class="vibe">${a[3]}</p><div class="actions">${vote}<div class="links">${links}</div></div></article>`;
  }).join(""):'<div class="empty">No acts match. Clear the search or pick another filter.</div>';
}

// Afterparties (researched Oct 25, 2026). Official = Insomniac-run.
const PGM=a=>"https://www.google.com/maps/dir/?api=1&destination="+encodeURIComponent(a);
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
  <div class="btns"><a class="btn" data-pk="tickets" data-pid="${pt.id}" href="${pt.tix}" target="_blank" rel="noopener" aria-label="Tickets for ${pt.name} (opens new tab)">${TICKET_ICO} Tickets</a><a class="btn alt" data-pk="directions" data-pid="${pt.id}" href="${PGM(pt.addr)}" target="_blank" rel="noopener" aria-label="Directions to ${pt.venue.split(" · ")[0]} (opens new tab)">${PIN_ICO} Directions</a></div></article>`;
}
function renderParties(){
  const list=PARTIES[day]||[];
  count.textContent=`${DAYS[day].name} night: ${list.length} afterparties. Outlined artists also play the festival. Tap a name to listen.`;
  let html=list.map(partyCard).join("");
  if(day==="fri") html+='<div class="thu">Thursday Nov 5 · Pre-parties</div>'+PARTIES.thu.map(partyCard).join("");
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
document.getElementById("introHelp").onclick=()=>openIntro("help_button");
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
function a2hsShort(){ return isIOS?"In Safari, tap <b>Share</b>, then <b>Add to Home Screen</b>.":"In Chrome, tap the <b>three dots</b>, then <b>Add to Home screen</b>."; }
function hideA2hsBar(){ a2hsBar.hidden=true; document.body.classList.remove("has-a2hs"); }
if(!isStandalone&&(isIOS||isAndroid)){
  document.getElementById("introA2hs").hidden=false;
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
document.getElementById("a2hsHow").onclick=async()=>{
  if(installPrompt){
    const p=installPrompt; installPrompt=null; p.prompt();
    try{ const r=await p.userChoice; track("edc_a2hs_prompt",{outcome:r.outcome}); if(r.outcome==="accepted") hideA2hsBar(); }catch(e){}
    return;
  }
  a2hsReturn=document.activeElement; a2hsSheet.open(); a2hsDlg.querySelector(".intro-card").focus();
  track("edc_a2hs_steps_opened",{platform:isIOS?"ios":"android"});
};
document.getElementById("a2hsGo").onclick=closeA2hs;
a2hsDlg.addEventListener("keydown",e=>{if(e.key==="Escape") closeA2hs();});
document.getElementById("a2hsX").onclick=()=>{ hideA2hsBar(); try{sessionStorage.setItem("edc-a2hs-hidden","1")}catch(e){} track("edc_a2hs_bar_hidden"); };

// sticky bar: filter panel, filter summary, compact view
const ftog=document.getElementById("ftoggle"), panel=document.getElementById("actfilters"), vtog=document.getElementById("vtoggle");
const expanded=new Set();
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
function updSum(){const bits=[];if(stageF!=="all")bits.push(STAGE_NAMES[stageF]);if(genre!=="all")bits.push(G[genre].label);if(gemsOnly)bits.push("Discovery");if(pickF!=="all")bits.push({yes:"Going",maybe:"Maybe",no:"Skip",none:"Not rated"}[pickF]);if(q)bits.push('"'+q+'"');document.getElementById("fsum").textContent=bits.length?"· "+bits.join(", "):"";}
let compact=window.matchMedia("(max-width:600px)").matches;
try{const c=localStorage.getItem("edc-compact");if(c!==null)compact=c==="1";}catch(e){}
function setCompact(c){compact=c;grid.classList.toggle("compact",c);vtog.setAttribute("aria-pressed",c);try{localStorage.setItem("edc-compact",c?"1":"0")}catch(e){}trackContext({compact:c});}
setCompact(compact);
vtog.onclick=()=>{setCompact(!compact);render();track("edc_view_toggle",{compact});};
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
  document.getElementById("mixh").textContent=DAYS[d].name+"'s sound";
  syncTopMap();
  try{localStorage.setItem("edc-day",d)}catch(e){}
  drawMix(); render();
  trackContext({day:d}); track("edc_day_tab",{day:d});
}
document.querySelectorAll(".seg.days button").forEach(b=>b.onclick=()=>setDay(b.dataset.d));
document.querySelectorAll("#times button").forEach(b=>b.onclick=()=>{tod=b.dataset.t;document.querySelectorAll("#times button").forEach(x=>x.setAttribute("aria-pressed",x===b));timePill();render();track("edc_filter",{type:"time",value:tod});});
let saved="sat"; try{saved=localStorage.getItem("edc-day")||"sat"}catch(e){}
setDay(DAYS[saved]?saved:"sat");


// grounds map (schematic of 2025 layout)
const STG=MAP_DATA.stages;
function mapSVG(uid){
  const st=STG.map(t=>`<g class="stg" data-s="${t.id}" tabindex="0" role="button" aria-label="${t.name}, ${t.d.split(/[.,]/)[0]}"><circle cx="${t.x}" cy="${t.y}" r="36" fill="transparent" pointer-events="all"/><circle class="ring" cx="${t.x}" cy="${t.y}" r="17" fill="${t.color}" fill-opacity=".25" stroke="${t.color}" stroke-width="2"/><circle cx="${t.x}" cy="${t.y}" r="9" fill="${t.color}"/><text x="${t.lx}" y="${t.ly}" text-anchor="${t.a||"middle"}" font-family="Unbounded, Arial Black, sans-serif" font-weight="700" font-size="13" fill="#f6f1ff" stroke="#120a2e" stroke-width="3" paint-order="stroke">${t.name}</text></g>`).join("");
  const lbl=(x,y,t,o="")=>`<text x="${x}" y="${y}" font-family="Figtree, sans-serif" font-weight="700" font-size="11" fill="#c9b8ff" ${o}>${t}</text>`;
  const aid=(x,y)=>`<g aria-hidden="true"><circle cx="${x}" cy="${y}" r="11" fill="#ff3b5c" stroke="#fff" stroke-width="1.5"/><path d="M${x-5} ${y}h10M${x} ${y-5}v10" stroke="#fff" stroke-width="3" stroke-linecap="round"/></g>`;
  const ico=(x,y,p,t)=>`<g><circle cx="${x}" cy="${y}" r="11" fill="#120a2e" stroke="#c9b8ff" stroke-width="1.2"/><g transform="translate(${x-7},${y-7}) scale(.58)" fill="none" stroke="#f6f1ff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${p}</g>${t?`<text x="${x}" y="${y+24}" text-anchor="middle" font-family="Figtree, sans-serif" font-weight="700" font-size="10" fill="#f6f1ff">${t}</text>`:""}</g>`;
  const P_CAR='<path d="M4 16V11l2-5h12l2 5v5"/><path d="M4 16h16M7 16v2M17 16v2"/><circle cx="7.5" cy="14" r=".8" fill="#f6f1ff" stroke="none"/><circle cx="16.5" cy="14" r=".8" fill="#f6f1ff" stroke="none"/>';
  const P_BUS='<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M3 11h18M7 17v2M17 17v2"/><circle cx="7.5" cy="14" r=".8" fill="#f6f1ff" stroke="none"/><circle cx="16.5" cy="14" r=".8" fill="#f6f1ff" stroke="none"/>';
  const P_SPARKLE='<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>';
  const P_DROP='<path d="M12 3s7 7.5 7 12a7 7 0 1 1-14 0c0-4.5 7-12 7-12Z"/>';
  const P_REST='<circle cx="12" cy="6" r="3"/><path d="M7 21l2-9h6l2 9M9 12V9h6v3"/>';
  const P_PLUS='<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>';
  return `<svg viewBox="0 0 545 420" role="group" aria-label="Map of EDC Orlando grounds at Tinker Field. Stages are buttons.">
  <defs><linearGradient id="gf${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a1d78"/><stop offset="1" stop-color="#1c3f73"/></linearGradient></defs>
  <polygon points="15,50 290,50 290,130 525,130 525,197 480,197 480,325 300,325 300,400 260,390 190,375 120,345 60,315 20,285" fill="url(#gf${uid})" stroke="#ff4fb4" stroke-width="3" stroke-linejoin="round"/>
  <rect x="290" y="13" width="70" height="37" rx="6" fill="#2a1d78" stroke="#ff4fb4" stroke-width="2"/>
  ${lbl(298,36,"Box office")}
  <rect x="165" y="65" width="95" height="115" rx="10" fill="#3a2a8a" stroke="#7d6cd9" stroke-width="1.5"/>
  ${lbl(214,84,"Grandstand",'text-anchor="middle"')}
  <path d="M300 192 L440 192" stroke="#ffb627" stroke-width="5" stroke-linecap="round" opacity=".7"/>
  ${lbl(305,186,"Rainbow Road")}
  <path d="M165 215 L235 320" stroke="#ff7a59" stroke-width="5" stroke-linecap="round" opacity=".6"/>
  ${lbl(150,232,"Daisy Lane",'transform="rotate(56 150 232)"')}
  ${lbl(298,150,"Rainbow Bazaar · Ferris wheel")}
  ${lbl(88,205,"Pixel Forest",'text-anchor="middle"')}
  ${lbl(265,205,"Kandi Casino",'text-anchor="middle"')}
  ${lbl(292,298,"Daisy Fields",'text-anchor="middle"')}
  ${lbl(150,40,"W Church St",'text-anchor="middle"')}
  ${lbl(8,180,"S Tampa Ave",'transform="rotate(-90 8 180)" text-anchor="middle"')}
  ${lbl(400,350,"W Anderson St")}
  ${lbl(498,265,"S Nashville Ave",'transform="rotate(-90 498 265)" text-anchor="middle"')}
  ${lbl(150,385,"State Road 408",'transform="rotate(24 150 385)" text-anchor="middle"')}
  <path d="M445 70 L445 122" stroke="#ffb627" stroke-width="10" stroke-linecap="round"/><path d="M432 108 L445 124 L458 108" stroke="#ffb627" stroke-width="5" fill="none" stroke-linecap="round"/>
  <text x="445" y="60" text-anchor="middle" font-family="Unbounded, Arial Black, sans-serif" font-weight="800" font-size="13" fill="#ffb627">ENTRANCE</text>
  ${ico(272,345,P_CAR,"Lyft")}${ico(312,340,P_BUS,"Shuttle")}${ico(352,334,P_SPARKLE,"SkyDeck")}
  ${ico(205,375,P_DROP,"")}${["374,31","140,150","190,195","237,145","447,217","354,316"].map(c=>{const [x,y]=c.split(",").map(Number);return ico(x,y,P_REST,"");}).join("")}${aid(60,175)}${aid(500,145)}${ico(140,90,P_DROP,"")}
  <g transform="translate(515 395)"><circle r="14" fill="#120a2e" stroke="#ff4fb4" stroke-width="2"/><text y="5" text-anchor="middle" font-family="Unbounded, sans-serif" font-weight="800" font-size="13" fill="#f6f1ff">N</text></g>
  ${st}</svg>`;
}
document.querySelectorAll(".gmap:not(.gmap-top)").forEach((box,i)=>{
  box.querySelector(".svgwrap").innerHTML=mapSVG(i);
  const info=box.querySelector(".ginfo");
  const pick=id=>{const t=STG.find(x=>x.id===id);box.querySelectorAll(".stg").forEach(g=>g.classList.toggle("on",g.dataset.s===id));info.style.setProperty("--sc",t.color);const acts=A.map(a=>[a,when(a)]).filter(([,w])=>w.st.stage===id).sort((x,y)=>x[1].st.start.localeCompare(y[1].st.start));const real=acts.some(([,w])=>w.real);info.innerHTML=`<b>${t.name}</b><br>${t.d}<br><span style="color:var(--amber)">${DAYS[day].name}, ${real?"official":"best-guess"} lineup here:</span><br>`+acts.map(([a,w])=>`${w.k==="aft"?SUN_ICO:MOON_ICO} ${fmt(w.st.start)} · ${a[0]}${({yes:" "+CHECK_ICO,maybe:" "+MAYBE_ICO,no:" "+X_ICO})[picks[slug(a[0])]]||""}`).join("<br>");track("edc_map_stage_click",{stage:id,where:"map_tab",day,acts:acts.length,going:acts.filter(([a])=>picks[slug(a[0])]==="yes").length});};
  box.querySelectorAll(".stg").forEach(g=>{g.addEventListener("click",()=>pick(g.dataset.s));g.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();pick(g.dataset.s);}});});
});

// "Insomniac team" notes (Graham, Oct 27: if Insomniac finds the app, invite them to work together); shown once partnerLink is set
const partnerLink=(window.EDC_CONFIG||{}).partnerLink;
if(partnerLink&&/^https:\/\//.test(partnerLink)){
  document.querySelectorAll(".partner-link").forEach(a=>a.href=partnerLink);
  document.querySelectorAll(".partner-note").forEach(p=>p.hidden=false);
}
// tip jar (footer and opening screen): one button per link in config.js, hidden when there are none
const HEART_ICO=ico_('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/>');
const tipLinks=((window.EDC_CONFIG||{}).donateLinks||[]).filter(t=>t&&t.url&&t.label);
if(tipLinks.length){
  const esc=s=>String(s).replace(/[&<>"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[ch]);
  document.querySelectorAll(".tipbox").forEach(b=>b.hidden=false);
  document.querySelectorAll(".donate-row").forEach(row=>{row.innerHTML=tipLinks.map(t=>`<a class="btn donate donate-link" data-where="${row.dataset.where}" data-service="${esc(t.label)}" href="${esc(t.url)}" target="_blank" rel="noopener" aria-label="Leave a tip with ${esc(t.label)} (opens new tab)">${HEART_ICO} ${esc(t.label)}</a>`).join("");row.hidden=false;});
  // floating "Show your love" heart, bottom right (Graham, Oct 27): opens a sheet with the same tip buttons
  const loveBtn=document.getElementById("loveBtn"), loveDlg=document.getElementById("loveDlg");
  const loveSheet=sheet(loveDlg,{onDismiss:()=>closeLove()});
  const closeLove=()=>{ loveSheet.close(); loveBtn.focus(); };
  loveBtn.hidden=false; document.body.classList.add("has-love");
  // the card's fun: the big heart pops in on a spring and throws a burst of little hearts; tapping it throws more,
  // and tapping a tip button turns the card into a thank-you
  const loveArt=document.getElementById("loveArt"), loveBurstBox=loveDlg.querySelector(".love-burst");
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
  loveArt.onclick=()=>{ lovePop(); loveBurst(12); track("edc_love_hearts"); };
  loveDlg.addEventListener("click",e=>{
    if(!e.target.closest(".donate-link")) return;
    loveH.innerHTML="You're the <span>best</span>"; loveP.innerHTML="<p>Thank you. You just made my day, and you're part of why I built this.</p><p>Come find the good vibes on the dance floor. See you there.</p><p class=\"love-sig\">With love, Graham</p>";
    loveSmall.textContent="Your tip opened in a new tab."; loveX.textContent="Back to the app";
    lovePop(); loveBurst(20);
  });
  loveBtn.onclick=()=>{
    [loveH.innerHTML,loveP.innerHTML,loveSmall.textContent,loveX.textContent]=LOVE_TEXT;
    loveSheet.open(); loveDlg.querySelector(".intro-card").focus(); track("edc_love_open");
    setTimeout(()=>{ lovePop(); loveBurst(14); },300);
  };
  document.getElementById("loveX").onclick=closeLove;
  loveDlg.addEventListener("keydown",e=>{if(e.key==="Escape") closeLove();});
}

// map at the top of the lineup: tap a stage and its acts show right below, in time order.
// It drives the same stage filter as the Filters panel, so both always agree. Tap the stage again for all.
function syncTopMap(){
  const box=document.getElementById("topMap"); if(!box) return;
  box.querySelectorAll(".stg").forEach(g=>{const on=g.dataset.s===stageF; g.classList.toggle("on",on); g.setAttribute("aria-pressed",String(on));});
  const h=document.getElementById("topMapH"), clr=document.getElementById("topMapClear");
  if(stageF==="all"){h.textContent="Tap a stage"; clr.hidden=true;}
  else{const n=A.filter(a=>when(a).st.stage===stageF).length; h.textContent=STAGE_NAMES[stageF]+" · "+n+" acts"; clr.hidden=false;}
}
{
  const box=document.getElementById("topMap");
  box.querySelector(".svgwrap").innerHTML=mapSVG("top");
  // if the first matching act is below the fold, ease it into view without losing the map
  const showActs=()=>{const r=grid.getBoundingClientRect(); if(r.top>innerHeight*.8) window.scrollBy({top:r.top-innerHeight*.55,behavior:reducedMotion()?"auto":"smooth"});};
  const pickTop=id=>{const k=stageF===id?"all":id; setStage(k); track("edc_map_stage_click",{stage:id,where:"lineup",selected:k!=="all",day}); if(k!=="all") showActs();};
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
  const listEl=document.getElementById("planList"); if(!listEl) return;
  const showMaybe=document.getElementById("planMaybe").checked;
  const items=A.map(a=>({a,id:slug(a[0]),v:picks[slug(a[0])],w:when(a)}))
    .filter(x=>x.v==="yes"||(showMaybe&&x.v==="maybe"))
    .sort((x,y)=>x.w.st.start.localeCompare(y.w.st.start));
  const end=x=>x.w.st.end?toMin(x.w.st.end):toMin(x.w.st.start)+60;
  const going=items.filter(x=>x.v==="yes");
  going.forEach(x=>{x.clash=going.filter(y=>y!==x&&toMin(y.w.st.start)<end(x)&&toMin(x.w.st.start)<end(y)).map(y=>y.a[0]);});
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
      '<li class="plan-item is-'+x.v+(x.now?" is-now":"")+'" style="--sc:'+sc+'"><div class="pt-time">'+time+(x.w.real?"":'<span class="sr"> (estimated)</span>')+'</div>'+
      '<div class="pt-body"><h2 class="pt-name">'+x.a[0]+'</h2><div class="pt-stage"><i aria-hidden="true"></i>'+(STAGE_NAMES[st.stage]||"Stage to be announced")+'<span class="pt-pick">'+(x.v==="yes"?"Going":"Maybe")+'</span></div>'+(flags?'<div class="pt-flags">'+flags+'</div>':"")+'</div></li>';
  }).join("");
  const after=parties.length?'<li class="plan-after">After the festival</li>'+parties.map(p=>'<li class="plan-item party is-'+picks[p.id]+'" style="--sc:'+p.col+'"><div class="pt-time">'+p.time+'</div><div class="pt-body"><h2 class="pt-name">'+p.venue.split(" · ")[0]+'</h2><div class="pt-stage"><i aria-hidden="true"></i>'+p.name.replace(/ ft\..*$/,"")+'<span class="pt-pick">'+(picks[p.id]==="yes"?"Going":"Maybe")+'</span></div></div></li>').join(""):"";
  listEl.innerHTML=rows+after;
}
document.getElementById("planMaybe").onchange=e=>{renderPlan();track("edc_plan_maybes",{shown:e.target.checked});};
// keep "Playing now" and "Up next" current while the plan is open on a festival day
setInterval(()=>{if(!document.getElementById("v-plan").hidden) renderPlan();},60000);
planReady=true; renderPlan();

// stage logo in the header: the sunrise intro plays once per open, then the lasers keep sweeping
// (all CSS, see .rp-* in styles.css). Tapping it replays the intro.
document.getElementById("brandmark").addEventListener("click",e=>{
  const b=e.currentTarget; b.classList.remove("rp-run"); void b.getBoundingClientRect(); b.classList.add("rp-run");
  track("edc_logo_replay");
});

// tabs
const views=["lineup","plan","travel","map"];
function show(v){if(!views.includes(v))v="lineup";views.forEach(x=>{document.getElementById("v-"+x).hidden=x!==v;});document.querySelectorAll(".tabs a").forEach(a=>{if(a.dataset.v===v)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current");});window.scrollTo(0,0);document.body.dataset.view=v;trackContext({view:v});track("edc_section_tab",{section:v});}
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
  // shows once this phone is linked. A new phone of theirs links through floridagraham.github.io/festival-plan/#link.
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
  const id=b.dataset.id, prev=picks[id]||"", v=prev===b.dataset.v?"":b.dataset.v;
  if(v) picks[id]=v; else delete picks[id];
  render(); saveLocal();
  const nb=grid.querySelector('.vote button[data-id="'+CSS.escape(id)+'"][data-v="'+b.dataset.v+'"]');
  if(nb){const pop=spring(.86,s=>{nb.style.transform="scale("+s+")";},{preset:SPRING.bouncy,precision:.002});pop.to(1,{velocity:1.5,done:()=>{nb.style.transform="";}});}
  session.votes++;
  const filtered=tod!=="all"||stageF!=="all"||genre!=="all"||gemsOnly||pickF!=="all"||!!q;
  track("edc_vote",{...itemProps(id),kind:id.startsWith("p-")?"party":"act",vote:v||"cleared",from:prev||"none",time_filter:tod,filtered});
  if(sb&&code){pending[id]=v;savePending();syncStatus();flush();}
});
window.addEventListener("online",()=>connect().catch(()=>{}));
addEventListener("scroll",()=>{const h=document.documentElement.scrollHeight-innerHeight;if(h>0) session.maxScroll=Math.max(session.maxScroll,Math.round(scrollY/h*100));},{passive:true});
document.addEventListener("visibilitychange",()=>{if(document.visibilityState!=="hidden") return;
  track("edc_session_summary",{seconds:Math.round((Date.now()-session.start)/1000),votes:session.votes,listens:session.listens,expands:session.expands,max_scroll_pct:session.maxScroll},true);
  Object.assign(session,{start:Date.now(),votes:0,listens:0,expands:0,maxScroll:0});});
document.addEventListener("click",e=>{const a=e.target.closest("a[href^='http']"); if(!a||a.matches(".yt,.sp,[data-pk]")) return;
  let u; try{u=new URL(a.href);}catch(_){return;}
  const ctx=a.closest(".line")?.querySelector(".ln")?.firstChild?.textContent?.trim();
  track(a.matches(".donate-link")?"edc_donate_click":"edc_outbound_click",{...(a.dataset.where?{where:a.dataset.where,service:a.dataset.service}:{}),host:u.host,path:u.pathname.slice(0,80),label:(a.getAttribute("aria-label")||a.textContent).trim().replace(/\s+/g," ").slice(0,80),...(ctx?{context:ctx}:{})});});
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
