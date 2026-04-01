import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import DistributionScreen from '../screens/DistributionScreen';
import ReservationsScreen from '../screens/ReservationsScreen';

export type RootStackParamList = {
  Home: { openModal?: boolean };
  Settings: {
    propertyId: string;
    propertyName: string;
    propertyAddress: string;
    propertyStatus: 'ok' | 'error';
    channelStatus: 'ok' | 'error';
  };
  Distribution: undefined;
  Reservations: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home"          component={HomeScreen}          initialParams={{}} />
      <Stack.Screen name="Settings"      component={SettingsScreen} />
      <Stack.Screen name="Distribution"  component={DistributionScreen} />
      <Stack.Screen name="Reservations"  component={ReservationsScreen} />
    </Stack.Navigator>
  );
}
