// app/_layout.tsx
import React, { useEffect, useRef } from "react";
import { View, ActivityIndicator } from "react-native";
import { Stack, useRouter, useSegments, useRootNavigationState } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import Constants from "expo-constants";
import { apiFetch } from "../lib/apiFetch";

import { ClerkProvider, useAuth, useUser } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { NotificationProvider } from "../context/NotificationContext";
import { 
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
  Outfit_900Black 
} from '@expo-google-fonts/outfit';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

const SIGN_IN = "/(auth)/sign-in";
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

  const res = await apiFetch(url, {
    method: "GET",
    headers: {
      ...(apiKey ? { "x-api-key": apiKey } : {}),
    },
    signal,
  });

  if (!res.ok) return { completed: true };

  const j = await res.json().catch(() => ({} as any));
  return {
    completed: !!j.completed,
    nextRoute: typeof j.nextRoute === "string" ? j.nextRoute : undefined,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoaded: authLoaded, isSignedIn, userId } = useAuth();
  const { isLoaded: userLoaded } = useUser();
  const segments = useSegments();
  const router = useRouter();
  const nav = useRootNavigationState();

  const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const EVENT_API_KEY = (Constants.expoConfig?.extra as any)?.eventApiKey as string | undefined;

  const inAuthGroup = segments[0] === "(auth)";
  const inOnboardingGroup = segments[0] === "(onboarding)";
  const currentStep = segments[segments.length - 1] || "";

  // ✅ KEY FIX: Only check onboarding once per login (userId change),
  // or if user is still in auth/onboarding group.
  // Previously checking on every segmentsKey change caused a full-screen
  // loading flash on every tab/page navigation.
  const lastCheckUserRef = useRef<string>("");

  useEffect(() => {
    if (!nav?.key) return;
    if (!authLoaded) return;

    // signed out → go to sign in
    if (!isSignedIn) {
      if (!inAuthGroup) router.replace(SIGN_IN);
      return;
    }

    // signed in but user not ready yet
    if (!userLoaded || !userId) return;

    // if API base missing, skip check — let app through
    if (!API_BASE) return;

    // Only run check if: new user login, or still in auth/onboarding
    const needsCheck =
      lastCheckUserRef.current !== userId || inAuthGroup || inOnboardingGroup;
    if (!needsCheck) return;
    lastCheckUserRef.current = userId;

    const controller = new AbortController();

    (async () => {
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
    })().catch(() => {});

    return () => controller.abort();
  }, [
    nav?.key,
    authLoaded,
    isSignedIn,
    userLoaded,
    userId,
    inAuthGroup,
    inOnboardingGroup,
    currentStep,
    router,
    API_BASE,
    EVENT_API_KEY,
  ]);

  // Only show overlay on very first load (nav not ready / auth not loaded)
  // NOT on every navigation — that was causing the "loading" flash
  const showOverlay = !nav?.key || !authLoaded || (isSignedIn && !userLoaded);

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
            backgroundColor: "#FFF7FA",
          }}
        >
          <ActivityIndicator />
        </View>
      ) : null}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
    Outfit_900Black,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  const publishableKey =
    process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    (Constants.expoConfig?.extra as any)?.clerkPublishableKey;

  if (!publishableKey) {
    throw new Error(
      "Missing Clerk publishable key. Set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY or extra.clerkPublishableKey."
    );
  }

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <NotificationProvider>
          <AuthGate>
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerShown: false,
                animation: "slide_from_right",
                gestureEnabled: true,
                gestureDirection: "horizontal",
              }}
            />
          </AuthGate>
        </NotificationProvider>
      </ClerkProvider>
    </GestureHandlerRootView>
  );
}
