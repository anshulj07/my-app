// components/MapView.tsx
import React, { useMemo } from "react";
import { View, StyleSheet, Platform, Text } from "react-native";
import { WebView } from "react-native-webview";
import Constants from "expo-constants";

type EventPin = { title: string; lat: number; lng: number; emoji: string };

export default function MapView({ events }: { events: EventPin[] }) {
  if (Platform.OS === "web") {
    return (
      <View style={[styles.container, styles.center]}>
        <Text>Map preview is unavailable on web in Expo Go.</Text>
      </View>
    );
  }

  const GOOGLE_KEY = (Constants.expoConfig?.extra as any)?.googleMapsKey as string | undefined;

  const safeEvents = (events || []).filter(
    (e) =>
      typeof e.lat === "number" &&
      Number.isFinite(e.lat) &&
      typeof e.lng === "number" &&
      Number.isFinite(e.lng)
  );

  if (!GOOGLE_KEY) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text>Missing Google Maps key (extra.googleMapsKey)</Text>
      </View>
    );
  }

  const html = useMemo(() => {
    const data = JSON.stringify(
      safeEvents.map((e, i) => ({
        ...e,
        _id: `${i}-${e.lat}-${e.lng}-${e.title ?? ""}`,
      }))
    );

    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="initial-scale=1,width=device-width,maximum-scale=1" />
  <style>
    html,body,#map{height:100%;margin:0;padding:0}

    .emoji-pin{
      position:absolute;               /* critical */
      width:42px;height:42px;border-radius:21px;
      display:flex;align-items:center;justify-content:center;
      font-size:22px;
      background:#fff;
      border:1px solid rgba(2,6,23,.10);
      box-shadow:0 10px 22px rgba(2,6,23,.20);
      transform:translate(-50%,-50%);  /* default centered */
      user-select:none;-webkit-user-select:none;
      pointer-events:none;
      will-change:left,top,transform;
    }

    .badge{
      position:absolute;
      left:10px; top:10px;
      background:rgba(0,0,0,.55);
      color:#fff;
      border-radius:10px;
      padding:8px 10px;
      font:12px/1.2 -apple-system, system-ui, Segoe UI, Roboto, sans-serif;
      max-width:90%;
      z-index:9999;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="badge" class="badge">debug: initializing…</div>

  <script>
    const DATA = ${data};
    let map;
    const overlays = []; // OverlayView instances

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

    // --- layout scheduler: ensures stacking is reapplied AFTER overlays redraw (zoom/pan) ---
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

      const center = DATA.length
        ? { lat: DATA[0].lat, lng: DATA[0].lng }
        : { lat: 40.7128, lng: -74.0060 };

      map = new google.maps.Map(document.getElementById('map'), {
        center,
        zoom: 12,
        disableDefaultUI: true,
        clickableIcons: false,
        gestureHandling: 'greedy'
      });

      log("Map initialized", { center, zoom: map.getZoom(), pins: DATA.length });

      // Re-stack on every stable moment + as the map changes
      google.maps.event.addListener(map, "idle", () => {
        const c = map.getCenter();
        log("map idle", { center: { lat: c.lat(), lng: c.lng() }, zoom: map.getZoom() });
        scheduleLayout();
      });
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
      overlay._didFirstDraw = false;
      overlay._ev = ev;
      overlay._idx = idx;
      overlay._px = null;

      overlay.onAdd = function() {
        const div = document.createElement('div');
        div.className = 'emoji-pin';
        div.textContent = ev.emoji || '📍';
        div.title = ev.title || '';
        div.dataset.id = ev._id || String(idx);
        this._div = div;

        this.getPanes().overlayLayer.appendChild(div);

        log("overlay added", { idx, lat: ev.lat, lng: ev.lng, emoji: ev.emoji || "📍" });
      };

      overlay.draw = function() {
        const projection = this.getProjection();
        if (!projection || !this._div) return;

        const pos = new google.maps.LatLng(ev.lat, ev.lng);
        const point = projection.fromLatLngToDivPixel(pos);
        if (!point) return;

        // store raw pixels for stacking
        this._px = { x: point.x, y: point.y };

        // ONLY set left/top here. DO NOT reset transform here,
        // otherwise stacking offsets get wiped on zoom/pan redraw.
        this._div.style.left = Math.round(point.x) + 'px';
        this._div.style.top  = Math.round(point.y) + 'px';

        if (!this._didFirstDraw) {
          this._didFirstDraw = true;
          log("overlay first draw", { idx, lat: ev.lat, lng: ev.lng, x: Math.round(point.x), y: Math.round(point.y) });
        }

        // Re-apply stacking after *any* draw cycle (zoom/pan triggers draw)
        scheduleLayout();
      };

      overlay.onRemove = function() {
        if (this._div) {
          this._div.remove();
          this._div = null;
        }
        log("overlay removed", { idx });
      };

      return overlay;
    }

    // --- STACKING LOGIC ---
    // Group overlays that are within THRESH pixels and fan them out.
    function layoutStacks(){
      const alive = overlays.filter(o => o && o._div && o._px);
      if (alive.length === 0) return;

      const THRESH = 18; // pixels
      const RADIUS = 22; // pixels

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
            // update anchor as average (stable)
            const n = g.items.length;
            g.anchor = {
              x: (g.anchor.x*(n-1) + o._px.x) / n,
              y: (g.anchor.y*(n-1) + o._px.y) / n
            };
            placed = true;
            break;
          }
        }
        if (!placed) groups.push({ anchor: { ...o._px }, items: [o] });
      }

      // Apply transforms (do NOT touch left/top here unless you want a shared anchor)
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

          // fan out around the point (keeps them "stuck" even while map redraws)
          o._div.style.transform =
            'translate(calc(-50% + ' + dx.toFixed(1) + 'px), calc(-50% + ' + dy.toFixed(1) + 'px))';
          o._div.style.zIndex = String(1000 + i);
        }
      }

      log("stack layout", { groups: groups.map(g => g.items.length) });
    }

    window.initMap = initMap;

    window.addEventListener("error", function(e){
      post("log", { msg: "JS error: " + (e.message || "unknown"), extra: null });
      setBadge("JS error: " + (e.message || "unknown"));
    });
  </script>

  <script async defer
    src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_KEY}&v=weekly&callback=initMap">
  </script>
</body>
</html>`;
  }, [GOOGLE_KEY, safeEvents]);

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        source={{ html, baseUrl: "https://localhost" }}
        key={JSON.stringify(safeEvents)}
        onMessage={(e) => {
          try {
            const msg = JSON.parse(e.nativeEvent.data);
            if (msg?.type === "log") console.log("[MapView]", msg.msg, msg.extra ?? "");
          } catch {}
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center" },
});
