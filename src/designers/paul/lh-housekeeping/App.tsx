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
    // RNW renders Modal via ReactDOM.createPortal into document.body, so the
    // body itself must be the mobile-frame container — anything wrapping
    // children at the React level would be bypassed by modal portals.
    //
    // On wide viewports (desktop testers): centred 390x844 "device" with
    // rounded screen corners + a 12px solid black bezel (via box-shadow
    // spread so it doesn't shrink the content area). On narrow viewports
    // (real mobile testers): styles collapse and the app fills the screen.
    const style = document.createElement('style');
    style.id = 'paul-lh-mobile-frame';
    style.textContent = `
      html { height: 100%; }
      body {
        height: 100% !important;
        overflow: hidden !important;
        background: #fff !important;
      }
      @media (min-width: 600px) {
        html {
          background: #1f2937 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        body {
          width: 390px !important;
          max-width: 390px !important;
          height: min(844px, calc(100vh - 40px)) !important;
          margin: 0 !important;
          border-radius: 47px !important;
          box-shadow:
            0 0 0 12px #111,
            0 0 0 14px #2d2d2d,
            0 20px 60px rgba(0,0,0,0.45) !important;
        }
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
