import React, { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Dimensions, View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { Modalize } from "react-native-modalize";
import Constants from "expo-constants";
import { WebView } from "react-native-webview";
import { useAuth } from "@clerk/clerk-expo";

import { wizardReducer, initialWizardState } from "./wizard/wizardReducer";
import { getSteps, StepKey } from "./wizard/useWizardSteps";
import { validateStep, validateAll, toStartsAtISO } from "./wizard/wizardValidation";

import KindStep from "./steps/KindStep";
import BasicsStep from "./steps/BasicsStep";
import WhenStep from "./steps/WhenStep";
import WhereStep from "./steps/WhereStep";
import PriceStep from "./steps/PriceStep";
import CapacityStep from "./steps/CapacityStep";
import ServicePhotosStep from "./steps/ServicePhotosStep";
import ReviewStep from "./steps/ReviewStep";
import ServiceWhenStep from "./steps/ServiceWhenStep";
import type { ListingKind } from "./wizard/wizardTypes";



import type { CreateEvent } from "./types";
import { textToEmoji } from "./utils/emoji";
import { parsePriceToCents } from "./utils/time";

const DEFAULT_CENTER = { lat: 40.7128, lng: -74.006 };


function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function stepName(k: StepKey) {
  switch (k) {
    case "kind":
      return "Type";
    case "basics":
      return "Basics";
    case "when":
      return "When";
    case "where":
      return "Where";
    case "price":
      return "Price";
    case "capacity":
      return "Limit";
    case "servicePhotos":
      return "Photos";
    case "review":
      return "Review";
    default:
      return "Step";
  }
}

function stepPrompt(k: StepKey, kind: ListingKind | null) {
  const isService = kind === "service";

  switch (k) {
    case "kind":
      return "What are you creating today?";
    case "basics":
      return "Tell people what it is";

    case "when":
      return isService ? "How should people book you?" : "When is it happening?";

    case "serviceWhen":
      return "How should people book you?";

    case "where":
      return isService ? "Where do you provide the service?" : "Where should people meet?";

    case "price":
      return "Set a price";
    case "capacity":
      return "How many can join?";
    case "servicePhotos":
      return "Add a few photos";
    case "review":
      return "Review & publish";
    default:
      return "Continue";
  }
}


function CircleIconButton({
  icon,
  onPress,
  disabled,
}: {
  icon: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={[styles.circleBtn, disabled && { opacity: 0.45 }]}
      hitSlop={12}
    >
      <Text style={styles.circleBtnIcon}>{icon}</Text>
    </Pressable>
  );
}

function PrimaryFooterButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={[styles.primaryBtn, disabled && { opacity: 0.45 }]}
    >
      <Text style={styles.primaryBtnText}>{label}</Text>
      <Text style={styles.primaryBtnArrow}>→</Text>
    </Pressable>
  );
}

function DotStepper({
  steps,
  activeIndex,
  isDone,
}: {
  steps: StepKey[];
  activeIndex: number;
  isDone: (k: StepKey) => boolean;
}) {
  return (
    <View style={styles.dotsRow}>
      {steps.map((k, idx) => {
        const active = idx === activeIndex;
        const done = isDone(k);
        return (
          <View
            key={`${k}-${idx}`}
            style={[
              styles.dot,
              done && styles.dotDone,
              active && styles.dotActive,
              active && done && styles.dotActiveDone,
            ]}
          />
        );
      })}
    </View>
  );
}

