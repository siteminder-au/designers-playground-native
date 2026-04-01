import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PlaygroundHomeScreen from '../HomeScreen';
import RadhaSmMobileApp from '../designers/radha/sm-mobile/App';
import PaulLHHousekeepingApp from '../designers/paul/lh-housekeeping/App';

export type RootParamList = {
  PlaygroundHome: undefined;
  RadhaSmMobile: undefined;
  PaulLHHousekeeping: undefined;
  // Add new designer screens here
};

const Stack = createNativeStackNavigator<RootParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="PlaygroundHome"
        component={PlaygroundHomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RadhaSmMobile"
        component={RadhaSmMobileApp}
        options={{
          title: 'SM Mobile',
          headerBackTitle: 'Playground',
          headerStyle: { backgroundColor: '#006add' },
          headerTintColor: '#ffffff',
          headerTitleStyle: { fontWeight: '600' },
        }}
      />
      <Stack.Screen
        name="PaulLHHousekeeping"
        component={PaulLHHousekeepingApp}
        options={{ headerShown: false }}
      />
      {/* Add new designer screens here */}
    </Stack.Navigator>
  );
}
