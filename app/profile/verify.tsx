import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useAuth } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { apiFetch } from "../../lib/apiFetch";

const STORAGE_KEY = "@profile";

export default function VerifyScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const [status, setStatus] = useState<"unverified" | "pending" | "verified" | "rejected">("unverified");
  const [loading, setLoading] = useState(false);
  
  // Camera specific state
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const [isReadyToCapture, setIsReadyToCapture] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const profile = JSON.parse(raw);
          setStatus(profile.verificationStatus || "unverified");
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  // Fake "scanning" effect
  useEffect(() => {
    if (status === "unverified" || status === "rejected") {
      if (permission?.granted) {
        // Start scanning animation
        const timer = setTimeout(() => {
          setIsReadyToCapture(true);
          Animated.timing(borderAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: false,
          }).start();
        }, 2000); // 2 seconds scan
        return () => clearTimeout(timer);
      }
    }
  }, [status, permission]);

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo && photo.uri) {
        await uploadSelfie(photo.uri, "selfie.jpg", "image/jpeg");
      }
    } catch (e) {
      Alert.alert("Camera Error", "Failed to capture image.");
    }
  };

  const uploadSelfie = async (uri: string, fileName?: string | null, mimeType?: string) => {
    if (!API_BASE || !userId) {
      Alert.alert("Error", "Missing API Base or User ID");
      return;
    }

    setLoading(true);
    try {
      const url = `${API_BASE.replace(/\/$/, "")}/api/profile/verify?clerkUserId=${encodeURIComponent(userId)}`;
      const form = new FormData();
      form.append("file", {
        uri,
        name: fileName?.trim() || `selfie_${Date.now()}.jpg`,
        type: mimeType || "image/jpeg",
      } as any);

      const res = await apiFetch(url, {
        method: "POST",
        headers: {
          ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
        },
        body: form as any,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Failed with status ${res.status}`);
      }

      // Update local storage status
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const profile = JSON.parse(raw);
        profile.verificationStatus = "pending";
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      }

      setStatus("pending");
      Alert.alert("Success", "Your verification selfie has been submitted and is pending review.");
    } catch (e: any) {
      console.log(e);
      Alert.alert("Upload Failed", e.message || "Failed to upload your selfie.");
    } finally {
      setLoading(false);
    }
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#ccc", "#22c55e"], // gray to green
  });

  const renderContent = () => {
    if (status === "verified") {
      return (
        <View style={styles.center}>
          <Ionicons name="shield-checkmark" size={80} color="#22c55e" />
          <Text style={styles.title}>You are Verified!</Text>
          <Text style={styles.subtitle}>Your profile shows a verified badge to build trust.</Text>
        </View>
      );
    }
    if (status === "pending") {
      return (
        <View style={styles.center}>
          <Ionicons name="time-outline" size={80} color="#6C63FF" />
          <Text style={styles.title}>Verification Pending</Text>
          <Text style={styles.subtitle}>Our team is currently reviewing your verification request. This usually takes 24-48 hours.</Text>
        </View>
      );
    }

    if (!permission) {
      return <View />;
    }
    if (!permission.granted) {
      return (
        <View style={styles.center}>
          <Text style={{ textAlign: "center", marginBottom: 20 }}>We need your permission to show the camera</Text>
          <TouchableOpacity style={styles.btn} onPress={requestPermission}>
            <Text style={styles.btnText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.center}>
        <Text style={styles.title}>Verify Your Identity</Text>
        <Text style={styles.subtitle}>
          {status === "rejected"
            ? "Your previous verification was rejected. Please ensure your face is clearly visible."
            : "Align your face in the circle below."}
        </Text>

        <Animated.View style={[styles.cameraContainer, { borderColor }]}>
          <CameraView 
            ref={cameraRef}
            style={StyleSheet.absoluteFill} 
            facing="front" 
          />
        </Animated.View>

        <Text style={[styles.scanText, { color: isReadyToCapture ? "#22c55e" : "#666" }]}>
          {isReadyToCapture ? "Face aligned! Ready to capture." : "Scanning..."}
        </Text>

        <TouchableOpacity 
          style={[styles.btn, (!isReadyToCapture || loading) && styles.btnDisabled]} 
          onPress={handleCapture}
          disabled={!isReadyToCapture || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Capture Selfie</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verification</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {renderContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7F7F9",
  },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#111" },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 30,
  },
  cameraContainer: {
    width: 280,
    height: 280,
    borderRadius: 140,
    overflow: "hidden",
    borderWidth: 6,
    marginBottom: 20,
    backgroundColor: "#000",
  },
  scanText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 30,
  },
  btn: {
    backgroundColor: "#6C63FF",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 200,
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnDisabled: {
    backgroundColor: "#A5A1FF",
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
