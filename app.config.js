import "dotenv/config";

export default {
  expo: {
    name: "my-app",
    slug: "my-app",
    scheme: "yoag",
    extra: {
      googleMapsKey: process.env.GOOGLE_MAPS_KEY,
    },
  },
};
