import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, Image, Pressable, Animated,
  StyleSheet, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, ScrollView
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";
import { useAuth } from "@clerk/clerk-expo";
import { generateReactNativeHelpers } from "@uploadthing/expo";

// ─────────────────────────────────────────────
//  DESIGN TOKENS (Local to Modal)
// ─────────────────────────────────────────────
const C = {
  bg:          "#FFFBF5",
  card:        "#FFFFFF",
  cardBorder:  "#F0EBE3",
  inputBg:     "#FAF7F2",
  inputBorder: "#E8E0D5",
  ink:         "#1C1A17",
  muted:       "#8A8278",
  hint:        "#BCB6AD",
  amber:       "#F59E0B",
  amberBg:     "#FFFBEB",
  amberText:   "#92400E",
  coral:       "#FF6F6F",
  coralBg:     "#FFF0F0",
  coralText:   "#C0392B",
};
const R = { card: 20, input: 14, pill: 999 };

interface RatingModalProps {
  visible: boolean;
  onClose: () => void;
  event: any;
}

export default function RatingModal({ visible, onClose, event }: RatingModalProps) {
  const { userId } = useAuth();
  const API_BASE      = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;
  const UT_ENDPOINT   = API_BASE ? `${API_BASE.replace(/\/$/, "")}/api/uploadthing` : undefined;

  const { uploadFiles } = generateReactNativeHelpers({
    url: UT_ENDPOINT || "http://localhost:3000/api/uploadthing",
  });

  const [stars,     setStars]     = useState(0);
  const [comment,   setComment]   = useState("");
  const [images,    setImages]    = useState<string[]>([]); // local URIs
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const starAnims = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(1))).current;
  const slideY    = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideY, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 180 }).start();
    } else {
      slideY.setValue(600);
      setStars(0); setComment(""); setSubmitted(false); setImages([]);
    }
  }, [visible]);

  const pressStar = (i: number) => {
    setStars(i + 1);
    Animated.sequence([
      Animated.timing(starAnims[i], { toValue: 1.4, duration: 120, useNativeDriver: true }),
      Animated.timing(starAnims[i], { toValue: 1.0, duration: 120, useNativeDriver: true }),
    ]).start();
  };

  const pickImages = async () => {
    if (images.length >= 6) {
      Alert.alert("Limit Reached", "You can upload up to 6 photos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
      selectionLimit: 6 - images.length,
    });

    if (!result.canceled) {
      const newUris = result.assets.map(a => a.uri);
      setImages(prev => [...prev, ...newUris].slice(0, 6));
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    if (images.length === 0) return [];
    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      const filesToUpload = images.map((uri, idx) => ({
        uri,
        name: `review_${Date.now()}_${idx}.jpg`,
        type: "image/jpeg"
      }));

      const res = await uploadFiles("imageUploader", {
        files: filesToUpload as any,
        headers: {
          "x-api-key": EVENT_API_KEY || "",
          "x-clerk-user-id": userId || "",
        }
      });
      
      if (res && Array.isArray(res)) {
        res.forEach((r: any) => {
          if (r.url) uploadedUrls.push(r.url);
        });
      }
    } catch (err) {
      console.error("Upload failed", err);
    }
    
    setUploading(false);
    return uploadedUrls;
  };

  const submit = async () => {
    if (stars === 0 || !API_BASE || !userId) return;
    setLoading(true);

    try {
      const remoteUrls = await uploadImages();
      const res = await fetch(`${API_BASE}/api/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
        },
        body: JSON.stringify({
          hostId:     event.creatorClerkId,
          reviewerId: userId,
          eventId:    event._id,
          rating:     stars,
          comment:    comment.trim(),
          images:     remoteUrls,
        }),
      });
      const json = await res.json();
      if (res.ok || json?.alreadyRated) {
        setSubmitted(true);
        setTimeout(() => onClose(), 1800);
      } else {
        Alert.alert("Error", json?.error || "Could not submit rating. Try again.");
      }
    } catch (err) {
      console.error("Submit error:", err);
      Alert.alert("Error", "Network error. Please try again.");
    } finally { setLoading(false); }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={RT.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View style={[RT.sheet, { transform: [{ translateY: slideY }] }]}>
          <View style={RT.grabber} />

          {submitted ? (
            <View style={RT.successState}>
              <Text style={{ fontSize: 52 }}>🎉</Text>
              <Text style={RT.successTitle}>Thanks for rating!</Text>
              <Text style={RT.successSub}>Your feedback helps make the community better</Text>
            </View>
          ) : (
            <>
              <View style={RT.header}>
                <View style={RT.headerIcon}><Text style={{ fontSize: 26 }}>{event.emoji || "📍"}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={RT.headerTitle} numberOfLines={1}>{event.title}</Text>
                  <Text style={RT.headerSub}>Rate your experience</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={RT.closeBtn}>
                  <Text style={{ fontSize: 18, color: C.muted, fontWeight: "700" }}>×</Text>
                </TouchableOpacity>
              </View>

              <Text style={RT.starsLabel}>
                {stars === 0 ? "Tap to rate" : ["😞 Poor", "😐 Below average", "🙂 Average", "😊 Good", "🤩 Amazing!"][stars - 1]}
              </Text>
              <View style={RT.starsRow}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <TouchableOpacity key={i} onPress={() => pressStar(i)} activeOpacity={0.7}>
                    <Animated.Text style={[RT.star, { transform: [{ scale: starAnims[i] }] }]}>
                      {i < stars ? "⭐" : "☆"}
                    </Animated.Text>
                  </TouchableOpacity>
                ))}
              </View>

               <TextInput
                style={RT.input}
                placeholder="Share your experience (optional)..."
                placeholderTextColor={C.hint}
                multiline
                maxLength={200}
                value={comment}
                onChangeText={setComment}
              />
              <Text style={RT.charCount}>{comment.length}/200</Text>

              <View style={RT.imageSection}>
                <View style={RT.imageHeader}>
                  <Text style={RT.imageTitle}>Add Photos</Text>
                  <Text style={RT.imageLimit}>{images.length}/6</Text>
                </View>
                
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={RT.imageScroll}>
                  {images.length < 6 && (
                    <TouchableOpacity onPress={pickImages} style={RT.addPhotoBtn}>
                      <Ionicons name="camera-outline" size={24} color={C.muted} />
                      <Text style={RT.addPhotoText}>Add</Text>
                    </TouchableOpacity>
                  )}
                  {images.map((uri, idx) => (
                    <View key={idx} style={RT.imagePreview}>
                      <Image source={{ uri }} style={RT.previewImg} />
                      <TouchableOpacity onPress={() => removeImage(idx)} style={RT.removeImgBtn}>
                        <Ionicons name="close-circle" size={20} color={C.coral} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>

              <TouchableOpacity
                onPress={submit}
                activeOpacity={0.85}
                disabled={stars === 0 || loading || uploading}
                style={[RT.submitBtn, (stars === 0 || loading || uploading) && { opacity: 0.5 }]}
              >
                {loading || uploading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={RT.submitText}>Submit Rating</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const RT = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(28,26,23,0.65)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingHorizontal: 24, paddingBottom: 44,
    borderTopWidth: 1.5, borderColor: C.cardBorder,
  },
  grabber: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: C.inputBorder, alignSelf: "center",
    marginTop: 12, marginBottom: 24,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 24 },
  headerIcon: {
    width: 50, height: 50, borderRadius: 15,
    backgroundColor: C.amberBg, borderWidth: 1.5, borderColor: C.amber + "55",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 16, fontWeight: "900", color: C.ink, letterSpacing: -0.3 },
  headerSub:   { fontSize: 12, color: C.muted, fontWeight: "600", marginTop: 2 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.inputBorder,
    alignItems: "center", justifyContent: "center",
  },
  starsLabel: { textAlign: "center", fontSize: 14, fontWeight: "700", color: C.muted, marginBottom: 16, height: 20 },
  starsRow:   { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 24 },
  star:       { fontSize: 38 },
  input: {
    backgroundColor: C.inputBg, borderRadius: R.input, borderWidth: 1.5, borderColor: C.inputBorder,
    padding: 14, color: C.ink, fontSize: 14, fontWeight: "600", minHeight: 80,
    textAlignVertical: "top", marginBottom: 6,
  },
  charCount: { textAlign: "right", color: C.hint, fontSize: 11, fontWeight: "600", marginBottom: 20 },
  submitBtn: {
    height: 54, borderRadius: R.pill, backgroundColor: C.amber,
    alignItems: "center", justifyContent: "center",
    shadowColor: C.amber, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 6,
  },
  submitText: { color: "#FFF", fontSize: 16, fontWeight: "900" },
  imageSection: { marginBottom: 20 },
  imageHeader:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  imageTitle:   { fontSize: 13, fontWeight: "800", color: C.ink, textTransform: "uppercase", letterSpacing: 0.5 },
  imageLimit:   { fontSize: 12, fontWeight: "700", color: C.hint },
  imageScroll:  { gap: 12 },
  addPhotoBtn: {
    width: 70, height: 70, borderRadius: 16,
    backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.inputBorder, borderStyle: "dashed",
    alignItems: "center", justifyContent: "center",
  },
  addPhotoText: { fontSize: 10, fontWeight: "800", color: C.muted, marginTop: 4 },
  imagePreview: { width: 70, height: 70, borderRadius: 16, overflow: "hidden" },
  previewImg:   { width: "100%", height: "100%" },
  removeImgBtn: { position: "absolute", top: 2, right: 2, backgroundColor: "#FFF", borderRadius: 10 },
  successState: { alignItems: "center", paddingVertical: 40, gap: 12 },
  successTitle: { color: C.ink, fontSize: 22, fontWeight: "900" },
  successSub:   { color: C.muted, fontSize: 14, fontWeight: "600", textAlign: "center" },
});
