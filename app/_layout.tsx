import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import 'react-native-reanimated';

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack />
    </GestureHandlerRootView>
  );
}
