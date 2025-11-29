// components/MapView.tsx
import React, { useMemo } from "react";
import { View, StyleSheet, Platform, Text } from "react-native";
import { WebView } from "react-native-webview";
import Constants from "expo-constants";

type EventPin = { title: string; lat: number; lng: number; emoji: string };

export default function MapView({ events }: { events: EventPin[] }) {
  // WebView doesn’t run on web inside Expo Go
  if (Platform.OS === "web") {
    return (
      <View style={[styles.container, styles.center]}>
        <Text>Map preview is unavailable on web in Expo Go.</Text>
      </View>
    );
  }

  const GOOGLE_KEY =
    (Constants.expoConfig?.extra as any)?.googleMapsKey as string | undefined;

  const safeEvents = (events || []).filter(
    (e) => typeof e.lat === "number" && typeof e.lng === "number"
  );

  const html = useMemo(
    () => `
<!doctype html>
<html>
<head>
  <meta name="viewport" content="initial-scale=1,width=device-width"/>
  <style>
    html,body,#map{height:100%;margin:0}
    .emoji-pin{
      width:40px;height:40px;border-radius:20px;
      display:flex;align-items:center;justify-content:center;
      font-size:22px;background:#fff;box-shadow:0 8px 18px rgba(0,0,0,.18);
      border:1px solid rgba(0,0,0,.06); transform:translate(-20px,-20px) scale(.85);
      animation:pop .35s ease-out forwards;
      user-select:none;
    }
    @keyframes pop{to{transform:translate(-20px,-20px) scale(1)}}
  </style>
  <script src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_KEY ?? ""}&v=beta&libraries=marker"></script>
</head>
<body>
  <div id="map"></div>
  <script>
    (function(){
      const data = ${JSON.stringify(safeEvents)};
      const center = data.length ? {lat:data[0].lat,lng:data[0].lng} : {lat:40.7128,lng:-74.0060};

      const map = new google.maps.Map(document.getElementById('map'), {
        center, zoom: 12, disableDefaultUI: true
      });

      const hasAdvanced = !!(google.maps.marker && google.maps.marker.AdvancedMarkerElement);

      function addEmojiPin(ev){
        const el = document.createElement('div');
        el.className = 'emoji-pin';
        el.textContent = ev.emoji || '📍';
        if (hasAdvanced){
          return new google.maps.marker.AdvancedMarkerElement({
            map, position: {lat: ev.lat, lng: ev.lng}, content: el, title: ev.title || ""
          });
        } else {
          return new google.maps.Marker({
            map, position: {lat: ev.lat, lng: ev.lng}, title: ev.title || "",
            label: { text: ev.emoji || '📍', fontSize: '20px' }
          });
        }
      }

      data.forEach(addEmojiPin);
    })();
  </script>
</body>
</html>
`,
    [JSON.stringify(safeEvents), GOOGLE_KEY]
  );

  if (!GOOGLE_KEY) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text>Missing Google Maps key (extra.googleMapsKey)</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        source={{ html }}
        // Reload when events change to re-create markers
        key={JSON.stringify(safeEvents).length}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center" },
});
