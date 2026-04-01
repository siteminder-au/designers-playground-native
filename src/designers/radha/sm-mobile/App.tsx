import React from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';

// NavigationContainer is handled by the playground root (App.tsx).
// This component renders Radha's prototype as a nested navigator.
export default function RadhaSmMobileApp() {
  return (
    <>
      <StatusBar style="light" />
      <AppNavigator />
    </>
  );
}
