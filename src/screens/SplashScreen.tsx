import { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '@/navigation/types';
import { useAuth } from '@/lib/auth';

type Nav = StackNavigationProp<AuthStackParamList, 'Splash'>;

export default function SplashScreen() {
  const nav = useNavigation<Nav>();
  const { accessToken } = useAuth();
  const scale = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      if (accessToken) {
        // Already authenticated — app will switch to MainTabs via RootNavigator
      } else {
        nav.replace('Login');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [accessToken, nav, scale, opacity]);

  return (
    <View className="flex-1 bg-red-500 items-center justify-center">
      <Animated.View style={{ transform: [{ scale }], opacity }}>
        <Text className="text-6xl mb-4">🍔</Text>
        <Text className="text-white text-3xl font-bold text-center">DeliveryApp</Text>
        <Text className="text-white/70 text-base mt-2 text-center">Food at your doorstep</Text>
      </Animated.View>
    </View>
  );
}