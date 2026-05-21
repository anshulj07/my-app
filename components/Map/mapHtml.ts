// // components/Map/mapHtml.ts
// export function buildMapHtml(args: {
//   googleKey: string;
//   eventsJson: string;
//   center: { lat: number; lng: number };
//   zoom: number;
//   userId?: string | null;
// }) {
//   const { googleKey, eventsJson, center, zoom, userId } = args;
//   const safeUserId = userId ? JSON.stringify(userId) : 'null';

//   const html =
// `<!doctype html>
// <html>
// <head>
//   <meta charset="utf-8"/>
//   <meta name="viewport" content="initial-scale=1,width=device-width,maximum-scale=1"/>
//   <style>
//     *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
//     html,body,#map{height:100%;margin:0;padding:0;overflow:hidden}
//     #pin-canvas{position:absolute;top:0;left:0;pointer-events:none;z-index:1;}

//     /* ══ BOTTOM SHEET ══ */
//     #stack-popup{
//       position:absolute;bottom:0;left:0;right:0;
//       background:#fff;
//       border-radius:24px 24px 0 0;
//       box-shadow:0 -2px 40px rgba(0,0,0,0.18),0 -1px 0 rgba(0,0,0,0.06);
//       z-index:10000;
//       transform:translateY(100%);
//       transition:transform 0.36s cubic-bezier(0.32,0.72,0,1);
//       display:flex;flex-direction:column;
//       max-height:58vh;
//     }
//     #stack-popup.open{transform:translateY(0);}
//     #stack-handle{width:40px;height:4px;border-radius:2px;background:rgba(0,0,0,0.12);margin:12px auto 0;flex-shrink:0;}
//     #stack-header{display:flex;align-items:center;justify-content:space-between;padding:14px 20px 8px;flex-shrink:0;}
//     #stack-label{font-size:11px;font-weight:700;letter-spacing:0.6px;color:#94a3b8;text-transform:uppercase;font-family:-apple-system,system-ui,sans-serif;}
//     #stack-count-pill{font-size:12px;font-weight:700;background:rgba(79,70,229,0.1);color:#4f46e5;border-radius:20px;padding:3px 10px;font-family:-apple-system,system-ui,sans-serif;}
//     #stack-close{width:30px;height:30px;border-radius:50%;background:rgba(0,0,0,0.07);border:none;outline:none;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#64748b;font-size:14px;font-weight:600;flex-shrink:0;}
//     #stack-list{overflow-y:auto;flex:1;padding:4px 14px 20px;-webkit-overflow-scrolling:touch;}
//     .si{display:flex;align-items:center;gap:14px;padding:11px 10px;border-radius:16px;cursor:pointer;touch-action:manipulation;transition:background 0.14s ease;position:relative;}
//     .si:active{background:rgba(0,0,0,0.05);}
//     .si+.si::before{content:"";position:absolute;top:0;left:68px;right:10px;height:1px;background:rgba(0,0,0,0.06);}
//     .si-icon{width:50px;height:50px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0;background:rgba(0,0,0,0.04);}
//     .si-icon.free{background:rgba(22,163,74,0.10);}.si-icon.paid{background:rgba(234,88,12,0.10);}.si-icon.service{background:rgba(124,58,237,0.10);}.si-icon.mine{background:rgba(99,102,241,0.12);}
//     .si-body{flex:1;min-width:0;}
//     .si-title{font-size:15px;font-weight:600;color:#0f172a;font-family:-apple-system,system-ui,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:-0.2px;}
//     .si-sub{font-size:12px;color:#94a3b8;margin-top:2px;font-family:-apple-system,system-ui,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
//     .si-pill{font-size:11px;font-weight:700;padding:4px 10px;border-radius:20px;flex-shrink:0;letter-spacing:0.1px;font-family:-apple-system,system-ui,sans-serif;}
//     .si-pill.free{background:rgba(22,163,74,0.12);color:#16a34a;}.si-pill.paid{background:rgba(234,88,12,0.12);color:#ea580c;}.si-pill.service{background:rgba(124,58,237,0.12);color:#7c3aed;}.si-pill.mine{background:rgba(99,102,241,0.12);color:#4f46e5;}
//     .si-arrow{color:#cbd5e1;font-size:16px;flex-shrink:0;margin-left:2px;}
//     /* toast */
//     #toast{
//       position:absolute;bottom:16px;left:50%;transform:translateX(-50%);
//       background:rgba(15,23,42,0.84);color:#f1f5f9;
//       border-radius:20px;padding:7px 18px;
//       font:12px/1.5 -apple-system,system-ui,sans-serif;
//       white-space:nowrap;z-index:9998;pointer-events:none;
//       backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.08);
//       opacity:0;transition:opacity 0.25s ease;letter-spacing:0.1px;
//     }
//     #toast.show{opacity:1;}
//   </style>
// </head>
// <body>
//   <div id="map"></div>
//   <canvas id="pin-canvas"></canvas>
//   <div id="stack-popup">
//     <div id="stack-handle"></div>
//     <div id="stack-header">
//       <div style="display:flex;align-items:center;gap:8px;">
//         <span id="stack-label">Events here</span>
//         <span id="stack-count-pill">2</span>
//       </div>
//       <button id="stack-close">✕</button>
//     </div>
//     <div id="stack-list"></div>
//   </div>
//   <div id="toast"></div>

