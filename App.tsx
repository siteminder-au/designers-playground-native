import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';

const linking = {
  prefixes: [],
  config: {
    screens: {
      PlaygroundHome: '',
      RadhaSmMobile: 'radha/sm-mobile',
      PaulLHHousekeeping: 'paul/lh-housekeeping',
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
