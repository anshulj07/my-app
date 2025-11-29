// components/MapView.tsx
import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import Constants from "expo-constants";

type EventPin = { title: string; lat: number; lng: number; emoji: string };
export default function MapView({ events }: { events: EventPin[] }) {
  const GOOGLE_KEY = Constants.expoConfig?.extra?.googleMapsKey as string;

  const html = useMemo(
    () => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
        <style>html,body,#map{height:100%;margin:0;padding:0}</style>
        <script src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_KEY}"></script>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const map = new google.maps.Map(document.getElementById("map"), {
            center: { lat: ${events?.[0]?.lat ?? 40.7128}, lng: ${events?.[0]?.lng ?? -74.0060} },
            zoom: 12,
            disableDefaultUI: true
          });

          const events = ${JSON.stringify(events || [])};
          events.forEach(ev => {
            new google.maps.Marker({
              position: { lat: ev.lat, lng: ev.lng },
              map,
              title: ev.title,
              label: { text: ev.emoji, fontSize: "24px" }
            });
          });
        </script>
      </body>
    </html>`,
    [events]
  );

  return (
    <View style={styles.container}>
      <WebView originWhitelist={["*"]} source={{ html }} />
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 } });
