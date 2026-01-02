export function makeGoogleMapHtml(
  key?: string,
  initial?: { lat: number; lng: number } | null
) {
  // no NYC fallback — neutral default only
  const center = initial ?? { lat: 0, lng: 0 };

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
  <style>
    html, body { height: 100%; margin: 0; padding: 0; background: #0b1220; }
    #map { height: 100%; width: 100%; border-radius: 16px; overflow: hidden; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    (function() {
      var map, marker;

      function post(msg){
        try { window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(msg)); }
        catch(e) {}
      }

      function setPoint(lat, lng, zoom) {
        if (!map || !marker) return;
        var p = { lat: lat, lng: lng };
        marker.setPosition(p);
        map.panTo(p);
        if (zoom) map.setZoom(zoom);
      }

      function tryGeolocate() {
        // If initial is neutral (0,0) OR you want to always prefer current location,
        // ask for geolocation and re-center.
        if (!navigator.geolocation) {
          post({ type: 'geoDenied', reason: 'no_geolocation_api' });
          return;
        }

        navigator.geolocation.getCurrentPosition(
          function(pos) {
            var lat = pos.coords.latitude;
            var lng = pos.coords.longitude;
            setPoint(lat, lng, 15);
            post({ type: 'geo', lat: lat, lng: lng });
          },
          function(err) {
            post({ type: 'geoDenied', reason: err && err.message ? err.message : 'permission_or_error' });
          },
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 15000 }
        );
      }

      function init() {
        map = new google.maps.Map(document.getElementById('map'), {
          center: { lat: ${center.lat}, lng: ${center.lng} },
          zoom: ${initial ? 13 : 2},
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
          gestureHandling: 'greedy',
        });

        marker = new google.maps.Marker({
          position: { lat: ${center.lat}, lng: ${center.lng} },
          map: map,
          draggable: true
        });

        google.maps.event.addListener(map, 'click', function(e) {
          var p = e.latLng;
          marker.setPosition(p);
          post({ type: 'picked', lat: p.lat(), lng: p.lng() });
        });

        google.maps.event.addListener(marker, 'dragend', function(e) {
          var p = e.latLng;
          post({ type: 'picked', lat: p.lat(), lng: p.lng() });
        });

        window.document.addEventListener('message', onMsg);
        window.addEventListener('message', onMsg);

        post({ type: 'ready' });

        // Always prefer current location (WebView-side). RN can still override via postMessage.
        tryGeolocate();
      }

      function onMsg(ev) {
        try {
          var data = JSON.parse(ev.data);

          // You already use setMarker — keep it
          if (data.type === 'setMarker' && typeof data.lat === 'number' && typeof data.lng === 'number') {
            setPoint(data.lat, data.lng, 15);
            return;
          }

          // Optional: allow RN to force re-request geolocation
          if (data.type === 'requestGeo') {
            tryGeolocate();
            return;
          }
        } catch(e) {}
      }

      window.initMap = init;
    })();
  </script>

  <script async defer
    src="https://maps.googleapis.com/maps/api/js?key=${key ?? ""}&v=weekly&callback=initMap">
  </script>
</body>
</html>`;
}
