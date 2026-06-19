import React, { useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

type Props = {
  visible: boolean;
  onClose: () => void;

  photos: string[];
  maxPhotos?: number;      // default 6
  minPhotos?: number;      // default 5

  // you implement these in Profile screen and pass in
  onUpload: () => Promise<void>;
  onDelete: (uri: string) => Promise<void>;
};

export default function PhotosManagerModal({
  visible,
  onClose,
  photos,
  maxPhotos = 6,
  minPhotos = 5,
  onUpload,
  onDelete,
}: Props) {
  const [busy, setBusy] = useState(false);

  const clean = useMemo(
    () => photos.filter((x) => typeof x === "string" && x.trim().length > 0),
    [photos]
  );

  const canUpload = clean.length < maxPhotos;
  const canDelete = clean.length > minPhotos;

  async function handleUpload() {
    if (!canUpload) return;
    try {
      setBusy(true);
      await onUpload();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(uri: string) {
    if (!canDelete) {
      Alert.alert("Keep at least 5 photos", "You can’t delete below 5 photos.");
      return;
    }

    Alert.alert("Delete photo?", "This will remove the photo from your profile.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setBusy(true);
            await onDelete(uri);
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Your Photos</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color="#111827" />
            </Pressable>
          </View>

          <Text style={styles.sub}>
            {clean.length}/{maxPhotos} photos • Minimum {minPhotos} required
          </Text>

          <View style={styles.actions}>
            <Pressable
              style={[styles.primaryBtn, !canUpload && styles.btnDisabled]}
              onPress={handleUpload}
              disabled={!canUpload || busy}
            >
              {busy ? (
                <ActivityIndicator />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
                  <Text style={styles.primaryTxt}>{canUpload ? "Upload Photo" : "Max Reached"}</Text>
                </>
              )}
            </Pressable>

            <View style={styles.hintPill}>
              <Ionicons name={canDelete ? "trash-outline" : "lock-closed-outline"} size={16} color="#FF4D6D" />
              <Text style={styles.hintTxt}>
                {canDelete ? "Delete enabled" : "Delete locked (keep 5)"}
              </Text>
            </View>
          </View>

          <FlatList
            data={clean}
            keyExtractor={(x) => x}
            numColumns={3}
            columnWrapperStyle={{ gap: 10 }}
            contentContainerStyle={{ paddingTop: 12, paddingBottom: 20, gap: 10 }}
            renderItem={({ item }) => (
              <View style={styles.tile}>
                <Image source={{ uri: item }} style={styles.img} />
                <Pressable
                  style={[styles.deleteBtn, !canDelete && styles.btnDisabled]}
                  onPress={() => handleDelete(item)}
                  disabled={!canDelete || busy}
                  hitSlop={10}
                >
                  <Ionicons name="trash" size={16} color="#fff" />
                </Pressable>
              </View>
            )}
            ListEmptyComponent={
              <View style={{ padding: 16 }}>
                <Text style={{ color: "#6B7280", fontWeight: "700" }}>No photos yet.</Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(2,6,23,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -10 },
  },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 18, fontWeight: "900", color: "#111827" },
  sub: { marginTop: 6, color: "#6B7280", fontWeight: "700" },

  actions: { marginTop: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "#FF4D6D",
    flex: 1,
  },
  primaryTxt: { color: "#fff", fontWeight: "900" },
  hintPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#FFF1F5",
    borderWidth: 1,
    borderColor: "#FFD1DC",
  },
  hintTxt: { color: "#111827", fontWeight: "800", fontSize: 12 },

  tile: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
  },
  img: { width: "100%", height: "100%" },
  deleteBtn: {
    position: "absolute",
    right: 8,
    top: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(239,68,68,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  btnDisabled: { opacity: 0.45 },
});