import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { WebView } from "react-native-webview";
import Ionicons from "@expo/vector-icons/Ionicons";

const COUNTRIES: { name: string; id: string }[] = [
  { name: "Afghanistan", id: "4" }, { name: "Albania", id: "8" },
  { name: "Algeria", id: "12" }, { name: "Angola", id: "24" },
  { name: "Argentina", id: "32" }, { name: "Armenia", id: "51" },
  { name: "Australia", id: "36" }, { name: "Austria", id: "40" },
  { name: "Azerbaijan", id: "31" }, { name: "Bahrain", id: "48" },
  { name: "Bangladesh", id: "50" }, { name: "Belarus", id: "112" },
  { name: "Belgium", id: "56" }, { name: "Bhutan", id: "64" },
  { name: "Bolivia", id: "68" }, { name: "Bosnia and Herzegovina", id: "70" },
  { name: "Botswana", id: "72" }, { name: "Brazil", id: "76" },
  { name: "Bulgaria", id: "100" }, { name: "Cambodia", id: "116" },
  { name: "Cameroon", id: "120" }, { name: "Canada", id: "124" },
  { name: "Chile", id: "152" }, { name: "China", id: "156" },
  { name: "Colombia", id: "170" }, { name: "Congo", id: "178" },
  { name: "Croatia", id: "191" }, { name: "Cuba", id: "192" },
  { name: "Cyprus", id: "196" }, { name: "Czech Republic", id: "203" },
  { name: "Denmark", id: "208" }, { name: "DR Congo", id: "180" },
  { name: "Ecuador", id: "218" }, { name: "Egypt", id: "818" },
  { name: "Estonia", id: "233" }, { name: "Ethiopia", id: "231" },
  { name: "Finland", id: "246" }, { name: "France", id: "250" },
  { name: "Georgia", id: "268" }, { name: "Germany", id: "276" },
  { name: "Ghana", id: "288" }, { name: "Greece", id: "300" },
  { name: "Guatemala", id: "320" }, { name: "Hungary", id: "348" },
  { name: "Iceland", id: "352" }, { name: "India", id: "356" },
  { name: "Indonesia", id: "360" }, { name: "Iran", id: "364" },
  { name: "Iraq", id: "368" }, { name: "Ireland", id: "372" },
  { name: "Israel", id: "376" }, { name: "Italy", id: "380" },
  { name: "Japan", id: "392" }, { name: "Jordan", id: "400" },
  { name: "Kazakhstan", id: "398" }, { name: "Kenya", id: "404" },
  { name: "Kuwait", id: "414" }, { name: "Kyrgyzstan", id: "417" },
  { name: "Laos", id: "418" }, { name: "Latvia", id: "428" },
  { name: "Lebanon", id: "422" }, { name: "Libya", id: "434" },
  { name: "Lithuania", id: "440" }, { name: "Luxembourg", id: "442" },
  { name: "Malaysia", id: "458" }, { name: "Mali", id: "466" },
  { name: "Mexico", id: "484" }, { name: "Moldova", id: "498" },
  { name: "Mongolia", id: "496" }, { name: "Montenegro", id: "499" },
  { name: "Morocco", id: "504" }, { name: "Mozambique", id: "508" },
  { name: "Myanmar", id: "104" }, { name: "Namibia", id: "516" },
  { name: "Nepal", id: "524" }, { name: "Netherlands", id: "528" },
  { name: "New Zealand", id: "554" }, { name: "Nicaragua", id: "558" },
  { name: "Nigeria", id: "566" }, { name: "North Korea", id: "408" },
  { name: "Norway", id: "578" }, { name: "Oman", id: "512" },
  { name: "Pakistan", id: "586" }, { name: "Panama", id: "591" },
  { name: "Paraguay", id: "600" }, { name: "Peru", id: "604" },
  { name: "Philippines", id: "608" }, { name: "Poland", id: "616" },
  { name: "Portugal", id: "620" }, { name: "Qatar", id: "634" },
  { name: "Romania", id: "642" }, { name: "Russia", id: "643" },
  { name: "Rwanda", id: "646" }, { name: "Saudi Arabia", id: "682" },
  { name: "Senegal", id: "686" }, { name: "Serbia", id: "688" },
  { name: "Singapore", id: "702" }, { name: "Slovakia", id: "703" },
  { name: "Slovenia", id: "705" }, { name: "Somalia", id: "706" },
  { name: "South Africa", id: "710" }, { name: "South Korea", id: "410" },
  { name: "South Sudan", id: "728" }, { name: "Spain", id: "724" },
  { name: "Sri Lanka", id: "144" }, { name: "Sudan", id: "729" },
  { name: "Sweden", id: "752" }, { name: "Switzerland", id: "756" },
  { name: "Syria", id: "760" }, { name: "Taiwan", id: "158" },
  { name: "Tajikistan", id: "762" }, { name: "Tanzania", id: "834" },
  { name: "Thailand", id: "764" }, { name: "Tunisia", id: "788" },
  { name: "Turkey", id: "792" }, { name: "Turkmenistan", id: "795" },
  { name: "Uganda", id: "800" }, { name: "Ukraine", id: "804" },
  { name: "United Arab Emirates", id: "784" }, { name: "United Kingdom", id: "826" },
  { name: "United States", id: "840" }, { name: "Uruguay", id: "858" },
  { name: "Uzbekistan", id: "860" }, { name: "Venezuela", id: "862" },
  { name: "Vietnam", id: "704" }, { name: "Yemen", id: "887" },
  { name: "Zambia", id: "894" }, { name: "Zimbabwe", id: "716" },
];

