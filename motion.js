// Springs and rubber banding, after how iOS does it (see docs/ios-feel.md).
// A spring only knows its target: retarget it mid-motion and it keeps its speed instead of restarting,
// which is what makes things feel like they're in your hand. Reduced motion jumps straight to the end.

// SwiftUI-style presets: same idea as .smooth / .snappy / .bouncy, with shorter responses for small UI.
export const SPRING={
  smooth:{response:.4,ratio:1},
  snappy:{response:.35,ratio:.85},
  bouncy:{response:.4,ratio:.62}
};

export const reducedMotion=()=>window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// m*x'' = -k*x - b*x' with m = 1, k = (2π / response)², b = 2 * ratio * √k
export function spring(value,onUpdate,{preset=SPRING.snappy,precision=.5}={}){
  let x=value,v=0,target=value,p=preset,raf=0,last=0,onRest=null;
  const settle=()=>{x=target;v=0;raf=0;onUpdate(x);const f=onRest;onRest=null;if(f) f();};
  function frame(t){
    const dt=Math.min(.064,(t-last)/1000); last=t;
    const k=(2*Math.PI/p.response)**2, b=2*p.ratio*Math.sqrt(k);
    // small fixed substeps keep stiff springs stable at any frame rate
    const n=Math.max(1,Math.ceil(dt/.004)), h=dt/n;
    for(let i=0;i<n;i++){const a=-k*(x-target)-b*v; v+=a*h; x+=v*h;}
    if(Math.abs(x-target)<precision&&Math.abs(v)<precision*10){settle();return;}
    onUpdate(x); raf=requestAnimationFrame(frame);
  }
  return {
    // head to a new target; keeps the current velocity unless one is given (a finger flick)
    to(t,{preset:np,velocity,done}={}){
      target=t; if(np) p=np; if(velocity!==undefined) v=velocity; onRest=done||null;
      if(reducedMotion()){if(raf) cancelAnimationFrame(raf); settle(); return;}
      if(!raf){last=performance.now(); raf=requestAnimationFrame(frame);}
    },
    // jump with no motion, e.g. while a finger is dragging
    set(t){if(raf) cancelAnimationFrame(raf); raf=0; onRest=null; x=target=t; v=0; onUpdate(x);},
    get value(){return x;},
    get target(){return target;},
    get moving(){return !!raf;}
  };
}

// iOS rubber band past an edge: offset = (1 - 1 / (c*x/d + 1)) * d. Follows the finger at about 55% at
// first, then less and less, and never travels more than d however far you pull.
export function rubberband(x,d,c=.55){
  const s=Math.sign(x),a=Math.abs(x);
  return s*(1-1/(c*a/d+1))*d;
}

// Bottom sheet for an overlay whose first child is the card: springs up, drags down to dismiss,
// rubber-bands when dragged up, and closes on a backdrop tap. onDismiss runs when the person dismisses it.
export function sheet(overlay,{onDismiss}={}){
  const card=overlay.firstElementChild;
  let open=false,height=0;
  const paint=y=>{card.style.transform=`translate3d(0,${y}px,0)`;overlay.style.setProperty("--bd",String(Math.max(0,Math.min(1,1-y/(height||1)))));};
  const s=spring(0,paint,{preset:SPRING.snappy});
  const measure=()=>{height=card.getBoundingClientRect().height+24;};
  // drag
  let drag=null;
  const interactive=el=>el.closest("button,a,input,select,textarea,label");
  card.addEventListener("pointerdown",e=>{
    if(!open||e.button>0||interactive(e.target)) return;
    // a card that scrolls only drags from its top strip, so its content can still scroll
    const scrolls=card.scrollHeight>card.clientHeight+1;
    if(scrolls&&e.clientY-card.getBoundingClientRect().top>56) return;
    drag={y0:e.clientY,start:s.value,last:e.clientY,t:performance.now(),v:0,id:e.pointerId};
    card.setPointerCapture(e.pointerId); s.set(s.value);
  });
  card.addEventListener("pointermove",e=>{
    if(!drag||e.pointerId!==drag.id) return;
    const now=performance.now(),dt=Math.max(1,now-drag.t);
    drag.v=.8*drag.v+.2*((e.clientY-drag.last)/dt*1000); drag.last=e.clientY; drag.t=now;
    const raw=drag.start+(e.clientY-drag.y0);
    s.set(raw>=0?raw:rubberband(raw,height));
  });
  const release=e=>{
    if(!drag||e.pointerId!==drag.id) return;
    const v=drag.v,y=s.value; drag=null;
    if(y>height*.3||v>900){s.dismissVelocity=v; if(onDismiss) onDismiss(); else api.close();}
    else s.to(0,{velocity:v,preset:SPRING.snappy});
  };
  card.addEventListener("pointerup",release);
  card.addEventListener("pointercancel",release);
  overlay.addEventListener("click",e=>{if(e.target===overlay&&open){if(onDismiss) onDismiss(); else api.close();}});
  const api={
    open(){
      if(open) return; open=true; overlay.hidden=false; measure();
      card.style.touchAction=card.scrollHeight>card.clientHeight+1?"pan-y":"none";
      if(!s.moving) s.set(height);
      s.to(0,{preset:SPRING.snappy});
    },
    close(){
      if(!open) return; open=false; measure();
      const v=s.dismissVelocity; s.dismissVelocity=undefined;
      s.to(height,{preset:SPRING.smooth,velocity:v,done:()=>{if(!open) overlay.hidden=true;}});
    },
    get isOpen(){return open;}
  };
  return api;
}
