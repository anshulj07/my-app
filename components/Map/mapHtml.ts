// components/Map/mapHtml.ts
export function buildMapHtml(args: {
  googleKey: string;
  eventsJson: string;
  center: { lat: number; lng: number };
  zoom: number;
  userId?: string | null;
}) {
  const { googleKey, eventsJson, center, zoom, userId } = args;
  const safeUserId = userId ? JSON.stringify(userId) : 'null';

  const html =
`<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="initial-scale=1,width=device-width,maximum-scale=1"/>
  <style>
    *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
    html,body,#map{height:100%;margin:0;padding:0;overflow:hidden}

    /* ══ PIN — emoji bubble ══ */
    .ep{
      position:absolute;
      display:flex;flex-direction:column;align-items:center;
      pointer-events:auto;cursor:pointer;touch-action:manipulation;
      transform:translate(-50%,-100%) translateY(-8px) scale(1);
      transform-origin:50% 100%;
      will-change:transform,opacity;
      transition:transform 0.28s cubic-bezier(0.34,1.56,0.64,1),opacity 0.2s ease;
    }

    /* bubble circle */
    .ep-b{
      width:46px;height:46px;border-radius:23px;
      display:flex;align-items:center;justify-content:center;
      font-size:23px;line-height:1;
      background:#fff;
      border:2.5px solid rgba(0,0,0,0.14);
      box-shadow:0 3px 14px rgba(0,0,0,0.18),0 1px 4px rgba(0,0,0,0.07);
      position:relative;overflow:visible;flex-shrink:0;
    }

    /* downward tail */
    .ep-t{
      width:0;height:0;
      border-left:6px solid transparent;
      border-right:6px solid transparent;
      border-top:8px solid #fff;
      margin-top:-1px;
      filter:drop-shadow(0 2px 1px rgba(0,0,0,0.10));
    }

    /* ── free events ── */
    .ep.free .ep-b{
      border-color:#22C55E;
      box-shadow:0 3px 14px rgba(34,197,94,0.28),0 1px 4px rgba(0,0,0,0.07);
    }

    /* ── paid events ── */
    .ep.paid .ep-b{
      border-color:#F59E0B;
      box-shadow:0 3px 14px rgba(245,158,11,0.28),0 1px 4px rgba(0,0,0,0.07);
    }

    /* ── service events ── */
    .ep.service .ep-b{
      border-color:#8B5CF6;
      box-shadow:0 3px 14px rgba(139,92,246,0.28),0 1px 4px rgba(0,0,0,0.07);
    }

    /* ── MY events — dark filled bubble ── */
    .ep.mine .ep-b{
      background:#1C1B3A;
      border-color:#6366F1;
      box-shadow:0 4px 18px rgba(99,102,241,0.50),0 1px 6px rgba(0,0,0,0.18);
      font-size:21px;
    }
    .ep.mine .ep-t{
      border-top-color:#1C1B3A;
      filter:drop-shadow(0 2px 2px rgba(99,102,241,0.35));
    }

    /* owner badge (star) on mine pins */
    .ep-badge{
      position:absolute;top:-5px;right:-5px;
      width:17px;height:17px;border-radius:50%;
      background:#6366F1;border:2px solid #fff;
      display:flex;align-items:center;justify-content:center;
      font-size:8px;color:#fff;line-height:1;
      box-shadow:0 1px 4px rgba(99,102,241,0.4);
      pointer-events:none;
    }

    /* ── LIVE ── */
    .ep.live .ep-b{
      border:2.5px solid #ef4444;
      box-shadow:0 3px 14px rgba(239,68,68,0.35),0 1px 4px rgba(0,0,0,0.08);
      animation:liveGlow 1.8s ease-in-out infinite;
    }
    .ep.live .ep-t{border-top-color:#fff;}
    .live-dot{
      position:absolute;top:-4px;right:-4px;
      width:12px;height:12px;border-radius:50%;
      background:#ef4444;border:2px solid #fff;
      box-shadow:0 0 0 0 rgba(239,68,68,0.5);
      animation:livePulse 1.2s ease-in-out infinite;
    }
    @keyframes liveGlow{
      0%,100%{box-shadow:0 3px 14px rgba(239,68,68,0.28)}
      50%{box-shadow:0 3px 22px rgba(239,68,68,0.55),0 0 0 5px rgba(239,68,68,0)}
    }
    @keyframes livePulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.6);opacity:0.5}}

    /* ── PAUSED ── */
    .ep.paused{opacity:0.5;filter:grayscale(0.8);}

    /* ── press / selected states ── */
    .ep.pressing{transform:translate(-50%,-100%) translateY(-8px) scale(0.87)!important;transition:transform 0.07s ease!important;}
    .ep.sel .ep-b{
      box-shadow:0 6px 24px rgba(0,0,0,0.30),0 0 0 3.5px rgba(255,255,255,0.95)!important;
      transform:scale(1.08);
    }
    .ep.sel{transform:translate(-50%,-100%) translateY(-14px) scale(1)!important;z-index:9000!important;}

    /* entrance animation */
    @keyframes pinIn{
      0%{opacity:0;transform:translate(-50%,-100%) translateY(4px) scale(0.45)}
      65%{transform:translate(-50%,-100%) translateY(-11px) scale(1.07)}
      100%{opacity:1;transform:translate(-50%,-100%) translateY(-8px) scale(1)}
    }
    .ep.entering{animation:pinIn 0.38s cubic-bezier(0.34,1.56,0.64,1) both}

    /* ══ CLUSTER circle ══ */
    .cb{
      position:absolute;width:48px;height:48px;border-radius:50%;
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      background:linear-gradient(145deg,#4f46e5 0%,#7c3aed 100%);
      border:3px solid rgba(255,255,255,0.95);
      box-shadow:0 4px 16px rgba(79,70,229,0.45),0 1px 4px rgba(0,0,0,0.10),inset 0 1px 0 rgba(255,255,255,0.2);
      transform:translate(-50%,-50%) scale(1);
      pointer-events:auto;cursor:pointer;touch-action:manipulation;will-change:transform;
      transition:transform 0.25s cubic-bezier(0.34,1.56,0.64,1);
    }
    .cb.sz2{width:56px;height:56px;}.cb.sz3{width:64px;height:64px;}
    .cb.pressing{transform:translate(-50%,-50%) scale(0.88)!important;transition:transform 0.07s ease!important;}
    .cb .cn{font-size:15px;font-weight:800;color:#fff;line-height:1;font-family:-apple-system,system-ui,sans-serif;letter-spacing:-0.5px;}
    .cb.sz2 .cn{font-size:17px;}.cb.sz3 .cn{font-size:20px;}
    .cb .ce{font-size:13px;line-height:1;margin-top:2px;filter:drop-shadow(0 1px 1px rgba(0,0,0,.2));}
    .cb::before{content:"";position:absolute;inset:-8px;border-radius:50%;border:2px solid rgba(99,102,241,0.25);animation:halo 2.8s ease-in-out infinite;pointer-events:none;}
    @keyframes halo{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.18);opacity:0.1}}
    @keyframes clusterIn{
      0%{opacity:0;transform:translate(-50%,-50%) scale(0.3)}
      70%{transform:translate(-50%,-50%) scale(1.12)}
      100%{opacity:1;transform:translate(-50%,-50%) scale(1)}
    }
    .cb.entering{animation:clusterIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both}

    /* ══ BOTTOM SHEET ══ */
    #stack-popup{
      position:absolute;bottom:0;left:0;right:0;
      background:#fff;
      border-radius:24px 24px 0 0;
      box-shadow:0 -2px 40px rgba(0,0,0,0.18),0 -1px 0 rgba(0,0,0,0.06);
      z-index:10000;
      transform:translateY(100%);
      transition:transform 0.36s cubic-bezier(0.32,0.72,0,1);
      display:flex;flex-direction:column;
      max-height:58vh;
    }
    #stack-popup.open{transform:translateY(0);}
    #stack-handle{width:40px;height:4px;border-radius:2px;background:rgba(0,0,0,0.12);margin:12px auto 0;flex-shrink:0;}
    #stack-header{display:flex;align-items:center;justify-content:space-between;padding:14px 20px 8px;flex-shrink:0;}
    #stack-label{font-size:11px;font-weight:700;letter-spacing:0.6px;color:#94a3b8;text-transform:uppercase;font-family:-apple-system,system-ui,sans-serif;}
    #stack-count-pill{font-size:12px;font-weight:700;background:rgba(79,70,229,0.1);color:#4f46e5;border-radius:20px;padding:3px 10px;font-family:-apple-system,system-ui,sans-serif;}
    #stack-close{width:30px;height:30px;border-radius:50%;background:rgba(0,0,0,0.07);border:none;outline:none;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#64748b;font-size:14px;font-weight:600;flex-shrink:0;}
    #stack-list{overflow-y:auto;flex:1;padding:4px 14px 20px;-webkit-overflow-scrolling:touch;}
    .si{display:flex;align-items:center;gap:14px;padding:11px 10px;border-radius:16px;cursor:pointer;touch-action:manipulation;transition:background 0.14s ease;position:relative;}
    .si:active{background:rgba(0,0,0,0.05);}
    .si+.si::before{content:"";position:absolute;top:0;left:68px;right:10px;height:1px;background:rgba(0,0,0,0.06);}
    .si-icon{width:50px;height:50px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0;background:rgba(0,0,0,0.04);}
    .si-icon.free{background:rgba(22,163,74,0.10);}.si-icon.paid{background:rgba(234,88,12,0.10);}.si-icon.service{background:rgba(124,58,237,0.10);}.si-icon.mine{background:rgba(99,102,241,0.12);}
    .si-body{flex:1;min-width:0;}
    .si-title{font-size:15px;font-weight:600;color:#0f172a;font-family:-apple-system,system-ui,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:-0.2px;}
    .si-sub{font-size:12px;color:#94a3b8;margin-top:2px;font-family:-apple-system,system-ui,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .si-pill{font-size:11px;font-weight:700;padding:4px 10px;border-radius:20px;flex-shrink:0;letter-spacing:0.1px;font-family:-apple-system,system-ui,sans-serif;}
    .si-pill.free{background:rgba(22,163,74,0.12);color:#16a34a;}.si-pill.paid{background:rgba(234,88,12,0.12);color:#ea580c;}.si-pill.service{background:rgba(124,58,237,0.12);color:#7c3aed;}.si-pill.mine{background:rgba(99,102,241,0.12);color:#4f46e5;}
    .si-arrow{color:#cbd5e1;font-size:16px;flex-shrink:0;margin-left:2px;}

    /* toast */
    #toast{
      position:absolute;bottom:16px;left:50%;transform:translateX(-50%);
      background:rgba(15,23,42,0.84);color:#f1f5f9;
      border-radius:20px;padding:7px 18px;
      font:12px/1.5 -apple-system,system-ui,sans-serif;
      white-space:nowrap;z-index:9998;pointer-events:none;
      backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.08);
      opacity:0;transition:opacity 0.25s ease;letter-spacing:0.1px;
    }
    #toast.show{opacity:1;}
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="stack-popup">
    <div id="stack-handle"></div>
    <div id="stack-header">
      <div style="display:flex;align-items:center;gap:8px;">
        <span id="stack-label">Events here</span>
        <span id="stack-count-pill">2</span>
      </div>
      <button id="stack-close">✕</button>
    </div>
    <div id="stack-list"></div>
  </div>
  <div id="toast"></div>

  <script>
  (function(){
    var DATA       = ` + eventsJson + `;
    var CENTER     = {lat:` + center.lat + `,lng:` + center.lng + `};
    var ZOOM       = ` + zoom + `;
    var MY_ID      = ` + safeUserId + `;
    var CLUSTER_PX = 52;
    var POOL_SIZE  = 80;

    var map, pinRecs=[], clusterPool=[];
    var toastTimer, stackOpen=false;

    function post(type,extra){
      try{window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(
        JSON.stringify(Object.assign({type:type},extra||{})));}catch(e){}
    }
    function showToast(t){
      var el=document.getElementById('toast');if(!el)return;
      el.textContent=t;el.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer=setTimeout(function(){el.classList.remove('show');},2200);
    }

    function isOwn(ev){
      return MY_ID && String(ev.creatorClerkId||'')===MY_ID;
    }

    function kindClass(ev,isLive){
      var cls='';
      if(ev.status==='paused') cls+='paused ';
      if(isOwn(ev)) cls+='mine ';
      if(isLive) return cls+'live';
      var k=ev.kind||'';
      if(k.indexOf('free')>=0) return cls+'free';
      if(k.indexOf('paid')>=0) return cls+'paid';
      if(k==='service')        return cls+'service';
      return cls.trim();
    }

    function kindLabel(ev){
      if(isOwn(ev)) return 'My event';
      var k=ev.kind||'';
      if(k.indexOf('free')>=0) return 'Free';
      if(k.indexOf('paid')>=0) return 'Paid';
      if(k==='service')        return 'Service';
      return '';
    }

    function kindPillClass(ev){
      if(isOwn(ev)) return 'mine';
      var k=ev.kind||'';
      if(k.indexOf('free')>=0) return 'free';
      if(k.indexOf('paid')>=0) return 'paid';
      if(k==='service')        return 'service';
      return '';
    }

    /* ══ Stack popup ══ */
    document.getElementById('stack-close').addEventListener('click',closeStack);

    function openStack(items){
      if(stackOpen)return;
      stackOpen=true;
      post('stackOpen',{});
      document.getElementById('stack-count-pill').textContent=items.length;
      var list=document.getElementById('stack-list');
      list.innerHTML='';
      for(var i=0;i<items.length;i++){
        (function(ev){
          var pc=kindPillClass(ev);
          var ic=isOwn(ev)?'mine':pc;
          var kl=kindLabel(ev);
          var sub=ev.address||ev.when||ev.description||'Tap to view details';
          if(sub&&sub.length>40)sub=sub.slice(0,40)+'…';
          var el=document.createElement('div');
          el.className='si';
          el.innerHTML=
            '<div class="si-icon '+ic+'">'+(ev.emoji||'📍')+'</div>'+
            '<div class="si-body">'+
              '<div class="si-title">'+(ev.title||'Event')+'</div>'+
              '<div class="si-sub">'+sub+'</div>'+
            '</div>'+
            (kl?'<span class="si-pill '+pc+'">'+kl+'</span>':'')+
            '<span class="si-arrow">›</span>';
          el.addEventListener('click',function(e){
            e.stopPropagation();
            closeStack();
            post('pinClick',{event:ev});
            showToast((ev.emoji||'📍')+' '+(ev.title||''));
          });
          list.appendChild(el);
        })(items[i].ev);
      }
      document.getElementById('stack-popup').classList.add('open');
    }

    function closeStack(){
      if(!stackOpen)return;
      stackOpen=false;
      document.getElementById('stack-popup').classList.remove('open');
      post('stackClose',{});
    }

    function isEventLive(ev){
      if(!ev)return false;
      if(ev.status==='ended')return false;
      if(!ev.startsAt&&!ev.date)return false;
      var startMs;
      if(ev.startsAt){startMs=new Date(ev.startsAt).getTime();
      }else if(ev.date&&ev.time){startMs=new Date(ev.date+'T'+ev.time+':00Z').getTime();
      }else if(ev.date){startMs=new Date(ev.date+'T12:00:00Z').getTime();}
      if(!startMs||!isFinite(startMs))return false;
      return startMs<=Date.now();
    }

    /* ══ PIN OVERLAY ══ */
    function makePinOverlay(ev,idx){
      var rec={ev:ev,px:null,div:null};
      var live=isEventLive(ev);
      var own=isOwn(ev);
      var ov=new google.maps.OverlayView();
      ov.onAdd=function(){
        var div=document.createElement('div');
        div.className='ep entering '+(kindClass(ev,live));

        var bubble=document.createElement('div');
        bubble.className='ep-b';
        bubble.textContent=ev.emoji||'📍';

        // Live red dot
        if(live){
          var ld=document.createElement('div');
          ld.className='live-dot';
          bubble.appendChild(ld);
        }

        // My-event star badge
        if(own&&!live){
          var badge=document.createElement('div');
          badge.className='ep-badge';
          badge.textContent='✦';
          bubble.appendChild(badge);
        }

        var tail=document.createElement('div');
        tail.className='ep-t';

        div.appendChild(bubble);
        div.appendChild(tail);
        rec.div=div;

        div.addEventListener('pointerdown',function(e){e.preventDefault();e.stopPropagation();div.classList.add('pressing');},{passive:false});
        div.addEventListener('pointerup',function(e){e.stopPropagation();div.classList.remove('pressing');},{passive:false});
        div.addEventListener('pointercancel',function(){div.classList.remove('pressing');});

        var fired=false;
        div.addEventListener('click',function(e){
          e.preventDefault();e.stopPropagation();
          if(fired)return;fired=true;setTimeout(function(){fired=false;},350);
          var prev=document.querySelector('.ep.sel');
          if(prev&&prev!==div)prev.classList.remove('sel');
          div.classList.toggle('sel');
          post('pinClick',{event:ev});
          showToast((ev.emoji||'📍')+' '+(ev.title||''));
        });

        google.maps.OverlayView.preventMapHitsAndGesturesFrom&&
          google.maps.OverlayView.preventMapHitsAndGesturesFrom(div);
        this.getPanes().overlayMouseTarget.appendChild(div);
      };
      ov.draw=function(){
        var proj=this.getProjection();if(!proj||!rec.div)return;
        var pt=proj.fromLatLngToDivPixel(new google.maps.LatLng(ev.lat,ev.lng));
        if(!pt)return;
        rec.px={x:pt.x,y:pt.y};
        rec.div.style.left=Math.round(pt.x)+'px';
        rec.div.style.top=Math.round(pt.y)+'px';
      };
      ov.onRemove=function(){};
      rec.show=function(v){if(rec.div)rec.div.style.display=v?'flex':'none';};
      rec.ov=ov;return rec;
    }

    /* ══ CLUSTER OVERLAY (pooled) ══ */
    function makeClusterOverlay(){
      var rec={div:null,items:[],visible:false};
      var ov=new google.maps.OverlayView();
      ov.onAdd=function(){
        var div=document.createElement('div');
        div.className='cb';div.style.display='none';
        rec.div=div;
        div.addEventListener('pointerdown',function(e){e.preventDefault();e.stopPropagation();div.classList.add('pressing');},{passive:false});
        div.addEventListener('pointerup',function(e){e.stopPropagation();div.classList.remove('pressing');},{passive:false});
        div.addEventListener('pointercancel',function(){div.classList.remove('pressing');});
        var fired=false;
        div.addEventListener('click',function(e){
          e.preventDefault();e.stopPropagation();
          if(fired||!rec.visible)return;fired=true;setTimeout(function(){fired=false;},350);
          var first=rec.items[0];
          var allSame=true;
          for(var i=1;i<rec.items.length;i++){
            if(Math.abs(rec.items[i].ev.lat-first.ev.lat)>0.0001||
               Math.abs(rec.items[i].ev.lng-first.ev.lng)>0.0001){allSame=false;break;}
          }
          if(allSame){
            openStack(rec.items);
          } else {
            var lat=0,lng=0,n=rec.items.length;
            for(var j=0;j<n;j++){lat+=rec.items[j].ev.lat;lng+=rec.items[j].ev.lng;}
            map.panTo({lat:lat/n,lng:lng/n});
            map.setZoom(Math.min((map.getZoom()||12)+3,18));
          }
        });
        google.maps.OverlayView.preventMapHitsAndGesturesFrom&&
          google.maps.OverlayView.preventMapHitsAndGesturesFrom(div);
        this.getPanes().overlayMouseTarget.appendChild(div);
      };
      ov.draw=function(){};
      ov.onRemove=function(){};
      rec.ov=ov;return rec;
    }

    function showCluster(rec,items,cx,cy){
      rec.items=items;rec.visible=true;
      var n=items.length;
      var sz=n>=20?'sz3':n>=8?'sz2':'';
      rec.div.className='cb entering '+sz;
      var freq={},topEm='📍',topN=0;
      for(var i=0;i<items.length;i++){
        var em=items[i].ev.emoji||'📍';
        freq[em]=(freq[em]||0)+1;
        if(freq[em]>topN){topN=freq[em];topEm=em;}
      }
      rec.div.innerHTML='<span class="cn">'+n+'</span><span class="ce">'+topEm+'</span>';
      rec.div.style.left=Math.round(cx)+'px';
      rec.div.style.top=Math.round(cy)+'px';
      rec.div.style.zIndex='5000';
      rec.div.style.display='flex';
    }
    function hideCluster(rec){
      rec.visible=false;rec.items=[];
      if(rec.div)rec.div.style.display='none';
    }

    /* ══ LAYOUT ══ */
    var layoutPending=false;
    function scheduleLayout(){
      if(layoutPending)return;layoutPending=true;
      requestAnimationFrame(function(){layoutPending=false;doLayout();});
    }
    function doLayout(){
      var alive=[];
      for(var i=0;i<pinRecs.length;i++){if(pinRecs[i].px)alive.push(pinRecs[i]);}
      if(!alive.length)return;
      var groups=[];
      for(var p=0;p<alive.length;p++){
        var o=alive[p],placed=false;
        for(var g=0;g<groups.length;g++){
          var gr=groups[g];
          var dx=o.px.x-gr.cx,dy=o.px.y-gr.cy;
          if(dx*dx+dy*dy<=CLUSTER_PX*CLUSTER_PX){
            gr.items.push(o);
            var sx=0,sy=0;
            for(var s=0;s<gr.items.length;s++){sx+=gr.items[s].px.x;sy+=gr.items[s].px.y;}
            gr.cx=sx/gr.items.length;gr.cy=sy/gr.items.length;
            placed=true;break;
          }
        }
        if(!placed)groups.push({cx:o.px.x,cy:o.px.y,items:[o]});
      }
      for(var a=0;a<alive.length;a++)alive[a].show(true);
      for(var c=0;c<clusterPool.length;c++)hideCluster(clusterPool[c]);
      var ci=0;
      for(var n=0;n<groups.length;n++){
        var grp=groups[n];
        if(grp.items.length>1){
          for(var h=0;h<grp.items.length;h++)grp.items[h].show(false);
          if(ci<clusterPool.length){showCluster(clusterPool[ci],grp.items,grp.cx,grp.cy);ci++;}
        } else {
          var r=grp.items[0];r.show(true);
          if(r.div){r.div.style.zIndex='10';}
        }
      }
    }

    /* ══ initMap ══ */
    window.gm_authFailure = function() {
      post('log', { msg: 'Google Maps auth failed — check Maps JS API + billing.' });
    };

    function initMap(){
      if(!window.google||!google.maps){post('log',{msg:'Google object not found'});return;}
      map=new google.maps.Map(document.getElementById('map'),{
        center:CENTER,zoom:ZOOM,
        disableDefaultUI:true,clickableIcons:false,gestureHandling:'greedy'
      });
      for(var c=0;c<POOL_SIZE;c++){var cr=makeClusterOverlay();cr.ov.setMap(map);clusterPool.push(cr);}
      for(var i=0;i<DATA.length;i++){var pr=makePinOverlay(DATA[i],i);pr.ov.setMap(map);pinRecs.push(pr);}
      google.maps.event.addListener(map,'idle',scheduleLayout);
      google.maps.event.addListener(map,'zoom_changed',function(){closeStack();scheduleLayout();});
      google.maps.event.addListener(map,'click',function(){closeStack();});
      showToast('✦ '+DATA.length+' events nearby');
    }
    window.initMap=initMap;

    /* ══ goToLocation ══ */
    function handleLocationMsg(data){
      try{
        var msg=JSON.parse(data);
        if(!msg||msg.type!=='goToLocation')return;
        var lat=Number(msg.lat),lng=Number(msg.lng);
        if(!isFinite(lat)||!isFinite(lng))return;
        if(!map){setTimeout(function(){handleLocationMsg(data);},500);return;}
        map.panTo({lat:lat,lng:lng});
        map.setZoom(Math.max(map.getZoom()||0,15));
        if(window._locOv){window._locOv.setMap(null);window._locOv=null;}
        if(!document.getElementById('lpStyle')){
          var st=document.createElement('style');st.id='lpStyle';
          st.textContent='@keyframes lp{0%,100%{box-shadow:0 0 0 0 rgba(10,132,255,0.5)}60%{box-shadow:0 0 0 10px rgba(10,132,255,0)}}';
          document.head.appendChild(st);
        }
        var lOv=new google.maps.OverlayView();
        lOv._pos=new google.maps.LatLng(lat,lng);
        lOv.onAdd=function(){
          var o=document.createElement('div');
          o.style.cssText='position:absolute;width:22px;height:22px;border-radius:50%;background:rgba(10,132,255,.18);border:2.5px solid rgba(10,132,255,.55);display:flex;align-items:center;justify-content:center;transform:translate(-50%,-50%);pointer-events:none;animation:lp 1.8s ease-out infinite;';
          var inn=document.createElement('div');
          inn.style.cssText='width:11px;height:11px;border-radius:50%;background:#0A84FF;border:2.5px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.3);';
          o.appendChild(inn);this._div=o;
          this.getPanes().overlayMouseTarget.appendChild(o);
        };
        lOv.draw=function(){var pr=this.getProjection();if(!pr||!this._div)return;var pt=pr.fromLatLngToDivPixel(this._pos);if(!pt)return;this._div.style.left=pt.x+'px';this._div.style.top=pt.y+'px';};
        lOv.onRemove=function(){if(this._div&&this._div.parentNode){this._div.parentNode.removeChild(this._div);this._div=null;}};
        lOv.setMap(map);window._locOv=lOv;
        showToast('📍 Current location');
      }catch(ex){}
    }
    window.addEventListener('message',function(e){handleLocationMsg(e.data);});
    document.addEventListener('message',function(e){handleLocationMsg(e.data);});
    window.addEventListener('error',function(e){post('log',{msg:'JS error: '+(e.message||'?')});});
  })();
  </script>
  <script async defer src="https://maps.googleapis.com/maps/api/js?key=` + googleKey + `&v=weekly&callback=initMap"></script>
</body>
</html>`;
  return html;
}
