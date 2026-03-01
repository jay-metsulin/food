import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import HomeStack from './HomeStack';
import HomeScreen from '@/screens/HomeScreen';
import OrderTrackingScreen from '@/screens/OrderTrackingScreen';
import ProfileScreen from '@/screens/ProfileScreen';

const Tab = createBottomTabNavigator();

function SearchPlaceholder() {
  return <HomeScreen />;
}

function OrdersPlaceholder() {
  return <HomeScreen />;
}

function OffersPlaceholder() {
  return (
    <Text className="flex-1 text-center mt-20 text-lg text-gray-500">
      Offers coming soon
    </Text>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#ef4444',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="Search"
        component={SearchPlaceholder}
        options={{ tabBarLabel: 'Search' }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersPlaceholder}
        options={{ tabBarLabel: 'Orders' }}
      />
      <Tab.Screen
        name="Offers"
        component={OffersPlaceholder}
        options={{ tabBarLabel: 'Offers' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}