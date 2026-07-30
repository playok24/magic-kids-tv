(function(){
var FW_API="AIzaSyDM7YiLoP5Q-jTB1BBbMluvWL1LIPqCtxI";
var FW_DB="https://contadores-magic-default-rtdb.firebaseio.com";
var PROG_URL="https://playok24.github.io/magic-kids-tv/programacion.json";
var STREAM_URL="https://183.bozztv.com/giatv/giatv-magicplus/magicplus/chunks.m3u8";
var APP_VER="1.3.6";

if(!firebase.apps.length){firebase.initializeApp({apiKey:FW_API,databaseURL:FW_DB,authDomain:"contadores-magic.firebaseapp.com",projectId:"contadores-magic",storageBucket:"contadores-magic.firebasestorage.app",messagingSenderId:"58723817117",appId:"1:58723817117:web:f479abaeacf191364ae674"});}
firebase.auth().signInAnonymously().catch(function(e){console.log("auth err",e);});
var db=firebase.database();

var deviceId=localStorage.getItem("mk_device_id");
if(!deviceId){deviceId="dev_"+Math.random().toString(36).substr(2,9)+Date.now().toString(36);localStorage.setItem("mk_device_id",deviceId);}

var video=document.getElementById("video");
var loadingEl=document.getElementById("loading");
var staticEl=document.getElementById("static");

if(video){
  video.addEventListener("playing",function(){
    video.classList.add("visible");
    if(loadingEl)loadingEl.style.display="none";
  });
  video.addEventListener("waiting",function(){
    if(staticEl&&loadingEl&&loadingEl.style.display==="none")staticEl.style.display="block";
  });
  video.addEventListener("canplay",function(){
    if(staticEl)staticEl.style.display="none";
  });
  video.addEventListener("error",function(){
    if(loadingEl){loadingEl.style.display="flex";}
    if(staticEl)staticEl.style.display="none";
    setTimeout(function(){video.src=STREAM_URL;video.load();},5000);
  });
  video.src=STREAM_URL;
  video.load();
}

var sessionId="mk_"+Math.random().toString(36).substr(2,9);
var sessionRef=db.ref("sessions/"+sessionId);
sessionRef.set({localTs:Date.now()});
setInterval(function(){sessionRef.update({localTs:Date.now()});},10000);

db.ref("sessions").on("value",function(snap){
  var c=0,n=Date.now()-60000;
  snap.forEach(function(x){var v=x.val();if(v&&v.localTs&&v.localTs>n)c++;});
  var el=document.getElementById("view-count");if(el)el.textContent=c;
});

var tzSelect=document.getElementById("tz-select");
var progList=document.getElementById("prog-list-mobile");
function loadProgramacion(){
  if(!progList)return;
  fetch(PROG_URL+"?t="+Date.now()).then(function(r){return r.json();}).then(function(data){
    progList.innerHTML="";
    var tz=parseInt(tzSelect?tzSelect.value:"-3");
    var now=new Date();
    var utcH=now.getUTCHours();
    var utcM=now.getUTCMinutes();
    var argH=utcH-3;if(argH<0)argH+=24;
    var curH=argH+(tz+3);if(curH<0)curH+=24;if(curH>=24)curH-=24;
    var curMin=curH*60+utcM;
    data.forEach(function(item){
      var parts=item.hora.split(":");
      var h=parseInt(parts[0]);var m=parseInt(parts[1]);
      var itemMin=h*60+m;
      var isNow=curMin>=itemMin&&curMin<itemMin+30;
      var div=document.createElement("div");
      div.className="prog-item"+(isNow?" now":"");
      div.innerHTML="<span class='hora'>"+item.hora+"</span><span class='nombre'>"+item.programa+"</span>";
      progList.appendChild(div);
      if(isNow){div.scrollIntoView({behavior:"smooth",block:"center"});}
    });
  }).catch(function(e){console.log("Prog error:",e);});
}
loadProgramacion();
setInterval(loadProgramacion,60000);
if(tzSelect)tzSelect.addEventListener("change",loadProgramacion);

var chatBtn=document.getElementById("chat-btn");
var chatOverlay=document.getElementById("chat-overlay");
var chatClose=document.getElementById("chat-close");
var chatMessagesEl=document.getElementById("chat-messages");
var chatInputEl=document.getElementById("chat-input");
var chatSendBtn=document.getElementById("chat-send");
var chatBadge=document.getElementById("chat-badge");
function toggleChat(){if(chatOverlay)chatOverlay.classList.toggle("open");}
if(chatBtn)chatBtn.addEventListener("click",toggleChat);
if(chatClose)chatClose.addEventListener("click",toggleChat);

var CHAT_PASSWORD="tiosam2026";
var chatAdminMode=false;
var currentUser=localStorage.getItem("mk_chat_name")||"";
var userAvatar=localStorage.getItem("mk_user_avatar")||null;

function avatarColor(name){
  var hash=0;
  for(var i=0;i<name.length;i++){hash=name.charCodeAt(i)+((hash<<5)-hash);}
  var colors=["#7c3aed","#2563eb","#059669","#d97706","#dc2626","#db2777","#0891b2","#4f46e5"];
  return colors[Math.abs(hash)%colors.length];
}

var nameModal=document.getElementById("name-modal");
var nameInput=document.getElementById("name-input");
var emailInput=document.getElementById("email-input");
var nameOk=document.getElementById("name-ok");
var loginAv=document.getElementById("login-av");
var loginAvFile=document.getElementById("login-av-file");

function updateLoginPreview(){
  if(!loginAv)return;
  if(userAvatar){
    loginAv.innerHTML='<img src="'+userAvatar+'" alt="avatar">';
  }else{
    var n=currentUser||"";
    var initial=n?n.charAt(0).toUpperCase():"?";
    var color=avatarColor(n);
    loginAv.innerHTML='<span class="mk-ai" style="background:'+color+'">'+initial+'</span>';
  }
}

if(loginAv)loginAv.onclick=function(){if(loginAvFile)loginAvFile.click();};
if(loginAvFile)loginAvFile.onchange=function(e){
  var file=e.target.files[0];if(!file)return;
  var reader=new FileReader();
  reader.onload=function(ev){
    var img=new Image();
    img.onload=function(){
      var canvas=document.createElement("canvas");canvas.width=56;canvas.height=56;
      canvas.getContext("2d").drawImage(img,0,0,56,56);
      userAvatar=canvas.toDataURL("image/jpeg",0.7);
      updateLoginPreview();
    };img.src=ev.target.result;
  };reader.readAsDataURL(file);
};

if(nameOk)nameOk.addEventListener("click",function(){
  var n=nameInput?nameInput.value.trim():"";
  var e=emailInput?emailInput.value.trim():"";
  if(!n)return;
  localStorage.setItem("mk_chat_name",n);localStorage.setItem("mk_name",n);
  if(e)localStorage.setItem("mk_user_email",e);
  if(userAvatar)try{localStorage.setItem("mk_user_avatar",userAvatar);}catch(ex){}
  currentUser=n;
  if(nameModal)nameModal.classList.remove("show");
  updateChatUserBar();
  startChat(n);
});
if(nameInput)nameInput.addEventListener("keydown",function(e){if(e.key==="Enter"&&emailInput)emailInput.focus();});
if(emailInput)emailInput.addEventListener("keydown",function(e){if(e.key==="Enter"&&nameInput)nameInput.focus();});

if(!currentUser){
  if(nameModal)nameModal.classList.add("show");
  updateLoginPreview();
  if(emailInput)emailInput.focus();
}else{
  if(nameModal)nameModal.classList.add("show");
  if(nameInput)nameInput.value=currentUser;
  if(emailInput)emailInput.value=localStorage.getItem("mk_user_email")||"";
  updateLoginPreview();
  if(emailInput)emailInput.focus();
}

var chatNameInput=document.getElementById("chat-name-input");
var chatNameOk=document.getElementById("chat-name-ok");
var chatLogin=document.getElementById("chat-login");
var chatAdminBtn=document.getElementById("chat-admin-btn");
var chatAdminPopup=document.getElementById("chat-admin-popup");
var adminActivateBtn=document.getElementById("admin-activate-btn");
var adminDeactivateBtn=document.getElementById("admin-deactivate-btn");
var chatAdminPass=document.getElementById("chat-admin-pass");
var adminPopupClose=document.getElementById("admin-popup-close");
var chatUserBar=document.getElementById("chat-user-bar");
var chatUserDisplay=document.getElementById("chat-user-display");
var chatUserEmojiEl=document.getElementById("chat-user-emoji");
var chatAvatarFile=document.getElementById("chat-avatar-file");
var chatEditNameBtn=document.getElementById("chat-edit-name-btn");
var chatNameEditPopup=document.getElementById("chat-name-edit-popup");
var chatRenameInput=document.getElementById("chat-rename-input");
var chatRenameOk=document.getElementById("chat-rename-ok");
var chatRenameCancel=document.getElementById("chat-rename-cancel");

function renderAvatar(){
  var el=chatUserEmojiEl;
  if(!el)return;
  var avatar=null;
  try{avatar=localStorage.getItem("mk_user_avatar");}catch(e){}
  if(avatar){
    el.innerHTML='<img src="'+avatar+'" alt="avatar">';
  }else{
    var initial=currentUser?currentUser.charAt(0).toUpperCase():"?";
    var color=avatarColor(currentUser);
    el.innerHTML='<span class="mk-ai" style="background:'+color+'">'+initial+'</span>';
  }
}

function updateChatUserBar(){
  if(currentUser&&chatUserBar&&chatUserDisplay){
    chatUserBar.style.display="flex";
    chatUserDisplay.textContent=currentUser;
    renderAvatar();
  }
}

if(chatUserEmojiEl)chatUserEmojiEl.onclick=function(){if(chatAvatarFile)chatAvatarFile.click();if(chatNameEditPopup)chatNameEditPopup.classList.remove("show");};
if(chatAvatarFile)chatAvatarFile.onchange=function(e){
  var file=e.target.files[0];
  if(!file)return;
  var reader=new FileReader();
  reader.onload=function(ev){
    var img=new Image();
    img.onload=function(){
      var canvas=document.createElement("canvas");
      canvas.width=56;canvas.height=56;
      var ctx=canvas.getContext("2d");
      ctx.drawImage(img,0,0,56,56);
      var dataUrl=canvas.toDataURL("image/jpeg",0.7);
      try{localStorage.setItem("mk_user_avatar",dataUrl);}catch(e){}
      renderAvatar();
    };
    img.src=ev.target.result;
  };
  reader.readAsDataURL(file);
};
if(currentUser){
  updateChatUserBar();
  if(chatLogin)chatLogin.classList.add("hidden");
}
if(currentUser)startChat(currentUser);

if(chatNameOk)chatNameOk.addEventListener("click",function(){
  if(!chatNameInput)return;var n=chatNameInput.value.trim();if(!n)return;
  localStorage.setItem("mk_chat_name",n);localStorage.setItem("mk_name",n);
  currentUser=n;
  if(chatLogin)chatLogin.classList.add("hidden");
  updateChatUserBar();
  startChat(n);
});
if(chatNameInput)chatNameInput.addEventListener("keydown",function(e){if(e.key==="Enter"&&chatNameOk)chatNameOk.click();});

if(chatEditNameBtn)chatEditNameBtn.addEventListener("click",function(){
  if(chatNameEditPopup){chatNameEditPopup.classList.add("show");if(chatRenameInput){chatRenameInput.value=currentUser;chatRenameInput.focus();}}
});
if(chatRenameOk)chatRenameOk.addEventListener("click",function(){
  if(!chatRenameInput)return;var n=chatRenameInput.value.trim();if(!n)return;
  localStorage.setItem("mk_chat_name",n);localStorage.setItem("mk_name",n);
  currentUser=n;updateChatUserBar();
  if(chatNameEditPopup)chatNameEditPopup.classList.remove("show");
});
if(chatRenameInput)chatRenameInput.addEventListener("keydown",function(e){if(e.key==="Enter"&&chatRenameOk)chatRenameOk.click();});
if(chatRenameCancel)chatRenameCancel.addEventListener("click",function(){if(chatNameEditPopup)chatNameEditPopup.classList.remove("show");});

if(chatAdminBtn)chatAdminBtn.addEventListener("click",function(){if(chatAdminPopup)chatAdminPopup.classList.toggle("show");});
if(adminPopupClose)adminPopupClose.addEventListener("click",function(){if(chatAdminPopup)chatAdminPopup.classList.remove("show");});
if(adminActivateBtn)adminActivateBtn.addEventListener("click",function(){
  if(chatAdminPass&&chatAdminPass.value===CHAT_PASSWORD){
    chatAdminMode=true;
    if(adminActivateBtn)adminActivateBtn.style.display="none";
    if(adminDeactivateBtn)adminDeactivateBtn.style.display="";
    if(chatAdminPass)chatAdminPass.style.display="none";
    if(chatAdminPopup)chatAdminPopup.classList.remove("show");
    if(chatMessagesEl)chatMessagesEl.classList.add("chat-admin");
    var pbtn=document.getElementById("admin-poll-btn");if(pbtn)pbtn.style.display="block";
  }else if(chatAdminPass){
    chatAdminPass.style.borderColor="#ff4444";
    setTimeout(function(){if(chatAdminPass)chatAdminPass.style.borderColor="#444";},2000);
  }
});
if(adminDeactivateBtn)adminDeactivateBtn.addEventListener("click",function(){
  chatAdminMode=false;
  if(adminActivateBtn)adminActivateBtn.style.display="";
  if(adminDeactivateBtn)adminDeactivateBtn.style.display="none";
  if(chatAdminPass)chatAdminPass.style.display="";
  if(chatMessagesEl)chatMessagesEl.classList.remove("chat-admin");
  var pbtn=document.getElementById("admin-poll-btn");if(pbtn)pbtn.style.display="none";
  document.getElementById("chat-poll-create").classList.remove("show");
});

function startChat(user){
  currentUser=user;
  var chatRef=db.ref("chat/messages");
  var bannedRef=db.ref("chat/banned");
  var likesRef=db.ref("chat/likes");
  chatRef.orderByChild("timestamp").limitToLast(50).on("value",function(snap){
    if(!chatMessagesEl)return;chatMessagesEl.innerHTML="";
    snap.forEach(function(child){
      var msg=child.val();if(!msg)return;
      var div=document.createElement("div");div.className="chat-msg";if(msg.system)div.classList.add("system");
      var canDelete=msg.user===user||chatAdminMode;
      var canBan=chatAdminMode&&msg.user!==user&&msg.user!=="system";
      var actionsHtml="";
      if(canDelete||canBan){
        actionsHtml='<div class="msg-actions">';
        actionsHtml+='<button class="msg-delete" data-id="'+child.key+'">Eliminar</button>';
        if(canBan)actionsHtml+='<button class="msg-ban" data-user="'+msg.user+'">Ban</button>';
        actionsHtml+='</div>';
      }
      var initial=msg.user?msg.user.charAt(0).toUpperCase():"?";
      var color=avatarColor(msg.user||"");
      var isOwn=msg.uid===deviceId;
      var avHtml=isOwn&&userAvatar?'<img src="'+userAvatar+'" style="width:32px;height:32px;border-radius:50%;object-fit:cover;flex-shrink:0">':'<span class="msg-mav" style="background:'+color+'">'+initial+'</span>';
      div.innerHTML='<span class="msg-user">'+avHtml+(msg.user||"")+'</span>'
        +'<div class="msg-row"><span class="msg-text">'+(msg.text||"")+'</span>'
        +'<span class="msg-time">'+formatTime(msg.timestamp||msg.time)+'</span>'
        +'<button class="msg-heart" data-msg="'+child.key+'">&#9825;<span class="msg-hc">0</span></button></div>'
        +actionsHtml;
      var heartBtn=div.querySelector(".msg-heart");
      likesRef.child(child.key).child(deviceId).once("value",function(ls){
        if(ls.exists()){heartBtn.classList.add("liked");heartBtn.innerHTML="&#9829;<span class='msg-hc'>0</span>";}
        likesRef.child(child.key).on("value",function(lc){
          var cnt=lc.numChildren()||0;
          heartBtn.innerHTML=(heartBtn.classList.contains("liked")?"&#9829;":"&#9825;")+"<span class='msg-hc'>"+cnt+"</span>";
        });
      });
      heartBtn.onclick=function(){
        var ref=likesRef.child(child.key).child(deviceId);
        ref.once("value",function(ls){
          if(ls.exists()){ref.remove();}else{ref.set(true);}
        });
      };
      chatMessagesEl.appendChild(div);
    });
    chatMessagesEl.scrollTop=chatMessagesEl.scrollHeight;
    if(chatBadge){var c=snap.numChildren()||0;chatBadge.textContent=c>99?"99+":c;}
  });

  if(chatSendBtn)chatSendBtn.addEventListener("click",sendMessage);
  if(chatInputEl)chatInputEl.addEventListener("keydown",function(e){if(e.key==="Enter")sendMessage();});

  bannedRef.on("value",function(snap){
    var banned=[];snap.forEach(function(child){banned.push(child.key);});
    if(chatInputEl){chatInputEl.onkeydown=function(e){
      if(e.key==="Enter"){
        if(banned.indexOf(user)!==-1){alert("Estas baneado del chat.");return;}
        sendMessage();
      }
    };}
  });
}

function sendMessage(){
  if(!chatInputEl||!currentUser)return;
  var text=chatInputEl.value.trim();if(!text)return;
  db.ref("chat/messages").push({user:currentUser,text:text,timestamp:firebase.database.ServerValue.TIMESTAMP,system:false,uid:deviceId});
  chatInputEl.value="";
}

function formatTime(ts){if(!ts)return"";var d=new Date(ts);return d.getHours().toString().padStart(2,"0")+":"+d.getMinutes().toString().padStart(2,"0");}

function cleanOldMessages(){
  var cutoff=Date.now()-12*60*60*1000;
  db.ref("chat/messages").orderByChild("timestamp").startAt(1).endAt(cutoff).once("value",function(snap){
    var updates={};
    snap.forEach(function(child){updates[child.key]=null;});
    if(Object.keys(updates).length>0)db.ref("chat/messages").update(updates);
  });
  db.ref("chat/messages").orderByChild("time").startAt(1).endAt(cutoff).once("value",function(snap){
    var updates={};
    snap.forEach(function(child){if(!updates[child.key])updates[child.key]=null;});
    if(Object.keys(updates).length>0)db.ref("chat/messages").update(updates);
  });
}
setInterval(cleanOldMessages,300000);

if(chatMessagesEl){
  chatMessagesEl.addEventListener("click",function(e){
    var delBtn=e.target.closest(".msg-delete");
    if(delBtn){db.ref("chat/messages/"+delBtn.dataset.id).remove();return;}
    var banBtn=e.target.closest(".msg-ban");
    if(banBtn&&chatAdminMode){db.ref("chat/banned/"+banBtn.dataset.user).set({bannedAt:firebase.database.ServerValue.TIMESTAMP});}
  });
}

// === ENCUESTA ===
var pollRef=db.ref("chat/poll");
var pollEl=document.getElementById("chat-poll");
var pollQuestion=document.getElementById("poll-question");
var pollOptions=document.getElementById("poll-options");
var pollTimerEl=document.getElementById("poll-timer");
var pollTimer=null;

var apb=document.getElementById("admin-poll-btn");
if(apb)apb.onclick=function(){
  document.getElementById("chat-poll-create").classList.toggle("show");
};
var pcb=document.getElementById("poll-cancel-btn");
if(pcb)pcb.onclick=function(){
  document.getElementById("chat-poll-create").classList.remove("show");
};
var pao=document.getElementById("poll-add-opt");
if(pao)pao.onclick=function(){
  var oo=document.getElementById("poll-create-opts");
  var inputs=oo.querySelectorAll("input");
  if(inputs.length>=6)return;
  var inp=document.createElement("input");
  inp.placeholder="Opcion "+(inputs.length+1);
  inp.maxLength=40;
  oo.appendChild(inp);
};
var pgb=document.getElementById("poll-go-btn");
if(pgb)pgb.onclick=function(){
  if(!chatAdminMode)return;
  var q=document.getElementById("poll-create-question").value.trim();
  if(!q){document.getElementById("poll-create-question").style.borderColor="#ff0000";return;}
  var inputs=document.getElementById("poll-create-opts").querySelectorAll("input");
  var opts=[];
  for(var i=0;i<inputs.length;i++){
    var v=inputs[i].value.trim();
    if(v)opts.push({text:v,votes:0});
  }
  if(opts.length<2){return;}
  var dur=parseInt(document.getElementById("poll-duration").value);
  pollRef.set({
    question:q,
    options:opts,
    active:true,
    endsAt:Date.now()+dur*1000,
    createdAt:Date.now()
  });
  document.getElementById("chat-poll-create").classList.remove("show");
  document.getElementById("poll-create-question").value="";
  var oo=document.getElementById("poll-create-opts");
  oo.innerHTML='<input type="text" placeholder="Opcion 1" maxlength="40"><input type="text" placeholder="Opcion 2" maxlength="40">';
};
var psb=document.getElementById("poll-stop-btn");
if(psb)psb.onclick=function(){
  if(!chatAdminMode)return;
  pollRef.update({active:false});
  document.getElementById("chat-poll-create").classList.remove("show");
};

if(pollRef)pollRef.on("value",function(snap){
  var poll=snap.val();
  if(!poll||!poll.active){
    if(pollEl)pollEl.classList.remove("show");
    clearInterval(pollTimer);
    pollTimer=null;
    return;
  }
  renderPoll(poll);
});

function renderPoll(poll){
  pollEl.classList.add("show");
  pollQuestion.textContent=poll.question;
  pollOptions.innerHTML="";
  var totalVotes=0;
  if(poll.options)for(var i=0;i<poll.options.length;i++)totalVotes+=poll.options[i].votes||0;
  var voted=false;
  var myIdx=null;
  pollRef.child("votes/"+deviceId).once("value",function(snap){
    if(snap.exists()){
      voted=true;
      myIdx=snap.val();
      pollOptions.querySelectorAll("button").forEach(function(b){b.disabled=true;b.style.cursor="default";});
      if(myIdx!==null&&pollOptions.children[myIdx])pollOptions.children[myIdx].classList.add("poll-voted");
    }
  });
  try{var ls=localStorage.getItem("mk_poll_voted_"+poll.createdAt);if(ls!==null){voted=true;myIdx=parseInt(ls);}}catch(e){}
  if(poll.options){
    for(var j=0;j<poll.options.length;j++){
      (function(idx){
        var opt=poll.options[idx];
        var votes=opt.votes||0;
        var pct=totalVotes>0?Math.round(votes/totalVotes*100):0;
        var btn=document.createElement("button");
        btn.innerHTML='<div class="poll-bar" style="width:'+pct+'%"></div><div class="poll-pn"><span>'+opt.text+'</span><span>'+votes+' ('+pct+'%)</span></div>';
        if(voted&&myIdx==idx)btn.classList.add("poll-voted");
        if(!voted){
          btn.onclick=function(){
            if(chatAdminMode)return;
            var vRef=pollRef.child("votes/"+deviceId);
            vRef.set(idx);
            pollRef.child("options/"+idx+"/votes").transaction(function(cur){return(cur||0)+1;});
            try{localStorage.setItem("mk_poll_voted_"+poll.createdAt,""+idx);}catch(e){}
            pollOptions.querySelectorAll("button").forEach(function(b){b.disabled=true;b.style.cursor="default";});
            btn.classList.add("poll-voted");
          };
        }
        pollOptions.appendChild(btn);
      })(j);
    }
  }
  clearInterval(pollTimer);
  pollTimer=setInterval(function(){
    var remaining=Math.max(0,poll.endsAt-Date.now());
    if(remaining<=0){pollRef.update({active:false});clearInterval(pollTimer);return;}
    pollTimerEl.textContent="Tiempo: "+formatPollTime(remaining);
  },1000);
  pollTimerEl.textContent="Tiempo: "+formatPollTime(Math.max(0,poll.endsAt-Date.now()));
}
function formatPollTime(ms){
  var totalSec=Math.floor(ms/1000);
  var d=Math.floor(totalSec/86400);
  var h=Math.floor((totalSec%86400)/3600);
  var m=Math.floor((totalSec%3600)/60);
  var s=totalSec%60;
  if(d>0)return d+"d "+h+"h "+m+"m";
  if(h>0)return h+"h "+m+"m "+s+"s";
  return m+":"+(s<10?"0":"")+s;
}

var psw=document.getElementById("poll-stop-wrap");
if(psw)psw.style.display="none";
if(pollRef)pollRef.child("active").on("value",function(snap){
  var el=document.getElementById("poll-stop-wrap");
  if(el)el.style.display=snap.val()&&chatAdminMode?"flex":"none";
});

var muteBtn=document.getElementById("mute");
var volSlider=document.getElementById("vol-slider");
var volIndicator=document.getElementById("vol-indicator");
if(volSlider&&video)volSlider.addEventListener("input",function(){video.volume=volSlider.value/100;});
if(muteBtn)muteBtn.addEventListener("click",function(){
  if(video){video.muted=!video.muted;muteBtn.classList.toggle("active",video.muted);}
});
var fullscreenBtn=document.getElementById("fullscreen");
if(fullscreenBtn)fullscreenBtn.addEventListener("click",function(){
  var el=document.documentElement;
  if(el.requestFullscreen)el.requestFullscreen();
  else if(el.webkitRequestFullscreen)el.webkitRequestFullscreen();
});

var versionBanner=document.getElementById("version-banner");
if(versionBanner){
  fetch("https://playok24.github.io/magic-kids-tv/version.json?t="+Date.now()).then(function(r){return r.json();}).then(function(d){
    if(d.version&&d.version!==APP_VER){versionBanner.style.display="block";}
  }).catch(function(){});
  versionBanner.addEventListener("click",function(){window.open("https://playok24.github.io/magic-kids-tv/latest.html","_blank");});
}

})();
