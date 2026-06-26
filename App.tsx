import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import { prototypes } from './src/prototypes';

// Deep-link paths are auto-generated from the discovered prototypes. Each screen
// is named "{slug}/{proto}" and maps to the same path, so URLs are unchanged.
const linking = {
  prefixes: [],
  config: {
    screens: {
      PlaygroundHome: '',
      ...Object.fromEntries(prototypes.map((p) => [p.route, p.route])),
    },
  },
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer linking={linking}>
        <AppNavigator />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
