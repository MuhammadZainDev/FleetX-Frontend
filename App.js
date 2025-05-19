import 'react-native-reanimated';
import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';

// This API is subject to change; use with caution
export function App() {
  return <ExpoRoot />;
}

registerRootComponent(App); 