const NAME_TO_ID: Record<string, string> = Object.fromEntries(
  COUNTRIES.map(c => [c.name, c.id])
);

// Pure Canvas map — zero CDN, zero library dependencies inside WebView
function buildHtml(initialIds: string[], worldJson: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;overflow:hidden;background:#C8DFF0}
canvas{display:block;width:100%;height:100%}
</style>
</head>
<body>
<canvas id="c"></canvas>
<script>
var visited = ${JSON.stringify(initialIds)};
var countries = [];

var canvas = document.getElementById('c');
var W = window.innerWidth  || 800;
var H = window.innerHeight || 240;
canvas.width  = W;
canvas.height = H;
var ctx = canvas.getContext('2d');

// Equirectangular projection showing -80S to 85N
var YMAX = 85, YMIN = -80;
function px(lon, lat) {
  return [(lon + 180) / 360 * W, (YMAX - lat) / (YMAX - YMIN) * H];
}

// Minimal topojson decoder (no library needed)
function decodeTopo(topo) {
  var sc = topo.transform.scale;
  var tr = topo.transform.translate;
  // Decode delta-encoded arcs
  var arcs = topo.arcs.map(function(arc) {
    var x = 0, y = 0;
    return arc.map(function(d) {
      x += d[0]; y += d[1];
      return [x * sc[0] + tr[0], y * sc[1] + tr[1]];
    });
  });
  function getArc(i) {
    return i >= 0 ? arcs[i] : arcs[~i].slice().reverse();
  }
  function stitch(ring) {
    var pts = [];
    for (var r = 0; r < ring.length; r++) {
      var arc = getArc(ring[r]);
      for (var i = (pts.length ? 1 : 0); i < arc.length; i++) pts.push(arc[i]);
    }
    return pts;
  }
  return topo.objects.countries.geometries.map(function(g) {
    var polys = [];
    if (g.type === 'Polygon') {
      polys.push(stitch(g.arcs[0]));
    } else if (g.type === 'MultiPolygon') {
      for (var k = 0; k < g.arcs.length; k++) polys.push(stitch(g.arcs[k][0]));
    }
    return { id: String(g.id), polys: polys };
  });
}

function drawAll() {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#C8DFF0';
  ctx.fillRect(0, 0, W, H);

  for (var i = 0; i < countries.length; i++) {
    var c = countries[i];
    var isVisited = visited.indexOf(c.id) !== -1;
    ctx.fillStyle   = isVisited ? '#3B82F6' : '#9CA3AF';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth   = 0.5;

    for (var j = 0; j < c.polys.length; j++) {
      var poly = c.polys[j];
      if (poly.length < 3) continue;
      ctx.beginPath();
      var p0 = px(poly[0][0], poly[0][1]);
      ctx.moveTo(p0[0], p0[1]);
      for (var k = 1; k < poly.length; k++) {
        var p = px(poly[k][0], poly[k][1]);
        ctx.lineTo(p[0], p[1]);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }
}

try {
  var WORLD = JSON.parse(${JSON.stringify(worldJson)});
  countries = decodeTopo(WORLD);
  drawAll();
} catch(e) {
  ctx.fillStyle = '#999';
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Map error: ' + e.message, W / 2, H / 2);
}

function updateVisited(ids) {
  visited = ids;
  drawAll();
}

window.addEventListener('message', function(e) {
  try { var d = JSON.parse(e.data); if (Array.isArray(d)) updateVisited(d); } catch(x) {}
});
document.addEventListener('message', function(e) {
  try { var d = JSON.parse(e.data); if (Array.isArray(d)) updateVisited(d); } catch(x) {}
});
</script>
</body>
</html>`;
}

interface Props {
  visitedCountries: string[];
  onChanged: (countries: string[]) => void;
}

export default function WorldMapSection({ visitedCountries, onChanged }: Props) {
  const webviewRef = useRef<WebView>(null);
  const [html, setHtml]           = useState<string | null>(null);
  const [fetchError, setFetchError] = useState(false);
  const [webviewReady, setWebviewReady] = useState(false);
  const [selected, setSelected]   = useState<string[]>(visitedCountries);
  const [query, setQuery]         = useState("");
  const [focused, setFocused]     = useState(false);

  // Only one fetch — world-atlas JSON via React Native (reliable)
  useEffect(() => {
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then(r => r.text())
      .then(worldJson => {
        const ids = visitedCountries.map(n => NAME_TO_ID[n]).filter(Boolean);
        setHtml(buildHtml(ids, worldJson));
      })
      .catch(() => setFetchError(true));
  }, []);

  const pushToMap = useCallback((names: string[]) => {
    const ids = names.map(n => NAME_TO_ID[n]).filter(Boolean);
    webviewRef.current?.injectJavaScript(
      `updateVisited(${JSON.stringify(ids)});true;`
    );
  }, []);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return COUNTRIES
      .filter(c => c.name.toLowerCase().includes(q) && !selected.includes(c.name))
      .slice(0, 6)
      .map(c => c.name);
  }, [query, selected]);

  const addCountry = useCallback((name: string) => {
    const next = [...selected, name];
    setSelected(next);
    setQuery("");
    pushToMap(next);
    onChanged(next);
  }, [selected, pushToMap, onChanged]);

  const removeCountry = useCallback((name: string) => {
    const next = selected.filter(c => c !== name);
    setSelected(next);
    pushToMap(next);
    onChanged(next);
  }, [selected, pushToMap, onChanged]);

  const showSuggestions = focused && suggestions.length > 0;
  const isLoading = !html && !fetchError;

  return (
    <View style={styles.outer}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Countries Visited</Text>
          <Text style={styles.count}>
            {selected.length} {selected.length === 1 ? "country" : "countries"}
          </Text>
        </View>

        <View style={styles.mapBox}>
          {(isLoading || (html != null && !webviewReady)) && (
            <View style={styles.loader}>
              <ActivityIndicator color="#6C63FF" size="small" />
              <Text style={styles.loaderTxt}>
                {isLoading ? "Loading map data…" : "Rendering map…"}
              </Text>
            </View>
          )}

          {fetchError && (
            <View style={styles.loader}>
              <Ionicons name="globe-outline" size={28} color="#bbb" />
              <Text style={styles.loaderTxt}>Map unavailable — check connection</Text>
            </View>
          )}

          {html != null && (
            <WebView
              ref={webviewRef}
              source={{ html }}
              style={[styles.webview, !webviewReady && { opacity: 0 }]}
              onLoadEnd={() => setWebviewReady(true)}
              scrollEnabled={false}
              javaScriptEnabled
              domStorageEnabled
              originWhitelist={["*"]}
              mixedContentMode="always"
              androidLayerType="hardware"
            />
          )}
        </View>
      </View>

      {/* Outside overflow:hidden card so dropdown isn't clipped */}
      <View style={styles.inputRow}>
        <Ionicons name="search-outline" size={16} color="#9CA3AF" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder="Search a country…"
          placeholderTextColor="#C0C0C0"
          style={styles.input}
          autoCapitalize="words"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery("")} hitSlop={8}>
            <Ionicons name="close-circle" size={16} color="#C0C0C0" />
          </TouchableOpacity>
        )}
      </View>

      {showSuggestions && (
        <View style={styles.dropdown}>
          {suggestions.map((name, i) => (
            <TouchableOpacity
              key={name}
              style={[styles.dropItem, i < suggestions.length - 1 && styles.dropBorder]}
              onPress={() => addCountry(name)}
              activeOpacity={0.7}
            >
              <Text style={styles.dropTxt}>{name}</Text>
              <Ionicons name="add-circle-outline" size={18} color="#6C63FF" />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {selected.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          style={styles.chipsScroll}
        >
          {selected.map(name => (
            <View key={name} style={styles.chip}>
              <Text style={styles.chipTxt}>{name}</Text>
              <TouchableOpacity onPress={() => removeCountry(name)} hitSlop={6}>
                <Ionicons name="close" size={12} color="#2563EB" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={{ height: 14 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { marginHorizontal: 14, marginTop: 12 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  title: { fontSize: 16, fontWeight: "700", color: "#191919" },
  count:  { fontSize: 12, color: "#888", fontWeight: "600" },

  mapBox: { height: 220, backgroundColor: "#C8DFF0", position: "relative" },
  loader: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#C8DFF0",
    zIndex: 2,
    gap: 8,
  },
  loaderTxt: { fontSize: 12, color: "#666" },
  webview: { width: "100%", height: 220, backgroundColor: "transparent" },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    height: 46,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 12,
    gap: 8,
  },
  input: { flex: 1, fontSize: 14, color: "#111", paddingVertical: 0 },

  dropdown: {
    marginTop: 4,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    overflow: "hidden",
  },
  dropItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropBorder: { borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  dropTxt: { fontSize: 14, color: "#111", fontWeight: "500" },

  chipsScroll: { marginTop: 10 },
  chips: { paddingHorizontal: 2, gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 8,
    borderRadius: 999,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  chipTxt: { fontSize: 13, fontWeight: "600", color: "#1D4ED8" },
});
