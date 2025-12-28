// app/index.tsx
import React from "react";
import { Redirect } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";

const APP_HOME = "/newApp/home";
const SIGN_IN = "/(auth)/welcome"; // ✅ your video screen

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return null;

  return <Redirect href={isSignedIn ? APP_HOME : SIGN_IN} />;
}
