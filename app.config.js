import "dotenv/config";

export default {
  expo: {
    name: "my-app",
    slug: "my-app",
    scheme: "yoag",
    extra: {
      googleMapsKey: process.env.GOOGLE_MAPS_KEY,
      apiBaseUrl: "https://efcf5a6d0306.ngrok-free.app",
      eventApiKey: "super-secret"
    },
  },
};
