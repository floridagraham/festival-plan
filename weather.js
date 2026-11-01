// Live weather for Tinker Field (zip 32805) on the Travel tab (Graham and Rebekah, Nov 1). Everything comes from the
// National Weather Service: free, no key, public domain, and its forecast is made per 1.5-mile square of map.
// Each phone asks directly and keeps the last answer in localStorage, since festival signal is bad.
const API="https://api.weather.gov/";
const POINT="28.5391,-81.4047"; // same spot as venue in transport.json
const HOURLY=API+"gridpoints/MLB/25,68/forecast/hourly"; // the square holding that spot (lookup: /points/<POINT>)
const ALERTS=API+"alerts/active?point="+POINT;
const LATEST=API+"stations/KORL/observations/latest"; // Orlando Executive Airport, the closest live reading
const STATION_NOTE="Live reading from Orlando Executive Airport, about 4 miles away";
const KEY="edc-weather", FRESH=15*60e3, OBS_MAX=2*3600e3;
const TZ="America/New_York";
const DAYS={
  fri:{name:"Friday",short:"Fri",ymd:"2026-11-06",next:"2026-11-07"},
  sat:{name:"Saturday",short:"Sat",ymd:"2026-11-07",next:"2026-11-08"},
  sun:{name:"Sunday",short:"Sun",ymd:"2026-11-08",next:"2026-11-09"}
};

