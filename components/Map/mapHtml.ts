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

    /* ══ INDIVIDUAL PIN — redesigned ══ */
    .ep{
      position:absolute;
      display:flex;flex-direction:column;align-items:center;
      cursor:pointer;touch-action:manipulation;pointer-events:auto;
      transform:translate(-50%,-100%) translateY(-4px);
      transform-origin:50% 100%;
      will-change:transform;
      transition:opacity 0.12s;
    }
    .ep-b{
      width:40px;height:40px;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:20px;line-height:1;
      background:#ffffff;
      box-shadow:0 1px 4px rgba(0,0,0,0.10),0 3px 12px rgba(0,0,0,0.08);
      position:relative;flex-shrink:0;
      border:2px solid rgba(0,0,0,0.06);
      transition:transform 0.12s,box-shadow 0.12s;
    }
    .ep-t{
      width:0;height:0;
      border-left:4px solid transparent;
      border-right:4px solid transparent;
      border-top:6px solid #ffffff;
      margin-top:-1px;
      filter:drop-shadow(0 2px 2px rgba(0,0,0,0.10));
    }
    .ep-lbl{
      margin-top:4px;
      background:rgba(10,10,20,0.88);
      color:#f8fafc;
      font:600 10px/1.3 -apple-system,system-ui,sans-serif;
      padding:2px 7px;border-radius:6px;
      white-space:nowrap;max-width:112px;
      overflow:hidden;text-overflow:ellipsis;
      pointer-events:none;
      opacity:0;transition:opacity 0.15s;
    }
    .ep.labeled .ep-lbl{opacity:1;}

    /* ── Category rings: thin colored border + subtle glow ── */
    .ep.free   .ep-b{border-color:#22C55E;box-shadow:0 0 0 0 transparent,0 1px 4px rgba(0,0,0,0.08),0 3px 14px rgba(34,197,94,0.22);}
    .ep.free   .ep-t{border-top-color:#f0fdf4;}
    .ep.paid   .ep-b{border-color:#F59E0B;box-shadow:0 0 0 0 transparent,0 1px 4px rgba(0,0,0,0.08),0 3px 14px rgba(245,158,11,0.22);}
    .ep.paid   .ep-t{border-top-color:#fffbeb;}
    .ep.service .ep-b{border-color:#8B5CF6;box-shadow:0 0 0 0 transparent,0 1px 4px rgba(0,0,0,0.08),0 3px 14px rgba(139,92,246,0.22);}
    .ep.service .ep-t{border-top-color:#f5f3ff;}

    /* ── Mine: dark filled ── */
    .ep.mine .ep-b{
      background:#1e1b4b;border-color:#6366F1;font-size:18px;
      box-shadow:0 1px 4px rgba(0,0,0,0.12),0 4px 16px rgba(99,102,241,0.30);
    }
    .ep.mine .ep-t{border-top-color:#1e1b4b;}

    /* ── Live: red pulse ── */
    .ep.live .ep-b{
      border-color:#ef4444;
      box-shadow:0 1px 4px rgba(0,0,0,0.10),0 3px 14px rgba(239,68,68,0.28);
      animation:liveGlow 2s ease-in-out infinite;
    }
    .live-dot{
      position:absolute;top:-2px;right:-2px;
      width:9px;height:9px;border-radius:50%;
      background:#ef4444;border:1.5px solid #fff;
      animation:livePulse 1.4s ease-in-out infinite;
    }
    .ep-star{
      position:absolute;top:-3px;right:-3px;
      width:13px;height:13px;border-radius:50%;
      background:#6366F1;border:1.5px solid #fff;
      display:flex;align-items:center;justify-content:center;
      font-size:6px;color:#fff;line-height:1;pointer-events:none;
    }

    .ep.paused{opacity:0.35;filter:grayscale(0.9);}
    .ep.pressing .ep-b{transform:scale(0.88);}
    .ep.sel .ep-b{
      transform:scale(1.15);
      box-shadow:0 0 0 3px #fff,0 0 0 5px rgba(99,102,241,0.55),0 6px 22px rgba(0,0,0,0.18)!important;
    }
    .ep.sel{z-index:9999!important;}

    @keyframes pinIn{
      0%{opacity:0;transform:translate(-50%,-100%) translateY(6px) scale(0.3)}
      60%{transform:translate(-50%,-100%) translateY(-6px) scale(1.05)}
      100%{opacity:1;transform:translate(-50%,-100%) translateY(-4px) scale(1)}
    }
    .ep.entering{animation:pinIn 0.28s cubic-bezier(0.34,1.56,0.64,1) both}

    @keyframes liveGlow{0%,100%{box-shadow:0 1px 4px rgba(0,0,0,0.10),0 3px 14px rgba(239,68,68,0.20)}50%{box-shadow:0 1px 4px rgba(0,0,0,0.10),0 3px 20px rgba(239,68,68,0.50)}}
    @keyframes livePulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.7);opacity:0.35}}

    /* ══ CLUSTER — refined ══ */
    .cb{
      position:absolute;
      display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;
      border-radius:50%;
      background:#4f46e5;
      border:2.5px solid #fff;
      box-shadow:0 2px 8px rgba(79,70,229,0.35),0 1px 3px rgba(0,0,0,0.10);
      transform:translate(-50%,-50%);
      cursor:pointer;touch-action:manipulation;pointer-events:auto;
      will-change:transform;
      transition:transform 0.18s cubic-bezier(0.34,1.56,0.64,1);
    }
    .cb,.cb.sz1{width:44px;height:44px;}
    .cb.sz2{width:54px;height:54px;background:#4338ca;}
    .cb.sz3{width:64px;height:64px;background:#3730a3;}
    .cb.sz4{width:74px;height:74px;background:#312e81;}

    /* outer pulse ring */
    .cb::before{
      content:"";position:absolute;inset:-8px;border-radius:50%;
      border:1.5px solid rgba(99,102,241,0.28);
      animation:halo 2.8s ease-in-out infinite;pointer-events:none;
    }

    .cb .cn{
      font-weight:800;color:#fff;line-height:1;
      font-family:-apple-system,system-ui,sans-serif;letter-spacing:-0.5px;
    }
    .cb .cn{font-size:14px;} .cb.sz2 .cn{font-size:17px;} .cb.sz3 .cn{font-size:20px;} .cb.sz4 .cn{font-size:24px;}
    .cb .cem{font-size:11px;line-height:1;filter:drop-shadow(0 1px 1px rgba(0,0,0,.25));}
    .cb.sz2 .cem{font-size:13px;} .cb.sz3 .cem{font-size:15px;}

    .cb.pressing{transform:translate(-50%,-50%) scale(0.88)!important;transition:transform 0.07s ease!important;}

    @keyframes halo{0%,100%{transform:scale(1);opacity:0.8}50%{transform:scale(1.22);opacity:0}}
    @keyframes clIn{
      0%{opacity:0;transform:translate(-50%,-50%) scale(0.2)}
      65%{transform:translate(-50%,-50%) scale(1.12)}
      100%{opacity:1;transform:translate(-50%,-50%) scale(1)}
    }
    .cb.entering{animation:clIn 0.24s cubic-bezier(0.34,1.56,0.64,1) both}

    /* ══ STACK POPUP ══ */
    #stack-popup{
      position:absolute;bottom:0;left:0;right:0;background:#fff;
      border-radius:24px 24px 0 0;
      box-shadow:0 -2px 40px rgba(0,0,0,0.18),0 -1px 0 rgba(0,0,0,0.06);
      z-index:10000;transform:translateY(100%);
      transition:transform 0.34s cubic-bezier(0.32,0.72,0,1);
      display:flex;flex-direction:column;max-height:60vh;
    }
    #stack-popup.open{transform:translateY(0);}
    #sh{width:40px;height:4px;border-radius:2px;background:rgba(0,0,0,0.12);margin:12px auto 0;flex-shrink:0;}
    #shdr{display:flex;align-items:center;justify-content:space-between;padding:14px 20px 8px;flex-shrink:0;}
    #slbl{font-size:11px;font-weight:700;letter-spacing:0.6px;color:#94a3b8;text-transform:uppercase;font-family:-apple-system,system-ui,sans-serif;}
    #scnt{font-size:12px;font-weight:700;background:rgba(79,70,229,0.10);color:#4f46e5;border-radius:20px;padding:3px 10px;font-family:-apple-system,system-ui,sans-serif;}
    #sclose{width:30px;height:30px;border-radius:50%;background:rgba(0,0,0,0.07);border:none;outline:none;cursor:pointer;color:#64748b;font-size:14px;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    #slist{overflow-y:auto;flex:1;padding:4px 14px 20px;-webkit-overflow-scrolling:touch;}
    .si{display:flex;align-items:center;gap:14px;padding:11px 10px;border-radius:16px;cursor:pointer;touch-action:manipulation;transition:background 0.12s;position:relative;}
    .si:active{background:rgba(0,0,0,0.05);}
    .si+.si::before{content:"";position:absolute;top:0;left:68px;right:10px;height:1px;background:rgba(0,0,0,0.06);}
    .si-ic{width:50px;height:50px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0;background:rgba(0,0,0,0.04);}
    .si-ic.free{background:rgba(22,163,74,0.10);}.si-ic.paid{background:rgba(234,88,12,0.10);}.si-ic.service{background:rgba(124,58,237,0.10);}.si-ic.mine{background:rgba(99,102,241,0.12);}
    .si-bd{flex:1;min-width:0;}
    .si-tt{font-size:15px;font-weight:600;color:#0f172a;font-family:-apple-system,system-ui,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:-0.2px;}
    .si-sb{font-size:12px;color:#94a3b8;margin-top:2px;font-family:-apple-system,system-ui,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .si-pl{font-size:11px;font-weight:700;padding:4px 10px;border-radius:20px;flex-shrink:0;font-family:-apple-system,system-ui,sans-serif;}
    .si-pl.free{background:rgba(22,163,74,0.12);color:#16a34a;}.si-pl.paid{background:rgba(234,88,12,0.12);color:#ea580c;}.si-pl.service{background:rgba(124,58,237,0.12);color:#7c3aed;}.si-pl.mine{background:rgba(99,102,241,0.12);color:#4f46e5;}
    .si-ar{color:#cbd5e1;font-size:16px;flex-shrink:0;margin-left:2px;}

    #toast{
      position:absolute;bottom:16px;left:50%;transform:translateX(-50%);
      background:rgba(15,23,42,0.84);color:#f1f5f9;
      border-radius:20px;padding:7px 18px;
      font:12px/1.5 -apple-system,system-ui,sans-serif;
      white-space:nowrap;z-index:9998;pointer-events:none;
      backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.08);
      opacity:0;transition:opacity 0.25s;
    }
    #toast.show{opacity:1;}
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="stack-popup">
    <div id="sh"></div>
    <div id="shdr">
      <div style="display:flex;align-items:center;gap:8px;">
        <span id="slbl">Events here</span>
        <span id="scnt">0</span>
      </div>
      <button id="sclose">✕</button>
    </div>
    <div id="slist"></div>
  </div>
  <div id="toast"></div>

  <script>
  (function(){
    var DATA       = ` + eventsJson + `;
    var CENTER     = {lat:` + center.lat + `,lng:` + center.lng + `};
    var ZOOM       = ` + zoom + `;
    var MY_ID      = ` + safeUserId + `;

    /* ── pool sizes ── */
    var PIN_POOL     = 80;   /* reduced: fewer DOM nodes = faster layout */
    var CLUSTER_POOL = 50;
    var MAX_IN_VIEW  = 300;

    var map, masterOv, proj;
    var container;
    var pins = [];      /* pool: {div, ev} */
    var clusters = [];  /* pool: {div, items} */
    var activePinCount = 0, activeClusterCount = 0;
    var pendingEvents = null; /* events received before initMap */
    var stackOpen = false, toastTimer, pressedEl = null;

    /* ── bridge ── */
    function post(t,x){try{window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify(Object.assign({type:t},x||{})));}catch(e){}}
    function showToast(t){var el=document.getElementById('toast');if(!el)return;el.textContent=t;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(function(){el.classList.remove('show');},2400);}

    /* ── helpers ── */
    function isOwn(ev){return MY_ID&&String(ev.creatorClerkId||'')===MY_ID;}
    function kindCls(ev,live){
      var c='';
      if(ev.status==='paused')c='paused ';
      if(isOwn(ev))c+='mine ';
      if(live)return c+'live';
      var k=String(ev.kind||'');
      if(k.indexOf('free')>=0)return c+'free';
      if(k.indexOf('paid')>=0)return c+'paid';
      if(k==='service')return c+'service';
      return c.trim();
    }
    function kindPill(ev){
      if(isOwn(ev))return 'mine';
      var k=String(ev.kind||'');
      if(k.indexOf('free')>=0)return 'free';
      if(k.indexOf('paid')>=0)return 'paid';
      if(k==='service')return 'service';
      return '';
    }
    function kindLabel(ev){
      if(isOwn(ev))return 'My event';
      var k=String(ev.kind||'');
      if(k.indexOf('free')>=0)return 'Free';
      if(k.indexOf('paid')>=0)return 'Paid';
      if(k==='service')return 'Service';
      return '';
    }
    function isLive(ev){
      if(!ev||ev.status==='ended')return false;
      if(!ev.startsAt&&!ev.date)return false;
      var ms;
      if(ev.startsAt)ms=new Date(ev.startsAt).getTime();
      else if(ev.date&&ev.time)ms=new Date(ev.date+'T'+ev.time+':00Z').getTime();
      else if(ev.date)ms=new Date(ev.date+'T12:00:00Z').getTime();
      return !!(ms&&isFinite(ms)&&ms<=Date.now());
    }
    function gz(){return map?(map.getZoom()||12):12;}
    function clRadius(){
      var z=gz();
      if(z>=16)return 20; /* still cluster exact-same-location even at high zoom */
      if(z>=14)return 30;
      if(z>=12)return 48;
      if(z>=10)return 66;
      return 80;
    }

    /* ── stack popup ── */
    document.getElementById('sclose').addEventListener('click',closeStack);
    function openStack(evList){
      if(stackOpen)return;
      stackOpen=true;post('stackOpen',{});
      document.getElementById('scnt').textContent=evList.length;
      var list=document.getElementById('slist');list.innerHTML='';
      for(var i=0;i<evList.length;i++){
        (function(ev){
          var pc=kindPill(ev),ic=isOwn(ev)?'mine':pc||'',kl=kindLabel(ev);
          var sub=ev.address||ev.when||ev.description||'Tap to view';
          if(sub&&sub.length>44)sub=sub.slice(0,44)+'…';
          var el=document.createElement('div');el.className='si';
          el.innerHTML='<div class="si-ic '+ic+'">'+(ev.emoji||'📍')+'</div>'+
            '<div class="si-bd"><div class="si-tt">'+(ev.title||'Event')+'</div><div class="si-sb">'+sub+'</div></div>'+
            (kl?'<span class="si-pl '+pc+'">'+kl+'</span>':'')+
            '<span class="si-ar">›</span>';
          el.addEventListener('click',function(e){e.stopPropagation();closeStack();post('pinClick',{event:ev});showToast((ev.emoji||'📍')+' '+(ev.title||''));});
          list.appendChild(el);
        })(evList[i]);
      }
      document.getElementById('stack-popup').classList.add('open');
    }
    function closeStack(){
      if(!stackOpen)return;stackOpen=false;
      document.getElementById('stack-popup').classList.remove('open');
      post('stackClose',{});
    }

    /* ── create pool divs ── */
    function makePinDiv(){
      var d=document.createElement('div');d.className='ep';d.style.cssText='position:absolute;display:none;';
      var b=document.createElement('div');b.className='ep-b';
      var t=document.createElement('div');t.className='ep-t';
      var l=document.createElement('div');l.className='ep-lbl';
      d.appendChild(b);d.appendChild(t);d.appendChild(l);
      return d;
    }
    function makeClusterDiv(){
      var d=document.createElement('div');d.className='cb';d.style.cssText='position:absolute;display:none;';
      return d;
    }

    /* ── activate pool items ── */
    function activatePin(pin,ev,px,labeled){
      var live=isLive(ev),own=isOwn(ev);
      var div=pin.div;
      /* Only play entrance animation when pin is newly assigned to this event */
      var isNew=!pin.ev||pin.ev._id!==ev._id;
      pin.ev=ev;

      var cls='ep '+(isNew?'entering ':'')+kindClass(ev,live);
      if(labeled)cls+=' labeled';
      div.className=cls;
      div.style.left=Math.round(px.x)+'px';
      div.style.top=Math.round(px.y)+'px';
      div.style.display='flex';
      /* z-ordering by latitude: southern pins render on top of northern — prevents overlap confusion */
      var zLat=Math.max(10,Math.min(8900,Math.round((90-ev.lat)*98)));
      div.style.zIndex=String(zLat);

      var bub=div.querySelector('.ep-b');
      /* clear old sub-elements (live dot / star) */
      while(bub.firstChild)bub.removeChild(bub.firstChild);
      bub.textContent=ev.emoji||'📍';

      if(live){var ld=document.createElement('div');ld.className='live-dot';bub.appendChild(ld);}
      else if(own){var st=document.createElement('div');st.className='ep-star';st.textContent='✦';bub.appendChild(st);}

      var lbl=div.querySelector('.ep-lbl');
      var ti=(ev.title||'').trim();
      lbl.textContent=ti.length>26?ti.slice(0,26)+'…':ti;

      /* store ev reference for click delegation */
      div._ev=ev;
    }

    function kindClass(ev,live){return kindCls(ev,live);}

    function activateCluster(cl,items,cx,cy){
      var n=items.length;
      var sz=n>=200?'sz4':n>=50?'sz3':n>=10?'sz2':'';
      var div=cl.div;
      /* skip entrance animation if cluster count unchanged (re-layout, not new cluster) */
      var prevN=cl.items?cl.items.length:0;
      cl.items=items;
      var isNewCluster=prevN!==n;
      div.className='cb '+(isNewCluster?'entering ':'')+sz;
      div.style.left=Math.round(cx)+'px';
      div.style.top=Math.round(cy)+'px';
      div.style.zIndex='5000';
      div.style.display='flex';

      /* dominant emoji */
      var freq={},topEm='📍',topN=0;
      for(var i=0;i<items.length;i++){
        var em=items[i].emoji||'📍';
        freq[em]=(freq[em]||0)+1;
        if(freq[em]>topN){topN=freq[em];topEm=em;}
      }
      div.innerHTML='<span class="cem">'+topEm+'</span><span class="cn">'+n+'</span>';
      div._items=items;
    }

    function resetPools(){
      for(var i=0;i<activePinCount;i++){pins[i].div.style.display='none';pins[i].ev=null;}
      for(var j=0;j<activeClusterCount;j++){clusters[j].div.style.display='none';clusters[j].items=[];}
      activePinCount=0;activeClusterCount=0;
    }

    /* ── main layout — debounced 80ms + single RAF ── */
    var layoutTimer=null,layoutPending=false;
    function scheduleLayout(){
      if(layoutTimer)clearTimeout(layoutTimer);
      layoutTimer=setTimeout(function(){
        layoutTimer=null;
        if(layoutPending)return;
        layoutPending=true;
        requestAnimationFrame(function(){layoutPending=false;doLayout();});
      },80);
    }

    function doLayout(){
      if(!proj||!map)return;
      var bounds=map.getBounds();if(!bounds)return;

      /* viewport + 30% buffer */
      var ne=bounds.getNorthEast(),sw=bounds.getSouthWest();
      var dlat=(ne.lat()-sw.lat())*0.3,dlng=(ne.lng()-sw.lng())*0.3;
      var minLat=sw.lat()-dlat,maxLat=ne.lat()+dlat;
      var minLng=sw.lng()-dlng,maxLng=ne.lng()+dlng;

      /* filter + pixel-project events in view */
      var inView=[];
      for(var i=0;i<DATA.length&&inView.length<MAX_IN_VIEW;i++){
        var ev=DATA[i];
        if(ev.lat>=minLat&&ev.lat<=maxLat&&ev.lng>=minLng&&ev.lng<=maxLng){
          var pt=proj.fromLatLngToDivPixel(new google.maps.LatLng(ev.lat,ev.lng));
          if(pt)inView.push({ev:ev,px:pt});
        }
      }

      resetPools();

      var radius=clRadius();
      var labeled=gz()>=14;

      if(radius===0){
        /* high zoom: individual pins only */
        for(var k=0;k<inView.length&&activePinCount<pins.length;k++){
          activatePin(pins[activePinCount],inView[k].ev,inView[k].px,labeled);activePinCount++;
        }
        return;
      }

      /* grid-based O(n) clustering */
      var cellSize=radius;
      var grid={};
      var groups=[];
      for(var p=0;p<inView.length;p++){
        var o=inView[p];
        var gx=Math.floor(o.px.x/cellSize),gy=Math.floor(o.px.y/cellSize);
        var placed=false;
        for(var dx=-1;dx<=1&&!placed;dx++){
          for(var dy=-1;dy<=1&&!placed;dy++){
            var key=(gx+dx)+','+(gy+dy);
            var gi=grid[key];
            if(gi!==undefined){
              var gr=groups[gi];
              var ddx=o.px.x-gr.cx,ddy=o.px.y-gr.cy;
              if(ddx*ddx+ddy*ddy<=radius*radius){
                gr.cx=(gr.cx*gr.items.length+o.px.x)/(gr.items.length+1);
                gr.cy=(gr.cy*gr.items.length+o.px.y)/(gr.items.length+1);
                gr.items.push(o);placed=true;
              }
            }
          }
        }
        if(!placed){grid[gx+','+gy]=groups.length;groups.push({cx:o.px.x,cy:o.px.y,items:[o]});}
      }

      for(var n=0;n<groups.length;n++){
        var grp=groups[n];
        if(grp.items.length>1){
          if(activeClusterCount<clusters.length){
            activateCluster(clusters[activeClusterCount],grp.items.map(function(x){return x.ev;}),grp.cx,grp.cy);activeClusterCount++;
          }
          /* else: overflow — show first item as individual pin */
          else if(activePinCount<pins.length){
            activatePin(pins[activePinCount],grp.items[0].ev,grp.items[0].px,labeled);activePinCount++;
          }
        } else if(activePinCount<pins.length){
          activatePin(pins[activePinCount],grp.items[0].ev,grp.items[0].px,labeled);activePinCount++;
        }
      }
    }

    /* ── click / press delegation ── */
    function findTarget(el){
      while(el&&el!==container){
        if(el.classList&&(el.classList.contains('ep')||el.classList.contains('cb')))return el;
        el=el.parentElement;
      }
      return null;
    }

    function handlePointerDown(e){
      e.preventDefault();e.stopPropagation();
      var t=findTarget(e.target);
      if(t){t.classList.add('pressing');pressedEl=t;}
    }
    function handlePointerUp(e){
      e.stopPropagation();
      if(pressedEl){pressedEl.classList.remove('pressing');pressedEl=null;}
    }
    function handleClick(e){
      e.preventDefault();e.stopPropagation();
      var t=findTarget(e.target);if(!t)return;

      if(t.classList.contains('ep')&&t._ev){
        var prev=container.querySelector('.ep.sel');
        if(prev&&prev!==t)prev.classList.remove('sel');
        t.classList.toggle('sel');
        post('pinClick',{event:t._ev});
        showToast((t._ev.emoji||'📍')+' '+(t._ev.title||''));
        return;
      }

      if(t.classList.contains('cb')&&t._items&&t._items.length){
        var items=t._items;
        var first=items[0];
        var same=true;
        for(var i=1;i<items.length;i++){
          if(Math.abs(items[i].lat-first.lat)>0.0001||Math.abs(items[i].lng-first.lng)>0.0001){same=false;break;}
        }
        if(same){openStack(items.map(function(ev){return {ev:ev};}).map(function(x){return x;}));}
        else{
          var la=0,ln=0,n=items.length;
          for(var j=0;j<n;j++){la+=items[j].lat;ln+=items[j].lng;}
          map.panTo({lat:la/n,lng:ln/n});
          map.setZoom(Math.min((gz()||12)+3,18));
        }
      }
    }

    /* ── initMap ── */
    window.gm_authFailure=function(){post('log',{msg:'Google Maps auth failed.'});};

    function initMap(){
      if(!window.google||!google.maps){post('log',{msg:'google not found'});return;}

      map=new google.maps.Map(document.getElementById('map'),{
        center:CENTER,zoom:ZOOM,
        disableDefaultUI:true,clickableIcons:false,gestureHandling:'greedy',
      });

      /* master overlay — gives us projection + single container */
      masterOv=new google.maps.OverlayView();
      masterOv.onAdd=function(){
        container=document.createElement('div');
        container.style.cssText='position:absolute;top:0;left:0;width:0;height:0;';
        this.getPanes().overlayMouseTarget.appendChild(container);

        /* prevent map pan from triggering when touching pins */
        google.maps.OverlayView.preventMapHitsAndGesturesFrom(container);

        /* create pin pool */
        for(var i=0;i<PIN_POOL;i++){
          var d=makePinDiv();container.appendChild(d);
          pins.push({div:d,ev:null});
        }
        /* create cluster pool */
        for(var j=0;j<CLUSTER_POOL;j++){
          var cd=makeClusterDiv();container.appendChild(cd);
          clusters.push({div:cd,items:[]});
        }

        container.addEventListener('pointerdown',handlePointerDown,{passive:false});
        container.addEventListener('pointerup',handlePointerUp,{passive:false});
        container.addEventListener('pointercancel',handlePointerUp,{passive:false});
        container.addEventListener('click',handleClick,{passive:false});
      };
      masterOv.draw=function(){
        proj=this.getProjection();
        scheduleLayout();
      };
      masterOv.onRemove=function(){};
      masterOv.setMap(map);

      google.maps.event.addListener(map,'idle',scheduleLayout);
      google.maps.event.addListener(map,'zoom_changed',function(){closeStack();scheduleLayout();});
      google.maps.event.addListener(map,'click',function(){closeStack();});

      showToast('✦ '+DATA.length+' events loaded');

      /* flush any events buffered before map was ready */
      if(pendingEvents){DATA=pendingEvents;pendingEvents=null;scheduleLayout();showToast('✦ '+DATA.length+' events loaded');}
    }
    window.initMap=initMap;

    /* ── stack popup fix: openStack expects {ev} items ── */
    var _openStack=openStack;
    openStack=function(items){
      /* items can be raw ev objects or {ev} wrappers */
      var evList=items.map(function(x){return x&&x.ev?x.ev:x;});
      _openStack(evList);
    };

    /* ── current location ── */
    function handleMsg(data){
      try{
        var msg=JSON.parse(data);
        if(!msg)return;

        if(msg.type==='updateEvents'&&Array.isArray(msg.events)){
          var evts=msg.events;
          if(!map){pendingEvents=evts;return;}
          DATA=evts;
          scheduleLayout();
          showToast('✦ '+DATA.length+' events loaded');
          return;
        }

        if(msg.type!=='goToLocation')return;
        var lat=Number(msg.lat),lng=Number(msg.lng);
        if(!isFinite(lat)||!isFinite(lng))return;
        if(!map){setTimeout(function(){handleMsg(data);},500);return;}
        map.panTo({lat:lat,lng:lng});
        map.setZoom(Math.max(gz()||0,15));
        if(window._locOv){window._locOv.setMap(null);window._locOv=null;}
        if(!document.getElementById('lpSt')){
          var st=document.createElement('style');st.id='lpSt';
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
    window.addEventListener('message',function(e){handleMsg(e.data);});
    document.addEventListener('message',function(e){handleMsg(e.data);});
    window.addEventListener('error',function(e){post('log',{msg:'JS: '+(e.message||'?')});});
  })();
  </script>
  <script async defer src="https://maps.googleapis.com/maps/api/js?key=` + googleKey + `&v=weekly&callback=initMap"></script>
</body>
</html>`;
  return html;
}
