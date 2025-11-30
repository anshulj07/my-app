// app/_layout.tsx
import React, { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import Constants from "expo-constants";

import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";

const APP_HOME = "/newApp/home";
const SIGN_IN = "/(auth)/sign-in";

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isSignedIn && !inAuthGroup) {
      router.replace(SIGN_IN);
      return;
    }

    if (isSignedIn && inAuthGroup) {
      router.replace(APP_HOME);
      return;
    }
  }, [isLoaded, isSignedIn, segments, router]);

  if (!isLoaded) return null;
  return <>{children}</>;
}

export default function RootLayout() {
  const publishableKey =
    process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    (Constants.expoConfig?.extra as any)?.clerkPublishableKey;

  if (!publishableKey) {
    throw new Error(
      "Missing Clerk publishable key. Set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY or extra.clerkPublishableKey."
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthGate>
          <Slot />
        </AuthGate>
      </GestureHandlerRootView>
    </ClerkProvider>
  );
}
