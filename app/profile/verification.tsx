import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  ActivityIndicator, Alert, SafeAreaView, Dimensions,
  Platform
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { CameraView, useCameraPermissions } from "expo-camera";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import Constants from "expo-constants";
import { apiFetch } from "../../lib/apiFetch";
import { generateReactNativeHelpers } from "@uploadthing/expo";

const UT_ENDPOINT = (Constants.expoConfig?.extra as any)?.apiBaseUrl
  ? `${(Constants.expoConfig?.extra as any).apiBaseUrl.replace(/\/$/, "")}/api/uploadthing`
  : undefined;

const { useImageUploader, useUploadThing } = generateReactNativeHelpers({
  url: UT_ENDPOINT || "http://localhost:3000/api/uploadthing",
});

const { width: W } = Dimensions.get("window");
const CIRCLE_SIZE = W * 0.75;

export default function VerificationScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [faceDetected, setFaceDetected] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const cameraRef = useRef<any>(null);

  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const { startUpload } = useUploadThing("profilePhotos", {
    headers: {
      ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
      ...(userId ? { "x-clerk-user-id": userId } : {}),
      "ngrok-skip-browser-warning": "1",
    },
    onUploadBegin() {
      console.log("🟦 [UT] Uploading selfie...");
    },
    onClientUploadComplete(res) {
      console.log("🟩 [UT] Upload complete:", res);
    },
    onUploadError(e) {
      console.error("🟥 [UT] Upload error details:", JSON.stringify(e, null, 2));
      Alert.alert("Upload Error", e.message || "Unknown upload error");
    }
  });

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  useEffect(() => {
    async function checkVerificationStatus() {
      if (!userId || !API_BASE) return;
      try {
        const url = `${API_BASE.replace(/\/$/, "")}/api/users/get-user?clerkUserId=${userId}`;
        const res = await apiFetch(url, {
          headers: EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {},
        });
        const json = await res.json();
        const v = json?.user?.verification;
        if (v?.idVerified) {
          Alert.alert("Already Verified", "You have already completed identity verification.", [
            { text: "OK", onPress: () => router.back() }
          ]);
        } else if (v?.status === "pending") {
          setVerificationStatus("pending");
        } else if (v?.status === "rejected") {
          setVerificationStatus("rejected");
          setRejectionReason(v?.rejectionReason || "Documents could not be verified.");
        }
      } catch (e) {
        console.error("Error checking verification status:", e);
      } finally {
        setCheckingStatus(false);
      }
    }
    checkVerificationStatus();
  }, [userId, API_BASE]);

  // Simulate face detection after a short delay for stability
  useEffect(() => {
    let timer: any;
    if (permission?.granted && !capturedImage) {
      setFaceDetected(false);
      timer = setTimeout(() => {
        setFaceDetected(true);
      }, 1800); // 1.8 seconds scanning animation before "detection"
    }
    return () => clearTimeout(timer);
  }, [permission, capturedImage]);

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.5,
          base64: false,
        });
        setCapturedImage(photo.uri);
      } catch (e) {
        Alert.alert("Error", "Failed to capture photo.");
      }
    }
  };

  const handleVerify = async () => {
    if (!capturedImage) return;
    if (!userId || !API_BASE) return;

    setLoading(true);
    try {
      console.log("🟦 [Verification] Preparing upload for:", capturedImage);
      
      // Ensure URI has file:// prefix if it doesn't (sometimes needed on Android)
      const cleanUri = capturedImage.startsWith("file://") ? capturedImage : `file://${capturedImage}`;
      
      // 1. Upload the image to UploadThing
      const fileToUpload = {
        uri: cleanUri,
        name: `selfie_${userId || "unknown"}_${Date.now()}.jpg`,
        type: "image/jpeg",
        size: 1024 * 500, // Dummy size (500KB) as expo-camera doesn't provide it
      };

      console.log("🟦 [Verification] Calling startUpload with:", JSON.stringify(fileToUpload));
      const uploadRes = await startUpload([fileToUpload as any]);
      console.log("🟦 [Verification] startUpload response:", JSON.stringify(uploadRes));

      if (!uploadRes || uploadRes.length === 0) {
        throw new Error("Upload response was empty. Please check your internet and try again.");
      }

      const selfieUrl = uploadRes[0].url;

      // 2. Submit to backend
      const url = `${API_BASE.replace(/\/$/, "")}/api/profile/verify`;
      const res = await apiFetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
        },
        body: JSON.stringify({ clerkUserId: userId, selfieUrl }),
      });

      if (res.ok) {
        setVerificationStatus("pending");
        Alert.alert("Submitted", "Your verification request has been submitted and is pending review.", [
          { text: "OK", onPress: () => router.back() }
        ]);
      } else {
        throw new Error("Failed to submit verification. Please try again.");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!permission || checkingStatus) {
    return <View style={S.center}><ActivityIndicator size="large" color="#6C63FF" /></View>;
  }

  if (!permission.granted) {
    return (
      <View style={S.center}>
        <Ionicons name="camera-outline" size={64} color="#CCC" style={{ marginBottom: 20 }} />
        <Text style={S.permTxt}>Camera permission is required for identity verification.</Text>
        <TouchableOpacity style={S.permBtn} onPress={requestPermission}>
          <Text style={S.permBtnTxt}>Enable Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (verificationStatus === "pending") {
    return (
      <SafeAreaView style={S.container}>
        <View style={S.header}>
          <TouchableOpacity onPress={() => router.back()} style={S.backBtn}>
            <Ionicons name="close" size={24} color="#111" />
          </TouchableOpacity>
          <Text style={S.headerTitle}>Status</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={[S.center, { paddingHorizontal: 40 }]}>
          <MotiView
            from={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring" }}
            style={S.pendingIconWrap}
          >
            <Ionicons name="time" size={80} color="#6C63FF" />
          </MotiView>
          <Text style={[S.title, { marginTop: 30 }]}>Verification Pending</Text>
          <Text style={[S.subtitle, { marginTop: 10 }]}>
            We've received your selfie. Our team is currently reviewing your identity. This usually takes less than 24 hours.
          </Text>
          <TouchableOpacity style={[S.permBtn, { marginTop: 40, width: "100%" }]} onPress={() => router.back()}>
            <Text style={S.permBtnTxt}>Got it</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (verificationStatus === "rejected") {
    return (
      <SafeAreaView style={S.container}>
        <View style={S.header}>
          <TouchableOpacity onPress={() => router.back()} style={S.backBtn}>
            <Ionicons name="close" size={24} color="#111" />
          </TouchableOpacity>
          <Text style={S.headerTitle}>Status</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={[S.center, { paddingHorizontal: 40 }]}>
          <Ionicons name="alert-circle" size={80} color="#EF4444" />
          <Text style={[S.title, { marginTop: 30 }]}>Verification Failed</Text>
          <Text style={[S.subtitle, { marginTop: 10, color: "#EF4444", fontWeight: "700" }]}>
            Reason: {rejectionReason}
          </Text>
          <Text style={[S.subtitle, { marginTop: 10 }]}>
            Please try again with a clearer photo where your face is fully visible.
          </Text>
          <TouchableOpacity 
            style={[S.permBtn, { marginTop: 40, width: "100%", backgroundColor: "#EF4444" }]} 
            onPress={() => setVerificationStatus(null)}
          >
            <Text style={S.permBtnTxt}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={S.container}>
      <View style={S.header}>
        <TouchableOpacity onPress={() => router.back()} style={S.backBtn}>
          <Ionicons name="close" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Selfie Verification</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={S.content}>
        <View style={S.infoBox}>
          <Text style={S.title}>Face Verification</Text>
          <Text style={S.subtitle}>
            Position your face inside the circle. The scanning process will complete automatically.
          </Text>
        </View>

        <View style={S.cameraWrapper}>
          <View style={[S.cameraCircle, faceDetected && S.cameraCircleSuccess, capturedImage && S.cameraCircleCaptured]}>
            {capturedImage ? (
              <Image source={{ uri: capturedImage }} style={S.previewImage} />
            ) : (
              <CameraView
                style={S.camera}
                facing="front"
                ref={cameraRef}
              >
                <View style={S.overlay}>
                  {!faceDetected && (
                    <MotiView
                      from={{ translateY: -CIRCLE_SIZE / 2 }}
                      animate={{ translateY: CIRCLE_SIZE / 2 }}
                      transition={{ loop: true, duration: 2000, type: "timing" }}
                      style={S.scanningLine}
                    >
                      <LinearGradient
                        colors={["transparent", "#6C63FF", "transparent"]}
                        style={S.scanGradient}
                      />
                    </MotiView>
                  )}
                </View>
              </CameraView>
            )}
          </View>
          
          {faceDetected && !capturedImage && (
            <MotiView
              from={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={S.successIndicator}
            >
              <Ionicons name="checkmark-circle" size={40} color="#22C55E" />
            </MotiView>
          )}
        </View>

        <View style={S.actions}>
          {!capturedImage ? (
            <TouchableOpacity 
              style={[S.captureBtn, !faceDetected && S.disabledBtn]} 
              onPress={takePicture}
              disabled={!faceDetected}
            >
              <View style={S.captureBtnInner} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={S.retakeBtn} onPress={() => setCapturedImage(null)}>
              <Ionicons name="refresh" size={18} color="#6C63FF" />
              <Text style={S.retakeTxt}>Retake Selfie</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={S.footer}>
        <TouchableOpacity
          style={[S.verifyBtn, (!capturedImage || loading) && S.disabledBtn]}
          onPress={handleVerify}
          disabled={!capturedImage || loading}
        >
          <LinearGradient
            colors={!capturedImage || loading ? ["#E5E7EB", "#D1D5DB"] : ["#6C63FF", "#4F46E5"]}
            style={S.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={S.verifyBtnTxt}>{isVerifying ? "Verifying Identity..." : "Confirm Verification"}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F3F4F6"
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 17, fontWeight: "800", color: "#111" },
  content: { flex: 1, alignItems: "center", paddingTop: 30 },
  infoBox: { alignItems: "center", marginBottom: 30, paddingHorizontal: 40 },
  title: { fontSize: 24, fontWeight: "900", color: "#111", marginBottom: 10 },
  subtitle: { fontSize: 14, color: "#6B7280", textAlign: "center", lineHeight: 20 },
  
  cameraWrapper: { width: CIRCLE_SIZE, height: CIRCLE_SIZE, position: "relative" },
  cameraCircle: {
    width: CIRCLE_SIZE, height: CIRCLE_SIZE, borderRadius: CIRCLE_SIZE / 2,
    overflow: "hidden", borderWidth: 4, borderColor: "#F3F4F6", backgroundColor: "#000",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5
  },
  cameraCircleSuccess: { borderColor: "#22C55E" },
  cameraCircleCaptured: { borderColor: "#6C63FF" },
  camera: { flex: 1 },
  previewImage: { width: "100%", height: "100%" },
  overlay: { flex: 1, backgroundColor: "transparent", justifyContent: "center" },
  
  scanningLine: {
    position: "absolute", top: "50%", left: 0, right: 0, height: 2, zIndex: 10
  },
  scanGradient: { width: "100%", height: 120, marginTop: -60 },
  
  successIndicator: {
    position: "absolute", bottom: -10, right: 10, zIndex: 30,
    backgroundColor: "#FFF", borderRadius: 20, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 5, elevation: 3
  },
  
  actions: { marginTop: 40, alignItems: "center" },
  captureBtn: {
    width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: "#6C63FF",
    justifyContent: "center", alignItems: "center", padding: 6
  },
  captureBtnInner: { flex: 1, alignSelf: "stretch", borderRadius: 40, backgroundColor: "#6C63FF" },
  disabledBtn: { opacity: 0.4 },
  
  retakeBtn: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12 },
  retakeTxt: { color: "#6C63FF", fontSize: 15, fontWeight: "700" },
  
  footer: { padding: 24, paddingBottom: 40 },
  verifyBtn: { height: 56, borderRadius: 16, overflow: "hidden" },
  gradient: { flex: 1, justifyContent: "center", alignItems: "center" },
  verifyBtnTxt: { color: "#fff", fontSize: 16, fontWeight: "800" },
  
  permTxt: { fontSize: 15, color: "#6B7280", textAlign: "center", marginBottom: 24, lineHeight: 22 },
  permBtn: { backgroundColor: "#6C63FF", paddingHorizontal: 30, paddingVertical: 14, borderRadius: 12 },
  permBtnTxt: { color: "#fff", fontWeight: "700" },
  pendingIconWrap: {
    width: 140, height: 140, borderRadius: 70, backgroundColor: "#F3F4FF",
    justifyContent: "center", alignItems: "center"
  }
});