const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
const svg=(p,cls="ic")=>`<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const CLOUD='<path d="M7 18a4 4 0 0 1-.6-8A5.5 5.5 0 0 1 17 9.5a4.3 4.3 0 0 1 0 8.5Z"/>';
const SUN='<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>';
const MOON='<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/>';
const PARTLY_DAY='<circle cx="8" cy="8" r="3"/><path d="M8 2v1M2 8h1M3.8 3.8l.7.7M12.2 3.8l-.7.7"/><path d="M9 20a3.5 3.5 0 0 1-.5-7 4.8 4.8 0 0 1 9.2-.4A3.8 3.8 0 0 1 17.5 20Z"/>';
const PARTLY_NIGHT='<path d="M12 6.5A4 4 0 0 1 7 2.8a4.6 4.6 0 1 0 5 3.7Z"/><path d="M9 21a3.5 3.5 0 0 1-.5-7 4.8 4.8 0 0 1 9.2-.4 3.8 3.8 0 0 1-.2 7.4Z"/>';
const RAIN='<path d="M7 14a4 4 0 0 1-.6-8A5.5 5.5 0 0 1 17 5.5 4.3 4.3 0 0 1 17 14Z"/><path d="M8 18l-1 3M13 18l-1 3M18 18l-1 3"/>';
const STORM='<path d="M7 14a4 4 0 0 1-.6-8A5.5 5.5 0 0 1 17 5.5 4.3 4.3 0 0 1 17 14"/><path d="m13 11-3 5h4l-3 5"/>';
const FOG='<path d="M4 8h16M6 12h12M4 16h16M8 20h8"/>';
const DROP='<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z"/>';
const WARN='<path d="M12 4 2.5 20h19Z"/><path d="M12 10v4M12 17.5v.01"/>';

function iconFor(text,isDay){
  const t=String(text).toLowerCase();
  if(/thunder/.test(t)) return STORM;
  if(/rain|shower|drizzle/.test(t)) return RAIN;
  if(/fog|haze|smoke|mist/.test(t)) return FOG;
  if(/partly|mostly sunny|mostly clear/.test(t)) return isDay?PARTLY_DAY:PARTLY_NIGHT;
  if(/cloud|overcast/.test(t)) return CLOUD;
  return isDay?SUN:MOON;
}
const sentence=s=>{s=String(s).toLowerCase();return s.charAt(0).toUpperCase()+s.slice(1);};
const hourLabel=h=>h===0?"12 AM":h===12?"12 PM":h<12?h+" AM":(h-12)+" PM";
const clock=ms=>new Date(ms).toLocaleTimeString("en-US",{timeZone:TZ,hour:"numeric",minute:"2-digit"});
const todayYmd=()=>new Date().toLocaleDateString("en-CA",{timeZone:TZ});
const ago=ms=>{const m=Math.max(0,Math.round((Date.now()-ms)/60e3));return m<1?"just now":m===1?"1 min ago":m+" min ago";};

function read(){try{return JSON.parse(localStorage.getItem(KEY))||null}catch(e){return null}}
function write(v){try{localStorage.setItem(KEY,JSON.stringify(v))}catch(e){}}

const slimHour=p=>({t:p.startTime,ymd:p.startTime.slice(0,10),h:+p.startTime.slice(11,13),temp:p.temperature,f:p.shortForecast,
  day:p.isDaytime,rain:p.probabilityOfPrecipitation?.value??0,wind:p.windSpeed,hum:p.relativeHumidity?.value??null});
const slimAlert=f=>({event:f.properties.event,headline:f.properties.headline,ends:f.properties.ends||f.properties.expires});
function slimObs(p){
  const c=p.temperature?.value; if(c==null) return null;
  const kmh=p.windSpeed?.value;
  return {at:p.timestamp,temp:Math.round(c*9/5+32),wind:kmh==null?null:Math.round(kmh*.6214),hum:p.relativeHumidity?.value==null?null:Math.round(p.relativeHumidity.value),text:p.textDescription||""};
}
async function get(url){
  const ctl=new AbortController(), timer=setTimeout(()=>ctl.abort(),8000);
  try{const r=await fetch(url,{signal:ctl.signal});if(!r.ok)throw new Error(r.status);return await r.json();}
  finally{clearTimeout(timer);}
}
// the Weather Service's forecast address gives an occasional 500: one quick second try
const getTwice=url=>get(url).catch(()=>new Promise(r=>setTimeout(r,1500)).then(()=>get(url)));

// the hours people are on the grounds: gates at 1 PM through the midnight hour
const festHours=(hours,d)=>(hours||[]).filter(p=>(p.ymd===DAYS[d].ymd&&p.h>=13)||(p.ymd===DAYS[d].next&&p.h===0));
// the whole calendar day, 12 AM to 11 PM (Graham, Nov 1). The strip shows these; the tip still looks at festival hours.
const allHours=(hours,d)=>(hours||[]).filter(p=>p.ymd===DAYS[d].ymd);

// one plain line on what the day calls for, worked out from that day's numbers
function dayTip(hrs){
  const temps=hrs.map(p=>p.temp), high=Math.max(...temps), last=hrs[hrs.length-1], late=last.temp;
  const when=last.h===0?"midnight":hourLabel(last.h), rain=Math.max(...hrs.map(p=>p.rain)), tips=[];
  if(hrs.some(p=>/thunder/i.test(p.f))) tips.push(`Thunderstorms in the forecast (${rain}% chance). Watch for official updates.`);
  else if(rain>=50) tips.push(`Rain likely (${rain}% chance). Pack a poncho.`);
  else if(rain>=30) tips.push(`Rain possible (${rain}% chance). A poncho is worth carrying.`);
  if(late<=50) tips.push(`Cold night: ${late}° by ${when}. Bring a real jacket.`);
  else if(late<=60) tips.push(`Chilly by ${when} (${late}°). Bring a jacket or hoodie.`);
  else if(late<=68) tips.push(`Cool by ${when} (${late}°). Bring a light layer.`);
  if(high>=88) tips.push(`Hot afternoon (${high}°). Drink water often.`);
  // the forecast runs out partway through a day that's still 6 days off: don't call the night warm yet
  if(last.h!==0) tips.push(`The forecast so far stops at ${when} (${late}°). Check back tomorrow for the late hours.`);
  return tips.length?tips.join(" "):`No jacket needed: ${high}° at the warmest and ${late}° by ${when}.`;
}

let track=()=>{}, selected=null, busy=false, lastStatus="";
const body=()=>document.getElementById("wxBody");
const status=t=>{const el=document.getElementById("wxStatus"); if(el&&t!==lastStatus){el.textContent=t;lastStatus=t;}};

function nowCard(data){
  const nowMs=Date.now(), hour=(data.hours||[]).find(p=>{const s=Date.parse(p.t);return nowMs>=s&&nowMs<s+3600e3;});
  const obs=data.obs&&nowMs-Date.parse(data.obs.at)<OBS_MAX?data.obs:null;
  if(!hour&&!obs) return "";
  const text=(obs&&obs.text)||(hour&&hour.f)||"";
  const isDay=hour?hour.day:true;
  const wind=obs&&obs.wind!=null?obs.wind+" mph":hour&&hour.wind;
  const hum=obs&&obs.hum!=null?obs.hum:hour&&hour.hum;
  const facts=[hour?`Rain ${hour.rain}%`:"",wind?`Wind ${wind}`:"",hum!=null&&hum!==false?`Humidity ${hum}%`:""].filter(Boolean);
  return `<div class="wx-now">
    ${svg(iconFor(text,isDay),"wx-nowic")}
    <div class="wx-nowtxt"><div class="wx-temp">${obs?obs.temp:hour.temp}°</div><div class="wx-cond">${esc(sentence(text||"Now"))}</div></div>
    <ul class="wx-facts">${facts.map(f=>`<li>${esc(f)}</li>`).join("")}</ul>
    <p class="wx-from">${obs?`${STATION_NOTE}, ${ago(Date.parse(obs.at))}.`:"Forecast for this hour at Tinker Field."}</p>
  </div>`;
}

function dayPanel(data){
  const hrs=allHours(data.hours,selected), fest=festHours(data.hours,selected), d=DAYS[selected];
  if(!hrs.length){
    const over=todayYmd()>d.ymd;
    return `<p class="wx-tip">${over?`${d.name} is over.`:`${d.name}'s forecast isn't out yet. The Weather Service looks about 6 days ahead, so check back tomorrow.`}</p>`;
  }
  const tip=fest.length?dayTip(fest):`The forecast so far stops at ${hourLabel(hrs[hrs.length-1].h)}. Check back tomorrow for the festival hours.`;
  return `<p class="wx-tip">${esc(tip)}</p>
  <ul class="wx-strip" id="wxStrip" tabindex="0" aria-label="Hour by hour for ${d.name}">${hrs.map(p=>`<li>
    <span class="wx-h${p.h>=13?" wx-fest":""}">${hourLabel(p.h)}</span>
    ${svg(iconFor(p.f,p.day))}<span class="sr">${esc(p.f)}</span>
    <b>${p.temp}°</b>
    <span class="wx-r">${svg(DROP)}<span class="sr">Rain chance </span>${p.rain}%</span>
  </li>`).join("")}</ul>
  <p class="wx-from">Gates open at 1 PM. Festival hours are in amber.</p>`;
}

function dayButton(data,k){
  const hrs=allHours(data.hours,k), d=DAYS[k], temps=hrs.map(p=>p.temp);
  const line=!hrs.length?"Not out yet":hrs[hrs.length-1].h===23?`${Math.min(...temps)}° to ${Math.max(...temps)}°`:`High ${Math.max(...temps)}°`;
  return `<button type="button" data-wxd="${k}" aria-pressed="${k===selected}"><b>${d.short}</b><small>${line}</small></button>`;
}

function render(data){
  const el=body(); if(!el) return;
  const focus=document.activeElement?.dataset?.wxd;
  const scroll=document.getElementById("wxStrip")?.scrollLeft||0;
  const now=Date.now();
  const alerts=(data.alerts||[]).filter(a=>!a.ends||Date.parse(a.ends)>now);
  el.innerHTML=alerts.map(a=>`<div class="wx-alert">${svg(WARN)}<div><b>${esc(a.event)}</b><span>${esc(a.headline||"")}</span></div></div>`).join("")
    +nowCard(data)
    +`<h3 class="wx-sub">Hour by hour, all day</h3><div class="wx-days">${Object.keys(DAYS).map(k=>dayButton(data,k)).join("")}</div>`
    +dayPanel(data);
  const strip=document.getElementById("wxStrip"); if(strip) strip.scrollLeft=scroll;
  if(focus) el.querySelector(`[data-wxd="${focus}"]`)?.focus();
}

async function load(force){
  if(busy) return;
  const saved=read();
  if(saved) render(saved);
  if(!force&&saved&&Date.now()-saved.at<FRESH){status(`Updated ${clock(saved.at)}.`);return;}
  busy=true; status("Checking the forecast...");
  const [h,a,o]=await Promise.allSettled([getTwice(HOURLY),get(ALERTS),get(LATEST)]);
  busy=false;
  const next={...(saved||{})};
  if(a.status==="fulfilled") next.alerts=a.value.features.map(slimAlert);
  if(o.status==="fulfilled"){const obs=slimObs(o.value.properties); if(obs) next.obs=obs;}
  if(h.status==="fulfilled"){next.hours=h.value.properties.periods.map(slimHour);next.at=Date.now();}
  if(next.hours){
    write(next); render(next);
    status(h.status==="fulfilled"?`Updated ${clock(next.at)}.`:`No signal right now. Showing the forecast saved at ${clock(next.at)}.`);
  }else{
    const el=body();
    if(el) el.innerHTML=`<p class="wx-tip">The forecast needs signal the first time. Try again when you have bars.</p>`;
    status("Couldn't reach the Weather Service.");
  }
  if(h.status!=="fulfilled") track("edc_weather_failed",{saved:!!saved});
}

let started=false;
export function weatherOpen(){ if(started) load(false); }
export function startWeather(opts){
  track=opts.track; selected=opts.day()||"sat"; started=true;
  body()?.addEventListener("click",e=>{
    const b=e.target.closest("[data-wxd]"); if(!b) return;
    selected=b.dataset.wxd; const s=read(); if(s) render(s);
    document.getElementById("wxStrip")?.scrollTo(0,0);
    track("edc_weather_day",{day:selected});
  });
  document.getElementById("wxRefresh")?.addEventListener("click",()=>{load(true);track("edc_weather_refresh");});
  const onTravel=()=>document.body.dataset.view==="travel"&&!document.hidden;
  document.addEventListener("visibilitychange",()=>{if(onTravel())load(false);});
  setInterval(()=>{if(onTravel())load(false);},5*60e3);
  if(onTravel()) load(false);
}