//   <script>
//   (function(){
//     var DATA       = ` + eventsJson + `;
//     var CENTER     = {lat:` + center.lat + `,lng:` + center.lng + `};
//     var ZOOM       = ` + zoom + `;
//     var MY_ID      = ` + safeUserId + `;

//     // ── Config ──────────────────────────────────────────
//     var CLUSTER_R  = 44;   // px radius for clustering
//     var PIN_R      = 22;   // pin circle radius px
//     var DPR        = window.devicePixelRatio || 1;  // Retina support

//     var map, canvas, ctx, proj;
//     var toastTimer, stackOpen = false;
//     var clusters = [];   // computed each render
//     var selectedId = null;
//     var layoutRaf = 0;

//     function post(type,extra){
//       try{window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(
//         JSON.stringify(Object.assign({type:type},extra||{})));}catch(e){}
//     }
//     function showToast(t){
//       var el=document.getElementById('toast');if(!el)return;
//       el.textContent=t;el.classList.add('show');
//       clearTimeout(toastTimer);
//       toastTimer=setTimeout(function(){el.classList.remove('show');},2200);
//     }

//     function isOwn(ev){ return MY_ID && String(ev.creatorClerkId||'')===MY_ID; }

//     function pinColor(ev){
//       var k=ev.kind||'';
//       if(k.indexOf('free')>=0) return '#22c55e';
//       if(k.indexOf('paid')>=0) return '#f59e0b';
//       if(k==='service')        return '#8b5cf6';
//       if(isOwn(ev)) return '#4f46e5';
//       return '#6c63ff';
//     }

//     function kindLabel(ev){
//       if(isOwn(ev)) return 'My event';
//       var k=ev.kind||'';
//       if(k.indexOf('free')>=0) return 'Free';
//       if(k.indexOf('paid')>=0) return 'Paid';
//       if(k==='service')        return 'Service';
//       return '';
//     }
//     function kindPillClass(ev){
//       if(isOwn(ev)) return 'mine';
//       var k=ev.kind||'';
//       if(k.indexOf('free')>=0) return 'free';
//       if(k.indexOf('paid')>=0) return 'paid';
//       if(k==='service')        return 'service';
//       return '';
//     }

//     // ── Stack popup ──────────────────────────────────────
//     document.getElementById('stack-close').addEventListener('click',closeStack);

//     function openStack(items){
//       if(stackOpen)return;
//       stackOpen=true;
//       post('stackOpen',{});
//       document.getElementById('stack-count-pill').textContent=items.length;
//       var list=document.getElementById('stack-list');
//       list.innerHTML='';
//       for(var i=0;i<items.length;i++){
//         (function(ev){
//           var pc=kindPillClass(ev);
//           var ic=isOwn(ev)?'mine':pc;
//           var kl=kindLabel(ev);
//           var sub=ev.location&&ev.location.formattedAddress||ev.location&&ev.location.address||ev.location&&ev.location.city||ev.description||'Tap to view details';
//           if(sub&&sub.length>40)sub=sub.slice(0,40)+'…';
//           var el=document.createElement('div');
//           el.className='si';
//           el.innerHTML=
//             '<div class="si-icon '+ic+'">'+(ev.emoji||'📍')+'</div>'+
//             '<div class="si-body">'+
//               '<div class="si-title">'+(ev.title||'Event')+'</div>'+
//               '<div class="si-sub">'+sub+'</div>'+
//             '</div>'+
//             (kl?'<span class="si-pill '+pc+'">'+kl+'</span>':'')+
//             '<span class="si-arrow">›</span>';
//           el.addEventListener('click',function(e){
//             e.stopPropagation();
//             closeStack();
//             post('pinClick',{event:ev});
//             showToast((ev.emoji||'📍')+' '+(ev.title||''));
//           });
//           list.appendChild(el);
//         })(items[i]);
//       }
//       document.getElementById('stack-popup').classList.add('open');
//     }

//     function closeStack(){
//       if(!stackOpen)return;
//       stackOpen=false;
//       document.getElementById('stack-popup').classList.remove('open');
//       post('stackClose',{});
//     }

//     // ── Canvas rendering (DPR-aware) ──────────────────────
//     function resizeCanvas(){
//       if(!canvas)return;
//       DPR = window.devicePixelRatio || 1;
//       var w=window.innerWidth, h=window.innerHeight;
//       // Set canvas physical pixels
//       canvas.width  = Math.round(w * DPR);
//       canvas.height = Math.round(h * DPR);
//       // CSS size stays the same
//       canvas.style.width  = w + 'px';
//       canvas.style.height = h + 'px';
//       // Scale context so we draw at logical coords
//       ctx && ctx.scale(DPR, DPR);
//     }

//     // ── Compute pixel positions & cluster ─────────────────
//     function computeClusters(){
//       if(!proj||!DATA.length)return;

