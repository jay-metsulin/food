import { useState, useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList } from '@/navigation/types';
import { api } from '@/lib/api';
import ProgressSteps from '@/components/ProgressSteps';
import Button from '@/components/Button';

type Nav = StackNavigationProp<HomeStackParamList, 'OrderTracking'>;
type Route = RouteProp<HomeStackParamList, 'OrderTracking'>;

const STEPS = ['Confirmed', 'Preparing', 'On the way', 'Delivered'];
const STATUS_MAP: Record<string, number> = {
  confirmed: 0,
  preparing: 1,
  out_for_delivery: 2,
  delivered: 3,
};

export default function OrderTrackingScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { orderId } = route.params;

  const [order, setOrder] = useState<any>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiOpacity = useRef(new Animated.Value(0)).current;
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  const fetchOrder = async () => {
    try {
      const res = await api.get<any>(`/api/orders/${orderId}`);
      if (res.success) {
        setOrder(res.data);
        if (res.data.status === 'delivered') {
          if (pollRef.current) clearInterval(pollRef.current);
          setShowConfetti(true);
          Animated.sequence([
            Animated.timing(confettiOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.delay(2000),
            Animated.timing(confettiOpacity, { toValue: 0, duration: 600, useNativeDriver: true }),
          ]).start();
        }
      }
    } catch {
      // keep polling
    }
  };

  useEffect(() => {
    fetchOrder();
    pollRef.current = setInterval(fetchOrder, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [orderId]);

  const currentStep = order ? (STATUS_MAP[order.status] ?? 0) : 0;
  const isDelivered = order?.status === 'delivered';
  const elapsed = order ? (Date.now() - new Date(order.created_at).getTime()) / 60000 : 0;
  const canCancel = elapsed < 2 && !isDelivered;

  return (
    <View className="flex-1 bg-white px-4 pt-12">
      <Text className="text-2xl font-bold text-gray-900 mb-2">Order Tracking</Text>
      <Text className="text-sm text-gray-500 mb-6">Order #{orderId.slice(0, 8)}</Text>

      <ProgressSteps steps={STEPS} currentStep={currentStep} />

      <View className="bg-gray-50 rounded-2xl p-5 mt-6">
        <Text className="text-lg font-bold text-gray-900 mb-1">
          {isDelivered ? '🎉 Delivered!' : STEPS[currentStep]}
        </Text>
        <Text className="text-sm text-gray-500">
          {isDelivered
            ? 'Your order has arrived. Enjoy your meal!'
            : currentStep === 0 ? 'Your order has been confirmed by the restaurant.'
            : currentStep === 1 ? 'The kitchen is preparing your food.'
            : 'Your rider is on the way with your order.'}
        </Text>
      </View>

      {/* Order items */}
      {order?.items && (
        <View className="mt-6">
          <Text className="text-sm font-semibold text-gray-700 mb-2">Items</Text>
          {order.items.map((item: any) => (
            <View key={item.id} className="flex-row justify-between py-2 border-b border-gray-100">
              <Text className="text-gray-900">{item.quantity}× {item.name}</Text>
              <Text className="text-gray-500">${(item.unit_price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
          <View className="flex-row justify-between pt-3">
            <Text className="font-bold text-gray-900">Total</Text>
            <Text className="font-bold text-gray-900">${order.total?.toFixed(2)}</Text>
          </View>
        </View>
      )}

      <View className="mt-auto pb-8 gap-3">
        {isDelivered && (
          <Button label="Rate Order" onPress={() => nav.navigate('Rating', { orderId })} />
        )}
        {canCancel && (
          <Button label="Cancel Order" variant="ghost" onPress={() => nav.goBack()} />
        )}
      </View>

      {/* Confetti overlay */}
      {showConfetti && (
        <Animated.View
          style={{ opacity: confettiOpacity }}
          className="absolute inset-0 items-center justify-center"
          pointerEvents="none"
        >
          <Text className="text-8xl">🎊</Text>
        </Animated.View>
      )}
    </View>
  );
}