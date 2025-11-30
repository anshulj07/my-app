// app/_layout.tsx
import React, { useEffect, useMemo } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import Constants from "expo-constants";

import { ClerkProvider, useAuth, useUser } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";

const APP_HOME = "/newApp/home";
const SIGN_IN = "/(auth)/sign-in";
const ONBOARDING_START = "/(onboarding)/name";

function isOnboardingComplete(user: any) {
  const pm = (user?.unsafeMetadata ?? {}) as any;
  return pm?.onboardingComplete === true;
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { isLoaded: userLoaded, user } = useUser();
  const segments = useSegments();
  const router = useRouter();

  const inAuthGroup = segments[0] === "(auth)";
  const inOnboardingGroup = segments[0] === "(onboarding)";

  const onboardingDone = useMemo(() => {
    if (!user) return false;
    return isOnboardingComplete(user);
  }, [user]);

  useEffect(() => {
    if (!authLoaded) return;

    // signed out -> must be in auth screens
    if (!isSignedIn) {
      if (!inAuthGroup) router.replace(SIGN_IN);
      return;
    }

    // signed in but user not loaded yet
    if (!userLoaded) return;

    // signed in -> onboarding gate
    if (!onboardingDone) {
      if (!inOnboardingGroup) router.replace(ONBOARDING_START);
      return;
    }

    // onboarding done -> keep people out of auth/onboarding groups
    if (inAuthGroup || inOnboardingGroup) {
      router.replace(APP_HOME);
      return;
    }
  }, [
    authLoaded,
    userLoaded,
    isSignedIn,
    onboardingDone,
    inAuthGroup,
    inOnboardingGroup,
    router,
  ]);

  if (!authLoaded) return null;
  if (isSignedIn && !userLoaded) return null;

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
      <AuthGate>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Stack screenOptions={{ headerShown: false }} />
        </GestureHandlerRootView>
      </AuthGate>
    </ClerkProvider>
  );
}