//       // 1. Project all events to screen pixels (only do valid coords)
//       var pts=[];
//       for(var i=0;i<DATA.length;i++){
//         var ev=DATA[i];
//         var lat=Number(ev.lat||ev.location&&ev.location.lat);
//         var lng=Number(ev.lng||ev.location&&ev.location.lng);
//         if(!isFinite(lat)||!isFinite(lng))continue;
//         var latlng=new google.maps.LatLng(lat,lng);
//         var pt=proj.fromLatLngToContainerPixel(latlng);
//         if(!pt)continue;
//         // Skip offscreen with large buffer (400px) — still cluster them
//         if(pt.x<-400||pt.x>canvas.width+400||pt.y<-400||pt.y>canvas.height+400)continue;
//         pts.push({x:pt.x,y:pt.y,ev:ev});
//       }

//       // 2. Greedy spatial clustering O(n) with spatial grid
//       var cellSize=CLUSTER_R*2;
//       var grid={};
//       var grouped=[];

//       for(var p=0;p<pts.length;p++){
//         var px=pts[p].x,py=pts[p].y;
//         var gx=Math.floor(px/cellSize),gy=Math.floor(py/cellSize);
//         var found=false;
//         // Check own cell + 8 neighbors
//         for(var dx=-1;dx<=1&&!found;dx++){
//           for(var dy=-1;dy<=1&&!found;dy++){
//             var key=(gx+dx)+','+(gy+dy);
//             if(grid[key]!==undefined){
//               var g=grouped[grid[key]];
//               var ddx=px-g.cx,ddy=py-g.cy;
//               if(ddx*ddx+ddy*ddy<=CLUSTER_R*CLUSTER_R){
//                 g.items.push(pts[p]);
//                 g.cx=(g.cx*(g.items.length-1)+px)/g.items.length;
//                 g.cy=(g.cy*(g.items.length-1)+py)/g.items.length;
//                 found=true;
//               }
//             }
//           }
//         }
//         if(!found){
//           grid[gx+','+gy]=grouped.length;
//           grouped.push({cx:px,cy:py,items:[pts[p]]});
//         }
//       }

//       clusters=grouped;
//     }

//     // ── Draw all pins/clusters on canvas ────────────────────
//     function drawPins(){
//       if(!ctx||!canvas)return;
//       // clearRect in logical pixels (DPR handled by transform)
//       ctx.save();
//       ctx.setTransform(1,0,0,1,0,0);
//       ctx.clearRect(0,0,canvas.width,canvas.height);
//       ctx.restore();

//       for(var i=0;i<clusters.length;i++){
//         var g=clusters[i];
//         var x=g.cx, y=g.cy;

//         if(g.items.length===1){
//           // ── Single Pin ─────────────────────────────────────
//           var ev=g.items[0].ev;
//           var color=pinColor(ev);
//           var isSel=ev._id&&ev._id===selectedId;
//           var r=isSel?PIN_R+5:PIN_R;

//           ctx.save();

//           // Drop shadow
//           ctx.shadowColor=color;
//           ctx.shadowBlur=isSel?18:10;
//           ctx.shadowOffsetY=2;

//           // White fill circle
//           ctx.beginPath();
//           ctx.arc(x,y,r,0,Math.PI*2);
//           ctx.fillStyle='#ffffff';
//           ctx.fill();

//           ctx.shadowBlur=0;ctx.shadowOffsetY=0;

//           // Colored border — thick, like the India pins
//           ctx.strokeStyle=color;
//           ctx.lineWidth=isSel?3.5:3;
//           ctx.stroke();

//           // Emoji (large, crisp)
//           ctx.font=(r*1.15)+'px Apple Color Emoji,Segoe UI Emoji,serif';
//           ctx.textAlign='center';
//           ctx.textBaseline='middle';
//           ctx.fillStyle='rgba(0,0,0,0)';
//           ctx.fillText(ev.emoji||'📍',x,y+1);
//           // Draw emoji on top of clip
//           ctx.fillStyle='black';
//           ctx.globalCompositeOperation='source-over';
//           ctx.fillText(ev.emoji||'📍',x,y+1);

//           // Pointer tail
//           ctx.beginPath();
//           var tailW=6,tailH=9;
//           ctx.moveTo(x-tailW, y+r-3);
//           ctx.lineTo(x+tailW, y+r-3);
//           ctx.lineTo(x, y+r+tailH);
//           ctx.closePath();
//           ctx.fillStyle='#ffffff';
//           ctx.fill();
//           ctx.strokeStyle=color;
//           ctx.lineWidth=2;
//           ctx.stroke();

//           // Selected: extra glow ring
//           if(isSel){
//             ctx.beginPath();
//             ctx.arc(x,y,r+5,0,Math.PI*2);
//             ctx.strokeStyle=color.replace(')',',0.3)').replace('rgb','rgba')||'rgba(108,99,255,0.3)';
//             ctx.lineWidth=3;
//             ctx.stroke();
//           }

//           ctx.restore();

