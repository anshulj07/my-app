module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module:react-native-dotenv",
        {
          moduleName: "@env",
          path: ".env",
        },
      ],

      // ⚠️ Reanimated plugin MUST be last
      "react-native-reanimated/plugin",
    ],
  };
};
