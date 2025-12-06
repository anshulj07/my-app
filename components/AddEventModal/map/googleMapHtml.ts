export function makeGoogleMapHtml(key?: string, initial?: { lat: number; lng: number } | null) {
    const center = initial ?? { lat: 40.7128, lng: -74.006 };
  
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
  
        function post(msg){ window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(msg)); }
  
        function init() {
          map = new google.maps.Map(document.getElementById('map'), {
            center: { lat: ${center.lat}, lng: ${center.lng} },
            zoom: 13,
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
        }
  
        function onMsg(ev) {
          try {
            var data = JSON.parse(ev.data);
            if (data.type === 'setMarker') {
              var p = { lat: data.lat, lng: data.lng };
              marker.setPosition(p);
              map.panTo(p);
              map.setZoom(15);
            }
          } catch(e) {}
        }
  
        window.initMap = init;
      })();
    </script>
    <script async defer src="https://maps.googleapis.com/maps/api/js?key=${key ?? ""}&v=weekly&callback=initMap"></script>
  </body>
  </html>`;
  }
  