//         } else {
//           // ── Cluster Bubble ─────────────────────────────────
//           var n=g.items.length;
//           var cr=n>=200?32:n>=100?28:n>=30?24:n>=10?21:18;

//           ctx.save();

//           // Outer halo
//           ctx.beginPath();
//           ctx.arc(x,y,cr+9,0,Math.PI*2);
//           ctx.fillStyle='rgba(79,70,229,0.12)';
//           ctx.fill();

//           // Drop shadow
//           ctx.shadowColor='rgba(79,70,229,0.40)';
//           ctx.shadowBlur=14;
//           ctx.shadowOffsetY=4;

//           // Gradient fill
//           var grad=ctx.createRadialGradient(x,y-cr*0.3,cr*0.05,x,y,cr);
//           grad.addColorStop(0,'#818cf8');
//           grad.addColorStop(1,'#4f46e5');
//           ctx.beginPath();
//           ctx.arc(x,y,cr,0,Math.PI*2);
//           ctx.fillStyle=grad;
//           ctx.fill();

//           ctx.shadowBlur=0;ctx.shadowOffsetY=0;

//           // White border
//           ctx.strokeStyle='rgba(255,255,255,0.95)';
//           ctx.lineWidth=3;
//           ctx.stroke();

//           // Count label
//           ctx.font='bold '+(cr*0.72)+'px -apple-system,system-ui,sans-serif';
//           ctx.textAlign='center';
//           ctx.textBaseline='middle';
//           ctx.fillStyle='#ffffff';
//           ctx.fillText(n>999?'999+':String(n),x,y);

//           ctx.restore();
//         }
//       }
//     }

//     function scheduleLayout(){
//       if(layoutRaf)cancelAnimationFrame(layoutRaf);
//       layoutRaf=requestAnimationFrame(function(){
//         layoutRaf=0;
//         if(map&&proj){
//           computeClusters();
//           drawPins();
//         }
//       });
//     }

//     // ── Hit testing: find clicked cluster/pin ──────────────
//     function hitTest(touchX,touchY){
//       var best=null,bestDist=Infinity;
//       var HIT_R=CLUSTER_R;
//       for(var i=0;i<clusters.length;i++){
//         var g=clusters[i];
//         var dx=touchX-g.cx, dy=touchY-g.cy;
//         var dist=Math.sqrt(dx*dx+dy*dy);
//         var threshold=g.items.length>1?(g.items.length>=100?28:g.items.length>=20?24:21):PIN_R+8;
//         if(dist<=threshold+HIT_R*0.4&&dist<bestDist){
//           best=g;bestDist=dist;
//         }
//       }
//       return best;
//     }

//     // ── Touch / click handling ──────────────────────────────
//     var touchStart={x:0,y:0,t:0};
//     document.addEventListener('touchstart',function(e){
//       if(stackOpen)return;
//       var t=e.touches[0];
//       touchStart={x:t.clientX,y:t.clientY,t:Date.now()};
//     },{passive:true});
//     document.addEventListener('touchend',function(e){
//       if(stackOpen)return;
//       var t=e.changedTouches[0];
//       var dx=t.clientX-touchStart.x, dy=t.clientY-touchStart.y;
//       var moved=Math.sqrt(dx*dx+dy*dy);
//       var dt=Date.now()-touchStart.t;
//       if(moved>10||dt>500)return; // was a pan/long-press
//       handleTap(t.clientX, t.clientY);
//     },{passive:true});
//     document.addEventListener('click',function(e){
//       if(stackOpen){closeStack();return;}
//       // Only handle clicks not handled by touch
//       handleTap(e.clientX,e.clientY);
//     });

//     function handleTap(x,y){
//       var g=hitTest(x,y);
//       if(!g){selectedId=null;scheduleLayout();return;}
//       if(g.items.length===1){
//         var ev=g.items[0].ev;
//         selectedId=ev._id||null;
//         scheduleLayout();
//         post('pinClick',{event:ev});
//         showToast((ev.emoji||'📍')+' '+(ev.title||''));
//       } else {
//         // Check if all same position → stack popup
//         var allSame=true;
//         var first=g.items[0];
//         for(var i=1;i<g.items.length;i++){
//           if(Math.abs(g.items[i].ev.lat-first.ev.lat)>0.0001||
//              Math.abs(g.items[i].ev.lng-first.ev.lng)>0.0001){allSame=false;break;}
//         }
//         if(allSame){
//           openStack(g.items.map(function(it){return it.ev;}));
//         } else {
//           var lat=0,lng=0,n=g.items.length;
//           for(var j=0;j<n;j++){lat+=g.items[j].ev.lat;lng+=g.items[j].ev.lng;}
//           map.panTo({lat:lat/n,lng:lng/n});
//           map.setZoom(Math.min((map.getZoom()||12)+3,18));
//         }
//       }
//     }

//     // ── initMap ──────────────────────────────────────────────
//     window.gm_authFailure = function() {
//       post('log', { msg: 'Google Maps auth failed — check Maps JS API + billing.' });
//     };