export default function AddEvent({
  visible,
  onClose,
  onCreate,
}: {
  visible: boolean;
  onClose: () => void;
  onCreate: (e: CreateEvent) => void;
}) {
  const sheetRef = useRef<Modalize>(null);
  const mapRef = useRef<WebView | null>(null);

  const H = Dimensions.get("window").height;
  const TOP_GAP = 100;

  const { userId } = useAuth();
  const GOOGLE_KEY = (Constants.expoConfig?.extra as any)?.googleMapsKey as string | undefined;
  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const [state, dispatch] = useReducer(wizardReducer, initialWizardState);
  const steps = useMemo(() => getSteps(state.kind), [state.kind]);
  const [i, setI] = useState(0);

  const safeI = clamp(i, 0, Math.max(steps.length - 1, 0));
  const stepKey: StepKey = steps[safeI] as StepKey;

  const emoji = useMemo(() => textToEmoji(state.title), [state.title]);

  useEffect(() => {
    if (visible) sheetRef.current?.open();
    else sheetRef.current?.close();
  }, [visible]);

  const resetAll = () => {
    dispatch({ type: "RESET" });
    setI(0);
  };

  const closeAll = () => {
    resetAll();
    onClose();
  };

  const canNext = useMemo(() => !validateStep(state as any, stepKey), [state, stepKey]);

  const next = () => {
    const err = validateStep(state as any, stepKey);
    if (err) return dispatch({ type: "SET_ERR", err });
    setI((p) => Math.min(p + 1, steps.length - 1));
  };

  const back = () => setI((p) => Math.max(p - 1, 0));

  async function createListing() {
    if (!API_BASE) throw new Error("Missing API base URL (extra.apiBaseUrl).");
    if (!userId) throw new Error("You must be signed in.");
    if (!GOOGLE_KEY) throw new Error("Google Maps key missing (extra.googleMapsKey).");

    const finalErr = validateAll(state as any);
    if (finalErr) throw new Error(finalErr);

    const backendKind = state.kind === "event_free" ? "free" : state.kind === "event_paid" ? "paid" : "service";
    const needsPrice = backendKind === "paid" || backendKind === "service";
    const priceCents = needsPrice ? parsePriceToCents(state.priceText) : null;

    const startsAt = toStartsAtISO(state.dateISO, state.time24);
    if (!startsAt) throw new Error("Invalid date/time.");

    const timezone =
      typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "America/New_York";

    const payload: any = {
      title: state.title.trim(),
      description: state.description.trim(),
      emoji,
      creatorClerkId: userId,
      kind: backendKind,
      priceCents: needsPrice ? priceCents : null,
      capacity:
        backendKind === "free" && state.capacityText.trim()
          ? parseInt(state.capacityText.trim(), 10)
          : null,

      timezone,
      startsAt,
      date: state.dateISO,
      time: state.time24,

      photos:
        backendKind === "service"
          ? state.servicePhotos.map((p: any) => ({ url: p.url ?? "", key: p.key ?? "" }))
          : [],

      tags: [],
      visibility: "public",
      status: "active",

      location: {
        lat: state.coord!.lat,
        lng: state.coord!.lng,
        geo: { type: "Point", coordinates: [state.coord!.lng, state.coord!.lat] },
        formattedAddress: state.selectedAddress || state.locationPayload?.formattedAddress || "",
        placeId: state.locationPayload?.placeId || "",
        countryCode: state.locationPayload.countryCode,
        countryName: state.locationPayload.countryName || "",
        admin1: state.locationPayload.admin1 || "",
        admin1Code: state.locationPayload.admin1Code || "",
        city: state.locationPayload.city,
        cityKey: state.locationPayload.cityKey || "",
        postalCode: state.locationPayload.postalCode || "",
        neighborhood: state.locationPayload.neighborhood || "",
        source: state.locationPayload.source || "user_typed",
      },
    };

    const res = await fetch(`${API_BASE}/api/events/create-event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(EVENT_API_KEY ? { "x-api-key": EVENT_API_KEY } : {}),
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.error || "Failed to create");
    return json;
  }

  const submit = async () => {
    dispatch({ type: "SET", key: "submitting", value: true });
    dispatch({ type: "SET_ERR", err: null });

    try {
      const created = await createListing();
      const ev = created?.event;

      onCreate({
        title: ev?.title ?? state.title.trim(),
        lat: ev?.location?.lat ?? state.coord?.lat ?? DEFAULT_CENTER.lat,
        lng: ev?.location?.lng ?? state.coord?.lng ?? DEFAULT_CENTER.lng,
        emoji: ev?.emoji ?? emoji,
      });

      sheetRef.current?.close();
    } catch (e: any) {
      dispatch({ type: "SET_ERR", err: e?.message || "Something went wrong." });
      dispatch({ type: "SET", key: "submitting", value: false });
    }
  };

  const stepUI = () => {
    switch (stepKey) {
      case "kind":
        return <KindStep state={state} dispatch={dispatch} emoji={emoji} />;
      case "basics":
        return <BasicsStep state={state} dispatch={dispatch} emoji={emoji} />;
      case "when":
        return <WhenStep state={state} dispatch={dispatch} />;

      case "serviceWhen": // ✅ add this
        return <ServiceWhenStep state={state} dispatch={dispatch} />;

      case "where":
        return (
          <WhereStep
            state={state}
            dispatch={dispatch}
            mapRef={mapRef as React.RefObject<WebView>}
            googleKey={GOOGLE_KEY}
          />
        );
      case "price":
        return <PriceStep state={state} dispatch={dispatch} />;
      case "capacity":
        return <CapacityStep state={state} dispatch={dispatch} />;
      case "servicePhotos":
        return <ServicePhotosStep state={state} dispatch={dispatch} />;
      case "review":
        return <ReviewStep state={state} emoji={emoji} onSubmit={submit} />;
      default:
        return null;
    }
  };

  const isDone = (k: StepKey) => !validateStep(state as any, k);

  const footerLabel =
    stepKey === "review" ? (state.submitting ? "Creating" : "Create") : "Continue";

  const onFooterPress = () => {
    if (stepKey === "review") submit();
    else next();
  };

  const FOOTER_H = 92;

  return (
    <Modalize
      ref={sheetRef}
      withReactModal
      onClosed={closeAll}
      modalHeight={H - TOP_GAP}
      modalTopOffset={TOP_GAP}
      modalStyle={styles.modal}
      overlayStyle={styles.overlay}
      panGestureEnabled={false}
      closeOnOverlayTap={false}
      FooterComponent={
        <View style={styles.footerWrap}>
          {!!state.err && <Text style={styles.errText}>{state.err}</Text>}

          <View style={styles.footerRow}>
            <CircleIconButton
              icon={safeI === 0 ? "✕" : "←"}
              onPress={safeI === 0 ? closeAll : back}
              disabled={!!state.submitting}
            />

            <PrimaryFooterButton
              label={footerLabel}
              onPress={onFooterPress}
              disabled={stepKey !== "review" ? !canNext : !!state.submitting}
            />
          </View>
          <View style={{ height: Platform.OS === "ios" ? 50 : 40 }} />
        </View>
      }
      scrollViewProps={{
        keyboardShouldPersistTaps: "always",
        showsVerticalScrollIndicator: false,
        contentContainerStyle: [styles.content, { paddingBottom: FOOTER_H, flexGrow: 1 }],
      }}
      reactModalProps={{
        presentationStyle: "overFullScreen",
        statusBarTranslucent: true,
        animationType: "fade",
        onRequestClose: () => { },
      }}
    >

      {/* Light sheet body */}
      <View style={styles.sheet}>
        <View style={styles.handle} />

        <Text style={styles.stepCount}>
          {safeI + 1} of {steps.length}
        </Text>

        <Text style={styles.title}>{stepPrompt(stepKey, state.kind)}</Text>

        <DotStepper steps={steps as StepKey[]} activeIndex={safeI} isDone={isDone} />

        <View style={styles.card}>
          <View style={styles.cardBody}>{stepUI()}</View>
        </View>
      </View>

    </Modalize>
  );
}

const styles = StyleSheet.create({
  modal: {
    backgroundColor: "#F8FAFC",       // soft canvas
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },
  overlay: { backgroundColor: "rgba(0,0,0,0.45)" },

  content: {
    paddingTop: 12,
    paddingHorizontal: 16,
    flexGrow: 1,
  },

  sheet: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  handle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    marginTop: 10,
    marginBottom: 14,
  },

  stepCount: {
    fontSize: 13,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 10,
  },

  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
    color: "#0B0F19",
    letterSpacing: -0.3,
  },

  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 14,
    marginBottom: 14,
  },
  dot: { width: 7, height: 7, borderRadius: 999, backgroundColor: "#E5E7EB" },
  dotDone: { backgroundColor: "#111827" },
  dotActive: { width: 18, height: 7, borderRadius: 999, backgroundColor: "#D1D5DB" },
  dotActiveDone: { backgroundColor: "#111827" },

  card: {
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  cardBody: {
    padding: 14,
    paddingTop: 40,
  },

  footerWrap: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  errText: {
    color: "#B91C1C",
    fontWeight: "900",
    marginBottom: 8,
    fontSize: 12,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  circleBtn: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  circleBtnIcon: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
  },
  primaryBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryBtnText: { color: "#FFFFFF", fontWeight: "900", fontSize: 15, letterSpacing: 0.2 },
  primaryBtnArrow: { color: "#FFFFFF", fontWeight: "900", fontSize: 16, marginTop: -1 },
});
