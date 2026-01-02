// components/add-event/steps/BasicsStep.tsx
import React, { useMemo, useRef, useState } from "react";
import { View, Text, TextInput, StyleSheet, Pressable } from "react-native";
import type { WizardState } from "../wizard/wizardTypes";
import type { WizardAction } from "../wizard/wizardReducer";

export default function BasicsStep({
  state,
  dispatch,
  emoji,
}: {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
  emoji: string;
}) {
  const [focus, setFocus] = useState<"title" | "desc" | null>(null);

  const titleRef = useRef<TextInput>(null);
  const descRef = useRef<TextInput>(null);

  const titleLen = (state.title || "").trim().length;
  const descLen = (state.description || "").trim().length;

  const helper = useMemo(() => {
    if (!titleLen && !descLen) return "Add a short title + a clear plan to continue.";
    if (!titleLen) return "Title is required.";
    if (!descLen) return "Description is required.";
    return "Looks good — you can continue.";
  }, [titleLen, descLen]);

  const helperTone =
    !titleLen || !descLen ? styles.helperWarn : styles.helperGood;

  return (
    <View style={styles.root}>
      {/* Title Field */}
      <Text style={styles.sectionLabel}>Title</Text>

      <Pressable
        onPressIn={() => titleRef.current?.focus()}
        style={[styles.field, focus === "title" && styles.fieldFocused]}
      >
        <View style={styles.emojiPill}>
          <Text style={styles.emoji}>{emoji}</Text>
        </View>

        <TextInput
          ref={titleRef}
          value={state.title}
          onChangeText={(t) => dispatch({ type: "SET", key: "title", value: t })}
          placeholder="e.g., Dumplings in Chinatown"
          placeholderTextColor="#9CA3AF"
          style={styles.titleInput}
          returnKeyType="next"
          onSubmitEditing={() => descRef.current?.focus()}
          blurOnSubmit={false}
          onFocus={() => setFocus("title")}
          onBlur={() => setFocus(null)}
        />
      </Pressable>

      {/* Description Field */}
      <View style={styles.rowBetween}>
        <Text style={styles.sectionLabel}>Description</Text>
        <Text style={styles.counter}>{Math.min(descLen, 500)}/500</Text>
      </View>

      <Pressable
        onPressIn={() => descRef.current?.focus()}
        style={[styles.area, focus === "desc" && styles.fieldFocused]}
      >
        <TextInput
          ref={descRef}
          value={state.description}
          onChangeText={(t) => dispatch({ type: "SET", key: "description", value: t })}
          placeholder="What’s the plan? meetup spot, vibe, rules, what to bring…"
          placeholderTextColor="#9CA3AF"
          multiline
          textAlignVertical="top"
          style={styles.descInput}
          onFocus={() => setFocus("desc")}
          onBlur={() => setFocus(null)}
          maxLength={500}
        />
      </Pressable>

      {/* Helper */}
      <View style={styles.helperRow}>
        <View style={[styles.helperDot, (!titleLen || !descLen) ? styles.dotWarn : styles.dotGood]} />
        <Text style={[styles.helperText, helperTone]}>{helper}</Text>
      </View>

      {/* Mini tips (fills emptiness, looks premium) */}
      <View style={styles.tips}>
        <View style={styles.tipChip}>
          <Text style={styles.tipChipText}>Keep it specific</Text>
        </View>
        <View style={styles.tipChip}>
          <Text style={styles.tipChipText}>Add vibe + expectations</Text>
        </View>
        <View style={styles.tipChip}>
          <Text style={styles.tipChipText}>Mention what to bring</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingTop: 6,
  },

  sectionLabel: {
    fontSize: 13,
    fontWeight: "900",
    color: "#111827",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 10,
  },

  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    height: 64,                 // ⬅️ taller
  },
  area: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    padding: 14,
    minHeight: 180,             // ⬅️ more breathing space
  },

  fieldFocused: {
    borderColor: "rgba(46,139,109,0.70)",
    shadowColor: "#2E8B6D",
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },

  emojiPill: {
    width: 44,                  // ⬅️ bigger
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  emoji: { fontSize: 20 },

  titleInput: {
    flex: 1,
    fontSize: 16,               // ⬅️ bigger text
    fontWeight: "900",
    color: "#111827",
  },

  descInput: {
    flex: 1,
    fontSize: 14,               // ⬅️ bigger text
    fontWeight: "700",
    color: "#111827",
    lineHeight: 20,
  },

  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 18,              // ⬅️ pushes Description section down
    marginBottom: 10,
  },
  counter: {
    fontSize: 12,
    fontWeight: "800",
    color: "#6B7280",
  },

  helperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
  },
  helperDot: { width: 10, height: 10, borderRadius: 999 },
  dotWarn: { backgroundColor: "#F97316" },
  dotGood: { backgroundColor: "#22C55E" },

  helperText: {
    fontSize: 13,
    fontWeight: "800",
  },
  helperWarn: { color: "#6B7280" },
  helperGood: { color: "#111827" },

  tips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 18,
  },
  tipChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,        // ⬅️ bigger chips
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  tipChipText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#111827",
  },
});
