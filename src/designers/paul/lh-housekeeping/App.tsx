import React, { useEffect } from 'react';
import { Platform } from 'react-native';
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

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    // RNW renders Modal via ReactDOM.createPortal into document.body,
    // making modal divs direct children of <body> — not our React container.
    // Adding a CSS transform to <body> makes it the containing block for all
    // position:fixed descendants, so modals are scoped to body's 390px width.
    const style = document.createElement('style');
    style.id = 'paul-lh-mobile-frame';
    style.textContent = `
      html { background: #d1d5db !important; height: 100%; }
      body {
        max-width: 390px !important;
        margin: 0 auto !important;
        height: 100% !important;
        overflow: hidden !important;
        transform: translateX(0) !important;
        box-shadow: 0 0 40px rgba(0,0,0,0.35) !important;
        background: #fff !important;
      }
    `;
    document.head.appendChild(style);
    return () => { document.getElementById('paul-lh-mobile-frame')?.remove(); };
  }, []);

  if (!fontsLoaded) return null;

  const content = (
    <ApolloProvider client={client}>
      <HousekeepingStatusProvider>
        <AppNavigator />
      </HousekeepingStatusProvider>
    </ApolloProvider>
  );

  return content;
}
