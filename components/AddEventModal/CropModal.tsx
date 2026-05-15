// components/AddEventModal/CropModal.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  Modal, View, Text, StyleSheet, Pressable, ActivityIndicator,
  useWindowDimensions, Animated, Image, Alert,
} from "react-native";
import {
  GestureHandlerRootView,
  PanGestureHandler,
  PinchGestureHandler,
  State,
} from "react-native-gesture-handler";
import * as ImageManipulator from "expo-image-manipulator";
import Ionicons from "@expo/vector-icons/Ionicons";

const ASPECT   = 16 / 9;
const MIN_SCALE = 1;
const MAX_SCALE = 5;

interface Props {
  visible: boolean;
  uri: string;
  imgW: number;
  imgH: number;
  onConfirm: (croppedUri: string, base64: string) => void;
  onCancel: () => void;
}

export function CropModal({ visible, uri, imgW, imgH, onConfirm, onCancel }: Props) {
  const { width: screenW } = useWindowDimensions();
  const FRAME_W = Math.floor(screenW - 32);
  const FRAME_H = Math.floor(FRAME_W / ASPECT);

  const [processing, setProcessing] = useState(false);

  // Cover scale: smallest scale where image fills frame
  const safeW = imgW > 0 ? imgW : 1;
  const safeH = imgH > 0 ? imgH : 1;
  const coverScale = Math.max(FRAME_W / safeW, FRAME_H / safeH);
  const natW = safeW * coverScale; // display width at scale=1
  const natH = safeH * coverScale;

  // ── Animated values ──────────────────────────────────────
  const scaleAnim = useRef(new Animated.Value(1)).current; // accumulated base scale
  const pinchAnim = useRef(new Animated.Value(1)).current; // live gesture multiplier
  const txAnim    = useRef(new Animated.Value(0)).current;
  const tyAnim    = useRef(new Animated.Value(0)).current;

  // Combined scale = scaleAnim × pinchAnim (both non-native so they can combine)
  const combinedScale = Animated.multiply(scaleAnim, pinchAnim);

  // ── Refs for current values (readable synchronously for crop math) ──
  const scaleRef  = useRef(1);
  const txRef     = useRef(0);
  const tyRef     = useRef(0);
  const baseTxRef = useRef(0);
  const baseTyRef = useRef(0);

  // Gesture handler refs (for simultaneousHandlers)
  const pinchRef = useRef<any>(null);
  const panRef   = useRef<any>(null);

  // Reset when modal opens
  useEffect(() => {
    if (!visible) return;
    scaleRef.current  = 1;
    txRef.current     = 0;
    tyRef.current     = 0;
    baseTxRef.current = 0;
    baseTyRef.current = 0;
    scaleAnim.setValue(1);
    pinchAnim.setValue(1);
    txAnim.setValue(0);
    tyAnim.setValue(0);
  }, [visible]);

  // ── Clamp helpers ────────────────────────────────────────
  const clampTx = (t: number, s: number) => {
    const max = Math.max(0, (natW * s - FRAME_W) / 2);
    return Math.min(max, Math.max(-max, t));
  };
  const clampTy = (t: number, s: number) => {
    const max = Math.max(0, (natH * s - FRAME_H) / 2);
    return Math.min(max, Math.max(-max, t));
  };

  // ── Pinch gesture ────────────────────────────────────────
  const onPinchEvent = Animated.event(
    [{ nativeEvent: { scale: pinchAnim } }],
    { useNativeDriver: false },
  );

  const onPinchStateChange = (e: any) => {
    if (e.nativeEvent.oldState !== State.ACTIVE) return;
    const next = Math.min(Math.max(scaleRef.current * e.nativeEvent.scale, MIN_SCALE), MAX_SCALE);
    scaleRef.current = next;
    scaleAnim.setValue(next);
    pinchAnim.setValue(1);
    // re-clamp translate at new scale
    const cx = clampTx(txRef.current, next);
    const cy = clampTy(tyRef.current, next);
    txRef.current = cx; tyRef.current = cy;
    baseTxRef.current = cx; baseTyRef.current = cy;
    txAnim.setValue(cx); tyAnim.setValue(cy);
  };

  // ── Pan gesture ──────────────────────────────────────────
  const onPanEvent = (e: any) => {
    const { translationX, translationY, state } = e.nativeEvent;
    if (state !== State.ACTIVE && state !== State.BEGAN) return;
    const s = scaleRef.current;
    const cx = clampTx(baseTxRef.current + translationX, s);
    const cy = clampTy(baseTyRef.current + translationY, s);
    txRef.current = cx; tyRef.current = cy;
    txAnim.setValue(cx); tyAnim.setValue(cy);
  };

  const onPanStateChange = (e: any) => {
    if (e.nativeEvent.oldState !== State.ACTIVE) return;
    baseTxRef.current = txRef.current;
    baseTyRef.current = tyRef.current;
  };

  // ── ± Zoom buttons ───────────────────────────────────────
  const adjustZoom = (dir: "in" | "out") => {
    const next = dir === "in"
      ? Math.min(scaleRef.current * 1.35, MAX_SCALE)
      : Math.max(scaleRef.current / 1.35, MIN_SCALE);
    scaleRef.current = next;
    Animated.spring(scaleAnim, { toValue: next, useNativeDriver: false, damping: 16, stiffness: 180 }).start();
    const cx = clampTx(txRef.current, next);
    const cy = clampTy(tyRef.current, next);
    txRef.current = cx; tyRef.current = cy;
    baseTxRef.current = cx; baseTyRef.current = cy;
    Animated.spring(txAnim, { toValue: cx, useNativeDriver: false, damping: 16 }).start();
    Animated.spring(tyAnim, { toValue: cy, useNativeDriver: false, damping: 16 }).start();
  };

  // ── Crop ────────────────────────────────────────────────
  const handleCrop = async () => {
    setProcessing(true);
    try {
      const s   = scaleRef.current;
      const txV = txRef.current;
      const tyV = tyRef.current;

      const pxPerScreen = safeW / (natW * s);
      const cropX = Math.max(0, (natW * s / 2 - FRAME_W / 2 - txV) * pxPerScreen);
      const cropY = Math.max(0, (natH * s / 2 - FRAME_H / 2 - tyV) * pxPerScreen);
      const cropW = Math.min(FRAME_W * pxPerScreen, safeW - cropX);
      const cropH = Math.min(FRAME_H * pxPerScreen, safeH - cropY);

      console.log("[CropModal] scale:", s.toFixed(2), "tx:", txV.toFixed(1), "ty:", tyV.toFixed(1));
      console.log("[CropModal] crop region px:", Math.round(cropX), Math.round(cropY), Math.round(cropW), "×", Math.round(cropH));

      const result = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            crop: {
              originX: Math.round(cropX),
              originY: Math.round(cropY),
              width:   Math.max(1, Math.round(cropW)),
              height:  Math.max(1, Math.round(cropH)),
            },
          },
          { resize: { width: 1200 } },
        ],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG, base64: true },
      );

      console.log("[CropModal] manipulate done, uri:", result.uri, "base64 length:", result.base64?.length ?? 0);

      if (!result.base64) throw new Error("ImageManipulator returned no base64 data");
      onConfirm(result.uri, result.base64);
    } catch (err: any) {
      console.error("[CropModal] crop error:", err?.message ?? err);
      Alert.alert("Crop Failed", err?.message || "Failed to process image. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <GestureHandlerRootView style={css.root}>

        {/* Header */}
        <View style={css.header}>
          <Pressable style={css.headerBtn} onPress={onCancel} hitSlop={12}>
            <Ionicons name="close" size={20} color="#fff" />
          </Pressable>
          <Text style={css.headerTitle}>Adjust Photo</Text>
          <View style={{ width: 44 }} />
        </View>

        <Text style={css.hint}>Pinch to zoom · drag to reposition</Text>

        {/* Crop frame */}
        <View style={[css.frame, { width: FRAME_W, height: FRAME_H }]}>
          <PanGestureHandler
            ref={panRef}
            simultaneousHandlers={[pinchRef]}
            onGestureEvent={onPanEvent}
            onHandlerStateChange={onPanStateChange}
            minDist={1}
          >
            <Animated.View style={css.gestureArea}>
              <PinchGestureHandler
                ref={pinchRef}
                simultaneousHandlers={[panRef]}
                onGestureEvent={onPinchEvent}
                onHandlerStateChange={onPinchStateChange}
              >
                <Animated.View
                  style={[
                    {
                      width: natW,
                      height: natH,
                      position: "absolute",
                      top:  (FRAME_H - natH) / 2,
                      left: (FRAME_W - natW) / 2,
                    },
                    {
                      transform: [
                        { translateX: txAnim },
                        { translateY: tyAnim },
                        { scale: combinedScale },
                      ],
                    },
                  ]}
                >
                  <Image
                    source={{ uri }}
                    style={{ width: natW, height: natH }}
                    resizeMode="cover"
                  />
                </Animated.View>
              </PinchGestureHandler>
            </Animated.View>
          </PanGestureHandler>

          {/* Corner bracket guides (non-interactive) */}
          <View style={[css.corner, css.tl]} pointerEvents="none" />
          <View style={[css.corner, css.tr]} pointerEvents="none" />
          <View style={[css.corner, css.bl]} pointerEvents="none" />
          <View style={[css.corner, css.br]} pointerEvents="none" />

          {/* Rule-of-thirds grid */}
          <View pointerEvents="none" style={css.g1h} />
          <View pointerEvents="none" style={css.g2h} />
          <View pointerEvents="none" style={css.g1v} />
          <View pointerEvents="none" style={css.g2v} />
        </View>

        {/* Zoom controls */}
        <View style={css.zoomRow}>
          <Pressable style={css.zoomBtn} onPress={() => adjustZoom("out")} hitSlop={10}>
            <Ionicons name="remove" size={26} color="#fff" />
          </Pressable>
          <View style={css.zoomPill}>
            <Ionicons name="search-outline" size={13} color="rgba(255,255,255,0.45)" />
            <Text style={css.zoomLabel}>Zoom</Text>
          </View>
          <Pressable style={css.zoomBtn} onPress={() => adjustZoom("in")} hitSlop={10}>
            <Ionicons name="add" size={26} color="#fff" />
          </Pressable>
        </View>

        {/* Confirm */}
        <Pressable
          style={[css.confirmBtn, processing && { opacity: 0.6 }]}
          onPress={handleCrop}
          disabled={processing}
        >
          {processing
            ? <ActivityIndicator color="#fff" size="small" />
            : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={css.confirmTxt}>Crop &amp; Use Photo</Text>
              </>
            )
          }
        </Pressable>

        <Pressable onPress={onCancel} style={css.cancelLink} hitSlop={8}>
          <Text style={css.cancelLinkTxt}>Cancel</Text>
        </Pressable>

      </GestureHandlerRootView>
    </Modal>
  );
}

