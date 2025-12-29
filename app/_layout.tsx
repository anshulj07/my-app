// app/_layout.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { Stack, useRouter, useSegments, useRootNavigationState } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import Constants from "expo-constants";

import { ClerkProvider, useAuth, useUser } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";

import { useFonts, Sora_400Regular, Sora_600SemiBold, Sora_700Bold } from "@expo-google-fonts/sora";

// ✅ change this to your new first auth screen (video + two options)
const SIGN_IN = "/(auth)/welcome";

const APP_HOME = "/newApp/home";
const ONBOARDING_START = "/(onboarding)/name";

type OnboardingStatus = { completed: boolean; nextRoute?: string };

async function getOnboardingStatus(args: {
  apiBase: string;
  clerkUserId: string;
  apiKey?: string;
  signal?: AbortSignal;
}): Promise<OnboardingStatus> {
  const { apiBase, clerkUserId, apiKey, signal } = args;

  const url =
    `${apiBase.replace(/\/$/, "")}` +
    `/api/onboarding/status?clerkUserId=${encodeURIComponent(clerkUserId)}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      ...(apiKey ? { "x-api-key": apiKey } : {}),
    },
    signal,
  });

  // if backend unavailable, don't block app
  if (!res.ok) return { completed: true };

  const j = await res.json().catch(() => ({} as any));
  return {
    completed: !!j.completed,
    nextRoute: typeof j.nextRoute === "string" ? j.nextRoute : undefined,
  };
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoaded: authLoaded, isSignedIn, userId } = useAuth();
  const { isLoaded: userLoaded } = useUser();
  const segments = useSegments();
  const router = useRouter();
  const nav = useRootNavigationState();

  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const [checking, setChecking] = useState(false);

  const segmentsKey = useMemo(() => segments.filter(Boolean).join("/"), [segments]);
  const inAuthGroup = segments[0] === "(auth)";
  const inOnboardingGroup = segments[0] === "(onboarding)";
  const currentStep = segments[segments.length - 1] || "";

  const lastCheckKeyRef = useRef<string>("");

  useEffect(() => {
    if (!nav?.key) return;
    if (!authLoaded) return;

    // signed out -> go to welcome/auth entry screen
    if (!isSignedIn) {
      setChecking(false);
      if (!inAuthGroup) router.replace(SIGN_IN);
      return;
    }

    // signed in but user not ready yet
    if (!userLoaded || !userId) return;

    // if API base missing, don't block the app
    if (!API_BASE) {
      setChecking(false);
      return;
    }

    const checkKey = `${userId}:${segmentsKey}`;
    if (lastCheckKeyRef.current === checkKey) return;
    lastCheckKeyRef.current = checkKey;

    const controller = new AbortController();

    (async () => {
      setChecking(true);

      const status = await getOnboardingStatus({
        apiBase: API_BASE,
        clerkUserId: userId,
        apiKey: EVENT_API_KEY,
        signal: controller.signal,
      });

      if (!status.completed) {
        const target = status.nextRoute || ONBOARDING_START;
        const targetStep = target.split("/").filter(Boolean).pop() || "";

        if (!inOnboardingGroup || currentStep !== targetStep) {
          router.replace(target);
        }
        return;
      }

      if (inAuthGroup || inOnboardingGroup) {
        router.replace(APP_HOME);
      }
    })()
      .catch(() => {})
      .finally(() => setChecking(false));

    return () => controller.abort();
  }, [
    nav?.key,
    authLoaded,
    isSignedIn,
    userLoaded,
    userId,
    segmentsKey,
    inAuthGroup,
    inOnboardingGroup,
    currentStep,
    router,
    API_BASE,
    EVENT_API_KEY,
  ]);

  // keep navigation mounted; just overlay a loader
  const showOverlay = !nav?.key || !authLoaded || (isSignedIn && !userLoaded) || checking;

  return (
    <View style={{ flex: 1 }}>
      {children}
      {showOverlay ? (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0B0B12",
          }}
        >
          <ActivityIndicator color="#B8FF6A" />
        </View>
      ) : null}
    </View>
  );
}

export default function RootLayout() {
  // ✅ load fonts once for the entire app
  const [fontsLoaded] = useFonts({
    Sora_400Regular,
    Sora_600SemiBold,
    Sora_700Bold,
  });

  const publishableKey =
    process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    (Constants.expoConfig?.extra as any)?.clerkPublishableKey;

  if (!publishableKey) {
    throw new Error(
      "Missing Clerk publishable key. Set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY or extra.clerkPublishableKey."
    );
  }

  // ✅ avoid font flicker / missing-font fallback on first paint
  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0B0B12", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#6AF0FF" />
      </View>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <AuthGate>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Stack screenOptions={{ headerShown: false }} />
        </GestureHandlerRootView>
      </AuthGate>
    </ClerkProvider>
  );
}
