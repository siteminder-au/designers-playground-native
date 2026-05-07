import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ApolloProvider } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { client } from './src/apollo/client';
import { HousekeepingStatusProvider, useHousekeepingStatus } from './src/context/HousekeepingStatus';
import CalendarScreen from './src/screens/Calendar';
import ReservationsScreen from './src/screens/Reservations';
import HomeScreen from './src/screens/Home';
import HousekeepingReportsScreen from './src/screens/HousekeepingReports';
import DistributionScreen from './src/screens/Distribution';
import NotificationsScreen from './src/screens/Notifications';

// NavigationContainer is handled by the playground root (App.tsx).
// This component renders Paul's prototype as a nested bottom-tab navigator.

const Tab = createBottomTabNavigator();

function AppNavigator() {
  const { housekeeperMode } = useHousekeepingStatus();

  return (
    <Tab.Navigator
      initialRouteName={housekeeperMode ? 'Housekeeping' : 'Home'}
      screenOptions={{
        tabBarActiveTintColor: '#ff6842',
        tabBarInactiveTintColor: '#717171',
        tabBarStyle: housekeeperMode
          ? { display: 'none' }
          : { borderTopWidth: 1, borderTopColor: '#e5e8e8', backgroundColor: '#fff' },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '400',
        },
        tabBarIconStyle: {
          marginBottom: -2,
        },
        tabBarItemStyle: {
          paddingVertical: 8,
        },
        headerStyle: { backgroundColor: '#fff' },
        headerTintColor: '#111',
        headerTitleStyle: { fontWeight: '600', fontSize: 16 },
        headerShadowVisible: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: false,
          tabBarItemStyle: housekeeperMode ? { display: 'none' } : { paddingVertical: 8 },
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          headerShown: false,
          tabBarItemStyle: housekeeperMode ? { display: 'none' } : { paddingVertical: 8 },
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Reservations"
        component={ReservationsScreen}
        options={{
          headerShown: false,
          tabBarItemStyle: housekeeperMode ? { display: 'none' } : { paddingVertical: 8 },
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'bookmark' : 'bookmark-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Housekeeping"
        component={HousekeepingReportsScreen}
        options={{
          headerShown: false,
          tabBarItemStyle: { display: 'none' },
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tab.Screen
        name="Distribution"
        component={DistributionScreen}
        options={{
          headerShown: false,
          tabBarItemStyle: housekeeperMode ? { display: 'none' } : { paddingVertical: 8 },
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'apps' : 'apps-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          headerShown: false,
          tabBarItemStyle: housekeeperMode ? { display: 'none' } : { paddingVertical: 8 },
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'notifications' : 'notifications-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function PaulLHHousekeepingApp() {
  const [fontsLoaded] = useFonts({
    'ValueSerifTrial-Medium': require('./assets/fonts/ValueSerifTrial-Medium.ttf'),
  });

  if (!fontsLoaded) return null;

  return (
    <ApolloProvider client={client}>
      <HousekeepingStatusProvider>
        <AppNavigator />
      </HousekeepingStatusProvider>
    </ApolloProvider>
  );
}
