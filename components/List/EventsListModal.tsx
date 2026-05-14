import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  Platform,
  StatusBar,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: W } = Dimensions.get("window");

const COLORS = {
  purple: "#6366F1",
  purpleBg: "#EEF2FF",
  bg: "#F9FAFB",
  card: "#FFFFFF",
  text: "#111827",
  muted: "#6B7280",
  lightMuted: "#9CA3AF",
  border: "#F3F4F6",
  green: "#DCFCE7",
  greenText: "#15803D",
  font: "Outfit_500Medium",
  fontBold: "Outfit_700Bold",
  fontExtraBold: "Outfit_800ExtraBold",
};

type EventPin = {
  _id?: string;
  title: string;
  lat: number;
  lng: number;
  emoji: string;
  kind?: string;
  priceCents?: number | string | null;
  date?: string;
  time?: string;
  bannerUri?: string;
  location?: {
    city?: string;
    formattedAddress?: string;
    address?: string;
  };
  creatorName?: string;
  creatorAvatar?: string;
  creatorVerified?: boolean;
};

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ─── Hero Card Component ──────────────────────────────────────────────────
function EventCard({ item, onPress }: { item: EventPin; onPress: () => void }) {
  const isPaid = item.kind === "paid" || item.kind === "service";
  const price = isPaid ? `₹${Math.round(Number(item.priceCents || 0) / 100)}` : "Free";
  const imgUri = item.bannerUri || "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&q=80&w=800";

  return (
    <TouchableOpacity style={S.eventCard} activeOpacity={0.9} onPress={onPress}>
      <Image source={{ uri: imgUri }} style={S.eventImg} />
      <View style={S.freeBadge}>
        <Text style={S.freeText}>{price}</Text>
      </View>
      <BlurView intensity={25} tint="dark" style={S.eventGlassCard}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={S.eventTitle} numberOfLines={1}>{item.title}</Text>
          {item.creatorVerified && (
            <Ionicons name="checkmark-circle" size={14} color="#4BB543" style={{ marginLeft: 5, marginBottom: 5 }} />
          )}
        </View>
        <View style={S.eventMetaRow}>
          <Ionicons name="location-outline" size={12} color="#fff" />
          <Text style={S.eventMetaText} numberOfLines={1}>
            {item.location?.formattedAddress?.split(",")[0] || item.location?.city || "Nearby"}
          </Text>
        </View>
        <View style={S.eventMetaRow}>
          <Ionicons name="navigate-outline" size={12} color="#fff" />
          <Text style={S.eventMetaText}>{item.distance?.toFixed(1) || "0.0"} km away</Text>
        </View>
        <TouchableOpacity style={S.joinBtn} onPress={onPress}>
          <Text style={S.joinBtnText}>Join Event</Text>
        </TouchableOpacity>
      </BlurView>
    </TouchableOpacity>
  );
}

