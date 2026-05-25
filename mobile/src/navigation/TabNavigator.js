import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

// Screens
import HomeScreen from '../screens/home/HomeScreen';
import MapScreen from '../screens/map/MapScreen';
import AIRecommendScreen from '../screens/ai/AIRecommendScreen';
import WalletScreen from '../screens/wallet/WalletScreen';
import BookingHistoryScreen from '../screens/booking/BookingHistoryScreen';
import VehicleDetailScreen from '../screens/vehicles/VehicleDetailScreen';
import BookingScreen from '../screens/booking/BookingScreen';
import DocumentUploadScreen from '../screens/booking/DocumentUploadScreen';
import DamageReportScreen from '../screens/damage/DamageReportScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Nested Stack for Rental Details inside Home Tab
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="FleetFeed" component={HomeScreen} />
      <Stack.Screen name="VehicleDetail" component={VehicleDetailScreen} />
      <Stack.Screen name="BookingCheckout" component={BookingScreen} />
      <Stack.Screen name="VerifyIdentity" component={DocumentUploadScreen} />
      <Stack.Screen name="DamageLog" component={DamageReportScreen} />
    </Stack.Navigator>
  );
}

export default function TabNavigator() {
  const { colors, isDarkMode } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4
        },
        tabBarActiveTintColor: '#F59E0B', // Amber Accent
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600'
        },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName;

          if (route.name === 'Rent') {
            iconName = focused ? 'car' : 'car-outline';
          } else if (route.name === 'Nearby') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'AI Match') {
            iconName = focused ? 'sparkles' : 'sparkles-outline';
          } else if (route.name === 'Wallet') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'History') {
            iconName = focused ? 'time' : 'time-outline';
          }

          return <Ionicons name={iconName} size={22} color={color} />;
        }
      })}
    >
      <Tab.Screen name="Rent" component={HomeStack} />
      <Tab.Screen name="Nearby" component={MapScreen} />
      <Tab.Screen name="AI Match" component={AIRecommendScreen} />
      <Tab.Screen name="Wallet" component={WalletScreen} />
      <Tab.Screen name="History" component={BookingHistoryScreen} />
    </Tab.Navigator>
  );
}
