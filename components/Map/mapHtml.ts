// components/Map/mapHtml.ts
export function buildMapHtml(args: {
    googleKey: string;
    eventsJson: string; // already JSON.stringify(...)
    center: { lat: number; lng: number };
    zoom: number;
  }) {
    const { googleKey, eventsJson, center, zoom } = args;
  
    return `<!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="initial-scale=1,width=device-width,maximum-scale=1" />
    <style>
      html,body,#map{height:100%;margin:0;padding:0}
  
      .emoji-pin{
        position:absolute;
        width:42px;height:42px;border-radius:21px;
        display:flex;align-items:center;justify-content:center;
        font-size:22px;
        background:#fff;
        border:1px solid rgba(2,6,23,.10);
        box-shadow:0 10px 22px rgba(2,6,23,.20);
        transform:translate(-50%,-50%);
        user-select:none;-webkit-user-select:none;
        pointer-events:auto;
        will-change:left,top,transform;
        cursor:pointer;
        touch-action: manipulation;
      }
  
      .badge{
        position:absolute;
        left:10px; top:10px;
        background:rgba(0,0,0,.55);
        color:#fff;
        border-radius:10px;
        padding:8px 10px;
        font:12px/1.2 -apple-system, system-ui, Segoe UI, Roboto, sans-serif;
        max-width:92%;
        z-index:9999;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <div id="badge" class="badge">debug: initializing…</div>
  
    <script>
      const DATA = ${eventsJson};
      const INITIAL_CENTER = { lat: ${center.lat}, lng: ${center.lng} };
  
      let map;
      const overlays = [];
  
      function post(type, payload){
        try {
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type, ...payload }));
          }
        } catch(_) {}
      }
  
      function setBadge(text){
        const el = document.getElementById('badge');
        if (el) el.textContent = text;
      }
  
      let lastLogAt = 0;
      function log(msg, extra){
        const now = Date.now();
        if (now - lastLogAt > 300) {
          lastLogAt = now;
          post("log", { msg, extra: extra ?? null });
          setBadge(msg);
        }
      }
  
      let layoutPending = false;
      function scheduleLayout(){
        if (layoutPending) return;
        layoutPending = true;
        requestAnimationFrame(() => {
          layoutPending = false;
          layoutStacks();
        });
      }
  
      function initMap(){
        if (!window.google || !google.maps) {
          log("Google Maps not available (script load failed).");
          return;
        }
  
        map = new google.maps.Map(document.getElementById('map'), {
          center: INITIAL_CENTER,
          zoom: ${zoom},
          disableDefaultUI: true,
          clickableIcons: false,
          gestureHandling: 'greedy'
        });
  
        log("Map initialized", { center: INITIAL_CENTER, zoom: map.getZoom(), pins: DATA.length });
  
        google.maps.event.addListener(map, "idle", () => scheduleLayout());
        google.maps.event.addListener(map, "zoom_changed", () => scheduleLayout());
        google.maps.event.addListener(map, "bounds_changed", () => scheduleLayout());
  
        DATA.forEach((ev, idx) => {
          const overlay = makeEmojiOverlay(ev, idx);
          overlays.push(overlay);
          overlay.setMap(map);
        });
      }
  
      function makeEmojiOverlay(ev, idx){
        const overlay = new google.maps.OverlayView();
        overlay._px = null;
  
        overlay.onAdd = function() {
          const div = document.createElement('div');
          div.className = 'emoji-pin';
          div.textContent = ev.emoji || '📍';
          div.title = ev.title || '';
          div.dataset.id = ev._id || String(idx);
          this._div = div;
  
          let fired = false;
          const fire = (e) => {
            if (fired) return;
            fired = true;
            setTimeout(() => (fired = false), 400);
  
            if (e) {
              e.preventDefault?.();
              e.stopPropagation?.();
            }
  
            // IMPORTANT: we post the whole event object back (includes creatorClerkId etc.)
            post("pinClick", { event: ev });
            log("Pin pressed", { title: ev.title, lat: ev.lat, lng: ev.lng });
          };
  
          div.addEventListener('pointerdown', fire, { passive: false });
          div.addEventListener('touchstart', fire, { passive: false });
          div.addEventListener('click', fire);
  
          if (window.google?.maps?.OverlayView?.preventMapHitsAndGesturesFrom) {
            google.maps.OverlayView.preventMapHitsAndGesturesFrom(div);
          }
  
          this.getPanes().overlayMouseTarget.appendChild(div);
        };
  
        overlay.draw = function() {
          const projection = this.getProjection();
          if (!projection || !this._div) return;
  
          const pos = new google.maps.LatLng(ev.lat, ev.lng);
          const point = projection.fromLatLngToDivPixel(pos);
          if (!point) return;
  
          this._px = { x: point.x, y: point.y };
          this._div.style.left = Math.round(point.x) + 'px';
          this._div.style.top  = Math.round(point.y) + 'px';
  
          scheduleLayout();
        };
  
        overlay.onRemove = function() {
          if (this._div) {
            this._div.remove();
            this._div = null;
          }
        };
  
        return overlay;
      }
  
      function layoutStacks(){
        const alive = overlays.filter(o => o && o._div && o._px);
        if (alive.length === 0) return;
  
        const THRESH = 18;
        const RADIUS = 22;
  
        function dist2(a,b){
          const dx = a.x - b.x, dy = a.y - b.y;
          return dx*dx + dy*dy;
        }
  
        const groups = [];
  
        for (const o of alive) {
          let placed = false;
          for (const g of groups) {
            if (dist2(o._px, g.anchor) <= THRESH*THRESH) {
              g.items.push(o);
              const n = g.items.length;
              g.anchor = {
                x: (g.anchor.x*(n-1) + o._px.x) / n,
                y: (g.anchor.y*(n-1) + o._px.y) / n,
              };
              placed = true;
              break;
            }
          }
          if (!placed) groups.push({ anchor: { ...o._px }, items: [o] });
        }
  
        for (const g of groups) {
          const items = g.items;
  
          if (items.length === 1) {
            const o = items[0];
            o._div.style.transform = 'translate(-50%,-50%)';
            o._div.style.zIndex = '1';
            continue;
          }
  
          for (let i=0; i<items.length; i++){
            const o = items[i];
            const angle = (Math.PI * 2 * i) / items.length;
            const dx = Math.cos(angle) * RADIUS;
            const dy = Math.sin(angle) * RADIUS;
  
            o._div.style.transform =
              'translate(calc(-50% + ' + dx.toFixed(1) + 'px), calc(-50% + ' + dy.toFixed(1) + 'px))';
            o._div.style.zIndex = String(1000 + i);
          }
        }
      }
  
      window.initMap = initMap;
  
      window.addEventListener("error", function(e){
        post("log", { msg: "JS error: " + (e.message || "unknown"), extra: null });
        setBadge("JS error: " + (e.message || "unknown"));
      });
    </script>
  
    <script async defer
      src="https://maps.googleapis.com/maps/api/js?key=${googleKey}&v=weekly&callback=initMap">
    </script>
  </body>
  </html>`;
  }
  