// ─── Service Card Component ────────────────────────────────────────────────
function ServiceCard({ item, onPress }: { item: EventPin; onPress: () => void }) {
  const imgUri = item.bannerUri || "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800";
  const isBusy = Math.random() > 0.7; // Mock logic for 1-on-1 session

  return (
    <TouchableOpacity style={S.serviceCard} activeOpacity={0.9} onPress={onPress}>
      <Image source={{ uri: imgUri }} style={S.eventImg} />
      
      <View style={S.serviceHeaderRow}>
        <View style={[S.statusBadge, isBusy ? S.statusBadgeFull : S.statusBadgeOpen]}>
          <View style={[S.statusDot, isBusy ? S.statusDotFull : S.statusDotOpen]} />
          <Text style={[S.statusText, isBusy ? S.statusTextFull : S.statusTextOpen]}>
            {isBusy ? "BUSY" : "OPEN NOW"}
          </Text>
        </View>
        <View style={S.slotsBadge}>
          <Text style={S.slotsText}>SLOTS AVAILABLE</Text>
        </View>
      </View>

      <View style={S.serviceContentOverlay}>
        <View style={S.serviceInfoTop}>
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
            <Text style={S.serviceName} numberOfLines={1}>{item.title}</Text>
            {item.creatorVerified && (
              <Ionicons name="checkmark-circle" size={14} color="#4BB543" style={{ marginLeft: 5 }} />
            )}
          </View>
          <View style={S.serviceRatingBox}>
             <Ionicons name="star" size={10} color="#F59E0B" />
             <Text style={S.serviceRatingText}>4.9</Text>
          </View>
        </View>

        <Text style={S.serviceDesc} numberOfLines={2}>
          High-quality service tailored to your needs. Professional and reliable experience...
        </Text>

        <View style={S.serviceMetaGrid}>
          <View style={S.metaItem}>
            <Ionicons name="time-outline" size={14} color={COLORS.muted} />
            <Text style={S.metaLabel}>View Schedule</Text>
          </View>
          <View style={S.metaItem}>
            <Ionicons name="navigate-outline" size={14} color={COLORS.purple} />
            <Text style={S.metaLabel}>{item.distance?.toFixed(1) || "0.0"} km away</Text>
          </View>
        </View>

        <TouchableOpacity style={S.serviceBookBtn} onPress={onPress}>
          <Text style={S.serviceBookText}>Book Slot</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ─── Compact Card for Grouped Sections ─────────────────────────────────────
function CompactCard({ item, onPress }: { item: EventPin; onPress: () => void }) {
  const imgUri = item.bannerUri || (item.kind === "service" 
    ? "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=400"
    : "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&q=80&w=400");
  
  return (
    <TouchableOpacity style={S.compactCard} activeOpacity={0.7} onPress={onPress}>
      <Image source={{ uri: imgUri }} style={S.compactImg} />
      <View style={S.compactContent}>
        <View style={S.compactTop}>
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
            <Text style={S.compactName} numberOfLines={1}>{item.title}</Text>
            {item.creatorVerified && (
              <Ionicons name="checkmark-circle" size={12} color="#4BB543" style={{ marginLeft: 4 }} />
            )}
          </View>
          <View style={S.compactTag}><Text style={S.compactTagText}>{item.kind?.toUpperCase() || "EVENT"}</Text></View>
        </View>
        <View style={S.compactMeta}>
          <Ionicons name="star" size={12} color="#F59E0B" />
          <Text style={S.compactMetaText}>4.9 (124 reviews)</Text>
        </View>
        <View style={S.compactMeta}>
          <Ionicons name="navigate-outline" size={12} color={COLORS.purple} />
          <Text style={S.compactMetaText}>{item.distance?.toFixed(1) || "0.0"} km away</Text>
        </View>
        <Text style={S.compactStatus}>{item.kind === "service" ? "Open Now" : "Starting Soon"}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Filter Modal Component ───────────────────────────────────────────────
function FilterModal({ 
  visible, 
  onClose, 
  radius, 
  setRadius, 
  type,
  setType,
  price,
  setPrice,
  dates,
  setDates,
  onApply 
}: { 
  visible: boolean; 
  onClose: () => void; 
  radius: number;
  setRadius: (v: number) => void;
  type: string;
  setType: (v: string) => void;
  price: string;
  setPrice: (v: string) => void;
  dates: number[];
  setDates: (v: number[]) => void;
  onApply: () => void;
}) {
  const [localRadius, setLocalRadius] = useState(radius);
  const [localType, setLocalType] = useState(type);
  const [localPrice, setLocalPrice] = useState(price);
  const [localDates, setLocalDates] = useState(dates);

  // Dynamic Calendar Logic
  const [viewDate, setViewDate] = useState(new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthName = viewDate.toLocaleString("default", { month: "long" });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const toggleDate = (day: number) => {
    const dateStr = `${year}-${month + 1}-${day}`; // Unique date key
    setLocalDates(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const changeMonth = (offset: number) => {
    setViewDate(new Date(year, month + offset, 1));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <BlurView intensity={90} tint="light" style={S.filterOverlay}>
        <View style={S.filterSheet}>
          <View style={S.filterHeader}>
            <TouchableOpacity onPress={onClose} style={S.filterCloseBtn}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={S.filterTitle}>Personalize Discovery</Text>
            <TouchableOpacity onPress={() => { setLocalRadius(50); setLocalType("All"); setLocalPrice("All"); setLocalDates([]); }}>
              <Text style={S.resetText}>Clear All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={S.filterScroll} showsVerticalScrollIndicator={false}>
            {/* Radius Slider */}
            <View style={S.filterSection}>
              <View style={S.radiusHeader}>
                <Text style={S.filterLabel}>Discovery Radius</Text>
                <View style={S.radiusValueBadge}>
                   <Text style={S.radiusValueText}>{localRadius} km</Text>
                </View>
              </View>
              <View style={S.sliderContainer}>
                <View style={S.sliderTrack}>
                  <View style={[S.sliderFill, { width: `${(localRadius / 50) * 100}%` }]} />
                  <TouchableOpacity 
                    style={[S.sliderThumb, { left: `${(localRadius / 50) * 100}%` }]}
                    activeOpacity={1}
                  />
                </View>
                <View style={S.sliderLabels}>
                   <TouchableOpacity onPress={() => setLocalRadius(10)}><Text style={S.sliderLimit}>10km</Text></TouchableOpacity>
                   <TouchableOpacity onPress={() => setLocalRadius(25)}><Text style={S.sliderLimit}>25km</Text></TouchableOpacity>
                   <TouchableOpacity onPress={() => setLocalRadius(50)}><Text style={S.sliderLimit}>50km</Text></TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Type Selection */}
            <View style={S.filterSection}>
              <Text style={S.filterLabel}>Show Me</Text>
              <View style={S.filterGrid}>
                {["All", "Events", "Services"].map(t => (
                  <TouchableOpacity 
                    key={t} 
                    style={[S.filterChip, localType === t && S.filterChipActive]}
                    onPress={() => setLocalType(t)}
                  >
                    <Text style={[S.filterChipText, localType === t && S.filterChipTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Price Selection */}
            <View style={S.filterSection}>
              <Text style={S.filterLabel}>Budget</Text>
              <View style={S.filterGrid}>
                {["All", "Free Only", "Paid Only"].map(p => (
                  <TouchableOpacity 
                    key={p} 
                    style={[S.filterChip, localPrice === p && S.filterChipActive]}
                    onPress={() => setLocalPrice(p)}
                  >
                    <Text style={[S.filterChipText, localPrice === p && S.filterChipTextActive]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Date Selection */}
            <View style={S.filterSection}>
              <View style={S.calendarHeaderRow}>
                <Text style={S.filterLabel}>Date Range</Text>
                <Text style={S.selectedCount}>{localDates.length} Days Selected</Text>
              </View>
              <View style={S.calendarBox}>
                <View style={S.calMonthHeader}>
                  <Text style={S.calendarMonth}>{monthName} {year}</Text>
                  <View style={S.calNav}>
                    <TouchableOpacity onPress={() => changeMonth(-1)}><Ionicons name="chevron-back" size={20} color={COLORS.text} /></TouchableOpacity>
                    <TouchableOpacity onPress={() => changeMonth(1)}><Ionicons name="chevron-forward" size={20} color={COLORS.text} /></TouchableOpacity>
                  </View>
                </View>
                <View style={S.calGrid}>
                  {["S","M","T","W","T","F","S"].map((d, i) => <Text key={`head-${i}`} style={S.calDayLabel}>{d}</Text>)}
                  {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <View key={`empty-${i}`} style={S.calDay} />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const d = i + 1;
                    const isSelected = localDates.includes(d);
                    
                    const cellDate = new Date(year, month, d);
                    const today = new Date();
                    today.setHours(0,0,0,0);
                    const isPast = cellDate < today;

                    return (
                      <TouchableOpacity 
                        key={d} 
                        style={[S.calDay, isSelected && S.calDayActive, isPast && S.calDayDisabled]}
                        onPress={() => !isPast && toggleDate(d)}
                        disabled={isPast}
                      >
                        <Text style={[S.calDayText, isSelected && S.calDayTextActive, isPast && S.calDayDisabledText]}>{d}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            <View style={S.filterNotice}>
              <Ionicons name="information-circle-outline" size={16} color={COLORS.muted} />
              <Text style={S.filterNoticeText}>We'll prioritize the closest options based on your preferences.</Text>
            </View>
          </ScrollView>

          <TouchableOpacity style={S.applyBtn} onPress={() => { setRadius(localRadius); setType(localType); setPrice(localPrice); setDates(localDates); onApply(); }}>
            <Text style={S.applyBtnText}>Update Feed</Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </Modal>
  );
}

export default function EventsListModal({
  visible,
  onClose,
  events,
  myCity,
  myLoc,
  onPinPress,
}: {
  visible: boolean;
  onClose: () => void;
  events: EventPin[];
  myCity: string;
  myLoc: { lat: number; lng: number } | null;
  onPinPress?: (pin: EventPin) => void;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [filterVisible, setFilterVisible] = useState(false);
  const [radius, setRadius] = useState(50);
  const [type, setType] = useState("All");
  const [price, setPrice] = useState("All");
  const [dates, setDates] = useState<number[]>([]);

  const toggleGroup = (area: string) => {
    setExpandedGroups(prev => ({ ...prev, [area]: !prev[area] }));
  };

  const groupedNearby = useMemo(() => {
    if (!myLoc) return [];

    // 1. Filter by Radius and sort by distance
    const filtered = events
      .map(e => ({
        ...e,
        distance: getDistance(myLoc.lat, myLoc.lng, e.lat, e.lng)
      }))
      .filter(e => {
        const dMatch = e.distance <= radius;
        const tMatch = type === "All" || (type === "Events" && e.kind !== "service") || (type === "Services" && e.kind === "service");
        const pMatch = price === "All" || (price === "Free Only" && e.isFree) || (price === "Paid Only" && !e.isFree);
        return dMatch && tMatch && pMatch;
      })
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));

    // 2. Group by Area (City or Address fragment)
    const groups: { area: string; items: EventPin[]; distance: number }[] = [];
    
    filtered.forEach(item => {
      // Extract area name (using city as fallback)
      let area = item.location?.city || "Nearby Area";
      if (item.location?.formattedAddress) {
        const parts = item.location.formattedAddress.split(",");
        // Often neighborhood is the first or second part
        if (parts.length > 2) area = parts[0].trim();
      }

      const existing = groups.find(g => g.area === area);
      if (existing) {
        existing.items.push(item);
      } else {
        groups.push({ area, items: [item], distance: item.distance || 0 });
      }
    });

    return groups;
  }, [events, myLoc]);

  const nearbyEvents = useMemo(() => {
    if (!myLoc) return [];
    return events
      .map(e => ({ ...e, distance: getDistance(myLoc.lat, myLoc.lng, e.lat, e.lng) }))
      .filter(e => {
        const dMatch = e.distance <= radius;
        const tMatch = type === "All" || type === "Events";
        const pMatch = price === "All" || (price === "Free Only" && e.isFree) || (price === "Paid Only" && !e.isFree);
        return e.kind !== "service" && dMatch && tMatch && pMatch;
      })
      .sort((a, b) => (a.distance || 0) - (b.distance || 0))
      .slice(0, 10);
  }, [events, myLoc, radius, type, price]);

  const localServices = useMemo(() => {
    if (!myLoc) return [];
    return events
      .map(e => ({ ...e, distance: getDistance(myLoc.lat, myLoc.lng, e.lat, e.lng) }))
      .filter(e => {
        const dMatch = e.distance <= radius;
        const tMatch = type === "All" || type === "Services";
        const pMatch = price === "All" || (price === "Free Only" && e.isFree) || (price === "Paid Only" && !e.isFree);
        return e.kind === "service" && dMatch && tMatch && pMatch;
      })
      .sort((a, b) => (a.distance || 0) - (b.distance || 0))
      .slice(0, 10);
  }, [events, myLoc, radius, type, price]);

  const onEventPress = (ev: EventPin) => {
    if (onPinPress) {
      onPinPress(ev);
    } else {
      onClose();
      router.push({
        pathname: "/newApp/event-detail",
        params: { eventId: ev._id, title: ev.title, emoji: ev.emoji }
      });
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={S.safe}>
        <StatusBar barStyle="dark-content" />
        
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scrollContent}>
          {/* Location Selector */}
          <View style={S.locationSection}>
            <View style={S.locInfo}>
              <View style={S.locTop}>
                <Ionicons name="location-sharp" size={14} color={COLORS.purple} />
                <Text style={S.locCity}>{myCity || "Indore"}</Text>
              </View>
              <TouchableOpacity style={S.radiusBadge}>
                <Text style={S.radiusBadgeText}>{radius}km Radius</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Bar */}
          <View style={S.searchContainer}>
            <View style={S.searchBar}>
              <Ionicons name="search" size={20} color={COLORS.lightMuted} />
              <TextInput 
                placeholder="Search meetups or co-working..." 
                style={S.searchInput}
                placeholderTextColor={COLORS.lightMuted}
                value={search}
                onChangeText={setSearch}
              />
              <TouchableOpacity style={S.searchFilterBtn} onPress={() => setFilterVisible(true)}>
                <Ionicons name="options-outline" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* 1. Quick Access: Events Near You */}
          {nearbyEvents.length > 0 && (
            <View style={S.section}>
              <View style={S.sectionHeader}>
                <View>
                  <Text style={S.sectionTitle}>Events Near You</Text>
                  <Text style={S.sectionSubtitle}>Trending meetups in {radius}km</Text>
                </View>
                <TouchableOpacity><Text style={S.seeAll}>See All</Text></TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.eventScroll}>
                {nearbyEvents.map((it, i) => (
                  <EventCard key={i} item={it} onPress={() => onEventPress(it)} />
                ))}
              </ScrollView>
            </View>
          )}

          {/* 2. Quick Access: Local Services */}
          {localServices.length > 0 && (
            <View style={S.section}>
              <View style={S.sectionHeader}>
                <View>
                  <Text style={S.sectionTitle}>Local Services</Text>
                  <Text style={S.sectionSubtitle}>Book top rated professionals</Text>
                </View>
                <TouchableOpacity><Text style={S.seeAll}>See All</Text></TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.eventScroll}>
                {localServices.map((it, i) => (
                  <ServiceCard key={i} item={it} onPress={() => onEventPress(it)} />
                ))}
              </ScrollView>
            </View>
          )}

          <View style={S.dividerLine} />

          {/* 3. Explore by Area */}
          <View style={[S.section, { marginBottom: 16 }]}>
            <Text style={S.exploreHeader}>Explore by Locality</Text>
          </View>
          
          {groupedNearby.length > 0 ? (
            groupedNearby.map((group, idx) => {
              const isExpanded = !!expandedGroups[group.area];
              const itemsToShow = isExpanded ? group.items : group.items.slice(0, 2);

              return (
                <View key={idx} style={S.section}>
                  <View style={S.sectionHeader}>
                    <View>
                      <Text style={S.locationGroupTitle}>{group.area}</Text>
                      <Text style={S.sectionSubtitle}>{group.distance.toFixed(1)} km away</Text>
                    </View>
                    {group.items.length > 2 && (
                      <TouchableOpacity onPress={() => toggleGroup(group.area)}>
                        <Text style={S.seeAll}>{isExpanded ? "Show Less" : `See All (${group.items.length})`}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={S.compactList}>
                    {itemsToShow.map((it, i) => (
                      <CompactCard key={i} item={it} onPress={() => onEventPress(it)} />
                    ))}
                  </View>
                </View>
              );
            })
          ) : (
            <View style={S.emptyState}>
              <Ionicons name="map-outline" size={48} color={COLORS.lightMuted} />
              <Text style={S.emptyText}>No events or services found within 50km.</Text>
            </View>
          )}

          {/* Community Highlights */}
          <View style={S.section}>
            <Text style={S.sectionTitle}>Community Highlights</Text>
            <View style={S.highlightsGrid}>
               <TouchableOpacity style={S.highlightCardLarge}>
                 <Text style={S.highlightTitle}>New in Town?</Text>
                 <Text style={S.highlightSub}>Join the "Chiang Mai Newbies" chat group</Text>
                 <View style={S.joinGroupBtn}><Text style={S.joinGroupText}>Join Group</Text></View>
               </TouchableOpacity>
               <View style={S.highlightCol}>
                  <View style={S.highlightSmall}>
                    <Text style={S.smallLabel}>LIVE PULSE</Text>
                    <View style={S.pulseAvatars}>
                       <View style={S.avatar} />
                       <View style={S.avatar} />
                       <View style={S.avatar} />
                       <Text style={S.avatarPlus}>+42 active</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={S.highlightMap}>
                    <View style={S.mapIconBox}><Ionicons name="map" size={20} color="#fff" /></View>
                    <Text style={S.mapLabel}>MAP</Text>
                    <Text style={S.mapSub}>EXPLORE AREA</Text>
                  </TouchableOpacity>
               </View>
            </View>
          </View>
        </ScrollView>

        <FilterModal 
          visible={filterVisible} 
          onClose={() => setFilterVisible(false)} 
          radius={radius}
          setRadius={setRadius}
          type={type}
          setType={setType}
          price={price}
          setPrice={setPrice}
          dates={dates}
          setDates={setDates}
          onApply={() => setFilterVisible(false)}
        />

        <TouchableOpacity style={S.fab} onPress={onClose}>
          <Ionicons name="close" size={32} color="#fff" />
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { paddingBottom: 100, paddingTop: 10 },
  locationSection: { paddingHorizontal: 20, marginVertical: 12 },
  locInfo: { gap: 8 },
  locTop: { flexDirection: "row", alignItems: "center", gap: 6 },
  locCity: { fontSize: 15, fontFamily: COLORS.fontBold, color: COLORS.text },
  radiusBadge: { alignSelf: "flex-start", backgroundColor: "#E0E7FF", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: "#C7D2FE" },
  radiusBadgeText: { fontSize: 11, fontFamily: COLORS.fontExtraBold, color: COLORS.purple },
  searchContainer: { paddingHorizontal: 20, marginBottom: 20 },
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#fff", borderRadius: 25, paddingLeft: 16, height: 50,
    borderWidth: 1, borderColor: COLORS.border,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: COLORS.font, color: COLORS.text },
  searchFilterBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.purple, alignItems: "center", justifyContent: "center", marginRight: 5 },
  pillScroll: { paddingHorizontal: 20, gap: 8, marginBottom: 24 },
  pill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: "#fff", borderWidth: 1, borderColor: COLORS.border },
  pillActive: { backgroundColor: COLORS.purple, borderColor: COLORS.purple },
  pillText: { fontSize: 13, fontFamily: COLORS.fontBold, color: COLORS.muted },
  pillTextActive: { color: "#fff" },
  section: { marginBottom: 32, paddingHorizontal: 20 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontFamily: COLORS.fontExtraBold, color: COLORS.text },
  locationGroupTitle: { fontSize: 16, fontFamily: COLORS.fontExtraBold, color: COLORS.text },
  exploreHeader: { fontSize: 14, fontFamily: COLORS.fontExtraBold, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1 },
  dividerLine: { height: 1, backgroundColor: COLORS.border, marginHorizontal: 20, marginBottom: 24, marginTop: 8 },
  sectionSubtitle: { fontSize: 11, fontFamily: COLORS.fontBold, color: COLORS.muted, marginTop: 2 },
  seeAll: { fontSize: 13, fontFamily: COLORS.fontBold, color: COLORS.purple },
  eventScroll: { gap: 16, paddingBottom: 8, paddingHorizontal: 20 },
  servicesGridScroll: { gap: 16, paddingHorizontal: 20, paddingBottom: 8 },
  serviceColumn: { gap: 12, width: W * 0.85 },
  eventCard: { width: W * 0.8, height: 380, borderRadius: 32, overflow: "hidden", position: "relative" },
  eventImg: { width: "100%", height: "100%" },
  freeBadge: { position: "absolute", top: 16, right: 16, backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, zIndex: 10 },
  freeText: { color: "#fff", fontSize: 11, fontFamily: COLORS.fontExtraBold },
  eventGlassCard: { position: "absolute", bottom: 20, left: 15, right: 15, padding: 15, borderRadius: 24, overflow: "hidden" },
  eventTitle: { color: "#fff", fontSize: 16, fontFamily: COLORS.fontExtraBold, marginBottom: 6 },
  eventMetaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  eventMetaText: { color: "#fff", fontSize: 11, fontFamily: COLORS.font, opacity: 0.9 },
  joinBtn: { backgroundColor: "#fff", borderRadius: 12, paddingVertical: 10, alignItems: "center", marginTop: 10 },
  joinBtnText: { color: COLORS.purple, fontSize: 13, fontFamily: COLORS.fontExtraBold },
  servicesList: { gap: 12 },
  serviceCard: { width: W * 0.8, height: 440, backgroundColor: "#fff", borderRadius: 32, overflow: "hidden", position: "relative", borderWidth: 1, borderColor: COLORS.border },
  serviceHeaderRow: { position: "absolute", top: 16, left: 16, right: 16, flexDirection: "row", justifyContent: "space-between", zIndex: 10 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusBadgeOpen: { backgroundColor: "#DCFCE7" },
  statusBadgeFull: { backgroundColor: "#FEE2E2" },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusDotOpen: { backgroundColor: "#16A34A" },
  statusDotFull: { backgroundColor: "#DC2626" },
  statusText: { fontSize: 10, fontFamily: COLORS.fontExtraBold },
  statusTextOpen: { color: "#16A34A" },
  statusTextFull: { color: "#DC2626" },
  slotsBadge: { backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  slotsText: { color: "#fff", fontSize: 10, fontFamily: COLORS.fontExtraBold },
  serviceContentOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: "#fff" },
  serviceInfoTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  serviceName: { fontSize: 18, fontFamily: COLORS.fontExtraBold, color: COLORS.text, flex: 1 },
  serviceRatingBox: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#FFFBEB", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  serviceRatingText: { fontSize: 11, fontFamily: COLORS.fontExtraBold, color: "#92400E" },
  serviceDesc: { fontSize: 13, fontFamily: COLORS.font, color: COLORS.muted, lineHeight: 18, marginBottom: 16 },
  serviceMetaGrid: { flexDirection: "row", gap: 20, marginBottom: 20 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaLabel: { fontSize: 12, fontFamily: COLORS.fontBold, color: COLORS.text },
  serviceBookBtn: { backgroundColor: COLORS.purple, borderRadius: 16, paddingVertical: 14, alignItems: "center" },
  disabledBtn: { backgroundColor: COLORS.lightMuted },
  serviceBookText: { color: "#fff", fontSize: 14, fontFamily: COLORS.fontExtraBold },
  compactList: { gap: 12 },
  compactCard: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 20, padding: 12, borderWidth: 1, borderColor: COLORS.border, gap: 12 },
  compactImg: { width: 80, height: 80, borderRadius: 16 },
  compactContent: { flex: 1, justifyContent: "center" },
  compactTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  compactName: { fontSize: 14, fontFamily: COLORS.fontExtraBold, color: COLORS.text, flex: 1 },
  compactTag: { backgroundColor: COLORS.purpleBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  compactTagText: { fontSize: 9, fontFamily: COLORS.fontExtraBold, color: COLORS.purple },
  compactMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  compactMetaText: { fontSize: 11, fontFamily: COLORS.fontBold, color: COLORS.muted },
  compactStatus: { fontSize: 11, fontFamily: COLORS.fontExtraBold, color: COLORS.purple, marginTop: 4 },
  emptyState: { padding: 40, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { textAlign: "center", fontSize: 14, fontFamily: COLORS.font, color: COLORS.muted },
  highlightsGrid: { flexDirection: "row", gap: 12, marginTop: 16 },
  filterOverlay: { flex: 1, justifyContent: "flex-end" },
  filterSheet: { backgroundColor: "#fff", borderTopLeftRadius: 40, borderTopRightRadius: 40, height: "85%", padding: 24, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 20 },
  filterHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 32 },
  filterCloseBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#F9FAFB", alignItems: "center", justifyContent: "center" },
  filterTitle: { fontSize: 20, fontFamily: COLORS.fontExtraBold, color: COLORS.text },
  resetText: { fontSize: 14, fontFamily: COLORS.fontBold, color: "#EF4444" },
  filterScroll: { flex: 1 },
  filterSection: { marginBottom: 32 },
  filterLabel: { fontSize: 16, fontFamily: COLORS.fontExtraBold, color: COLORS.text, marginBottom: 16 },
  filterGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  filterChip: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20, backgroundColor: "#F9FAFB", borderWidth: 1.5, borderColor: "transparent" },
  filterChipActive: { backgroundColor: COLORS.purpleBg, borderColor: COLORS.purple },
  filterChipText: { fontSize: 14, fontFamily: COLORS.fontBold, color: COLORS.muted },
  filterChipTextActive: { color: COLORS.purple },
  radiusHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  radiusValueBadge: { backgroundColor: COLORS.purple, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  radiusValueText: { color: "#fff", fontSize: 12, fontFamily: COLORS.fontExtraBold },
  sliderContainer: { height: 40, justifyContent: "center" },
  sliderTrack: { height: 8, backgroundColor: "#F3F4F6", borderRadius: 4, position: "relative" },
  sliderFill: { height: 8, backgroundColor: COLORS.purple, borderRadius: 4 },
  sliderThumb: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#fff", position: "absolute", top: -10, borderWidth: 3, borderColor: COLORS.purple, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, marginLeft: -14 },
  sliderLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  sliderLimit: { fontSize: 12, fontFamily: COLORS.fontBold, color: COLORS.lightMuted },
  calendarHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  selectedCount: { fontSize: 12, fontFamily: COLORS.fontBold, color: COLORS.purple },
  calendarBox: { padding: 20, borderRadius: 24, backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: COLORS.border },
  calMonthHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  calNav: { flexDirection: "row", gap: 16 },
  calendarMonth: { fontSize: 15, fontFamily: COLORS.fontExtraBold, color: COLORS.text },
  calGrid: { flexDirection: "row", flexWrap: "wrap", rowGap: 8 },
  calDayLabel: { width: "14.28%", textAlign: "center", fontSize: 10, fontFamily: COLORS.fontBold, color: COLORS.lightMuted, marginBottom: 8 },
  calDay: { width: "14.28%", height: 40, alignItems: "center", justifyContent: "center", borderRadius: 12 },
  calDayActive: { backgroundColor: COLORS.purple, shadowColor: COLORS.purple, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  calDayDisabled: { opacity: 0.3 },
  calDayText: { fontSize: 14, fontFamily: COLORS.fontBold, color: COLORS.text },
  calDayTextActive: { color: "#fff" },
  calDayDisabledText: { color: COLORS.lightMuted, textDecorationLine: "line-through" },
  filterNotice: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#F9FAFB", padding: 16, borderRadius: 16, marginTop: 10 },
  filterNoticeText: { flex: 1, fontSize: 12, fontFamily: COLORS.font, color: COLORS.muted, lineHeight: 18 },
  applyBtn: { backgroundColor: COLORS.purple, borderRadius: 20, paddingVertical: 20, alignItems: "center", shadowColor: COLORS.purple, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
  applyBtnText: { color: "#fff", fontSize: 16, fontFamily: COLORS.fontExtraBold },
  highlightCardLarge: { flex: 1.2, borderRadius: 32, backgroundColor: "#6366F1", padding: 20, justifyContent: "space-between", height: 200 },
  highlightTitle: { color: "#fff", fontSize: 18, fontFamily: COLORS.fontExtraBold },
  highlightSub: { color: "#fff", fontSize: 12, fontFamily: COLORS.font, opacity: 0.8, marginTop: 4 },
  joinGroupBtn: { backgroundColor: "#fff", borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, alignSelf: "flex-start" },
  joinGroupText: { color: COLORS.purple, fontSize: 12, fontFamily: COLORS.fontExtraBold },
  highlightCol: { flex: 1, gap: 12 },
  highlightSmall: { flex: 1, borderRadius: 24, backgroundColor: "#E0E7FF", padding: 15, justifyContent: "space-between" },
  smallLabel: { fontSize: 10, fontFamily: COLORS.fontExtraBold, color: COLORS.purple },
  pulseAvatars: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#C7D2FE", borderWidth: 2, borderColor: "#E0E7FF", marginLeft: -8 },
  avatarPlus: { fontSize: 10, fontFamily: COLORS.fontBold, color: COLORS.purple, marginLeft: 6 },
  highlightMap: { flex: 1, borderRadius: 24, backgroundColor: "#38BDF8", padding: 15 },
  mapIconBox: { width: 32, height: 32, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  mapLabel: { color: "#fff", fontSize: 14, fontFamily: COLORS.fontExtraBold },
  mapSub: { color: "#fff", fontSize: 10, fontFamily: COLORS.fontBold, opacity: 0.8 },
  fab: { position: "absolute", bottom: 30, right: 20, width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.purple, alignItems: "center", justifyContent: "center", shadowColor: COLORS.purple, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 6 } },
});
