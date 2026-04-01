import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ApolloProvider } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import { client } from './src/apollo/client';
import { HousekeepingStatusProvider } from './src/context/HousekeepingStatus';
import CalendarScreen from './src/screens/Calendar';
import ReservationsScreen from './src/screens/Reservations';
import HousekeepingReportsScreen from './src/screens/HousekeepingReports';
import ClosedRoomsScreen from './src/screens/ClosedRooms';
import MoreScreen from './src/screens/More';

// NavigationContainer is handled by the playground root (App.tsx).
// This component renders Paul's prototype as a nested bottom-tab navigator.

const Tab = createBottomTabNavigator();
const ORANGE = '#e8722a';

export default function PaulLHHousekeepingApp() {
  return (
    <ApolloProvider client={client}>
      <HousekeepingStatusProvider>
        <Tab.Navigator
          screenOptions={{
            tabBarActiveTintColor: ORANGE,
            tabBarInactiveTintColor: '#9ca3af',
            tabBarStyle: { borderTopColor: '#e5e7eb' },
            headerStyle: { backgroundColor: '#fff' },
            headerTintColor: '#111',
            headerTitleStyle: { fontWeight: '600', fontSize: 16 },
            headerShadowVisible: false,
          }}
        >
          <Tab.Screen
            name="Calendar"
            component={CalendarScreen}
            options={{
              headerShown: false,
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="calendar" size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Reservations"
            component={ReservationsScreen}
            options={{
              headerShown: false,
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="business-outline" size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Housekeeping"
            component={HousekeepingReportsScreen}
            options={{
              headerShown: false,
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="sparkles-outline" size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Closed Rooms"
            component={ClosedRoomsScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="bed-outline" size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="More"
            component={MoreScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="ellipsis-horizontal" size={size} color={color} />
              ),
            }}
          />
        </Tab.Navigator>
      </HousekeepingStatusProvider>
    </ApolloProvider>
  );
}