//     function initMap(){
//       if(!window.google||!google.maps){post('log',{msg:'Google object not found'});return;}
//       canvas=document.getElementById('pin-canvas');
//       ctx=canvas.getContext('2d',{alpha:true});
//       resizeCanvas();
//       window.addEventListener('resize',function(){resizeCanvas();scheduleLayout();});

//       map=new google.maps.Map(document.getElementById('map'),{
//         center:CENTER,zoom:ZOOM,
//         disableDefaultUI:true,clickableIcons:false,gestureHandling:'greedy'
//       });

//       // Use MapCanvasProjection via a dummy OverlayView
//       var dummy=new google.maps.OverlayView();
//       dummy.onAdd=function(){
//         proj=this.getProjection();
//         scheduleLayout();
//       };
//       dummy.draw=function(){
//         if(!proj)proj=this.getProjection();
//         scheduleLayout();
//       };
//       dummy.onRemove=function(){};
//       dummy.setMap(map);

//       google.maps.event.addListener(map,'idle',scheduleLayout);
//       google.maps.event.addListener(map,'zoom_changed',function(){closeStack();scheduleLayout();});
//       google.maps.event.addListener(map,'click',function(){closeStack();selectedId=null;scheduleLayout();});

//       showToast('✦ '+DATA.length+' events worldwide');
//     }
//     window.initMap=initMap;