const css = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0C0C0E",
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 40,
  },

  header: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
  },
  headerBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17, fontWeight: "800", color: "#fff", letterSpacing: -0.3,
  },

  hint: {
    fontSize: 12, color: "rgba(255,255,255,0.38)",
    fontWeight: "600", letterSpacing: 0.2, marginBottom: 18,
  },

  frame: {
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: "#111",
  },
  gestureArea: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
  },

  // Corner bracket guides
  corner: {
    position: "absolute",
    width: 22, height: 22,
    borderColor: "#fff", borderWidth: 2.5,
  },
  tl: { top: 0,    left: 0,   borderRightWidth: 0,  borderBottomWidth: 0, borderTopLeftRadius:     3 },
  tr: { top: 0,    right: 0,  borderLeftWidth: 0,   borderBottomWidth: 0, borderTopRightRadius:    3 },
  bl: { bottom: 0, left: 0,   borderRightWidth: 0,  borderTopWidth: 0,    borderBottomLeftRadius:  3 },
  br: { bottom: 0, right: 0,  borderLeftWidth: 0,   borderTopWidth: 0,    borderBottomRightRadius: 3 },

  // Rule-of-thirds
  g1h: { position: "absolute", left: 0, right: 0, top: "33.33%",  height: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.20)" },
  g2h: { position: "absolute", left: 0, right: 0, top: "66.66%",  height: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.20)" },
  g1v: { position: "absolute", top: 0, bottom: 0, left: "33.33%", width:  StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.20)" },
  g2v: { position: "absolute", top: 0, bottom: 0, left: "66.66%", width:  StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.20)" },

  // Zoom controls
  zoomRow: {
    flexDirection: "row", alignItems: "center",
    gap: 20, marginTop: 28,
  },
  zoomBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  zoomPill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 22, paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.07)",
    minWidth: 100, justifyContent: "center",
  },
  zoomLabel: {
    fontSize: 13, fontWeight: "700",
    color: "rgba(255,255,255,0.45)", letterSpacing: 0.4,
  },

  // Confirm
  confirmBtn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#6366F1",
    paddingHorizontal: 36, paddingVertical: 16,
    borderRadius: 999, marginTop: 28,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45, shadowRadius: 20,
    elevation: 10,
  },
  confirmTxt: {
    fontSize: 16, fontWeight: "800", color: "#fff",
  },

  cancelLink: { marginTop: 16, padding: 8 },
  cancelLinkTxt: {
    fontSize: 14, fontWeight: "600",
    color: "rgba(255,255,255,0.32)",
  },
});
