import "dotenv/config";

export default {
  expo: {
    name: "my-app",
    slug: "my-app",
    scheme: "yoag",
    plugins: ["expo-secure-store", "expo-web-browser", "expo-video"],
    extra: {
      googleMapsKey: process.env.GOOGLE_MAPS_KEY,
      apiBaseUrl: process.env.API_BASE_URL,
      eventApiKey: "super-secret",
      clerkPublishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
    },
  },
};