//     /* ══ goToLocation ══ */
//     function handleLocationMsg(data){
//       try{
//         var msg=JSON.parse(data);
//         if(!msg||msg.type!=='goToLocation')return;
//         var lat=Number(msg.lat),lng=Number(msg.lng);
//         if(!isFinite(lat)||!isFinite(lng))return;
//         if(!map){setTimeout(function(){handleLocationMsg(data);},500);return;}
//         map.panTo({lat:lat,lng:lng});
//         map.setZoom(Math.max(map.getZoom()||0,15));
//         showToast('📍 Current location');
//       }catch(ex){}
//     }
//     window.addEventListener('message',function(e){handleLocationMsg(e.data);});
//     document.addEventListener('message',function(e){handleLocationMsg(e.data);});
//     window.addEventListener('error',function(e){post('log',{msg:'JS error: '+(e.message||'?')});});
//   })();
//   </script>
//   <script async defer src="https://maps.googleapis.com/maps/api/js?key=` + googleKey + `&v=weekly&callback=initMap"></script>
// </body>
// </html>`;
//   return html;
// }








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
    #pin-canvas{position:absolute;top:0;left:0;pointer-events:none;z-index:1;}
    #live-pins-container { position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:2; }
    .live-ring {
      position: absolute;
      border: 3px solid #ef4444;
      border-radius: 50%;
      pointer-events: none;
      animation: pulse-ring 1.5s infinite ease-out;
    }
    @keyframes pulse-ring {
      0% { transform: scale(0.8); opacity: 1; }
      100% { transform: scale(1.6); opacity: 0; }
    }

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
  <canvas id="pin-canvas"></canvas>
  <div id="live-pins-container"></div>
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

    // ── Config ──────────────────────────────────────────
    var PIN_R      = 22;   // pin circle radius px
    var DPR        = window.devicePixelRatio || 1;  // Retina support

    // Zoom-adaptive cluster radius — zoom out = bigger radius (aggressive merge)
    // zoom in = smaller radius (show individual pins)
    function getClusterR(zoom){
      // zoom: 1 (world) → 20 (building level)
      if(zoom<=4)  return 90;
      if(zoom<=6)  return 72;
      if(zoom<=8)  return 56;
      if(zoom<=10) return 44;
      if(zoom<=12) return 32;
      if(zoom<=14) return 20;
      return 8; // zoom 15+ → almost no clustering, single pins
    }

    var map, canvas, ctx, proj;
    var toastTimer, stackOpen = false;
    var clusters = [];   // computed each render
    var selectedId = null;
    var layoutRaf = 0;

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

    function eventStartMs(ev) {
      if (ev.startsAt) { var t = new Date(ev.startsAt).getTime(); if (isFinite(t)) return t; }
      var date = (ev.date || "").trim(), time = (ev.time || "").trim();
      if (date && time) { var t = new Date(date + ' ' + time).getTime(); if (isFinite(t)) return t; }
      if (date) { var t = new Date(date).getTime(); if (isFinite(t)) return t; }
      return Infinity;
    }
    function isEventLive(ev) {
      var status = String(ev.status || "active").toLowerCase();
      if (status === "ended" || status === "completed" || status === "past") return false;
      if (status === "live" || status === "ongoing") return true;
      var start = eventStartMs(ev);
      if (!isFinite(start) || start === Infinity) return false;
      var now = Date.now();
      var endTs = ev.endsAt ? new Date(ev.endsAt).getTime() : start + (4 * 3600000);
      return now >= start && now <= endTs;
    }

    function isOwn(ev){ return MY_ID && String(ev.creatorClerkId||'')===MY_ID; }

    function pinColor(ev){
      var k=ev.kind||'';
      if(k.indexOf('free')>=0) return '#22c55e';
      if(k.indexOf('paid')>=0) return '#f59e0b';
      if(k==='service')        return '#8b5cf6';
      if(isOwn(ev)) return '#4f46e5';
      return '#6c63ff';
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

    // ── Stack popup ──────────────────────────────────────
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
          var sub=ev.location&&ev.location.formattedAddress||ev.location&&ev.location.address||ev.location&&ev.location.city||ev.description||'Tap to view details';
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
        })(items[i]);
      }
      document.getElementById('stack-popup').classList.add('open');
    }

    function closeStack(){
      if(!stackOpen)return;
      stackOpen=false;
      document.getElementById('stack-popup').classList.remove('open');
      post('stackClose',{});
    }

    // ── Canvas rendering (DPR-aware) ──────────────────────
    function resizeCanvas(){
      if(!canvas)return;
      DPR = window.devicePixelRatio || 1;
      var w=window.innerWidth, h=window.innerHeight;
      // Set canvas physical pixels
      canvas.width  = Math.round(w * DPR);
      canvas.height = Math.round(h * DPR);
      // CSS size stays the same
      canvas.style.width  = w + 'px';
      canvas.style.height = h + 'px';
      // Scale context so we draw at logical coords
      ctx && ctx.scale(DPR, DPR);
    }

    // ── Compute pixel positions & cluster ─────────────────
    function computeClusters(){
      if(!proj||!DATA.length)return;

      // 1. Project all events to screen pixels (only do valid coords)
      var pts=[];
      for(var i=0;i<DATA.length;i++){
        var ev=DATA[i];
        var lat=Number(ev.lat||ev.location&&ev.location.lat);
        var lng=Number(ev.lng||ev.location&&ev.location.lng);
        if(!isFinite(lat)||!isFinite(lng))continue;
        var latlng=new google.maps.LatLng(lat,lng);
        var pt=proj.fromLatLngToContainerPixel(latlng);
        if(!pt)continue;
        // Skip offscreen with large buffer (400px) — still cluster them
        if(pt.x<-400||pt.x>canvas.width+400||pt.y<-400||pt.y>canvas.height+400)continue;
        pts.push({x:pt.x,y:pt.y,ev:ev});
      }

      // 2. Greedy spatial clustering — fixed: grid stores arrays, closest-match, center-update
      var CLUSTER_R=getClusterR(map.getZoom()||10);
      var cellSize=CLUSTER_R; // smaller cell = more neighbor checks = fewer missed merges
      var grouped=[];
      var grid={}; // key -> array of cluster indices (multiple per cell allowed)

      for(var p=0;p<pts.length;p++){
        var px=pts[p].x,py=pts[p].y;
        var gx=Math.floor(px/cellSize),gy=Math.floor(py/cellSize);
        var bestIdx=-1,bestDist=Infinity;

        // Check 5x5 neighborhood to handle center-drift after merges
        for(var dx=-2;dx<=2;dx++){
          for(var dy=-2;dy<=2;dy++){
            var key=(gx+dx)+','+(gy+dy);
            var cell=grid[key];
            if(!cell)continue;
            for(var ci=0;ci<cell.length;ci++){
              var cg=grouped[cell[ci]];
              var ddx=px-cg.cx,ddy=py-cg.cy;
              var dist2=ddx*ddx+ddy*ddy;
              if(dist2<=CLUSTER_R*CLUSTER_R&&dist2<bestDist){
                bestDist=dist2;
                bestIdx=cell[ci];
              }
            }
          }
        }

        if(bestIdx>=0){
          var mg=grouped[bestIdx];
          var n=mg.items.length;
          mg.items.push(pts[p]);
          mg.cx=(mg.cx*n+px)/(n+1);
          mg.cy=(mg.cy*n+py)/(n+1);
          // Re-register cluster at its new center cell
          var ngx=Math.floor(mg.cx/cellSize),ngy=Math.floor(mg.cy/cellSize);
          var nkey=ngx+','+ngy;
          if(!grid[nkey])grid[nkey]=[];
          if(grid[nkey].indexOf(bestIdx)<0)grid[nkey].push(bestIdx);
        } else {
          var newIdx=grouped.length;
          grouped.push({cx:px,cy:py,items:[pts[p]]});
          var ikey=gx+','+gy;
          if(!grid[ikey])grid[ikey]=[];
          grid[ikey].push(newIdx);
        }
      }

      clusters=grouped;
    }

    // ── Draw all pins/clusters on canvas ────────────────────
    function drawPins(){
      if(!ctx||!canvas)return;
      // clearRect in logical pixels (DPR handled by transform)
      ctx.save();
      ctx.setTransform(1,0,0,1,0,0);
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.restore();

      var liveContainer = document.getElementById('live-pins-container');
      if(liveContainer) liveContainer.innerHTML = '';

      for(var i=0;i<clusters.length;i++){
        var g=clusters[i];
        var x=g.cx, y=g.cy;

        if(g.items.length===1){
          // ── Single Pin ─────────────────────────────────────
          var ev=g.items[0].ev;
          var isLive = isEventLive(ev);
          var color = isLive ? '#ef4444' : pinColor(ev);
          var isSel=ev._id&&ev._id===selectedId;
          var r=isSel?PIN_R+5:PIN_R;

          if (isLive && liveContainer) {
            var ring = document.createElement('div');
            ring.className = 'live-ring';
            ring.style.width = (r*2) + 'px';
            ring.style.height = (r*2) + 'px';
            ring.style.left = (x - r) + 'px';
            ring.style.top = (y - r) + 'px';
            liveContainer.appendChild(ring);
          }

          ctx.save();

          // Drop shadow
          ctx.shadowColor=color;
          ctx.shadowBlur=isSel?18:10;
          ctx.shadowOffsetY=2;

          // White fill circle
          ctx.beginPath();
          ctx.arc(x,y,r,0,Math.PI*2);
          ctx.fillStyle='#ffffff';
          ctx.fill();

          ctx.shadowBlur=0;ctx.shadowOffsetY=0;

          // Colored border — thick, like the India pins
          ctx.strokeStyle=color;
          ctx.lineWidth=isSel?3.5:3;
          ctx.stroke();

          // Emoji (large, crisp)
          ctx.font=(r*1.15)+'px Apple Color Emoji,Segoe UI Emoji,serif';
          ctx.textAlign='center';
          ctx.textBaseline='middle';
          ctx.fillStyle='rgba(0,0,0,0)';
          ctx.fillText(ev.emoji||'📍',x,y+1);
          // Draw emoji on top of clip
          ctx.fillStyle='black';
          ctx.globalCompositeOperation='source-over';
          ctx.fillText(ev.emoji||'📍',x,y+1);

          // Pointer tail
          ctx.beginPath();
          var tailW=6,tailH=9;
          ctx.moveTo(x-tailW, y+r-3);
          ctx.lineTo(x+tailW, y+r-3);
          ctx.lineTo(x, y+r+tailH);
          ctx.closePath();
          ctx.fillStyle='#ffffff';
          ctx.fill();
          ctx.strokeStyle=color;
          ctx.lineWidth=2;
          ctx.stroke();

          // Selected: extra glow ring
          if(isSel){
            ctx.beginPath();
            ctx.arc(x,y,r+5,0,Math.PI*2);
            ctx.strokeStyle=color.replace(')',',0.3)').replace('rgb','rgba')||'rgba(108,99,255,0.3)';
            ctx.lineWidth=3;
            ctx.stroke();
          }

          ctx.restore();

        } else {
          // ── Cluster Bubble ─────────────────────────────────
          var n=g.items.length;
          var cr=n>=200?32:n>=100?28:n>=30?24:n>=10?21:18;

          ctx.save();

          // Outer halo
          ctx.beginPath();
          ctx.arc(x,y,cr+9,0,Math.PI*2);
          ctx.fillStyle='rgba(79,70,229,0.12)';
          ctx.fill();

          // Drop shadow
          ctx.shadowColor='rgba(79,70,229,0.40)';
          ctx.shadowBlur=14;
          ctx.shadowOffsetY=4;

          // Gradient fill
          var grad=ctx.createRadialGradient(x,y-cr*0.3,cr*0.05,x,y,cr);
          grad.addColorStop(0,'#818cf8');
          grad.addColorStop(1,'#4f46e5');
          ctx.beginPath();
          ctx.arc(x,y,cr,0,Math.PI*2);
          ctx.fillStyle=grad;
          ctx.fill();

          ctx.shadowBlur=0;ctx.shadowOffsetY=0;

          // White border
          ctx.strokeStyle='rgba(255,255,255,0.95)';
          ctx.lineWidth=3;
          ctx.stroke();

          // Count label
          ctx.font='bold '+(cr*0.72)+'px -apple-system,system-ui,sans-serif';
          ctx.textAlign='center';
          ctx.textBaseline='middle';
          ctx.fillStyle='#ffffff';
          ctx.fillText(n>999?'999+':String(n),x,y);

          ctx.restore();
        }
      }
    }

    function scheduleLayout(){
      if(layoutRaf)cancelAnimationFrame(layoutRaf);
      layoutRaf=requestAnimationFrame(function(){
        layoutRaf=0;
        if(map&&proj){
          computeClusters();
          drawPins();
        }
      });
    }

    // ── Hit testing: find clicked cluster/pin ──────────────
    function hitTest(touchX,touchY){
      var best=null,bestDist=Infinity;
      var CLUSTER_R=getClusterR(map?map.getZoom()||10:10);
      var HIT_R=CLUSTER_R;
      for(var i=0;i<clusters.length;i++){
        var g=clusters[i];
        var dx=touchX-g.cx, dy=touchY-g.cy;
        var dist=Math.sqrt(dx*dx+dy*dy);
        var threshold=g.items.length>1?(g.items.length>=100?28:g.items.length>=20?24:21):PIN_R+8;
        if(dist<=threshold+HIT_R*0.4&&dist<bestDist){
          best=g;bestDist=dist;
        }
      }
      return best;
    }

    // ── Touch / click handling ──────────────────────────────
    var touchStart={x:0,y:0,t:0};
    document.addEventListener('touchstart',function(e){
      if(stackOpen)return;
      var t=e.touches[0];
      touchStart={x:t.clientX,y:t.clientY,t:Date.now()};
    },{passive:true});
    document.addEventListener('touchend',function(e){
      if(stackOpen)return;
      var t=e.changedTouches[0];
      var dx=t.clientX-touchStart.x, dy=t.clientY-touchStart.y;
      var moved=Math.sqrt(dx*dx+dy*dy);
      var dt=Date.now()-touchStart.t;
      if(moved>10||dt>500)return; // was a pan/long-press
      handleTap(t.clientX, t.clientY);
    },{passive:true});
    document.addEventListener('click',function(e){
      if(stackOpen){closeStack();return;}
      // Only handle clicks not handled by touch
      handleTap(e.clientX,e.clientY);
    });

    function handleTap(x,y){
      var g=hitTest(x,y);
      if(!g){selectedId=null;scheduleLayout();return;}
      if(g.items.length===1){
        var ev=g.items[0].ev;
        selectedId=ev._id||null;
        scheduleLayout();
        post('pinClick',{event:ev});
        showToast((ev.emoji||'📍')+' '+(ev.title||''));
      } else {
        // Check if all same position → stack popup
        var allSame=true;
        var first=g.items[0];
        for(var i=1;i<g.items.length;i++){
          if(Math.abs(g.items[i].ev.lat-first.ev.lat)>0.0001||
             Math.abs(g.items[i].ev.lng-first.ev.lng)>0.0001){allSame=false;break;}
        }
        if(allSame){
          openStack(g.items.map(function(it){return it.ev;}));
        } else {
          var bounds = new google.maps.LatLngBounds();
          var validCount = 0;
          for(var j=0;j<g.items.length;j++){
            var ev=g.items[j].ev;
            var lat=Number(ev.lat||ev.location&&ev.location.lat);
            var lng=Number(ev.lng||ev.location&&ev.location.lng);
            if(isFinite(lat)&&isFinite(lng)){
              bounds.extend(new google.maps.LatLng(lat,lng));
              validCount++;
            }
          }
          if(validCount > 0){
            map.fitBounds(bounds, 80); // 80px luxury padding to prevent edge cutoffs
          } else {
            var lat=0,lng=0,n=g.items.length;
            for(var j=0;j<n;j++){lat+=g.items[j].ev.lat;lng+=g.items[j].ev.lng;}
            map.panTo({lat:lat/n,lng:lng/n});
            map.setZoom(Math.min((map.getZoom()||12)+3,18));
          }
        }
      }
    }

    // ── initMap ──────────────────────────────────────────────
    window.gm_authFailure = function() {
      post('log', { msg: 'Google Maps auth failed — check Maps JS API + billing.' });
    };

    function initMap(){
      if(!window.google||!google.maps){post('log',{msg:'Google object not found'});return;}
      canvas=document.getElementById('pin-canvas');
      ctx=canvas.getContext('2d',{alpha:true});
      resizeCanvas();
      window.addEventListener('resize',function(){resizeCanvas();scheduleLayout();});

      map=new google.maps.Map(document.getElementById('map'),{
        center:CENTER,zoom:ZOOM,
        disableDefaultUI:true,clickableIcons:false,gestureHandling:'greedy'
      });

      // Use MapCanvasProjection via a dummy OverlayView
      var dummy=new google.maps.OverlayView();
      dummy.onAdd=function(){
        proj=this.getProjection();
        scheduleLayout();
      };
      dummy.draw=function(){
        if(!proj)proj=this.getProjection();
        scheduleLayout();
      };
      dummy.onRemove=function(){};
      dummy.setMap(map);

      google.maps.event.addListener(map,'idle',scheduleLayout);
      google.maps.event.addListener(map,'zoom_changed',function(){closeStack();scheduleLayout();});
      google.maps.event.addListener(map,'click',function(){closeStack();selectedId=null;scheduleLayout();});

      showToast('✦ '+DATA.length+' events worldwide');
    }
    window.initMap=initMap;

    /* ══ message handler ══ */
    function handleMsg(data){
      try{
        var msg=JSON.parse(data);
        if(!msg)return;
        if(msg.type==='updateEvents'){
          DATA=msg.events||[];
          scheduleLayout();
          return;
        }
        if(msg.type==='goToLocation'){
          var lat=Number(msg.lat),lng=Number(msg.lng);
          if(!isFinite(lat)||!isFinite(lng))return;
          if(!map){setTimeout(function(){handleMsg(data);},500);return;}
          map.panTo({lat:lat,lng:lng});
          map.setZoom(Math.max(map.getZoom()||0,15));
          showToast('📍 Current location');
        }
      }catch(ex){}
    }
    window.addEventListener('message',function(e){handleMsg(e.data);});
    document.addEventListener('message',function(e){handleMsg(e.data);});
    window.addEventListener('error',function(e){post('log',{msg:'JS error: '+(e.message||'?')});});
  })();
  </script>
  <script async defer src="https://maps.googleapis.com/maps/api/js?key=` + googleKey + `&v=weekly&callback=initMap"></script>
</body>
</html>`;
  return html;
}