(function(){
var MKSCRIPT=document.currentScript;
var STREAM="https://183.bozztv.com/giatv/giatv-magicplus/magicplus/chunks.m3u8";
var PROG_URL="https://playok24.github.io/magic-kids-tv/programacion.json?t="+Date.now();
var P={semana:[{"hora":"00:00","programa":"Dragon Ball Gt."},{"hora":"00:30","programa":"Las Guerreras Magicas"},{"hora":"01:00","programa":"X-Men"},{"hora":"01:30","programa":"El Mundo de Beakman"},{"hora":"02:00","programa":"La Noche Magic"},{"hora":"06:30","programa":"Sailor Moon"},{"hora":"07:00","programa":"Detective Conan"},{"hora":"07:30","programa":"Voltron"},{"hora":"08:00","programa":"Dragon Ball Gt."},{"hora":"08:30","programa":"Las Guerreras Magicas"},{"hora":"09:00","programa":"X-Men"},{"hora":"09:30","programa":"El Mundo de Beakman"},{"hora":"10:00","programa":"Pokemon"},{"hora":"10:30","programa":"Supercampeones"},{"hora":"11:00","programa":"Zona Virtual"},{"hora":"11:30","programa":"Caballeros del Zodiaco"},{"hora":"12:00","programa":"Ranma 1/2"},{"hora":"12:30","programa":"El Chavo"},{"hora":"13:00","programa":"Cazador X"},{"hora":"13:30","programa":"Samurai Warrior"},{"hora":"14:00","programa":"Alf"},{"hora":"14:30","programa":"Sailor Moon"},{"hora":"15:00","programa":"Detective Conan"},{"hora":"15:30","programa":"Voltron"},{"hora":"16:00","programa":"Dragon Ball Gt."},{"hora":"16:30","programa":"Las Guerreras Magicas"},{"hora":"17:00","programa":"X-Men"},{"hora":"17:30","programa":"Beakman"},{"hora":"18:00","programa":"Pokemon"},{"hora":"18:30","programa":"Supercampeones"},{"hora":"19:00","programa":"Zona Virtual"},{"hora":"19:30","programa":"Caballeros del Zodiaco"},{"hora":"20:00","programa":"Ranma 1/2"},{"hora":"20:30","programa":"El Chavo"},{"hora":"21:00","programa":"Cazador X"},{"hora":"21:30","programa":"Samurai Warrior"},{"hora":"22:00","programa":"Alf"},{"hora":"22:30","programa":"Sailor Moon"},{"hora":"23:00","programa":"Detective Conan"},{"hora":"23:30","programa":"Voltron"}],finde:[{"hora":"00:00","programa":"Weekend Magic"},{"hora":"00:30","programa":"Weekend Magic"},{"hora":"01:00","programa":"Weekend Magic"},{"hora":"01:30","programa":"Weekend Magic"},{"hora":"02:00","programa":"Weekend Magic"},{"hora":"06:30","programa":"Weekend Magic"},{"hora":"07:00","programa":"Weekend Magic"},{"hora":"07:30","programa":"Weekend Magic"},{"hora":"08:00","programa":"Weekend Magic"},{"hora":"08:30","programa":"Weekend Magic"},{"hora":"09:00","programa":"Weekend Magic"},{"hora":"09:30","programa":"Weekend Magic"},{"hora":"10:00","programa":"Weekend Magic"},{"hora":"10:30","programa":"Weekend Magic"},{"hora":"11:00","programa":"Weekend Magic"},{"hora":"11:30","programa":"Weekend Magic"},{"hora":"12:00","programa":"Weekend Magic"},{"hora":"12:30","programa":"Weekend Magic"},{"hora":"13:00","programa":"Weekend Magic"},{"hora":"13:30","programa":"Weekend Magic"},{"hora":"14:00","programa":"Weekend Magic"},{"hora":"14:30","programa":"Weekend Magic"},{"hora":"15:00","programa":"Weekend Magic"},{"hora":"15:30","programa":"Weekend Magic"},{"hora":"16:00","programa":"Weekend Magic"},{"hora":"16:30","programa":"Weekend Magic"},{"hora":"17:00","programa":"Weekend Magic"},{"hora":"17:30","programa":"Weekend Magic"},{"hora":"18:00","programa":"Weekend Magic"},{"hora":"18:30","programa":"Weekend Magic"},{"hora":"19:00","programa":"Weekend Magic"},{"hora":"19:30","programa":"Weekend Magic"},{"hora":"20:00","programa":"Weekend Magic"},{"hora":"20:30","programa":"Weekend Magic"},{"hora":"21:00","programa":"Weekend Magic"},{"hora":"21:30","programa":"Weekend Magic"},{"hora":"22:00","programa":"Weekend Magic"},{"hora":"22:30","programa":"Weekend Magic"},{"hora":"23:00","programa":"Weekend Magic"},{"hora":"23:30","programa":"Weekend Magic"}]};

var CSS="#mkapp{width:100%;max-width:1280px;margin:16px auto;font-family:'Segoe UI',system-ui,sans-serif;color:#fff;background:#0a0a1a;border-radius:10px;overflow:hidden}#mkapp *{margin:0;padding:0;box-sizing:border-box}#mkapp:fullscreen{width:100vw;height:100vh;max-width:none;margin:0;border-radius:0}#mkapp:-webkit-full-screen{width:100vw;height:100vh;max-width:none;margin:0;border-radius:0}#mkapp .mk-top{display:flex;align-items:center;justify-content:center;gap:8px;padding:6px 12px;background:rgba(10,10,26,0.9)}#mkapp .mk-top .mk-views{font-size:11px;color:#888;display:flex;align-items:center;gap:4px}#mkapp .mk-top .mk-views span{color:#00ff66;font-weight:700;min-width:20px;text-align:center}#mkapp .mk-vid{position:relative;background:#000;width:100%;aspect-ratio:16/9}#mkapp .mk-vid video{width:100%;height:100%;display:block;object-fit:contain;opacity:0;transition:opacity .5s}#mkapp .mk-vid video.mk-on{opacity:1}#mkapp .mk-logo-lg{width:70px;height:70px;border-radius:14px;display:inline-block;background:linear-gradient(135deg,#7c3aed,#c4a0ff);text-align:center;line-height:70px;font-size:22px;font-weight:900;color:#fff;animation:mk-p 1.5s ease-in-out infinite}@keyframes mk-p{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.7;transform:scale(.95)}}#mkapp .mk-ld{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:#000;z-index:5}#mkapp .mk-ld .mk-lt{color:#00ff66;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;text-shadow:0 0 8px #00ff66}#mkapp .mk-no{position:absolute;inset:0;z-index:4;background:repeating-radial-gradient(circle,#fff 0,#999 1px,#111 2px,#000 3px);animation:mk-n .08s infinite}@keyframes mk-n{0%{transform:translate(0,0)}25%{transform:translate(-2px,1px)}50%{transform:translate(2px,-1px)}75%{transform:translate(-1px,2px)}}#mkapp .mk-ct{position:absolute;bottom:0;left:0;right:0;z-index:10;padding:6px 10px;background:linear-gradient(transparent,rgba(0,0,0,0.85));opacity:0;transition:opacity .25s;display:flex;align-items:center;gap:5px}#mkapp .mk-vid:hover .mk-ct,#mkapp .mk-vid.mk-t .mk-ct{opacity:1}#mkapp .mk-ct button{background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);color:#fff;border-radius:5px;cursor:pointer;font-size:13px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;transition:all .12s;flex-shrink:0;padding:0;line-height:1}#mkapp .mk-ct button:hover{background:rgba(0,204,255,0.2);border-color:#00ccff}#mkapp .mk-ct button:active{transform:scale(.92)}#mkapp .mk-ct .mk-vw{display:flex;align-items:center;gap:3px;flex:1;max-width:80px}#mkapp .mk-ct .mk-vw input[type=range]{flex:1;-webkit-appearance:none;appearance:none;height:2px;border-radius:1px;background:rgba(255,255,255,0.25);outline:none}#mkapp .mk-ct .mk-vw input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:10px;height:10px;border-radius:50%;background:#00ccff;cursor:pointer}#mkapp .mk-ct .mk-vw input[type=range]::-moz-range-thumb{width:10px;height:10px;border-radius:50%;background:#00ccff;cursor:pointer;border:none}#mkapp .mk-vi{position:absolute;bottom:40px;left:50%;transform:translateX(-50%);padding:6px 20px;border-radius:8px;background:rgba(0,0,0,0.85);color:#00ff66;font-size:28px;font-weight:900;text-shadow:0 0 12px #00ff66;opacity:0;transition:opacity .2s;pointer-events:none;z-index:11;white-space:nowrap}#mkapp .mk-fs{position:absolute;bottom:8px;right:8px;z-index:12;background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.15);color:#fff;border-radius:5px;cursor:pointer;font-size:16px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .25s;padding:0;line-height:1}#mkapp .mk-vid:hover .mk-fs,#mkapp .mk-vid.mk-t .mk-fs{opacity:1}#mkapp .mk-pg{background:rgba(10,10,26,0.92);border-top:1px solid rgba(255,255,255,0.06);overflow:hidden}#mkapp .mk-pg .mk-ph{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;gap:8px}#mkapp .mk-pg .mk-ph span{font-size:14px;font-weight:700;color:#c4a0ff;display:flex;align-items:center;gap:4px}#mkapp .mk-pg .mk-ph select{padding:4px 8px;border-radius:4px;border:1px solid #333;background:#1a1a2e;color:#00ccff;font-size:11px;font-weight:700;cursor:pointer;outline:none}#mkapp .mk-pg .mk-pb{overflow-x:auto;overflow-y:hidden;white-space:nowrap;padding:4px 14px 10px;scrollbar-width:thin;scrollbar-color:#00ccff transparent}#mkapp .mk-pg .mk-pb::-webkit-scrollbar{height:5px}#mkapp .mk-pg .mk-pb::-webkit-scrollbar-track{background:transparent}#mkapp .mk-pg .mk-pb::-webkit-scrollbar-thumb{background:#00ccff;border-radius:2px}#mkapp .mk-pg .mk-pi{display:inline-flex;gap:8px;padding:8px 16px;border-radius:6px;font-size:17px;margin-right:4px;transition:background .12s}#mkapp .mk-pg .mk-pi.mk-now{background:rgba(196,160,255,0.15);border:1px solid rgba(196,160,255,0.3)}#mkapp .mk-pg .mk-pi .mk-hr{color:#00ccff;font-weight:700}#mkapp .mk-pg .mk-pi .mk-nm{color:#999}#mkapp .mk-pg .mk-pi.mk-now .mk-nm{color:#ddd;font-weight:600}#mkapp .mk-pg .mk-pd{display:inline-flex;align-items:center;padding:4px 10px;margin-right:4px;border-radius:6px;font-size:12px;font-weight:800;color:#fff;background:rgba(0,204,255,0.18);border:1px solid rgba(0,204,255,0.35)}";

function loadScript(src,cb){var s=document.createElement("script");s.src=src;s.onload=function(){cb(null);};s.onerror=function(){cb(new Error("cargar "+src));};document.head.appendChild(s);}
function build(){
  var st=document.createElement("style");st.textContent=CSS;document.head.appendChild(st);
  var mk=document.createElement("div");mk.id="mkapp";mk.className="mkapp";
  mk.innerHTML='<div class="mk-top"><div class="mk-views">&#x1F441; <span id="vc">0</span> viendo</div></div><div class="mk-vid"><div class="mk-ld" id="ld"><div class="mk-logo-lg">MK</div><div class="mk-lt">Sintonizando...</div></div><div class="mk-no" id="no"></div><video id="video" autoplay muted playsinline preload="auto"></video><div class="mk-vi" id="vi"></div><div class="mk-ct"><button id="playB">&#9654;</button><button id="muteB">&#128266;</button><div class="mk-vw"><input type="range" id="volS" min="0" max="100" value="50"></div></div><button class="mk-fs" id="fsB">&#9974;</button></div><div class="mk-pg"><div class="mk-ph"><span>PROGRAMACION</span><select id="tz"><option value="-3">ARG</option><option value="-5">COL</option><option value="-6">MEX</option></select></div><div class="mk-pb" id="pb"></div></div>';
  var anchor=null;
  var pi=document.querySelector('iframe[src*="player.html"]');
  if(pi)anchor=pi;
  if(!anchor){var ci=document.querySelector('iframe[src*="chat.html"]');if(ci)anchor=ci;}
  if(anchor){anchor.parentNode.insertBefore(mk,anchor);}
  else if(MKSCRIPT&&MKSCRIPT.parentNode){MKSCRIPT.insertAdjacentElement("beforebegin",mk);}
  else{document.body.appendChild(mk);}

  var video=document.getElementById("video");
  var ld=document.getElementById("ld");
  var no=document.getElementById("no");
  var volS=document.getElementById("volS");
  var vi=document.getElementById("vi");
  var playB=document.getElementById("playB");
  var muteB=document.getElementById("muteB");
  var fsB=document.getElementById("fsB");
  var vc=document.getElementById("vc");
  var pb=document.getElementById("pb");
  var tz=document.getElementById("tz");
  var hls=null,re=0,vt=null,tzo=-3;
  try{tzo=parseInt(localStorage.getItem("mk_tzo")||"-3");}catch(e){}
  try{tz.value=localStorage.getItem("mk_tzo")||"-3";}catch(e){}

  try{
    var fc={apiKey:"AIzaSyDM7YiLoP5Q-jTB1BBbMluvWL1LIPqCtxI",authDomain:"contadores-magic.firebaseapp.com",databaseURL:"https://contadores-magic-default-rtdb.firebaseio.com",projectId:"contadores-magic",storageBucket:"contadores-magic.firebasestorage.app",messagingSenderId:"58723817117",appId:"1:58723817117:web:f479abaeacf191364ae674"};
    if(!firebase.apps.length)firebase.initializeApp(fc);
    firebase.auth().signInAnonymously().catch(function(){});
    var db=firebase.database();
    var pid="";try{pid=localStorage.getItem("mk_device_id")||"";}catch(e){}
    if(!pid){pid="dev_"+Math.random().toString(36).substr(2,9)+Date.now().toString(36);try{localStorage.setItem("mk_device_id",pid);}catch(e){}}
    var sr=db.ref("sessions/"+pid);
    db.ref(".info/connected").on("value",function(s){
      if(s.val()===true){sr.set({localTs:firebase.database.ServerValue.TIMESTAMP});sr.onDisconnect().remove();}
      else{sr.remove();}
    });
    setInterval(function(){sr.update({localTs:firebase.database.ServerValue.TIMESTAMP});},30000);
    document.addEventListener("visibilitychange",function(){if(!document.hidden)sr.update({localTs:firebase.database.ServerValue.TIMESTAMP});});
    db.ref("sessions").on("value",function(s){var c=0,n=Date.now()-600000;s.forEach(function(x){var v=x.val();if(v&&v.localTs&&v.localTs>n)c++;});vc.textContent=c;});
    window.addEventListener("pagehide",function(){sr.remove();});
  }catch(e){}

  tz.onchange=function(){tzo=parseInt(this.value);try{localStorage.setItem("mk_tzo",this.value);}catch(e){}applyProg();};
  function isWk(){var n=new Date(Date.now()+tzo*3600000).getUTCDay();return n===0||n===6;}
  var semL=P.semana.length;
  var progF=P.semana.concat(P.finde),prog=isWk()?P.finde:P.semana;
  function applyProg(){progF=P.semana.concat(P.finde);prog=isWk()?P.finde:P.semana;renderP();}
  if(window.fetch){fetch(PROG_URL).then(function(r){return r.json();}).then(function(x){
    if(x){if(Array.isArray(x))P.semana=x;if(x.semana)P.semana=x.semana;if(x.finde)P.finde=x.finde;applyProg();}
  }).catch(function(){});}
  applyProg();
  function tM(h){var p=h.split(":");return parseInt(p[0])*60+parseInt(p[1]);}
  function gN(){var n=new Date(),u=n.getTime(),l=u+tzo*3600000,h=Math.floor((((l%86400000)+86400000)%86400000)/3600000),m=Math.floor(((((l%86400000)+86400000)%86400000)%3600000)/60000),a=h*60+m;for(var i=0;i<prog.length;i++){var ac=tM(prog[i].hora),sg=i+1<prog.length?tM(prog[i+1].hora):1440;if(a>=ac&&a<sg)return{i:i,p:prog[i].programa};}return{i:-1,p:"---"};}
  function renderP(){
    var n=gN();pb.innerHTML="";var ne=null;
    var nowIdx=isWk()&&semL>0?semL+n.i:n.i;
    progF.forEach(function(p,i){
      if(i===semL&&semL>0){
        var dv=document.createElement("span");dv.className="mk-pd";dv.textContent="SABADO Y DOMINGO";pb.appendChild(dv);
      }
      var e=document.createElement("span");
      e.className="mk-pi"+(i===nowIdx?" mk-now":"");
      e.innerHTML='<span class="mk-hr">'+p.hora+'</span><span class="mk-nm">'+p.programa+'</span>';
      pb.appendChild(e);
      if(i===nowIdx)ne=e;
    });
    if(ne&&pb.scrollWidth>pb.clientWidth){pb.scrollLeft=ne.offsetLeft-pb.clientWidth/2+ne.clientWidth/2;}
  }
  setInterval(applyProg,60000);

  function sV(){ld.style.display="none";no.style.display="none";video.classList.add("mk-on");sW();}
  function sE(m){ld.innerHTML='<div class="mk-logo-lg">MK</div><div style="color:#ff6b6b;font-size:11px;text-align:center;padding:0 16px">'+m+'</div>';ld.style.display="flex";ld.style.cursor="pointer";tW();}
  function iH(){
    re=0;
    ld.innerHTML='<div class="mk-logo-lg">MK</div><div class="mk-lt">Sintonizando...</div>';
    ld.style.display="flex";ld.style.cursor="default";
    no.style.display="none";
    if(!window.Hls||!Hls.isSupported()){
      if(video.canPlayType("application/vnd.apple.mpegurl")){
        video.src=STREAM;
        video.addEventListener("loadedmetadata",function(){video.play()["catch"](function(){});});
      }else{sE("Tu navegador no soporta HLS.");}
      return;
    }
    if(hls){hls.destroy();hls=null;}
    hls=new Hls({enableWorker:true,liveSyncDuration:15,liveMaxLatencyDuration:60,maxBufferLength:60,maxMaxBufferLength:120,backBufferLength:10,liveDurationInfinity:true,maxBufferHole:3,maxStarvationDelay:8,manifestLoadingTimeOut:20000,manifestLoadingMaxRetry:20,manifestLoadingRetryDelay:1000,levelLoadingTimeOut:20000,levelLoadingMaxRetry:20,fragLoadingTimeOut:20000,fragLoadingMaxRetry:30,fragLoadingRetryDelay:1000,startFragPrefetch:true,stretchShortVideoSegment:true,lowLatencyMode:false,nudgeOffset:0.5,nudgeMaxRetry:12,enableSoftwareAES:true,appendErrorMaxRetry:5,abrEwmaDefaultEstimate:3000000,abrEwmaFastLive:6,abrEwmaSlowLive:15});
    hls.loadSource(STREAM);
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED,function(){video.play()["catch"](function(){});});
    video.addEventListener("playing",sV);
    hls.on(Hls.Events.ERROR,function(e,d){
      if(!d.fatal)return;
      if(d.type===Hls.ErrorTypes.NETWORK_ERROR){
        re++;
        if(re<12){
          ld.innerHTML='<div class="mk-logo-lg">MK</div><div class="mk-lt">Sintonizando...</div>';
          ld.style.display="flex";ld.style.cursor="default";
          setTimeout(function(){if(hls)hls.startLoad();},1500*Math.min(re,4));
        }else{
          sE("Sin conexion.<br>Haz clic para reintentar.");ld.onclick=function(){ld.onclick=null;re=0;iH();};
        }
      }else if(d.type===Hls.ErrorTypes.MEDIA_ERROR){
        ld.innerHTML='<div class="mk-logo-lg">MK</div><div class="mk-lt">Sintonizando...</div>';
        ld.style.display="flex";ld.style.cursor="default";
        if(hls)hls.recoverMediaError();
      }else{
        re++;if(re<8){setTimeout(function(){iH();},3000*Math.min(re,4));}
        else{sE("Error persistente.<br>Haz clic para reintentar.");ld.onclick=function(){ld.onclick=null;re=0;iH();};}
      }
    });
    hls.on(Hls.Events.FRAG_LOADED,function(){re=0;});
    hls.on(Hls.Events.LEVEL_LOADED,function(){re=0;});
    hls.startLoad();
  }
  var wd=null,lt=0,frz=0,gr=0;
  function sW(){lt=video.currentTime||0;frz=0;gr=0;wd=setInterval(function(){
    if(video.paused||video.ended||ld.style.display!="none")return;var ct=video.currentTime||0;
    if(Math.abs(ct-lt)<0.3){frz++;if(frz>=30){frz=0;gr++;if(gr>=3){gr=0;re=0;iH();}}}
    else{frz=Math.max(0,frz-1);}lt=ct;
  },5000);}
  function tW(){clearInterval(wd);wd=null;}
  video.addEventListener("playing",function(){sW();});
  video.addEventListener("pause",function(){tW();});

  renderP();
  iH();

  playB.onclick=function(){if(video.paused){video.play();playB.innerHTML="&#9646;&#9646;";}else{video.pause();playB.innerHTML="&#9654;";}};
  video.onclick=function(){if(video.paused){video.play();playB.innerHTML="&#9646;&#9646;";}else{video.pause();playB.innerHTML="&#9654;";}};
  video.onplay=function(){playB.innerHTML="&#9646;&#9646;";};
  video.onpause=function(){playB.innerHTML="&#9654;";};
  muteB.onclick=function(){video.muted=!video.muted;muteB.innerHTML=video.muted?"&#128263;":"&#128266;";};
  volS.oninput=function(){video.volume=this.value/100;video.muted=false;muteB.innerHTML="&#128266;";vi.textContent="Vol: "+this.value+"%";vi.style.opacity="1";clearTimeout(vt);vt=setTimeout(function(){vi.style.opacity="0";},1000);};
  function mkFsIcon(on){fsB.innerHTML=on?"&#10026;":"&#9974;";fsB.title=on?"Salir de pantalla completa":"Pantalla completa";}
  fsB.onclick=function(){
    if(!document.fullscreenElement&&!document.webkitFullscreenElement){
      var fn=mk.requestFullscreen||mk.webkitRequestFullscreen;
      if(fn){var p;try{p=fn.call(mk);}catch(err){p=Promise.reject(err);}if(p&&p["catch"]){p["catch"](function(){mkFsIcon(false);});}else{mkFsIcon(true);}}
    }else{
      if(document.exitFullscreen)document.exitFullscreen();
      else if(document.webkitExitFullscreen)document.webkitExitFullscreen();
    }
  };
  document.addEventListener("fullscreenchange",function(){if(!document.fullscreenElement)mkFsIcon(false);else mkFsIcon(true);});
  document.addEventListener("webkitfullscreenchange",function(){if(!document.webkitFullscreenElement)mkFsIcon(false);else mkFsIcon(true);});

  document.addEventListener("keydown",function(e){
    if(!document.fullscreenElement&&!(e.target&&e.target.closest&&e.target.closest("#mkapp")))return;
    if(e.key==="ArrowUp"){volS.value=Math.min(100,parseInt(volS.value)+5);volS.oninput();}
    if(e.key==="ArrowDown"){volS.value=Math.max(0,parseInt(volS.value)-5);volS.oninput();}
    if(e.key===" "||e.key==="k"){e.preventDefault();video.paused?video.play():video.pause();}
    if(e.key==="f"){fsB.onclick();}
    if(e.key==="m"){muteB.onclick();}
  });

  var tt=null;
  mk.querySelector(".mk-vid").addEventListener("touchstart",function(){clearTimeout(tt);this.classList.add("mk-t");tt=setTimeout(function(){this.classList.remove("mk-t");}.bind(this),2500);});
}

function init(){
  var deps=["https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js","https://www.gstatic.com/firebasejs/10.12.0/firebase-database-compat.js","https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js","https://cdn.jsdelivr.net/npm/hls.js@1.5.20"];
  var i=0;
  (function next(){
    if(i>=deps.length){build();return;}
    loadScript(deps[i++],function(){setTimeout(next,50);});
  })();
}
if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",init);}
else{init();}
})();
