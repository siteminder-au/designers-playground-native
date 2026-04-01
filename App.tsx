import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';

const linking = {
  prefixes: [],
  config: {
    screens: {
      PlaygroundHome: '',
      RadhaSmMobile: 'radha/sm-mobile',
    },
  },
};

export default function App() {
  return (
    <NavigationContainer linking={linking}>
      <AppNavigator />
    </NavigationContainer>
  );
}
