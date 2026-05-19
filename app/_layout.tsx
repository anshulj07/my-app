// app/_layout.tsx
import React, { useEffect, useRef } from "react";
import { View, ActivityIndicator } from "react-native";
import { Stack, useRouter, useSegments, useRootNavigationState } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import Constants from "expo-constants";

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
const ONBOARDING_START = "/(onboarding)/username";

// ─────────────────────────────────────────────────────────────────────────────
function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { isLoaded: userLoaded, user } = useUser();
  const segments = useSegments();
  const router = useRouter();
  const nav = useRootNavigationState();

  const inAuthGroup = segments[0] === "(auth)";
  const inOnboardingGroup = segments[0] === "(onboarding)";

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
    if (!userLoaded || !user) return;

    // Only run check if: new user login, or still in auth/onboarding
    const needsCheck =
      lastCheckUserRef.current !== user.id || inAuthGroup || inOnboardingGroup;
    if (!needsCheck) return;
    lastCheckUserRef.current = user.id;

    let onboardingComplete = user.unsafeMetadata?.onboardingComplete === true;

    // Auto-bypass onboarding for returning users or those who already have a username
    const createdAtTime = user.createdAt ? new Date(user.createdAt).getTime() : 0;
    const lastSignInTime = user.lastSignInAt ? new Date(user.lastSignInAt).getTime() : 0;
    const isReturningUser = lastSignInTime - createdAtTime > 2 * 60 * 1000; // > 2 mins difference means it's a subsequent login
    
    if (!onboardingComplete && (isReturningUser || user.username)) {
      onboardingComplete = true; // treat as complete
    }

    if (!onboardingComplete) {
      if (!inOnboardingGroup) {
        router.replace(ONBOARDING_START);
      }
      return;
    }

    if (inAuthGroup || inOnboardingGroup) {
      router.replace(APP_HOME);
    }
  }, [
    nav?.key,
    authLoaded,
    isSignedIn,
    userLoaded,
    user,
    inAuthGroup,
    inOnboardingGroup,
    router,
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
