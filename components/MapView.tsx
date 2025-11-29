import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import Constants from "expo-constants";

const GOOGLE_KEY = Constants.expoConfig?.extra?.googleMapsKey;

export default function MapView() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetch("https://your-backend-api.com/events")
      .then((res) => res.json())
      .then((data) => setEvents(data));
  }, []);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
        <style>
          html, body, #map { height: 100%; margin: 0; padding: 0; }
        </style>
        <script src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_KEY}"></script>
      </head>
      <body>
        <div id="map"></div>
        <script>
          function init() {
            const map = new google.maps.Map(document.getElementById("map"), {
              center: { lat: 40.7128, lng: -74.0060 },
              zoom: 12,
            });

            const events = ${JSON.stringify(events)};

            events.forEach(ev => {
              new google.maps.Marker({
                position: { lat: ev.lat, lng: ev.lng },
                title: ev.title,
                map
              });
            });
          }
          window.onload = init;
        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView originWhitelist={["*"]} source={{ html }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }
});