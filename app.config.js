import "dotenv/config";

export default {
  expo: {
    name: "my-app",
    slug: "my-app",
    scheme: "yoag",
    plugins: ["expo-secure-store", "expo-web-browser"],
    extra: {
      googleMapsKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY,
      apiBaseUrl: process.env.API_BASE_URL,
      eventApiKey: "super-secret",
      clerkPublishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,

      // ✅ NEW: Razorpay Key ID (sirf KEY_ID — SECRET kabhi frontend mein nahi!)
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    },
  },
};